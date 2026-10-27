import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
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
  console.log('--- TEST SUITE: T-195 TOOLBAR SEARCH, SORT & ACCESSIBLE LIVE REGION ---');
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

  // 1. SSR Toolbar Form & Controls
  await test('GET /products renders debounced search form, clear button, and sort dropdown', async () => {
    const res = await request('/products');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('id="plp-search-form"'), 'Must render plp-search-form');
    assert(res.body.includes('id="plp-search-input"'), 'Must render plp-search-input');
    assert(res.body.includes('id="plp-search-clear"'), 'Must render plp-search-clear button');
    assert(res.body.includes('id="plp-sort-select"'), 'Must render plp-sort-select dropdown');
    assert(res.body.includes('value="newest"'), 'Must include newest option');
    assert(res.body.includes('value="alpha-asc"'), 'Must include alpha-asc option');
    assert(res.body.includes('value="alpha-desc"'), 'Must include alpha-desc option');
    assert(res.body.includes('value="catalog"'), 'Must include catalog option');
    assert(res.body.includes('id="plp-live-region"'), 'Must render plp-live-region');
  });

  // 2. Search Query Filtering & Robots Noindex
  await test('GET /products?search=<keyword> populates input value and filters products', async () => {
    const all = await productModel.findAll({ status: 'published' });
    const keyword = all[0].name_id.split(' ')[0].toLowerCase();

    const res = await request(`/products?search=${encodeURIComponent(keyword)}`);
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes(`value="${keyword}"`), 'Input must preserve search keyword value');
    assert(res.body.includes('content="noindex, follow"'), 'Search page must have noindex robots meta');
    assert(res.body.includes('class="plp-card"'), 'Must render filtered product cards');
  });

  // 3. Sorting Query Options
  await test('GET /products?sort=alpha-asc sets selected attribute on alpha-asc option', async () => {
    const res = await request('/products?sort=alpha-asc');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('value="alpha-asc" selected'), 'alpha-asc option must be selected');
  });

  await test('GET /products?sort=alpha-desc sets selected attribute on alpha-desc option', async () => {
    const res = await request('/products?sort=alpha-desc');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('value="alpha-desc" selected'), 'alpha-desc option must be selected');
  });

  // 4. Combined Category & Search Query
  await test('GET /products?category=<slug>&search=<q> preserves category hidden field in form', async () => {
    const res = await request('/products?category=cassava-bag&search=shopping');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('name="category" value="cassava-bag"'), 'Form must keep active category hidden input');
    assert(res.body.includes('value="shopping"'), 'Search input must keep query');
  });

  // 5. JSON Fragment with Search and Sort
  await test('GET /products?search=<q>&sort=<sort>&format=fragment returns valid JSON', async () => {
    const res = await request('/products?search=bag&sort=alpha-asc&format=fragment', {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });
    assert.strictEqual(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert(typeof json.html === 'string', 'JSON must contain html snippet');
    assert(typeof json.totalProducts === 'number', 'JSON must contain totalProducts');
  });

  // 6. Localization files
  await test('locales/id.json and locales/en.json contain toolbar search and sort keys', () => {
    const idJson = JSON.parse(fs.readFileSync('locales/id.json', 'utf8'));
    const enJson = JSON.parse(fs.readFileSync('locales/en.json', 'utf8'));
    assert(idJson.products.search_placeholder, 'id.json must have search_placeholder');
    assert(enJson.products.search_placeholder, 'en.json must have search_placeholder');
    assert(idJson.products.sort_label, 'id.json must have sort_label');
    assert(enJson.products.sort_label, 'en.json must have sort_label');
    assert(idJson.products.empty_title, 'id.json must have empty_title');
    assert(enJson.products.empty_title, 'en.json must have empty_title');
  });

  // 7. Client Script static checks
  await test('public/js/products.js implements debounce 350ms, abortController, and liveRegion announcements', () => {
    const js = fs.readFileSync('public/js/products.js', 'utf8');
    assert(js.includes('350'), 'Must implement 350ms debounce timer');
    assert(js.includes('AbortController'), 'Must use AbortController for cancelable requests');
    assert(js.includes('announceResults'), 'Must announce results to screen reader');
    assert(js.includes('sortSelect'), 'Must handle sortSelect changes');
    assert(js.includes('searchInput'), 'Must handle searchInput input events');
    assert(js.includes('searchClear'), 'Must handle searchClear button click');
  });

  console.log(`\nResults: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('All T-195 tests PASSED successfully!');
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
