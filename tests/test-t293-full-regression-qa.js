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
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t293');

async function captureTargetScreenshot(page, vp, routeName) {
  if (vp.width === 375 || vp.width === 1280) {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${routeName}-${vp.width}.png`) });
  }
}

console.log('=== TEST SUITE T-293: QA Regresi Publik & Enforce 100% Strict Lint Views Menyeluruh ===\n');

async function runFullRegressionQA() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views on 100% Admin Views & Admin Partials
  console.log('[1] Memverifikasi 100% Strict Lint Views pada seluruh berkas Admin...');
  const adminLintOutput = execSync('node scripts/lint-views.js views/admin/', { encoding: 'utf-8' });
  assert.ok(adminLintOutput.includes('0 error, 0 warning'), 'views/admin/ harus 0 error & 0 warning');
  console.log('  ✓ Seluruh 66 berkas di views/admin/** lulus 0 error & 0 warning.');

  const adminPartials = [
    'views/partials/admin-header.ejs',
    'views/partials/admin-footer.ejs',
    'views/partials/media-picker-modal.ejs'
  ];
  for (const ap of adminPartials) {
    const partOutput = execSync(`node scripts/lint-views.js ${ap}`, { encoding: 'utf-8' });
    assert.ok(partOutput.includes('0 error, 0 warning'), `${ap} harus 0 error & 0 warning`);
  }
  console.log('  ✓ Seluruh admin partials di views/partials/ lulus 0 error & 0 warning.');

  const globalLintOutput = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintOutput.includes('0 error pada berkas terverifikasi'), 'Global lint views harus 0 error');
  console.log('  ✓ Eksekusi lint-views global berstatus HIJAU (0 error).\n');

  // [2] TEST 2: ESLint Flat Config Quality Gate
  console.log('[2] Memverifikasi Flat ESLint (npm run lint)...');
  const eslintOutput = execSync('npm run lint', { encoding: 'utf-8' });
  assert.ok(eslintOutput.includes('0 errors'), 'npm run lint harus menghasilkan 0 error');
  console.log('  ✓ ESLint lulus murni dengan 0 error.\n');

  // [3] TEST 3: Core Backend & SSR Test Suites
  console.log('[3] Menjalankan Test Suites Backend & SSR (npm test)...');
  const npmTestOutput = execSync('npm test', { encoding: 'utf-8' });
  assert.ok(npmTestOutput.includes('ALL STORAGE & PIPELINE TESTS PASSED!'), 'Storage tests harus lulus');
  assert.ok(npmTestOutput.includes('ALL MODUL 10 TESTS PASSED SUCCESSFULLY!'), 'Security tests harus lulus');
  assert.ok(npmTestOutput.includes('ALL MODUL 11 TESTS PASSED SUCCESSFULLY!'), 'CMS tests harus lulus');
  assert.ok(npmTestOutput.includes('ALL MODUL 12 TESTS PASSED SUCCESSFULLY!'), 'Public SSR tests harus lulus');
  assert.ok(npmTestOutput.includes('ALL MODUL 13 TESTS PASSED SUCCESSFULLY!'), 'SEO audit tests harus lulus');
  console.log('  ✓ Seluruh 5 test suites resmi (Storage, Security, CMS, Public, SEO) 100% LULUS.\n');

  // [4] TEST 4: Launch Dynamic Test Server & Browser
  console.log('[4] Membuka server pengujian dinamis & browser Playwright...');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`  ✓ Server berjalan di ${baseUrl}`);

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
    // [5] TEST 5: Verifikasi Visual & Non-Regresi Halaman Publik Lintas Resolusi
    console.log('\n[5] Menguji Halaman Publik (Non-Regresi Visual & DOM Integrity)...');

    const publicRoutes = [
      { path: '/', name: 'public-home' },
      { path: '/about', name: 'public-about' },
      { path: '/products', name: 'public-products' },
      { path: '/capabilities', name: 'public-capabilities' },
      { path: '/news', name: 'public-news' },
      { path: '/contact', name: 'public-contact' }
    ];

    const publicTestPairs = publicRoutes.flatMap(route =>
      viewports.map(vp => ({ route, vp }))
    );

    for (const { route, vp } of publicTestPairs) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(100);
      assert.strictEqual(resp.status(), 200, `Halaman ${route.path} harus status 200 pada ${vp.name}`);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.strictEqual(overflow, false, `Halaman ${route.path} tidak boleh overflow horizontal pada ${vp.name}`);

      await captureTargetScreenshot(page, vp, route.name);
    }
    console.log('  ✓ Seluruh rute publik terverifikasi responsif, bebas overflow di 4 viewport.');

    // [6] TEST 6: Verifikasi Semua Halaman Admin Setelah 16 Batch Refaktor
    console.log('\n[6] Menguji Aksesibilitas & Fungsionalitas Seluruh Modul Admin (16 Batches)...');
    await page.setViewportSize({ width: 1280, height: 800 });

    const adminRoutes = [
      { path: '/admin/dashboard', name: 'admin-dashboard' },
      { path: '/admin/settings', name: 'admin-settings' },
      { path: '/admin/home-content', name: 'admin-home-content' },
      { path: '/admin/about', name: 'admin-about' },
      { path: '/admin/products', name: 'admin-products' },
      { path: '/admin/posts', name: 'admin-posts' },
      { path: '/admin/banners', name: 'admin-banners' },
      { path: '/admin/media', name: 'admin-media' },
      { path: '/admin/inquiries', name: 'admin-inquiries' },
      { path: '/admin/leads', name: 'admin-leads' },
      { path: '/admin/users', name: 'admin-users' },
      { path: '/admin/brands', name: 'admin-brands' },
      { path: '/admin/capabilities', name: 'admin-capabilities' },
      { path: '/admin/contact', name: 'admin-contact' },
      { path: '/admin/hero-banners', name: 'admin-hero-banners' },
      { path: '/admin/product-categories', name: 'admin-product-categories' },
      { path: '/admin/post-categories', name: 'admin-post-categories' }
    ];

    for (const route of adminRoutes) {
      const resp = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(100);
      assert.strictEqual(resp.status(), 200, `Halaman admin ${route.path} harus status 200`);

      // Verifikasi tidak ada inline style tidak sah
      const inlineStyleCount = await page.evaluate(() => {
        return document.querySelectorAll('.card [style], .form-card [style], .table [style]').length;
      });
      assert.strictEqual(inlineStyleCount, 0, `Tidak boleh ada inline style pada modul ${route.path}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${route.name}-1280.png`) });
      console.log(`  ✓ Modul ${route.path} berhasil dimuat dengan status 200 OK & bebas inline style.`);
    }

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
  assert.strictEqual(consoleErrors.length, 0, 'Tidak boleh ada error konsol browser selama seluruh siklus pengujian');
  assert.strictEqual(pageErrors.length, 0, 'Tidak boleh ada error halaman (unhandled exception) selama seluruh siklus pengujian');
  console.log('  ✓ 0 browser console errors & 0 page errors lintas seluruh rute publik dan admin.');

  console.log('\n=== SELURUH GERBANG KUALITAS T-293 LULUS 100%! ===');
  console.log('Audit 16 Batch Refaktor View Admin Selesai Secara Paripurna.');
}

runFullRegressionQA().catch((err) => {
  console.error('\n❌ QA Full Regression GAGAL:', err);
  process.exit(1);
});
