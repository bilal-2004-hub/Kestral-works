const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboard.service');

exports.clientOverview = asyncHandler(async (req, res) =>
  success(res, { data: await dashboardService.clientStats(req.user) }));

exports.adminOverview = asyncHandler(async (_req, res) =>
  success(res, { data: await dashboardService.adminStats() }));
