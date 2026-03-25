// filepath: server/src/routes/footerRoutes.js
const router = require('express').Router();
const footerController = require('../controllers/footerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/', footerController.getAllFooters);
router.post('/', footerController.createFooter);
router.put('/:id', footerController.updateFooter);
router.delete('/:id', footerController.deleteFooter);

module.exports = router;
