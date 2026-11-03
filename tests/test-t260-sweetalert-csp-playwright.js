/**
 * Test Suite: T-260 SweetAlert2 Theming & CSP Inline Handler Removal
 * Verifikasi penggantian seluruh alert() / confirm() native dengan SweetAlert2 bertema (.adm-btn-danger, .adm-btn-neutral),
 * serta pembersihan menyeluruh inline event handler di views admin untuk kepatuhan CSP.
 */

import { chromium } from 'playwright';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

function findFilesRecursive(dir, extList = ['.js', '.ejs']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFilesRecursive(filePath, extList));
    } else {
      if (extList.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

async function runTestSuite() {
  console.log('=== TEST SUITE T-260: SweetAlert2 Theming & CSP Cleanliness ===\n');

  // [1] Static Audit: Zero alert() or confirm() in public/js and views/admin
  console.log('[1] Mengaudit kode statis: Nol alert() dan confirm() native...');
  const jsFiles = findFilesRecursive('/home/itpc/Euodoo/public/js', ['.js']);
  const adminViewFiles = findFilesRecursive('/home/itpc/Euodoo/views/admin', ['.ejs']);
  const allTargetFiles = [...jsFiles, ...adminViewFiles];

  const alertConfirmRegex = /\b(alert|confirm)\s*\(/;
  const violations = [];

  for (const f of allTargetFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Ignore comment lines
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
      if (alertConfirmRegex.test(line)) {
        violations.push(`${path.relative('/home/itpc/Euodoo', f)}:${idx + 1}: ${line.trim()}`);
      }
    });
  }

  console.log(`  File diaudit: ${allTargetFiles.length} berkas.`);
  if (violations.length > 0) {
    console.error('  Ditemukan pemanggilan native alert/confirm:');
    violations.forEach(v => console.error(`   - ${v}`));
  }
  assert.strictEqual(violations.length, 0, `Harus nol pemanggilan alert() dan confirm() native! Ditemukan ${violations.length} pelanggaran.`);
  console.log('  ✓ Nol pemanggilan alert() dan confirm() native terverifikasi.');

  // [2] Static Audit: Zero inline handlers in views/admin/
  console.log('\n[2] Mengaudit kode statis: Nol inline event handler di views/admin/ (Kepatuhan CSP)...');
  const inlineHandlerRegex = /\b(onclick|onchange|onsubmit|oninput|onerror)\s*=/i;
  const inlineViolations = [];

  for (const f of adminViewFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (inlineHandlerRegex.test(line)) {
        inlineViolations.push(`${path.relative('/home/itpc/Euodoo', f)}:${idx + 1}: ${line.trim()}`);
      }
    });
  }

  if (inlineViolations.length > 0) {
    console.error('  Ditemukan inline handler di views/admin/:');
    inlineViolations.forEach(v => console.error(`   - ${v}`));
  }
  assert.strictEqual(inlineViolations.length, 0, `Harus nol inline handler di views/admin/! Ditemukan ${inlineViolations.length} pelanggaran.`);
  console.log('  ✓ Nol inline event handler di seluruh views/admin/ terverifikasi patuh CSP.');

  // [3] Playwright Runtime Test: SweetAlert2 Theming & Global Event Delegation
  console.log('\n[3] Menguji perilaku SweetAlert2 dan event delegation di browser...');
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
  const adminJs = fs.readFileSync('/home/itpc/Euodoo/public/js/admin.js', 'utf-8');
  const swalJs = fs.readFileSync('/home/itpc/Euodoo/public/vendor/sweetalert2/sweetalert2.min.js', 'utf-8');

  const testHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Test T-260 SweetAlert2 & CSP</title>
      <style>
        ${tokensCss}
        ${baseCss}
        ${adminCss}
      </style>
      <script>${swalJs}</script>
    </head>
    <body style="padding: 24px;">
      <!-- Modal target for delegation test -->
      <div class="admin-modal-backdrop" id="testModal">
        <div class="admin-modal-card">
          <div class="admin-modal-header">
            <span>Modal Uji</span>
            <button type="button" class="modal-close-btn admin-modal-close" data-modal-close="testModal">X</button>
          </div>
          <div class="admin-modal-body">Isi Modal</div>
          <div class="admin-modal-footer">
            <button type="button" class="adm-btn adm-btn-neutral" data-modal-close="testModal">Batal</button>
          </div>
        </div>
      </div>

      <!-- Trigger buttons for modal -->
      <button type="button" class="adm-btn adm-btn-primary" id="btnOpenTestModal" data-modal-open="testModal">Buka Modal</button>

      <!-- Auto-submit select test -->
      <form id="autoSubmitForm" action="/dummy-filter" method="GET">
        <select id="autoSubmitSelect" name="filter" data-auto-submit="true">
          <option value="1">Opsi 1</option>
          <option value="2">Opsi 2</option>
        </select>
      </form>

      <!-- Delete Form for Interceptor Test -->
      <form id="testDeleteForm" action="/dummy-delete" method="POST" data-confirm-delete="true" data-confirm-title="Hapus Produk Uji" data-confirm-message="Apakah Anda yakin ingin menghapus produk ini?">
        <button type="submit" id="btnDeleteSubmit" class="adm-btn adm-btn-danger">Hapus</button>
      </form>

      <!-- Fallback Image Test -->
      <img id="testFallbackImg" class="adm-img-fallback" src="/invalid-broken-image.jpg" data-fallback="/images/hero-factory.jpg" alt="Test Image">

      <script>${adminJs}</script>
    </body>
    </html>
  `;

  await page.setContent(testHtml);

  // [4] Test window.showAdminConfirm with danger variant (Q7)
  console.log('\n[4] Menguji window.showAdminConfirm dengan tombol .adm-btn-danger dan .adm-btn-neutral...');
  const confirmPromise = page.evaluate(() => {
    return window.showAdminConfirm({
      title: 'Konfirmasi Hapus Data',
      text: 'Data yang dihapus tidak dapat dipulihkan.',
      isDanger: true
    });
  });

  // Wait for SweetAlert2 modal to appear
  const swalPopup = page.locator('.swal2-popup.swal2-custom-popup');
  await swalPopup.waitFor({ state: 'visible', timeout: 3000 });
  assert.ok(await swalPopup.isVisible(), 'Popup SweetAlert2 harus tampil');

  // Verify confirm button classes (.adm-btn .adm-btn-danger)
  const confirmBtn = page.locator('.swal2-actions .adm-btn.adm-btn-danger');
  assert.ok(await confirmBtn.isVisible(), 'Tombol konfirmasi hapus HARUS memiliki class .adm-btn .adm-btn-danger');
  const confirmText = await confirmBtn.textContent();
  console.log(`  Teks tombol konfirmasi: "${confirmText.trim()}"`);
  assert.ok(confirmText.includes('Hapus'), 'Tombol konfirmasi harus memuat label "Hapus"');

  // Verify confirm button contains trash icon
  const trashIcon = confirmBtn.locator('svg.adm-btn-icon-trash');
  assert.strictEqual(await trashIcon.count(), 1, 'Tombol konfirmasi hapus harus memiliki ikon SVG tempat sampah');

  // Verify cancel button classes (.adm-btn .adm-btn-neutral)
  const cancelBtn = page.locator('.swal2-actions .adm-btn.adm-btn-neutral');
  assert.ok(await cancelBtn.isVisible(), 'Tombol batal HARUS memiliki class .adm-btn .adm-btn-neutral');
  const cancelText = await cancelBtn.textContent();
  console.log(`  Teks tombol batal: "${cancelText.trim()}"`);
  assert.ok(cancelText.includes('Batal'), 'Tombol batal harus memuat label "Batal"');

  // Click cancel and verify promise resolves to false
  await cancelBtn.click();
  const confirmedResult = await confirmPromise;
  assert.strictEqual(confirmedResult, false, 'Mengklik batal harus mengembalikan nilai false');
  assert.strictEqual(await swalPopup.isVisible(), false, 'Popup harus tertutup setelah batal diklik');
  console.log('  ✓ Dialog konfirmasi SweetAlert2 varian danger dan tombol netral terverifikasi sempurna.');

  // [5] Test window.showAdminAlert with primary button
  console.log('\n[5] Menguji window.showAdminAlert dengan tombol .adm-btn-primary...');
  const alertPromise = page.evaluate(() => {
    return window.showAdminAlert({
      title: 'Pemberitahuan Sistem',
      text: 'Operasi berhasil disimpan ke database.',
      icon: 'success'
    });
  });

  await swalPopup.waitFor({ state: 'visible', timeout: 3000 });
  const alertConfirmBtn = page.locator('.swal2-actions .adm-btn.adm-btn-primary');
  assert.ok(await alertConfirmBtn.isVisible(), 'Tombol alert HARUS memiliki class .adm-btn .adm-btn-primary');
  await alertConfirmBtn.click();
  await alertPromise;
  assert.strictEqual(await swalPopup.isVisible(), false, 'Popup alert harus tertutup setelah Tutup diklik');
  console.log('  ✓ Dialog alert SweetAlert2 varian primary terverifikasi.');

  // [6] Test data-confirm-delete form interception
  console.log('\n[6] Menguji interceptor form [data-confirm-delete]...');
  let formSubmitted = false;
  await page.exposeFunction('onFormSubmitIntercepted', () => {
    formSubmitted = true;
  });
  await page.evaluate(() => {
    const form = document.getElementById('testDeleteForm');
    form.submit = function() {
      window.onFormSubmitIntercepted();
    };
  });

  await page.click('#btnDeleteSubmit');
  await swalPopup.waitFor({ state: 'visible', timeout: 3000 });
  assert.ok(await swalPopup.isVisible(), 'Form data-confirm-delete harus dicegat dan memunculkan SweetAlert2');

  // Cancel deletion
  const cancelDeleteBtn = page.locator('.swal2-actions .adm-btn.adm-btn-neutral');
  await cancelDeleteBtn.click();
  await page.waitForTimeout(100);
  assert.strictEqual(formSubmitted, false, 'Form tidak boleh disubmit jika konfirmasi dibatalkan');
  assert.strictEqual(await page.locator('#testDeleteForm').evaluate(el => el.dataset.confirmed), undefined, 'dataset.confirmed tidak boleh true saat dibatalkan');
  console.log('  ✓ Interceptor form data-confirm-delete sukses mencegah submit saat dibatalkan.');

  // Now test confirmed deletion
  console.log('  Menguji submit form saat konfirmasi disetujui...');
  await page.click('#btnDeleteSubmit');
  await swalPopup.waitFor({ state: 'visible', timeout: 3000 });
  const confirmDeleteBtn = page.locator('.swal2-actions .adm-btn.adm-btn-danger');
  await confirmDeleteBtn.click();
  await page.waitForTimeout(100);
  assert.strictEqual(formSubmitted, true, 'Form HARUS disubmit saat konfirmasi disetujui');
  assert.strictEqual(await page.locator('#testDeleteForm').evaluate(el => el.dataset.confirmed), 'true', 'dataset.confirmed harus bernilai "true"');
  console.log('  ✓ Form data-confirm-delete sukses disubmit setelah konfirmasi disetujui.');

  // [7] Test Central Event Delegation: Modal Open / Close
  console.log('\n[7] Menguji Event Delegation pembukaan dan penutupan modal...');
  const testModal = page.locator('#testModal');
  assert.strictEqual(await testModal.evaluate(el => el.classList.contains('open')), false, 'Modal awalnya harus tertutup');

  // Click [data-modal-open]
  await page.click('#btnOpenTestModal');
  assert.strictEqual(await testModal.evaluate(el => el.classList.contains('open')), true, 'Modal harus terbuka setelah data-modal-open diklik');

  // Click [data-modal-close]
  await page.click('#testModal .modal-close-btn');
  assert.strictEqual(await testModal.evaluate(el => el.classList.contains('open')), false, 'Modal harus tertutup setelah data-modal-close diklik');
  console.log('  ✓ Event delegation pembukaan dan penutupan modal berjalan lancar tanpa inline handler.');

  // [8] Test Central Event Delegation: Auto-Submit Select
  console.log('\n[8] Menguji Event Delegation dropdown data-auto-submit...');
  let autoSubmitFired = false;
  await page.exposeFunction('onAutoSubmitFired', () => {
    autoSubmitFired = true;
  });
  await page.evaluate(() => {
    const form = document.getElementById('autoSubmitForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.onAutoSubmitFired();
    });
    form.submit = function() {
      window.onAutoSubmitFired();
    };
  });

  await page.selectOption('#autoSubmitSelect', '2');
  await page.waitForTimeout(200);
  assert.strictEqual(autoSubmitFired, true, 'Mengubah nilai select data-auto-submit harus otomatis men-submit form');
  console.log('  ✓ Event delegation data-auto-submit berhasil men-submit form.');

  // [9] Verify zero console errors
  console.log('\n[9] Memeriksa browser console errors...');
  // Note: Ignore the simulated 404 from the broken test image
  const fatalErrors = consoleErrors.filter(err => !err.includes('Failed to load resource') && !err.includes('invalid-broken-image.jpg'));
  assert.strictEqual(fatalErrors.length, 0, `Nol console error fatal diharapkan! Ditemukan: ${fatalErrors.join(', ')}`);
  console.log('  ✓ Nol console error fatal tercatat.');

  await browser.close();
  console.log('\n=== SELURUH TEST SUITE T-260 BERHASIL DILALUI (PASSED)! ===');
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST GAGAL:', err);
  process.exit(1);
});
