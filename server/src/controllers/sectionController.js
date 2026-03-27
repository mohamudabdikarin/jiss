// filepath: server/src/controllers/sectionController.js
const Section = require('../models/Section');
const Page = require('../models/Page');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const cacheService = require('../services/cacheService');

exports.getSectionsByPage = async (req, res, next) => {
  try {
    const sections = await Section.find({ page: req.params.pageId }).sort({ order: 1 });
    return successResponse(res, sections);
  } catch (error) { next(error); }
};

exports.createSection = async (req, res, next) => {
  try {
    const page = await Page.findById(req.body.page);
    if (!page) return errorResponse(res, 'Page not found. Cannot create section', 404);

    const maxOrder = await Section.findOne({ page: req.body.page }).sort({ order: -1 }).select('order').lean();
    req.body.order = maxOrder ? maxOrder.order + 1 : 0;

    const section = await Section.create(req.body);
    page.sections.push(section._id);
    await page.save();

    cacheService.invalidate('page');
    return successResponse(res, section, 'Section created successfully', 201);
  } catch (error) { 
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return errorResponse(res, `Section creation failed: ${messages}`, 400);
    }
    next(error); 
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!section) return errorResponse(res, 'Section not found. It may have been deleted', 404);
    cacheService.invalidate('page');
    return successResponse(res, section, 'Section updated successfully');
  } catch (error) { 
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return errorResponse(res, `Section update failed: ${messages}`, 400);
    }
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid section ID format', 400);
    }
    next(error); 
  }
};

exports.deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return errorResponse(res, 'Section not found. It may have already been deleted', 404);

    await Page.findByIdAndUpdate(section.page, { $pull: { sections: section._id } });
    await section.deleteOne();

    // Reorder remaining sections
    const remaining = await Section.find({ page: section.page }).sort({ order: 1 });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].order = i;
      await remaining[i].save();
    }

    cacheService.invalidate('page');
    return successResponse(res, null, 'Section deleted successfully');
  } catch (error) { 
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid section ID format', 400);
    }
    next(error); 
  }
};

exports.reorderSections = async (req, res, next) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections) || sections.length === 0) {
      return successResponse(res, null, 'No sections to reorder');
    }
    const operations = sections.map(s => ({
      updateOne: { filter: { _id: s._id }, update: { $set: { order: s.order } } }
    }));
    await Section.bulkWrite(operations);

    // Update page.sections array order (do not mutate req.body)
    const firstSection = await Section.findById(sections[0]._id);
    if (firstSection) {
      const sorted = [...sections].sort((a, b) => a.order - b.order).map(s => s._id);
      await Page.findByIdAndUpdate(firstSection.page, { sections: sorted });
    }

    cacheService.invalidate('page');
    return successResponse(res, null, 'Sections reordered successfully');
  } catch (error) { next(error); }
};

exports.toggleSectionVisibility = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return errorResponse(res, 'Section not found', 404);

    section.isVisible = !section.isVisible;
    await section.save();

    cacheService.invalidate('page');
    return successResponse(res, section, `Section ${section.isVisible ? 'shown' : 'hidden'} successfully`);
  } catch (error) { 
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid section ID format', 400);
    }
    next(error); 
  }
};

exports.duplicateSection = async (req, res, next) => {
  try {
    const original = await Section.findById(req.params.id).lean();
    if (!original) return errorResponse(res, 'Section not found. Cannot duplicate', 404);

    const maxOrder = await Section.findOne({ page: original.page }).sort({ order: -1 }).select('order').lean();
    delete original._id;
    original.name = `${original.name} (Copy)`;
    original.order = maxOrder ? maxOrder.order + 1 : 0;

    const newSection = await Section.create(original);
    await Page.findByIdAndUpdate(original.page, { $push: { sections: newSection._id } });

    cacheService.invalidate('page');
    return successResponse(res, newSection, 'Section duplicated successfully', 201);
  } catch (error) { 
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid section ID format', 400);
    }
    next(error); 
  }
};
