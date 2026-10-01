const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/projectRequest.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

// ─── Public Routes ────────────────────────────────────────────────────────────
// POST /api/project-requests — visitor submits a project request
router.post('/', ctrl.submitRequest);

// ─── Client Routes ────────────────────────────────────────────────────────────
// GET  /api/project-requests/available — projects matching the client's field
router.get('/available', requireAuth, requireRole('client'), ctrl.getAvailable);

// POST /api/project-requests/:id/claim — atomically claim a project
router.post('/:id/claim', requireAuth, requireRole('client'), ctrl.claimProject);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
// GET  /api/project-requests — admin: all requests
router.get('/', requireAuth, requireRole('admin', 'manager'), ctrl.adminList);

// GET  /api/project-requests/:id — admin: single request
router.get('/:id', requireAuth, requireRole('admin', 'manager'), ctrl.adminGetById);

// PATCH /api/project-requests/:id — admin: update status/notes
router.patch('/:id', requireAuth, requireRole('admin', 'manager'), ctrl.adminUpdate);

module.exports = router;
