const router = require('express').Router();
const redirectController = require('../controllers/redirectController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', redirectController.getAll);
router.post('/', protect, authorize('superadmin', 'admin'), redirectController.create);
router.put('/:id', protect, authorize('superadmin', 'admin'), redirectController.update);
router.delete('/:id', protect, authorize('superadmin', 'admin'), redirectController.delete);

module.exports = router;
