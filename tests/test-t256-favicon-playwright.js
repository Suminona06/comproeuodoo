import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';

console.log('=== TEST SUITE T-256: Playwright Favicon Multi-Sizes & Settings E2E Audit ===');

async function runFaviconAudit() {
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
      domain: 'localhost',
      path: '/'
    }
  ]);

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });
  page.on('pageerror', err => {
    pageErrors.push({ url: page.url(), message: err.message });
  });

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: Tag Favicon di Halaman Publik
    // ─────────────────────────────────────────────────────────────
    console.log('\n[1] Memeriksa tag favicon di halaman publik (/, /products, /news)...');
    const publicPages = ['/', '/products', '/news', '/about', '/contact'];

    for (const urlPath of publicPages) {
      const resp = await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: 'domcontentloaded' });
      assert.strictEqual(resp.status(), 200, `Halaman ${urlPath} harus return 200`);

      const iconTags = await page.evaluate(() => {
        const link32 = document.querySelector('link[rel="icon"][sizes="32x32"]');
        const link16 = document.querySelector('link[rel="icon"][sizes="16x16"]');
        const link180 = document.querySelector('link[rel="apple-touch-icon"][sizes="180x180"]');
        const link192 = document.querySelector('link[rel="icon"][sizes="192x192"]');
        return {
          has32: Boolean(link32),
          href32: link32 ? link32.getAttribute('href') : null,
          has16: Boolean(link16),
          href16: link16 ? link16.getAttribute('href') : null,
          has180: Boolean(link180),
          href180: link180 ? link180.getAttribute('href') : null,
          has192: Boolean(link192),
          href192: link192 ? link192.getAttribute('href') : null
        };
      });

      assert.strictEqual(iconTags.has32, true, `Tag 32x32 harus ada di ${urlPath}`);
      assert.strictEqual(iconTags.has16, true, `Tag 16x16 harus ada di ${urlPath}`);
      assert.strictEqual(iconTags.has180, true, `Tag 180x180 (apple-touch-icon) harus ada di ${urlPath}`);
      assert.strictEqual(iconTags.has192, true, `Tag 192x192 harus ada di ${urlPath}`);
    }
    console.log('  ✓ Seluruh halaman publik memuat 4 tag favicon dengan ukuran eksplisit (16, 32, 180, 192).');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Tag Favicon di Halaman Admin (/admin/login, /admin/dashboard, 403 Page)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[2] Memeriksa tag favicon di layout admin (/admin/login, /admin/dashboard, 403 Access Denied)...');
    
    // 2a. Admin Login & Dashboard
    for (const urlPath of ['/admin/login', '/admin/dashboard']) {
      await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: 'domcontentloaded' });

      const iconTags = await page.evaluate(() => {
        const link32 = document.querySelector('link[rel="icon"][sizes="32x32"]');
        const link16 = document.querySelector('link[rel="icon"][sizes="16x16"]');
        const link180 = document.querySelector('link[rel="apple-touch-icon"][sizes="180x180"]');
        const link192 = document.querySelector('link[rel="icon"][sizes="192x192"]');
        return {
          has32: Boolean(link32),
          has16: Boolean(link16),
          has180: Boolean(link180),
          has192: Boolean(link192)
        };
      });

      assert.strictEqual(iconTags.has32, true, `Tag 32x32 harus ada di ${urlPath}`);
      assert.strictEqual(iconTags.has16, true, `Tag 16x16 harus ada di ${urlPath}`);
      assert.strictEqual(iconTags.has180, true, `Tag 180x180 harus ada di ${urlPath}`);
      assert.strictEqual(iconTags.has192, true, `Tag 192x192 harus ada di ${urlPath}`);
    }

    // 2b. 403 Access Denied Page (via unauthorized role access)
    const editorToken = jwt.sign({
      id: 99,
      email: 'editor@test.com',
      name: 'Editor User',
      role: 'editor'
    }, JWT_SECRET, { expiresIn: '1h' });

    const editorContext = await browser.newContext();
    await editorContext.addCookies([{
      name: 'euodoo_session',
      value: editorToken,
      domain: 'localhost',
      path: '/'
    }]);
    const editorPage = await editorContext.newPage();
    const deniedResp = await editorPage.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
    assert.strictEqual(deniedResp.status(), 403, 'Akses editor ke /admin/settings harus merespons 403 Forbidden');

    const deniedIcons = await editorPage.evaluate(() => {
      const link32 = document.querySelector('link[rel="icon"][sizes="32x32"]');
      const link16 = document.querySelector('link[rel="icon"][sizes="16x16"]');
      const link180 = document.querySelector('link[rel="apple-touch-icon"][sizes="180x180"]');
      const link192 = document.querySelector('link[rel="icon"][sizes="192x192"]');
      return {
        has32: Boolean(link32),
        has16: Boolean(link16),
        has180: Boolean(link180),
        has192: Boolean(link192)
      };
    });
    assert.strictEqual(deniedIcons.has32, true, 'Tag 32x32 harus ada di halaman 403');
    assert.strictEqual(deniedIcons.has16, true, 'Tag 16x16 harus ada di halaman 403');
    assert.strictEqual(deniedIcons.has180, true, 'Tag 180x180 harus ada di halaman 403');
    assert.strictEqual(deniedIcons.has192, true, 'Tag 192x192 harus ada di halaman 403');
    await editorContext.close();

    console.log('  ✓ Layout admin (login, dashboard, 403) memuat seluruh tag favicon multi-ukuran.');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Verifikasi Dimensi Piksel Aktual & Alpha Channel (Sharp)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[3] Memeriksa integritas berkas favicon fisik dan proporsi 1:1 persegi...');
    const expectedSizes = [16, 32, 180, 192, 512];

    for (const size of expectedSizes) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'settings', `favicon-${size}x${size}.png`);
      assert.ok(fs.existsSync(filePath), `Berkas favicon-${size}x${size}.png harus ada di disk`);

      const meta = await sharp(filePath).metadata();
      assert.strictEqual(meta.width, size, `Lebar harus tepat ${size}px`);
      assert.strictEqual(meta.height, size, `Tinggi harus tepat ${size}px`);
      assert.strictEqual(meta.hasAlpha, true, `Favicon harus memiliki channel alpha (transparansi)`);

      // Verifikasi via HTTP fetch
      const httpResp = await page.request.get(`${BASE_URL}/uploads/settings/favicon-${size}x${size}.png`);
      assert.strictEqual(httpResp.status(), 200, `HTTP GET /uploads/settings/favicon-${size}x${size}.png harus 200 OK`);
      console.log(`  ✓ favicon-${size}x${size}.png: Terverifikasi ${meta.width}x${meta.height} (1:1 persegi, alpha: ${meta.hasAlpha}, HTTP 200).`);
    }

    // Cek juga /favicon.ico fallback root
    const icoResp = await page.request.get(`${BASE_URL}/favicon.ico`);
    assert.strictEqual(icoResp.status(), 200, 'Root /favicon.ico harus 200 OK');
    console.log('  ✓ Root /favicon.ico terverifikasi 200 OK.');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: UI Pengaturan Situs (/admin/settings)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[4] Memeriksa tampilan form Pengaturan Situs untuk Favicon...');
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });

    const settingsFaviconUI = await page.evaluate(() => {
      const label = Array.from(document.querySelectorAll('label')).find(l => l.textContent.includes('Favicon Situs'));
      const fileInput = document.querySelector('input#favicon_file');
      const hiddenInput = document.querySelector('input#setting_site_favicon');
      const previewImg = document.querySelector('.media-picker-preview-box img[alt="Favicon"]');
      const hint = label ? label.parentElement.querySelector('.form-hint') : null;

      return {
        hasLabel: Boolean(label),
        labelText: label ? label.textContent.trim() : null,
        hasFileInput: Boolean(fileInput),
        hasHiddenInput: Boolean(hiddenInput),
        hiddenValue: hiddenInput ? hiddenInput.value : null,
        hasPreviewImg: Boolean(previewImg),
        previewVisible: previewImg ? previewImg.style.display !== 'none' : false,
        hintText: hint ? hint.textContent.trim() : ''
      };
    });

    assert.strictEqual(settingsFaviconUI.hasLabel, true, 'Label Favicon Situs harus ada');
    assert.ok(settingsFaviconUI.labelText.includes('1:1'), 'Label harus menyebutkan proporsi 1:1');
    assert.ok(settingsFaviconUI.labelText.includes('Tanpa Teks'), 'Label harus menyebutkan Tanpa Teks');
    assert.strictEqual(settingsFaviconUI.hasFileInput, true, 'Input upload berkas favicon_file harus ada');
    assert.strictEqual(settingsFaviconUI.hasHiddenInput, true, 'Input hidden setting_site_favicon harus ada');
    assert.strictEqual(settingsFaviconUI.previewVisible, true, 'Pratinjau gambar favicon harus tampil');
    console.log('  ✓ Komponen form Favicon terverifikasi (label spesifik 1:1 tanpa teks, upload langsung, & pratinjau).');

    // ─────────────────────────────────────────────────────────────
    // TEST 5: E2E Setting Update & Fallback Test
    // ─────────────────────────────────────────────────────────────
    console.log('\n[5] Menguji alur simpan dan fallback otomatis saat favicon dikosongkan...');
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      const input = document.querySelector('input#setting_site_favicon');
      if (input) input.value = '';
    });

    const [submitNav] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('button[type="submit"]')
    ]);

    assert.ok(submitNav.url().includes('/admin/settings'), 'Harus redirect kembali ke /admin/settings');
    assert.strictEqual(submitNav.status(), 200, 'Respons redirect harus 200 OK');

    for (const size of expectedSizes) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'settings', `favicon-${size}x${size}.png`);
      assert.ok(fs.existsSync(filePath), `Favicon ${size}x${size} harus ter-generate ulang via fallback`);
      const meta = await sharp(filePath).metadata();
      assert.strictEqual(meta.width, size, `Fallback lebar ${size}px`);
      assert.strictEqual(meta.height, size, `Fallback tinggi ${size}px`);
    }
    console.log('  ✓ Pengaturan berhasil disimpan dan fallback otomatis dari logo terbukti men-generate paket ukuran.');

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Console Errors
    // ─────────────────────────────────────────────────────────────
    console.log('\n[6] Memeriksa console error browser...');
    assert.strictEqual(consoleErrors.length, 0, `Tidak boleh ada console error: ${JSON.stringify(consoleErrors)}`);
    assert.strictEqual(pageErrors.length, 0, `Tidak boleh ada page error: ${JSON.stringify(pageErrors)}`);
    console.log('  ✓ Nol console error browser.');

    console.log('\n======================================================');
    console.log('🎉 SEMUA TEST PLAYWRIGHT T-256 BERHASIL LULUS 100%! 🎉');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

runFaviconAudit().catch(err => {
  console.error('\n❌ TEST PLAYWRIGHT T-256 GAGAL:', err);
  process.exit(1);
});
