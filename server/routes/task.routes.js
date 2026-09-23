const router = require('express').Router();
const ctrl = require('../controllers/task.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const rules = require('../validators/task.validator');

const staffOnly = [requireAuth, requireRole('admin', 'manager')];

router.get('/', requireAuth, ctrl.list);
router.post('/', staffOnly, validate(rules.createRules), ctrl.create);
router.put('/:id', staffOnly, validate(rules.updateRules), ctrl.update);
router.delete('/:id', staffOnly, validate(rules.idRule), ctrl.remove);

module.exports = router;
