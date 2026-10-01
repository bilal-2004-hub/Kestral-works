const projectRequestService = require('../services/projectRequest.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

/**
 * POST /api/project-requests
 * Public endpoint — no auth required.
 * Visitors submit a new project request.
 */
exports.submitRequest = asyncHandler(async (req, res) => {
  const result = await projectRequestService.submitRequest(req.body);
  success(res, {
    data: result,
    message: 'Your project request has been submitted! Our team will review it shortly.',
    statusCode: 201,
  });
});

/**
 * GET /api/project-requests/available
 * Client-only: returns projects matching the client's professionalField.
 */
exports.getAvailable = asyncHandler(async (req, res) => {
  const result = await projectRequestService.getAvailableForClient(req.user);
  success(res, { data: result });
});

/**
 * POST /api/project-requests/:id/claim
 * Client-only: atomically claims a project.
 */
exports.claimProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw ApiError.badRequest('Project request ID is required');

  const result = await projectRequestService.claimProject(id, req.user);
  success(res, {
    data: result,
    message: 'Project claimed successfully! Your workspace has been created.',
  });
});

/**
 * GET /api/project-requests
 * Admin-only: list all project requests.
 */
exports.adminList = asyncHandler(async (req, res) => {
  const result = await projectRequestService.adminList(req.query);
  success(res, { data: result });
});

/**
 * GET /api/project-requests/:id
 * Admin-only: get single project request.
 */
exports.adminGetById = asyncHandler(async (req, res) => {
  const result = await projectRequestService.adminGetById(req.params.id);
  success(res, { data: result });
});

/**
 * PATCH /api/project-requests/:id
 * Admin-only: update a project request.
 */
exports.adminUpdate = asyncHandler(async (req, res) => {
  const result = await projectRequestService.adminUpdate(req.params.id, req.body);
  success(res, { data: result, message: 'Project request updated' });
});
