// filepath: server/src/routes/articleRoutes.js
const router = require('express').Router();
const articleController = require('../controllers/articleController');
const { protect, authorize } = require('../middleware/auth');
const { uploadPDF } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { createArticleValidator, updateArticleValidator } = require('../validators/articleValidator');

router.use(protect);
router.use(authorize('superadmin', 'admin', 'editor'));

router.get('/', articleController.getAllArticles);
router.get('/:id', articleController.getArticleById);
router.post('/', uploadPDF, validate(createArticleValidator), articleController.createArticle);
router.put('/:id', uploadPDF, validate(updateArticleValidator), articleController.updateArticle);
router.delete('/:id', authorize('superadmin', 'admin'), articleController.deleteArticle);
router.post('/:id/duplicate', articleController.duplicateArticle);
router.post('/bulk-delete', authorize('superadmin', 'admin'), articleController.bulkDeleteArticles);
router.post('/bulk-status', articleController.bulkUpdateStatus);

module.exports = router;
