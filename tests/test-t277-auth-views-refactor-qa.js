import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import app from '../app.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';

console.log('=== TEST SUITE T-277: QA Verifikasi Visual, Fungsional & Regresi (Auth & Error Views) ===\n');

async function runQAVerification() {
  // [1] TEST 1: Strict Lint Views Verification on Batch 1
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 1 (403, Login, Change Password)...');
  const lintOutput403 = execSync('node scripts/lint-views.js views/admin/403.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutput403.includes('0 error, 0 warning'), 'views/admin/403.ejs harus zero error & zero warning');

  const lintOutputLogin = execSync('node scripts/lint-views.js views/admin/login.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputLogin.includes('0 error, 0 warning'), 'views/admin/login.ejs harus zero error & zero warning');

  const lintOutputChpwd = execSync('node scripts/lint-views.js views/admin/change-password.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputChpwd.includes('0 error, 0 warning'), 'views/admin/change-password.ejs harus zero error & zero warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error');
  console.log('  ✓ Seluruh berkas Batch 1 lulus Lint Views murni (0 error, 0 warning).\n');

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

  const editorToken = jwt.sign({
    id: 2,
    email: 'editor@euodoo.com',
    name: 'Editor Staf',
    role: 'editor'
  }, JWT_SECRET, { expiresIn: '1h' });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico') && !msg.text().includes('Failed to load resource')) {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });
  page.on('pageerror', err => {
    pageErrors.push({ url: page.url(), message: err.message });
  });

  try {
    const viewports = [
      { name: 'Mobile (375px)', width: 375, height: 812 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Laptop (1280px)', width: 1280, height: 800 },
      { name: 'Desktop (1440px)', width: 1440, height: 900 }
    ];

    // [3] TEST 3: Halaman Login (/admin/login)
    console.log('\n[3] Menguji Halaman Login (/admin/login) lintas resolusi...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: `tests/screenshots/t277/login-${vp.width}.png` });

      // Verifikasi ketiadaan horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman login tidak boleh overflow pada ${vp.name}`);

      // Verifikasi struktur class komponen baru
      const hasWrapper = await page.locator('.adm-login-wrapper').isVisible();
      const hasCard = await page.locator('.adm-login-card').isVisible();
      const hasSubmitBtn = await page.locator('.adm-login-btn-submit').isVisible();
      assert.ok(hasWrapper && hasCard && hasSubmitBtn, `Elemen login berprefix .adm-login-* harus hadir pada ${vp.name}`);
    }
    console.log('  ✓ Halaman login responsif sempurna tanpa overflow di 4 viewport.');

    // Verifikasi fungsionalitas submit & error message di Login
    console.log('  Menguji validasi error form login dengan kredensial salah...');
    await page.fill('#email', 'wrong@euodoo.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('.adm-login-btn-submit');
    await page.waitForLoadState('networkidle');
    const alertVisible = await page.locator('.alert-error').isVisible();
    assert.ok(alertVisible, 'Pesan error harus tampil saat kredensial salah');
    console.log('  ✓ Validasi login dan respons error berfungsi normal.');

    // [4] TEST 4: Halaman 403 Akses Ditolak (/admin/settings diakses oleh editor)
    console.log('\n[4] Menguji Halaman 403 Akses Ditolak lintas resolusi...');
    await context.clearCookies();
    await context.addCookies([
      {
        name: 'euodoo_session',
        value: editorToken,
        domain: '127.0.0.1',
        path: '/'
      }
    ]);

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${baseUrl}/admin/settings`, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 403, 'Route /admin/settings harus mengembalikan 403 untuk editor');
      await page.screenshot({ path: `tests/screenshots/t277/403-${vp.width}.png` });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman 403 tidak boleh overflow pada ${vp.name}`);

      const hasCard = await page.locator('.err403-card').isVisible();
      const hasIcon = await page.locator('.err403-icon').isVisible();
      const hasBackBtn = await page.locator('.err403-actions a').isVisible();
      assert.ok(hasCard && hasIcon && hasBackBtn, `Elemen 403 berprefix .err403-* harus hadir pada ${vp.name}`);
    }
    console.log('  ✓ Halaman 403 responsif sempurna tanpa overflow di 4 viewport.');

    // [5] TEST 5: Halaman Ganti Password (/admin/change-password)
    console.log('\n[5] Menguji Halaman Ganti Password (/admin/change-password) sebagai Superadmin...');
    await context.clearCookies();
    await context.addCookies([
      {
        name: 'euodoo_session',
        value: adminToken,
        domain: '127.0.0.1',
        path: '/'
      }
    ]);

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}/admin/change-password`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: `tests/screenshots/t277/change-password-${vp.width}.png` });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman ganti password tidak boleh overflow pada ${vp.name}`);

      const hasChpwdCard = await page.locator('.chpwd-card').isVisible();
      const hasChpwdActions = await page.locator('.chpwd-actions').isVisible();
      assert.ok(hasChpwdCard && hasChpwdActions, `Elemen .chpwd-* harus hadir pada ${vp.name}`);
    }
    console.log('  ✓ Halaman ganti password responsif sempurna tanpa overflow di 4 viewport.');

    // [6] TEST 6: Konsol Browser & Page Errors Check
    console.log('\n[6] Memeriksa integritas konsol JavaScript browser...');
    if (consoleErrors.length > 0) {
      console.error('  Ditemukan console error:', consoleErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, `Harus 0 error konsol browser! Ditemukan: ${consoleErrors.length}`);
    assert.strictEqual(pageErrors.length, 0, `Harus 0 page errors! Ditemukan: ${pageErrors.length}`);
    console.log('  ✓ Nol error konsol browser pada seluruh pengujian.');

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 1 (T-277) LULUS 100%!');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  }
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verifikasi GAGAL:', err);
  process.exit(1);
});
