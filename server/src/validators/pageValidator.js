// filepath: server/src/validators/pageValidator.js
const { body } = require('express-validator');

const createPageValidator = [
  body('title').trim().notEmpty().withMessage('Page title is required').isLength({ max: 200 }).withMessage('Page title must be 200 characters or less'),
  body('template').optional().isIn(['default', 'articles', 'preprint', 'published', 'contact', 'custom']).withMessage('Invalid page template'),
  body('status').optional().isIn(['published', 'draft', 'archived']).withMessage('Status must be published, draft, or archived')
];

const updatePageValidator = [
  body('title').optional().trim().notEmpty().withMessage('Page title cannot be empty').isLength({ max: 200 }).withMessage('Page title must be 200 characters or less'),
  body('template').optional().isIn(['default', 'articles', 'preprint', 'published', 'contact', 'custom']).withMessage('Invalid page template'),
  body('status').optional().isIn(['published', 'draft', 'archived']).withMessage('Status must be published, draft, or archived')
];

module.exports = { createPageValidator, updatePageValidator };
