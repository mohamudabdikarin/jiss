// filepath: server/src/controllers/pageController.js
const Page = require('../models/Page');
const Section = require('../models/Section');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const { parsePaginationParams } = require('../utils/pagination');
const cacheService = require('../services/cacheService');
const auditService = require('../services/auditService');

exports.getAllPages = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePaginationParams(req.query);
    const { status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const [pages, total] = await Promise.all([
      Page.find(query).populate('sections', '_id name type order isVisible').sort(sort).skip(skip).limit(limit).lean(),
      Page.countDocuments(query)
    ]);

    return paginatedResponse(res, pages, total, page, limit);
  } catch (error) { next(error); }
};

exports.getPageBySlug = async (req, res, next) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug, status: 'published' })
      .populate({ path: 'sections', match: { isVisible: true }, options: { sort: { order: 1 } } })
      .lean();

    if (!page) return errorResponse(res, 'Page not found or not published yet', 404);
    return successResponse(res, page);
  } catch (error) { next(error); }
};

exports.getPageById = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate({ path: 'sections', options: { sort: { order: 1 } } });
    if (!page) return errorResponse(res, 'Page not found. It may have been deleted', 404);
    return successResponse(res, page);
  } catch (error) { 
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid page ID format', 400);
    }
    next(error); 
  }
};

exports.createPage = async (req, res, next) => {
  try {
    if (req.body.isHomePage) {
      await Page.updateMany({ isHomePage: true }, { isHomePage: false });
    }
    req.body.createdBy = req.user._id;
    req.body.updatedBy = req.user._id;

    const page = await Page.create(req.body);
    const defaultSection = await Section.create({
      page: page._id,
      name: 'Page content',
      type: 'page_blocks',
      content: { blocks: [], version: 1 },
      order: 0
    });
    page.sections.push(defaultSection._id);
    await page.save();
    auditService.log(req.user._id, 'create', 'Page', page._id, `Created page: ${page.title}`, null, req);
    cacheService.invalidate('page');
    return successResponse(res, page, 'Page created successfully', 201);
  } catch (error) { 
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return errorResponse(res, `Page creation failed: ${messages}`, 400);
    }
    if (error.code === 11000) {
      return errorResponse(res, 'A page with this slug already exists. Please use a different title', 400);
    }
    next(error); 
  }
};

exports.updatePage = async (req, res, next) => {
  try {
    if (req.body.isHomePage) {
      await Page.updateMany({ isHomePage: true, _id: { $ne: req.params.id } }, { isHomePage: false });
    }
    req.body.updatedBy = req.user._id;

    const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate({ path: 'sections', options: { sort: { order: 1 } } });

    if (!page) return errorResponse(res, 'Page not found. It may have been deleted', 404);
    auditService.log(req.user._id, 'update', 'Page', page._id, `Updated page: ${page.title}`, null, req);
    cacheService.invalidate('page');
    return successResponse(res, page, 'Page updated successfully');
  } catch (error) { 
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return errorResponse(res, `Page update failed: ${messages}`, 400);
    }
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid page ID format', 400);
    }
    if (error.code === 11000) {
      return errorResponse(res, 'A page with this slug already exists. Please use a different title', 400);
    }
    next(error); 
  }
};

exports.deletePage = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return errorResponse(res, 'Page not found. It may have already been deleted', 404);

    if (page.isHomePage) {
      return errorResponse(res, 'Cannot delete the home page. Please set another page as home first', 400);
    }

    await Section.deleteMany({ page: page._id });
    await page.deleteOne();

    auditService.log(req.user._id, 'delete', 'Page', page._id, `Deleted page: ${page.title}`, null, req);
    cacheService.invalidate('page');
    return successResponse(res, null, 'Page deleted successfully');
  } catch (error) { 
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid page ID format', 400);
    }
    next(error); 
  }
};

exports.reorderPages = async (req, res, next) => {
  try {
    const { pages } = req.body;
    if (!Array.isArray(pages) || pages.length === 0) {
      return successResponse(res, null, 'No pages to reorder');
    }
    const operations = pages.map(p => ({
      updateOne: { filter: { _id: p._id }, update: { order: p.order } }
    }));
    await Page.bulkWrite(operations);
    cacheService.invalidate('page');
    return successResponse(res, null, 'Pages reordered successfully');
  } catch (error) { next(error); }
};

exports.duplicatePage = async (req, res, next) => {
  try {
    const original = await Page.findById(req.params.id).lean();
    if (!original) return errorResponse(res, 'Page not found. Cannot duplicate', 404);

    delete original._id;
    original.title = `${original.title} (Copy)`;
    original.slug = `${original.slug}-copy-${Date.now().toString(36)}`;
    original.status = 'draft';
    original.isHomePage = false;
    original.createdBy = req.user._id;
    original.updatedBy = req.user._id;
    original.sections = [];

    const newPage = await Page.create(original);

    // Clone sections
    const sections = await Section.find({ page: req.params.id }).lean();
    for (const sec of sections) {
      delete sec._id;
      sec.page = newPage._id;
      const newSec = await Section.create(sec);
      newPage.sections.push(newSec._id);
    }
    await newPage.save();

    return successResponse(res, newPage, 'Page duplicated successfully', 201);
  } catch (error) { 
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid page ID format', 400);
    }
    next(error); 
  }
};

exports.getHomePage = async (req, res, next) => {
  try {
    const page = await Page.findOne({ isHomePage: true, status: 'published' })
      .populate({ path: 'sections', match: { isVisible: true }, options: { sort: { order: 1 } } })
      .lean();

    if (!page) return errorResponse(res, 'Home page not found', 404);
    return successResponse(res, page);
  } catch (error) { next(error); }
};
