const router = require('express').Router();
const ctrl = require('../controllers/client.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const rules = require('../validators/interaction.validator');

router.patch('/me', requireAuth, validate(rules.profileRules), ctrl.updateProfile);

router.use(requireAuth, requireRole('admin', 'manager'));
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', validate(rules.clientRules), ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.setActive);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
