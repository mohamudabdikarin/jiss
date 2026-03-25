// filepath: server/src/services/cacheService.js
const { cache, clearCache, clearCachePattern } = require('../middleware/cache');

const cacheService = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl),
  del: (key) => cache.del(key),
  flush: () => clearCache(),
  flushPattern: (pattern) => clearCachePattern(pattern),

  /**
   * Clear caches related to specific entity changes
   */
  invalidate: (entity) => {
    const patterns = {
      page: ['/public/pages', '/public/home'],
      section: ['/public/pages', '/public/home'],
      navigation: ['/public/navigation'],
      footer: ['/public/footer'],
      article: ['/public/articles'],
      category: ['/public/categories'],
      settings: ['/public/settings'],
      seo: ['/public/sitemap', '/public/robots']
    };
    const toInvalidate = patterns[entity] || [];
    toInvalidate.forEach(p => clearCachePattern(p));
  }
};

module.exports = cacheService;
