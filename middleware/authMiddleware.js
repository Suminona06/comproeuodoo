import jwt from 'jsonwebtoken';
import { APP_CONFIG } from '../config/constants.js';
import logger from '../utils/logger.js';

/**
 * Authentication Middleware for Admin Area
 */
export const requireAuth = (req, res, next) => {
  const token = req.cookies[APP_CONFIG.SESSION_COOKIE_NAME];

  if (!token) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' });
    }
    return res.redirect('/admin/login');
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'euodoo_jwt_secret_dev';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    res.locals.user = decoded;
    next();
  } catch (err) {
    logger.warn(`Invalid or expired admin session token: ${err.message}`);
    res.clearCookie(APP_CONFIG.SESSION_COOKIE_NAME);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, error: 'Sesi tidak valid.' });
    }
    return res.redirect('/admin/login');
  }
};

/**
 * Optional Auth Middleware (attaches user if valid token exists, does not redirect)
 */
export const optionalAuth = (req, res, next) => {
  const token = req.cookies[APP_CONFIG.SESSION_COOKIE_NAME];
  if (!token) {
    req.user = null;
    res.locals.user = null;
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'euodoo_jwt_secret_dev';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    res.locals.user = decoded;
  } catch (err) {
    req.user = null;
    res.locals.user = null;
    res.clearCookie(APP_CONFIG.SESSION_COOKIE_NAME);
  }
  next();
};

/**
 * Role-Based Access Control Middleware
 * @param {Array<string>} roles
 */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ success: false, error: 'Akses ditolak.' });
      }
      return res.status(403).send('Akses Ditolak: Anda tidak memiliki hak akses yang cukup.');
    }
    next();
  };
};

export default { requireAuth, optionalAuth, requireRole };
