const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const projectService = require('../services/project.service');

exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await projectService.list(req.user, req.query);
  success(res, { data: items, meta });
});

exports.getOne = asyncHandler(async (req, res) => {
  const data = await projectService.getById(req.user, req.params.id);
  success(res, { data });
});

exports.create = asyncHandler(async (req, res) => {
  const project = await projectService.create(req.body, req.user);
  created(res, { data: project, message: 'Project created' });
});

exports.update = asyncHandler(async (req, res) => {
  const project = await projectService.update(req.params.id, req.body, req.user);
  success(res, { data: project, message: 'Project updated' });
});

exports.archive = asyncHandler(async (req, res) => {
  await projectService.archive(req.params.id);
  success(res, { message: 'Project archived' });
});

exports.remove = asyncHandler(async (req, res) => {
  await projectService.remove(req.params.id);
  success(res, { message: 'Project deleted' });
});

exports.publicPortfolio = asyncHandler(async (req, res) => {
  const data = await projectService.listPublicPortfolio(req.query);
  success(res, { data });
});

exports.addMilestone = asyncHandler(async (req, res) => {
  const project = await projectService.addMilestone(req.params.id, req.body, req.user);
  created(res, { data: project, message: 'Milestone added' });
});

exports.updateMilestone = asyncHandler(async (req, res) => {
  const project = await projectService.updateMilestone(req.params.id, req.params.milestoneId, req.body, req.user);
  success(res, { data: project, message: 'Milestone updated' });
});

exports.removeMilestone = asyncHandler(async (req, res) => {
  const project = await projectService.removeMilestone(req.params.id, req.params.milestoneId, req.user);
  success(res, { data: project, message: 'Milestone removed' });
});
