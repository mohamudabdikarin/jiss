// filepath: server/src/models/Page.js
const mongoose = require('mongoose');
const slugifyLib = require('slugify');

const seoSubSchema = new mongoose.Schema({
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: [{ type: String }],
  ogImage: { type: String },
  canonicalUrl: { type: String },
  noIndex: { type: Boolean, default: false }
}, { _id: false });

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: { type: String },
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'draft'
  },
  isHomePage: { type: Boolean, default: false },
  template: {
    type: String,
    enum: ['default', 'articles', 'preprint', 'published', 'contact', 'custom'],
    default: 'default'
  },
  sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  seo: { type: seoSubSchema, default: () => ({}) },
  customCSS: { type: String },
  customJS: { type: String },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: { type: Date },
  scheduledPublishDate: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
pageSchema.index({ status: 1 });
pageSchema.index({ isHomePage: 1 });
pageSchema.index({ order: 1 });

// Virtual: fullUrl
pageSchema.virtual('fullUrl').get(function() {
  return this.isHomePage ? '/' : `/${this.slug}`;
});

// Pre-save: auto-generate slug
pageSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.isModified('slug')) {
    this.slug = slugifyLib(this.title, { lower: true, strict: true });
    // Check for duplicates
    const existing = await mongoose.model('Page').findOne({ slug: this.slug, _id: { $ne: this._id } });
    if (existing) {
      this.slug = `${this.slug}-${Date.now().toString(36)}`;
    }
  }
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Page', pageSchema);
