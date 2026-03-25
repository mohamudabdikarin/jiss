const { env } = require('./env');

/** Split comma-separated origins; strip trailing slashes so env typos don't break CORS. */
function splitOrigins(value) {
  if (value == null || value === '') return [];
  return String(value)
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function buildAllowList() {
  const list = [
    ...splitOrigins(env.CLIENT_URL),
    ...splitOrigins(env.ADMIN_URL),
    ...splitOrigins(env.CORS_EXTRA_ORIGINS),
    'http://localhost:3000',
    'http://localhost:3001'
  ].filter(Boolean);
  return [...new Set(list)];
}

const allowedOriginsSet = new Set(buildAllowList());

/** When true, any https host ending in .vercel.app is allowed (preview deploys). Trade-off: broader exposure. */
const allowVercelPreviewHosts = process.env.ALLOW_VERCEL_PREVIEW_CORS === 'true';

const corsOptions = {
  origin(origin, callback) {
    // Non-browser or same-origin tools without Origin header
    if (!origin) return callback(null, true);

    const normalized = origin.replace(/\/+$/, '');

    if (allowedOriginsSet.has(normalized)) {
      return callback(null, true);
    }

    if (allowVercelPreviewHosts) {
      try {
        const { hostname, protocol } = new URL(origin);
        if (protocol === 'https:' && hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch (_) {
        /* invalid URL */
      }
    }

    console.warn(
      `[cors] blocked origin: ${origin}. Set CLIENT_URL / ADMIN_URL / CORS_EXTRA_ORIGINS on the API, or ALLOW_VERCEL_PREVIEW_CORS=true for *.vercel.app`
    );

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400,
  optionsSuccessStatus: 204
};

module.exports = corsOptions;
