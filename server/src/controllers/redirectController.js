const Redirect = require('../models/Redirect');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const { parsePaginationParams } = require('../utils/pagination');
const auditService = require('../services/auditService');

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePaginationParams(req.query);
    const [items, total] = await Promise.all([
      Redirect.find().sort(sort).skip(skip).limit(limit).lean(),
      Redirect.countDocuments()
    ]);
    return paginatedResponse(res, items, total, page, limit);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { fromPath, toPath, statusCode } = req.body;
    const from = fromPath?.replace(/^\//, '') || fromPath;
    const normalized = from.startsWith('/') ? from : `/${from}`;
    const existing = await Redirect.findOne({ fromPath: normalized });
    if (existing) return errorResponse(res, 'Redirect from this path already exists', 400);

    const redirect = await Redirect.create({
      fromPath: normalized,
      toPath: toPath?.startsWith('/') ? toPath : `/${toPath || ''}`,
      statusCode: statusCode || 301
    });
    auditService.log(req.user._id, 'create', 'Redirect', redirect._id, `Created redirect: ${normalized} → ${toPath}`, null, req);
    return successResponse(res, redirect, 'Redirect created', 201);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const redirect = await Redirect.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!redirect) return errorResponse(res, 'Redirect not found', 404);
    auditService.log(req.user._id, 'update', 'Redirect', redirect._id, 'Updated redirect', null, req);
    return successResponse(res, redirect, 'Redirect updated');
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    const redirect = await Redirect.findByIdAndDelete(req.params.id);
    if (!redirect) return errorResponse(res, 'Redirect not found', 404);
    auditService.log(req.user._id, 'delete', 'Redirect', redirect._id, 'Deleted redirect', null, req);
    return successResponse(res, null, 'Redirect deleted');
  } catch (error) { next(error); }
};
