const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const reviewService = require('../services/review.service');

exports.listPublic = asyncHandler(async (req, res) => {
  const data = await reviewService.listPublic(req.query);
  success(res, { data });
});

exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await reviewService.listAdmin(req.user, req.query);
  success(res, { data: items, meta });
});

exports.create = asyncHandler(async (req, res) => {
  const review = await reviewService.create(req.user, req.body);
  created(res, { data: review, message: 'Review submitted for approval' });
});

exports.moderate = asyncHandler(async (req, res) => {
  const review = await reviewService.moderate(req.user, req.params.id, req.body);
  success(res, { data: review, message: `Review ${req.body.status}` });
});

exports.remove = asyncHandler(async (req, res) => {
  await reviewService.remove(req.params.id);
  success(res, { message: 'Review deleted' });
});
