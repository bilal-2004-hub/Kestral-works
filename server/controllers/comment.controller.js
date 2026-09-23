const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const commentService = require('../services/comment.service');

exports.list = asyncHandler(async (req, res) => {
  const data = await commentService.list(req.user, req.params.projectId);
  success(res, { data });
});

exports.create = asyncHandler(async (req, res) => {
  const comment = await commentService.create(req.user, req.body);
  created(res, { data: comment, message: 'Comment posted' });
});

exports.resolve = asyncHandler(async (req, res) => {
  const comment = await commentService.resolve(req.user, req.params.id, req.body.isResolved !== false);
  success(res, { data: comment, message: 'Comment updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await commentService.remove(req.user, req.params.id);
  success(res, { message: 'Comment deleted' });
});
