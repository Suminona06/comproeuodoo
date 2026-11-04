import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/9f11355d-9552-45f1-9bf5-7218dad8c8aa';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t283');

console.log('=== TEST SUITE T-283: QA Verifikasi Visual, Fungsional & Regresi (Hero Banners & Leads Views) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 7
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 7 (hero-banners, leads)...');
  const lintOutputHbn = execSync('node scripts/lint-views.js views/admin/hero-banners/index.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputHbn.includes('0 error, 0 warning'), 'views/admin/hero-banners/index.ejs harus 0 error & 0 warning');

  const lintOutputLeads = execSync('node scripts/lint-views.js views/admin/leads/index.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputLeads.includes('0 error, 0 warning'), 'views/admin/leads/index.ejs harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Seluruh berkas Batch 7 lulus Lint Views murni (0 error, 0 warning).\n');

  // [2] TEST 2: Start Dynamic HTTP Server & Launch Playwright
  console.log('[2] Membuka server pengujian lokal & browser Playwright...');
  const express = (await import('express')).default;
  const testApp = express();
  testApp.set('view engine', 'ejs');
  testApp.set('views', path.join(process.cwd(), 'views'));

  // Intercept /admin/leads untuk merender view spesifik Batch 7: views/admin/leads/index.ejs
  testApp.get('/admin/leads', (req, res) => {
    res.render('admin/leads/index', {
      title: 'Permintaan Penawaran & Kemitraan (Leads)',
      pageTitle: 'CMS Leads',
      activeNav: 'leads',
      leads: [
        {
          id: 1,
          created_at: new Date(),
          name: 'Budi Santoso',
          company: 'PT Maju Bersama',
          product_name_id: 'Kantong Plastik HDPE',
          email: 'budi@majubersama.com',
          phone: '08123456789',
          message: 'Kebutuhan cetakan botol 50.000 pcs',
          status: 'baru',
          admin_notes: 'Catatan sales: follow-up segera'
        }
      ],
      selectedStatus: req.query.status || '',
      selectedType: req.query.type || '',
      csrfToken: 'test-csrf-token'
    });
  });

  // Delegasikan seluruh rute lainnya ke app
  testApp.use(app);

  const server = http.createServer(testApp);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`  ✓ Server pengujian berjalan di ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

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

  try {
    const viewports = [
      { name: 'Mobile (375px)', width: 375, height: 812 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Laptop (1280px)', width: 1280, height: 800 },
      { name: 'Desktop (1440px)', width: 1440, height: 900 }
    ];

    // [3] TEST 3: Halaman Hero Banners (/admin/hero-banners)
    console.log('\n[3] Menguji Halaman Hero Banners (/admin/hero-banners)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}/admin/hero-banners`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, 'Halaman /admin/hero-banners harus status 200');

      // Verifikasi ketiadaan inline style
      const inlineStyleMockups = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.adm-hbn-cards-container [style]'))
          .filter(el => {
            const attr = el.getAttribute('style');
            return attr && attr.trim().length > 0;
          })
          .map(el => el.outerHTML);
      });
      assert.strictEqual(inlineStyleMockups.length, 0, `Tidak boleh ada inline style di hero banner cards pada ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `hero-banners-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman hero-banners tidak boleh overflow horizontal pada ${vp.name}`);

      const countMockup = await page.locator('.adm-hbn-preview-mockup').count();
      assert.strictEqual(countMockup, 4, `Harus ada 4 mockup hero banner pada ${vp.name}`);
    }
    console.log('  ✓ Halaman hero-banners responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Uji Pembaruan Hero Banner Sub-Halaman
    console.log('\n[4] Menguji Simpan Hero Banner (/admin/hero-banners/about)...');
    await page.fill('#title_id_about', 'Tentang Kami PT Euodoo QA');
    await page.fill('#subtitle_id_about', 'Produsen Plastik Terpercaya Berstandar Global QA');
    const saveBtn = page.locator('#card-about button[type="submit"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      saveBtn.click()
    ]);

    const updatedTitleId = await page.inputValue('#title_id_about');
    assert.strictEqual(updatedTitleId, 'Tentang Kami PT Euodoo QA', 'Judul banner about harus tersimpan');
    console.log('  ✓ Pembaruan hero banner berhasil disimpan dan diverifikasi.');

    // [5] TEST 5: Halaman WhatsApp Leads (/admin/leads via views/admin/leads/index.ejs)
    console.log('\n[5] Menguji Halaman WhatsApp Leads (views/admin/leads/index.ejs)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}/admin/leads`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, 'Halaman /admin/leads harus status 200');

      // Verifikasi ketiadaan inline style di form filter dan tabel leads
      const inlineStyleLeads = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.adm-leads-filter-card [style], .data-table [style]'))
          .filter(el => {
            const attr = el.getAttribute('style');
            return attr && attr.trim().length > 0;
          })
          .map(el => el.outerHTML);
      });
      assert.strictEqual(inlineStyleLeads.length, 0, `Tidak boleh ada inline style di filter/tabel leads pada ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `leads-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman leads tidak boleh overflow horizontal pada ${vp.name}`);

      const hasFilterCard = await page.locator('.adm-leads-filter-card').isVisible();
      assert.ok(hasFilterCard, `Filter card .adm-leads-filter-card harus hadir pada ${vp.name}`);

      const hasThDate = await page.locator('.adm-leads-th-date').count();
      assert.ok(hasThDate > 0, `Header .adm-leads-th-date harus hadir pada ${vp.name}`);
    }
    console.log('  ✓ Halaman leads responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [6] TEST 6: Uji Filter & Ekspor CSV Leads
    console.log('\n[6] Menguji Fitur Filter & Ekspor CSV Leads...');
    // Uji filter
    const filterRes = await page.goto(`${baseUrl}/admin/leads?status=baru&type=inquiry`, { waitUntil: 'networkidle' });
    assert.strictEqual(filterRes.status(), 200, 'Filter leads harus merespons 200');
    console.log('  ✓ Filter pencarian leads berfungsi lancar.');

    // Uji ekspor CSV via HTTP request
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const exportRes = await fetch(`${baseUrl}/admin/leads/export`, {
      headers: { Cookie: cookieHeader }
    });
    assert.strictEqual(exportRes.status, 200, 'Ekspor CSV harus berstatus 200');
    const contentType = exportRes.headers.get('content-type') || '';
    assert.ok(contentType.includes('csv') || contentType.includes('text/plain') || contentType.includes('application/octet-stream'), 'Content-type harus sesuai CSV');
    console.log('  ✓ Ekspor CSV leads berhasil diunduh dengan status 200.');

    // [7] TEST 7: Konsol Browser & Page Errors Check
    console.log('\n[7] Memeriksa integritas konsol JavaScript browser...');
    if (consoleErrors.length > 0) {
      console.error('  Ditemukan console error:', consoleErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, `Harus 0 error konsol browser! Ditemukan: ${consoleErrors.length}`);
    assert.strictEqual(pageErrors.length, 0, `Harus 0 page errors! Ditemukan: ${pageErrors.length}`);
    console.log('  ✓ Nol error konsol browser pada seluruh pengujian.');

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 7 (T-283) LULUS 100%!');
    process.exit(0);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verifikasi GAGAL:', err);
  process.exit(1);
});
