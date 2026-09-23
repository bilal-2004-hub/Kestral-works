const { body, param } = require('express-validator');
const { PROJECT_STATUS } = require('../config/constants');

exports.idRule = [param('id').trim().notEmpty().withMessage('That project id is not valid')];

exports.createRules = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 140 }),
  body('description').trim().notEmpty().withMessage('Add a short description').isLength({ max: 4000 }),
  body('client').trim().notEmpty().withMessage('Select a client'),
  body('status').optional().isIn(PROJECT_STATUS),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('technologies').optional().isArray(),
  body('dueDate').optional().isISO8601().toDate(),
  body('isPublic').optional().isBoolean(),
];

exports.updateRules = [
  ...exports.idRule,
  body('name').optional().trim().isLength({ min: 1, max: 140 }),
  body('description').optional().trim().isLength({ max: 4000 }),
  body('status').optional().isIn(PROJECT_STATUS),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('dueDate').optional().isISO8601().toDate(),
  body('client').optional().trim().notEmpty(),
];
