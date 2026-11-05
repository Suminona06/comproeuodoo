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
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t282');

console.log('=== TEST SUITE T-282: QA Verifikasi Visual, Fungsional & Regresi (Capabilities & Contact Views) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 6
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 6 (capabilities, contact)...');
  const lintOutputCap = execSync('node scripts/lint-views.js views/admin/capabilities/index.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputCap.includes('0 error, 0 warning'), 'views/admin/capabilities/index.ejs harus 0 error & 0 warning');

  const lintOutputCtc = execSync('node scripts/lint-views.js views/admin/contact/index.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputCtc.includes('0 error, 0 warning'), 'views/admin/contact/index.ejs harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Seluruh berkas Batch 6 lulus Lint Views murni (0 error, 0 warning).\n');

  // [2] TEST 2: Start Dynamic HTTP Server & Launch Playwright
  console.log('[2] Membuka server pengujian lokal & browser Playwright...');
  const server = http.createServer(app);
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

    // [3] TEST 3: Halaman Kapabilitas Fasilitas Mesin (/admin/capabilities)
    console.log('\n[3] Menguji Halaman Kapabilitas Mesin (/admin/capabilities)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}/admin/capabilities`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, 'Halaman /admin/capabilities harus status 200');

      // Verifikasi ketiadaan inline style
      const inlineStyleGrid = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.adm-cap-grid [style]'))
          .filter(el => {
            const attr = el.getAttribute('style');
            return attr && attr.trim().length > 0;
          })
          .map(el => el.outerHTML);
      });
      assert.strictEqual(inlineStyleGrid.length, 0, `Tidak boleh ada inline style di form/tabel kapabilitas pada ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `capabilities-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman kapabilitas tidak boleh overflow horizontal pada ${vp.name}`);

      const hasGrid = await page.locator('.adm-cap-grid').count();
      assert.ok(hasGrid > 0, `Komponen .adm-cap-grid harus hadir pada ${vp.name}`);

      const hasThOrder = await page.locator('.adm-cap-th-order').count();
      assert.ok(hasThOrder > 0, `Header .adm-cap-th-order harus hadir pada ${vp.name}`);
    }
    console.log('  ✓ Halaman kapabilitas responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Uji Operasi Tambah & Hapus Kapabilitas Mesin
    console.log('\n[4] Menguji Tambah & Hapus Kapabilitas Mesin...');
    await page.fill('#title_id', 'Mesin Extruder Blow Film HDPE QA');
    await page.fill('#title_en', 'HDPE Blow Film Extruder QA Machine');
    await page.fill('#machine_type', 'Extrusion Blow Film 65mm');
    await page.fill('#capacity', '120 Ton / Bulan');
    await page.fill('#sort_order', '88');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    await page.goto(`${baseUrl}/admin/capabilities`, { waitUntil: 'networkidle' });
    const createdRow = page.locator('tr:has-text("Mesin Extruder Blow Film HDPE QA")');
    assert.ok(await createdRow.count() > 0, 'Data kapabilitas baru harus tampil di tabel');
    console.log('  ✓ Kapabilitas baru berhasil disimpan dan tampil di tabel.');

    // Hapus data uji
    const deleteForm = createdRow.locator('form[action*="/delete"]');
    const deleteAction = await deleteForm.getAttribute('action');
    await page.evaluate((action) => {
      const form = document.querySelector(`form[action="${action}"]`);
      if (form) form.submit();
    }, deleteAction);
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    const deletedRow = page.locator('tr:has-text("Mesin Extruder Blow Film HDPE QA")');
    assert.strictEqual(await deletedRow.count(), 0, 'Data kapabilitas yang dihapus harus tidak ada lagi');
    console.log('  ✓ Kapabilitas uji coba berhasil dihapus.');

    // [5] TEST 5: Halaman CMS Konten Kontak (/admin/contact)
    console.log('\n[5] Menguji Halaman CMS Konten Kontak (/admin/contact)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}/admin/contact`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, 'Halaman /admin/contact harus status 200');

      // Verifikasi ketiadaan inline style di banner info dan sticky actions
      const inlineStyleBanner = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.adm-ctc-info-banner [style], .settings-sticky-actions [style]'))
          .filter(el => {
            const attr = el.getAttribute('style');
            return attr && attr.trim().length > 0;
          })
          .map(el => el.outerHTML);
      });
      assert.strictEqual(inlineStyleBanner.length, 0, `Tidak boleh ada inline style di banner/actions kontak pada ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `contact-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman CMS kontak tidak boleh overflow horizontal pada ${vp.name}`);

      const hasBanner = await page.locator('.adm-ctc-info-banner').isVisible();
      assert.ok(hasBanner, `Info banner .adm-ctc-info-banner harus hadir pada ${vp.name}`);

      const hasStatusDot = await page.locator('.adm-ctc-status-dot').isVisible();
      assert.ok(hasStatusDot, `Status dot .adm-ctc-status-dot harus hadir pada ${vp.name}`);
    }
    console.log('  ✓ Halaman kontak responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [6] TEST 6: Uji Pembaruan Form Konten Kontak
    console.log('\n[6] Menguji Pembaruan Konten Kontak...');
    const initialHoursId = await page.inputValue('#contact_working_hours_id');
    const initialHoursEn = await page.inputValue('#contact_working_hours_en');
    const initialTitleId = await page.inputValue('#contact_form_title_id');
    const initialTitleEn = await page.inputValue('#contact_form_title_en');

    await page.fill('#contact_working_hours_id', 'Senin - Jumat: 08.00 - 17.00 WIB (QA Test)');
    await page.fill('#contact_working_hours_en', 'Monday - Friday: 08:00 - 17:00 WIB (QA Test)');
    await page.fill('#contact_form_title_id', 'Konsultasi & Permintaan Penawaran Cepat');
    await page.fill('#contact_form_title_en', 'Fast Quotation & Consultation Request');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    const updatedHoursId = await page.inputValue('#contact_working_hours_id');
    assert.strictEqual(updatedHoursId, 'Senin - Jumat: 08.00 - 17.00 WIB (QA Test)', 'Jam kerja ID harus terupdate');
    const updatedTitleId = await page.inputValue('#contact_form_title_id');
    assert.strictEqual(updatedTitleId, 'Konsultasi & Permintaan Penawaran Cepat', 'Judul formulir harus terupdate');

    // Restore original values
    await page.fill('#contact_working_hours_id', initialHoursId || 'Senin - Jumat: 08.00 - 17.00 WIB');
    await page.fill('#contact_working_hours_en', initialHoursEn || 'Monday - Friday: 08:00 - 17:00 WIB');
    await page.fill('#contact_form_title_id', initialTitleId || 'Konsultasi & Permintaan Penawaran');
    await page.fill('#contact_form_title_en', initialTitleEn || 'Consultation & Request for Quotation');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);
    console.log('  ✓ Formulir konten kontak berhasil disimpan, diverifikasi, dan data asli dipulihkan.');

    // [7] TEST 7: Konsol Browser & Page Errors Check
    console.log('\n[7] Memeriksa integritas konsol JavaScript browser...');
    if (consoleErrors.length > 0) {
      console.error('  Ditemukan console error:', consoleErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, `Harus 0 error konsol browser! Ditemukan: ${consoleErrors.length}`);
    assert.strictEqual(pageErrors.length, 0, `Harus 0 page errors! Ditemukan: ${pageErrors.length}`);
    console.log('  ✓ Nol error konsol browser pada seluruh pengujian.');

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 6 (T-282) LULUS 100%!');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verifikasi GAGAL:', err);
  process.exit(1);
});

