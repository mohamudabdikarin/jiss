// filepath: server/src/models/Redirect.js
const mongoose = require('mongoose');

const redirectSchema = new mongoose.Schema({
  fromPath: { type: String, required: true, trim: true },
  toPath: { type: String, required: true, trim: true },
  statusCode: { type: Number, default: 301, enum: [301, 302] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

redirectSchema.index({ fromPath: 1 }, { unique: true });
redirectSchema.index({ isActive: 1 });

module.exports = mongoose.model('Redirect', redirectSchema);
