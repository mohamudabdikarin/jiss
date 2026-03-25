// filepath: server/src/config/cors.js
const { env } = require('./env');

/** Split comma-separated deployment URLs (e.g. www + apex) for CORS. */
function splitOrigins(value) {
  if (value == null || value === '') return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const corsOptions = {
  origin: [
    ...splitOrigins(env.CLIENT_URL),
    ...splitOrigins(env.ADMIN_URL),
    ...splitOrigins(env.CORS_EXTRA_ORIGINS),
    'http://localhost:3000',
    'http://localhost:3001'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400
};

module.exports = corsOptions;
