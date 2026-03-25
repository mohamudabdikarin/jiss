// filepath: server/src/routes/publicRoutes.js
const router = require('express').Router();
const pageController = require('../controllers/pageController');
const navigationController = require('../controllers/navigationController');
const footerController = require('../controllers/footerController');
const settingsController = require('../controllers/settingsController');
const articleController = require('../controllers/articleController');
const categoryController = require('../controllers/categoryController');
const seoController = require('../controllers/seoController');
const backupController = require('../controllers/backupController');
const componentController = require('../controllers/componentController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// ===== PUBLIC ROUTES (no auth) =====

// Components (announcement bar, etc.)
router.get('/components', cacheMiddleware(300), componentController.getActiveComponents);

// Pages
router.get('/home', cacheMiddleware(300), pageController.getHomePage);
router.get('/pages/:slug', cacheMiddleware(300), pageController.getPageBySlug);

// Navigation & Footer (short cache so admin changes appear quickly)
router.get('/navigation/:location', cacheMiddleware(30), navigationController.getNavigationByLocation);
router.get('/footer', cacheMiddleware(30), footerController.getFooter);

// Settings
router.get('/settings', cacheMiddleware(600), settingsController.getSettings);

// Articles (order matters: specific routes before :slug)
router.get('/articles', cacheMiddleware(120), articleController.getAllArticles);
router.get('/articles/volumes', cacheMiddleware(300), articleController.getVolumes);
router.get('/articles/search', cacheMiddleware(60), articleController.searchArticles);
router.get('/articles/featured', cacheMiddleware(300), articleController.getFeaturedArticles);
router.get('/articles/:slug/related', cacheMiddleware(300), articleController.getRelatedArticles);
router.get('/articles/:slug', cacheMiddleware(120), articleController.getArticleBySlug);
router.post('/articles/:id/download', articleController.trackDownload);

// Redirects (for client-side redirect check)
router.get('/redirects', cacheMiddleware(300), async (req, res) => {
  const Redirect = require('../models/Redirect');
  const items = await Redirect.find({ isActive: true }).select('fromPath toPath statusCode').lean();
  return res.json({ success: true, data: items });
});

// Categories
router.get('/categories', cacheMiddleware(600), categoryController.getAllCategories);
router.get('/categories/:slug', cacheMiddleware(300), categoryController.getCategoryBySlug);

// SEO
router.get('/sitemap.xml', cacheMiddleware(3600), seoController.getSitemap);
router.get('/robots.txt', cacheMiddleware(3600), seoController.getRobotsTxt);

// ===== BACKUP ROUTES (protected, superadmin only) =====
router.post('/backups', protect, authorize('superadmin'), backupController.createBackup);
router.get('/backups', protect, authorize('superadmin'), backupController.listBackups);
router.post('/backups/restore', protect, authorize('superadmin'), backupController.restoreBackup);
router.delete('/backups', protect, authorize('superadmin'), backupController.deleteBackup);
router.get('/backups/download', protect, authorize('superadmin'), backupController.downloadBackup);

module.exports = router;
