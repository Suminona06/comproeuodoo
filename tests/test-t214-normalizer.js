import assert from 'assert';
import productModel, { normalizeSizeTable, serializeSizeTable, DEFAULT_SIZE_COLUMNS } from '../models/productModel.js';

async function runT214Tests() {
  console.log('--- STARTING TASK T-214 NORMALIZER & DYNAMIC SIZE TABLE TESTS ---');

  // Test 1: Empty / Null / Undefined input
  console.log('\n[TEST 1] Testing empty/null/undefined fallback...');
  [null, undefined, '', '   ', 'null', '{}', '[]'].forEach(input => {
    const res = normalizeSizeTable(input);
    assert.ok(Array.isArray(res), 'Result must be an array');
    assert.strictEqual(res.length, 0, 'Array length must be 0');
    assert.deepStrictEqual(res.columns, [], 'Columns must be empty array');
    assert.deepStrictEqual(res.rows, [], 'Rows must be empty array');
    assert.deepStrictEqual(res.toJSON(), { columns: [], rows: [] }, 'toJSON must return empty object');
  });
  console.log('  1. Empty/null fallback: PASSED');

  // Test 2: Malformed JSON string (MariaDB raw string or corrupted JSON)
  console.log('\n[TEST 2] Testing malformed JSON string safe fallback...');
  const malformed = normalizeSizeTable('{ malformed json ');
  assert.ok(Array.isArray(malformed));
  assert.strictEqual(malformed.length, 0);
  assert.deepStrictEqual(malformed.columns, []);
  console.log('  2. Malformed JSON safe fallback: PASSED');

  // Test 3: Legacy format array as string (MariaDB return type) and as parsed Array (MySQL return type)
  console.log('\n[TEST 3] Testing legacy array parsing (MariaDB string vs MySQL parsed)...');
  const legacyArray = [
    { kode_produk: 'LP-01', lebar: '20 cm', panjang: '30 cm', tebal_micron: '40', kapasitas: '3 kg', bahan: 'PE' }
  ];
  const fromObj = normalizeSizeTable(legacyArray);
  const fromStr = normalizeSizeTable(JSON.stringify(legacyArray));

  [fromObj, fromStr].forEach((res, idx) => {
    assert.ok(Array.isArray(res), `Case ${idx}: result must be array`);
    assert.strictEqual(res.length, 1, `Case ${idx}: length must be 1`);
    assert.strictEqual(res.columns.length, 6, `Case ${idx}: must have 6 default columns`);
    assert.strictEqual(res.columns[0].id, 'col_1');
    assert.strictEqual(res.columns[0].label, 'Kode Produk');
    assert.strictEqual(res[0].col_1, 'LP-01');
    assert.strictEqual(res[0].kode_produk, 'LP-01');
    assert.strictEqual(res[0].product_code, 'LP-01');
    assert.strictEqual(res[0].col_2, '20 cm');
    assert.strictEqual(res[0].lebar, '20 cm');
  });
  console.log('  3. Legacy array parsing: PASSED');

  // Test 4: Dynamic schema { columns, rows } with custom columns
  console.log('\n[TEST 4] Testing dynamic schema with custom columns...');
  const customSchema = {
    columns: [
      { id: 'col_1', label: 'Diameter (mm)' },
      { id: 'col_2', label: 'Warna Segel' },
      { id: 'col_3', label: 'Tipe Kunci' }
    ],
    rows: [
      { col_1: '28 mm', col_2: 'Merah', col_3: 'Tamper Evident' },
      { col_1: '32 mm', col_2: 'Biru', col_3: 'Child Resistant' }
    ]
  };

  const normCustom = normalizeSizeTable(customSchema);
  assert.strictEqual(normCustom.columns.length, 3);
  assert.strictEqual(normCustom.columns[0].label, 'Diameter (mm)');
  assert.strictEqual(normCustom.length, 2);
  assert.strictEqual(normCustom[0].col_1, '28 mm');
  assert.strictEqual(normCustom[0].col_2, 'Merah');
  assert.strictEqual(normCustom[1].col_3, 'Child Resistant');
  assert.deepStrictEqual(normCustom.toJSON(), customSchema);
  console.log('  4. Dynamic schema with custom columns: PASSED');

  // Test 5: serializeSizeTable safe capping and JSON string output
  console.log('\n[TEST 5] Testing serializeSizeTable output...');
  const serialized = serializeSizeTable(customSchema);
  assert.strictEqual(typeof serialized, 'string', 'Serialized must be a JSON string');
  const parsedBack = JSON.parse(serialized);
  assert.deepStrictEqual(parsedBack.columns, customSchema.columns);
  assert.deepStrictEqual(parsedBack.rows, customSchema.rows);
  console.log('  5. serializeSizeTable output: PASSED');

  // Test 6: Database CRUD with dynamic schema
  console.log('\n[TEST 6] Testing Database CRUD with dynamic schema...');
  const testSlug = 'test-dynamic-size-' + Date.now();
  const prodId = await productModel.create({
    name_id: 'Produk Kolom Dinamis',
    name_en: 'Dynamic Columns Product',
    slug: testSlug,
    category_id: 1,
    status: 'published',
    size_table: customSchema
  });
  assert.ok(prodId > 0, 'Product must be created with ID');

  const fetched = await productModel.findById(prodId);
  assert.ok(fetched, 'Product must be found');
  assert.ok(Array.isArray(fetched.size_table), 'fetched.size_table must be array');
  assert.strictEqual(fetched.size_table.length, 2, 'fetched.size_table length must be 2');
  assert.strictEqual(fetched.size_table.columns.length, 3, 'fetched.size_table.columns length must be 3');
  assert.strictEqual(fetched.size_table.columns[0].label, 'Diameter (mm)');
  assert.strictEqual(fetched.size_table[0].col_1, '28 mm');
  assert.strictEqual(fetched.size_table[1].col_2, 'Biru');

  // Update with modified dynamic columns
  const updatedSchema = {
    columns: [
      { id: 'col_1', label: 'Ukuran Utama' },
      { id: 'col_2', label: 'Kekuatan Beban' }
    ],
    rows: [
      { col_1: 'XL Super', col_2: '150 kg' }
    ]
  };
  await productModel.update(prodId, { size_table: updatedSchema });

  const fetchedUpdated = await productModel.findById(prodId);
  assert.strictEqual(fetchedUpdated.size_table.columns.length, 2);
  assert.strictEqual(fetchedUpdated.size_table.columns[0].label, 'Ukuran Utama');
  assert.strictEqual(fetchedUpdated.size_table[0].col_1, 'XL Super');
  assert.strictEqual(fetchedUpdated.size_table[0].col_2, '150 kg');

  // Clean up
  await productModel.delete(prodId);
  console.log('  6. Database CRUD with dynamic schema: PASSED');

  console.log('\n--- ALL TASK T-214 TESTS PASSED! ---');
  process.exit(0);
}

runT214Tests().catch(err => {
  console.error('FAILED T-214 TEST:', err);
  process.exit(1);
});
