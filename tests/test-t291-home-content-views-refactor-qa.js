import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import homeContentModel from '../models/homeContentModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/9f11355d-9552-45f1-9bf5-7218dad8c8aa';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t291');

console.log('=== TEST SUITE T-291: QA Verifikasi Visual, Modularisasi & Fungsional (Home Content Views Refactor) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 15
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 15 (views/admin/home-content/)...');
  const lintOutput = execSync('node scripts/lint-views.js views/admin/home-content/', { encoding: 'utf-8' });
  assert.ok(lintOutput.includes('0 error, 0 warning'), 'views/admin/home-content/ harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Berkas Batch 15 lulus Lint Views murni (0 error, 0 warning).\n');

  // [2] TEST 2: Modular Partials Line Count Verification (Must be <= 100 lines each)
  console.log('[2] Memverifikasi batasan ukuran partials (maksimal <= 100 baris)...');
  const partialsDir = path.resolve('views/admin/home-content/partials');
  const partialFiles = fs.readdirSync(partialsDir).filter(f => f.endsWith('.ejs'));
  assert.ok(partialFiles.length >= 6, 'Harus memiliki minimal 6 berkas partials');

  for (const pf of partialFiles) {
    const fullPath = path.join(partialsDir, pf);
    const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
    console.log(`    - ${pf}: ${lineCount} baris`);
    assert.ok(lineCount <= 100, `Berkas partials ${pf} (${lineCount} baris) melebihi batas 100 baris!`);
  }
  console.log('  ✓ Seluruh 6 berkas partials mematuhi batas <= 100 baris.\n');

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
    // [4] TEST 4: Render /admin/home-content di 4 Viewport
    console.log('\n[4] Menguji Render Form Homepage (/admin/home-content) di 4 Viewport...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/home-content`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman home-content harus status 200 pada ${vp.name}`);

      const inlineStyleCount = await page.evaluate(() => {
        return document.querySelectorAll('.about-glass-card [style], .about-sticky-actions [style], .adm-home-slot-card [style]').length;
      });
      assert.strictEqual(inlineStyleCount, 0, `Tidak boleh ada inline style pada form home-content di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `home-content-index-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman home-content tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Halaman konten beranda responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [5] TEST 5: Uji Tab Switching ke 5 Panel Tab
    console.log('\n[5] Menguji Tab Switching ke 5 Panel Tab...');
    await page.setViewportSize({ width: 1280, height: 800 });

    const tabs = [
      { id: 'tab-home-intro', label: '1. Intro Homepage', screenshot: 'home-content-tab-intro-1280.png' },
      { id: 'tab-home-wcu', label: '2. Kenapa Memilih Kami', screenshot: 'home-content-tab-wcu-1280.png' },
      { id: 'tab-home-categories', label: '3. 4 Kategori Beranda', screenshot: 'home-content-tab-categories-1280.png' },
      { id: 'tab-home-certs', label: '4. Sertifikasi Mutu', screenshot: 'home-content-tab-certs-1280.png' },
      { id: 'tab-home-cta', label: '5. CTA Global Pre-Footer', screenshot: 'home-content-tab-cta-1280.png' }
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

    // [6] TEST 6: Form Update dan Verifikasi Database
    console.log('\n[6] Menguji Pembaruan Formulir dan Sinkronisasi Basis Data...');

    // Tab 1: Update Intro Title
    await page.click('.about-tab-btn[data-tab="tab-home-intro"]');
    const updatedIntroTitle = 'Dedikasi Manufaktur Plastik Mutu Tinggi Sejak 1990 QA T291';
    await page.fill('#intro_title_id', updatedIntroTitle);

    // Tab 2: Update WCU Eyebrow
    await page.click('.about-tab-btn[data-tab="tab-home-wcu"]');
    const updatedWcuEyebrow = 'Inovasi Hijau Masa Depan QA T291';
    await page.fill('#wcu_eyebrow_id', updatedWcuEyebrow);

    // Tab 3: Update Categories Subtitle
    await page.click('.about-tab-btn[data-tab="tab-home-categories"]');
    const updatedCatTitle = 'Produk Kemasan Unggulan PT Euodoo QA T291';
    await page.fill('#cat_title_id', updatedCatTitle);

    // Tab 4: Update Certs Title
    await page.click('.about-tab-btn[data-tab="tab-home-certs"]');
    const updatedCertTitle = 'Sertifikasi & Standar Mutu QA T291';
    await page.fill('#cert_title_id', updatedCertTitle);

    // Tab 5: Update CTA Title
    await page.click('.about-tab-btn[data-tab="tab-home-cta"]');
    const updatedCtaTitle = 'Siap Berkolaborasi Bersama Kami? QA T291';
    await page.fill('#cta_title_id', updatedCtaTitle);

    // Submit form (Save all 5 tabs in one click)
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    // Verifikasi data tersimpan di DB
    const freshDbData = await homeContentModel.getHomeContentData();

    assert.strictEqual(freshDbData.intro.title_id, updatedIntroTitle, 'Intro title_id di database harus terupdate');
    assert.strictEqual(freshDbData.why_choose_us.eyebrow_id, updatedWcuEyebrow, 'WCU eyebrow_id di database harus terupdate');
    assert.strictEqual(freshDbData.categories.title_id, updatedCatTitle, 'Categories title_id di database harus terupdate');
    assert.strictEqual(freshDbData.certifications.title_id, updatedCertTitle, 'Certifications title_id di database harus terupdate');
    assert.strictEqual(freshDbData.cta.title_id, updatedCtaTitle, 'CTA title_id di database harus terupdate');

    console.log('  ✓ Seluruh 5 panel tab berhasil diperbarui dan sinkron dengan basis data!');

  } finally {
    await browser.close();
    server.close();
  }

  // [7] TEST 7: Browser Console & Page Error Checks
  console.log('\n[7] Verifikasi Log Konsol Browser...');
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }
  if (pageErrors.length > 0) {
    console.error('Page errors:', pageErrors);
  }
  assert.strictEqual(consoleErrors.length, 0, 'Tidak boleh ada error konsol browser selama pengujian');
  assert.strictEqual(pageErrors.length, 0, 'Tidak boleh ada error halaman (unhandled exception) selama pengujian');
  console.log('  ✓ 0 browser console errors & 0 page errors.');

  console.log('\n=== SELURUH GERBANG KUALITAS T-291 LULUS 100%! ===');
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verification GAGAL:', err);
  process.exit(1);
});

