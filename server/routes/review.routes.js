const router = require('express').Router();
const ctrl = require('../controllers/review.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const rules = require('../validators/interaction.validator');

router.get('/public', ctrl.listPublic); // approved reviews only
router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireRole('client'), validate(rules.reviewRules), ctrl.create);
router.patch('/:id/moderate', requireAuth, requireRole('admin'), validate(rules.reviewModerationRules), ctrl.moderate);
router.delete('/:id', requireAuth, requireRole('admin'), ctrl.remove);

module.exports = router;
