// filepath: server/src/middleware/maintenanceMode.js
const SiteSettings = require('../models/SiteSettings');

let cached = null;
let cachedAt = 0;
const TTL_MS = 30000; // 30 seconds

async function getMaintenanceStatus() {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  try {
    const settings = await SiteSettings.findOne().select('maintenanceMode').lean();
    cached = settings?.maintenanceMode || { isEnabled: false };
    cachedAt = Date.now();
  } catch {
    cached = { isEnabled: false };
  }
  return cached;
}

function isAllowedIP(ip, allowedIPs) {
  if (!allowedIPs || !Array.isArray(allowedIPs) || allowedIPs.length === 0) return false;
  const clientIP = (ip || '').trim();
  return allowedIPs.some(a => (a || '').trim() === clientIP);
}

module.exports = async function maintenanceMode(req, res, next) {
  const status = await getMaintenanceStatus();
  if (!status.isEnabled) return next();

  const clientIP = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
  if (isAllowedIP(clientIP, status.allowedIPs)) return next();

  // Always allow health check
  if (req.path === '/api/v1/health') return next();
  // Allow admin API (auth, settings, dashboard, etc.) — only block public site API
  if (!req.path.startsWith('/api/v1/public')) return next();

  // Block public API (client fetches from /api/v1/public/*)
  const message = status.message || 'Site is currently under maintenance. Please check back soon.';
  res.status(503).json({
    success: false,
    maintenance: true,
    message
  });
};

module.exports.invalidateCache = () => { cached = null; };
