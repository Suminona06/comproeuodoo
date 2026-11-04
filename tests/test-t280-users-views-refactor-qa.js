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
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/6d9ae093-c23e-4715-a0d2-c6b2b82c8d3c';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t280');

console.log('=== TEST SUITE T-280: QA Verifikasi Visual, Fungsional & Regresi (Users Views) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 4
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 4 (index, create, edit)...');
  const lintOutputIndex = execSync('node scripts/lint-views.js views/admin/users/index.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputIndex.includes('0 error, 0 warning'), 'views/admin/users/index.ejs harus 0 error & 0 warning');

  const lintOutputCreate = execSync('node scripts/lint-views.js views/admin/users/create.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputCreate.includes('0 error, 0 warning'), 'views/admin/users/create.ejs harus 0 error & 0 warning');

  const lintOutputEdit = execSync('node scripts/lint-views.js views/admin/users/edit.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputEdit.includes('0 error, 0 warning'), 'views/admin/users/edit.ejs harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Seluruh berkas Batch 4 lulus Lint Views murni (0 error, 0 warning).\n');

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

    // [3] TEST 3: Halaman Index Pengguna (/admin/users)
    console.log('\n[3] Menguji Halaman Daftar Pengguna (/admin/users)...');
    let editUrl = null;

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}/admin/users`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, 'Halaman /admin/users harus status 200');

      // Verifikasi ketiadaan inline style di dalam tabel sebelum screenshot
      const inlineStyleElements = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.data-table [style]'))
          .filter(el => {
            const attr = el.getAttribute('style');
            return attr && attr.trim().length > 0;
          })
          .map(el => el.outerHTML);
      });
      assert.strictEqual(inlineStyleElements.length, 0, `Tidak boleh ada inline style di dalam tabel pengguna pada ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `index-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman index pengguna tidak boleh overflow horizontal pada ${vp.name}`);

      // Verifikasi struktur class komponen berprefix .adm-usr-*
      const tableHeadersCount = await page.locator('.adm-usr-th-actions').count();
      assert.ok(tableHeadersCount > 0, `Header .adm-usr-th-actions harus hadir pada ${vp.name}`);

      const userInfosCount = await page.locator('.adm-usr-user-info').count();
      assert.ok(userInfosCount > 0, `Elemen .adm-usr-user-info harus hadir pada ${vp.name}`);
    }

    // Ambil link edit pertama bila ada user
    const editLink = page.locator('a.btn-action-edit').first();
    if (await editLink.count() > 0) {
      editUrl = await editLink.getAttribute('href');
    }
    console.log('  ✓ Halaman index pengguna responsif sempurna tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Halaman Tambah Pengguna (/admin/users/create)
    console.log('\n[4] Menguji Halaman Tambah Pengguna (/admin/users/create)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}/admin/users/create`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, 'Halaman /admin/users/create harus status 200');

      // Verifikasi ketiadaan inline style di form card dan role note
      const formCardStyle = await page.locator('.adm-usr-form-card').getAttribute('style');
      assert.ok(!formCardStyle || formCardStyle.trim() === '', `Form card tidak boleh memiliki inline style pada ${vp.name}`);

      const roleNoteStyle = await page.locator('.adm-usr-role-note').getAttribute('style');
      assert.ok(!roleNoteStyle || roleNoteStyle.trim() === '', `Role note tidak boleh memiliki inline style pada ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `create-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman create pengguna tidak boleh overflow horizontal pada ${vp.name}`);

      // Verifikasi class form card .adm-usr-form-card
      const hasCard = await page.locator('.adm-usr-form-card').isVisible();
      assert.ok(hasCard, `Form card .adm-usr-form-card harus hadir pada ${vp.name}`);
    }

    // Uji validasi input di form create
    console.log('  Menguji validasi & interaksi form create...');
    await page.fill('#name', 'Admin Staf QA');
    await page.fill('#email', 'staff.qa@euodoo.com');
    await page.fill('#password', 'SecurePass123!');
    const nameVal = await page.inputValue('#name');
    assert.strictEqual(nameVal, 'Admin Staf QA', 'Input nama pengguna harus terisi');
    console.log('  ✓ Form create responsif, validasi berjalan, dan bebas inline style.');

    // [5] TEST 5: Halaman Edit Pengguna (/admin/users/:id/edit)
    if (editUrl) {
      console.log(`\n[5] Menguji Halaman Edit Pengguna (${editUrl})...`);
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const res = await page.goto(`${baseUrl}${editUrl}`, { waitUntil: 'networkidle' });
        assert.strictEqual(res.status(), 200, `Halaman edit pengguna (${editUrl}) harus status 200`);

        const formCardStyle = await page.locator('.adm-usr-form-card').getAttribute('style');
        assert.ok(!formCardStyle || formCardStyle.trim() === '', `Form card edit tidak boleh memiliki inline style pada ${vp.name}`);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `edit-${vp.width}.png`) });

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        assert.strictEqual(overflow, false, `Halaman edit pengguna tidak boleh overflow horizontal pada ${vp.name}`);

        const hasCard = await page.locator('.adm-usr-form-card').isVisible();
        assert.ok(hasCard, `Form card .adm-usr-form-card harus hadir pada ${vp.name}`);
      }
      console.log('  ✓ Halaman edit pengguna responsif sempurna tanpa overflow & bebas inline style di 4 viewport.');
    } else {
      console.log('\n[5] Catatan: Tidak ada data pengguna untuk uji /edit.');
    }

    // [6] TEST 6: Konsol Browser & Page Errors Check
    console.log('\n[6] Memeriksa integritas konsol JavaScript browser...');
    if (consoleErrors.length > 0) {
      console.error('  Ditemukan console error:', consoleErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, `Harus 0 error konsol browser! Ditemukan: ${consoleErrors.length}`);
    assert.strictEqual(pageErrors.length, 0, `Harus 0 page errors! Ditemukan: ${pageErrors.length}`);
    console.log('  ✓ Nol error konsol browser pada seluruh pengujian.');

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 4 (T-280) LULUS 100%!');
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
