const router = require('express').Router();
const ctrl = require('../controllers/file.controller');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', requireAuth, upload.array('files', 5), ctrl.upload);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
