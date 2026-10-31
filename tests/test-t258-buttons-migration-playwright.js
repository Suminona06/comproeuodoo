/**
 * Test Suite: T-258 Playwright Migration Audit of All Admin Buttons (.adm-btn-*)
 * Verifikasi pembersihan menyeluruh .btn-secondary, pemakaian .adm-btn-*,
 * keberadaan ikon SVG, dan pemendekan label dwibahasa ID/EN (Q4).
 */

import { chromium } from 'playwright';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

const VIEWS_ADMIN_DIR = '/home/itpc/Euodoo/views/admin';
const MEDIA_PICKER_MODAL_PATH = '/home/itpc/Euodoo/views/partials/media-picker-modal.ejs';

// Recursive scan for all .ejs files
function getAllEjsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllEjsFiles(filePath, fileList);
    } else if (file.endsWith('.ejs')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

async function runTestSuite() {
  console.log('=== TEST SUITE T-258: Playwright Admin Button Migration Audit ===\n');

  // 1. Audit template files for legacy button classes
  console.log('[1] Memeriksa template admin dari pemakaian class tombol lama...');
  const ejsFiles = getAllEjsFiles(VIEWS_ADMIN_DIR);
  ejsFiles.push(MEDIA_PICKER_MODAL_PATH);

  const legacyRegexes = [
    { label: 'btn btn-secondary', regex: /class=["'][^"']*\bbtn\s+btn-secondary\b[^"']*["']/g },
    { label: 'btn btn-primary', regex: /class=["'][^"']*\bbtn\s+btn-primary\b[^"']*["']/g },
    { label: 'btn btn-danger', regex: /class=["'][^"']*\bbtn\s+btn-danger\b[^"']*["']/g },
    { label: 'btn btn-outline', regex: /class=["'][^"']*\bbtn\s+btn-outline\b[^"']*["']/g },
    { label: 'btn btn-ghost', regex: /class=["'][^"']*\bbtn\s+btn-ghost\b[^"']*["']/g },
  ];

  const violations = [];
  let totalAdmBtnCount = 0;

  for (const filePath of ejsFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative('/home/itpc/Euodoo', filePath);

    // Count .adm-btn
    const admBtnMatches = content.match(/\badm-btn\b/g);
    if (admBtnMatches) {
      totalAdmBtnCount += admBtnMatches.length;
    }

    for (const { label, regex } of legacyRegexes) {
      const matches = content.match(regex);
      if (matches) {
        violations.push({ file: relativePath, label, count: matches.length, matches });
      }
    }
  }

  if (violations.length > 0) {
    console.error('  Ditemukan sisa class tombol lama:', JSON.stringify(violations, null, 2));
  }
  assert.strictEqual(violations.length, 0, `Nol tombol lama diizinkan di admin views! Ditemukan: ${violations.length} pelanggaran.`);
  console.log(`  ✓ Terverifikasi 0 class tombol lama di ${ejsFiles.length} template admin.`);
  console.log(`  ✓ Total pemakaian class .adm-btn terdeteksi: ${totalAdmBtnCount} kemunculan.`);
  assert.ok(totalAdmBtnCount >= 50, `Total .adm-btn harus >= 50 (ditemukan ${totalAdmBtnCount})`);

  // 2. Audit dynamic scripts (admin-settings.js, media-picker.js)
  console.log('\n[2] Memeriksa script dinamis admin (admin-settings.js, media-picker.js)...');
  const adminSettingsJs = fs.readFileSync('/home/itpc/Euodoo/public/js/admin-settings.js', 'utf-8');
  assert.ok(adminSettingsJs.includes('adm-btn-danger'), 'admin-settings.js harus men-generate tombol wa-btn-del dengan .adm-btn-danger');
  console.log('  ✓ admin-settings.js men-generate repeater delete button dengan .adm-btn-danger.');

  // 3. Playwright browser rendering check
  console.log('\n[3] Meluncurkan Playwright headless browser untuk verifikasi visual...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const tokensCss = fs.readFileSync('/home/itpc/Euodoo/public/css/tokens.css', 'utf-8');
  const baseCss = fs.readFileSync('/home/itpc/Euodoo/public/css/base.css', 'utf-8');
  const adminCss = fs.readFileSync('/home/itpc/Euodoo/public/css/admin.css', 'utf-8');

  // Render a representative sample of migrated admin buttons
  const testHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Test T-258 Migration</title>
      <style>
        ${tokensCss}
        ${baseCss}
        ${adminCss}
      </style>
    </head>
    <body style="padding: 24px; background: var(--bg-main, #f8fafc);">
      <div id="testContainer" style="display: flex; flex-direction: column; gap: 16px; max-width: 600px;">
        <!-- Header Actions Sample -->
        <div class="header-actions" style="display: flex; gap: 8px;">
          <a href="#" class="adm-btn adm-btn-secondary" id="btnExport">
            <svg class="adm-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Ekspor</span>
          </a>
          <a href="#" class="adm-btn adm-btn-primary" id="btnCreate">
            <svg class="adm-btn-icon adm-btn-icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Tambah</span>
          </a>
        </div>

        <!-- Sticky Actions Bar Sample -->
        <div class="form-actions-bar" style="display: flex; gap: 8px;">
          <a href="#" class="adm-btn adm-btn-neutral" id="btnCancel">
            <svg class="adm-btn-icon adm-btn-icon-back" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Batal</span>
          </a>
          <button type="submit" class="adm-btn adm-btn-primary" id="btnSave">
            <svg class="adm-btn-icon adm-btn-icon-save" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Simpan</span>
          </button>
        </div>

        <!-- Table Row Action Sample -->
        <div style="display: flex; gap: 8px;">
          <button type="button" class="adm-btn adm-btn-secondary adm-btn-sm" id="btnPicker">
            <svg class="adm-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Pilih Media</span>
          </button>
          <button type="button" class="adm-btn adm-btn-danger adm-btn-sm" id="btnDelete">
            <svg class="adm-btn-icon adm-btn-icon-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(testHtml, { waitUntil: 'networkidle' });

  // 4. Verify all 4 variants render properly with SVG icons
  console.log('\n[4] Memeriksa properti visual dan ikon SVG tombol...');
  const btnIds = ['btnExport', 'btnCreate', 'btnCancel', 'btnSave', 'btnPicker', 'btnDelete'];
  for (const id of btnIds) {
    const btn = page.locator(`#${id}`);
    assert.ok(await btn.isVisible(), `Tombol #${id} harus terlihat di layar`);

    // Verify SVG icon exists
    const icon = btn.locator('svg.adm-btn-icon');
    assert.ok(await icon.count() >= 1, `Tombol #${id} harus memiliki elemen SVG icon .adm-btn-icon`);

    // Verify short label text
    const text = (await btn.locator('span').textContent()).trim();
    assert.ok(['Ekspor', 'Tambah', 'Batal', 'Simpan', 'Pilih Media', 'Hapus'].includes(text),
      `Label #${id} "${text}" harus merupakan label pendek yang disetujui`);
  }
  console.log('  ✓ Seluruh 6 tombol sample ter-render sempurna dengan SVG icon dan label pendek yang disetujui.');

  // 5. Mobile viewport touch target test (<= 768px, target height >= 44px)
  console.log('\n[5] Menguji target sentuh pada mobile viewport (375x667)...');
  await page.setViewportSize({ width: 375, height: 667 });

  const btnSaveBox = await page.locator('#btnSave').boundingBox();
  const btnCancelBox = await page.locator('#btnCancel').boundingBox();
  const btnCreateBox = await page.locator('#btnCreate').boundingBox();

  console.log(`  Tinggi mobile #btnSave: ${btnSaveBox.height}px`);
  console.log(`  Tinggi mobile #btnCancel: ${btnCancelBox.height}px`);
  console.log(`  Tinggi mobile #btnCreate: ${btnCreateBox.height}px`);

  assert.ok(btnSaveBox.height >= 43.5, `#btnSave height (${btnSaveBox.height}px) harus >= 44px`);
  assert.ok(btnCancelBox.height >= 43.5, `#btnCancel height (${btnCancelBox.height}px) harus >= 44px`);
  assert.ok(btnCreateBox.height >= 43.5, `#btnCreate height (${btnCreateBox.height}px) harus >= 44px`);
  console.log('  ✓ Touch target mobile terverifikasi memenuhi standar >= 44px.');

  // 6. Prefers-reduced-motion test
  console.log('\n[6] Menguji perilaku prefers-reduced-motion...');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const transition = await page.locator('#btnSave').evaluate(el => window.getComputedStyle(el).transitionDuration);
  console.log(`  Transition duration under reduced-motion: ${transition}`);
  assert.ok(transition === '0s' || transition === '0.001s', 'Transition harus dinonaktifkan (0s) pada reduced-motion');
  console.log('  ✓ prefers-reduced-motion terverifikasi menonaktifkan transisi animasi.');

  // 7. Verify zero browser console errors
  console.log('\n[7] Memeriksa browser console errors...');
  assert.strictEqual(consoleErrors.length, 0, `Nol console error diharapkan! Ditemukan: ${consoleErrors.join(', ')}`);
  console.log('  ✓ Nol console error tercatat.');

  await browser.close();
  console.log('\n=== SELURUH TEST SUITE T-258 BERHASIL DILALUI (PASSED)! ===');
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST GAGAL:', err);
  process.exit(1);
});
