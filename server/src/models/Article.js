// filepath: server/src/models/Article.js
const mongoose = require('mongoose');
const slugifyLib = require('slugify');

const authorSubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  affiliation: { type: String },
  email: { type: String },
  orcid: { type: String },
  isCorresponding: { type: Boolean, default: false }
}, { _id: false });

const supplementaryFileSchema = new mongoose.Schema({
  name: { type: String },
  url: { type: String },
  type: { type: String },
  size: { type: Number }
}, { _id: false });

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: [true, 'Article type is required'],
    enum: ['preprint', 'published'],
    index: true
  },
  authors: {
    type: [authorSubSchema],
    validate: [arr => arr.length > 0, 'At least one author is required']
  },
  abstract: {
    type: String,
    required: [true, 'Abstract is required']
  },
  keywords: [{ type: String }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  doi: { type: String },
  volume: { type: String },
  issue: { type: String },
  pages: { type: String },
  publicationDate: { type: Date },
  submissionDate: { type: Date },
  acceptedDate: { type: Date },
  pdfUrl: { type: String },
  pdfFileName: { type: String },
  pdfFileSize: { type: Number },
  supplementaryFiles: [supplementaryFileSchema],
  thumbnail: { type: String },
  citations: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isFeatured: { type: Boolean, default: false },
  language: { type: String, default: 'en' },
  license: { type: String },
  fundingInfo: { type: String },
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  scheduledPublishDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
articleSchema.index({ type: 1, status: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ keywords: 1 });
articleSchema.index({ publicationDate: -1 });
articleSchema.index({ isFeatured: 1 });
articleSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });

// Virtual: readingTime
articleSchema.virtual('readingTime').get(function() {
  if (!this.abstract) return 1;
  const wordCount = this.abstract.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
});

// Pre-save: auto-generate slug
articleSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.isModified('slug')) {
    this.slug = slugifyLib(this.title, { lower: true, strict: true });
    const existing = await mongoose.model('Article').findOne({ slug: this.slug, _id: { $ne: this._id } });
    if (existing) {
      this.slug = `${this.slug}-${Date.now().toString(36)}`;
    }
  }
  next();
});

// Method: increment views
articleSchema.methods.incrementViews = function() {
  return mongoose.model('Article').updateOne({ _id: this._id }, { $inc: { views: 1 } });
};

// Method: increment downloads
articleSchema.methods.incrementDownloads = function() {
  return mongoose.model('Article').updateOne({ _id: this._id }, { $inc: { downloads: 1 } });
};

module.exports = mongoose.model('Article', articleSchema);
