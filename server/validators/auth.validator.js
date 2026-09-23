const { body } = require('express-validator');

const password = (field = 'password') =>
  body(field)
    .isLength({ min: 8 }).withMessage('Use at least 8 characters')
    .matches(/[a-z]/).withMessage('Include a lowercase letter')
    .matches(/[A-Z]/).withMessage('Include an uppercase letter')
    .matches(/\d/).withMessage('Include a number');

exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  password(),
  body('company').optional().trim().isLength({ max: 120 }),
  body('phone').optional().trim().isLength({ max: 32 }),
];

exports.loginRules = [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Enter your password'),
];

exports.forgotRules = [body('email').isEmail().withMessage('Enter a valid email').normalizeEmail()];

exports.resetRules = [
  body('token').notEmpty().withMessage('Reset token is missing'),
  body('email').isEmail().normalizeEmail(),
  password(),
];

exports.changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Enter your current password'),
  password('newPassword'),
];
