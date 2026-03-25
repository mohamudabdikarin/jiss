// filepath: server/src/validators/pageValidator.js
const { body } = require('express-validator');

const createPageValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title max 200 chars'),
  body('template').optional().isIn(['default', 'articles', 'preprint', 'published', 'contact', 'custom']),
  body('status').optional().isIn(['published', 'draft', 'archived'])
];

const updatePageValidator = [
  body('title').optional().trim().isLength({ max: 200 }),
  body('template').optional().isIn(['default', 'articles', 'preprint', 'published', 'contact', 'custom']),
  body('status').optional().isIn(['published', 'draft', 'archived'])
];

module.exports = { createPageValidator, updatePageValidator };
