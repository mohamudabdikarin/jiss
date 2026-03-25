// filepath: server/src/app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const corsOptions = require('./config/cors');
const { env } = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Security headers — allow this API to be called from other origins (SPA admin/client on Vercel)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS
app.use(cors(corsOptions));

// 2b. Cookies (refresh token for /auth)
app.use(cookieParser());

// 3. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. NoSQL injection prevention
app.use(mongoSanitize());

// 5. XSS clean — skip CMS routes that store trusted HTML from authenticated admins
// (global xss-clean HTML-encodes < > in req.body, which breaks section/page/article rich text)
const XSS_SKIP_PREFIXES = [
  '/api/v1/sections',
  '/api/v1/pages',
  '/api/v1/articles',
  '/api/v1/settings',
  '/api/v1/footer',
  '/api/v1/seo',
  '/api/v1/categories',
  '/api/v1/navigation',
  '/api/v1/redirects',
  '/api/v1/media'
];
try {
  const xssClean = require('xss-clean');
  const xssMiddleware = xssClean();
  app.use((req, res, next) => {
    const path = (req.originalUrl || '').split('?')[0];
    if (XSS_SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) return next();
    return xssMiddleware(req, res, next);
  });
} catch (e) {
  console.warn('⚠️  xss-clean not available, skipping');
}

// 6. HTTP parameter pollution
app.use(hpp());

// 7. Compression
app.use(compression());

// 8. Logging
if (env.isDev) {
  app.use(morgan('dev'));
}

// 9. Rate limiting
app.use('/api', generalLimiter);

// 10. Maintenance mode (blocks /api/v1/public when enabled)
const maintenanceMode = require('./middleware/maintenanceMode');
app.use(maintenanceMode);

// ===== ROUTES =====

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/pages', require('./routes/pageRoutes'));
app.use('/api/v1/sections', require('./routes/sectionRoutes'));
app.use('/api/v1/navigation', require('./routes/navigationRoutes'));
app.use('/api/v1/footer', require('./routes/footerRoutes'));
app.use('/api/v1/media', require('./routes/mediaRoutes'));
app.use('/api/v1/articles', require('./routes/articleRoutes'));
app.use('/api/v1/categories', require('./routes/categoryRoutes'));
app.use('/api/v1/settings', require('./routes/settingsRoutes'));
app.use('/api/v1/seo', require('./routes/seoRoutes'));
app.use('/api/v1/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/v1/redirects', require('./routes/redirectRoutes'));
app.use('/api/v1/public', require('./routes/publicRoutes'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
