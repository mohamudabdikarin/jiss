// filepath: server/src/validators/articleValidator.js
const { body } = require('express-validator');

const createArticleValidator = [
  body('title').trim().notEmpty().withMessage('Article title is required'),
  body('type').isIn(['preprint', 'published']).withMessage('Article type must be either preprint or published'),
  body('abstract').trim().notEmpty().withMessage('Abstract is required'),
  body('authors').isArray({ min: 1 }).withMessage('At least one author is required'),
  body('authors.*.name').notEmpty().withMessage('Author name is required'),
  // Conditional validation for published articles
  body('doi').if(body('type').equals('published')).trim().notEmpty().withMessage('DOI is required for published articles'),
  body('volume').if(body('type').equals('published')).trim().notEmpty().withMessage('Volume is required for published articles'),
  body('issue').if(body('type').equals('published')).trim().notEmpty().withMessage('Issue is required for published articles'),
  body('pages').if(body('type').equals('published')).trim().notEmpty().withMessage('Pages are required for published articles')
];

const updateArticleValidator = [
  body('title').optional().trim().notEmpty().withMessage('Article title cannot be empty'),
  body('type').optional().isIn(['preprint', 'published']).withMessage('Article type must be either preprint or published'),
  body('abstract').optional().trim().notEmpty().withMessage('Abstract cannot be empty'),
  body('authors').optional().isArray({ min: 1 }).withMessage('At least one author is required'),
  body('authors.*.name').optional().notEmpty().withMessage('Author name is required'),
  // Conditional validation for published articles
  body('doi').if(body('type').equals('published')).trim().notEmpty().withMessage('DOI is required for published articles'),
  body('volume').if(body('type').equals('published')).trim().notEmpty().withMessage('Volume is required for published articles'),
  body('issue').if(body('type').equals('published')).trim().notEmpty().withMessage('Issue is required for published articles'),
  body('pages').if(body('type').equals('published')).trim().notEmpty().withMessage('Pages are required for published articles')
];

module.exports = { createArticleValidator, updateArticleValidator };
