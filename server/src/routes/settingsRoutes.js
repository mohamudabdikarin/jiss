// filepath: server/src/routes/settingsRoutes.js
const router = require('express').Router();
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/', settingsController.getSettings);
router.get('/translation-sources', settingsController.getTranslationSources);
router.put('/', settingsController.updateSettings);
router.put('/logo', uploadSingle, settingsController.uploadLogo);
router.delete('/logo', settingsController.removeLogo);

module.exports = router;
