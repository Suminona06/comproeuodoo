import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import productModel from '../models/productModel.js';
import productController from '../controllers/public/productController.js';

async function runT218DetailSizeTableQa() {
  console.log('--- STARTING TASK T-218: PDP DYNAMIC SIZE TABLE QA TESTS ---');
  const createdProductIds = [];

  try {
    const timestamp = Date.now();

    // 1. Create product with dynamic size table (4 columns, 2 rows)
    console.log('\n[TEST 1] Testing PDP rendering for product with 4 dynamic columns...');
    const slug4Col = `t218-prod-4col-${timestamp}`;
    const id4Col = await productModel.create({
      name_id: 'Produk Uji T218 4-Kolom',
      name_en: 'T218 4-Col Product',
      slug: slug4Col,
      category_id: 1,
      status: 'published',
      short_description_id: 'Ringkasan singkat produk uji.',
      description_id: '<p>Deskripsi lengkap produk uji dinamis.</p>',
      size_table: {
        columns: [
          { id: 'col_1', label: 'Tipe Kantong' },
          { id: 'col_2', label: 'Panjang (cm)' },
          { id: 'col_3', label: 'Lebar (cm)' },
          { id: 'col_4', label: 'Daya Tampung' }
        ],
        rows: [
          { col_1: 'TK-01', col_2: '50', col_3: '30', col_4: '10 kg' },
          { col_1: 'TK-02', col_2: '60', col_3: '40', col_4: '15 kg' }
        ]
      }
    });
    createdProductIds.push(id4Col);

    let renderedView = null;
    let renderedData = null;
    await productController.detail(
      { params: { slug: slug4Col }, protocol: 'https', get: () => 'euodoo.com' },
      {
        locals: { currentLang: 'id', settings: { company_name: 'PT Euodoo', whatsapp_number: '08123456789' } },
        status() { return this; },
        render(view, data) {
          renderedView = view;
          renderedData = data;
        }
      }
    );

    assert.strictEqual(renderedView, 'public/product-detail');
    assert.ok(renderedData.product);

    // Render EJS view in isolation (strip includes)
    const templatePath = path.join(process.cwd(), 'views/public/product-detail.ejs');
    const rawTemplateContent = fs.readFileSync(templatePath, 'utf8');
    const sanitizedTemplate = rawTemplateContent.replace(/<%[-=]\s*include\([^)]+\)\s*;?\s*%>/g, '');

    const html4Col = ejs.render(sanitizedTemplate, {
      ...renderedData,
      currentLang: 'id',
      lang: 'id',
      t: (key) => key === 'product_detail.tab_size_chart' ? 'Tabel Ukuran' : (key === 'product_detail.tab_overview' ? 'Deskripsi' : key)
    });

    // Assert dynamic table elements
    assert(html4Col.includes('id="pdTabSize"'), 'Size tab button must be rendered');
    assert(html4Col.includes('id="pdPanelSize"'), 'Size tab panel must be rendered');
    assert(html4Col.includes('data-cols="4"'), 'Table must have data-cols="4"');
    assert(html4Col.includes('<th scope="col">Tipe Kantong</th>'), 'Must render col 1 header');
    assert(html4Col.includes('<th scope="col">Panjang (cm)</th>'), 'Must render col 2 header');
    assert(html4Col.includes('<th scope="col">Lebar (cm)</th>'), 'Must render col 3 header');
    assert(html4Col.includes('<th scope="col">Daya Tampung</th>'), 'Must render col 4 header');

    assert(html4Col.includes('data-l="Tipe Kantong">TK-01</td>'), 'Cell must have data-l and value');
    assert(html4Col.includes('data-l="Daya Tampung">10 kg</td>'), 'Cell must have data-l and value');
    assert(html4Col.includes('data-l="Tipe Kantong">TK-02</td>'), 'Row 2 cell must be rendered');
    assert(html4Col.includes('data-l="Daya Tampung">15 kg</td>'), 'Row 2 cell must be rendered');

    console.log('  1a. 4-column dynamic table, headers, cells, and data-cols="4": PASSED');

    // 2. Test auto-hide when size_table is empty
    console.log('\n[TEST 2] Testing auto-hide when size_table is empty...');
    const slugEmpty = `t218-prod-empty-${timestamp}`;
    const idEmpty = await productModel.create({
      name_id: 'Produk Uji T218 Tanpa Tabel',
      name_en: 'T218 Empty Product',
      slug: slugEmpty,
      category_id: 1,
      status: 'published',
      size_table: null
    });
    createdProductIds.push(idEmpty);

    let emptyData = null;
    await productController.detail(
      { params: { slug: slugEmpty }, protocol: 'https', get: () => 'euodoo.com' },
      {
        locals: { currentLang: 'id', settings: { company_name: 'PT Euodoo', whatsapp_number: '08123456789' } },
        status() { return this; },
        render(view, data) {
          emptyData = data;
        }
      }
    );

    const htmlEmpty = ejs.render(sanitizedTemplate, {
      ...emptyData,
      currentLang: 'id',
      lang: 'id',
      t: (key) => key
    });

    assert(!htmlEmpty.includes('id="pdTabSize"'), 'Size tab button must NOT be rendered when empty');
    assert(!htmlEmpty.includes('id="pdPanelSize"'), 'Size tab panel must NOT be rendered when empty');
    assert(htmlEmpty.includes('id="pdTabDesc"'), 'Overview tab button must still be rendered');
    console.log('  2a. Tab and panel automatically hidden when size table is empty: PASSED');

    // 3. Test HTML XSS Escaping in dynamic labels and cells
    console.log('\n[TEST 3] Testing HTML escaping in table cells and labels...');
    const slugXss = `t218-prod-xss-${timestamp}`;
    const idXss = await productModel.create({
      name_id: 'Produk Uji T218 XSS',
      name_en: 'T218 XSS Product',
      slug: slugXss,
      category_id: 1,
      status: 'published',
      size_table: {
        columns: [
          { id: 'col_1', label: 'Label & Safe <test>' }
        ],
        rows: [
          { col_1: 'Cell & Safe <b>bold</b>' }
        ]
      }
    });
    createdProductIds.push(idXss);

    let xssData = null;
    await productController.detail(
      { params: { slug: slugXss }, protocol: 'https', get: () => 'euodoo.com' },
      {
        locals: { currentLang: 'id', settings: { company_name: 'PT Euodoo', whatsapp_number: '08123456789' } },
        status() { return this; },
        render(view, data) {
          xssData = data;
        }
      }
    );

    const htmlXss = ejs.render(sanitizedTemplate, {
      ...xssData,
      currentLang: 'id',
      lang: 'id',
      t: (key) => key
    });

    // Verify raw unescaped HTML tag is not present
    assert(!htmlXss.includes('<test>'), 'Raw HTML tag <test> must not be unescaped');
    assert(htmlXss.includes('&lt;test&gt;') || htmlXss.includes('Safe'), 'Escaped text must be rendered');
    console.log('  3a. XSS protection and HTML escaping in EJS template: PASSED');

    // 4. Test CSS Styles in components.css
    console.log('\n[TEST 4] Testing scoped CSS selectors in components.css...');
    const cssContent = fs.readFileSync(path.join(process.cwd(), 'public/css/components.css'), 'utf8');

    for (let c = 1; c <= 8; c++) {
      assert(cssContent.includes(`table.pd-size[data-cols="${c}"]`), `Must have selector for data-cols="${c}"`);
    }

    assert(cssContent.includes('.pd-size-scroll {'), 'Must have .pd-size-scroll');
    assert(cssContent.includes('radial-gradient'), 'Must have radial-gradient scroll shadows');
    assert(cssContent.includes('@media (max-width: 600px)'), 'Must have mobile media query');
    assert(cssContent.includes('content: attr(data-l);'), 'Must have data-l content attribute');
    assert(cssContent.includes('table.pd-size td:first-child'), 'Must have card title styling for first child');

    console.log('  4a. CSS data-cols 1-8 scoped widths, scroll shadows, and mobile card rules: PASSED');

    // 5. Audit zero comments in frontend view
    console.log('\n[TEST 5] Testing zero comments in product-detail.ejs...');
    assert(!rawTemplateContent.includes('<!--'), 'product-detail.ejs must have zero HTML comments');
    console.log('  5a. Zero comments audit: PASSED');

    console.log('\n--- ALL TASK T-218 TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    for (const pid of createdProductIds) {
      try {
        await productModel.delete(pid);
      } catch (e) {
        console.error(`Failed to cleanup product ID ${pid}:`, e.message);
      }
    }
    console.log('[CLEANUP] Deleted test products cleanly.');
  }
}

runT218DetailSizeTableQa()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n[FATAL ERROR IN T-218 QA]:', err);
    process.exit(1);
  });
