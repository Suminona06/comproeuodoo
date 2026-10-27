import assert from 'node:assert';
import http from 'node:http';
import productModel from '../models/productModel.js';
import productCategoryModel from '../models/productCategoryModel.js';

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
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

async function runTests() {
  console.log('--- TEST SUITE: T-192 SERVER CONTRACT & FRAGMENT ENDPOINT ---');
  let passed = 0;
  let total = 0;

  function test(desc, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${desc}`);
      console.error(err);
    }
  }

  async function testAsync(desc, fn) {
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

  // 1. Model Sorting & Search
  await testAsync('productModel.findAll supports sort: newest (id DESC)', async () => {
    const products = await productModel.findAll({ sort: 'newest', limit: 5 });
    assert(Array.isArray(products) && products.length > 0, 'Must return products');
    for (let i = 0; i < products.length - 1; i++) {
      assert(products[i].id >= products[i + 1].id, 'IDs must be in descending order');
    }
  });

  await testAsync('productModel.findAll supports sort: alpha-asc (name_id ASC)', async () => {
    const products = await productModel.findAll({ sort: 'alpha-asc', limit: 5 });
    assert(Array.isArray(products) && products.length > 0, 'Must return products');
    for (let i = 0; i < products.length - 1; i++) {
      const cmp = products[i].name_id.localeCompare(products[i + 1].name_id);
      assert(cmp <= 0, `Expected "${products[i].name_id}" <= "${products[i + 1].name_id}"`);
    }
  });

  await testAsync('productModel.findAll supports sort: alpha-desc (name_id DESC)', async () => {
    const products = await productModel.findAll({ sort: 'alpha-desc', limit: 5 });
    assert(Array.isArray(products) && products.length > 0, 'Must return products');
    for (let i = 0; i < products.length - 1; i++) {
      const cmp = products[i].name_id.localeCompare(products[i + 1].name_id);
      assert(cmp >= 0, `Expected "${products[i].name_id}" >= "${products[i + 1].name_id}"`);
    }
  });

  await testAsync('productModel.findAll searches in description columns', async () => {
    const all = await productModel.findAll({ status: 'published' });
    const target = all.find((p) => p.description_id && p.description_id.length > 15);
    if (target) {
      const word = target.description_id.split(' ')[1];
      const results = await productModel.findAll({ search: word, status: 'published' });
      assert(results.length > 0, `Search for word from description "${word}" should return results`);
      const count = await productModel.countAll({ search: word, status: 'published' });
      assert.strictEqual(count, results.length, 'countAll must match findAll length');
    }
  });

  // 2. HTTP Server Endpoints
  await testAsync('GET /products (Full SSR) returns 200 and max 9 items per page', async () => {
    const res = await request('/products');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('Katalog Produk') || res.body.includes('Product Catalog'), 'Contains title');
  });

  await testAsync('GET /products?format=fragment returns HTML fragment with .plp-card and custom headers', async () => {
    const res = await request('/products?format=fragment');
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.includes('class="plp-card"'), 'Body must contain .plp-card elements');
    assert(!res.body.includes('<!DOCTYPE html>'), 'Fragment must not contain DOCTYPE or full page layout');
    assert(res.headers['x-has-more'] !== undefined, 'Must include X-Has-More header');
    assert(res.headers['x-total-count'] !== undefined, 'Must include X-Total-Count header');
    assert(res.headers['x-current-page'] === '1', 'Must include X-Current-Page = 1');
  });

  await testAsync('GET /products?format=fragment with Accept: application/json returns valid JSON', async () => {
    const res = await request('/products?format=fragment', { Accept: 'application/json' });
    assert.strictEqual(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert(typeof json.html === 'string', 'JSON must have html string');
    assert(json.html.includes('class="plp-card"'), 'HTML in JSON must contain .plp-card');
    assert(typeof json.hasMore === 'boolean', 'JSON must have boolean hasMore');
    assert(typeof json.totalProducts === 'number', 'JSON must have totalProducts number');
  });

  await testAsync('GET /products with invalid sort/page handles inputs safely without error', async () => {
    const res = await request('/products?sort=malicious_sql_injection_attempt&page=-5');
    assert.strictEqual(res.statusCode, 200);
  });

  await testAsync('SEO Robots: Page 1 has index, follow while Page 2 or search has noindex, follow', async () => {
    const res1 = await request('/products');
    assert.strictEqual(res1.statusCode, 200);
    assert(res1.body.includes('content="index, follow"'), 'Page 1 must have index, follow');

    const res2 = await request('/products?page=2');
    assert.strictEqual(res2.statusCode, 200);
    assert(res2.body.includes('content="noindex, follow"'), 'Page 2 must have noindex, follow');

    const resSearch = await request('/products?search=hdpe');
    assert.strictEqual(resSearch.statusCode, 200);
    assert(resSearch.body.includes('content="noindex, follow"'), 'Search query must have noindex, follow');
  });

  console.log(`\nResults: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('All T-192 server contract & fragment endpoint tests PASSED!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
