import { Router } from 'express';

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

// Home Page
router.get('/', (req, res) => {
  res.render('public/index', {
    title: 'PT Euodoo - Presisi Manufaktur Plastik Berkualitas Tinggi',
    path: '/'
  });
});

// Products Catalog
router.get('/products', (req, res) => {
  res.render('public/products', {
    title: 'Katalog Produk - PT Euodoo',
    path: '/products'
  });
});

// Capabilities
router.get('/capabilities', (req, res) => {
  res.render('public/capabilities', {
    title: 'Kapabilitas Manufaktur & Fasilitas - PT Euodoo',
    path: '/capabilities'
  });
});

// News & Insights
router.get('/news', (req, res) => {
  res.render('public/news', {
    title: 'Publikasi & Berita Industri - PT Euodoo',
    path: '/news'
  });
});

// Contact Us & RFQ
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    title: 'Hubungi Kami & Permintaan Penawaran - PT Euodoo',
    path: '/contact'
  });
});

export default router;
