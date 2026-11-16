import crypto from 'crypto';
import escapeHtml from 'escape-html';
import logger from '../utils/logger.js';

const CSRF_COOKIE_NAME = '_csrf_token';

const generateToken = () => crypto.randomBytes(32).toString('hex');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getHeader(req, name) {
  if (typeof req.get === 'function') return req.get(name) || '';
  return req.headers?.[name.toLowerCase()] || '';
}

function resolveSameOriginPath(trimmedUrl, reqHost) {
  if (!reqHost) return null;
  try {
    const parsed = new URL(trimmedUrl);
    const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (!isHttp || parsed.host.toLowerCase() !== reqHost) return null;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

function resolveSafeReturnUrl(req) {
  const defaultPath = String(req.originalUrl || '').startsWith('/admin') ? '/admin' : '/';
  const rawReferrer = getHeader(req, 'Referrer');
  if (typeof rawReferrer !== 'string' || !rawReferrer.trim()) return defaultPath;

  const trimmed = rawReferrer.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;

  const reqHost = String(getHeader(req, 'host')).toLowerCase();
  return resolveSameOriginPath(trimmed, reqHost) || defaultPath;
}

function ensureCsrfToken(req, res) {
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
  res.locals.csrfToken = token;
  return token;
}

const toTrimmedTokenList = (val) => {
  if (!val) return [];
  return (Array.isArray(val) ? val : [val]).map((t) => String(t).trim());
};

function resolveIncomingToken(req, expectedToken) {
  const candidates = [
    ...toTrimmedTokenList(req.body?._csrf),
    ...toTrimmedTokenList(req.query?._csrf),
    ...toTrimmedTokenList(req.headers['x-csrf-token']),
    ...toTrimmedTokenList(req.headers['csrf-token'])
  ];
  const matched = candidates.find((candidate) => candidate === expectedToken);
  return { incomingToken: matched || candidates[0] || '', isValid: Boolean(matched) };
}

function renderCsrfForbiddenHtml(safeBackHref) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>403 - Token CSRF Tidak Valid | PT Euodoo</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #131b2e; }
    .container { text-align: center; padding: 2rem; max-width: 500px; }
    h1 { color: #ba1a1a; margin-bottom: 0.5rem; }
    p { color: #424753; margin-bottom: 1.5rem; line-height: 1.5; }
    a { display: inline-block; padding: 0.75rem 1.5rem; background: #00755a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Permintaan Ditolak (403)</h1>
    <p>Sesi pengiriman formulir tidak valid atau telah kedaluwarsa demi keamanan sistem.</p>
    <a href="${safeBackHref}">Kembali &amp; Muat Ulang Formulir</a>
  </div>
</body>
</html>`;
}

function sendCsrfRejectedResponse(req, res, expectedToken, incomingToken) {
  const expectedPreview = expectedToken.substring(0, 8);
  const receivedPreview = incomingToken ? incomingToken.substring(0, 8) : 'none';
  logger.warn(`CSRF validation rejected: ${req.method} ${req.originalUrl}. Expected: ${expectedPreview}..., Received: ${receivedPreview}...`);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(403).json({
      success: false,
      error: 'Sesi formulir tidak valid atau token CSRF kedaluwarsa. Silakan muat ulang halaman.'
    });
  }

  return res.status(403).send(renderCsrfForbiddenHtml(escapeHtml(resolveSafeReturnUrl(req))));
}

/**
 * CSRF Protection Middleware (Double Submit Cookie Pattern)
 */
export const csrfProtection = (req, res, next) => {
  const token = ensureCsrfToken(req, res);
  if (SAFE_METHODS.has(req.method)) return next();

  const { incomingToken, isValid } = resolveIncomingToken(req, token);
  if (!isValid) return sendCsrfRejectedResponse(req, res, token, incomingToken);

  return next();
};

export default csrfProtection;
