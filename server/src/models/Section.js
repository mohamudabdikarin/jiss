// filepath: server/src/models/Section.js
const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  page: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: [true, 'Page reference is required']
  },
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Section type is required'],
    enum: [
      'hero', 'text', 'richtext', 'image', 'gallery', 'cards',
      'cta', 'accordion', 'banner', 'contact', 'video',
      'stats', 'testimonials', 'team', 'timeline', 'custom_html', 'buttons',
      'page_blocks', 'tag_badges'
    ]
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Per-block translations: { blockId: { en: {...}, ar: {...}, ms: {...}, zh: {...} } }
  blockTranslations: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isVisible: { type: Boolean, default: true },
  cssClasses: { type: String },
  backgroundColor: { type: String },
  paddingTop: { type: String },
  paddingBottom: { type: String },
  animation: {
    type: String,
    enum: ['none', 'fadeIn', 'slideUp', 'slideLeft', 'slideRight'],
    default: 'none'
  }
}, {
  timestamps: true
});

// Compound indexes
sectionSchema.index({ page: 1, order: 1 });
sectionSchema.index({ type: 1 });
sectionSchema.index({ isVisible: 1 });

module.exports = mongoose.model('Section', sectionSchema);
