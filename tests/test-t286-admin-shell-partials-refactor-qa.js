import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';
const BRAIN_DIR = process.env.ANTIGRAVITY_BRAIN_DIR || '/home/itpc/.gemini/antigravity/brain/9f11355d-9552-45f1-9bf5-7218dad8c8aa';
const SCREENSHOT_DIR = path.join(BRAIN_DIR, 'screenshots/t286');

console.log('=== TEST SUITE T-286: QA Verifikasi Visual, Fungsional & Regresi (Admin Shell & Universal Partials) ===\n');

async function runQAVerification() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // [1] TEST 1: Strict Lint Views Verification on Batch 10
  console.log('[1] Memverifikasi kepatuhan Lint Views pada berkas Batch 10 (admin-header, admin-footer, media-picker-modal)...');
  const targetFiles = [
    'views/partials/admin-header.ejs',
    'views/partials/admin-footer.ejs',
    'views/partials/media-picker-modal.ejs'
  ];

  for (const file of targetFiles) {
    const lintOutput = execSync(`node scripts/lint-views.js ${file}`, { encoding: 'utf-8' });
    assert.ok(lintOutput.includes('0 error, 0 warning'), `${file} harus 0 error & 0 warning`);
  }

  const globalLintViews = execSync('node scripts/lint-views.js', { encoding: 'utf-8' });
  assert.ok(globalLintViews.includes('0 error'), 'Lint views global harus 0 error pada berkas terverifikasi');
  console.log('  ✓ Seluruh 3 berkas Batch 10 lulus Lint Views murni (0 error, 0 warning).\n');

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

  try {
    // [3] TEST 3: Menguji Halaman Admin Shell di 4 Viewport
    console.log('\n[3] Menguji Render Admin Shell di 4 Viewport...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' });
      assert.strictEqual(resp.status(), 200, `Halaman dashboard harus status 200 pada ${vp.name}`);

      // Verifikasi struktur shell: meta theme-color, script init anti-FOUC, role badge
      const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
      assert.strictEqual(themeColor, 'rgb(0, 117, 90)', 'Meta theme-color harus menggunakan rgb standard tanpa raw hex');

      const hasInitScript = await page.evaluate(() => {
        return !!document.querySelector('script[src*="admin-header-init.js"]');
      });
      assert.strictEqual(hasInitScript, true, 'Head harus menyertakan script admin-header-init.js');

      const roleBadgeClass = await page.evaluate(() => {
        const badge = document.querySelector('.sidebar-user-footer .adm-shell-user-role');
        return badge ? badge.className : null;
      });
      assert.ok(roleBadgeClass && roleBadgeClass.includes('adm-shell-user-role'), 'Badge role user harus menggunakan class adm-shell-user-role');

      // Verifikasi zero inline style pada elemen header dan modal picker
      const headerInlineStyles = await page.evaluate(() => {
        return document.querySelectorAll('.app-topbar [style], .sidebar-toggle-btn [style], #universalMediaPickerModal [style]').length;
      });
      assert.strictEqual(headerInlineStyles, 0, `Tidak boleh ada inline style pada shell/topbar/picker di ${vp.name}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `admin-shell-${vp.width}.png`) });

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert.strictEqual(overflow, false, `Admin shell tidak boleh overflow horizontal pada ${vp.name}`);
    }
    console.log('  ✓ Admin shell responsif tanpa overflow & bebas inline style di 4 viewport.');

    // [4] TEST 4: Sidebar Collapse/Expand & LocalStorage Anti-FOUC Persistence
    console.log('\n[4] Menguji Interaktivitas Collapse/Expand Sidebar & Anti-FOUC Persistence (Desktop 1280px)...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' });

    // Pastikan localStorage dibersihkan dulu untuk uji clean state
    await page.evaluate(() => localStorage.removeItem('admin_sidebar_collapsed'));
    await page.reload({ waitUntil: 'networkidle' });

    let isCollapsed = await page.evaluate(() => document.body.classList.contains('sidebar-collapsed'));
    assert.strictEqual(isCollapsed, false, 'Sidebar default harus dalam posisi expanded');

    // Klik tombol collapse sidebar
    await page.click('#sidebarToggleBtn');
    await page.waitForTimeout(250);

    isCollapsed = await page.evaluate(() => document.body.classList.contains('sidebar-collapsed'));
    assert.strictEqual(isCollapsed, true, 'Body harus memiliki class sidebar-collapsed setelah tombol diklik');

    const storageVal = await page.evaluate(() => localStorage.getItem('admin_sidebar_collapsed'));
    assert.strictEqual(storageVal, 'true', 'localStorage admin_sidebar_collapsed harus tersimpan "true"');

    // Simpan screenshot saat sidebar collapsed
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-shell-collapsed-1280.png') });

    // Reload halaman untuk memastikan script admin-header-init.js me-restore sidebar secara anti-FOUC
    await page.reload({ waitUntil: 'networkidle' });
    const isRestored = await page.evaluate(() => document.body.classList.contains('sidebar-collapsed'));
    assert.strictEqual(isRestored, true, 'Status sidebar-collapsed harus dipulihkan secara otomatis oleh script init saat reload');

    // Kembalikan ke posisi expanded
    await page.click('#sidebarToggleBtn');
    await page.waitForTimeout(250);
    const isExpandedAgain = await page.evaluate(() => !document.body.classList.contains('sidebar-collapsed'));
    assert.strictEqual(isExpandedAgain, true, 'Sidebar harus kembali expanded setelah tombol diklik ulang');
    const storageValAfter = await page.evaluate(() => localStorage.getItem('admin_sidebar_collapsed'));
    assert.strictEqual(storageValAfter, 'false', 'localStorage harus tersimpan "false" saat expanded');
    console.log('  ✓ Fitur collapse/expand sidebar dan anti-FOUC persistence bekerja sempurna.');

    // [5] TEST 5: Mobile Drawer & Backdrop Navigation (Mobile 375px)
    console.log('\n[5] Menguji Navigasi Drawer & Backdrop pada Tampilan Mobile (375px)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' });

    // Buka drawer mobile via tombol toggle
    await page.click('.mobile-menu-toggle');
    await page.waitForTimeout(250);

    const isDrawerOpen = await page.evaluate(() => document.body.classList.contains('sidebar-open'));
    assert.strictEqual(isDrawerOpen, true, 'Body harus memiliki class sidebar-open saat menu drawer mobile dibuka');

    // Tutup drawer via klik area backdrop di luar sidebar (posisi x: 330px pada viewport 375px)
    await page.click('.admin-backdrop', { position: { x: 330, y: 100 } });
    await page.waitForTimeout(250);

    const isDrawerClosed = await page.evaluate(() => !document.body.classList.contains('sidebar-open'));
    assert.strictEqual(isDrawerClosed, true, 'Body harus kehilangan class sidebar-open setelah backdrop diklik');
    console.log('  ✓ Drawer mobile navigation dan backdrop interaktif berfungsi.');

    // [6] TEST 6: Universal Media Picker Modal Functionality
    console.log('\n[6] Menguji Universal Media Picker Modal & Tab Switching...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' });

    // Buka media picker modal via API global
    await page.evaluate(() => {
      window.openMediaPicker({
        type: 'image',
        onSelect: () => {}
      });
    });

    await page.waitForSelector('#universalMediaPickerModal.open', { state: 'visible' });

    const modalTitleClass = await page.getAttribute('#mediaPickerTitle', 'class');
    assert.ok(modalTitleClass && modalTitleClass.includes('adm-picker-title'), 'Judul modal harus memiliki class adm-picker-title');

    const searchInputClass = await page.getAttribute('#mediaPickerSearch', 'class');
    assert.ok(searchInputClass && searchInputClass.includes('adm-picker-search-input'), 'Input pencarian harus memiliki class adm-picker-search-input');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'media-picker-modal-1280.png') });

    // Pindah ke tab Upload
    await page.click('.media-picker-tab-btn[data-tab="upload"]');
    await page.waitForTimeout(200);

    const uploadTabVisible = await page.evaluate(() => {
      const tabUpload = document.getElementById('mediaPickerTabUpload');
      const tabLib = document.getElementById('mediaPickerTabLibrary');
      return tabUpload.style.display === 'block' && tabLib.style.display === 'none';
    });
    assert.strictEqual(uploadTabVisible, true, 'Tab upload harus tampil dan tab library harus sembunyi');

    const dropzoneClass = await page.getAttribute('#pickerUploadDropzone', 'class');
    assert.ok(dropzoneClass && dropzoneClass.includes('adm-picker-dropzone'), 'Dropzone harus memiliki class adm-picker-dropzone');

    // Pindah kembali ke tab Library
    await page.click('.media-picker-tab-btn[data-tab="library"][data-type="image"]');
    await page.waitForTimeout(200);

    const libraryTabVisible = await page.evaluate(() => {
      const tabUpload = document.getElementById('mediaPickerTabUpload');
      const tabLib = document.getElementById('mediaPickerTabLibrary');
      return tabLib.style.display === 'block' && tabUpload.style.display === 'none';
    });
    assert.strictEqual(libraryTabVisible, true, 'Tab library harus kembali tampil dan tab upload sembunyi');

    // Tutup modal via tombol silang
    await page.click('#btnCloseMediaPicker');
    await page.waitForTimeout(250);

    const isModalClosed = await page.evaluate(() => {
      const modalEl = document.getElementById('universalMediaPickerModal');
      return !modalEl.classList.contains('open') && modalEl.getAttribute('aria-hidden') === 'true';
    });
    assert.strictEqual(isModalClosed, true, 'Modal harus tertutup dan aria-hidden bernilai true');
    console.log('  ✓ Universal Media Picker modal (buka, tab switch, tutup) bekerja 100% tanpa error.');

    // [7] TEST 7: Konsol Browser & Page Errors Check
    console.log('\n[7] Memeriksa integritas konsol JavaScript browser...');
    if (consoleErrors.length > 0) {
      console.error('  Ditemukan console error:', consoleErrors);
    }
    assert.strictEqual(consoleErrors.length, 0, `Harus 0 error konsol browser! Ditemukan: ${consoleErrors.length}`);
    assert.strictEqual(pageErrors.length, 0, `Harus 0 page errors! Ditemukan: ${pageErrors.length}`);
    console.log('  ✓ Nol error konsol browser pada seluruh pengujian.');

    console.log('\n🎉 SELURUH GERBANG KUALITAS BATCH 10 (T-286) LULUS 100%!');
    process.exit(0);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runQAVerification().catch((err) => {
  console.error('\n❌ QA Verifikasi GAGAL:', err);
  process.exit(1);
});
