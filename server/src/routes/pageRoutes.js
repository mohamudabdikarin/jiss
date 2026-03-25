// filepath: server/src/routes/pageRoutes.js
const router = require('express').Router();
const pageController = require('../controllers/pageController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPageValidator, updatePageValidator } = require('../validators/pageValidator');

router.use(protect);
router.use(authorize('superadmin', 'admin', 'editor'));

router.get('/', pageController.getAllPages);
router.get('/:id', pageController.getPageById);
router.post('/', validate(createPageValidator), pageController.createPage);
router.put('/:id', validate(updatePageValidator), pageController.updatePage);
router.delete('/:id', authorize('superadmin', 'admin'), pageController.deletePage);
router.post('/reorder', pageController.reorderPages);
router.post('/:id/duplicate', pageController.duplicatePage);

module.exports = router;
