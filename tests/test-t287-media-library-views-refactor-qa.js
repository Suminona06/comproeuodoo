import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import mediaModel from '../models/mediaModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/9f11355d-9552-45f1-9bf5-7218dad8c8aa';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t287');

console.log('=== TEST SUITE T-287: QA Verifikasi Visual, Fungsional & Regresi (Media Library Views) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 11
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 11 (media/index.ejs)...');
  const lintOutputMedia = execSync('node scripts/lint-views.js views/admin/media/index.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputMedia.includes('0 error, 0 warning'), 'views/admin/media/index.ejs harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Berkas Batch 11 lulus Lint Views murni (0 error, 0 warning).\n');

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

  let testImageId = null;
  let testYoutubeId = null;

  try {
    // Siapkan data pengujian media library
    testImageId = await mediaModel.create({
      filename: 'sample-packaging-box.webp',
      file_url: '/uploads/media/sample-packaging-box.webp',
      mime_type: 'image/webp',
      file_size: 65400,
      media_type: 'image',
      original_name: 'sample-packaging-box.png',
      storage_driver: 'local'
    });

    testYoutubeId = await mediaModel.create({
      filename: 'Company Profile Factory Tour',
      file_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      mime_type: 'video/youtube',
      file_size: 0,
      media_type: 'youtube',
      original_name: 'youtube-sample-tour',
      storage_driver: 'local'
    });

    console.log(`  ✓ Data pengujian media disiapkan (Image ID #${testImageId}, YouTube ID #${testYoutubeId})`);

    // [3] TEST 3: Menguji Tampilan Media Library di 4 Viewport
    console.log('\n[3] Menguji Render Media Library di 4 Viewport...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/media`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman media library harus status 200 pada ${vp.name}`);

      // Verifikasi ketiadaan inline style statis pada template media body dan modal
      const inlineStyleCount = await page.evaluate(() => {
        return document.querySelectorAll('.adm-media-body [style], #youtubeModal [style], #uploadModal .admin-modal-header [style], #uploadModal .adm-media-mb-0[style], #uploadModal .admin-modal-footer [style]').length;
      });
      assert.strictEqual(inlineStyleCount, 0, `Tidak boleh ada inline style statis pada media body / modal di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `media-library-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman media library tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Halaman media library responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Modal Unggah Berkas (Upload Modal)
    console.log('\n[4] Menguji Modal Unggah Berkas...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}/admin/media`, { waitUntil: 'networkidle' });

    await page.click('button[data-modal-open="uploadModal"]');
    await page.waitForTimeout(200);

    let isUploadModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('uploadModal');
      return modal && modal.classList.contains('open');
    });
    assert.strictEqual(isUploadModalOpen, true, 'Modal upload harus terbuka setelah tombol Unggah diklik');

    // Tutup modal upload
    await page.click('button[data-modal-close="uploadModal"]');
    await page.waitForTimeout(200);

    isUploadModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('uploadModal');
      return modal && modal.classList.contains('open');
    });
    assert.strictEqual(isUploadModalOpen, false, 'Modal upload harus tertutup setelah tombol tutup diklik');
    console.log('  ✓ Modal unggah berkas berfungsi dengan baik.');

    // [5] TEST 5: Modal Tautkan YouTube & Live Preview Eksternal JS
    console.log('\n[5] Menguji Modal YouTube & Live Preview Eksternal JS...');
    await page.click('button[data-modal-open="youtubeModal"]');
    await page.waitForTimeout(200);

    let isYtModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('youtubeModal');
      return modal && modal.classList.contains('open');
    });
    assert.strictEqual(isYtModalOpen, true, 'Modal YouTube harus terbuka setelah tombol YouTube diklik');

    // Input URL YouTube dan verifikasi pratinjau live iframe
    await page.fill('#youtube_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(200);

    const isPreviewVisible = await page.evaluate(() => {
      const wrap = document.getElementById('ytPreviewWrap');
      const iframe = document.getElementById('ytIframe');
      return wrap && wrap.style.display === 'block' && iframe.src.includes('dQw4w9WgXcQ');
    });
    assert.strictEqual(isPreviewVisible, true, 'Pratinjau iframe YouTube harus aktif dan memuat video ID');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'media-library-youtube-modal-1280.png') });

    // Tutup modal YouTube
    await page.click('button[data-modal-close="youtubeModal"]');
    await page.waitForTimeout(200);

    isYtModalOpen = await page.evaluate(() => {
      const modal = document.getElementById('youtubeModal');
      return modal && modal.classList.contains('open');
    });
    assert.strictEqual(isYtModalOpen, false, 'Modal YouTube harus tertutup setelah tombol Batal/Tutup diklik');
    console.log('  ✓ Modal tautan YouTube dan live embed preview berfungsi 100%.');

    // [6] TEST 6: Pengujian Tab Filter Tipe Media & Tombol Salin URL
    console.log('\n[6] Menguji Tab Filter Tipe Media & Aksi Salin URL...');
    await page.goto(`${baseUrl}/admin/media?type=youtube`, { waitUntil: 'networkidle' });

    const activeTabTxt = await page.locator('.filter-tabs-wrap .tab-btn.active').textContent();
    assert.ok(activeTabTxt.includes('YouTube'), 'Tab aktif harus menunjukkan filter YouTube');

    const hasYtBadge = await page.evaluate(() => {
      const tag = document.querySelector('.adm-media-type-yt .adm-media-type-tag');
      return tag && tag.textContent.includes('YouTube');
    });
    assert.strictEqual(hasYtBadge, true, 'Item YouTube harus memiliki badge tipe yang sesuai');

    // Coba klik tombol Salin URL
    const copyBtn = page.locator('button[data-action="copy-url"]').first();
    await assert.doesNotReject(async () => {
      await copyBtn.click();
    }, 'Tombol salin URL harus dapat diklik tanpa exception');
    console.log('  ✓ Tab filter dan aksi salin URL berfungsi tanpa kendala.');

    // [7] TEST 7: Interaktivitas Pop Up Konfirmasi Hapus Media & SweetAlert2
    console.log('\n[7] Menguji Pop Up SweetAlert2 & Alur Hapus Media...');
    await page.goto(`${baseUrl}/admin/media`, { waitUntil: 'networkidle' });

    const deleteBtn = page.locator(`form[action*="${testImageId}/delete"] button[type="submit"]`);
    await deleteBtn.click();
    await page.waitForTimeout(500);

    const isSwalVisible = await page.locator('.swal2-container').isVisible();
    assert.strictEqual(isSwalVisible, true, 'Pop up SweetAlert konfirmasi hapus harus muncul');

    const swalTitle = await page.locator('.swal2-title').textContent();
    assert.ok(swalTitle.includes('Hapus Media'), 'Judul pop up harus Hapus Media');

    // Uji batal hapus
    await page.click('.swal2-cancel');
    await page.waitForTimeout(300);

    const isSwalHidden = await page.locator('.swal2-container').isVisible().catch(() => false);
    assert.strictEqual(isSwalHidden, false, 'Pop up SweetAlert harus tertutup saat dibatalkan');

    const imageBeforeDelete = await mediaModel.findById(testImageId);
    assert.ok(imageBeforeDelete, 'Media tidak boleh terhapus jika konfirmasi dibatalkan');

    // Uji konfirmasi hapus permanen
    await deleteBtn.click();
    await page.waitForTimeout(500);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('.swal2-confirm')
    ]);

    const imageAfterDelete = await mediaModel.findById(testImageId);
    assert.strictEqual(imageAfterDelete, null, 'Media harus terhapus dari database setelah konfirmasi');
    testImageId = null;
    console.log('  ✓ Pop up konfirmasi hapus media & penghapusan database berfungsi sempurna.');

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

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 11 (T-287) LULUS 100%!');
    process.exit(0);
  } finally {
    if (testImageId) {
      await mediaModel.delete(testImageId).catch(() => {});
    }
    if (testYoutubeId) {
      await mediaModel.delete(testYoutubeId).catch(() => {});
    }
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verifikasi GAGAL:', err);
  process.exit(1);
});
