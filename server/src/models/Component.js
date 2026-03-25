// filepath: server/src/models/Component.js
const mongoose = require('mongoose');
const slugifyLib = require('slugify');

const componentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['announcement_bar', 'cta_block', 'sidebar_widget', 'popup', 'banner']
  },
  content: { type: mongoose.Schema.Types.Mixed },
  isGlobal: { type: Boolean, default: false },
  pages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Page' }],
  isActive: { type: Boolean, default: true },
  displayConditions: {
    startDate: { type: Date },
    endDate: { type: Date },
    showOnMobile: { type: Boolean, default: true },
    showOnDesktop: { type: Boolean, default: true }
  },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

componentSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugifyLib(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Component', componentSchema);
