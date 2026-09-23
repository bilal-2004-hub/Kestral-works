const { body, param } = require('express-validator');
const { FEEDBACK_STATUS, REVIEW_STATUS } = require('../config/constants');

exports.commentRules = [
  body('project').notEmpty().withMessage('Missing project'),
  body('message').trim().notEmpty().withMessage('Write a message').isLength({ max: 4000 }),
  body('task').optional().isString(),
  body('parent').optional().isString(),
];

exports.feedbackRules = [
  body('project').notEmpty().withMessage('Missing project'),
  body('subject').trim().notEmpty().withMessage('Add a subject').isLength({ max: 160 }),
  body('message').trim().notEmpty().withMessage('Describe what you need').isLength({ max: 4000 }),
  body('type').optional().isIn(['change_request', 'bug', 'question', 'approval']),
];

exports.feedbackReplyRules = [
  param('id').notEmpty(),
  body('message').trim().notEmpty().withMessage('Write a reply').isLength({ max: 4000 }),
];

exports.feedbackStatusRules = [param('id').notEmpty(), body('status').isIn(FEEDBACK_STATUS)];

exports.reviewRules = [
  body('project').optional().isString(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Choose a rating from 1 to 5'),
  body('body').trim().notEmpty().withMessage('Write your review').isLength({ max: 2000 }),
  body('title').optional().trim().isLength({ max: 120 }),
];

exports.reviewModerationRules = [
  param('id').notEmpty(),
  body('status').isIn(REVIEW_STATUS).withMessage('Unknown moderation status'),
  body('moderationNote').optional().trim().isLength({ max: 500 }),
];


exports.contactRules = [
  body('name').trim().notEmpty().withMessage('Your name is required').isLength({ max: 80 }),
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('message').trim().isLength({ min: 10, max: 4000 }).withMessage('Tell us a little more (10 characters minimum)'),
  body('phone').optional().trim().isLength({ max: 32 }),
  body('company').optional().trim().isLength({ max: 120 }),
  body('service').optional().trim().isLength({ max: 80 }),
];

exports.clientRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Use at least 8 characters'),
  body('company').optional().trim().isLength({ max: 120 }),
];

exports.profileRules = [
  body('name').optional().trim().isLength({ min: 1, max: 80 }),
  body('company').optional().trim().isLength({ max: 120 }),
  body('phone').optional().trim().isLength({ max: 32 }),
];
