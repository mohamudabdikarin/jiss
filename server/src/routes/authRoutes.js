// filepath: server/src/routes/authRoutes.js
const router = require('express').Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { loginValidator, registerValidator, changePasswordValidator, forgotPasswordValidator, resetPasswordValidator } = require('../validators/authValidator');

router.post('/login', authLimiter, validate(loginValidator), authController.login);
router.post('/forgot-password', authLimiter, validate(forgotPasswordValidator), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordValidator), authController.resetPassword);
router.post('/register', protect, authorize('superadmin'), validate(registerValidator), authController.register);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, validate(changePasswordValidator), authController.changePassword);

module.exports = router;
