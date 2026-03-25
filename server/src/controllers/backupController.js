// filepath: server/src/controllers/backupController.js
const backupService = require('../services/backupService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const auditService = require('../services/auditService');

exports.createBackup = async (req, res, next) => {
  try {
    const result = await backupService.createBackup();
    auditService.log(req.user._id, 'backup', 'System', null, 'Created database backup', null, req);
    return successResponse(res, result, 'Backup created', 201);
  } catch (error) { next(error); }
};

exports.listBackups = async (req, res, next) => {
  try {
    const backups = await backupService.listBackups();
    return successResponse(res, backups);
  } catch (error) { next(error); }
};

exports.restoreBackup = async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) return errorResponse(res, 'Backup key is required', 400);
    const result = await backupService.restoreBackup(key);
    auditService.log(req.user._id, 'restore', 'System', null, 'Restored from backup', result, req);
    return successResponse(res, result, 'Backup restored');
  } catch (error) { next(error); }
};

exports.deleteBackup = async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) return errorResponse(res, 'Backup key is required', 400);
    await backupService.deleteBackup(key);
    return successResponse(res, null, 'Backup deleted');
  } catch (error) { next(error); }
};

exports.downloadBackup = async (req, res, next) => {
  try {
    const { key } = req.query;
    if (!key) return errorResponse(res, 'Backup key is required', 400);
    const info = await backupService.getDownloadInfo(key);
    if (info.stream) {
      return res.download(info.filepath, info.filename, { maxAge: 0 });
    }
    return successResponse(res, { downloadUrl: info.downloadUrl });
  } catch (error) { next(error); }
};
