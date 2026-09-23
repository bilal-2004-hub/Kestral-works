const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const rules = require('../validators/auth.validator');

router.post('/register', authLimiter, validate(rules.registerRules), ctrl.register);
router.post('/login', authLimiter, validate(rules.loginRules), ctrl.login);
router.post('/record-login', requireAuth, ctrl.recordLogin);
router.get('/client-logins', requireAuth, requireRole('admin', 'manager'), ctrl.getClientLogins);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.post('/forgot-password', authLimiter, validate(rules.forgotRules), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(rules.resetRules), ctrl.resetPassword);
router.get('/me', requireAuth, ctrl.me);
router.patch('/password', requireAuth, validate(rules.changePasswordRules), ctrl.changePassword);

module.exports = router;
