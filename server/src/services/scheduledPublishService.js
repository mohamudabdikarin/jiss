const cron = require('node-cron');
const Article = require('../models/Article');
const Page = require('../models/Page');
const cacheService = require('./cacheService');

const runScheduledPublish = async () => {
  try {
    const now = new Date();
    const [articlesUpdated, pagesUpdated] = await Promise.all([
      Article.updateMany(
        { status: 'draft', scheduledPublishDate: { $lte: now, $ne: null } },
        { $set: { status: 'published', scheduledPublishDate: null } }
      ),
      Page.updateMany(
        { status: 'draft', scheduledPublishDate: { $lte: now, $ne: null } },
        { $set: { status: 'published', scheduledPublishDate: null } }
      )
    ]);
    if (articlesUpdated.modifiedCount > 0 || pagesUpdated.modifiedCount > 0) {
      cacheService.invalidate('article');
      cacheService.invalidate('page');
      console.log(`[Scheduled] Published ${articlesUpdated.modifiedCount} articles, ${pagesUpdated.modifiedCount} pages`);
    }
  } catch (e) {
    console.error('[Scheduled Publish] Error:', e.message);
  }
};

const startScheduledPublishCron = () => {
  cron.schedule('* * * * *', runScheduledPublish); // Every minute
  console.log('✅ Scheduled publishing cron started (runs every minute)');
};

module.exports = { startScheduledPublishCron, runScheduledPublish };
