// filepath: server/src/models/Navigation.js
const mongoose = require('mongoose');

const navItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  target: { type: String, enum: ['_self', '_blank'], default: '_self' },
  icon: { type: String },
  order: { type: Number, required: true, default: 0 },
  isVisible: { type: Boolean, default: true },
  cssClass: { type: String },
  // For sidebar only: where to place the link ('quicklinks' | 'journalinfo')
  sidebarSection: { type: String, enum: ['quicklinks', 'journalinfo'], default: 'journalinfo' },
  children: [{
    label: { type: String, required: true },
    url: { type: String, required: true },
    target: { type: String, enum: ['_self', '_blank'], default: '_self' },
    icon: { type: String },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true }
  }]
});

const navigationSchema = new mongoose.Schema({
  location: {
    type: String,
    enum: ['header', 'footer', 'sidebar'],
    default: 'header'
  },
  items: [navItemSchema],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

navigationSchema.index({ location: 1 });

module.exports = mongoose.model('Navigation', navigationSchema);
