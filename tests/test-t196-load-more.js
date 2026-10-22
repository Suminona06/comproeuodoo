import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

function get(pathUrl, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: pathUrl,
      method: 'GET',
      headers: {
        Host: '127.0.0.1:3000',
        ...headers
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

console.log('--- TEST SUITE: T-196 PROGRESSIVE ENHANCEMENT LOAD MORE ---');

async function runTests() {
  let passed = 0;

  // Test 1: SSR /products with <= 9 products hides load more wrapper
  {
    const res = await get('/products');
    assert.strictEqual(res.statusCode, 200, 'GET /products should return 200');
    assert(res.body.includes('id="plp-more-wrap"'), 'products.ejs should render #plp-more-wrap container');
    assert(res.body.includes('id="plp-load-more-btn"'), 'products.ejs should render #plp-load-more-btn element');
    assert(res.body.includes('style="display: none;"'), '#plp-more-wrap should be hidden when total products <= 9');
    console.log('  [PASS] SSR hides load more button when total products <= 9');
    passed++;
  }

  // Test 2: Semantic fallback link contains valid href with page=2
  {
    const res = await get('/products');
    assert(res.body.includes('href="/products?page=2'), 'Load more button should provide semantic fallback href with page=2');
    assert(res.body.includes('role="button"'), 'Load more button should have role="button"');
    console.log('  [PASS] Load more button provides valid progressive enhancement fallback link');
    passed++;
  }

  // Test 3: Fragment JSON endpoint delivers structured data for load more AJAX append
  {
    const res = await get('/products?page=1&format=fragment', {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });
    assert.strictEqual(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.strictEqual(typeof data.html, 'string', 'Response should contain HTML fragment string');
    assert.strictEqual(typeof data.hasMore, 'boolean', 'Response should contain hasMore boolean');
    assert.strictEqual(typeof data.page, 'number', 'Response should contain page number');
    assert.strictEqual(typeof data.totalProducts, 'number', 'Response should contain totalProducts count');
    console.log('  [PASS] Fragment endpoint supports JSON payload for AJAX load more requests');
    passed++;
  }

  // Test 4: CSS contains .plp-more-wrap, .plp-more-btn, loading state, and focus visible
  {
    const cssPath = path.resolve('public/css/components.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    assert(css.includes('.plp-more-wrap'), 'components.css should define .plp-more-wrap');
    assert(css.includes('.plp-more-btn'), 'components.css should define .plp-more-btn');
    assert(css.includes('.plp-more-btn:focus-visible'), 'components.css should define .plp-more-btn:focus-visible');
    assert(css.includes('.plp-more-btn.is-loading'), 'components.css should define .plp-more-btn.is-loading state');
    console.log('  [PASS] components.css contains complete load more styles, focus rings, and loading state');
    passed++;
  }

  // Test 5: CSS implements smooth entrance animation with prefers-reduced-motion
  {
    const cssPath = path.resolve('public/css/components.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    assert(css.includes('@keyframes plpCardFadeIn'), 'components.css should include @keyframes plpCardFadeIn');
    assert(css.includes('.plp-card-entering'), 'components.css should include .plp-card-entering class');
    assert(css.includes('translateY(12px)'), 'Animation should use translateY(12px) entrance transform');
    assert(css.includes('prefers-reduced-motion: reduce'), 'Animation must respect prefers-reduced-motion');
    console.log('  [PASS] Smooth entrance animation is implemented and respects prefers-reduced-motion');
    passed++;
  }

  // Test 6: public/js/products.js handles load more clicks, DOM append, focus, and live region
  {
    const jsPath = path.resolve('public/js/products.js');
    const js = fs.readFileSync(jsPath, 'utf8');
    assert(js.includes('loadMoreProducts'), 'products.js should declare loadMoreProducts function');
    assert(js.includes('plp-card-entering'), 'products.js should apply plp-card-entering class to appended cards');
    assert(js.includes("grid.appendChild(card)"), 'products.js should append new cards to grid');
    assert(js.includes("firstNewCard.querySelector('.plp-card-media')"), 'products.js should move focus to first incoming card');
    assert(js.includes("tabindex"), 'products.js should set tabindex for programmatic focus');
    assert(js.includes("liveRegion"), 'products.js should announce load more completion to liveRegion');
    console.log('  [PASS] products.js coordinates AJAX fetch, card append, keyboard focus, and accessibility announcement');
    passed++;
  }

  // Test 7: public/js/products.js resets page to 1 when filtering, searching, or sorting
  {
    const jsPath = path.resolve('public/js/products.js');
    const js = fs.readFileSync(jsPath, 'utf8');
    assert(js.includes('currentPage = 1'), 'applyFilters should reset currentPage to 1');
    assert(js.includes("nextUrl.searchParams.delete('page')"), 'applyFilters should remove page query parameter');
    assert(js.includes('data.totalProducts > 9'), 'updateLoadMoreState should require totalProducts > 9');
    console.log('  [PASS] products.js properly resets pagination and respects totalProducts > 9 condition');
    passed++;
  }

  console.log(`\nResults: ${passed} / 7 tests passed.`);
  console.log('All T-196 load more tests PASSED successfully!\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
