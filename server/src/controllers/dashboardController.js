// filepath: server/src/controllers/dashboardController.js
const Page = require('../models/Page');
const Article = require('../models/Article');
const Media = require('../models/Media');
const Category = require('../models/Category');
const Section = require('../models/Section');
const Redirect = require('../models/Redirect');
const Component = require('../models/Component');
const Navigation = require('../models/Navigation');
const { successResponse } = require('../utils/responseHandler');

exports.getStats = async (req, res, next) => {
  try {
    const [
      totalPages, publishedPages,
      totalArticles, publishedArticles, preprintArticles,
      totalMedia,
      articlesByMonth,
      totalViews, totalDownloads,
      totalCategories,
      totalSections,
      totalRedirects,
      totalComponents,
      totalNavigations
    ] = await Promise.all([
      Page.countDocuments(),
      Page.countDocuments({ status: 'published' }),
      Article.countDocuments(),
      Article.countDocuments({ type: 'published', status: 'published' }),
      Article.countDocuments({ type: 'preprint', status: 'published' }),
      Media.countDocuments(),
      Article.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 12 }
      ]),
      Article.aggregate([{ $group: { _id: null, views: { $sum: '$views' } } }]),
      Article.aggregate([{ $group: { _id: null, downloads: { $sum: '$downloads' } } }]),
      Category.countDocuments(),
      Section.countDocuments(),
      Redirect.countDocuments(),
      Component.countDocuments(),
      Navigation.countDocuments()
    ]);

    const stats = {
      pages: { total: totalPages, published: publishedPages },
      articles: { total: totalArticles, published: publishedArticles, preprints: preprintArticles },
      media: { total: totalMedia },
      views: totalViews[0]?.views || 0,
      downloads: totalDownloads[0]?.downloads || 0,
      categories: { total: totalCategories },
      sections: { total: totalSections },
      redirects: { total: totalRedirects },
      components: { total: totalComponents },
      navigations: { total: totalNavigations },
      articlesByMonth
    };

    return successResponse(res, stats);
  } catch (error) { next(error); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const auditService = require('../services/auditService');
    const result = await auditService.getAuditLogs(req.query, req.query);
    return successResponse(res, result);
  } catch (error) { next(error); }
};
