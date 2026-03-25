// filepath: server/src/middleware/sanitize.js

/**
 * Sanitize request body, query, and params
 * Strips HTML tags from strings (except designated rich text fields)
 */
const richTextFields = ['html', 'body', 'content', 'customCSS', 'customJS', 'customHeaderCode', 'customFooterCode', 'copyrightText'];

const stripTags = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

const sanitizeValue = (value, key) => {
  if (typeof value === 'string') {
    // Don't strip HTML from rich text fields
    if (richTextFields.includes(key)) {
      return value.trim();
    }
    return stripTags(value);
  }
  if (Array.isArray(value)) {
    return value.map((item, idx) => sanitizeValue(item, key));
  }
  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value, key);
  }
  return sanitized;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = sanitizeMiddleware;
