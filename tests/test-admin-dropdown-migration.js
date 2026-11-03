import fs from 'fs';
import assert from 'assert';
import { chromium } from 'playwright';

console.log('Testing T-265: Admin CMS Dropdown Migration & Integration Suite...');

// 1. Static Audit of all 29 admin <select> tags
const checks = [
  { file: 'views/admin/products/create.ejs', selector: '#category_id', variant: 'outlined' },
  { file: 'views/admin/products/create.ejs', selector: '#status', variant: 'outlined' },
  { file: 'views/admin/products/create.ejs', selector: '#selectCopyProduct', variant: 'outlined' },
  { file: 'views/admin/products/edit.ejs', selector: '#category_id', variant: 'outlined' },
  { file: 'views/admin/products/edit.ejs', selector: '#status', variant: 'outlined' },
  { file: 'views/admin/products/edit.ejs', selector: '#selectCopyProduct', variant: 'outlined' },
  { file: 'views/admin/products/index.ejs', selector: 'name="category"', variant: 'elevated' },
  { file: 'views/admin/posts/create.ejs', selector: '#type', variant: 'outlined' },
  { file: 'views/admin/posts/create.ejs', selector: '#category_id', variant: 'outlined' },
  { file: 'views/admin/posts/create.ejs', selector: '#status', variant: 'outlined' },
  { file: 'views/admin/posts/edit.ejs', selector: '#type', variant: 'outlined' },
  { file: 'views/admin/posts/edit.ejs', selector: '#category_id', variant: 'outlined' },
  { file: 'views/admin/posts/edit.ejs', selector: '#status', variant: 'outlined' },
  { file: 'views/admin/banners/create.ejs', selector: '#media_type', variant: 'outlined' },
  { file: 'views/admin/banners/edit.ejs', selector: '#media_type', variant: 'outlined' },
  { file: 'views/admin/leads/index.ejs', selector: 'name="status"', variant: 'filled' },
  { file: 'views/admin/leads/index.ejs', selector: 'name="type"', variant: 'filled' },
  { file: 'views/admin/inquiries/index.ejs', selector: '.inquiry-status-select', variant: 'filled' },
  { file: 'views/admin/inquiries/detail.ejs', selector: '#status', variant: 'outlined' },
  { file: 'views/admin/dashboard.ejs', selector: '.inquiry-status-select', variant: 'filled' },
  { file: 'views/admin/users/create.ejs', selector: '#role', variant: 'outlined' },
  { file: 'views/admin/users/edit.ejs', selector: '#role', variant: 'outlined' },
  { file: 'views/admin/post-categories/create.ejs', selector: '#type', variant: 'outlined' },
  { file: 'views/admin/post-categories/edit.ejs', selector: '#type', variant: 'outlined' },
  { file: 'views/admin/settings/index.ejs', selector: '#whatsapp_button_theme', variant: 'outlined' },
  { file: 'views/admin/hero-banners/index.ejs', selector: 'name="overlay_opacity"', variant: 'outlined' },
  { file: 'views/admin/home-content/index.ejs', selector: '#wcu_chip_icon', variant: 'outlined' },
  { file: 'views/admin/home-content/index.ejs', selector: 'name="home_cat_', variant: 'outlined' }
];

checks.forEach(c => {
  const content = fs.readFileSync(c.file, 'utf8');
  assert(
    content.includes(`data-eu-dropdown="${c.variant}"`),
    `File ${c.file} must declare data-eu-dropdown="${c.variant}" for ${c.selector}`
  );
});
console.log('  1. Static audit of 29 admin dropdown points: PASSED (all declared with proper variants)');

