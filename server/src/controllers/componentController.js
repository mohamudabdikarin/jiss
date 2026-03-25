const Component = require('../models/Component');
const { successResponse } = require('../utils/responseHandler');

exports.getActiveComponents = async (req, res, next) => {
  try {
    const now = new Date();
    const components = await Component.find({
      isActive: true,
      isGlobal: true,
      $and: [
        { $or: [{ 'displayConditions.startDate': { $exists: false } }, { 'displayConditions.startDate': { $lte: now } }] },
        { $or: [{ 'displayConditions.endDate': { $exists: false } }, { 'displayConditions.endDate': { $gte: now } }] }
      ]
    }).sort({ order: 1 }).lean();
    return successResponse(res, components);
  } catch (error) { next(error); }
};
