// filepath: server/src/controllers/categoryController.js
const Category = require('../models/Category');
const Article = require('../models/Article');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { generateUniqueSlug } = require('../utils/slugify');

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    const ids = categories.map((c) => c._id);
    let countMap = {};
    if (ids.length > 0) {
      const rows = await Article.aggregate([
        { $match: { category: { $in: ids } } },
        { $group: { _id: '$category', n: { $sum: 1 } } }
      ]);
      countMap = Object.fromEntries(rows.map((r) => [String(r._id), r.n]));
    }
    const enriched = categories.map((c) => ({
      ...c,
      articleCount: countMap[String(c._id)] || 0
    }));
    return successResponse(res, enriched);
  } catch (error) { next(error); }
};

exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!category) return errorResponse(res, 'Category not found', 404);
    return successResponse(res, category);
  } catch (error) { next(error); }
};

exports.createCategory = async (req, res, next) => {
  try {
    req.body.slug = await generateUniqueSlug(Category, req.body.name);
    const category = await Category.create(req.body);
    return successResponse(res, category, 'Category created', 201);
  } catch (error) { next(error); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    if (req.body.name) {
      req.body.slug = await generateUniqueSlug(Category, req.body.name, req.params.id);
    }
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return errorResponse(res, 'Category not found', 404);
    return successResponse(res, category, 'Category updated');
  } catch (error) { next(error); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const articleCount = await Article.countDocuments({ category: req.params.id });
    if (articleCount > 0) {
      return errorResponse(res, `Cannot delete — ${articleCount} articles are linked`, 400);
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return errorResponse(res, 'Category not found', 404);
    return successResponse(res, null, 'Category deleted');
  } catch (error) { next(error); }
};
