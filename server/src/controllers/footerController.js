// filepath: server/src/controllers/footerController.js
const Footer = require('../models/Footer');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const cacheService = require('../services/cacheService');
const auditService = require('../services/auditService');

exports.getFooter = async (req, res, next) => {
  try {
    const footer = await Footer.findOne().lean();
    const data = footer ? { content: footer.content || footer.copyrightText || '' } : null;
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.getAllFooters = async (req, res, next) => {
  try {
    const footers = await Footer.find().lean();
    return successResponse(res, footers);
  } catch (error) { next(error); }
};

exports.createFooter = async (req, res, next) => {
  try {
    const footer = await Footer.create(req.body);
    auditService.log(req.user._id, 'create', 'Footer', footer._id, 'Created footer', null, req);
    cacheService.invalidate('footer');
    return successResponse(res, footer, 'Footer created', 201);
  } catch (error) { next(error); }
};

exports.updateFooter = async (req, res, next) => {
  try {
    const footer = await Footer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!footer) return errorResponse(res, 'Footer not found', 404);
    auditService.log(req.user._id, 'update', 'Footer', footer._id, 'Updated footer', null, req);
    cacheService.invalidate('footer');
    return successResponse(res, footer, 'Footer updated');
  } catch (error) { next(error); }
};

exports.deleteFooter = async (req, res, next) => {
  try {
    const footer = await Footer.findByIdAndDelete(req.params.id);
    if (!footer) return errorResponse(res, 'Footer not found', 404);
    auditService.log(req.user._id, 'delete', 'Footer', footer._id, 'Deleted footer', null, req);
    cacheService.invalidate('footer');
    return successResponse(res, null, 'Footer deleted');
  } catch (error) { next(error); }
};
