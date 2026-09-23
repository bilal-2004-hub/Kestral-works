const router = require('express').Router();
const ctrl = require('../controllers/project.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const rules = require('../validators/project.validator');

const staffOnly = [requireAuth, requireRole('admin', 'manager')];

router.get('/public', ctrl.publicPortfolio); // portfolio grid on the website
router.get('/', requireAuth, ctrl.list);
router.get('/:id', requireAuth, validate(rules.idRule), ctrl.getOne);
router.post('/', staffOnly, validate(rules.createRules), ctrl.create);
router.put('/:id', staffOnly, validate(rules.updateRules), ctrl.update);
router.patch('/:id/archive', staffOnly, validate(rules.idRule), ctrl.archive);
router.delete('/:id', requireAuth, requireRole('admin'), validate(rules.idRule), ctrl.remove);
router.post('/:id/milestones', staffOnly, validate(rules.idRule), ctrl.addMilestone);
router.put('/:id/milestones/:milestoneId', staffOnly, validate(rules.idRule), ctrl.updateMilestone);
router.delete('/:id/milestones/:milestoneId', staffOnly, validate(rules.idRule), ctrl.removeMilestone);

module.exports = router;
