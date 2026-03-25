// filepath: server/src/models/Media.js
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  cloudflareKey: { type: String, required: true },
  alt: { type: String },
  caption: { type: String },
  folder: { type: String, default: 'general' },
  dimensions: {
    width: { type: Number },
    height: { type: Number }
  },
  thumbnailUrl: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

mediaSchema.index({ mimeType: 1 });
mediaSchema.index({ folder: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ createdAt: -1 });

// Virtual: formatted size
mediaSchema.virtual('formattedSize').get(function() {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.size === 0) return '0 Bytes';
  const i = Math.floor(Math.log(this.size) / Math.log(1024));
  return parseFloat((this.size / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
});

module.exports = mongoose.model('Media', mediaSchema);
