import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import postModel from '../models/postModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/9f11355d-9552-45f1-9bf5-7218dad8c8aa';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t289');

console.log('=== TEST SUITE T-289: QA Verifikasi Visual, Fungsional & Regresi (Posts Views Refactor) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 13
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 13 (views/admin/posts/)...');
  const lintOutputPosts = execSync('node scripts/lint-views.js views/admin/posts/', { encoding: 'utf-8' });
  assert.ok(lintOutputPosts.includes('0 error, 0 warning'), 'views/admin/posts/ harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Berkas Batch 13 lulus Lint Views murni (0 error, 0 warning).\n');

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

  let createdPostId = null;

  try {
    // [3] TEST 3: Menguji Tampilan Index Posts di 4 Viewport
    console.log('\n[3] Menguji Render Daftar Artikel (/admin/posts) di 4 Viewport...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/posts`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman posts harus status 200 pada ${vp.name}`);

      // Verifikasi ketiadaan inline styles pada tabel posts
      const inlineStyleCount = await page.evaluate(() => {
        return document.querySelectorAll('.data-table [style], .adm-post-thumb [style], .adm-post-badge-type [style], .adm-post-cat-name [style], .adm-post-date-scheduled [style], .adm-post-empty-td [style]').length;
      });
      assert.strictEqual(inlineStyleCount, 0, `Tidak boleh ada inline style pada tabel posts di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `posts-index-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman posts tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Halaman index artikel responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Filter Tabs & Live Search pada /admin/posts
    console.log('\n[4] Menguji Filter Tabs & Toolbar...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.click('.filter-tabs-wrap a[href*="type=berita"]');
    await page.waitForURL(/\/admin\/posts\?type=berita/);
    let activeTab = await page.locator('.filter-tabs-wrap .tab-btn.active').textContent();
    assert.ok(activeTab.includes('Berita'), 'Tab Berita harus aktif');

    await page.click('.filter-tabs-wrap a[href*="type=pers"]');
    await page.waitForURL(/\/admin\/posts\?type=pers/);
    activeTab = await page.locator('.filter-tabs-wrap .tab-btn.active').textContent();
    assert.ok(activeTab.includes('Siaran Pers'), 'Tab Siaran Pers harus aktif');

    await page.click('.filter-tabs-wrap a[href="/admin/posts"]');
    await page.waitForURL(/\/admin\/posts$/);
    console.log('  ✓ Filter tabs berfungsi normal.');

    // [5] TEST 5: Form Tambah Artikel (/admin/posts/create) & Dynamic Interactions
    console.log('\n[5] Menguji Form Tambah Artikel, Slug Generator & Scheduled Toggle...');
    const createResp = await page.goto(`${baseUrl}/admin/posts/create`, { waitUntil: 'networkidle' });
    assert.strictEqual(createResp.status(), 200, 'Halaman tambah artikel harus status 200');

    // Verifikasi ketiadaan inline styles pada static form elements (abaikan container TinyMCE library)
    const createInlineStyles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.form-card [style]:not(#scheduledRow), .form-actions-bar [style]'))
        .filter((el) => !el.closest('.tox') && !el.classList.contains('tox') && !el.classList.contains('tox-tinymce') && el.id !== 'content_id' && el.id !== 'content_en')
        .length;
    });
    assert.strictEqual(createInlineStyles, 0, 'Form tambah artikel harus bebas inline style statis');

    // Uji otomatisasi slug dari judul artikel
    await page.fill('#title_id', 'Inovasi Kemasan Makanan Ramah Lingkungan 2026');
    await page.waitForTimeout(100);
    const generatedSlug = await page.inputValue('#slug');
    assert.strictEqual(generatedSlug, 'inovasi-kemasan-makanan-ramah-lingkungan-2026', 'Slug harus otomatis digenerate dari title_id');

    // Uji toggle scheduled row via custom dropdown
    let isScheduledVisible = await page.evaluate(() => {
      const row = document.getElementById('scheduledRow');
      return row && !row.classList.contains('adm-d-none') && row.style.display !== 'none';
    });
    assert.strictEqual(isScheduledVisible, false, 'Scheduled row harus tersembunyi secara default');

    // Pilih status 'scheduled'
    await page.click('.eu-dd:has(#status) .eu-dd-trigger');
    await page.click('.eu-dd:has(#status) .eu-dd-item[data-value="scheduled"]');
    await page.waitForTimeout(150);

    isScheduledVisible = await page.evaluate(() => {
      const row = document.getElementById('scheduledRow');
      return row && !row.classList.contains('adm-d-none') && row.style.display !== 'none';
    });
    assert.strictEqual(isScheduledVisible, true, 'Scheduled row harus tampil saat status scheduled dipilih');

    // Kembalikan ke published
    await page.click('.eu-dd:has(#status) .eu-dd-trigger');
    await page.click('.eu-dd:has(#status) .eu-dd-item[data-value="published"]');
    await page.waitForTimeout(150);

    isScheduledVisible = await page.evaluate(() => {
      const row = document.getElementById('scheduledRow');
      return row && (row.classList.contains('adm-d-none') || row.style.display === 'none');
    });
    assert.strictEqual(isScheduledVisible, true, 'Scheduled row harus tersembunyi kembali');

    // Lengkapi formulir artikel
    await page.fill('#title_id', 'Artikel Berita QA T289 Otomatis');
    await page.fill('#title_en', 'Automated QA News Article T289');
    await page.fill('#slug', 'artikel-berita-qa-t289-otomatis');
    // Isi konten artikel (via TinyMCE & form textarea)
    await page.evaluate(({ contentId, contentEn }) => {
      if (window.tinymce && window.tinymce.get('content_id')) {
        window.tinymce.get('content_id').setContent(contentId);
      }
      const elId = document.getElementById('content_id');
      if (elId) elId.value = contentId;

      if (window.tinymce && window.tinymce.get('content_en')) {
        window.tinymce.get('content_en').setContent(contentEn);
      }
      const elEn = document.getElementById('content_en');
      if (elEn) elEn.value = contentEn;
    }, {
      contentId: '<p>Ini adalah isi artikel pengujian otomatis untuk modul posts refactor.</p>',
      contentEn: '<p>This is automated test content for the posts refactor module.</p>'
    });
    await page.fill('#meta_title_id', 'Meta Title Berita QA');
    await page.fill('#meta_title_en', 'Meta Title News QA');
    await page.fill('#meta_desc_id', 'Deskripsi meta artikel QA');
    await page.fill('#meta_desc_en', 'Meta description of QA news article');
    await page.check('input[name="is_headline"]');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'posts-create-1280.png') });

    // Submit form pembuatan artikel
    await Promise.all([
      page.waitForURL(/\/admin\/posts(\?.*)?$/),
      page.click('button[type="submit"]')
    ]);

    const createdPost = await postModel.findBySlug('artikel-berita-qa-t289-otomatis');
    assert.ok(createdPost, 'Artikel baru harus tersimpan dalam database');
    createdPostId = createdPost.id;
    assert.strictEqual(createdPost.title_id, 'Artikel Berita QA T289 Otomatis', 'Judul artikel harus sesuai');
    assert.strictEqual(createdPost.is_headline, 1, 'Headline flag harus 1');
    console.log(`  ✓ Form tambah artikel, slug generator & toggle jadwal berhasil (ID #${createdPostId}).`);

    // [6] TEST 6: Form Edit Artikel (/admin/posts/:id/edit)
    console.log(`\n[6] Menguji Form Edit Artikel (/admin/posts/${createdPostId}/edit)...`);
    const editResp = await page.goto(`${baseUrl}/admin/posts/${createdPostId}/edit`, { waitUntil: 'networkidle' });
    assert.strictEqual(editResp.status(), 200, 'Halaman edit artikel harus status 200');

    // Verifikasi data pre-filled
    const editTitleId = await page.inputValue('#title_id');
    const editSlug = await page.inputValue('#slug');
    const editMetaTitle = await page.inputValue('#meta_title_id');
    assert.strictEqual(editTitleId, 'Artikel Berita QA T289 Otomatis', 'Judul harus pre-filled');
    assert.strictEqual(editSlug, 'artikel-berita-qa-t289-otomatis', 'Slug harus pre-filled');
    assert.strictEqual(editMetaTitle, 'Meta Title Berita QA', 'Meta title harus pre-filled');

    // Perbarui judul dan meta
    await page.fill('#title_id', 'Artikel Berita QA T289 (Updated)');
    await page.fill('#meta_title_id', 'Meta Title Berita QA (Updated)');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'posts-edit-1280.png') });

    await Promise.all([
      page.waitForURL(/\/admin\/posts(\?.*)?$/),
      page.click('button[type="submit"]')
    ]);

    const updatedPost = await postModel.findById(createdPostId);
    assert.strictEqual(updatedPost.title_id, 'Artikel Berita QA T289 (Updated)', 'Judul artikel harus diperbarui');
    assert.strictEqual(updatedPost.meta_title_id, 'Meta Title Berita QA (Updated)', 'Meta title artikel harus diperbarui');
    console.log('  ✓ Form edit artikel & pembaruan data berhasil diverifikasi.');

    // [7] TEST 7: Hapus Artikel dengan Konfirmasi SweetAlert2
    console.log('\n[7] Menguji Konfirmasi Hapus Artikel (SweetAlert2)...');
    await page.goto(`${baseUrl}/admin/posts`, { waitUntil: 'networkidle' });

    const deleteBtn = page.locator(`form[action*="/posts/${createdPostId}/delete"] button[type="submit"]`);
    await deleteBtn.click();
    await page.waitForTimeout(500);

    const isSwalVisible = await page.locator('.swal2-container').isVisible();
    assert.strictEqual(isSwalVisible, true, 'Pop up SweetAlert konfirmasi hapus harus muncul');

    const swalTitle = await page.locator('.swal2-title').textContent();
    assert.ok(swalTitle.includes('Hapus Artikel'), 'Judul pop up harus Hapus Artikel');

    // Batal hapus
    await page.click('.swal2-cancel');
    await page.waitForTimeout(300);

    const postCheckBefore = await postModel.findById(createdPostId);
    assert.ok(postCheckBefore, 'Artikel tidak boleh terhapus jika dibatalkan');

    // Konfirmasi hapus permanen
    await deleteBtn.click();
    await page.waitForTimeout(500);

    await Promise.all([
      page.waitForURL(/\/admin\/posts(\?.*)?$/),
      page.click('.swal2-confirm')
    ]);

    const postCheckAfter = await postModel.findById(createdPostId);
    assert.strictEqual(postCheckAfter, null, 'Artikel harus terhapus permanen dari database');
    createdPostId = null;
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

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 13 (T-289) LULUS 100%!');
    process.exit(0);
  } finally {
    if (createdPostId) {
      await postModel.delete(createdPostId).catch(() => {});
    }
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verifikasi GAGAL:', err);
  process.exit(1);
});
