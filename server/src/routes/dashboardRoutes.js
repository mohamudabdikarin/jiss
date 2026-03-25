// filepath: server/src/routes/dashboardRoutes.js
const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const globalSearchController = require('../controllers/globalSearchController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin', 'editor'));

router.get('/stats', dashboardController.getStats);
router.get('/audit-logs', dashboardController.getAuditLogs);
router.get('/search', globalSearchController.search);

module.exports = router;
