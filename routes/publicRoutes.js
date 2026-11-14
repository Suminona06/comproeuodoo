import { Router } from 'express';
import homeController from '../controllers/public/homeController.js';
import productController from '../controllers/public/productController.js';
import pageController from '../controllers/public/pageController.js';
import postController from '../controllers/public/postController.js';
import contactController from '../controllers/public/contactController.js';
import seoController from '../controllers/public/seoController.js';
import { leadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const LOCAL_RETURN_BASE = 'http://local.invalid';

function isRejectedReturnRaw(value) {
  if (!value) return true;
  if (value.includes('\\') || value.startsWith('//')) return true;
  return /[\r\n\0]/.test(value);
}

function parseReturnTarget(clean) {
  try {
    const isRel = clean.startsWith('/');
    return { isRel, url: new URL(clean, isRel ? LOCAL_RETURN_BASE : undefined) };
  } catch {
    return null;
  }
}

function isAllowedReturnTarget(info, reqHost) {
  if (!info) return false;
  const isHttp = info.url.protocol === 'http:' || info.url.protocol === 'https:';
  const targetHost = info.isRel ? 'local.invalid' : reqHost;
  return isHttp && Boolean(targetHost) && info.url.host === targetHost;
}

function resolveSafeReturnPath(referrer, reqHost) {
  if (typeof referrer !== 'string') return '/';
  const clean = referrer.trim();
  if (isRejectedReturnRaw(clean)) return '/';
  const info = parseReturnTarget(clean);
  if (!isAllowedReturnTarget(info, reqHost)) return '/';
  return `${info.url.pathname}${info.url.search}${info.url.hash}`;
}

// Language switcher route
router.get('/lang/:code', (req, res) => {
  const { code } = req.params;
  const validLangs = ['id', 'en'];
  const targetLang = validLangs.includes(code) ? code : 'id';

  res.cookie('euodoo_lang', targetLang, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  const returnTo = resolveSafeReturnPath(req.get('Referrer'), req.get('host'));
  res.redirect(returnTo);
});

// SEO & Search Engine Discovery
router.get('/robots.txt', seoController.robots);
router.get('/sitemap.xml', seoController.sitemap);

// Home Page
router.get('/', homeController.index);

// Products Catalog & Detail
router.get('/products', productController.index);
router.get('/products/:slug', productController.detail);

// About Us & Company Profile
router.get('/about', pageController.about);

// Machine Capabilities & Facilities
router.get('/capabilities', pageController.capabilities);

// News & Insights
router.get('/news', postController.index);
router.get('/news/:slug', postController.detail);

// Contact Us & RFQ Form
router.get('/contact', contactController.index);
router.post('/contact', leadLimiter, contactController.submit);
router.post('/leads', leadLimiter, contactController.submit);

export default router;
