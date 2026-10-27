import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import productModel from '../models/productModel.js';
import productController, { parseDynamicSizeTable } from '../controllers/admin/productController.js';
import { pool, query } from '../config/database.js';

async function runT217ValidationQaTests() {
  console.log('--- STARTING TASK T-217: SERVER-SIDE VALIDATION & ISOLATION QA TESTS ---');
  const createdProductIds = [];

  try {
    // ==========================================
    // TEST 1: Whitelist Kunci Sel (Wild / Foreign Keys Discarded)
    // ==========================================
    console.log('\n[TEST 1] Testing Cell Key Whitelist & Wild Keys Discarding...');
    const payloadWithWildKeys = {
      size_table: JSON.stringify({
        columns: [
          { id: 'col_1', label: 'Kode Produk' },
          { id: 'col_2', label: 'Ukuran' }
        ],
        rows: [
          {
            col_1: 'EU-01',
            col_2: '30 cm',
            foreign_admin_id: 'leaked_data',
            __proto_test__: 'danger',
            extra_field_999: 'dropped'
          }
        ]
      })
    };

    const parsedTable = parseDynamicSizeTable(payloadWithWildKeys);
    assert.ok(parsedTable, 'Parsed table must not be null');
    assert.strictEqual(parsedTable.columns.length, 2);
    assert.strictEqual(parsedTable.rows.length, 1);

    const rowKeys = Object.keys(parsedTable.rows[0]);
    assert.deepStrictEqual(rowKeys.sort(), ['col_1', 'col_2'].sort(), 'Row keys must strictly match canonical column IDs');
    assert.strictEqual(parsedTable.rows[0].foreign_admin_id, undefined, 'Wild key foreign_admin_id must be discarded');
    assert.strictEqual(parsedTable.rows[0].extra_field_999, undefined, 'Wild key extra_field_999 must be discarded');
    console.log('  1a. Wild and non-whitelisted keys discarded: PASSED');

    // ==========================================
    // TEST 2: Limits Enforcement (1-8 Columns, 0-30 Rows, 40 Chars Label, 80 Chars Cell)
    // ==========================================
    console.log('\n[TEST 2] Testing Decision 5 Limits Enforcement...');

    // 2a. Empty column label rejected
    assert.throws(
      () => parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: [{ id: 'col_1', label: '   ' }],
          rows: [{ col_1: 'test' }]
        })
      }),
      /Label kolom tabel ukuran tidak boleh kosong/,
      'Empty label must be rejected'
    );
    console.log('  2a. Empty column label rejected: PASSED');

    // 2b. Label with only HTML tags rejected
    assert.throws(
      () => parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: [{ id: 'col_1', label: '<b>  </b>' }],
          rows: [{ col_1: 'test' }]
        })
      }),
      /Label kolom tabel ukuran tidak boleh kosong/,
      'HTML-only empty label must be rejected'
    );
    console.log('  2b. HTML-only empty label rejected: PASSED');

    // 2c. Label > 40 chars rejected
    assert.throws(
      () => parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: [{ id: 'col_1', label: 'A'.repeat(41) }],
          rows: [{ col_1: 'test' }]
        })
      }),
      /melebihi batas maksimal 40 karakter/,
      'Label > 40 chars must be rejected'
    );
    console.log('  2c. Label > 40 chars rejected: PASSED');

    // 2d. More than 8 columns rejected
    const nineColumns = Array.from({ length: 9 }, (_, i) => ({ id: `col_${i + 1}`, label: `Kolom ${i + 1}` }));
    assert.throws(
      () => parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: nineColumns,
          rows: []
        })
      }),
      /Tabel ukuran maksimal memiliki 8 kolom/,
      'More than 8 columns must be rejected'
    );
    console.log('  2d. > 8 columns rejected: PASSED');

    // 2e. More than 30 rows rejected
    const thirtyOneRows = Array.from({ length: 31 }, (_, i) => ({ col_1: `Val ${i + 1}` }));
    assert.throws(
      () => parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: [{ id: 'col_1', label: 'Kode' }],
          rows: thirtyOneRows
        })
      }),
      /Tabel ukuran maksimal memiliki 30 baris/,
      'More than 30 rows must be rejected'
    );
    console.log('  2e. > 30 rows rejected: PASSED');

    // 2f. Cell > 80 chars rejected
    assert.throws(
      () => parseDynamicSizeTable({
        size_table: JSON.stringify({
          columns: [{ id: 'col_1', label: 'Kode' }],
          rows: [{ col_1: 'B'.repeat(81) }]
        })
      }),
      /melebihi batas maksimal 80 karakter/,
      'Cell > 80 chars must be rejected'
    );
    console.log('  2f. Cell > 80 chars rejected: PASSED');

    // ==========================================
    // TEST 3: HTML Tag Sanitization and Trim
    // ==========================================
    console.log('\n[TEST 3] Testing HTML Tag Sanitization and Whitespace Trimming...');
    const htmlPayload = {
      size_table: JSON.stringify({
        columns: [
          { id: 'c1', label: '  <script>alert("xss")</script>Lebar (cm)  ' }
        ],
        rows: [
          { c1: '  <b>50 cm</b> <style>bad</style> ' }
        ]
      })
    };
    const sanitized = parseDynamicSizeTable(htmlPayload);
    assert.strictEqual(sanitized.columns[0].label, 'alert("xss")Lebar (cm)', 'HTML tags in label must be stripped');
    assert.strictEqual(sanitized.rows[0].col_1, '50 cm bad', 'HTML tags in cells must be stripped');
    console.log('  3a. HTML tags stripped and whitespace trimmed: PASSED');

    // ==========================================
    // TEST 4: Atomic Transactions in productModel (create & update)
    // ==========================================
    console.log('\n[TEST 4] Testing Atomic Transactions in productModel...');
    const timestamp = Date.now();
    const testSlugAtomic = `t217-atomic-${timestamp}`;

    // Test product create atomicity
    const createdId = await productModel.create({
      name_id: 'Produk Uji Atomik T217',
      name_en: 'Atomic Test Product T217',
      slug: testSlugAtomic,
      category_id: 1,
      status: 'published',
      variants: ['Varian 1', 'Varian 2'],
      size_table: {
        columns: [
          { id: 'col_1', label: 'Kode' },
          { id: 'col_2', label: 'Lebar' }
        ],
        rows: [
          { col_1: 'A1', col_2: '30' }
        ]
      }
    });
    createdProductIds.push(createdId);

    const fetchedCreated = await productModel.findById(createdId);
    assert.ok(fetchedCreated, 'Product must exist in DB');
    assert.strictEqual(fetchedCreated.variants.length, 2, 'Variants must be saved');
    assert.strictEqual(fetchedCreated.size_table.columns.length, 2, 'Size table columns must be saved');

    // Test update atomicity
    await productModel.update(createdId, {
      name_id: 'Produk Uji Atomik T217 Updated',
      variants: ['Varian Baru'],
      size_table: {
        columns: [
          { id: 'col_1', label: 'Kode Baru' }
        ],
        rows: [
          { col_1: 'B1' }
        ]
      }
    });

    const fetchedUpdated = await productModel.findById(createdId);
    assert.strictEqual(fetchedUpdated.name_id, 'Produk Uji Atomik T217 Updated');
    assert.strictEqual(fetchedUpdated.variants.length, 1);
    assert.strictEqual(fetchedUpdated.size_table.columns.length, 1);
    assert.strictEqual(fetchedUpdated.size_table.columns[0].label, 'Kode Baru');
    console.log('  4a. Atomic transaction save for product and variants: PASSED');

    // ==========================================
    // TEST 5: Strict Product Isolation (Product A vs Product B)
    // ==========================================
    console.log('\n[TEST 5] Testing Strict Product Isolation: Edit Product A does NOT touch Product B...');
    const idA = await productModel.create({
      name_id: 'Produk Isolasi A ' + timestamp,
      name_en: 'Isolation Product A',
      slug: `iso-a-${timestamp}`,
      category_id: 1,
      status: 'published',
      size_table: {
        columns: [
          { id: 'col_1', label: 'Kolom A1' },
          { id: 'col_2', label: 'Kolom A2' }
        ],
        rows: [
          { col_1: 'Val A1', col_2: 'Val A2' }
        ]
      }
    });
    createdProductIds.push(idA);

    const idB = await productModel.create({
      name_id: 'Produk Isolasi B ' + timestamp,
      name_en: 'Isolation Product B',
      slug: `iso-b-${timestamp}`,
      category_id: 1,
      status: 'published',
      size_table: {
        columns: [
          { id: 'col_1', label: 'Kolom B1' },
          { id: 'col_2', label: 'Kolom B2' },
          { id: 'col_3', label: 'Kolom B3' }
        ],
        rows: [
          { col_1: 'Val B1', col_2: 'Val B2', col_3: 'Val B3' }
        ]
      }
    });
    createdProductIds.push(idB);

    // Snapshot B before editing A
    const bBefore = await productModel.findById(idB);
    const bBeforeJson = JSON.stringify(bBefore.size_table.toJSON());

    // Edit Product A with malicious / foreign attempt or total restructure
    const mockUpdateReq = {
      params: { id: idA },
      body: {
        name_id: 'Produk Isolasi A Edited',
        size_table: JSON.stringify({
          columns: [
            { id: 'col_1', label: 'Kolom A Super' }
          ],
          rows: [
            { col_1: 'Nilai Baru', col_b_leak: 'trying to leak into B' }
          ]
        })
      }
    };

    let redirectLocation = '';
    const mockUpdateRes = {
      redirect(url) {
        redirectLocation = url;
      }
    };

    await productController.update(mockUpdateReq, mockUpdateRes);
    assert(redirectLocation.includes('success='), 'Update of Product A must succeed');

    // Fetch Product B again and verify 100% untouched
    const bAfter = await productModel.findById(idB);
    const bAfterJson = JSON.stringify(bAfter.size_table.toJSON());

    assert.strictEqual(bAfterJson, bBeforeJson, 'Product B size_table must remain 100% strictly identical');
    assert.strictEqual(bAfter.size_table.columns.length, 3, 'Product B must still have 3 columns');
    assert.strictEqual(bAfter.size_table.columns[0].label, 'Kolom B1');
    assert.strictEqual(bAfter.size_table.rows[0].col_1, 'Val B1');
    console.log('  5a. Product B confirmed 100% untouched when Product A was edited: PASSED');

    // ==========================================
    // TEST 6: Modal Reference Column Picker Endpoint Privacy & RBAC
    // ==========================================
    console.log('\n[TEST 6] Testing Column Picker Endpoint Privacy (Only columns, no cell data)...');
    let pickerJson = null;
    await productController.getSizeTableColumns({ params: { id: idB } }, {
      json(data) {
        pickerJson = data;
        return this;
      },
      status(code) { return this; }
    });

    assert.ok(pickerJson && pickerJson.success, 'Picker response must be successful');
    assert.ok(Array.isArray(pickerJson.columns), 'Must return columns array');
    assert.strictEqual(pickerJson.columns.length, 3);
    assert.strictEqual(pickerJson.columns[0].label, 'Kolom B1');
    // Critical: Ensure no rows or cell data leaked in API response!
    assert.strictEqual(pickerJson.rows, undefined, 'Endpoint must NOT return rows or cell data');
    assert.strictEqual(pickerJson.data, undefined, 'Endpoint must NOT return raw data');
    console.log('  6a. Endpoint returns only column structure and zero cell data: PASSED');

    console.log('\n--- ALL TASK T-217 VALIDATION & ISOLATION TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    // Cleanup created products
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

runT217ValidationQaTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n[FATAL ERROR IN T-217 QA]:', err);
    process.exit(1);
  });
