// filepath: server/src/validators/articleValidator.js
const { body } = require('express-validator');

const createArticleValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['preprint', 'published']).withMessage('Type must be preprint or published'),
  body('abstract').trim().notEmpty().withMessage('Abstract is required'),
  body('authors').isArray({ min: 1 }).withMessage('At least one author is required'),
  body('authors.*.name').notEmpty().withMessage('Author name is required')
];

const updateArticleValidator = [
  body('title').optional().trim().notEmpty(),
  body('type').optional().isIn(['preprint', 'published']),
  body('abstract').optional().trim().notEmpty(),
  body('authors').optional().isArray({ min: 1 }),
  body('authors.*.name').optional().notEmpty()
];

module.exports = { createArticleValidator, updateArticleValidator };
