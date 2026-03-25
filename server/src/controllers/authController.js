// filepath: server/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { env } = require('../config/env');
const { getRefreshTokenCookieOptions, getClearRefreshCookieOptions } = require('../utils/authCookies');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const auditService = require('../services/auditService');
const { sendPasswordResetCode } = require('../services/emailService');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return errorResponse(res, 'Email already registered', 400);

    const user = await User.create({ email, password, name, role: role || 'admin' });
    auditService.log(req.user._id, 'create', 'User', user._id, `Created user: ${email}`, null, req);

    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;
    return successResponse(res, userData, 'User registered successfully', 201);
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) return errorResponse(res, 'Invalid email or password', 401);

    if (user.isLocked()) {
      return errorResponse(res, 'Account is locked. Try again later.', 423);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) return errorResponse(res, 'Account has been deactivated', 401);

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    auditService.log(user._id, 'login', 'User', user._id, `User logged in: ${email}`, null, req);

    const userData = user.toObject();
    delete userData.password;
    delete userData.refreshToken;

    return successResponse(res, { accessToken, user: userData }, 'Login successful');
  } catch (error) { next(error); }
};

exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.clearCookie('refreshToken', getClearRefreshCookieOptions());
    auditService.log(req.user._id, 'logout', 'User', req.user._id, 'User logged out', null, req);
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) { next(error); }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return errorResponse(res, 'No refresh token provided', 401);

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());

    return successResponse(res, { accessToken }, 'Token refreshed');
  } catch (error) {
    return errorResponse(res, 'Invalid refresh token', 401);
  }
};

exports.getMe = async (req, res) => {
  return successResponse(res, req.user, 'User profile');
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return successResponse(res, user, 'Profile updated');
  } catch (error) { next(error); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+passwordResetCode +passwordResetCodeExpires');
    if (!user) {
      return successResponse(res, { message: 'If that email exists, we sent a reset code.' }, 'Check your email');
    }

    const code = crypto.randomInt(100000, 999999).toString();
    user.passwordResetCode = code;
    user.passwordResetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetCode(email, code);
    return successResponse(res, { message: 'If that email exists, we sent a reset code.' }, 'Check your email');
  } catch (error) { next(error); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+password +passwordResetCode +passwordResetCodeExpires');
    if (!user || !user.passwordResetCode || user.passwordResetCode !== code) {
      return errorResponse(res, 'Invalid or expired reset code', 400);
    }
    if (user.passwordResetCodeExpires < new Date()) {
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return errorResponse(res, 'Reset code has expired. Please request a new one.', 400);
    }

    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    user.refreshToken = null;
    await user.save();

    return successResponse(res, { message: 'Password reset successfully. You can now log in.' }, 'Password reset successfully');
  } catch (error) { next(error); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return errorResponse(res, 'Current password is incorrect', 400);

    user.password = newPassword;
    user.refreshToken = null;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

    auditService.log(user._id, 'update', 'User', user._id, 'Password changed', null, req);
    return successResponse(res, { accessToken }, 'Password changed successfully');
  } catch (error) { next(error); }
};
