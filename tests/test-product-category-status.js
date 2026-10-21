import assert from 'assert';
import productCategoryModel from '../models/productCategoryModel.js';
import { pool } from '../config/database.js';

async function runCategoryStatusTests() {
  console.log('=== STARTING PRODUCT CATEGORY STATUS TESTS ===');

  // 1. Create a test category
  const testCatId = await productCategoryModel.create({
    name_id: 'Kategori Test Status',
    name_en: 'Test Category Status',
    slug: 'kategori-test-status',
    description_id: 'Deskripsi uji coba status aktif nonaktif',
    description_en: 'Testing active inactive status',
    sort_order: 99,
    is_active: 1
  });
  console.log('1. Created category with ID:', testCatId);

  try {
    let cat = await productCategoryModel.findById(testCatId);
    assert.strictEqual(cat.is_active, 1, 'Newly created category must have is_active = 1');
    console.log('  1a. Initial is_active = 1: PASSED');

    // 2. Toggle active to 0
    const toggled1 = await productCategoryModel.toggleActive(testCatId);
    assert.strictEqual(toggled1.is_active, 0, 'toggleActive must toggle is_active to 0');
    cat = await productCategoryModel.findById(testCatId);
    assert.strictEqual(cat.is_active, 0, 'Database is_active must be 0');
    console.log('  2a. Toggled to is_active = 0: PASSED');

    // 3. Verify activeOnly filter excludes it
    const activeCats = await productCategoryModel.findAll({ activeOnly: true });
    assert.ok(!activeCats.some(c => c.id === testCatId), 'activeOnly filter must exclude inactive category');
    console.log('  3a. findAll({ activeOnly: true }) excludes inactive category: PASSED');

    // 4. Update via update() with is_active = 1
    const updated = await productCategoryModel.update(testCatId, {
      name_id: 'Kategori Test Status Updated',
      is_active: 1
    });
    assert.ok(updated, 'update() must succeed');
    cat = await productCategoryModel.findById(testCatId);
    assert.strictEqual(cat.is_active, 1, 'Database is_active must be 1 after update');
    console.log('  4a. update() persists is_active = 1: PASSED');

    // 5. Verify activeOnly filter now includes it
    const activeCats2 = await productCategoryModel.findAll({ activeOnly: true });
    assert.ok(activeCats2.some(c => c.id === testCatId), 'activeOnly filter must include reactivated category');
    console.log('  5a. findAll({ activeOnly: true }) includes active category: PASSED');

    // 6. Test getHomepageCategories() doesn't crash on image_url and returns 4 valid categories
    const homeCats = await productCategoryModel.getHomepageCategories();
    assert.strictEqual(homeCats.length, 4, 'getHomepageCategories must return exactly 4 categories');
    for (const hCat of homeCats) {
      assert.ok(hCat.id, 'Homepage category must have id');
      assert.ok(hCat.name_id, 'Homepage category must have name_id');
      assert.ok(hCat.slug, 'Homepage category must have slug');
      assert.ok(hCat.image_url, 'Homepage category must have image_url');
    }
    console.log('  6a. getHomepageCategories() returns 4 valid categories: PASSED');

    console.log('=== ALL PRODUCT CATEGORY STATUS TESTS PASSED! ===');
  } finally {
    await productCategoryModel.delete(testCatId);
    await pool.end();
  }
}

runCategoryStatusTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
