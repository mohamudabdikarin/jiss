// filepath: server/src/controllers/seoController.js
const sitemapService = require('../services/sitemapService');
const Page = require('../models/Page');
const Article = require('../models/Article');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const cacheService = require('../services/cacheService');

exports.getSitemap = async (req, res, next) => {
  try {
    const xml = await sitemapService.generateSitemap();
    res.type('application/xml').send(xml);
  } catch (error) { next(error); }
};

exports.getRobotsTxt = async (req, res, next) => {
  try {
    const txt = await sitemapService.generateRobotsTxt();
    res.type('text/plain').send(txt);
  } catch (error) { next(error); }
};

exports.getSEOOverview = async (req, res, next) => {
  try {
    const pages = await Page.find({ status: 'published' })
      .select('title slug seo')
      .lean();

    const issues = [];
    for (const page of pages) {
      if (!page.seo?.metaTitle) issues.push({ page: page.title, slug: page.slug, issue: 'Missing meta title' });
      if (!page.seo?.metaDescription) issues.push({ page: page.title, slug: page.slug, issue: 'Missing meta description' });
    }

    return successResponse(res, {
      totalPages: pages.length,
      pagesWithSEO: pages.filter(p => p.seo?.metaTitle && p.seo?.metaDescription).length,
      issues
    });
  } catch (error) { next(error); }
};

exports.updatePageSEO = async (req, res, next) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { seo: req.body },
      { new: true, runValidators: true }
    );
    if (!page) return errorResponse(res, 'Page not found', 404);
    cacheService.invalidate('seo');
    return successResponse(res, page, 'SEO updated');
  } catch (error) { next(error); }
};
