// filepath: server/src/routes/navigationRoutes.js
const router = require('express').Router();
const navigationController = require('../controllers/navigationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/', navigationController.getNavigation);
router.post('/', navigationController.createNavigation);
router.put('/:id', navigationController.updateNavigation);
router.delete('/:id', navigationController.deleteNavigation);

module.exports = router;
