const { body, param } = require('express-validator');
const { TASK_STATUS, TASK_PRIORITY } = require('../config/constants');

exports.idRule = [param('id').isMongoId().withMessage('That task id is not valid')];

exports.createRules = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 160 }),
  body('project').isMongoId().withMessage('Select a project'),
  body('description').optional().trim().isLength({ max: 4000 }),
  body('status').optional().isIn(TASK_STATUS),
  body('priority').optional().isIn(TASK_PRIORITY),
  body('dueDate').optional().isISO8601().toDate(),
  body('assignee').optional().isMongoId(),
];

exports.updateRules = [
  ...exports.idRule,
  body('title').optional().trim().isLength({ min: 1, max: 160 }),
  body('status').optional().isIn(TASK_STATUS),
  body('priority').optional().isIn(TASK_PRIORITY),
  body('dueDate').optional().isISO8601().toDate(),
];
