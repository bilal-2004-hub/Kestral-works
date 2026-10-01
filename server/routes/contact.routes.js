const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');
const validate = require('../middleware/validate');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimit');
const { contactRules } = require('../validators/interaction.validator');

router.post('/', optionalAuth, contactLimiter, validate(contactRules), ctrl.create);

router.use(requireAuth, requireRole('admin', 'manager'));
router.get('/', ctrl.list);
router.patch('/:id/status', ctrl.updateStatus);
router.delete('/:id', ctrl.remove);

module.exports = router;
