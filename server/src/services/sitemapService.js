// filepath: server/src/services/sitemapService.js
const Page = require('../models/Page');
const Article = require('../models/Article');
const SiteSettings = require('../models/SiteSettings');

const sitemapService = {
  /**
   * Generate XML sitemap
   */
  generateSitemap: async () => {
    const settings = await SiteSettings.getSettings();
    const baseUrl = settings.siteUrl || 'https://ijcds.uob.edu.bh';

    const pages = await Page.find({ status: 'published' }).select('slug updatedAt isHomePage').lean();
    const articles = await Article.find({ status: 'published' }).select('slug updatedAt type').lean();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Pages
    for (const page of pages) {
      const url = page.isHomePage ? baseUrl : `${baseUrl}/${page.slug}`;
      const lastmod = page.updatedAt ? page.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const priority = page.isHomePage ? '1.0' : '0.8';
      xml += `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    }

    // Articles
    for (const article of articles) {
      const url = `${baseUrl}/articles/${article.slug}`;
      const lastmod = article.updatedAt ? article.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    xml += '</urlset>';
    return xml;
  },

  /**
   * Generate robots.txt
   */
  generateRobotsTxt: async () => {
    const settings = await SiteSettings.getSettings();
    const baseUrl = settings.siteUrl || 'https://ijcds.uob.edu.bh';

    return `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${baseUrl}/api/v1/public/sitemap.xml\n`;
  }
};

module.exports = sitemapService;
