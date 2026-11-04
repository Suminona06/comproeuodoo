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
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t285');

console.log('=== TEST SUITE T-285: QA Verifikasi Visual, Fungsional & Regresi (Dashboard Views) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 9
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 9 (dashboard.ejs)...');
  const lintOutputDash = execSync('node scripts/lint-views.js views/admin/dashboard.ejs', { encoding: 'utf-8' });
  assert.ok(lintOutputDash.includes('0 error, 0 warning'), 'views/admin/dashboard.ejs harus 0 error & 0 warning');

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Berkas Batch 9 lulus Lint Views murni (0 error, 0 warning).\n');

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
    // Siapkan data pengujian inquiry dashboard
    const testInquiryData = {
      type: 'inquiry',
      name: 'Bpk. Hendra Gunawan',
      company: 'PT Sinar Jaya Logistik',
      email: 'hendra@sinarjayalogistik.com',
      phone: '081388776655',
      message: 'Kebutuhan bubble mailer dan kantong polymailer custom logo ukuran 30x40 cm.',
      status: 'baru',
      admin_notes: 'Menunggu konfirmasi sampel bahan'
    };
    testInquiryId = await inquiryModel.create(testInquiryData);
    assert.ok(testInquiryId, 'Inquiry pengujian dashboard harus berhasil dibuat');
    console.log(`  ✓ Inquiry pengujian dibuat dengan ID #${testInquiryId}`);

    // [3] TEST 3: Menguji Halaman Dashboard Admin (/admin/dashboard)
    console.log('\n[3] Menguji Halaman Dashboard Admin (/admin/dashboard)...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman dashboard harus status 200 pada ${vp.name}`);

      const inlineStyleCount = await page.evaluate(() => {
        return document.querySelectorAll('#rfqDataTable th[style], #rfqDataTable td[style], .admin-modal-card [style]').length;
      });
      assert.strictEqual(inlineStyleCount, 0, `Tidak boleh ada inline style pada tabel/modal di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `dashboard-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Halaman dashboard tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Halaman dashboard responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Verifikasi Metrik Ringkasan Operasional
    console.log('\n[4] Memverifikasi Metrik Ringkasan Operasional...');
    const pendingText = await page.locator('#heroPendingCount').textContent();
    assert.ok(parseInt(pendingText, 10) >= 1, 'Metrik pending leads harus mencerminkan minimal 1 inquiry baru');
    console.log(`  ✓ Metrik ringkasan RFQ terverifikasi (Pending: ${pendingText}).`);

    // [5] TEST 5: Modal Tinjau Rincian Inquiry & Simpan Catatan
    console.log('\n[5] Menguji Modal Tinjau Rincian Inquiry & Simpan Catatan...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' });

    const reviewBtn = page.locator(`button[data-inquiry-id="${testInquiryId}"]`);
    await assert.doesNotReject(async () => {
      await reviewBtn.click();
    }, 'Tombol tinjau pada tabel RFQ harus dapat diklik');

    await page.waitForSelector('#inquiryDetailModal', { state: 'visible' });

    const companyVal = await page.locator('#modalClientCompany').textContent();
    assert.ok(companyVal.includes('PT Sinar Jaya Logistik'), 'Modal harus menampilkan nama perusahaan klien');

    const nameVal = await page.locator('#modalClientName').textContent();
    assert.ok(nameVal.includes('Bpk. Hendra Gunawan'), 'Modal harus menampilkan nama PIC klien');

    // Update catatan internal via modal form
    await page.fill('#modalAdminNotes', 'Catatan diperbarui dari dashboard test.');
    await page.click('#modalNotesForm button[type="submit"]');

    await page.waitForTimeout(500);

    const updatedInq = await inquiryModel.findById(testInquiryId);
    assert.ok(
      updatedInq.admin_notes.includes('Catatan diperbarui dari dashboard test.'),
      'Catatan inquiry di database harus berhasil diperbarui via form modal dashboard'
    );
    console.log('  ✓ Modal tinjau rincian inquiry dan update catatan via dashboard berfungsi sempurna.');

    // [6] TEST 6: Konsol Browser & Page Errors Check
    console.log('\n[6] Memeriksa integritas konsol JavaScript browser...');
    if (consoleErrors.length > 0) {
      console.error('  Ditemukan console error:', consoleErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, `Harus 0 error konsol browser! Ditemukan: ${consoleErrors.length}`);
    assert.strictEqual(pageErrors.length, 0, `Harus 0 page errors! Ditemukan: ${pageErrors.length}`);
    console.log('  ✓ Nol error konsol browser pada seluruh pengujian.');

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 9 (T-285) LULUS 100%!');
    process.exit(0);
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

