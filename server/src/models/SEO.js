// filepath: server/src/models/SEO.js
// SEO is handled as embedded subdocument in Page.js
// This file re-exports for convenience if needed separately

const mongoose = require('mongoose');

const seoSchema = new mongoose.Schema({
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: [{ type: String }],
  ogImage: { type: String },
  canonicalUrl: { type: String },
  noIndex: { type: Boolean, default: false }
}, { _id: false });

module.exports = seoSchema;
