// filepath: server/src/validators/mediaValidator.js
const { body } = require('express-validator');

const updateMediaValidator = [
  body('alt').optional().trim(),
  body('caption').optional().trim(),
  body('folder').optional().trim(),
  body('tags').optional().isArray()
];

module.exports = { updateMediaValidator };
