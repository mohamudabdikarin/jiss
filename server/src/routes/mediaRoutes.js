// filepath: server/src/routes/mediaRoutes.js
const router = require('express').Router();
const mediaController = require('../controllers/mediaController');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { updateMediaValidator } = require('../validators/mediaValidator');

router.use(protect);
router.use(authorize('superadmin', 'admin', 'editor'));

router.get('/', mediaController.getAllMedia);
router.get('/folders', mediaController.getFolders);
router.post('/upload', uploadLimiter, uploadSingle, mediaController.uploadMedia);
router.post('/upload-multiple', uploadLimiter, uploadMultiple, mediaController.uploadMultipleMedia);
router.put('/:id', validate(updateMediaValidator), mediaController.updateMedia);
router.delete('/:id', mediaController.deleteMedia);
router.post('/bulk-delete', authorize('superadmin', 'admin'), mediaController.bulkDeleteMedia);

module.exports = router;