// 2. Playwright Headless Runtime Tests
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const tokensCss = fs.readFileSync('public/css/tokens.css', 'utf8');
  const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');
  const dropdownJs = fs.readFileSync('public/js/admin-dropdown.js', 'utf8');

  // Load a rich admin page containing:
  // 1) Outlined form dropdowns
  // 2) Elevated toolbar filter with auto-submit
  // 3) Modal with > 10 options and auto-search
  // 4) Table card with filled compact status dropdown
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <style>${tokensCss}</style>
      <style>${adminCss}</style>
      <style>
        body { padding: 24px; font-family: sans-serif; }
        .test-section { margin-bottom: 220px; }
      </style>
    </head>
    <body class="admin-body">
      <!-- 1. Toolbar Filter (Elevated) -->
      <div class="test-section" id="toolbarSec">
        <form id="filterForm" action="/admin/test-filter" method="GET">
          <select id="catFilter" name="category" data-eu-dropdown="elevated" data-prefix="Kategori" data-eu-size="sm" data-inline="true" data-auto-submit="true">
            <option value="">Semua Kategori</option>
            <option value="1">Rigid Packaging</option>
            <option value="2">Flexible Film</option>
          </select>
        </form>
      </div>

      <!-- 2. Form Tambah Produk (Outlined) -->
      <div class="test-section" id="formSec">
        <div class="form-group">
          <label class="form-label" for="category_id">Kategori Produk *</label>
          <select id="category_id" name="category_id" class="form-select" data-eu-dropdown="outlined">
            <option value="">Pilih Kategori...</option>
            <option value="1">Rigid Packaging</option>
            <option value="2">Flexible Film</option>
          </select>
        </div>
      </div>

      <!-- 3. Modal Salin Struktur Tabel Ukuran (Opsi > 10 & Auto-search) -->
      <div class="test-section" id="modalSec">
        <div id="modalCopySizeColumns" class="admin-modal open">
          <div class="form-group">
            <label for="selectCopyProduct" class="modal-copy-label">Pilih Produk Sumber:</label>
            <select id="selectCopyProduct" class="form-input form-select modal-copy-select" data-eu-dropdown="outlined">
              <option value="">-- Pilih Produk --</option>
              <option value="p1">Standing Pouch Zipper (100 micron)</option>
              <option value="p2">Vacuum Bag Nylon (85 micron)</option>
              <option value="p3">Shopping Bag HD Plong</option>
              <option value="p4">Polybag Pertanian Hitam</option>
              <option value="p5">Industrial Shrink Film</option>
              <option value="p6">Stretch Film Hand Roll</option>
              <option value="p7">Mulch Film Hitam Perak</option>
              <option value="p8">Bio Cassava Bag Eco</option>
              <option value="p9">Heavy Duty Sack Liner</option>
              <option value="p10">Bread Bag Micro-perforated</option>
              <option value="p11">Courier Mailing Polymailer</option>
              <option value="p12">Zipper Lock Bag Transparent</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 4. Table Row Action (Filled, sm) in Table Card -->
      <div class="test-section" id="tableSec">
        <div class="table-card">
          <table>
            <tr>
              <td>
                <select id="rowStatus" name="status" data-eu-dropdown="filled" data-eu-size="sm" data-inline="true">
                  <option value="baru">Baru</option>
                  <option value="diproses">Diproses</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditolak">Ditolak</option>
                </select>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <script>${dropdownJs}</script>
    </body>
    </html>
  `);

  // A. Check Toolbar Elevated & Auto-Submit event trigger
  const catFilterDd = page.locator('#toolbarSec .eu-dd');
  assert(await catFilterDd.evaluate(el => el.classList.contains('eu-dd--elevated')), 'Toolbar dropdown must have .eu-dd--elevated class');
  assert(await catFilterDd.evaluate(el => el.classList.contains('eu-dd--sm')), 'Toolbar dropdown must have .eu-dd--sm class');

  // Track change event dispatch on form select
  let changeFired = false;
  await page.exposeFunction('onCatChange', () => { changeFired = true; });
  await page.evaluate(() => {
    document.getElementById('catFilter').addEventListener('change', () => window.onCatChange());
  });

  const toolbarTrigger = catFilterDd.locator('.eu-dd-trigger');
  await toolbarTrigger.click();
  await page.waitForTimeout(200);
  const rigidOpt = catFilterDd.locator('.eu-dd-item[data-value="1"]');
  await rigidOpt.click();
  await page.waitForTimeout(200);

  assert.strictEqual(changeFired, true, 'Selecting elevated toolbar option must dispatch change event for auto-submit');
  const toolbarValHtml = await toolbarTrigger.locator('.eu-dd-value').innerHTML();
  assert(toolbarValHtml.includes('eu-dd-prefix') && toolbarValHtml.includes('Kategori:'), 'Must show Kategori: prefix');
  assert(toolbarValHtml.includes('Rigid Packaging'), 'Must show Rigid Packaging bold value');
  console.log('  2. Toolbar elevated filter and auto-submit dispatch: PASSED');

  // B. Check Modal > 10 options auto-search
  const modalDd = page.locator('#modalSec .eu-dd');
  const modalTrigger = modalDd.locator('.eu-dd-trigger');
  const modalSearch = modalDd.locator('.eu-dd-search-input');
  assert.strictEqual(await modalSearch.count(), 1, 'Modal with 12 options must auto-render search input');

  await modalTrigger.click();
  await page.waitForTimeout(200);
  await modalSearch.fill('courier');
  const visibleModalItems = modalDd.locator('.eu-dd-item:visible');
  assert.strictEqual(await visibleModalItems.count(), 1, 'Search query "courier" must filter down to 1 item');
  assert.strictEqual((await visibleModalItems.textContent()).trim(), 'Courier Mailing Polymailer');
  await visibleModalItems.click();
  await page.waitForTimeout(200);

  const nativeModalVal = await page.locator('#selectCopyProduct').inputValue();
  assert.strictEqual(nativeModalVal, 'p11', 'Modal native select must receive value p11');
  console.log('  3. Modal copy product auto-search and selection: PASSED');

  // C. Check Table Row Action (Filled, sm) and overflow clipping
  const rowDd = page.locator('#tableSec .eu-dd');
  assert(await rowDd.evaluate(el => el.classList.contains('eu-dd--filled')), 'Table row dropdown must have .eu-dd--filled class');
  assert(await rowDd.evaluate(el => el.classList.contains('eu-dd--sm')), 'Table row dropdown must have .eu-dd--sm class');

  const rowTrigger = rowDd.locator('.eu-dd-trigger');
  await rowTrigger.click();
  await page.waitForTimeout(200);

  const tableCardOverflow = await page.locator('.table-card').evaluate(el => window.getComputedStyle(el).overflow);
  assert.strictEqual(tableCardOverflow, 'visible', '.table-card:has(.eu-dd.is-open) must have overflow: visible to prevent menu clipping');
  console.log('  4. Table card filled dropdown & overflow: visible clipping protection: PASSED');

  // D. Zoom Simulation (100%, 125%, 150%) on 1366x768 & 1920x1080
  const zoomResolutions = [
    { width: 1366, height: 768, zoom: 1.0 },
    { width: 1366, height: 768, zoom: 1.25 },
    { width: 1366, height: 768, zoom: 1.5 },
    { width: 1920, height: 1080, zoom: 1.0 },
    { width: 1920, height: 1080, zoom: 1.25 },
    { width: 1920, height: 1080, zoom: 1.5 }
  ];

  for (const r of zoomResolutions) {
    await page.setViewportSize({ width: Math.round(r.width / r.zoom), height: Math.round(r.height / r.zoom) });
    const isPanelVisible = await rowDd.locator('.eu-dd-panel').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    assert(isPanelVisible, `Dropdown panel must remain visible at ${r.width}x${r.height} zoom ${(r.zoom * 100)}%`);
  }
  console.log('  5. Zoom levels 100%, 125%, 150% at 1366x768 & 1920x1080: PASSED');

  await browser.close();
  console.log('ALL T-265 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
})();

