const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/client', requireAuth, ctrl.clientOverview);
router.get('/admin', requireAuth, requireRole('admin', 'manager'), ctrl.adminOverview);

module.exports = router;
