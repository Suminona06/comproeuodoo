import { Router } from 'express';
import homeController from '../controllers/public/homeController.js';
import productController from '../controllers/public/productController.js';
import pageController from '../controllers/public/pageController.js';
import postController from '../controllers/public/postController.js';
import contactController from '../controllers/public/contactController.js';
import seoController from '../controllers/public/seoController.js';

const router = Router();

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
  
  const returnTo = req.get('Referrer') || '/';
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
router.post('/contact', contactController.submit);
router.post('/leads', contactController.submit);

export default router;
