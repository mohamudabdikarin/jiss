// filepath: server/src/validators/authValidator.js
const { body } = require('express-validator');

const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidator = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['admin', 'editor']).withMessage('Role must be admin or editor')
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail()
];

const resetPasswordValidator = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('code').notEmpty().withMessage('Reset code is required').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
];

module.exports = { loginValidator, registerValidator, changePasswordValidator, forgotPasswordValidator, resetPasswordValidator };
