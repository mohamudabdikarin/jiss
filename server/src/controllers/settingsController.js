// filepath: server/src/controllers/settingsController.js
const SiteSettings = require('../models/SiteSettings');
const { buildTranslationSources } = require('../utils/buildTranslationSources');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const cacheService = require('../services/cacheService');
const auditService = require('../services/auditService');
const maintenanceMiddleware = require('../middleware/maintenanceMode');
const { uploadFile } = require('../services/cloudflareService');
const { createMediaFromBufferFile, deleteMediaStorageAndRecord } = require('../services/mediaAssetService');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();
    return successResponse(res, settings);
  } catch (error) { next(error); }
};

/** CMS-derived strings to prefill Translation Manager when DB has no value. */
exports.getTranslationSources = async (req, res, next) => {
  try {
    const sources = await buildTranslationSources();
    return successResponse(res, { sources });
  } catch (error) { next(error); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    req.body.updatedBy = req.user._id;
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    const desc = String(settings.siteDescription ?? '').trim();
    const prevSeo = settings.defaultSEO && typeof settings.defaultSEO.toObject === 'function'
      ? settings.defaultSEO.toObject()
      : { ...(settings.defaultSEO || {}) };
    settings.defaultSEO = { ...prevSeo, metaDescription: desc };
    await settings.save();

    auditService.log(req.user._id, 'settings_change', 'SiteSettings', settings._id, 'Updated site settings', null, req);
    cacheService.invalidate('settings');
    if (maintenanceMiddleware.invalidateCache) maintenanceMiddleware.invalidateCache();
    return successResponse(res, settings, 'Settings updated');
  } catch (error) { next(error); }
};

exports.uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded', 400);

    let settings = await SiteSettings.getSettings();

    const previousKey = settings._logoKey;
    if (previousKey) {
      await deleteMediaStorageAndRecord(previousKey);
    }

    const result = await uploadFile(req.file, 'branding');

    const mediaRecord = await createMediaFromBufferFile(req.file, result, 'branding', req.user._id, {
      tags: ['site-logo']
    });

    settings.siteLogo = result.url;
    settings._logoKey = result.key;
    settings.updatedBy = req.user._id;
    await settings.save();

    auditService.log(req.user._id, 'settings_change', 'SiteSettings', settings._id, 'Uploaded site logo', null, req);
    auditService.log(req.user._id, 'upload', 'Media', mediaRecord._id, `Site logo: ${result.originalName}`, null, req);
    cacheService.invalidate('settings');
    return successResponse(res, settings, 'Logo uploaded successfully');
  } catch (error) { next(error); }
};

exports.removeLogo = async (req, res, next) => {
  try {
    let settings = await SiteSettings.getSettings();

    if (settings._logoKey) {
      await deleteMediaStorageAndRecord(settings._logoKey);
    }

    settings.siteLogo = null;
    settings._logoKey = null;
    settings.updatedBy = req.user._id;
    await settings.save();

    auditService.log(req.user._id, 'settings_change', 'SiteSettings', settings._id, 'Removed site logo', null, req);
    cacheService.invalidate('settings');
    return successResponse(res, settings, 'Logo removed');
  } catch (error) { next(error); }
};
