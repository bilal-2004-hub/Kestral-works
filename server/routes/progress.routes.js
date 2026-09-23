const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ProgressHistory = require('../models/ProgressHistory');
const progressService = require('../services/progressService');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

// Get progress history for a project
router.get(
  '/:projectId/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const isStaff = req.user.role === 'admin' || req.user.role === 'manager';
    const project = await Project.findOne(
      isStaff ? { _id: projectId } : { _id: projectId, client: req.user._id }
    ).select('_id');

    if (!project) throw ApiError.notFound('Project not found');

    const history = await ProgressHistory.find({ project: projectId })
      .populate('changedBy', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    success(res, { data: history });
  })
);

// Recalculate progress manually (staff only)
router.post(
  '/:projectId/recalculate',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const project = await progressService.recalculateAndSave(
      projectId,
      req.user._id,
      'Manual recalculation requested'
    );
    if (!project) throw ApiError.notFound('Project not found');
    success(res, { data: project, message: 'Progress recalculated' });
  })
);

module.exports = router;
