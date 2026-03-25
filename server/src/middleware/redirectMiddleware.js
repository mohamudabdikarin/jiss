const Redirect = require('../models/Redirect');

let redirectCache = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 min

const getRedirects = async () => {
  if (redirectCache && Date.now() - cacheTime < CACHE_TTL) return redirectCache;
  redirectCache = await Redirect.find({ isActive: true }).lean();
  cacheTime = Date.now();
  return redirectCache;
};

module.exports = async (req, res, next) => {
  try {
    const redirects = await getRedirects();
    const path = req.path;
    const match = redirects.find(r => {
      const from = r.fromPath.replace(/^\//, '');
      const p = path.replace(/^\//, '');
      return from === p || path === r.fromPath;
    });
    if (match) {
      return res.redirect(match.statusCode || 301, match.toPath);
    }
  } catch (e) { /* ignore */ }
  next();
};
