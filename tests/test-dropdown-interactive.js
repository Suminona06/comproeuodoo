import fs from 'fs';
import assert from 'assert';
import { chromium } from 'playwright';

console.log('Testing T-263 via Playwright Headless Chromium: Interactivity, Keyboard, Auto-Search & Validation...');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Read CSS & JS assets directly
  const tokensCss = fs.readFileSync('public/css/tokens.css', 'utf8');
  const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');
  const dropdownJs = fs.readFileSync('public/js/admin-dropdown.js', 'utf8');
  const validationJs = fs.readFileSync('public/js/admin-form-validation.js', 'utf8');

  // Load test HTML page with embedded CSS & JS
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <style>${tokensCss}</style>
      <style>${adminCss}</style>
      <style>
        body { padding: 40px; font-family: sans-serif; }
        .form-group { margin-bottom: 280px; }
      </style>
    </head>
    <body class="admin-body">
      <form id="testForm" novalidate>
        <!-- Dropdown 1: 4 options, required, outlined -->
        <div class="form-group" id="groupStatus">
          <label for="status" class="form-label">Status</label>
          <select id="status" name="status" data-eu-dropdown="outlined" required>
            <option value="">Pilih Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <!-- Dropdown 2: 13 options, elevated with prefix -->
        <div class="form-group" id="groupCategory">
          <label for="category" class="form-label">Kategori</label>
          <select id="category" name="category" data-eu-dropdown="elevated" data-prefix="Kategori">
            <option value="">Semua Kategori</option>
            <option value="1">Rigid Packaging</option>
            <option value="2">Flexible Film</option>
            <option value="3">Agriculture Mulch</option>
            <option value="4">Shopping Bags</option>
            <option value="5">Garbage Bags</option>
            <option value="6">Industrial Liner</option>
            <option value="7">Shrink Film</option>
            <option value="8">Stretch Wrap</option>
            <option value="9">Barrier Film</option>
            <option value="10">Standup Pouch</option>
            <option value="11">Vacuum Bag</option>
            <option value="12">Zipper Packaging</option>
          </select>
        </div>

        <button type="submit" id="btnSubmit" class="adm-btn adm-btn-primary">Simpan</button>
      </form>

      <script>${dropdownJs}</script>
      <script>${validationJs}</script>
    </body>
    </html>
  `);

  // 1. Check Progressive Enhancement DOM
  const statusDd = page.locator('#groupStatus .eu-dd');
  await statusDd.waitFor({ state: 'visible' });
  const statusTrigger = statusDd.locator('.eu-dd-trigger');
  assert.strictEqual(await statusTrigger.getAttribute('role'), 'combobox', 'Trigger must have role="combobox"');
  assert.strictEqual(await statusTrigger.getAttribute('aria-expanded'), 'false', 'Trigger aria-expanded must be false');
  console.log('  1. Progressive enhancement & WAI-ARIA markup: PASSED');

  // 2. Check Auto-Search Threshold (> 10 options)
  const catDd = page.locator('#groupCategory .eu-dd');
  const catSearchInput = catDd.locator('.eu-dd-search-input');
  assert.strictEqual(await catSearchInput.count(), 1, 'Category with 13 options must have search input');

  const statusSearchInput = statusDd.locator('.eu-dd-search-input');
  assert.strictEqual(await statusSearchInput.count(), 0, 'Status with 4 options must NOT have search input');
  console.log('  2. Auto-search threshold (>10 options): PASSED');

  // 3. Open/Close Toggle and Single Active Dropdown Check
  await statusTrigger.click();
  assert.strictEqual(await statusTrigger.getAttribute('aria-expanded'), 'true', 'Status must be expanded on click');
  assert(await statusDd.evaluate(el => el.classList.contains('is-open')), 'Status must have .is-open class');

  const catTrigger = catDd.locator('.eu-dd-trigger');
  await catTrigger.click();
  assert.strictEqual(await catTrigger.getAttribute('aria-expanded'), 'true', 'Category must be expanded');
  assert.strictEqual(await statusTrigger.getAttribute('aria-expanded'), 'false', 'Status must close when Category opens');
  assert(!await statusDd.evaluate(el => el.classList.contains('is-open')), 'Status must lose .is-open class');
  console.log('  3. Open/close toggle & single active dropdown: PASSED');

  // 4. Two-Way Selection Synchronization & Change Event
  await statusTrigger.click();
  const publishedOption = statusDd.locator('.eu-dd-item[data-value="published"]');
  await publishedOption.click();

  const statusVal = await page.locator('#status').inputValue();
  assert.strictEqual(statusVal, 'published', 'Native select value must be updated to published');

  const statusDisplay = await statusTrigger.locator('.eu-dd-value').textContent();
  assert.strictEqual(statusDisplay.trim(), 'Published', 'Visual display must show Published');
  assert.strictEqual(await publishedOption.getAttribute('aria-selected'), 'true', 'Option must have aria-selected="true"');
  assert(!await statusDd.evaluate(el => el.classList.contains('is-open')), 'Dropdown must close on selection');
  console.log('  4. Two-way selection synchronization & change event: PASSED');

  // 5. Search Filtering in Long Dropdown
  await catTrigger.click();
  await catSearchInput.fill('barrier');
  const visibleItems = catDd.locator('.eu-dd-item:visible');
  assert.strictEqual(await visibleItems.count(), 1, 'Only Barrier Film should match search query "barrier"');
  assert.strictEqual((await visibleItems.textContent()).trim(), 'Barrier Film', 'Visible item must be Barrier Film');
  console.log('  5. Live search filtering: PASSED');

  // 6. Elevated "Prefix: Bold" Formatting
  await visibleItems.first().click();
  const catVal = await page.locator('#category').inputValue();
  assert.strictEqual(catVal, '9', 'Selected category value must be 9');
  const catValueHtml = await catTrigger.locator('.eu-dd-value').innerHTML();
  assert(catValueHtml.includes('eu-dd-prefix'), 'Elevated value must include prefix');
  assert(catValueHtml.includes('eu-dd-strong'), 'Elevated value must include strong bold text');
  console.log('  6. Elevated "Prefix: Bold" formatting: PASSED');

  // 7. Keyboard Navigation (ArrowDown, Escape)
  await statusTrigger.focus();
  await page.keyboard.press('ArrowDown');
  assert(await statusDd.evaluate(el => el.classList.contains('is-open')), 'ArrowDown must open closed dropdown');
  await page.keyboard.press('Escape');
  assert(!await statusDd.evaluate(el => el.classList.contains('is-open')), 'Escape must close open dropdown');
  console.log('  7. Keyboard navigation (ArrowDown, Escape): PASSED');

  // 8. Click Outside Closes Dropdown
  await statusTrigger.click();
  assert(await statusDd.evaluate(el => el.classList.contains('is-open')), 'Dropdown is open');
  await page.mouse.click(10, 10);
  assert(!await statusDd.evaluate(el => el.classList.contains('is-open')), 'Click outside must close dropdown');
  console.log('  8. Click outside closes dropdown: PASSED');

  // 9. Integration with admin-form-validation.js
  // Reset native select value to empty to trigger required error
  await page.evaluate(() => {
    const sel = document.getElementById('status');
    sel.value = '';
    const emptyItem = document.querySelector('#groupStatus .eu-dd-item[data-value=""]');
    if (emptyItem) emptyItem.click();
  });

  await page.locator('#btnSubmit').click();

  const isInvalid = await statusDd.evaluate(el => el.classList.contains('is-invalid'));
  assert(isInvalid, 'Failed validation must set .is-invalid on .eu-dd container');
  assert.strictEqual(await statusTrigger.getAttribute('aria-invalid'), 'true', 'Trigger must receive aria-invalid="true"');
  const errorMsgCount = await page.locator('#groupStatus .adm-field-error').count();
  assert.strictEqual(errorMsgCount, 1, 'Inline error message must be rendered');
  console.log('  9. Integration with admin-form-validation.js: PASSED');

  await browser.close();
  console.log('ALL T-263 PLAYWRIGHT TESTS PASSED SUCCESSFULLY!');
})();
