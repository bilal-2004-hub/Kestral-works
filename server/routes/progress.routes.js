const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const progressService = require('../services/progressService');
const firestoreService = require('../services/firestore.service');
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
    const project = await firestoreService.getById('projects', projectId);

    if (!project || project.isArchived) throw ApiError.notFound('Project not found');

    const clientMatch =
      project.client === req.user._id ||
      project.client === req.user.uid ||
      project.client === req.user.id;

    if (!isStaff && !clientMatch) {
      throw ApiError.forbidden('Not authorised for this project');
    }

    const history = await firestoreService.find('progressHistory', (ref) =>
      ref.where('project', '==', projectId)
    );
    history.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const limited = history.slice(0, 50);
    for (const item of limited) {
      if (item.changedBy && typeof item.changedBy === 'string') {
        const u = await firestoreService.getById('users', item.changedBy);
        if (u) {
          item.changedBy = { name: u.name, avatar: u.avatar, role: u.role };
        }
      }
    }

    success(res, { data: limited });
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
