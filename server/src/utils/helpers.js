// filepath: server/src/utils/helpers.js
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const generateUniqueFilename = (originalName) => {
  const ext = originalName.split('.').pop();
  const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  return `${Date.now()}-${uuidv4().slice(0, 8)}-${sanitized}`;
};

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

const extractTextFromHTML = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const omitFields = (obj, fields) => {
  const result = { ...obj };
  fields.forEach(f => delete result[f]);
  return result;
};

const calculateReadingTime = (text) => {
  if (!text) return 1;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

module.exports = {
  generateUniqueFilename,
  sanitizeFilename,
  formatFileSize,
  extractTextFromHTML,
  isValidObjectId,
  omitFields,
  calculateReadingTime
};
