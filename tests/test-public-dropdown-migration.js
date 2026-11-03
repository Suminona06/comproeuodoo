import fs from 'fs';
import assert from 'assert';
import { chromium } from 'playwright';

console.log('Testing T-266: Public Pages Dropdown Migration (PLP Sort & Contact RFQ Form)...');

// 1. Static Audit of Public Views
const prodView = fs.readFileSync('views/public/products.ejs', 'utf8');
const contactView = fs.readFileSync('views/public/contact.ejs', 'utf8');
const footerView = fs.readFileSync('views/partials/footer.ejs', 'utf8');

assert(prodView.includes('data-eu-dropdown="elevated"'), 'products.ejs must declare data-eu-dropdown="elevated"');
assert(prodView.includes('data-prefix="'), 'products.ejs must declare data-prefix for sort select');
assert(contactView.includes('id="product_id" name="product_id" class="cf-select" data-eu-dropdown="outlined"'), 'contact.ejs #product_id must declare data-eu-dropdown="outlined"');
assert(contactView.includes('id="inquiry_type" name="type" class="cf-select" data-eu-dropdown="outlined"'), 'contact.ejs #inquiry_type must declare data-eu-dropdown="outlined"');
assert(footerView.includes('admin-dropdown.js'), 'footer.ejs must include admin-dropdown.js');
console.log('  1. Static audit of public templates & scripts: PASSED');

// 2. Playwright Headless Runtime Tests
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const tokensCss = fs.readFileSync('public/css/tokens.css', 'utf8');
  const componentsCss = fs.readFileSync('public/css/components.css', 'utf8');
  const dropdownJs = fs.readFileSync('public/js/admin-dropdown.js', 'utf8');

  // Load public products page mockup
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <style>${tokensCss}</style>
      <style>${componentsCss}</style>
      <style>
        body { padding: 40px; font-family: sans-serif; }
        .plp-toolbar { display: flex; justify-content: flex-end; margin-bottom: 240px; }
        .cf-container { max-width: 600px; margin-top: 40px; }
      </style>
    </head>
    <body>
      <!-- 1. PLP Sort Bar (Elevated) -->
      <div class="plp-toolbar">
        <div class="plp-sort-wrap">
          <label for="plp-sort-select" class="sr-only">Urutkan</label>
          <select name="sort" id="plp-sort-select" class="plp-sort-select"
                  data-eu-dropdown="elevated"
                  data-prefix="Urutkan"
                  data-eu-size="sm"
                  aria-label="Urutkan berdasarkan">
            <option value="newest" selected>Terbaru</option>
            <option value="catalog">Terpopuler</option>
            <option value="alpha-asc">Nama A-Z</option>
            <option value="alpha-desc">Nama Z-A</option>
          </select>
        </div>
      </div>

      <!-- 2. Contact RFQ Form (Outlined) -->
      <div class="cf-container">
        <form id="testRfqForm">
          <input type="hidden" name="_csrf" value="mock-csrf-token">
          <div class="cf-form-group">
            <label for="product_id" class="cf-label">Produk Terkait</label>
            <select id="product_id" name="product_id" class="cf-select" data-eu-dropdown="outlined">
              <option value="">Pilih Produk (Katalog Lengkap)</option>
              <option value="1">Standing Pouch Eco</option>
              <option value="2">Shopping Bag HD Plong</option>
            </select>
          </div>
          <div class="cf-form-group">
            <label for="inquiry_type" class="cf-label">Tipe Inquiry</label>
            <select id="inquiry_type" name="type" class="cf-select" data-eu-dropdown="outlined">
              <option value="inquiry" selected>Permintaan Penawaran (RFQ B2B)</option>
              <option value="partnership">Kemitraan Distribusi</option>
              <option value="general">Informasi Umum</option>
            </select>
          </div>
        </form>
      </div>

      <script>${dropdownJs}</script>
    </body>
    </html>
  `);

  // Test 1: PLP Sort Dropdown Formatting ("Prefix: **Bold**")
  const sortDd = page.locator('.plp-sort-wrap .eu-dd');
  assert(await sortDd.evaluate(el => el.classList.contains('eu-dd--elevated')), 'PLP Sort must have .eu-dd--elevated class');

  const sortTrigger = sortDd.locator('.eu-dd-trigger');
  const initialSortHtml = await sortTrigger.locator('.eu-dd-value').innerHTML();
  assert(initialSortHtml.includes('Urutkan:') && initialSortHtml.includes('Terbaru'), 'Initial sort must display "Urutkan: **Terbaru**"');

  // Simulate selecting "Terpopuler"
  let sortChangeTriggered = false;
  await page.exposeFunction('onSortChange', () => { sortChangeTriggered = true; });
  await page.evaluate(() => {
    document.getElementById('plp-sort-select').addEventListener('change', () => window.onSortChange());
  });

  await sortTrigger.click();
  await page.waitForTimeout(200);

  const popOpt = sortDd.locator('.eu-dd-item[data-value="catalog"]');
  await popOpt.click();
  await page.waitForTimeout(200);

  assert.strictEqual(sortChangeTriggered, true, 'Selecting sort option must trigger native change event for AJAX catalog load');
  const updatedSortHtml = await sortTrigger.locator('.eu-dd-value').innerHTML();
  assert(updatedSortHtml.includes('Urutkan:') && updatedSortHtml.includes('Terpopuler'), 'Updated sort must display "Urutkan: **Terpopuler**"');
  console.log('  2. PLP elevated sort dropdown with "Urutkan: **Terpopuler**" & AJAX change trigger: PASSED');

  // Test 2: Contact Form Outlined Dropdowns
  const prodDd = page.locator('.cf-form-group .eu-dd').first();
  assert(await prodDd.evaluate(el => el.classList.contains('eu-dd--outlined')), 'Contact product select must have .eu-dd--outlined class');

  const inqDd = page.locator('.cf-form-group .eu-dd').nth(1);
  assert(await inqDd.evaluate(el => el.classList.contains('eu-dd--outlined')), 'Contact inquiry select must have .eu-dd--outlined class');

  // Select product in contact form
  const prodTrigger = prodDd.locator('.eu-dd-trigger');
  await prodTrigger.click();
  await page.waitForTimeout(200);
  const pouchOpt = prodDd.locator('.eu-dd-item[data-value="1"]');
  await pouchOpt.click();
  await page.waitForTimeout(200);

  const selectedProdVal = await page.locator('#product_id').inputValue();
  assert.strictEqual(selectedProdVal, '1', 'Native product_id input must receive selected value "1"');
  console.log('  3. Contact RFQ outlined dropdowns & form state synchronization: PASSED');

  // Test 3: Keyboard Navigation on Public PLP Sort
  await sortTrigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  assert(await sortDd.evaluate(el => el.classList.contains('is-open')), 'ArrowDown must open PLP sort dropdown');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  assert(!await sortDd.evaluate(el => el.classList.contains('is-open')), 'Escape must close PLP sort dropdown');
  console.log('  4. Keyboard accessibility on public sort: PASSED');

  await browser.close();
  console.log('ALL T-266 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
})();

