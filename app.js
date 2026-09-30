import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { APP_CONFIG } from './config/constants.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { csrfProtection } from './middleware/csrfMiddleware.js';
import { optionalAuth } from './middleware/authMiddleware.js';
import { i18nMiddleware } from './middleware/i18nMiddleware.js';
import settingModel from './models/settingModel.js';
import logger from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Trust proxy for cPanel / Nginx reverse proxy
app.set('trust proxy', 1);

// Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// HTTP Compression (gzip / deflate)
app.use(
  compression({
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6, // Balanced CPU usage vs compression ratio
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    }
  })
);

// Body Parsers & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'euodoo_cookie_secret_dev'));

// Static Files & Asset Caching
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Long-lived cache for media, images, and fonts (30 days)
      if (/\.(webp|jpg|jpeg|png|svg|ico|woff2|woff|mp4|webm)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      } else if (/\.(css|js)$/i.test(filePath)) {
        // Shorter cache for stylesheets and client scripts (1 day)
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  })
);

// CSRF Protection & Global Auth Context & i18n
app.use(csrfProtection);
app.use(optionalAuth);
app.use(i18nMiddleware);

// Global Template Locals Middleware with cached settings
let cachedSettings = null;
let lastSettingsFetch = 0;
const SETTINGS_CACHE_TTL = 30000; // 30 seconds

app.use(async (req, res, next) => {
  const currentLang = req.cookies?.[APP_CONFIG.LANG_COOKIE_NAME] || APP_CONFIG.DEFAULT_LANG;
  res.locals.appName = APP_CONFIG.NAME;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentLang = currentLang;
  res.locals.path = req.path;
  res.locals.user = req.user || null;
  res.locals.csrfToken = res.locals.csrfToken || '';

  try {
    const now = Date.now();
    if (!cachedSettings || (now - lastSettingsFetch) > SETTINGS_CACHE_TTL) {
      cachedSettings = await settingModel.getAll();
      lastSettingsFetch = now;
    }
    res.locals.settings = cachedSettings || {};
  } catch (err) {
    res.locals.settings = cachedSettings || {};
  }

  next();
});

// Mount Routes
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
