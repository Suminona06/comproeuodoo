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
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t281');

console.log('=== TEST SUITE T-281: QA Verifikasi Visual, Fungsional & Regresi (Brands Views) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 5
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 5 (index, create, edit)...');
  const lintOutputIndex = execSync('node scripts/lint-views.js views/admin/brands/index.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputIndex.includes('0 error, 0 warning'), 'views/admin/brands/index.ejs harus 0 error & 0 warning');

  const lintOutputCreate = execSync('node scripts/lint-views.js views/admin/brands/create.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputCreate.includes('0 error, 0 warning'), 'views/admin/brands/create.ejs harus 0 error & 0 warning');

  const lintOutputEdit = execSync('node scripts/lint-views.js views/admin/brands/edit.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputEdit.includes('0 error, 0 warning'), 'views/admin/brands/edit.ejs harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Seluruh berkas Batch 5 lulus Lint Views murni (0 error, 0 warning).\n');

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

    // [3] TEST 3: Halaman Index Merek (/admin/brands)
    console.log('\n[3] Menguji Halaman Daftar Merek (/admin/brands)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}/admin/brands`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, 'Halaman /admin/brands harus status 200');

      // Verifikasi ketiadaan inline style di form section judul dan tabel
      const inlineStyleSection = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.adm-brd-card-section [style]'))
          .filter(el => {
            const attr = el.getAttribute('style');
            return attr && attr.trim().length > 0;
          })
          .map(el => el.outerHTML);
      });
      assert.strictEqual(inlineStyleSection.length, 0, `Tidak boleh ada inline style di form section judul pada ${vp.name}`);

      const inlineStyleTable = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.data-table [style]'))
          .filter(el => {
            const attr = el.getAttribute('style');
            return attr && attr.trim().length > 0;
          })
          .map(el => el.outerHTML);
      });
      assert.strictEqual(inlineStyleTable.length, 0, `Tidak boleh ada inline style di tabel merek pada ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `index-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman index merek tidak boleh overflow horizontal pada ${vp.name}`);

      // Verifikasi struktur class komponen berprefix .adm-brd-*
      const sectionCardCount = await page.locator('.adm-brd-card-section').count();
      assert.ok(sectionCardCount > 0, `Komponen .adm-brd-card-section harus hadir pada ${vp.name}`);

      const thLogoCount = await page.locator('.adm-brd-th-logo').count();
      assert.ok(thLogoCount > 0, `Header .adm-brd-th-logo harus hadir pada ${vp.name}`);
    }
    console.log('  ✓ Halaman index merek responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Halaman Tambah Merek (/admin/brands/create)
    console.log('\n[4] Menguji Halaman Tambah Merek (/admin/brands/create)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}/admin/brands/create`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, 'Halaman /admin/brands/create harus status 200');

      const formCardStyle = await page.locator('.adm-brd-form-card').getAttribute('style');
      assert.ok(!formCardStyle || formCardStyle.trim() === '', `Form card tidak boleh memiliki inline style pada ${vp.name}`);

      const previewBoxStyle = await page.locator('.adm-brd-preview-box').getAttribute('style');
      assert.ok(!previewBoxStyle || previewBoxStyle.trim() === '', `Preview box tidak boleh memiliki inline style pada ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `create-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman create merek tidak boleh overflow horizontal pada ${vp.name}`);

      const hasCard = await page.locator('.adm-brd-form-card').isVisible();
      assert.ok(hasCard, `Form card .adm-brd-form-card harus hadir pada ${vp.name}`);
    }

    // Uji submit pembuatan merek baru
    console.log('  Menguji submit pembuatan merek baru...');
    await page.fill('#name', 'Merek QA Test Euodoo');
    await page.fill('#sort_order', '99');
    await page.evaluate(() => {
      document.getElementById('brand_logo_url').value = '/uploads/brands/test-qa.webp';
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);
    console.log('  ✓ Form create merek berhasil di-submit.');

    // Cari baris merek yang baru dibuat di index
    await page.goto(`${baseUrl}/admin/brands`, { waitUntil: 'networkidle' });
    const createdRow = page.locator('tr:has-text("Merek QA Test Euodoo")');
    assert.ok(await createdRow.count() > 0, 'Baris merek baru harus tampil pada halaman index');

    // Ambil edit URL
    const editLink = createdRow.locator('a.btn-action-edit');
    const editUrl = await editLink.getAttribute('href');
    assert.ok(editUrl, 'URL edit merek harus valid');

    // [5] TEST 5: Halaman Edit Merek (/admin/brands/:id/edit)
    console.log(`\n[5] Menguji Halaman Edit Merek (${editUrl})...`);
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}${editUrl}`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, `Halaman edit merek (${editUrl}) harus status 200`);

      const formCardStyle = await page.locator('.adm-brd-form-card').getAttribute('style');
      assert.ok(!formCardStyle || formCardStyle.trim() === '', `Form card edit tidak boleh memiliki inline style pada ${vp.name}`);

      const previewBoxStyle = await page.locator('.adm-brd-preview-box').getAttribute('style');
      assert.ok(!previewBoxStyle || previewBoxStyle.trim() === '', `Preview box edit tidak boleh memiliki inline style pada ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `edit-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman edit merek tidak boleh overflow horizontal pada ${vp.name}`);
    }

    // Perbarui merek
    await page.fill('#name', 'Merek QA Test Updated');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);
    console.log('  ✓ Pembaruan data merek via form edit berhasil.');

    // [6] TEST 6: Uji Toggle Status, Pengaturan Judul Section & Hapus Merek
    console.log('\n[6] Menguji toggle status, update judul section beranda & hapus merek...');
    await page.goto(`${baseUrl}/admin/brands`, { waitUntil: 'networkidle' });

    // Update Section Title
    await page.fill('#home_brand_title_id', 'Merek Resmi Terdaftar QA');
    await page.fill('#home_brand_title_en', 'Official Registered Brands QA');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('.adm-brd-section-actions button[type="submit"]')
    ]);
    const valId = await page.inputValue('#home_brand_title_id');
    assert.strictEqual(valId, 'Merek Resmi Terdaftar QA', 'Judul section ID harus tersimpan');

    // Toggle status merek yang baru dibuat
    const updatedRow = page.locator('tr:has-text("Merek QA Test Updated")');
    assert.ok(await updatedRow.count() > 0, 'Baris merek terupdate harus ditemukan');
    const toggleBtn = updatedRow.locator('.btn-action-status');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      toggleBtn.click()
    ]);
    console.log('  ✓ Toggle status merek berhasil dijalankan.');

    // Hapus merek pengujian
    const brandToDelete = page.locator('tr:has-text("Merek QA Test Updated")');
    const deleteForm = brandToDelete.locator('form[action*="/delete"]');
    const deleteAction = await deleteForm.getAttribute('action');
    await page.evaluate((action) => {
      const form = document.querySelector(`form[action="${action}"]`);
      if (form) form.submit();
    }, deleteAction);
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    const deletedRow = page.locator('tr:has-text("Merek QA Test Updated")');
    assert.strictEqual(await deletedRow.count(), 0, 'Merek yang dihapus harus tidak ada lagi');
    console.log('  ✓ Merek uji coba berhasil dihapus dan dibersihkan.');

    // [7] TEST 7: Konsol Browser & Page Errors Check
    console.log('\n[7] Memeriksa integritas konsol JavaScript browser...');
    if (consoleErrors.length > 0) {
      console.error('  Ditemukan console error:', consoleErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, `Harus 0 error konsol browser! Ditemukan: ${consoleErrors.length}`);
    assert.strictEqual(pageErrors.length, 0, `Harus 0 page errors! Ditemukan: ${pageErrors.length}`);
    console.log('  ✓ Nol error konsol browser pada seluruh pengujian.');

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 5 (T-281) LULUS 100%!');
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
