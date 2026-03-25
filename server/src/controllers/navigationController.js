// filepath: server/src/controllers/navigationController.js
const Navigation = require('../models/Navigation');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const cacheService = require('../services/cacheService');
const auditService = require('../services/auditService');

exports.getNavigation = async (req, res, next) => {
  try {
    const { location } = req.query;
    const query = location ? { location } : {};
    const navs = await Navigation.find(query).lean();
    return successResponse(res, navs);
  } catch (error) { next(error); }
};

exports.getNavigationByLocation = async (req, res, next) => {
  try {
    const nav = await Navigation.findOne({ location: req.params.location, isActive: true }).lean();
    const data = nav || { location: req.params.location, items: [], isActive: true };
    return successResponse(res, data);
  } catch (error) { next(error); }
};

exports.createNavigation = async (req, res, next) => {
  try {
    const nav = await Navigation.create(req.body);
    auditService.log(req.user._id, 'create', 'Navigation', nav._id, `Created ${nav.location} navigation`, null, req);
    cacheService.invalidate('navigation');
    return successResponse(res, nav, 'Navigation created', 201);
  } catch (error) { next(error); }
};

exports.updateNavigation = async (req, res, next) => {
  try {
    const nav = await Navigation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!nav) return errorResponse(res, 'Navigation not found', 404);
    auditService.log(req.user._id, 'update', 'Navigation', nav._id, `Updated ${nav.location} navigation`, null, req);
    cacheService.invalidate('navigation');
    return successResponse(res, nav, 'Navigation updated');
  } catch (error) { next(error); }
};

exports.deleteNavigation = async (req, res, next) => {
  try {
    const nav = await Navigation.findByIdAndDelete(req.params.id);
    if (!nav) return errorResponse(res, 'Navigation not found', 404);
    auditService.log(req.user._id, 'delete', 'Navigation', nav._id, `Deleted ${nav.location} navigation`, null, req);
    cacheService.invalidate('navigation');
    return successResponse(res, null, 'Navigation deleted');
  } catch (error) { next(error); }
};
