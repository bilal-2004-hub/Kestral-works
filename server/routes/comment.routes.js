const router = require('express').Router();
const ctrl = require('../controllers/comment.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { commentRules } = require('../validators/interaction.validator');

router.get('/project/:projectId', requireAuth, ctrl.list);
router.post('/', requireAuth, validate(commentRules), ctrl.create);
router.patch('/:id/resolve', requireAuth, requireRole('admin', 'manager'), ctrl.resolve);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
