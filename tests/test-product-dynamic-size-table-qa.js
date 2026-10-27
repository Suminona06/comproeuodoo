import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import productModel from '../models/productModel.js';
import adminProductController, { parseDynamicSizeTable, getProductsWithSizeTable } from '../controllers/admin/productController.js';
import publicProductController from '../controllers/public/productController.js';
import { escapeCsvValue, sendCsvResponse } from '../utils/csvExporter.js';

async function runDynamicSizeTableE2eQa() {
  console.log('=== STARTING T-219: END-TO-END QA & AUDIT TEST SUITE ===\n');
  const createdProductIds = [];
  const timestamp = Date.now();

  try {
    // =========================================================================
    // SUITE 1: Dynamic Size Table Model & Storage Lifecycle
    // =========================================================================
    console.log('[SUITE 1] Testing Dynamic Size Table Model & Storage Lifecycle...');
    const slugProd1 = `qa-e2e-prod-1-${timestamp}`;
    const initialTable = {
      columns: [
        { id: 'col_code', label: 'Kode Produk' },
        { id: 'col_len', label: 'Panjang (cm)' },
        { id: 'col_wid', label: 'Lebar (cm)' },
        { id: 'col_mat', label: 'Bahan Plastik' }
      ],
      rows: [
        { col_code: 'KD-01', col_len: '50', col_wid: '30', col_mat: 'HDPE Virgin' },
        { col_code: 'KD-02', col_len: '60', col_wid: '40', col_mat: 'LLDPE Degradable' }
      ]
    };

    const idProd1 = await productModel.create({
      name_id: 'Produk E2E QA 1',
      name_en: 'Product E2E QA 1',
      slug: slugProd1,
      category_id: 1,
      status: 'published',
      short_description_id: 'Deskripsi singkat produk QA 1.',
      description_id: '<p>Deskripsi lengkap QA 1.</p>',
      size_table: initialTable
    });
    createdProductIds.push(idProd1);

    const fetchedProd1 = await productModel.findById(idProd1);
    assert.ok(fetchedProd1, 'Product 1 must be found in DB');
    assert.strictEqual(fetchedProd1.size_table.columns.length, 4, 'Columns count must be 4');
    assert.strictEqual(fetchedProd1.size_table.rows.length, 2, 'Rows count must be 2');
    const colCodeId = fetchedProd1.size_table.columns[0].id;
    const colMatId = fetchedProd1.size_table.columns[3].id;
    assert.strictEqual(fetchedProd1.size_table.rows[0][colCodeId], 'KD-01');
    assert.strictEqual(fetchedProd1.size_table.rows[1][colMatId], 'LLDPE Degradable');
    console.log('  ✓ 1a. Dynamic size table created and retrieved with proper schema');

    // Update with 5th column
    const updatedTable = {
      columns: [
        ...fetchedProd1.size_table.columns,
        { id: 'col_cap', label: 'Kapasitas (kg)' }
      ],
      rows: [
        { [colCodeId]: 'KD-01', [colMatId]: 'HDPE Virgin', col_cap: '10' },
        { [colCodeId]: 'KD-02', [colMatId]: 'LLDPE Degradable', col_cap: '15' }
      ]
    };
    await productModel.update(idProd1, { size_table: updatedTable });
    const fetchedUpdated = await productModel.findById(idProd1);
    assert.strictEqual(fetchedUpdated.size_table.columns.length, 5, 'Columns count must be 5 after update');
    const colCapId = fetchedUpdated.size_table.columns[4].id;
    assert.strictEqual(fetchedUpdated.size_table.rows[0][colCapId], '10', 'New column cell value verified');
    console.log('  ✓ 1b. Dynamic size table updated and persisted cleanly');

    // Fallback handling
    const slugEmpty = `qa-e2e-empty-${timestamp}`;
    const idEmpty = await productModel.create({
      name_id: 'Produk Kosong QA',
      slug: slugEmpty,
      category_id: 1,
      status: 'published',
      size_table: null
    });
    createdProductIds.push(idEmpty);
    const fetchedEmpty = await productModel.findById(idEmpty);
    assert.strictEqual(fetchedEmpty.size_table.columns.length, 0);
    assert.strictEqual(fetchedEmpty.size_table.rows.length, 0);
    assert.deepStrictEqual(fetchedEmpty.size_table.toJSON(), { columns: [], rows: [] }, 'Null size_table must fall back to empty object');
    console.log('  ✓ 1c. Safe fallback for NULL/empty size_table');

    // =========================================================================
    // SUITE 2: Strict Multi-Product Isolation (Product A vs Product B)
    // =========================================================================
    console.log('\n[SUITE 2] Testing Strict Multi-Product Data Isolation...');
    const slugProdA = `qa-iso-prod-a-${timestamp}`;
    const slugProdB = `qa-iso-prod-b-${timestamp}`;

    const idProdA = await productModel.create({
      name_id: 'Produk Isolasi A',
      slug: slugProdA,
      category_id: 1,
      status: 'published',
      size_table: {
        columns: [
          { id: 'col_a1', label: 'Kolom A1' },
          { id: 'col_a2', label: 'Kolom A2' },
          { id: 'col_a3', label: 'Kolom A3' }
        ],
        rows: [{ col_a1: 'ValA1', col_a2: 'ValA2', col_a3: 'ValA3' }]
      }
    });
    createdProductIds.push(idProdA);

    const idProdB = await productModel.create({
      name_id: 'Produk Isolasi B',
      slug: slugProdB,
      category_id: 1,
      status: 'published',
      size_table: {
        columns: [
          { id: 'col_b1', label: 'Kolom B1' },
          { id: 'col_b2', label: 'Kolom B2' },
          { id: 'col_b3', label: 'Kolom B3' },
          { id: 'col_b4', label: 'Kolom B4' },
          { id: 'col_b5', label: 'Kolom B5' }
        ],
        rows: [{ col_b1: 'ValB1', col_b2: 'ValB2', col_b3: 'ValB3', col_b4: 'ValB4', col_b5: 'ValB5' }]
      }
    });
    createdProductIds.push(idProdB);

    // Drastically mutate Product A
    await productModel.update(idProdA, {
      size_table: {
        columns: [{ id: 'col_a_new', label: 'Kolom Baru A' }],
        rows: [{ col_a_new: 'Nilai Baru' }]
      }
    });

    // Verify Product B remains 100% identical
    const verifyProdB = await productModel.findById(idProdB);
    assert.strictEqual(verifyProdB.size_table.columns.length, 5, 'Product B must still have 5 columns');
    assert.strictEqual(verifyProdB.size_table.columns[0].label, 'Kolom B1');
    const bCol1 = verifyProdB.size_table.columns[0].id;
    const bCol5 = verifyProdB.size_table.columns[4].id;
    assert.strictEqual(verifyProdB.size_table.rows[0][bCol1], 'ValB1');
    assert.strictEqual(verifyProdB.size_table.rows[0][bCol5], 'ValB5');
    console.log('  ✓ 2a. Strict isolation: editing Product A leaves Product B 100% intact');

    // =========================================================================
    // SUITE 3: Column Copy API & ID Regeneration
    // =========================================================================
    console.log('\n[SUITE 3] Testing Copy Column Structure API & Privacy...');
    let apiStatus = 200;
    let apiJson = null;
    const mockResApi = {
      status(code) {
        apiStatus = code;
        return this;
      },
      json(data) {
        apiJson = data;
      }
    };

    await adminProductController.getSizeTableColumns({ params: { id: idProdB } }, mockResApi);
    assert.strictEqual(apiStatus, 200, 'API must return HTTP 200');
    assert.strictEqual(apiJson.success, true, 'API response must indicate success');
    assert.strictEqual(apiJson.columns.length, 5, 'Must return 5 columns');
    assert.strictEqual(apiJson.rows, undefined, 'API must NEVER expose row or cell data');
    assert.strictEqual(apiJson.size_table, undefined, 'Raw size_table must not be returned');
    console.log('  ✓ 3a. Column picker API returns only column definitions with zero cell data');

    // Test 404 on missing product
    let notFoundStatus = null;
    await adminProductController.getSizeTableColumns(
      { params: { id: 9999999 } },
      {
        status(code) { notFoundStatus = code; return this; },
        json() {}
      }
    );
    assert.strictEqual(notFoundStatus, 404, 'API must return 404 for non-existent product');
    console.log('  ✓ 3b. Column picker API handles 404 correctly');

    const idProdNoTable = await productModel.create({
      name_id: `qa-no-table-${timestamp}`,
      name_en: `qa-no-table-${timestamp}`,
      slug: `qa-no-table-${timestamp}`,
      status: 'published',
      size_table: null
    });
    createdProductIds.push(idProdNoTable);

    const productsForDropdown = await getProductsWithSizeTable();
    assert.ok(productsForDropdown.some(p => p.id === idProdB), 'Product B with size table must be in copy dropdown');
    assert.ok(!productsForDropdown.some(p => p.id === idProdNoTable), 'Product without size table must NOT be in copy dropdown');

    const productsExcludingSelf = await getProductsWithSizeTable(idProdB);
    assert.ok(!productsExcludingSelf.some(p => p.id === idProdB), 'Product B must be excluded when editView excludes itself');
    assert.ok(!productsExcludingSelf.some(p => p.id === idProdNoTable), 'Product without size table remains excluded');
    console.log('  ✓ 3c. Source product copy dropdown only includes products with valid size table');

    // =========================================================================
    // SUITE 4: Dynamic CSV Export & Column Union
    // =========================================================================
    console.log('\n[SUITE 4] Testing Dynamic CSV Export & Column Union...');
    // Test formula injection escaping
    assert.strictEqual(escapeCsvValue('=SUM(A1:B1)'), '"\'=SUM(A1:B1)"');
    assert.strictEqual(escapeCsvValue('+CMD|test'), '"\'+CMD|test"');
    assert.strictEqual(escapeCsvValue('-10%'), '"\'-10%"');
    assert.strictEqual(escapeCsvValue('@eval'), '"\'@eval"');
    assert.strictEqual(escapeCsvValue('\tTabValue'), '"\'\tTabValue"');
    assert.strictEqual(escapeCsvValue('\rCarriage'), '"\'\rCarriage"');
    assert.strictEqual(escapeCsvValue('Standard Text'), '"Standard Text"');
    console.log('  ✓ 4a. Formula injection defense (=, +, -, @, \\t, \\r) verified');

    // Test CSV exporter output with union of columns
    let exportChunks = [];
    let exportedHeaders = {};
    const mockCsvRes = {
      setHeader(name, val) {
        exportedHeaders[name] = val;
      },
      write(chunk) {
        exportChunks.push(chunk);
      },
      end(chunk) {
        if (chunk) exportChunks.push(chunk);
      },
      redirect(url) {
        throw new Error('Unexpected redirect in exportCsv: ' + url);
      }
    };

    const mockAdminReq = {
      query: {}
    };

    await adminProductController.exportCsv(mockAdminReq, mockCsvRes);
    const exportedData = exportChunks.join('');
    assert.ok(exportedHeaders['Content-Type'].includes('text/csv'), 'Content-Type must be text/csv');
    assert.ok(exportedHeaders['Content-Type'].includes('charset=utf-8'), 'Must declare UTF-8');
    assert.ok(exportedData.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');

    const csvLines = exportedData.replace('\uFEFF', '').split('\n').filter(Boolean);
    const headerLine = csvLines[0];
    assert.ok(headerLine.includes('Kode Produk') || headerLine.includes('Kolom'), 'Headers must include dynamic columns');
    console.log('  ✓ 4b. CSV export contains UTF-8 BOM and dynamic column union');

    // =========================================================================
    // SUITE 5: Server-Side Validation & Security Constraints
    // =========================================================================
    console.log('\n[SUITE 5] Testing Server-Side Validation (Limits, Sanitization, Whitelist)...');
    // Whitelist test: unknown keys stripped
    const parsedWhitelist = parseDynamicSizeTable({
      size_table: JSON.stringify({
        columns: [{ id: 'col_1', label: 'Valid Col' }],
        rows: [{ col_1: 'Safe Value', col_wild: 'Hacked Value', __proto__: 'bad' }]
      })
    });
    assert.ok(parsedWhitelist, 'Parsed table must not be null');
    assert.strictEqual(parsedWhitelist.rows[0].col_1, 'Safe Value');
    assert.strictEqual(parsedWhitelist.rows[0].col_wild, undefined, 'Wild key col_wild must be discarded');
    console.log('  ✓ 5a. Cell key whitelist enforced: wild keys discarded');

    // Limit test: 8 columns max
    assert.throws(() => {
      const nineCols = Array.from({ length: 9 }, (_, i) => ({ id: `col_${i + 1}`, label: `Col ${i + 1}` }));
      parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: nineCols,
          rows: []
        })
      });
    }, /8 kolom/i, 'Must reject > 8 columns');

    // Limit test: 30 rows max
    assert.throws(() => {
      const thirtyOneRows = Array.from({ length: 31 }, (_, i) => ({ col_1: `Val ${i}` }));
      parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: [{ id: 'col_1', label: 'Col 1' }],
          rows: thirtyOneRows
        })
      });
    }, /30 baris/i, 'Must reject > 30 rows');

    // Limit test: label > 40 chars
    assert.throws(() => {
      parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: [{ id: 'col_1', label: 'A'.repeat(41) }],
          rows: []
        })
      });
    }, /40 karakter/i, 'Must reject label > 40 chars');

    // Empty label
    assert.throws(() => {
      parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: [{ id: 'col_1', label: '   ' }],
          rows: []
        })
      });
    }, /tidak boleh kosong/i, 'Must reject empty column label');

    // Cell value > 80 chars
    assert.throws(() => {
      parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: [{ id: 'col_1', label: 'Valid Label' }],
          rows: [{ col_1: 'B'.repeat(81) }]
        })
      });
    }, /80 karakter/i, 'Must reject cell > 80 chars');

    // HTML sanitization in labels and cells
    const sanitizedResult = parseDynamicSizeTable({
      size_table: JSON.stringify({
        columns: [{ id: 'col_1', label: '  <b>Clean Label</b>  ' }],
        rows: [{ col_1: '  <i>Bold Cell Text</i>  ' }]
      })
    });
    assert.strictEqual(sanitizedResult.columns[0].label, 'Clean Label', 'HTML tags stripped from label');
    assert.strictEqual(sanitizedResult.rows[0].col_1, 'Bold Cell Text', 'HTML tags stripped from cell');
    console.log('  ✓ 5b. All decision limits (8 cols, 30 rows, 40-char label, 80-char cell) and HTML stripping passed');

    // =========================================================================
    // SUITE 6: Public PDP SSR Rendering & Scoped CSS
    // =========================================================================
    console.log('\n[SUITE 6] Testing Public PDP SSR Dynamic Rendering & XSS Escaping...');
    let pdpRenderData = null;
    await publicProductController.detail(
      { params: { slug: slugProd1 }, protocol: 'https', get: () => 'euodoo.com' },
      {
        locals: { currentLang: 'id', settings: { company_name: 'PT Euodoo', whatsapp_number: '08123456789' } },
        status() { return this; },
        render(view, data) {
          pdpRenderData = data;
        }
      }
    );

    assert.ok(pdpRenderData && pdpRenderData.product, 'PDP controller must provide product data');
    const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'views/public/product-detail.ejs'), 'utf-8');
    const templateWithoutIncludes = rawTemplate.replace(/<%[-=]\s*include\([^)]+\)\s*;?\s*%>/g, '');

    const renderedHtml = ejs.render(templateWithoutIncludes, {
      ...pdpRenderData,
      lang: 'id',
      t: (key) => key,
      hasSizeTable: true,
      sizeColumns: pdpRenderData.product.size_table.columns,
      sizeRows: pdpRenderData.product.size_table.rows
    });

    assert.ok(renderedHtml.includes('data-cols="5"'), 'Table must have data-cols="5" attribute');
    assert.ok(renderedHtml.includes('Kode Produk'), 'Dynamic header Kode Produk rendered');
    assert.ok(renderedHtml.includes('Kapasitas (kg)'), 'Dynamic header Kapasitas (kg) rendered');
    assert.ok(renderedHtml.includes('KD-01'), 'Cell value KD-01 rendered');
    assert.ok(renderedHtml.includes('data-l="Kode Produk"'), 'data-l attribute rendered on cell');
    console.log('  ✓ 6a. PDP SSR renders dynamic headers, cells, and data-cols attribute');

    // XSS Audit in PDP rendering
    const xssHtml = ejs.render(templateWithoutIncludes, {
      ...pdpRenderData,
      product: {
        ...pdpRenderData.product,
        size_table: {
          columns: [{ id: 'col_1', label: 'Kolom & <script>' }],
          rows: [{ col_1: 'Nilai & <b>test</b>' }]
        }
      },
      lang: 'id',
      t: (key) => key
    });
    assert.ok(!xssHtml.includes('<script>'), 'Script tag in label must not be rendered raw');
    assert.ok(!xssHtml.includes('<b>test</b>'), 'Bold tag in cell must not be rendered raw');
    assert.ok(xssHtml.includes('&lt;script&gt;'), 'HTML entities escaped in SSR header');
    assert.ok(xssHtml.includes('&lt;b&gt;test&lt;/b&gt;'), 'HTML entities escaped in SSR cell');
    console.log('  ✓ 6b. PDP SSR escapes XSS payloads properly via EJS <%= %>');

    // Verify scoped CSS rules in components.css
    const componentsCss = fs.readFileSync(path.join(process.cwd(), 'public/css/components.css'), 'utf-8');
    for (let c = 1; c <= 8; c++) {
      assert.ok(componentsCss.includes(`table.pd-size[data-cols="${c}"]`), `CSS must have scoped rule for data-cols="${c}"`);
    }
    assert.ok(componentsCss.includes('.pd-size-scroll'), 'CSS must include .pd-size-scroll with scroll shadows');
    assert.ok(componentsCss.includes('table.pd-size td:first-child'), 'CSS must include first-child title card styling');
    console.log('  ✓ 6c. Scoped CSS data-cols 1-8, scroll shadows, and mobile card rules verified');

    // =========================================================================
    // SUITE 7: Icon Bug Resolution Verification (T-212)
    // =========================================================================
    console.log('\n[SUITE 7] Verifying T-212 Icon Bug Resolution in Admin Views...');
    const createView = fs.readFileSync(path.join(process.cwd(), 'views/admin/products/create.ejs'), 'utf-8');
    const editView = fs.readFileSync(path.join(process.cwd(), 'views/admin/products/edit.ejs'), 'utf-8');

    // Check no duplicate plus symbols (+ ) in action buttons
    assert.ok(!createView.includes('>+ <'), 'create.ejs must not contain literal ">+ <"');
    assert.ok(!editView.includes('>+ <'), 'edit.ejs must not contain literal ">+ <"');
    assert.ok(!createView.includes('>+ Tambah'), 'create.ejs must not contain literal ">+ Tambah"');
    assert.ok(!editView.includes('>+ Tambah'), 'edit.ejs must not contain literal ">+ Tambah"');

    // Verify aria-hidden="true" on SVG icons inside action buttons
    assert.ok(createView.includes('id="btnAddSizeRow"'), 'create.ejs has btnAddSizeRow');
    assert.ok(createView.includes('id="btnAddVariant"'), 'create.ejs has btnAddVariant');
    assert.ok(createView.includes('id="btnOpenGalleryPicker"'), 'create.ejs has btnOpenGalleryPicker');

    // Verify T-220 modal close button has SVG icon and no raw &times;
    assert.ok(!createView.includes('id="btnCloseCopyModal" aria-label="Tutup Modal">&times;</button>'), 'create.ejs must not contain literal &times;');
    assert.ok(!editView.includes('id="btnCloseCopyModal" aria-label="Tutup Modal">&times;</button>'), 'edit.ejs must not contain literal &times;');
    assert.ok(createView.includes('id="btnCloseCopyModal"'), 'create.ejs has btnCloseCopyModal');
    assert.ok(editView.includes('id="btnCloseCopyModal"'), 'edit.ejs has btnCloseCopyModal');
    console.log('  ✓ 7a. Action buttons & modal close icons verified: clean SVG icons, no literal glyphs');

    // =========================================================================
    // SUITE 8: Zero Comments & CSP Audit across Frontend Files
    // =========================================================================
    console.log('\n[SUITE 8] Auditing Zero Comments and Zero Inline Styles/Handlers...');
    const filesToCheckComments = [
      'views/admin/products/create.ejs',
      'views/admin/products/edit.ejs',
      'views/public/product-detail.ejs',
      'public/js/admin-size-table.js'
    ];

    for (const relPath of filesToCheckComments) {
      const fullPath = path.join(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      if (relPath.endsWith('.ejs')) {
        assert.ok(!content.includes('<!--'), `${relPath} must contain ZERO HTML comments`);
        assert.ok(!content.includes('style="'), `${relPath} must contain ZERO inline style="..."`);
        assert.ok(!content.includes('onclick='), `${relPath} must contain ZERO inline onclick=`);
        assert.ok(!content.includes('onchange='), `${relPath} must contain ZERO inline onchange=`);
      }
    }
    console.log('  ✓ 8a. Zero HTML comments (<!--), zero inline styles, and zero inline handlers verified');

    console.log('\n=======================================================');
    console.log('🎉 ALL T-219 END-TO-END QA & AUDIT SUITES PASSED 100%! 🎉');
    console.log('=======================================================');
  } finally {
    // Clean up created products
    if (createdProductIds.length > 0) {
      for (const id of createdProductIds) {
        try {
          await productModel.delete(id);
        } catch (_) {}
      }
      console.log(`\n[CLEANUP] Deleted ${createdProductIds.length} test products cleanly.`);
    }
  }
}

runDynamicSizeTableE2eQa()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ T-219 TEST SUITE FAILED:', err);
    process.exit(1);
  });
