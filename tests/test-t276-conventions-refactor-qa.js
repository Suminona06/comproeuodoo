import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import settingModel from '../models/settingModel.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';

console.log('=== TEST SUITE T-276: QA Verifikasi Visual, Fungsional & Regresi (Admin Settings) ===\n');

async function runQAVerification() {
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
    // TEST 1: Frozen Files & Linting Verification
    // ─────────────────────────────────────────────────────────────
    console.log('[1] Memeriksa status Homepage (harus tetap dibekukan tanpa perubahan)...');
    const homepageDiff = execSync('git diff HEAD views/public/index.ejs', { encoding: 'utf-8' }).trim();
    assert.strictEqual(homepageDiff, '', 'views/public/index.ejs HARUS identik dengan HEAD (dibekukan, tidak boleh disentuh)');
    console.log('  ✓ Homepage views/public/index.ejs terverifikasi 100% utuh tanpa modifikasi.');

    console.log('\n[2] Memeriksa kepatuhan views/admin/settings/ terhadap konvensi...');
    const lintViewsOutput = execSync('node scripts/lint-views.js views/admin/settings/', { encoding: 'utf-8' });
    assert.ok(lintViewsOutput.includes('0 error, 0 warning'), 'views/admin/settings/ harus 0 error dan 0 warning');
    console.log('  ✓ Template views/admin/settings/ lulus murni: 0 inline style, 0 hex, 0 komentar HTML.');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Responsivitas & Bebas Overflow Horizontal pada Desktop, Tablet, Mobile
    // ─────────────────────────────────────────────────────────────
    console.log('\n[3] Memeriksa tampilan visual & overflow horizontal lintas viewport...');
    const viewports = [
      { name: 'Desktop Large', width: 1440, height: 900 },
      { name: 'Desktop Standard', width: 1280, height: 800 },
      { name: 'Tablet iPad', width: 768, height: 1024 },
      { name: 'Mobile Phone', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });

      const metrics = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const formCards = document.querySelectorAll('.form-card').length;
        const stickyBar = document.querySelector('.settings-sticky-actions');

        return {
          hasOverflow: docWidth > winWidth,
          formCardsCount: formCards,
          hasStickyBar: Boolean(stickyBar)
        };
      });

      assert.strictEqual(metrics.hasOverflow, false, `Viewport ${vp.name} (${vp.width}px) tidak boleh mengalami horizontal overflow`);
      assert.strictEqual(metrics.formCardsCount, 5, `Viewport ${vp.name} harus memuat 5 form cards`);
      assert.strictEqual(metrics.hasStickyBar, true, `Viewport ${vp.name} harus memiliki sticky action bar`);
      console.log(`  ✓ Viewport ${vp.name} (${vp.width}x${vp.height}): 0 overflow, 5 cards rapi, sticky bar aktif.`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Interaksi Komponen Form & Multi-Number Repeater
    // ─────────────────────────────────────────────────────────────
    console.log('\n[4] Memeriksa interaktivitas komponen form di /admin/settings...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });

    // Tambah baris WhatsApp baru via repeater
    const initialRowsCount = await page.evaluate(() => document.querySelectorAll('tr.wa-row').length);
    await page.click('#btnAddWaRow');
    const afterAddRowsCount = await page.evaluate(() => document.querySelectorAll('tr.wa-row').length);
    assert.strictEqual(afterAddRowsCount, initialRowsCount + 1, 'Tombol Tambah Nomor WhatsApp harus menambah baris');

    // Hapus kembali baris baru
    const deleteBtn = await page.$('tr.wa-row:last-child .wa-btn-del');
    if (deleteBtn) await deleteBtn.click();
    const afterDelRowsCount = await page.evaluate(() => document.querySelectorAll('tr.wa-row').length);
    assert.strictEqual(afterDelRowsCount, initialRowsCount, 'Tombol Hapus baris WhatsApp harus menghapus baris');
    console.log('  ✓ WhatsApp multi-number dynamic repeater bekerja sempurna.');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Alur Simpan Form (POST E2E) & Preservasi Data
    // ─────────────────────────────────────────────────────────────
    console.log('\n[5] Menguji alur simpan form pengaturan situs (POST submit)...');
    const initialSettings = await settingModel.getAll();

    // Isi perubahan uji coba
    await page.fill('#company_name', 'PT Euodoo Presisi Indonesia (QA Test)');
    await page.fill('#company_email', 'qa-test@euodoo.com');

    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('button[type="submit"]')
    ]);

    assert.strictEqual(response.status(), 200, 'POST /admin/settings harus redirect dan kembali 200 OK');
    const updatedCompanyName = await page.inputValue('#company_name');
    assert.strictEqual(updatedCompanyName, 'PT Euodoo Presisi Indonesia (QA Test)', 'Nilai baru harus tersimpan dan tampil di form');
    console.log('  ✓ Data berhasil disimpan ke database via form POST dan tampil kembali.');

    // Pulihkan kembali data asli agar database tetap bersih
    console.log('  -> Memulihkan data pengaturan kembali ke kondisi semula...');
    await page.fill('#company_name', initialSettings.company_name || 'PT Euodoo Presisi Indonesia');
    await page.fill('#company_email', initialSettings.company_email || 'info@euodoo.com');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('button[type="submit"]')
    ]);
    console.log('  ✓ Data pengaturan berhasil dipulihkan.');

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Browser Console & Uncaught Errors Audit
    // ─────────────────────────────────────────────────────────────
    console.log('\n[6] Memeriksa browser console & uncaught errors...');
    assert.strictEqual(consoleErrors.length, 0, `Tidak boleh ada console errors: ${JSON.stringify(consoleErrors)}`);
    assert.strictEqual(pageErrors.length, 0, `Tidak boleh ada page errors: ${JSON.stringify(pageErrors)}`);
    console.log('  ✓ Nol browser console errors & nol uncaught page errors.');

    console.log('\n======================================================');
    console.log('🎉 SEMUA VERIFIKASI T-276 BERHASIL LULUS 100%! 🎉');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

runQAVerification().catch(err => {
  console.error('\n❌ TEST QA T-276 GAGAL:', err);
  process.exit(1);
});

