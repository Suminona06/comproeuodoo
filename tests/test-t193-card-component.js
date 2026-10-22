import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method: 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
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

async function run() {
  console.log('--- TEST SUITE: T-193 PLP CARD & TOKEN SYSTEM ---');

  // 1. Check CSS components.css
  const css = fs.readFileSync('public/css/components.css', 'utf8');
  assert(css.includes('.plp-layout'), 'Must define .plp-layout');
  assert(css.includes('.plp-sidebar'), 'Must define .plp-sidebar');
  assert(css.includes('.plp-main'), 'Must define .plp-main');
  assert(css.includes('.plp-toolbar'), 'Must define .plp-toolbar');
  assert(css.includes('.plp-grid'), 'Must define .plp-grid');
  assert(css.includes('.plp-card'), 'Must define .plp-card');
  assert(css.includes('.plp-card-media'), 'Must define .plp-card-media');
  assert(css.includes('.plp-card-img'), 'Must define .plp-card-img');
  assert(css.includes('.plp-card-line'), 'Must define .plp-card-line (garis panjang horizontal)');
  assert(css.includes('.plp-card-title'), 'Must define .plp-card-title');
  assert(css.includes('aspect-ratio: 9 / 10'), 'Media aspect ratio must be 9 / 10 (matching reference)');
  assert(css.includes('object-fit: cover'), 'Image object-fit must be cover');
  assert(css.includes('text-transform: uppercase'), 'Card title and button must have uppercase');
  assert(css.includes('height: 26px'), 'Card button height must be 26px compact');
  assert(css.includes('font-size: 9px'), 'Card title font size must be 9px');
  console.log('  [PASS] components.css contains complete .plp-* design tokens and rules');

  // 2. Check Homepage isolation: homepage must NOT be broken or changed to .plp
  const indexEjs = fs.readFileSync('views/public/index.ejs', 'utf8');
  assert(indexEjs.includes('.prod-header') || indexEjs.includes('class="prod-header'), 'Homepage must keep .prod-header');
  assert(indexEjs.includes('.prod-title') || indexEjs.includes('class="prod-title'), 'Homepage must keep .prod-title');
  assert(css.includes('.prod-header'), 'components.css must preserve .prod-header for homepage');
  console.log('  [PASS] Homepage isolation preserved: .prod-* remains intact');

  // 3. HTTP SSR check on /products
  const res = await request('/products');
  assert.strictEqual(res.statusCode, 200, 'Status must be 200');
  assert(res.body.includes('class="plp-grid"'), 'SSR must render plp-grid');
  assert(res.body.includes('class="plp-card"'), 'SSR must render plp-card');
  assert(res.body.includes('class="plp-card-media"'), 'SSR must render plp-card-media');
  assert(res.body.includes('class="plp-card-line"'), 'SSR must render plp-card-line');
  assert(res.body.includes('class="plp-card-img"'), 'SSR must render plp-card-img');
  assert(res.body.includes('class="plp-card-title"'), 'SSR must render plp-card-title');
  assert(res.body.includes('class="plp-card-btn"'), 'SSR must render plp-card-btn');
  assert(res.body.includes('Detail Produk') || res.body.includes('Product Details'), 'Button label must be Detail Produk');
  assert(!res.body.includes('plp-breadcrumb'), 'Breadcrumbs must be removed');
  
  // Strict compliance: Zero price displayed on card
  assert(!res.body.includes('$1190') && !res.body.includes('$1500') && !res.body.includes('Rp '), 'No price displayed');
  console.log('  [PASS] SSR /products renders .plp-card items with zero price');

  // 4. HTTP Fragment check on /products?format=fragment
  const fragRes = await request('/products?format=fragment');
  assert.strictEqual(fragRes.statusCode, 200);
  assert(fragRes.body.includes('class="plp-card"'), 'Fragment must render plp-card');
  assert(!fragRes.body.includes('<!DOCTYPE html>'), 'Fragment must be pure HTML snippet');
  console.log('  [PASS] Fragment endpoint renders identical .plp-card markup');

  console.log('\nAll T-193 tests PASSED successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
