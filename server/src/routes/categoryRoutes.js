// filepath: server/src/routes/categoryRoutes.js
const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin', 'editor'));

router.get('/', categoryController.getAllCategories);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', authorize('superadmin', 'admin'), categoryController.deleteCategory);

module.exports = router;
