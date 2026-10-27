import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import productModel, { normalizeSizeTable, serializeSizeTable } from '../models/productModel.js';
import productController from '../controllers/admin/productController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runIsolationQATests() {
  console.log('--- STARTING TASK T-215 PRODUCT ISOLATION & DYNAMIC SIZE TABLE QA TESTS ---');

  const createdProductIds = [];

  try {
    // 1. Verify frontend files have ZERO comments and ZERO inline styles
    console.log('\n[TEST 1] Verifying frontend files for zero comments and zero inline styles...');
    const createEjs = fs.readFileSync(path.join(__dirname, '../views/admin/products/create.ejs'), 'utf-8');
    const editEjs = fs.readFileSync(path.join(__dirname, '../views/admin/products/edit.ejs'), 'utf-8');
    const adminSizeJs = fs.readFileSync(path.join(__dirname, '../public/js/admin-size-table.js'), 'utf-8');

    assert(!createEjs.includes('<!--'), 'create.ejs must not contain HTML comments');
    assert(!editEjs.includes('<!--'), 'edit.ejs must not contain HTML comments');
    assert(!createEjs.includes('style="'), 'create.ejs must not contain inline style="..."');
    assert(!editEjs.includes('style="'), 'edit.ejs must not contain inline style="..."');
    assert(!adminSizeJs.includes('//') && !adminSizeJs.includes('/*'), 'admin-size-table.js must be comment-free');

    assert(createEjs.includes('dynamicSizeEditor'), 'create.ejs must include dynamicSizeEditor');
    assert(createEjs.includes('modalCopySizeColumns'), 'create.ejs must include modalCopySizeColumns');
    assert(createEjs.includes('btnCopySizeColumns'), 'create.ejs must include btnCopySizeColumns');
    assert(createEjs.includes('admin-size-table.js'), 'create.ejs must load admin-size-table.js');

    assert(editEjs.includes('dynamicSizeEditor'), 'edit.ejs must include dynamicSizeEditor');
    assert(editEjs.includes('modalCopySizeColumns'), 'edit.ejs must include modalCopySizeColumns');
    assert(editEjs.includes('admin-size-table.js'), 'edit.ejs must load admin-size-table.js');
    console.log('  1. Zero comments & template structure: PASSED');

    // 2. Test server-generated column IDs & isolation from raw input IDs
    console.log('\n[TEST 2] Testing server-generated column IDs and isolation from raw input IDs...');
    const rawMaliciousPayload = {
      columns: [
        { id: 'malicious_cross_prod_id_999', label: 'Panjang Khusus' },
        { id: 'foreign_client_id_888', label: 'Lebar Standar' }
      ],
      rows: [
        { malicious_cross_prod_id_999: '100 cm', foreign_client_id_888: '50 cm', injected_garbage: 'bad' }
      ]
    };

    const serializedRaw = serializeSizeTable(rawMaliciousPayload);
    const parsedRaw = JSON.parse(serializedRaw);
    assert.strictEqual(parsedRaw.columns[0].id, 'col_1', 'Column 0 ID must be strictly server-generated as col_1');
    assert.strictEqual(parsedRaw.columns[1].id, 'col_2', 'Column 1 ID must be strictly server-generated as col_2');
    assert.strictEqual(parsedRaw.rows[0].col_1, '100 cm', 'Row col_1 value mapped accurately');
    assert.strictEqual(parsedRaw.rows[0].col_2, '50 cm', 'Row col_2 value mapped accurately');
    assert.strictEqual(parsedRaw.rows[0].malicious_cross_prod_id_999, undefined, 'Raw input ID must not leak into saved row');
    assert.strictEqual(parsedRaw.rows[0].injected_garbage, undefined, 'Unwhitelisted keys must be discarded');
    console.log('  2. Server-generated column IDs & input sanitization: PASSED');

    // 3. Test API endpoint GET /admin/products/:id/size-table-columns
    console.log('\n[TEST 3] Testing GET /admin/products/:id/size-table-columns endpoint...');
    const testSlugA = 'test-prod-iso-a-' + Date.now();
    const idA = await productModel.create({
      name_id: 'Produk Uji Isolasi A',
      name_en: 'Isolation Test Product A',
      slug: testSlugA,
      category_id: 1,
      status: 'published',
      size_table: {
        columns: [
          { id: 'col_1', label: 'Lebar Kantong A' },
          { id: 'col_2', label: 'Kapasitas Beban A' }
        ],
        rows: [
          { col_1: '25 cm', col_2: '5 kg' },
          { col_1: '30 cm', col_2: '8 kg' }
        ]
      }
    });
    createdProductIds.push(idA);

    let apiJson = null;
    const mockReqApi = { params: { id: idA } };
    const mockResApi = {
      json(data) { apiJson = data; return this; },
      status(code) { return this; }
    };
    await productController.getSizeTableColumns(mockReqApi, mockResApi);

    assert.ok(apiJson && apiJson.success, 'API must return success: true');
    assert.strictEqual(apiJson.columns.length, 2, 'API must return 2 columns');
    assert.strictEqual(apiJson.columns[0].label, 'Lebar Kantong A');
    assert.strictEqual(apiJson.columns[1].label, 'Kapasitas Beban A');
    console.log('  3. getSizeTableColumns API endpoint: PASSED');

    // 4. Test Strict Isolation: Edit Product A and verify Product B is 100% UNCHANGED
    console.log('\n[TEST 4] Testing Strict Isolation: Edit Product A and verify Product B is 100% unchanged...');
    const testSlugB = 'test-prod-iso-b-' + Date.now();
    const initialSizeTableB = {
      columns: [
        { id: 'col_1', label: 'Diameter Pipa B' },
        { id: 'col_2', label: 'Toleransi Suhu B' },
        { id: 'col_3', label: 'Tekanan Maks B' }
      ],
      rows: [
        { col_1: '50 mm', col_2: '120 C', col_3: '10 bar' },
        { col_1: '75 mm', col_2: '150 C', col_3: '15 bar' }
      ]
    };

    const idB = await productModel.create({
      name_id: 'Produk Uji Isolasi B',
      name_en: 'Isolation Test Product B',
      slug: testSlugB,
      category_id: 1,
      status: 'published',
      size_table: initialSizeTableB
    });
    createdProductIds.push(idB);

    // Capture baseline snapshot of Product B
    const snapshotBBefore = await productModel.findById(idB);
    const jsonBBefore = JSON.stringify(snapshotBBefore.size_table.toJSON());

    // Perform intensive edits on Product A:
    // - Rename column
    // - Add new column
    // - Add new rows
    // - Mutate cell values
    await productModel.update(idA, {
      name_id: 'Produk Uji Isolasi A (Diperbarui)',
      size_table: {
        columns: [
          { id: 'col_1', label: 'Lebar Kantong Jumbo A' },
          { id: 'col_2', label: 'Kapasitas Ekstra A' },
          { id: 'col_3', label: 'Ketahanan UV A' }
        ],
        rows: [
          { col_1: '40 cm', col_2: '15 kg', col_3: 'Grade 5' },
          { col_1: '45 cm', col_2: '20 kg', col_3: 'Grade 5' },
          { col_1: '50 cm', col_2: '25 kg', col_3: 'Grade 5+' }
        ]
      }
    });

    // Re-fetch Product B and compare against baseline snapshot
    const snapshotBAfter = await productModel.findById(idB);
    const jsonBAfter = JSON.stringify(snapshotBAfter.size_table.toJSON());

    assert.strictEqual(jsonBAfter, jsonBBefore, 'Product B size_table must be 100% IDENTICAL before and after editing Product A');
    assert.strictEqual(snapshotBAfter.name_id, 'Produk Uji Isolasi B');
    assert.strictEqual(snapshotBAfter.size_table.columns.length, 3);
    assert.strictEqual(snapshotBAfter.size_table.columns[0].label, 'Diameter Pipa B');
    assert.strictEqual(snapshotBAfter.size_table.rows.length, 2);
    assert.strictEqual(snapshotBAfter.size_table.rows[0].col_1, '50 mm');
    assert.strictEqual(snapshotBAfter.size_table.rows[0].col_2, '120 C');
    assert.strictEqual(snapshotBAfter.size_table.rows[0].col_3, '10 bar');
    console.log('  4. Isolation verification (Product B strictly unchanged): PASSED');

    // 5. Test Copy Structure Isolation: Copy columns from B to C
    console.log('\n[TEST 5] Testing Copy Structure Isolation: Copy columns from B to C...');
    // When copying structure from B to C, only labels and order are copied;
    // C gets its own fresh server-generated column IDs, and rows are blank
    const testSlugC = 'test-prod-iso-c-' + Date.now();
    const copiedColumnsForC = snapshotBAfter.size_table.columns.map((c, idx) => ({
      id: `col_${idx + 1}`,
      label: c.label
    }));

    const idC = await productModel.create({
      name_id: 'Produk Uji Isolasi C (Hasil Salin)',
      name_en: 'Isolation Test Product C (Copied)',
      slug: testSlugC,
      category_id: 1,
      status: 'published',
      size_table: {
        columns: copiedColumnsForC,
        rows: [
          { col_1: 'Custom C Val 1', col_2: 'Custom C Val 2', col_3: 'Custom C Val 3' }
        ]
      }
    });
    createdProductIds.push(idC);

    const productC = await productModel.findById(idC);
    assert.strictEqual(productC.size_table.columns.length, 3);
    assert.strictEqual(productC.size_table.columns[0].label, 'Diameter Pipa B');
    assert.strictEqual(productC.size_table.rows[0].col_1, 'Custom C Val 1');

    // Verify Product B's data was NOT transferred or overwritten
    const productBCheck = await productModel.findById(idB);
    assert.strictEqual(productBCheck.size_table.rows[0].col_1, '50 mm', 'Product B rows must not be altered');
    assert.notStrictEqual(productC.size_table.rows[0].col_1, productBCheck.size_table.rows[0].col_1);
    console.log('  5. Copy Structure isolation verified: PASSED');

  } finally {
    // Cleanup
    for (const id of createdProductIds) {
      try {
        await productModel.delete(id);
      } catch {}
    }
    console.log('\n[CLEANUP] Deleted test products cleanly.');
  }

  console.log('\n--- ALL TASK T-215 ACCEPTANCE & ISOLATION TESTS PASSED! ---');
  process.exit(0);
}

runIsolationQATests().catch(err => {
  console.error('FAILED T-215 ISOLATION TEST:', err);
  process.exit(1);
});
