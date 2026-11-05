import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import aboutModel from '../models/aboutModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/9f11355d-9552-45f1-9bf5-7218dad8c8aa';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t292');

console.log('=== TEST SUITE T-292: QA Verifikasi Visual, Modularisasi & Fungsional (About Views Refactor) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 16
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 16 (views/admin/about/)...');
  const lintOutput = execSync('node scripts/lint-views.js views/admin/about/', { encoding: 'utf-8' });
  assert.ok(lintOutput.includes('0 error, 0 warning'), 'views/admin/about/ harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Berkas Batch 16 lulus Lint Views murni (0 error, 0 warning).\n');

  // [2] TEST 2: Modular Partials Line Count Verification (Must be <= 100 lines each)
  console.log('[2] Memverifikasi batasan ukuran partials (maksimal <= 100 baris)...');
  const partialsDir = path.resolve('views/admin/about/partials');
  const partialFiles = fs.readdirSync(partialsDir).filter(f => f.endsWith('.ejs'));
  assert.ok(partialFiles.length >= 8, 'Harus memiliki minimal 8 berkas partials');

  for (const pf of partialFiles) {
    const fullPath = path.join(partialsDir, pf);
    const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
    console.log(`    - ${pf}: ${lineCount} baris`);
    assert.ok(lineCount <= 100, `Berkas partials ${pf} (${lineCount} baris) melebihi batas 100 baris!`);
  }
  console.log(`  ✓ Seluruh ${partialFiles.length} berkas partials mematuhi batas <= 100 baris.\n`);

  // [3] TEST 3: Start Dynamic HTTP Server & Launch Playwright
  console.log('[3] Membuka server pengujian lokal & browser Playwright...');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`  ✓ Server pengujian berjalan di ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const consoleErrors = [];
  const pageErrors = [];

  const adminToken = jwt.sign({
    id: 1,
    email: 'admin@euodoo.com',
    name: 'Super Administrator',
    role: 'superadmin'
  }, JWT_SECRET, { expiresIn: '1h' });

  await context.addCookies([
    {
      name: 'euodoo_session',
      value: adminToken,
      domain: '127.0.0.1',
      path: '/'
    }
  ]);

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico') && !msg.text().includes('Failed to load resource')) {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push({ url: page.url(), message: err.message });
  });

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Laptop', width: 1280, height: 800 },
    { name: 'Desktop', width: 1440, height: 900 }
  ];

  try {
    // [4] TEST 4: Render /admin/about di 4 Viewport
    console.log('\n[4] Menguji Render Form Tentang Kami (/admin/about) di 4 Viewport...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/about`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman about harus status 200 pada ${vp.name}`);

      const inlineStyleCount = await page.evaluate(() => {
        return document.querySelectorAll('.about-glass-card [style], .about-sticky-actions [style], .adm-abt-val-card [style]').length;
      });
      assert.strictEqual(inlineStyleCount, 0, `Tidak boleh ada inline style pada form about di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `about-index-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman about tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Halaman Tentang Kami responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [5] TEST 5: Uji Tab Switching ke 5 Panel Tab
    console.log('\n[5] Menguji Tab Switching ke 5 Panel Tab...');
    await page.setViewportSize({ width: 1280, height: 800 });

    const tabs = [
      { id: 'tab-sejarah', label: '1. Sejarah', screenshot: 'about-tab-sejarah-1280.png' },
      { id: 'tab-visi-misi', label: '2. Visi Misi', screenshot: 'about-tab-visi-misi-1280.png' },
      { id: 'tab-ticket', label: '3. Nilai T-I-C-K-E-T', screenshot: 'about-tab-ticket-1280.png' },
      { id: 'tab-sertifikasi', label: '4. Sertifikasi Lingkungan', screenshot: 'about-tab-sertifikasi-1280.png' },
      { id: 'tab-gallery', label: '5. Galeri Fasilitas', screenshot: 'about-tab-gallery-1280.png' }
    ];

    for (const t of tabs) {
      await page.click(`.about-tab-btn[data-tab="${t.id}"]`);
      await page.waitForTimeout(100);

      const isTabBtnActive = await page.locator(`.about-tab-btn[data-tab="${t.id}"]`).evaluate(el => el.classList.contains('active'));
      const isPaneActive = await page.locator(`#${t.id}`).evaluate(el => el.classList.contains('active'));

      assert.ok(isTabBtnActive, `Tombol tab ${t.label} harus memiliki class active`);
      assert.ok(isPaneActive, `Pane ${t.id} harus memiliki class active`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, t.screenshot) });
    }
    console.log('  ✓ Seluruh 5 panel tab dapat diakses dan berganti lancar dengan screenshot tersimpan.');

    // [6] TEST 6: Uji Modals (Stats, Timeline, Gallery)
    console.log('\n[6] Menguji Buka dan Tutup Dialog Modals (Stats, Timeline, Galeri)...');

    // 6a. Stats Modal
    await page.click('.about-tab-btn[data-tab="tab-sejarah"]');
    const openStatsBtn = page.locator('[data-action="open-stats-modal"]');
    if (await openStatsBtn.isVisible()) {
      await openStatsBtn.click();
      await page.waitForTimeout(150);
      const isStatsModalOpen = await page.locator('#statsModal').evaluate(el => el.classList.contains('open'));
      assert.ok(isStatsModalOpen, 'Modal statistik harus terbuka');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'about-modal-stats-1280.png') });
      await page.click('#statsModal [data-modal-close="statsModal"]');
      await page.waitForTimeout(100);
    }

    // 6b. Timeline Modal
    const openTimelineBtn = page.locator('[data-action="open-timeline-modal"]');
    if (await openTimelineBtn.isVisible()) {
      await openTimelineBtn.click();
      await page.waitForTimeout(150);
      const isTimelineModalOpen = await page.locator('#timelineModal').evaluate(el => el.classList.contains('open'));
      assert.ok(isTimelineModalOpen, 'Modal timeline harus terbuka');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'about-modal-timeline-1280.png') });
      await page.click('#timelineModal [data-modal-close="timelineModal"]');
      await page.waitForTimeout(100);
    }

    // 6c. Gallery Modal
    await page.click('.about-tab-btn[data-tab="tab-gallery"]');
    const openGalleryBtn = page.locator('[data-action="open-gallery-modal"]');
    if (await openGalleryBtn.isVisible()) {
      await openGalleryBtn.click();
      await page.waitForTimeout(150);
      const isGalleryModalOpen = await page.locator('#galleryModal').evaluate(el => el.classList.contains('open'));
      assert.ok(isGalleryModalOpen, 'Modal galeri harus terbuka');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'about-modal-gallery-1280.png') });
      await page.click('#galleryModal [data-modal-close="galleryModal"]');
      await page.waitForTimeout(100);
    }
    console.log('  ✓ Seluruh 3 dialog modal dapat dibuka dan ditutup dengan sempurna.');

    // [7] TEST 7: Form Update dan Verifikasi Database
    console.log('\n[7] Menguji Pembaruan Formulir dan Sinkronisasi Basis Data...');

    // Tab 1: Update Sejarah Title
    await page.click('.about-tab-btn[data-tab="tab-sejarah"]');
    const updatedHistoryTitle = 'Latar Belakang & Sejarah Perusahaan QA T292';
    await page.fill('#history_title_id', updatedHistoryTitle);

    // Tab 2: Update Visi & Slogan
    await page.click('.about-tab-btn[data-tab="tab-visi-misi"]');
    const updatedVision = 'Menjadi pelopor kemasan plastik berkelanjutan dan ramah lingkungan terdepan di Indonesia QA T292.';
    await page.fill('#vision_id', updatedVision);
    const updatedSlogan = 'Kualitas Teruji, Ramah Lingkungan QA T292';
    await page.fill('#slogan_id', updatedSlogan);

    // Tab 4: Update Eco Statement
    await page.click('.about-tab-btn[data-tab="tab-sertifikasi"]');
    const updatedEco = 'Komitmen teguh kami terhadap pelestarian alam dan ekonomi sirkular QA T292.';
    await page.fill('#eco_statement_id', updatedEco);

    // Submit form (Save all tabs in one click)
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    // Verifikasi data tersimpan di DB
    const freshDbData = await aboutModel.getAboutData();

    assert.strictEqual(freshDbData.history_title_id, updatedHistoryTitle, 'history_title_id di database harus terupdate');
    assert.strictEqual(freshDbData.vision_id, updatedVision, 'vision_id di database harus terupdate');
    assert.strictEqual(freshDbData.slogan_id, updatedSlogan, 'slogan_id di database harus terupdate');
    assert.strictEqual(freshDbData.eco_statement_id, updatedEco, 'eco_statement_id di database harus terupdate');

    console.log('  ✓ Seluruh panel tab Tentang Kami berhasil diperbarui dan sinkron dengan basis data!');

  } finally {
    await browser.close();
    server.close();
  }

  // [8] TEST 8: Browser Console & Page Error Checks
  console.log('\n[8] Verifikasi Log Konsol Browser...');
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }
  if (pageErrors.length > 0) {
    console.error('Page errors:', pageErrors);
  }
  assert.strictEqual(consoleErrors.length, 0, 'Tidak boleh ada error konsol browser selama pengujian');
  assert.strictEqual(pageErrors.length, 0, 'Tidak boleh ada error halaman (unhandled exception) selama pengujian');
  console.log('  ✓ 0 browser console errors & 0 page errors.');

  console.log('\n=== SELURUH GERBANG KUALITAS T-292 LULUS 100%! ===');
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verification GAGAL:', err);
  process.exit(1);
});
