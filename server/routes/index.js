const router = require('express').Router();
const { SERVICES, PROFESSIONAL_FIELDS } = require('../config/constants');

router.get('/', (_req, res) => res.json({ success: true, message: 'Kestral Works API is online', version: '1.0.0' }));
router.get('/favicon.ico', (_req, res) => res.status(204).end());
router.get('/health', (_req, res) => res.json({ success: true, message: 'API is running', uptime: process.uptime() }));
router.get('/services', (_req, res) => res.json({ success: true, data: SERVICES }));
router.get('/professional-fields', (_req, res) => res.json({ success: true, data: PROFESSIONAL_FIELDS }));

router.use('/auth', require('./auth.routes'));
router.use('/clients', require('./client.routes'));
router.use('/projects', require('./project.routes'));
router.use('/tasks', require('./task.routes'));
router.use('/comments', require('./comment.routes'));
router.use('/feedback', require('./feedback.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/contact', require('./contact.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/files', require('./file.routes'));
router.use('/progress', require('./progress.routes'));
router.use('/project-requests', require('./projectRequest.routes'));

module.exports = router;
