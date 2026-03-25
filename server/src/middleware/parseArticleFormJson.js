/**
 * Multer leaves multipart text fields as strings. The admin sends authors/keywords/relatedArticles
 * (and optional supplementaryFiles) as JSON.stringify(...) — validation runs after this middleware.
 */
function parseArticleMultipartJson(req, res, next) {
  const keys = ['authors', 'keywords', 'relatedArticles', 'supplementaryFiles'];
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
