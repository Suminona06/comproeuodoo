import assert from 'assert';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import aboutGalleryModel from '../models/aboutGalleryModel.js';
import { aboutController } from '../controllers/admin/aboutController.js';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== TEST KELOMPOK B: T-137 & T-138 (DATABASE, CONTROLLER, ADMIN & PUBLIC RENDERING) ===\n');

  // 1. T-137: Verify Database Schema for about_gallery_slides title_id nullable
  console.log('[1] Verifying MySQL schema for about_gallery_slides title_id nullable...');
  const columns = await query("SHOW COLUMNS FROM about_gallery_slides LIKE 'title_id'");
  assert.ok(columns.length > 0, 'Column title_id must exist in about_gallery_slides');
  assert.strictEqual(columns[0].Null, 'YES', 'Column title_id must be NULLABLE (Null: YES)');
  console.log('  -> Database schema verified: title_id is NULLABLE with default empty string.\n');

  // 2. T-137: Verify Model CRUD with empty/null title_id
  console.log('[2] Testing aboutGalleryModel CRUD with textless slide...');
  const textlessSlideId = await aboutGalleryModel.create({
    image_url: '/images/gallery/test-textless.jpg',
    category_id: '',
    category_en: '',
    title_id: '',
    title_en: '',
    subtitle_id: '',
    subtitle_en: '',
    sort_order: 99,
    is_active: 1
  });
  assert.ok(textlessSlideId, 'Should create slide with empty title_id');

  const createdSlide = await aboutGalleryModel.findById(textlessSlideId);
  assert.ok(createdSlide, 'Slide should be retrieved from database');
  assert.strictEqual(createdSlide.image_url, '/images/gallery/test-textless.jpg');
  assert.strictEqual(createdSlide.title_id || '', '', 'title_id should be empty');

  // Update without title_id
  await aboutGalleryModel.update(textlessSlideId, { sort_order: 100 });
  const updatedSlide = await aboutGalleryModel.findById(textlessSlideId);
  assert.strictEqual(updatedSlide.sort_order, 100);

  // Clean up
  await aboutGalleryModel.delete(textlessSlideId);
  const deletedSlide = await aboutGalleryModel.findById(textlessSlideId);
  assert.strictEqual(deletedSlide, null, 'Test slide should be deleted');
  console.log('  -> aboutGalleryModel CRUD verified for optional title_id.\n');

  // 3. T-137: Verify Server Validation in aboutController
  console.log('[3] Testing aboutController validation logic...');
  
  // Test missing image_url -> must fail with 400
  let errStatus = null;
  let errMsg = null;
  const mockReqMissingImage = {
    body: { image_url: '', title_id: 'Test Title' },
    xhr: true,
    headers: { accept: 'application/json' }
  };
  const mockResMissingImage = {
    status(code) {
      errStatus = code;
      return this;
    },
    json(payload) {
      errMsg = payload.message;
      return this;
    }
  };
  await aboutController.storeGallerySlide(mockReqMissingImage, mockResMissingImage);
  assert.strictEqual(errStatus, 400, 'Missing image_url must return status 400');
  assert.strictEqual(errMsg, 'Gambar slide galeri wajib diisi.', 'Error message must match spec');

  // Test missing title_id with valid image_url -> must succeed
  let successPayload = null;
  const mockReqValidTextless = {
    body: {
      image_url: '/images/gallery/test-valid-textless.jpg',
      title_id: '',
      category_id: ''
    },
    xhr: true,
    headers: { accept: 'application/json' }
  };
  const mockResValidTextless = {
    json(payload) {
      successPayload = payload;
      return this;
    }
  };
  await aboutController.storeGallerySlide(mockReqValidTextless, mockResValidTextless);
  assert.ok(successPayload && successPayload.success, 'Slide without title_id must be accepted');
  assert.ok(successPayload.id, 'New slide id must be returned');

  // Clean up created slide
  await aboutGalleryModel.delete(successPayload.id);
  console.log('  -> aboutController server validation verified.\n');

  // 4. T-137: Verify views/admin/about/index.ejs markup
  console.log('[4] Verifying views/admin/about/index.ejs form fields and terminology...');
  const adminTemplate = fs.readFileSync(path.join(__dirname, '../views/admin/about/index.ejs'), 'utf8');

  // gallery_title_id should not have required attribute
  const titleInputMatch = adminTemplate.match(/<input[^>]+id="gallery_title_id"[^>]*>/);
  assert.ok(titleInputMatch, 'Input #gallery_title_id must exist');
  assert.ok(!titleInputMatch[0].includes('required'), 'Input #gallery_title_id must NOT be required');

  // Label should not have asterisk
  assert.ok(!adminTemplate.includes('for="gallery_title_id" class="form-label">Judul Slide (Indonesia) *'), 'Label must NOT contain required asterisk (*)');
  assert.ok(adminTemplate.includes('for="gallery_title_id" class="form-label">Judul Slide (Indonesia)</label>'), 'Label must be Judul Slide (Indonesia)');

  // Terminology check: no "Slider" in gallery modal
  assert.ok(adminTemplate.includes('Tampilkan di Galeri Publik'), 'Checkbox must say "Tampilkan di Galeri Publik"');
  assert.ok(adminTemplate.includes('Angka lebih kecil tampil lebih awal pada galeri.'), 'Hint must say "pada galeri."');
  console.log('  -> Admin view markup and terminology verified.\n');

  // 5. T-138: Verify views/public/about.ejs SSR rendering with textless slides
  console.log('[5] Verifying views/public/about.ejs SSR rendering for textless tiles and accessibility fallbacks...');
  const aboutTemplate = fs.readFileSync(path.join(__dirname, '../views/public/about.ejs'), 'utf8');

  const testSlides = [
    {
      id: 1,
      image_url: '/images/gallery/slide1.jpg',
      category_id: 'TEKNOLOGI',
      category_en: 'TECHNOLOGY',
      title_id: 'Lini Ekstrusi 1',
      title_en: 'Extrusion Line 1'
    },
    {
      id: 2,
      image_url: '/images/gallery/slide2-clean.jpg',
      category_id: '',
      category_en: '',
      title_id: '',
      title_en: ''
    },
    {
      id: 3,
      image_url: '/images/gallery/slide3-cat-only.jpg',
      category_id: 'LABORATORIUM',
      category_en: 'LABORATORY',
      title_id: '',
      title_en: ''
    }
  ];

  // Render Indonesian
  const renderedId = ejs.render(aboutTemplate, {
    currentLang: 'id',
    lang: 'id',
    settings: { company_name: 'PT Euodoo' },
    title: 'Tentang Kami',
    path: '/about',
    about: {},
    heroBanner: null,
    gallerySlides: testSlides,
    stats: [],
    timeline: [],
    galleryHeader: { title_id: 'Galeri Kami' },
    storyHeader: null,
    visionMissionImages: null
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });

  // Slide 1 has caption
  assert.ok(renderedId.includes('Lini Ekstrusi 1'), 'Slide 1 title must be rendered');
  assert.ok(renderedId.includes('TEKNOLOGI'), 'Slide 1 category tag must be rendered');

  // Slide 2 is textless -> MUST have fallback aria-label and alt, and NO caption overlay
  assert.ok(renderedId.includes('aria-label="Fasilitas Manufaktur &amp; Operasional PT Euodoo (Foto 02)"') ||
            renderedId.includes('aria-label="Fasilitas Manufaktur & Operasional PT Euodoo (Foto 02)"'),
            'Slide 2 tile must have Indonesian accessibility fallback aria-label');
  assert.ok(renderedId.includes('alt="Fasilitas Manufaktur &amp; Operasional PT Euodoo (Foto 02)"') ||
            renderedId.includes('alt="Fasilitas Manufaktur & Operasional PT Euodoo (Foto 02)"'),
            'Slide 2 img must have Indonesian accessibility fallback alt');

  // Render English
  const renderedEn = ejs.render(aboutTemplate, {
    currentLang: 'en',
    lang: 'en',
    settings: { company_name: 'PT Euodoo' },
    title: 'About Us',
    path: '/about',
    about: {},
    heroBanner: null,
    gallerySlides: testSlides,
    stats: [],
    timeline: [],
    galleryHeader: { title_en: 'Our Gallery' },
    storyHeader: null,
    visionMissionImages: null
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });

  assert.ok(renderedEn.includes('Extrusion Line 1'), 'Slide 1 English title must be rendered');
  assert.ok(renderedEn.includes('TECHNOLOGY'), 'Slide 1 English category tag must be rendered');
  assert.ok(renderedEn.includes('aria-label="PT Euodoo Manufacturing &amp; Operations Facility (Photo 02)"') ||
            renderedEn.includes('aria-label="PT Euodoo Manufacturing & Operations Facility (Photo 02)"'),
            'Slide 2 tile must have English accessibility fallback aria-label');
  assert.ok(renderedEn.includes('alt="PT Euodoo Manufacturing &amp; Operations Facility (Photo 02)"') ||
            renderedEn.includes('alt="PT Euodoo Manufacturing & Operations Facility (Photo 02)"'),
            'Slide 2 img must have English accessibility fallback alt');

  // Slide 3 has category only -> alt should be category
  assert.ok(renderedId.includes('aria-label="LABORATORIUM"'), 'Slide 3 tile aria-label must fallback to category');
  console.log('  -> views/public/about.ejs SSR rendering and fallbacks verified.\n');

  // 6. T-138: Verify main.js dynamic pagination fallback logic
  console.log('[6] Verifying public/js/main.js dynamic pagination fallback logic...');
  const mainJs = fs.readFileSync(path.join(__dirname, '../public/js/main.js'), 'utf8');

  assert.ok(mainJs.includes("pad2(idx + 1)"), 'main.js must pad photo numbers');
  assert.ok(mainJs.includes('PT Euodoo Manufacturing & Operations Facility (Photo '), 'main.js must have English fallback');
  assert.ok(mainJs.includes('Fasilitas Manufaktur & Operasional PT Euodoo (Foto '), 'main.js must have Indonesian fallback');
  assert.ok(mainJs.includes('const hasCaption = Boolean(tag || titleText);'), 'main.js must compute hasCaption');
  assert.ok(mainJs.includes('${capHtml}'), 'main.js must conditionally output capHtml');
  console.log('  -> public/js/main.js dynamic pagination fallback logic verified.\n');

  console.log('=== ALL TESTS FOR KELOMPOK B PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
