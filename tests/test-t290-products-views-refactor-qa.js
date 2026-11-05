import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import productModel from '../models/productModel.js';
import productCategoryModel from '../models/productCategoryModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/9f11355d-9552-45f1-9bf5-7218dad8c8aa';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t290');

console.log('=== TEST SUITE T-290: QA Verifikasi Visual, Modularisasi & Fungsional (Products Views Refactor) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 14
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 14 (views/admin/products/)...');
  const lintOutput = execSync('node scripts/lint-views.js views/admin/products/', { encoding: 'utf-8' });
  assert.ok(lintOutput.includes('0 error, 0 warning'), 'views/admin/products/ harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Berkas Batch 14 lulus Lint Views murni (0 error, 0 warning).\n');

  // [2] TEST 2: Modular Partials Line Count Verification (Must be <= 100 lines each)
  console.log('[2] Memverifikasi batasan ukuran partials (maksimal <= 100 baris)...');
  const partialsDir = path.resolve('views/admin/products/partials');
  const partialFiles = fs.readdirSync(partialsDir).filter(f => f.endsWith('.ejs'));
  assert.ok(partialFiles.length >= 4, 'Harus memiliki minimal 4 berkas partials');

  for (const pf of partialFiles) {
    const fullPath = path.join(partialsDir, pf);
    const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
    console.log(`    - ${pf}: ${lineCount} baris`);
    assert.ok(lineCount <= 100, `Berkas partials ${pf} (${lineCount} baris) melebihi batas 100 baris!`);
  }
  console.log('  ✓ Seluruh berkas partials mematuhi batas <= 100 baris.\n');

  // [3] TEST 3: Start Dynamic HTTP Server & Launch Playwright
  console.log('[3] Membuka server pengujian lokal & browser Playwright...');
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

  let createdProductId = null;

  try {
    // [4] TEST 4: Render Index Products di 4 Viewport
    console.log('\n[4] Menguji Render Daftar Produk (/admin/products) di 4 Viewport...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman products harus status 200 pada ${vp.name}`);

      const inlineStyleCount = await page.evaluate(() => {
        return document.querySelectorAll('.data-table [style], .adm-prod-thumb [style], .adm-prod-badge-cat [style], .adm-prod-empty-td [style]').length;
      });
      assert.strictEqual(inlineStyleCount, 0, `Tidak boleh ada inline style pada tabel produk di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `products-index-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman produk tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Halaman index katalog produk responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [5] TEST 5: Filter Tabs & Kategori pada /admin/products
    console.log('\n[5] Menguji Filter Tabs Status & Kategori Dropdown...');
    await page.setViewportSize({ width: 1280, height: 800 });

    // Status Tab Published
    await page.click('.filter-tabs-wrap a[href*="status=published"]');
    await page.waitForURL(/\/admin\/products\?status=published/);
    let activeTab = await page.locator('.filter-tabs-wrap .tab-btn.active').textContent();
    assert.ok(activeTab.includes('Published'), 'Tab Published harus aktif');

    // Status Tab Draft
    await page.click('.filter-tabs-wrap a[href*="status=draft"]');
    await page.waitForURL(/\/admin\/products\?status=draft/);
    activeTab = await page.locator('.filter-tabs-wrap .tab-btn.active').textContent();
    assert.ok(activeTab.includes('Draft'), 'Tab Draft harus aktif');

    // Reset ke Semua
    await page.click('.filter-tabs-wrap a[href="/admin/products"]');
    await page.waitForURL(/\/admin\/products$/);
    console.log('  ✓ Filter tabs status berfungsi normal.');

    // [6] TEST 6: Form Tambah Produk (/admin/products/create) & Interaksi Dinamis
    console.log('\n[6] Menguji Form Tambah Produk & Interaktivitas Komponen...');
    const createResp = await page.goto(`${baseUrl}/admin/products/create`, { waitUntil: 'networkidle' });
    assert.strictEqual(createResp.status(), 200, 'Halaman tambah produk harus status 200');

    // Verifikasi ketiadaan inline styles pada form card
    const createInlineStyles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.form-card [style], .form-actions-bar [style]'))
        .filter((el) => !el.closest('.tox') && !el.classList.contains('tox') && !el.classList.contains('tox-tinymce') && el.id !== 'description_id' && el.id !== 'description_en')
        .length;
    });
    assert.strictEqual(createInlineStyles, 0, 'Form tambah produk harus bebas inline style statis');

    // Uji Char Counter pada Short Description
    await page.fill('#short_description_id', 'Tes deskripsi singkat ID 123');
    const counterIdText = await page.textContent('#counter_short_desc_id');
    assert.strictEqual(counterIdText.trim(), '28/200', 'Char counter ID harus sinkron');

    await page.fill('#short_description_en', 'Test short description EN 123');
    const counterEnText = await page.textContent('#counter_short_desc_en');
    assert.strictEqual(counterEnText.trim(), '29/200', 'Char counter EN harus sinkron');

    // Uji Tambah & Hapus Baris Varian
    const initialVariantRows = await page.locator('.prod-variant-row-item').count();
    await page.click('#btnAddVariant');
    await page.waitForTimeout(100);
    const afterAddVariantRows = await page.locator('.prod-variant-row-item').count();
    assert.strictEqual(afterAddVariantRows, initialVariantRows + 1, 'Baris varian harus bertambah');

    // Hapus baris varian terakhir
    await page.locator('.prod-variant-row-item:last-child .btn-remove-variant').click();
    await page.waitForTimeout(100);
    const afterDelVariantRows = await page.locator('.prod-variant-row-item').count();
    assert.strictEqual(afterDelVariantRows, initialVariantRows, 'Baris varian harus berkurang setelah dihapus');

    // Uji editor tabel ukuran dinamis
    const sizeEditorExists = await page.locator('#dynamicSizeEditor').count();
    assert.strictEqual(sizeEditorExists, 1, 'Dynamic size editor harus terpasang di DOM');

    // Pilih Kategori yang tersedia
    const categories = await productCategoryModel.findAll();
    assert.ok(categories.length > 0, 'Harus ada kategori produk di database untuk pengujian');
    const testCatId = String(categories[0].id);

    // Pilih kategori via custom dropdown atau native select
    const customCatDd = page.locator('.eu-dd:has(#category_id)');
    if (await customCatDd.count() > 0) {
      await customCatDd.locator('.eu-dd-trigger').click();
      await customCatDd.locator(`.eu-dd-item[data-value="${testCatId}"]`).click();
    } else {
      await page.selectOption('#category_id', testCatId);
    }

    // Isi Form Pembuatan Produk
    const testProdNameId = 'Katalog Produk Plastik QA T290 Otomatis';
    const testProdNameEn = 'Automated QA Plastic Packaging Product T290';

    await page.fill('#name_id', testProdNameId);
    await page.fill('#name_en', testProdNameEn);
    await page.fill('#cta_text_id', 'Konsultasi Spesifikasi');
    await page.fill('#cta_text_en', 'Consult Specifications');

    await page.evaluate(({ descId, descEn }) => {
      if (window.tinymce && window.tinymce.get('description_id')) {
        window.tinymce.get('description_id').setContent(descId);
      }
      const elId = document.getElementById('description_id');
      if (elId) elId.value = descId;

      if (window.tinymce && window.tinymce.get('description_en')) {
        window.tinymce.get('description_en').setContent(descEn);
      }
      const elEn = document.getElementById('description_en');
      if (elEn) elEn.value = descEn;
    }, {
      descId: '<p>Deskripsi teknis material kemasan plastik kualitas tinggi untuk pengujian modul produk batch 14.</p>',
      descEn: '<p>High quality technical plastic packaging material description for batch 14 module testing.</p>'
    });

    await page.fill('#meta_title_id', 'Meta Title Produk QA');
    await page.fill('#meta_title_en', 'Meta Title Product QA');
    await page.fill('#meta_desc_id', 'Meta Description Produk QA');
    await page.fill('#meta_desc_en', 'Meta Description Product QA');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'products-create-1280.png') });

    // Submit form pembuatan produk
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    // Verifikasi produk tersimpan di DB
    const created = await productModel.findBySlug('katalog-produk-plastik-qa-t290-otomatis');
    assert.ok(created, 'Produk baru harus ditemukan di database berdasarkan slug kanonik');
    assert.strictEqual(created.name_id, testProdNameId, 'Nama ID produk di DB harus cocok');
    createdProductId = created.id;
    console.log(`  ✓ Produk baru berhasil dibuat dengan ID: ${createdProductId}`);

    // [7] TEST 7: Form Edit Produk (/admin/products/:id/edit)
    console.log(`\n[7] Menguji Halaman Edit Produk (/admin/products/${createdProductId}/edit)...`);
    const editResp = await page.goto(`${baseUrl}/admin/products/${createdProductId}/edit`, { waitUntil: 'networkidle' });
    assert.strictEqual(editResp.status(), 200, 'Halaman edit produk harus status 200');

    // Verifikasi ketiadaan inline styles
    const editInlineStyles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.form-card [style], .form-actions-bar [style]'))
        .filter((el) => !el.closest('.tox') && !el.classList.contains('tox') && !el.classList.contains('tox-tinymce') && el.id !== 'description_id' && el.id !== 'description_en')
        .length;
    });
    assert.strictEqual(editInlineStyles, 0, 'Form edit produk harus bebas inline style statis');

    // Verifikasi tampilan canonical slug
    const canonicalSlugText = await page.textContent('.adm-slug-val');
    assert.strictEqual(canonicalSlugText.trim(), 'katalog-produk-plastik-qa-t290-otomatis', 'Kanonik slug harus ditampilkan di edit form');

    // Lakukan pembaruan nama produk
    const updatedNameId = 'Katalog Produk Plastik QA T290 Updated';
    await page.fill('#name_id', updatedNameId);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'products-edit-1280.png') });

    // Submit form pembaruan produk
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    // Verifikasi perubahan di DB
    const updated = await productModel.findById(createdProductId);
    assert.strictEqual(updated.name_id, updatedNameId, 'Nama produk di database harus terupdate');
    console.log('  ✓ Data produk berhasil diperbarui.');

    // [8] TEST 8: Uji Hapus Produk & Modal Konfirmasi SweetAlert2
    console.log('\n[8] Menguji Hapus Produk dengan Konfirmasi SweetAlert2...');
    await page.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle' });

    // Cari baris produk yang baru dibuat
    const rowSelector = `tr:has(a[href="/admin/products/${createdProductId}/edit"])`;
    assert.ok(await page.locator(rowSelector).count() > 0, 'Baris produk harus ditemukan di tabel');

    // Klik tombol hapus
    await page.locator(`${rowSelector} button.btn-action-delete`).click();

    // Cek apakah dialog konfirmasi SweetAlert muncul
    const swalConfirm = page.locator('.swal2-confirm');
    if (await swalConfirm.isVisible()) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        swalConfirm.click()
      ]);
    } else {
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    }

    // Verifikasi produk telah dihapus dari DB
    const deletedCheck = await productModel.findById(createdProductId);
    assert.ok(!deletedCheck, 'Produk harus terhapus dari basis data');
    createdProductId = null;
    console.log('  ✓ Produk berhasil dihapus dari tabel dan basis data secara bersih.');

  } finally {
    // Cleanup bila terjadi kegagalan
    if (createdProductId) {
      try {
        await productModel.delete(createdProductId);
        console.log(`[CLEANUP] Produk pengujian ID ${createdProductId} dibersihkan.`);
      } catch {
        // ignore
      }
    }
    await browser.close();
    server.close();
  }

  // [9] TEST 9: Console & Page Errors Verification
  console.log('\n[9] Verifikasi Log Konsol Browser...');
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }
  if (pageErrors.length > 0) {
    console.error('Page errors:', pageErrors);
  }
  assert.strictEqual(consoleErrors.length, 0, 'Tidak boleh ada error konsol browser selama pengujian');
  assert.strictEqual(pageErrors.length, 0, 'Tidak boleh ada error halaman (unhandled exception) selama pengujian');
  console.log('  ✓ 0 browser console errors & 0 page errors.');

  console.log('\n=== SELURUH GERBANG KUALITAS T-290 LULUS 100%! ===');
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verification GAGAL:', err);
  process.exit(1);
});
