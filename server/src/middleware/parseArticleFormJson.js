/**
 * Multer leaves multipart text fields as strings. The admin sends authors/keywords/relatedArticles
 * as JSON.stringify(...) — express-validator runs before the controller, so we must parse here.
 */
function parseArticleMultipartJson(req, res, next) {
  const keys = ['authors', 'keywords', 'relatedArticles'];
  for (const key of keys) {
    const v = req.body[key];
    if (v == null || v === '') continue;
    if (typeof v === 'string') {
      try {
        req.body[key] = JSON.parse(v);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: key, message: `Invalid JSON for ${key}` }]
        });
      }
    }
  }
  next();
}

module.exports = parseArticleMultipartJson;
