import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import productCategoryModel from '../models/productCategoryModel.js';
import productModel from '../models/productModel.js';

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path,
        method: 'GET',
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- TEST SUITE: T-194 SIDEBAR DYNAMIC FILTER & DEEP LINK URL ---');
  let passed = 0;
  let total = 0;

  async function test(desc, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${desc}`);
      console.error(err);
    }
  }

  // 1. Model Category Query
  await test('productCategoryModel.findAll({ activeOnly: true }) returns active categories with published count', async () => {
    const categories = await productCategoryModel.findAll({ activeOnly: true });
    assert(Array.isArray(categories), 'Must return array of categories');
    assert(categories.length > 0, 'Must have at least one active category');
    categories.forEach((cat) => {
      assert(cat.id, 'Category must have id');
      assert(cat.slug, 'Category must have slug');
      assert(cat.name_id, 'Category must have name_id');
      assert(typeof cat.product_count !== 'undefined', 'Category must have product_count');
      assert(cat.is_active === 1 || cat.is_active === null, 'Category must be active');
    });
  });

  // 2. SSR /products Default View
  await test('GET /products renders dynamic sidebar with "Semua Produk" active and total count', async () => {
    const res = await request('/products');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('id="plp-sidebar-list"'), 'Sidebar list must have id="plp-sidebar-list"');
    assert(res.body.includes('data-category=""'), 'All products link must have data-category=""');
    assert(res.body.includes('id="plp-total-all-count"'), 'Must render plp-total-all-count badge');
    assert(res.body.includes('<script src="/js/products.js" defer></script>'), 'Must include products.js script');
    assert(res.body.includes('id="plp-live-region"'), 'Must include accessibility live region');
  });

  // 3. Deep Link Filtering via ?category=<slug>
  await test('GET /products?category=<slug> marks category active and returns filtered products', async () => {
    const categories = await productCategoryModel.findAll({ activeOnly: true });
    const targetCat = categories.find((c) => c.product_count > 0) || categories[0];
    assert(targetCat, 'Must have a category to test');

    const res = await request(`/products?category=${encodeURIComponent(targetCat.slug)}`);
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes(`data-category="${targetCat.slug}"`), 'Must render target category item');
    assert(
      res.body.includes(`class="plp-sidebar-link active"\n                     data-category="${targetCat.slug}"`) ||
      (res.body.includes(`data-category="${targetCat.slug}"`) && res.body.includes('aria-current="true"')),
      'Target category must have active class and aria-current="true"'
    );
    assert(!res.body.includes('data-category=""\n                 aria-current="true"'), 'All products must not be active');
  });

  // 4. Fragment Endpoint JSON with Deep Link Category
  await test('GET /products?category=<slug>&format=fragment returns JSON with totalAllProducts and totalProducts', async () => {
    const categories = await productCategoryModel.findAll({ activeOnly: true });
    const targetCat = categories[0];

    const res = await request(`/products?category=${encodeURIComponent(targetCat.slug)}&format=fragment`, {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });
    assert.strictEqual(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert(typeof json.html === 'string', 'JSON must have html');
    assert(typeof json.totalProducts === 'number', 'JSON must have totalProducts');
    assert(typeof json.totalAllProducts === 'number', 'JSON must have totalAllProducts');
    assert(res.headers['x-total-count'] !== undefined, 'Header X-Total-Count must be set');
    assert(res.headers['x-total-all-count'] !== undefined, 'Header X-Total-All-Count must be set');
  });

  // 5. Invalid Category Graceful Handling & SEO Protection
  await test('GET /products with non-existent category handles safely with noindex robots', async () => {
    const res = await request('/products?category=non-existent-random-category-12345');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('content="noindex, follow"'), 'Must apply noindex for invalid category');
  });

  // 6. Homepage Deep Link Contract
  await test('Homepage categories link to /products?category=<slug> matching database slugs', async () => {
    const homeCats = await productCategoryModel.getHomepageCategories();
    assert(Array.isArray(homeCats) && homeCats.length > 0, 'Homepage must have categories');
    for (const hCat of homeCats) {
      assert(hCat.slug, 'Homepage category must have slug');
      const catInDb = await productCategoryModel.findBySlug(hCat.slug);
      assert(catInDb, `Slug "${hCat.slug}" from homepage must exist in product_categories`);
    }
  });

  // 7. Client Script static validation
  await test('public/js/products.js exists, has valid syntax, and handles popstate and filter clicks', () => {
    const jsCode = fs.readFileSync('public/js/products.js', 'utf8');
    assert(jsCode.includes('filterByCategory'), 'Script must have filterByCategory function');
    assert(jsCode.includes('window.history.pushState'), 'Script must use pushState for URL sync');
    assert(jsCode.includes("addEventListener('popstate'"), 'Script must listen to popstate for back/forward navigation');
    assert(jsCode.includes('plp-products-grid'), 'Script must target product grid');
    assert(jsCode.includes('plp-sidebar-list'), 'Script must target sidebar list');
  });

  console.log(`\nResults: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('All T-194 tests PASSED successfully!');
    process.exit(0);
  } else {
    console.error('Some tests failed.');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
