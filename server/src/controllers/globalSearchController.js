const Page = require('../models/Page');
const Article = require('../models/Article');
const Media = require('../models/Media');
const Category = require('../models/Category');
const { successResponse } = require('../utils/responseHandler');

exports.search = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return successResponse(res, { pages: [], articles: [], media: [], categories: [] });
    }

    const re = new RegExp(q, 'i');
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);

    const [pages, articles, media, categories] = await Promise.all([
      Page.find({ $or: [{ title: re }, { slug: re }] }).select('title slug status').limit(limit).lean(),
      Article.find({ $or: [{ title: re }, { abstract: re }, { keywords: re }] }).select('title slug type status').limit(limit).lean(),
      Media.find({ $or: [{ filename: re }, { originalName: re }, { alt: re }] }).select('filename url alt').limit(limit).lean(),
      Category.find({ $or: [{ name: re }, { slug: re }] }).select('name slug').limit(limit).lean()
    ]);

    return successResponse(res, {
      pages: pages.map(p => ({ ...p, _type: 'page' })),
      articles: articles.map(a => ({ ...a, _type: 'article' })),
      media: media.map(m => ({ ...m, _type: 'media' })),
      categories: categories.map(c => ({ ...c, _type: 'category' }))
    });
  } catch (error) { next(error); }
};
