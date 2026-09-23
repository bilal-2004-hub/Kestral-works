const router = require('express').Router();
const ctrl = require('../controllers/feedback.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const rules = require('../validators/interaction.validator');

router.get('/', requireAuth, ctrl.list);
router.get('/:id', requireAuth, ctrl.getOne);
router.post('/', requireAuth, requireRole('client'), validate(rules.feedbackRules), ctrl.create);
router.post('/:id/replies', requireAuth, validate(rules.feedbackReplyRules), ctrl.reply);
router.patch('/:id/status', requireAuth, requireRole('admin', 'manager'), validate(rules.feedbackStatusRules), ctrl.updateStatus);

module.exports = router;
