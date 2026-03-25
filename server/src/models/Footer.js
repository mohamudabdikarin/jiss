// filepath: server/src/models/Footer.js
const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema({
  content: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Footer', footerSchema);
