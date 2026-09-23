const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const taskService = require('../services/task.service');

exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await taskService.list(req.user, req.query);
  success(res, { data: items, meta });
});

exports.create = asyncHandler(async (req, res) => {
  const task = await taskService.create(req.body, req.user);
  created(res, { data: task, message: 'Task created' });
});

exports.update = asyncHandler(async (req, res) => {
  const task = await taskService.update(req.params.id, req.body, req.user);
  success(res, { data: task, message: 'Task updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await taskService.remove(req.params.id, req.user);
  success(res, { message: 'Task deleted' });
});
