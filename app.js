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

// Compression
app.use(compression());

// Body Parsers & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'euodoo_cookie_secret_dev'));

// Static Files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// Global Template Locals Middleware
app.use((req, res, next) => {
  const currentLang = req.cookies[APP_CONFIG.LANG_COOKIE_NAME] || APP_CONFIG.DEFAULT_LANG;
  res.locals.appName = APP_CONFIG.NAME;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentLang = currentLang;
  res.locals.path = req.path;
  res.locals.user = req.user || null;
  next();
});

// Mount Routes
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
