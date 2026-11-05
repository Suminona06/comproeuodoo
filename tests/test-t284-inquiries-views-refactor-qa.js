import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import inquiryModel from '../models/inquiryModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/9f11355d-9552-45f1-9bf5-7218dad8c8aa';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t284');

console.log('=== TEST SUITE T-284: QA Verifikasi Visual, Fungsional & Regresi (Inquiries Views) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 8
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 8 (inquiries index, detail)...');
  const lintOutputIndex = execSync('node scripts/lint-views.js views/admin/inquiries/index.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputIndex.includes('0 error, 0 warning'), 'views/admin/inquiries/index.ejs harus 0 error & 0 warning');

  const lintOutputDetail = execSync('node scripts/lint-views.js views/admin/inquiries/detail.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputDetail.includes('0 error, 0 warning'), 'views/admin/inquiries/detail.ejs harus 0 error & 0 warning');

  const lintOutputDir = execSync('node scripts/lint-views.js views/admin/inquiries/', { encoding: 'utf-8' });
  assert.ok(lintOutputDir.includes('0 error, 0 warning'), 'views/admin/inquiries/ harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Seluruh berkas Batch 8 lulus Lint Views murni (0 error, 0 warning).\n');

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

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Laptop', width: 1280, height: 800 },
    { name: 'Desktop', width: 1440, height: 900 }
  ];

  let testInquiryId = null;

  try {
    // Siapkan data pengujian inquiry
    const testInquiryData = {
      type: 'inquiry',
      name: 'QA Test Client',
      company: 'PT Global Packindo Mandiri',
      email: 'qa.test@packindo.com',
      phone: '081299887766',
      message: 'Permintaan penawaran kemasan standing pouch zipper ukuran 250g sebanyak 5000 pcs.',
      status: 'baru',
      admin_notes: 'Catatan awal inquiry testing'
    };
    testInquiryId = await inquiryModel.create(testInquiryData);
    assert.ok(testInquiryId, 'Inquiry pengujian harus berhasil dibuat');
    console.log(`  ✓ Inquiry pengujian dibuat dengan ID #${testInquiryId}`);

    // [3] TEST 3: Menguji Halaman Daftar Inquiries (/admin/inquiries)
    console.log('\n[3] Menguji Halaman Daftar Inquiries (/admin/inquiries)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/inquiries`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman inquiries harus status 200 pada ${vp.name}`);

      const inlineStyleCount = await page.evaluate(() => {
        return document.querySelectorAll('.data-table th[style], .data-table td[style], .adm-inq-pagination[style]').length;
      });
      assert.strictEqual(inlineStyleCount, 0, `Tidak boleh ada inline style pada tabel/pagination di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `inquiries-index-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman inquiries tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Halaman inquiries responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Modal Quick Review & Interaktivitas Client
    console.log('\n[4] Menguji Modal Quick Review & Interaktivitas Client...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}/admin/inquiries`, { waitUntil: 'networkidle' });

    // Buka modal quick review menggunakan tombol tinjau
    const reviewBtn = page.locator(`button[data-inquiry-id="${testInquiryId}"]`);
    await assert.doesNotReject(async () => {
      await reviewBtn.click();
    }, 'Tombol tinjau cepat harus dapat diklik');

    await page.waitForSelector('#inquiryDetailModal', { state: 'visible' });

    const companyVal = await page.locator('#mClientCompany').textContent();
    assert.ok(companyVal.includes('PT Global Packindo Mandiri'), 'Modal harus menampilkan nama perusahaan klien');

    const nameVal = await page.locator('#mClientName').textContent();
    assert.ok(nameVal.includes('QA Test Client'), 'Modal harus menampilkan nama PIC klien');

    // Update catatan internal via modal
    await page.fill('#mAdminNotes', 'Catatan diperbarui melalui quick modal review.');
    await page.click('#mNotesForm button[type="submit"]');

    // Tunggu modal tertutup
    await page.waitForTimeout(500);

    // Verifikasi catatan di database terupdate
    const updatedInq = await inquiryModel.findById(testInquiryId);
    assert.ok(
      updatedInq.admin_notes.includes('Catatan diperbarui melalui quick modal review.'),
      'Catatan inquiry di database harus berhasil diperbarui via form modal'
    );
    console.log('  ✓ Modal quick review dan penyimpanan catatan internal berfungsi sempurna.');

    // [5] TEST 5: Menguji Halaman Rincian Inquiries (/admin/inquiries/:id)
    console.log('\n[5] Menguji Halaman Rincian Inquiries (/admin/inquiries/:id)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/inquiries/${testInquiryId}`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman detail inquiry harus status 200 pada ${vp.name}`);

      const inlineStylesInDetail = await page.evaluate(() => {
        return document.querySelectorAll('.adm-inq-detail-layout [style], .adm-inq-detail-message-box[style]').length;
      });
      assert.strictEqual(inlineStylesInDetail, 0, `Tidak boleh ada inline style pada detail layout di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `inquiries-detail-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman detail inquiry tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Halaman detail inquiry responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [6] TEST 6: Menguji Filter Status, Search & Ekspor CSV
    console.log('\n[6] Menguji Fitur Filter & Ekspor CSV Inquiries...');
    const filterResp = await page.goto(`${baseUrl}/admin/inquiries?status=all&search=Packindo`, { waitUntil: 'networkidle' });
    assert.strictEqual(filterResp.status(), 200, 'Pencarian inquiry harus berhasil status 200');

    const searchRow = await page.locator(`#inq-row-${testInquiryId}`).count();
    assert.ok(searchRow > 0, 'Inquiry hasil pencarian harus tampil di tabel');

    const exportResp = await page.request.get(`${baseUrl}/admin/inquiries/export?status=all`);
    assert.strictEqual(exportResp.status(), 200, 'Ekspor CSV inquiry harus berhasil status 200');
    const contentType = exportResp.headers()['content-type'] || '';
    assert.ok(contentType.includes('text/csv'), 'Header content-type ekspor harus text/csv');
    console.log('  ✓ Filter status, pencarian text, dan ekspor CSV berfungsi lancar.');

    // [7] TEST 7: Konsol Browser & Page Errors Check
    console.log('\n[7] Memeriksa integritas konsol JavaScript browser...');
    if (consoleErrors.length > 0) {
      console.error('  Ditemukan console error:', consoleErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, `Harus 0 error konsol browser! Ditemukan: ${consoleErrors.length}`);
    assert.strictEqual(pageErrors.length, 0, `Harus 0 page errors! Ditemukan: ${pageErrors.length}`);
    console.log('  ✓ Nol error konsol browser pada seluruh pengujian.');

    if (testInquiryId) {
      await inquiryModel.delete(testInquiryId).catch(() => {});
      console.log('  ✓ Data inquiry pengujian berhasil dibersihkan.');
    }

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 8 (T-284) LULUS 100%!');
  } finally {
    if (testInquiryId) {
      await inquiryModel.delete(testInquiryId).catch(() => {});
    }
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verifikasi GAGAL:', err);
  process.exit(1);
});

