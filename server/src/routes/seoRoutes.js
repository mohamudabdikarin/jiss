// filepath: server/src/routes/seoRoutes.js
const router = require('express').Router();
const seoController = require('../controllers/seoController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.get('/overview', seoController.getSEOOverview);
router.put('/page/:id', seoController.updatePageSEO);

module.exports = router;
