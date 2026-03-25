// filepath: server/src/routes/sectionRoutes.js
const router = require('express').Router();
const sectionController = require('../controllers/sectionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin', 'editor'));

router.get('/page/:pageId', sectionController.getSectionsByPage);
router.post('/', sectionController.createSection);
router.put('/:id', sectionController.updateSection);
router.delete('/:id', sectionController.deleteSection);
router.post('/reorder', sectionController.reorderSections);
router.patch('/:id/toggle-visibility', sectionController.toggleSectionVisibility);
router.post('/:id/duplicate', sectionController.duplicateSection);

module.exports = router;
