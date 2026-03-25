// filepath: server/src/models/SiteSettings.js
const mongoose = require('mongoose');

const DEFAULT_SITE_NAME = 'International Journal of Computing and Digital Systems';

const siteSettingsSchema = new mongoose.Schema({
  siteName: { type: String, required: true, default: DEFAULT_SITE_NAME },
  siteDescription: { type: String },
  siteLogo: { type: String },
  _logoKey: { type: String },
  siteFavicon: { type: String },
  siteUrl: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  contactAddress: { type: String },
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    linkedin: { type: String },
    instagram: { type: String },
    youtube: { type: String },
    researchgate: { type: String },
    googleScholar: { type: String }
  },
  defaultSEO: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [{ type: String }],
    ogImage: { type: String }
  },
  analytics: {
    googleAnalyticsId: { type: String },
    googleTagManagerId: { type: String }
  },
  maintenanceMode: {
    isEnabled: { type: Boolean, default: false },
    message: { type: String },
    allowedIPs: [{ type: String }]
  },
  customHeaderCode: { type: String },
  customFooterCode: { type: String },
  articlesPerPage: { type: Number, default: 10 },
  // Journal metadata (displayed in nav bar below main nav)
  journalMeta: {
    issn: { type: String },
    citeScore: { type: String },
    doi: { type: String },
    frequency: { type: String }
  },
  // Multi-language translations (from admin Translations page)
  translations: { type: mongoose.Schema.Types.Mixed },
  // Custom 404 page
  custom404: {
    title: { type: String },
    message: { type: String }
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Singleton pattern: ensure only one document
siteSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      siteName: DEFAULT_SITE_NAME,
      siteDescription: '',
      contactEmail: ''
    });
  } else if (!settings.siteName || !String(settings.siteName).trim()) {
    settings.siteName = DEFAULT_SITE_NAME;
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
