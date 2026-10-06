import crypto from 'crypto';
import logger from '../utils/logger.js';

const CSRF_COOKIE_NAME = '_csrf_token';

/**
 * Generate a cryptographically secure random token
 * @returns {string}
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Protection Middleware (Double Submit Cookie Pattern)
 */
export const csrfProtection = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE_NAME] || req.signedCookies?.[CSRF_COOKIE_NAME];

  if (!token) {
    token = generateToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
    });
  }

  // Expose token to all views and templates
  res.locals.csrfToken = token;

  // Safe HTTP methods do not require token validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Validate incoming token on state-changing requests (POST, PUT, DELETE, PATCH)
  let incomingToken =
    req.body?._csrf ||
    req.query?._csrf ||
    req.headers['x-csrf-token'] ||
    req.headers['csrf-token'];

  // Handle arrays if multiple fields or query params were submitted
  if (Array.isArray(incomingToken)) {
    if (incomingToken.includes(token)) {
      incomingToken = token;
    } else {
      incomingToken = incomingToken[0];
    }
  }

  if (typeof incomingToken === 'string') {
    incomingToken = incomingToken.trim();
  }

  // Resilient verification: check incoming token, query param, or body param
  const queryToken = req.query?._csrf ? (Array.isArray(req.query._csrf) ? req.query._csrf : [req.query._csrf]).map(t => String(t).trim()) : [];
  const bodyToken = req.body?._csrf ? (Array.isArray(req.body._csrf) ? req.body._csrf : [req.body._csrf]).map(t => String(t).trim()) : [];

  const isValid =
    (incomingToken && incomingToken === token) ||
    queryToken.includes(token) ||
    bodyToken.includes(token);

  if (!isValid) {
    logger.warn(`CSRF validation rejected: ${req.method} ${req.originalUrl}. Expected: ${token ? token.substring(0, 8) : 'none'}..., Received: ${incomingToken ? String(incomingToken).substring(0, 8) : 'none'}...`);

    const isJson = req.xhr || req.headers.accept?.includes('application/json');
    if (isJson) {
      return res.status(403).json({
        success: false,
        error: 'Sesi formulir tidak valid atau token CSRF kedaluwarsa. Silakan muat ulang halaman.'
      });
    }

    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>403 - Token CSRF Tidak Valid | PT Euodoo</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #faf8ff; color: #131b2e; }
          .container { text-align: center; padding: 2rem; max-width: 500px; }
          h1 { color: #ba1a1a; margin-bottom: 0.5rem; }
          p { color: #424753; margin-bottom: 1.5rem; line-height: 1.5; }
          a { display: inline-block; padding: 0.75rem 1.5rem; background: #0055b8; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Permintaan Ditolak (403)</h1>
          <p>Sesi pengiriman formulir tidak valid atau telah kedaluwarsa demi keamanan sistem.</p>
          <a href="javascript:history.back()">Kembali & Muat Ulang Formulir</a>
        </div>
      </body>
      </html>
    `);
  }

  next();
};

export default csrfProtection;
