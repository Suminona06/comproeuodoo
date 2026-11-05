import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import bannerModel from '../models/bannerModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/9f11355d-9552-45f1-9bf5-7218dad8c8aa';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t288');

console.log('=== TEST SUITE T-288: QA Verifikasi Visual, Fungsional & Regresi (Banners Views Refactor) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 12
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 12 (views/admin/banners/)...');
  const lintOutputBanners = execSync('node scripts/lint-views.js views/admin/banners/', { encoding: 'utf-8' });
  assert.ok(lintOutputBanners.includes('0 error, 0 warning'), 'views/admin/banners/ harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Berkas Batch 12 lulus Lint Views murni (0 error, 0 warning).\n');

  // [2] TEST 2: Start Dynamic HTTP Server & Launch Playwright
  console.log('[2] Membuka server pengujian lokal & browser Playwright...');
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

  let createdBannerId = null;

  try {
    // [3] TEST 3: Menguji Tampilan Index Banners di 4 Viewport
    console.log('\n[3] Menguji Render Daftar Banner (/admin/banners) di 4 Viewport...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/banners`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman banners harus status 200 pada ${vp.name}`);

      // Verifikasi ketiadaan inline styles pada komponen banner
      const inlineStyleCount = await page.evaluate(() => {
        return document.querySelectorAll('.table-responsive [style], .adm-banner-thumb [style], .adm-banner-cta-primary [style], .adm-banner-cta-secondary [style], .adm-banner-td-action [style]').length;
      });
      assert.strictEqual(inlineStyleCount, 0, `Tidak boleh ada inline style pada tabel banner di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `banners-index-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman banners tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Halaman index banner responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Form Tambah Banner (/admin/banners/create) & Media Source Switching
    console.log('\n[4] Menguji Form Tambah Banner & Multi-Source Switching...');
    await page.setViewportSize({ width: 1280, height: 800 });
    const createResp = await page.goto(`${baseUrl}/admin/banners/create`, { waitUntil: 'networkidle' });
    assert.strictEqual(createResp.status(), 200, 'Halaman tambah banner harus status 200');

    // Cek awal: default media_type = image
    let mediaPickerVis = await page.evaluate(() => {
      const g = document.getElementById('groupMediaPicker');
      return g && !g.classList.contains('adm-d-none') && g.style.display !== 'none';
    });
    let ytVis = await page.evaluate(() => {
      const g = document.getElementById('groupYouTubeInput');
      return g && (g.classList.contains('adm-d-none') || g.style.display === 'none');
    });
    let posterVis = await page.evaluate(() => {
      const g = document.getElementById('groupPosterPicker');
      return g && (g.classList.contains('adm-d-none') || g.style.display === 'none');
    });
    assert.strictEqual(mediaPickerVis, true, 'Group media picker harus tampak pada image');
    assert.strictEqual(ytVis, true, 'Group YouTube input harus tersembunyi pada image');
    assert.strictEqual(posterVis, true, 'Group Poster picker harus tersembunyi pada image');

    // Switch ke 'video' lewat custom dropdown UI
    await page.click('.eu-dd:has(#media_type) .eu-dd-trigger');
    await page.click('.eu-dd-item[data-value="video"]');
    await page.waitForTimeout(150);
    mediaPickerVis = await page.evaluate(() => {
      const g = document.getElementById('groupMediaPicker');
      const btn = document.getElementById('btnBannerOpenPicker');
      return g && !g.classList.contains('adm-d-none') && g.style.display !== 'none' && btn.getAttribute('data-picker-type') === 'video';
    });
    ytVis = await page.evaluate(() => {
      const g = document.getElementById('groupYouTubeInput');
      return g && (g.classList.contains('adm-d-none') || g.style.display === 'none');
    });
    posterVis = await page.evaluate(() => {
      const g = document.getElementById('groupPosterPicker');
      return g && !g.classList.contains('adm-d-none') && g.style.display !== 'none';
    });
    assert.strictEqual(mediaPickerVis, true, 'Group media picker & picker-type=video harus aktif');
    assert.strictEqual(ytVis, true, 'Group YouTube harus tersembunyi pada video');
    assert.strictEqual(posterVis, true, 'Group poster fallback harus tampak pada video');

    // Switch ke 'youtube' lewat custom dropdown UI
    await page.click('.eu-dd:has(#media_type) .eu-dd-trigger');
    await page.click('.eu-dd-item[data-value="youtube"]');
    await page.waitForTimeout(150);
    mediaPickerVis = await page.evaluate(() => {
      const g = document.getElementById('groupMediaPicker');
      return g && (g.classList.contains('adm-d-none') || g.style.display === 'none');
    });
    ytVis = await page.evaluate(() => {
      const g = document.getElementById('groupYouTubeInput');
      return g && !g.classList.contains('adm-d-none') && g.style.display !== 'none';
    });
    posterVis = await page.evaluate(() => {
      const g = document.getElementById('groupPosterPicker');
      return g && !g.classList.contains('adm-d-none') && g.style.display !== 'none';
    });
    assert.strictEqual(mediaPickerVis, true, 'Group media picker harus tersembunyi pada youtube');
    assert.strictEqual(ytVis, true, 'Group YouTube harus tampak pada youtube');
    assert.strictEqual(posterVis, true, 'Group poster fallback harus tampak pada youtube');

    // Live preview YouTube
    await page.fill('#youtube_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(200);

    const isYtPreviewWorking = await page.evaluate(() => {
      const wrap = document.getElementById('bannerYtPreview');
      const iframe = document.getElementById('bannerYtIframe');
      return wrap && !wrap.classList.contains('adm-d-none') && wrap.style.display !== 'none' && iframe.src.includes('dQw4w9WgXcQ');
    });
    assert.strictEqual(isYtPreviewWorking, true, 'Pratinjau YouTube live embed harus aktif memuat ID dQw4w9WgXcQ');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'banners-create-yt-preview-1280.png') });

    // Isi seluruh form banner dengan dual CTA
    await page.fill('#title_id', 'Inovasi Kantong Plastik Ramah Lingkungan');
    await page.fill('#title_en', 'Eco-friendly Plastic Bags Innovation');
    await page.fill('#caption_id', 'Solusi kemasan ramah lingkungan untuk masa depan.');
    await page.fill('#caption_en', 'Eco-friendly packaging solutions for the future.');
    await page.fill('#cta_text_id', 'Hubungi Kami');
    await page.fill('#cta_text_en', 'Contact Us');
    await page.fill('#cta_url', '/contact');
    await page.fill('#cta_secondary_text_id', 'Katalog Produk');
    await page.fill('#cta_secondary_text_en', 'Product Catalog');
    await page.fill('#cta_secondary_url', '/products');
    await page.fill('#sort_order', '95');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'banners-create-1280.png') });

    // Submit form pembuatan banner
    await Promise.all([
      page.waitForURL(/\/admin\/banners(\?.*)?$/),
      page.click('button[type="submit"]')
    ]);

    // Verifikasi banner tersimpan di database
    const allBanners = await bannerModel.findAll(false);
    const createdBanner = allBanners.find((b) => b.title_id === 'Inovasi Kantong Plastik Ramah Lingkungan');
    assert.ok(createdBanner, 'Banner baru harus tersimpan dalam database');
    createdBannerId = createdBanner.id;
    assert.strictEqual(createdBanner.media_type, 'youtube', 'Tipe media banner harus youtube');
    assert.strictEqual(createdBanner.cta_text_id, 'Hubungi Kami', 'CTA 1 ID harus Hubungi Kami');
    assert.strictEqual(createdBanner.cta_secondary_text_id, 'Katalog Produk', 'CTA 2 ID harus Katalog Produk');
    assert.strictEqual(createdBanner.sort_order, 95, 'Sort order harus 95');
    console.log(`  ✓ Form tambah banner & multi-source switching berfungsi 100% (ID #${createdBannerId}).`);

    // [5] TEST 5: Form Edit Banner (/admin/banners/:id/edit)
    console.log(`\n[5] Menguji Form Edit Banner (/admin/banners/${createdBannerId}/edit)...`);
    const editResp = await page.goto(`${baseUrl}/admin/banners/${createdBannerId}/edit`, { waitUntil: 'networkidle' });
    assert.strictEqual(editResp.status(), 200, 'Halaman edit banner harus status 200');

    // Verifikasi data pre-filled
    const editTitleId = await page.inputValue('#title_id');
    const editMediaType = await page.inputValue('#media_type');
    const editYtUrl = await page.inputValue('#youtube_url');
    assert.strictEqual(editTitleId, 'Inovasi Kantong Plastik Ramah Lingkungan', 'Judul harus terisi nilai eksisting');
    assert.strictEqual(editMediaType, 'youtube', 'Media type harus youtube');
    assert.ok(editYtUrl.includes('dQw4w9WgXcQ'), 'URL YouTube harus pre-filled dengan link/ID');

    // Perbarui judul headline dan urutan
    await page.fill('#title_id', 'Inovasi Kemasan Plastik Modern');
    await page.fill('#sort_order', '88');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'banners-edit-1280.png') });

    await Promise.all([
      page.waitForURL(/\/admin\/banners(\?.*)?$/),
      page.click('button[type="submit"]')
    ]);

    const updatedBanner = await bannerModel.findById(createdBannerId);
    assert.strictEqual(updatedBanner.title_id, 'Inovasi Kemasan Plastik Modern', 'Judul banner harus diperbarui');
    assert.strictEqual(updatedBanner.sort_order, 88, 'Urutan banner harus 88');
    console.log('  ✓ Form edit banner & pembaruan data berhasil diverifikasi.');

    // [6] TEST 6: Ubah Status Banner
    console.log('\n[6] Menguji Pengubahan Status Banner (Aktif / Nonaktif)...');
    await page.goto(`${baseUrl}/admin/banners`, { waitUntil: 'networkidle' });

    const statusRow = page.locator(`tr:has(form[action*="/banners/${createdBannerId}/status"])`);
    const statusBtn = statusRow.locator('.btn-action-status');

    // Toggle dari aktif (1) ke nonaktif (0)
    await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/banners/${createdBannerId}/status`)),
      statusBtn.click()
    ]);
    await page.waitForTimeout(300);

    let bannerAfterToggle = await bannerModel.findById(createdBannerId);
    assert.strictEqual(bannerAfterToggle.is_active, 0, 'Status banner harus menjadi nonaktif (0)');

    // Toggle kembali dari nonaktif (0) ke aktif (1)
    await page.goto(`${baseUrl}/admin/banners`, { waitUntil: 'networkidle' });
    const statusRowRe = page.locator(`tr:has(form[action*="/banners/${createdBannerId}/status"])`);
    const statusBtnRe = statusRowRe.locator('.btn-action-status');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/banners/${createdBannerId}/status`)),
      statusBtnRe.click()
    ]);
    await page.waitForTimeout(300);

    bannerAfterToggle = await bannerModel.findById(createdBannerId);
    assert.strictEqual(bannerAfterToggle.is_active, 1, 'Status banner harus kembali aktif (1)');
    console.log('  ✓ Toggle status banner berfungsi normal.');

    // [7] TEST 7: Hapus Banner dengan Konfirmasi SweetAlert2
    console.log('\n[7] Menguji Konfirmasi Hapus Banner (SweetAlert2)...');
    const deleteBtn = page.locator(`form[action*="/banners/${createdBannerId}/delete"] button[type="submit"]`);
    await deleteBtn.click();
    await page.waitForTimeout(500);

    const isSwalVisible = await page.locator('.swal2-container').isVisible();
    assert.strictEqual(isSwalVisible, true, 'Pop up SweetAlert konfirmasi hapus harus muncul');

    const swalTitle = await page.locator('.swal2-title').textContent();
    assert.ok(swalTitle.includes('Hapus Banner'), 'Judul pop up harus Hapus Banner');

    // Batal hapus
    await page.click('.swal2-cancel');
    await page.waitForTimeout(300);

    const bannerCheckBefore = await bannerModel.findById(createdBannerId);
    assert.ok(bannerCheckBefore, 'Banner tidak boleh terhapus jika dibatalkan');

    // Konfirmasi hapus permanen
    await deleteBtn.click();
    await page.waitForTimeout(500);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      page.click('.swal2-confirm')
    ]);

    const bannerCheckAfter = await bannerModel.findById(createdBannerId);
    assert.strictEqual(bannerCheckAfter, null, 'Banner harus terhapus permanen dari database');
    createdBannerId = null;
    console.log('  ✓ Konfirmasi hapus SweetAlert2 dan pembersihan data berhasil.');

    // [8] TEST 8: Konsol Browser & Page Errors Check
    console.log('\n[8] Memeriksa integritas konsol JavaScript browser...');
    if (consoleErrors.length > 0) {
      console.error('  Ditemukan console error:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.error('  Ditemukan page error:', pageErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, `Harus 0 error konsol browser! Ditemukan: ${consoleErrors.length}`);
    assert.strictEqual(pageErrors.length, 0, `Harus 0 page errors! Ditemukan: ${pageErrors.length}`);
    console.log('  ✓ Nol error konsol browser pada seluruh pengujian.');

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 12 (T-288) LULUS 100%!');
    process.exit(0);
  } finally {
    if (createdBannerId) {
      await bannerModel.delete(createdBannerId).catch(() => {});
    }
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verifikasi GAGAL:', err);
  process.exit(1);
});
