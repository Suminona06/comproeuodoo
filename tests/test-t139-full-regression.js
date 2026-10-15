import assert from 'assert';
import ejs from 'ejs';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import aboutGalleryModel from '../models/aboutGalleryModel.js';
import aboutStatsModel from '../models/aboutStatsModel.js';
import aboutTimelineModel from '../models/aboutTimelineModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function makeRequest({ method = 'GET', path = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTest() {
  console.log('=== TEST T-139: COMPREHENSIVE END-TO-END VERIFICATION & FULL REGRESSION ===\n');

  // =========================================================================
  // 1. UJI REGRESI HOMEPAGE (P0 CHECK)
  // =========================================================================
  console.log('[1] Verifying Homepage CSS Isolation and Layout (P0 Check)...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/components.css'), 'utf8');
  const indexEjs = fs.readFileSync(path.join(__dirname, '../views/public/index.ejs'), 'utf8');

  // Verify homepage template does not contain about gallery classes
  assert.ok(!indexEjs.includes('abt-gal-'), 'Homepage index.ejs must NOT contain .abt-gal-* classes');
  assert.ok(!indexEjs.includes('sec-gallery'), 'Homepage index.ejs must NOT contain .sec-gallery');

  // Verify homepage featured products has symmetrical 2-column bento grid
  assert.ok(indexEjs.includes('class="sec-products"'), 'Homepage must contain section.sec-products');
  assert.ok(indexEjs.includes('class="bento-col-6 reveal"'), 'Homepage products must use .bento-col-6');

  // Verify components.css isolates .sec-gallery
  assert.ok(css.includes('.sec-products {'), 'components.css must define .sec-products');
  assert.ok(css.includes('grid-template-columns: repeat(2, 1fr)'), 'Homepage .bento-grid must be 2 columns');
  assert.ok(css.includes('.sec-gallery .abt-gal-grid'), 'About gallery must be isolated to .sec-gallery .abt-gal-grid');
  assert.ok(css.includes('.sec-gallery .abt-gal-viewport'), 'About gallery viewport must be isolated');

  // Fetch live homepage and verify HTTP 200
  const homeRes = await makeRequest({ path: '/' });
  assert.strictEqual(homeRes.statusCode, 200, 'Homepage GET / must return 200 OK');
  assert.ok(homeRes.data.includes('sec-products'), 'Live homepage must contain sec-products');
  assert.ok(!homeRes.data.includes('abt-gal-viewport'), 'Live homepage must not contain abt-gal-viewport');
  console.log('  -> Homepage CSS isolation and layout verified: 100% untouched and isolated.\n');

  // =========================================================================
  // 2. UJI KASUS EDGE GALERI TENTANG KAMI (0, 1, 6, 7 SLIDE, & TEXTLESS)
  // =========================================================================
  console.log('[2] Verifying Gallery Edge Cases (0, 1, 6, 7 slides and textless)...');
  const aboutTemplate = fs.readFileSync(path.join(__dirname, '../views/public/about.ejs'), 'utf8');

  const baseRenderParams = {
    currentLang: 'id',
    lang: 'id',
    settings: { company_name: 'PT Euodoo' },
    title: 'Tentang Kami',
    path: '/about',
    about: {},
    heroBanner: null,
    stats: [],
    timeline: [],
    galleryHeader: { title_id: 'Galeri Kami' },
    storyHeader: null,
    visionMissionImages: null
  };

  // Kasus 0 slide: section galeri tersembunyi
  const renderedZero = ejs.render(aboutTemplate, {
    ...baseRenderParams,
    gallerySlides: []
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });
  assert.ok(!renderedZero.includes('id="bentoGallery"'), 'Gallery with 0 slides must NOT render #bentoGallery');
  assert.ok(!renderedZero.includes('class="sec-gallery"'), 'Gallery with 0 slides must NOT render section.sec-gallery');
  console.log('  -> Case 0 slides: Section is hidden cleanly without empty gaps.');

  // Kasus 1 slide: tampil tunggal proporsional, pager tersembunyi
  const singleSlide = [
    { id: 1, image_url: '/images/1.jpg', category_id: 'QC', title_id: 'Lab Uji Kualitas' }
  ];
  const renderedSingle = ejs.render(aboutTemplate, {
    ...baseRenderParams,
    gallerySlides: singleSlide
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });
  assert.ok(renderedSingle.includes('id="bentoGallery"'), 'Gallery with 1 slide must render #bentoGallery');
  assert.ok(renderedSingle.includes('abt-gal-grid--1'), '1 slide must apply abt-gal-grid--1 modifier');
  assert.ok(renderedSingle.includes('style="display: none;"'), '1 slide must hide pager via style="display: none;"');
  console.log('  -> Case 1 slide: Single tile modifier applied, pager hidden.');

  // Kasus 6 slide: grid mosaik 6 tile lengkap (pos 1 s/d pos 6)
  const sixSlides = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    image_url: `/images/${i + 1}.jpg`,
    category_id: `CAT ${i + 1}`,
    title_id: `Title ${i + 1}`
  }));
  const renderedSix = ejs.render(aboutTemplate, {
    ...baseRenderParams,
    gallerySlides: sixSlides
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });
  assert.ok(renderedSix.includes('bento-tile--pos-1 bento-tile--tall'), 'Tile 1 must be tall');
  assert.ok(renderedSix.includes('bento-tile--pos-2 bento-tile--wide'), 'Tile 2 must be wide');
  assert.ok(renderedSix.includes('bento-tile--pos-5 bento-tile--wide'), 'Tile 5 must be wide');
  assert.ok(renderedSix.includes('bento-tile--pos-6'), 'Tile 6 must exist');
  assert.ok(renderedSix.includes('<strong id="bentoCur">01</strong> / <span id="bentoTotal">01</span>'), 'Pager total must be 01 for 6 slides');
  console.log('  -> Case 6 slides: Standard 6-tile bento mosaic layout and pager verified.');

  // Kasus 7 slide: halaman 1 (6 tile) dan halaman 2 (1 tile), pager total 02
  const sevenSlides = Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    image_url: `/images/${i + 1}.jpg`,
    category_id: `CAT ${i + 1}`,
    title_id: `Title ${i + 1}`
  }));
  const renderedSeven = ejs.render(aboutTemplate, {
    ...baseRenderParams,
    gallerySlides: sevenSlides
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });
  assert.ok(renderedSeven.includes('<strong id="bentoCur">01</strong> / <span id="bentoTotal">02</span>'), 'Pager total must be 02 for 7 slides');
  console.log('  -> Case 7 slides: 2-page pagination structure verified.');

  // Kasus tile tanpa teks: tidak ada .abt-gal-cap, fallback alt dan aria-label
  const textlessSlides = [
    { id: 1, image_url: '/images/textless-1.jpg', category_id: '', title_id: '' }
  ];
  const renderedTextless = ejs.render(aboutTemplate, {
    ...baseRenderParams,
    gallerySlides: textlessSlides
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });
  assert.ok(!renderedTextless.includes('class="abt-gal-cap'), 'Textless slide must NOT render .abt-gal-cap');
  assert.ok(!renderedTextless.includes('class="bento-cap'), 'Textless slide must NOT render .bento-cap');
  assert.ok(renderedTextless.includes('alt="Fasilitas Manufaktur &amp; Operasional PT Euodoo (Foto 01)"') ||
            renderedTextless.includes('alt="Fasilitas Manufaktur & Operasional PT Euodoo (Foto 01)"'),
            'Textless slide must have fallback alt');
  assert.ok(renderedTextless.includes('aria-label="Fasilitas Manufaktur &amp; Operasional PT Euodoo (Foto 01)"') ||
            renderedTextless.includes('aria-label="Fasilitas Manufaktur & Operasional PT Euodoo (Foto 01)"'),
            'Textless slide must have fallback aria-label');
  console.log('  -> Case textless slide: Clean image rendered with accessibility fallback.\n');

  // =========================================================================
  // 3. UJI RESPONSIF MULTI-BREAKPOINT
  // =========================================================================
  console.log('[3] Verifying Multi-Breakpoint Responsive Rules & Touch Gestures...');
  const mainJs = fs.readFileSync(path.join(__dirname, '../public/js/main.js'), 'utf8');

  // Desktop viewport constraints
  assert.ok(css.includes('min-height: 662px'), 'Desktop gallery viewport must have min-height: 662px');

  // Mobile viewport constraints (<=768px)
  assert.ok(css.includes('@media (max-width: 768px)'), 'CSS must include @media (max-width: 768px)');
  assert.ok(css.includes('min-height: 180px'), 'Mobile gallery viewport must have min-height: 180px');
  assert.ok(css.includes('touch-action: pan-y'), 'Mobile container must have touch-action: pan-y');
  assert.ok(css.includes('repeat(2, minmax(0, 1fr))'), 'Mobile grid must use 2-column layout');
  assert.ok(css.includes('grid-auto-rows: 180px'), 'Mobile row height must be 180px at 768px');

  // Small mobile (<=480px)
  assert.ok(css.includes('@media (max-width: 480px)'), 'CSS must include @media (max-width: 480px)');
  assert.ok(css.includes('grid-auto-rows: 150px'), 'Small mobile row height must be 150px at 480px');

  // JavaScript mobile pagination (2 tiles per page) and swipe gestures
  assert.ok(mainJs.includes('window.innerWidth <= 768 ? 2 : 6'), 'main.js must switch to 2 tiles on mobile');
  assert.ok(mainJs.includes('absDeltaX >= 50'), 'Swipe threshold must be 50px');
  assert.ok(mainJs.includes('touchstart') && mainJs.includes('touchend'), 'Touch events must be registered');
  assert.ok(mainJs.includes('passive: true'), 'Touch events must use passive: true');
  console.log('  -> Responsive rules (Desktop 662px, Mobile 180px, 50px swipe threshold) verified.\n');

  // =========================================================================
  // 4. UJI REGRESI CMS ADMIN
  // =========================================================================
  console.log('[4] Verifying CMS Admin Authentication and All Tab Endpoints...');

  // Step A: Login flow
  const getLogin = await makeRequest({ path: '/admin/login' });
  assert.strictEqual(getLogin.statusCode, 200, 'GET /admin/login must return 200');

  let csrfCookie = '';
  let csrfToken = '';
  (getLogin.headers['set-cookie'] || []).forEach((c) => {
    if (c.startsWith('_csrf_token=')) {
      csrfCookie = c.split(';')[0];
      csrfToken = csrfCookie.replace('_csrf_token=', '');
    }
  });

  const postBody = new URLSearchParams({
    email: 'admin@euodoo.com',
    password: 'AdminEuodoo2026!',
    _csrf: csrfToken
  }).toString();

  const postLogin = await makeRequest({
    method: 'POST',
    path: '/admin/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postBody),
      'Cookie': csrfCookie
    },
    body: postBody
  });

  assert.strictEqual(postLogin.statusCode, 302, 'Login should redirect with 302');
  const authCookies = postLogin.headers['set-cookie'] || [];
  const cookieMap = {};
  authCookies.forEach((c) => {
    const pair = c.split(';')[0];
    const [k, v] = pair.split('=');
    cookieMap[k.trim()] = v ? v.trim() : '';
  });
  const sessionCookie = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');

  // Step B: Check all admin endpoints return 200 OK
  const adminEndpoints = [
    '/admin/dashboard',
    '/admin/about',
    '/admin/products',
    '/admin/product-categories',
    '/admin/posts',
    '/admin/post-categories',
    '/admin/inquiries',
    '/admin/banners',
    '/admin/brands',
    '/admin/media',
    '/admin/users',
    '/admin/settings'
  ];

  for (const ep of adminEndpoints) {
    const res = await makeRequest({
      path: ep,
      headers: { 'Cookie': sessionCookie }
    });
    assert.strictEqual(res.statusCode, 200, `Admin endpoint ${ep} must return 200 OK`);
  }
  console.log('  -> All 12 CMS Admin endpoints returned 200 OK.');

  // Step C: Verify About CRUD Models (Galeri, Stats, Timeline)
  console.log('  -> Verifying About Models CRUD execution...');

  // Gallery CRUD (textless slide)
  const testGalId = await aboutGalleryModel.create({
    image_url: '/images/gallery/t139-test.jpg',
    category_id: '',
    title_id: '',
    sort_order: 999,
    is_active: 1
  });
  assert.ok(testGalId, 'Gallery slide create failed');
  const readGal = await aboutGalleryModel.findById(testGalId);
  assert.strictEqual(readGal.image_url, '/images/gallery/t139-test.jpg');
  await aboutGalleryModel.update(testGalId, { sort_order: 1000 });
  await aboutGalleryModel.delete(testGalId);
  const deletedGal = await aboutGalleryModel.findById(testGalId);
  assert.strictEqual(deletedGal, null);

  // Stats CRUD
  const testStatId = await aboutStatsModel.create({
    stat_value: '100+',
    label_id: 'Test T-139 Stat',
    sort_order: 999,
    is_active: 1
  });
  assert.ok(testStatId, 'Stats create failed');
  await aboutStatsModel.delete(testStatId);

  // Timeline CRUD
  const testTlId = await aboutTimelineModel.create({
    year_label_id: '2026',
    title_id: 'Test T-139 Milestone',
    sort_order: 999,
    is_active: 1
  });
  assert.ok(testTlId, 'Timeline create failed');
  await aboutTimelineModel.delete(testTlId);
  console.log('  -> About Gallery, Stats, and Timeline CRUD models verified.\n');

  console.log('=== ALL VERIFICATIONS FOR T-139 PASSED WITH 100% SUCCESS! ===');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ T-139 Regression Test failed:', err);
  process.exit(1);
});
