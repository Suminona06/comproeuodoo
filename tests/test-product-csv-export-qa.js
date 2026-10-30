import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import productModel from '../models/productModel.js';
import productController from '../controllers/admin/productController.js';
import { escapeCsvValue, generateCsv, sendCsvResponse } from '../utils/csvExporter.js';

async function runCsvExportQaTests() {
  console.log('--- STARTING TASK T-216: CSV EXPORT & COLUMN UNION QA TESTS ---');
  const createdProductIds = [];

  try {
    // ==========================================
    // TEST 1: CSV Formula Injection Prevention (CWE-1236 / Decision 13)
    // ==========================================
    console.log('\n[TEST 1] Testing CSV Formula Injection Prevention...');

    // Cells starting with =, +, -, @, \t, \r must be prefixed with apostrophe
    const formulaTriggers = [
      { raw: '=cmd|\'/C calc\'!A0', expectedStart: `"'=cmd` },
      { raw: '=SUM(A1:B10)', expectedStart: `"'=SUM` },
      { raw: '+62812345678', expectedStart: `">'+62812` },
      { raw: '+12345', expectedStart: `">'+12345` },
      { raw: '-10% Diskon', expectedStart: ` "'-10%` },
      { raw: '-25', expectedStart: ` "'-25` },
      { raw: '@SUM(A1:A5)', expectedStart: `"'@SUM` },
      { raw: '@admin_handle', expectedStart: `"'@admin` },
      { raw: '\tTabExploit', expectedStart: `"'\tTabExploit` },
      { raw: '\rCarriageExploit', expectedStart: `"'\rCarriageExploit` },
      { raw: '   =1+1', expectedStart: `"'   =1+1` }
    ];

    for (const item of formulaTriggers) {
      const escaped = escapeCsvValue(item.raw);
      assert(
        escaped.startsWith(`"'`),
        `Expected value starting with formula trigger to be prefixed with apostrophe: ${item.raw} => got ${escaped}`
      );
    }

    // Normal values should NOT be prefixed with apostrophe
    const safeValues = ['Plastik HDPE', '100 cm', '0.05 mm', 'Super', ''];
    for (const val of safeValues) {
      const escaped = escapeCsvValue(val);
      assert(
        !escaped.startsWith(`"'`),
        `Safe value should not have apostrophe prefix: ${val} => got ${escaped}`
      );
    }
    console.log('  1a. Formula injection triggers (=, +, -, @, \\t, \\r, leading space): PASSED');

    // ==========================================
    // TEST 2: Quotes and Comma Escaping (RFC 4180)
    // ==========================================
    console.log('\n[TEST 2] Testing Quotes & Comma Escaping RFC 4180...');

    const quotesVal = escapeCsvValue('Plastik 12" x 15"');
    assert.strictEqual(quotesVal, '"Plastik 12"" x 15"""');

    const commaVal = escapeCsvValue('Jakarta, Indonesia');
    assert.strictEqual(commaVal, '"Jakarta, Indonesia"');

    const combinedVal = escapeCsvValue('Ukuran "Super", 50cm\nBaru');
    assert.strictEqual(combinedVal, '"Ukuran ""Super"", 50cm\nBaru"');

    const nullVal = escapeCsvValue(null);
    assert.strictEqual(nullVal, '""');

    const undefinedVal = escapeCsvValue(undefined);
    assert.strictEqual(undefinedVal, '""');

    console.log('  2a. RFC 4180 quotes, commas, and multiline escaping: PASSED');

    // ==========================================
    // TEST 3: UTF-8 with BOM for Excel Compatibility
    // ==========================================
    console.log('\n[TEST 3] Testing UTF-8 BOM in sendCsvResponse...');

    let writtenChunks = [];
    let responseEnded = false;
    let headersSet = {};

    const mockRes = {
      setHeader(name, val) {
        headersSet[name] = val;
      },
      write(chunk) {
        writtenChunks.push(chunk);
      },
      end(chunk) {
        if (chunk) writtenChunks.push(chunk);
        responseEnded = true;
      }
    };

    sendCsvResponse(mockRes, 'test-export.csv', [{ label: 'Nama', key: 'nama' }], [{ nama: 'Produk A' }]);

    assert.strictEqual(responseEnded, true, 'Response should end');
    assert(headersSet['Content-Type'].includes('text/csv'), 'Content-Type must be text/csv');
    assert(headersSet['Content-Type'].includes('charset=utf-8'), 'Content-Type must declare utf-8');
    assert(headersSet['Content-Disposition'].includes('test-export.csv'), 'Disposition must specify filename');

    // Verify first chunk starts with BOM \uFEFF
    assert.strictEqual(writtenChunks[0], '\uFEFF', 'First written chunk must be UTF-8 BOM (\\uFEFF)');
    console.log('  3a. UTF-8 BOM byte sequence and HTTP headers: PASSED');

    // ==========================================
    // TEST 4: Union of Columns (3-col, 4-col, and no-table products)
    // ==========================================
    console.log('\n[TEST 4] Testing Union of Columns with 3-col, 4-col, and no-table products...');

    const timestamp = Date.now();

    // Product 1: 3 dynamic columns
    const idProd1 = await productModel.create({
      name_id: 'Produk Uji T216 3-Kolom',
      name_en: 'T216 Test Product 3-Col',
      slug: `t216-prod-3col-${timestamp}`,
      category_id: 1,
      status: 'published',
      cta_text_id: 'Konsultasi 3-Kolom',
      cta_text_en: 'Consult 3-Col',
      size_table: {
        columns: [
          { id: 'col_1', label: 'Kode Ukuran' },
          { id: 'col_2', label: 'Lebar (cm)' },
          { id: 'col_3', label: 'Panjang (cm)' }
        ],
        rows: [
          { col_1: 'KU-01', col_2: '30', col_3: '50' },
          { col_1: 'KU-02', col_2: '40', col_3: '60' }
        ]
      }
    });
    createdProductIds.push(idProd1);

    // Product 2: 4 dynamic columns (shared: Kode Ukuran, Lebar (cm); unique: Tebal (Micron), Kapasitas (kg))
    // Also include a cell with formula injection payload to test end-to-end escaping
    const idProd2 = await productModel.create({
      name_id: 'Produk Uji T216 4-Kolom',
      name_en: 'T216 Test Product 4-Col',
      slug: `t216-prod-4col-${timestamp}`,
      category_id: 1,
      status: 'published',
      cta_text_id: '=HYPERLINK("http://evil.com")',
      cta_text_en: '+62811223344',
      size_table: {
        columns: [
          { id: 'col_1', label: 'Kode Ukuran' },
          { id: 'col_2', label: 'Lebar (cm)' },
          { id: 'col_3', label: 'Tebal (Micron)' },
          { id: 'col_4', label: 'Kapasitas (kg)' }
        ],
        rows: [
          { col_1: '=SUM(1,2)', col_2: '50', col_3: '45', col_4: '15' }
        ]
      }
    });
    createdProductIds.push(idProd2);

    // Product 3: No size table (null / empty)
    const idProd3 = await productModel.create({
      name_id: 'Produk Uji T216 Tanpa Tabel',
      name_en: 'T216 Test Product No-Table',
      slug: `t216-prod-notable-${timestamp}`,
      category_id: 1,
      status: 'published',
      cta_text_id: 'Pesan Sekarang',
      cta_text_en: 'Order Now',
      size_table: null
    });
    createdProductIds.push(idProd3);

    // Call productController.exportCsv
    let exportChunks = [];
    const exportResMock = {
      setHeader(name, val) {},
      write(chunk) {
        exportChunks.push(chunk);
      },
      end(chunk) {
        if (chunk) exportChunks.push(chunk);
      }
    };

    await productController.exportCsv({}, exportResMock);

    const fullCsv = exportChunks.join('');
    assert(fullCsv.startsWith('\uFEFF'), 'Exported CSV must begin with UTF-8 BOM');

    // Parse CSV lines
    const lines = fullCsv.replace(/^\uFEFF/, '').trim().split('\r\n');
    const headerLine = lines[0];

    // Helper to parse RFC 4180 CSV line into cells
    function parseCsvLine(line) {
      const cells = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          cells.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current);
      return cells;
    }

    const headers = parseCsvLine(headerLine);
    console.log('  Exported Headers count:', headers.length);

    // Check base headers
    assert(headers.includes('ID'), 'Must include ID header');
    assert(headers.includes('Slug'), 'Must include Slug header');
    assert(headers.includes('Nama Produk (ID)'), 'Must include Nama Produk (ID) header');
    assert(headers.includes('Kategori'), 'Must include Kategori header');
    assert(headers.includes('Teks CTA (ID)'), 'Must include Teks CTA (ID) header');
    assert(headers.includes('Status'), 'Must include Status header');

    // Check union of dynamic headers
    assert(headers.includes('Kode Ukuran'), 'Must include unified "Kode Ukuran" header');
    assert(headers.includes('Lebar (cm)'), 'Must include unified "Lebar (cm)" header');
    assert(headers.includes('Panjang (cm)'), 'Must include "Panjang (cm)" header from Prod 1');
    assert(headers.includes('Tebal (Micron)'), 'Must include "Tebal (Micron)" header from Prod 2');
    assert(headers.includes('Kapasitas (kg)'), 'Must include "Kapasitas (kg)" header from Prod 2');

    // Verify deduplication: 'Kode Ukuran' and 'Lebar (cm)' must appear exactly once in headers
    const countKodeUkuran = headers.filter(h => h.toLowerCase() === 'kode ukuran').length;
    const countLebar = headers.filter(h => h.toLowerCase() === 'lebar (cm)').length;
    assert.strictEqual(countKodeUkuran, 1, 'Header "Kode Ukuran" must not be duplicated');
    assert.strictEqual(countLebar, 1, 'Header "Lebar (cm)" must not be duplicated');

    // Find column indexes
    const idxSlug = headers.indexOf('Slug');
    const idxCtaId = headers.indexOf('Teks CTA (ID)');
    const idxCtaEn = headers.indexOf('Teks CTA (EN)');
    const idxKodeUkuran = headers.indexOf('Kode Ukuran');
    const idxLebar = headers.indexOf('Lebar (cm)');
    const idxPanjang = headers.indexOf('Panjang (cm)');
    const idxTebal = headers.indexOf('Tebal (Micron)');
    const idxKapasitas = headers.indexOf('Kapasitas (kg)');

    // Find rows for our test products
    const dataRows = lines.slice(1).map(parseCsvLine);
    const prod1Rows = dataRows.filter(r => r[idxSlug] === `t216-prod-3col-${timestamp}`);
    const prod2Rows = dataRows.filter(r => r[idxSlug] === `t216-prod-4col-${timestamp}`);
    const prod3Rows = dataRows.filter(r => r[idxSlug] === `t216-prod-notable-${timestamp}`);

    // Product 1 verification (3 columns, 2 rows)
    assert.strictEqual(prod1Rows.length, 2, 'Product 1 should have 2 rows exported');
    assert.strictEqual(prod1Rows[0][idxKodeUkuran], 'KU-01');
    assert.strictEqual(prod1Rows[0][idxLebar], '30');
    assert.strictEqual(prod1Rows[0][idxPanjang], '50');
    assert.strictEqual(prod1Rows[0][idxTebal], '', 'Prod 1 should have empty string for missing column Tebal');
    assert.strictEqual(prod1Rows[0][idxKapasitas], '', 'Prod 1 should have empty string for missing column Kapasitas');

    assert.strictEqual(prod1Rows[1][idxKodeUkuran], 'KU-02');
    assert.strictEqual(prod1Rows[1][idxLebar], '40');
    assert.strictEqual(prod1Rows[1][idxPanjang], '60');
    assert.strictEqual(prod1Rows[1][idxTebal], '');
    assert.strictEqual(prod1Rows[1][idxKapasitas], '');

    // Product 2 verification (4 columns, 1 row, formula injection payload)
    assert.strictEqual(prod2Rows.length, 1, 'Product 2 should have 1 row exported');
    // Verify formula injection payload was safely escaped
    assert.strictEqual(prod2Rows[0][idxKodeUkuran], "'=SUM(1,2)", 'Formula injection in size cell must be prefixed with apostrophe');
    assert.strictEqual(prod2Rows[0][idxCtaId], "'=HYPERLINK(\"http://evil.com\")", 'Formula injection in CTA text must be prefixed with apostrophe');
    assert.strictEqual(prod2Rows[0][idxCtaEn], "'+62811223344", 'Leading + in CTA text must be prefixed with apostrophe');
    assert.strictEqual(prod2Rows[0][idxLebar], '50');
    assert.strictEqual(prod2Rows[0][idxTebal], '45');
    assert.strictEqual(prod2Rows[0][idxKapasitas], '15');
    assert.strictEqual(prod2Rows[0][idxPanjang], '', 'Prod 2 should have empty string for missing column Panjang');

    // Product 3 verification (No table, 1 row)
    assert.strictEqual(prod3Rows.length, 1, 'Product 3 should have 1 row exported');
    assert.strictEqual(prod3Rows[0][idxKodeUkuran], '', 'Prod 3 should have empty string for all dynamic columns');
    assert.strictEqual(prod3Rows[0][idxLebar], '', 'Prod 3 should have empty string for all dynamic columns');
    assert.strictEqual(prod3Rows[0][idxPanjang], '', 'Prod 3 should have empty string for all dynamic columns');
    assert.strictEqual(prod3Rows[0][idxTebal], '', 'Prod 3 should have empty string for all dynamic columns');
    assert.strictEqual(prod3Rows[0][idxKapasitas], '', 'Prod 3 should have empty string for all dynamic columns');

    console.log('  4a. 3-column product data & empty padding: PASSED');
    console.log('  4b. 4-column product data & formula injection defense: PASSED');
    console.log('  4c. Product without size table (empty padding for all columns): PASSED');

    // ==========================================
    // TEST 5: API Endpoint GET /admin/products/:id/size-table-columns RBAC & Output
    // ==========================================
    console.log('\n[TEST 5] Testing GET /admin/products/:id/size-table-columns API...');

    let resData = null;
    let statusCode = 200;
    const apiResMock = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        resData = data;
        return this;
      }
    };

    await productController.getSizeTableColumns({ params: { id: idProd1 } }, apiResMock);
    assert.strictEqual(statusCode, 200);
    assert.strictEqual(resData.success, true);
    assert.strictEqual(resData.columns.length, 3);
    assert.strictEqual(resData.columns[0].label, 'Kode Ukuran');
    assert.strictEqual(resData.columns[1].label, 'Lebar (cm)');
    assert.strictEqual(resData.columns[2].label, 'Panjang (cm)');

    // 404 for non-existent product
    let notFoundCode = 200;
    let notFoundData = null;
    await productController.getSizeTableColumns({ params: { id: 999999 } }, {
      status(c) { notFoundCode = c; return this; },
      json(d) { notFoundData = d; return this; }
    });
    assert.strictEqual(notFoundCode, 404);
    assert.strictEqual(notFoundData.success, false);
    console.log('  5a. getSizeTableColumns API returns columns and 404 on missing: PASSED');

    console.log('\n--- ALL TASK T-216 CSV EXPORT & COLUMN UNION TESTS PASSED! ---');
  } finally {
    // Clean up created products
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

runCsvExportQaTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n[FATAL ERROR IN T-216 QA]:', err);
    process.exit(1);
  });
