import assert from 'assert';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import aboutGalleryModel from '../models/aboutGalleryModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== TEST T-122: BENTO MOSAIC GALLERY ===\n');

  // 1. Verify components.css has new bento classes and old slider classes removed
  console.log('[1] Verifying components.css...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/components.css'), 'utf8');
  assert.ok(css.includes('.bento-gallery'), 'components.css must contain .bento-gallery');
  assert.ok(css.includes('.bento-grid'), 'components.css must contain .bento-grid');
  assert.ok(css.includes('.bento-tile--pos-1'), 'components.css must contain .bento-tile--pos-1');
  assert.ok(css.includes('.bento-grid--5'), 'components.css must contain .bento-grid--5');
  assert.ok(css.includes('.bento-grid--4'), 'components.css must contain .bento-grid--4');
  assert.ok(css.includes('.bento-grid--3'), 'components.css must contain .bento-grid--3');
  assert.ok(css.includes('.bento-grid--2'), 'components.css must contain .bento-grid--2');
  assert.ok(css.includes('.bento-grid--1'), 'components.css must contain .bento-grid--1');
  assert.ok(css.includes('.bento-cap'), 'components.css must contain .bento-cap');
  assert.ok(css.includes('.bento-cat'), 'components.css must contain .bento-cat');
  assert.ok(css.includes('.bento-title'), 'components.css must contain .bento-title');
  assert.ok(css.includes('.bento-pager'), 'components.css must contain .bento-pager');
  assert.ok(!css.includes('.gal-track {'), 'components.css must NOT contain old .gal-track');
  assert.ok(!css.includes('.gal-thumbs {'), 'components.css must NOT contain old .gal-thumbs');
  console.log('  -> components.css verified: Bento classes present, old slider classes removed.\n');

  // 2. Verify main.js has bento pagination logic and old slider logic removed
  console.log('[2] Verifying main.js...');
  const js = fs.readFileSync(path.join(__dirname, '../public/js/main.js'), 'utf8');
  assert.ok(js.includes('bentoGallery'), 'main.js must contain bentoGallery');
  assert.ok(js.includes('bentoGrid'), 'main.js must contain bentoGrid');
  assert.ok(js.includes('bentoGalleryData'), 'main.js must contain bentoGalleryData');
  assert.ok(js.includes('bentoPager'), 'main.js must contain bentoPager');
  assert.ok(!js.includes('galTrack'), 'main.js must NOT contain old galTrack');
  assert.ok(!js.includes('galThumbs'), 'main.js must NOT contain old galThumbs');
  console.log('  -> main.js verified: Bento pagination logic present, old slider logic removed.\n');

  // 3. Verify about.ejs renders bento gallery structure
  console.log('[3] Verifying views/public/about.ejs template render...');
  const template = fs.readFileSync(path.join(__dirname, '../views/public/about.ejs'), 'utf8');
  const testSlides = [
    { id: 1, image_url: '/images/test1.jpg', category_id: 'PRODUKSI', category_en: 'PRODUCTION', title_id: 'Lini Ekstrusi 1', title_en: 'Extrusion Line 1' },
    { id: 2, image_url: '/images/test2.jpg', category_id: 'MESIN', category_en: 'MACHINERY', title_id: 'Mesin Bag Making', title_en: 'Bag Making Machine' },
    { id: 3, image_url: '/images/test3.jpg', category_id: 'QC', category_en: 'QC', title_id: 'Lab Uji Kualitas', title_en: 'Quality Lab' },
    { id: 4, image_url: '/images/test4.jpg', category_id: 'GUDANG', category_en: 'STORAGE', title_id: 'Gudang Bahan Baku', title_en: 'Raw Material Storage' },
    { id: 5, image_url: '/images/test5.jpg', category_id: 'LOGISTIK', category_en: 'LOGISTICS', title_id: 'Armada Pengiriman', title_en: 'Delivery Fleet' },
    { id: 6, image_url: '/images/test6.jpg', category_id: 'TIM', category_en: 'TEAM', title_id: 'Operator Berpengalaman', title_en: 'Experienced Operators' },
    { id: 7, image_url: '/images/test7.jpg', category_id: 'KANTOR', category_en: 'OFFICE', title_id: 'Ruang Operasional', title_en: 'Operations Room' }
  ];

  const rendered = ejs.render(template, {
    currentLang: 'id',
    lang: 'id',
    settings: {
      company_name: 'PT Euodoo',
      company_tagline_id: 'Semangat Membangun',
      company_tagline_en: 'Passion To Build',
      company_email: 'info@euodoo.com',
      company_phone: '022-123456',
      contact_whatsapp: '628123456789'
    },
    title: 'Tentang Kami',
    path: '/about',
    about: {},
    heroBanner: null,
    gallerySlides: testSlides,
    stats: [],
    timeline: [],
    galleryHeader: {
      kicker_id: 'GALERI KAMI',
      title_id: 'Di Dalam Operasional Kami',
      body_id: 'Sepintas aktivitas produksi PT EUODOO'
    },
    storyHeader: null,
    visionMissionImages: null
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });

  assert.ok(rendered.includes('id="bentoGallery"'), 'Rendered HTML must contain #bentoGallery');
  assert.ok(rendered.includes('id="bentoGrid"'), 'Rendered HTML must contain #bentoGrid');
  assert.ok(rendered.includes('bento-tile--pos-1 bento-tile--tall'), 'Rendered HTML must contain pos-1 tall');
  assert.ok(rendered.includes('bento-tile--pos-2 bento-tile--wide'), 'Rendered HTML must contain pos-2 wide');
  assert.ok(rendered.includes('id="bentoPager"'), 'Rendered HTML must contain #bentoPager');
  assert.ok(rendered.includes('id="bentoGalleryData"'), 'Rendered HTML must contain #bentoGalleryData');
  assert.ok(rendered.includes('Lini Ekstrusi 1'), 'Rendered HTML must contain slide title');
  console.log('  -> views/public/about.ejs rendered cleanly with 7 slides.\n');

  // 4. Test edge case: 1 slide
  console.log('[4] Verifying 1-slide edge case...');
  const renderedSingle = ejs.render(template, {
    currentLang: 'id',
    lang: 'id',
    settings: {
      company_name: 'PT Euodoo',
      company_tagline_id: 'Semangat Membangun',
      company_tagline_en: 'Passion To Build',
      company_email: 'info@euodoo.com',
      company_phone: '022-123456',
      contact_whatsapp: '628123456789'
    },
    title: 'Tentang Kami',
    path: '/about',
    about: {},
    heroBanner: null,
    gallerySlides: [testSlides[0]],
    stats: [],
    timeline: [],
    galleryHeader: null,
    storyHeader: null,
    visionMissionImages: null
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });
  assert.ok(renderedSingle.includes('bento-grid--1'), 'Single slide must render with .bento-grid--1');
  assert.ok(renderedSingle.includes('style="display: none;"'), 'Single slide must hide pager');
  console.log('  -> 1-slide edge case verified.\n');

  // 5. Test edge case: 0 slides
  console.log('[5] Verifying 0-slide edge case...');
  const renderedZero = ejs.render(template, {
    currentLang: 'id',
    lang: 'id',
    settings: {
      company_name: 'PT Euodoo',
      company_tagline_id: 'Semangat Membangun',
      company_tagline_en: 'Passion To Build',
      company_email: 'info@euodoo.com',
      company_phone: '022-123456',
      contact_whatsapp: '628123456789'
    },
    title: 'Tentang Kami',
    path: '/about',
    about: {},
    heroBanner: null,
    gallerySlides: [],
    stats: [],
    timeline: [],
    galleryHeader: null,
    storyHeader: null,
    visionMissionImages: null
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });
  assert.ok(!renderedZero.includes('id="bentoGallery"'), '0 slides must not render #bentoGallery');
  console.log('  -> 0-slide edge case verified.\n');

  console.log('=== ALL TESTS FOR T-122 PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
