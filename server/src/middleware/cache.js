// filepath: server/src/middleware/cache.js
const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 300,       // 5 minutes default
  checkperiod: 60,   // Check for expired keys every 60s
  useClones: false
});

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds
 */
const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Skip cache if explicitly requested
    if (req.headers['cache-control'] === 'no-cache') {
      return next();
    }

    const key = `__cache__${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, ttl);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear all cache entries
 */
const clearCache = () => {
  cache.flushAll();
};

/**
 * Clear cache entries matching a pattern
 */
const clearCachePattern = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cache.del(key));
};

/**
 * Delete a specific cache key
 */
const deleteCache = (key) => {
  cache.del(`__cache__${key}`);
};

module.exports = { cacheMiddleware, clearCache, clearCachePattern, deleteCache, cache };
