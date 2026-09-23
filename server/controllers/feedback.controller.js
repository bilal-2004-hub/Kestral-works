const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const feedbackService = require('../services/feedback.service');

exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await feedbackService.list(req.user, req.query);
  success(res, { data: items, meta });
});

exports.getOne = asyncHandler(async (req, res) => {
  const data = await feedbackService.getById(req.user, req.params.id);
  success(res, { data });
});

exports.create = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.create(req.user, req.body);
  created(res, { data: feedback, message: 'Feedback sent' });
});

exports.reply = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.reply(req.user, req.params.id, req.body.message);
  success(res, { data: feedback, message: 'Reply sent' });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.updateStatus(req.params.id, req.body.status);
  success(res, { data: feedback, message: 'Feedback updated' });
});
