// filepath: server/src/controllers/articleController.js
const Article = require('../models/Article');
const { uploadFile } = require('../services/cloudflareService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const { parsePaginationParams } = require('../utils/pagination');
const { generateUniqueSlug } = require('../utils/slugify');
const cacheService = require('../services/cacheService');
const auditService = require('../services/auditService');

exports.getAllArticles = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePaginationParams(req.query);
    const { type, status, search, category, isFeatured, year, volume, keyword } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (isFeatured === 'true') query.isFeatured = true;
    if (volume) query.volume = volume;
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31T23:59:59`);
      query.publicationDate = { $gte: start, $lte: end };
    }
    if (keyword) query.keywords = { $in: [new RegExp(keyword, 'i')] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { abstract: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const [articles, total] = await Promise.all([
      Article.find(query).populate('category', 'name slug').populate('createdBy', 'name').sort(sort).skip(skip).limit(limit).lean(),
      Article.countDocuments(query)
    ]);

    return paginatedResponse(res, articles, total, page, limit);
  } catch (error) { next(error); }
};

exports.getArticleBySlug = async (req, res, next) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug, status: 'published' })
      .populate('category', 'name slug')
      .populate('relatedArticles', 'title slug thumbnail type');

    if (!article) return errorResponse(res, 'Article not found', 404);
    await article.incrementViews();
    return successResponse(res, article);
  } catch (error) { next(error); }
};

exports.getArticleById = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('createdBy', 'name email');
    if (!article) return errorResponse(res, 'Article not found', 404);
    return successResponse(res, article);
  } catch (error) { next(error); }
};

exports.createArticle = async (req, res, next) => {
  try {
    req.body.slug = await generateUniqueSlug(Article, req.body.title);
    req.body.createdBy = req.user._id;
    req.body.updatedBy = req.user._id;

    // Parse authors if string
    if (typeof req.body.authors === 'string') {
      req.body.authors = JSON.parse(req.body.authors);
    }
    if (typeof req.body.keywords === 'string') {
      req.body.keywords = JSON.parse(req.body.keywords);
    }

    // Handle PDF upload
    if (req.file) {
      const result = await uploadFile(req.file, 'articles/pdf');
      req.body.pdfUrl = result.url;
      req.body.pdfFileName = result.originalName;
      req.body.pdfFileSize = result.size;
    }

    const article = await Article.create(req.body);
    auditService.log(req.user._id, 'create', 'Article', article._id, `Created: ${article.title}`, null, req);
    cacheService.invalidate('article');
    return successResponse(res, article, 'Article created', 201);
  } catch (error) { next(error); }
};

exports.updateArticle = async (req, res, next) => {
  try {
    req.body.updatedBy = req.user._id;

    if (typeof req.body.authors === 'string') req.body.authors = JSON.parse(req.body.authors);
    if (typeof req.body.keywords === 'string') req.body.keywords = JSON.parse(req.body.keywords);

    if (req.file) {
      const result = await uploadFile(req.file, 'articles/pdf');
      req.body.pdfUrl = result.url;
      req.body.pdfFileName = result.originalName;
      req.body.pdfFileSize = result.size;
    }

    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('category', 'name slug');

    if (!article) return errorResponse(res, 'Article not found', 404);
    auditService.log(req.user._id, 'update', 'Article', article._id, `Updated: ${article.title}`, null, req);
    cacheService.invalidate('article');
    return successResponse(res, article, 'Article updated');
  } catch (error) { next(error); }
};

exports.deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return errorResponse(res, 'Article not found', 404);
    auditService.log(req.user._id, 'delete', 'Article', article._id, `Deleted: ${article.title}`, null, req);
    cacheService.invalidate('article');
    return successResponse(res, null, 'Article deleted');
  } catch (error) { next(error); }
};

exports.bulkDeleteArticles = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await Article.deleteMany({ _id: { $in: ids } });
    auditService.log(req.user._id, 'delete', 'Article', null, `Bulk deleted ${ids.length} articles`, null, req);
    cacheService.invalidate('article');
    return successResponse(res, null, `${ids.length} articles deleted`);
  } catch (error) { next(error); }
};

exports.bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    await Article.updateMany({ _id: { $in: ids } }, { status });
    cacheService.invalidate('article');
    return successResponse(res, null, `${ids.length} articles updated to ${status}`);
  } catch (error) { next(error); }
};

exports.duplicateArticle = async (req, res, next) => {
  try {
    const original = await Article.findById(req.params.id).lean();
    if (!original) return errorResponse(res, 'Article not found', 404);

    delete original._id;
    original.title = `${original.title} (Copy)`;
    original.slug = await generateUniqueSlug(Article, original.title);
    original.status = 'draft';
    original.views = 0;
    original.downloads = 0;
    original.scheduledPublishDate = null;
    original.createdBy = req.user._id;
    original.updatedBy = req.user._id;
    original.relatedArticles = [];

    const newArticle = await Article.create(original);
    auditService.log(req.user._id, 'create', 'Article', newArticle._id, `Duplicated: ${original.title}`, null, req);
    cacheService.invalidate('article');
    return successResponse(res, newArticle, 'Article duplicated', 201);
  } catch (error) { next(error); }
};

exports.searchArticles = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query);

    const query = { status: 'published' };
    if (type) query.type = type;

    if (q && q.trim()) {
      const searchRe = new RegExp(q.trim(), 'i');
      query.$or = [
        { title: searchRe },
        { abstract: searchRe },
        { keywords: searchRe }
      ];
    }

    const [articles, total] = await Promise.all([
      Article.find(query)
        .populate('category', 'name slug')
        .sort({ publicationDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(query)
    ]);

    return paginatedResponse(res, articles, total, page, limit);
  } catch (error) { next(error); }
};

exports.trackDownload = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return errorResponse(res, 'Article not found', 404);
    await article.incrementDownloads();
    return successResponse(res, { downloads: article.downloads + 1 }, 'Download tracked');
  } catch (error) { next(error); }
};

exports.getFeaturedArticles = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);
    const articles = await Article.find({ status: 'published', isFeatured: true })
      .populate('category', 'name slug')
      .sort({ publicationDate: -1 })
      .limit(limit)
      .lean();
    return successResponse(res, articles);
  } catch (error) { next(error); }
};

exports.getVolumes = async (req, res, next) => {
  try {
    const volumes = await Article.aggregate([
      { $match: { type: 'published', status: 'published', volume: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$volume', year: { $max: { $year: '$publicationDate' } }, count: { $sum: 1 } } },
      { $sort: { year: -1, _id: -1 } },
      { $project: { volume: '$_id', year: 1, count: 1, _id: 0 } }
    ]);
    return successResponse(res, volumes);
  } catch (error) { next(error); }
};

exports.getRelatedArticles = async (req, res, next) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug, status: 'published' });
    if (!article) return errorResponse(res, 'Article not found', 404);

    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const orConditions = [];

    if (article.keywords?.length) {
      orConditions.push({ keywords: { $in: article.keywords }, _id: { $ne: article._id } });
    }
    if (article.category) {
      orConditions.push({ category: article.category, _id: { $ne: article._id } });
    }

    let articles = [];
    if (orConditions.length) {
      articles = await Article.find({ status: 'published', $or: orConditions })
        .populate('category', 'name slug')
        .select('title slug thumbnail type')
        .limit(limit)
        .lean();
    }

    return successResponse(res, articles);
  } catch (error) { next(error); }
};
