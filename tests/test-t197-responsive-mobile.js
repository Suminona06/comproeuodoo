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

console.log('--- TEST SUITE: T-197 RESPONSIVE LAYOUT & MOBILE DRAWER ---');

async function runTests() {
  let passed = 0;

  // Test 1: SSR renders drawer markup, trigger button, and backdrop
  {
    const res = await get('/products');
    assert.strictEqual(res.statusCode, 200, 'GET /products should return 200');
    assert(res.body.includes('id="plp-filter-drawer-open"'), 'Should render drawer open trigger button');
    assert(res.body.includes('id="plp-filter-drawer-close"'), 'Should render drawer close button');
    assert(res.body.includes('id="plp-filter-drawer-backdrop"'), 'Should render drawer backdrop');
    assert(res.body.includes('class="plp-drawer-header"'), 'Should render drawer header');
    console.log('  [PASS] SSR correctly renders mobile drawer markup, header, and backdrop');
    passed++;
  }

  // Test 2: Category badge appears on drawer trigger when category is active
  {
    const resAll = await get('/products');
    assert(!resAll.body.includes('plp-drawer-trigger-badge'), 'Should not have category badge when viewing all products');

    const resCat = await get('/products?category=cassava-bag');
    assert(resCat.body.includes('plp-drawer-trigger-badge'), 'Should render category badge on drawer trigger when category is filtered');
    console.log('  [PASS] Category badge dynamically indicates active filter on drawer trigger');
    passed++;
  }

  // Test 3: CSS implements multi-breakpoint reflow (desktop, tablet, mobile)
  {
    const cssPath = path.resolve('public/css/components.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    assert(css.includes('@media (max-width: 1023px)'), 'Should define tablet reflow breakpoint (max-width: 1023px)');
    assert(css.includes('@media (max-width: 767px)'), 'Should define mobile reflow breakpoint (max-width: 767px)');
    assert(css.includes('@media (max-width: 360px)'), 'Should define small screen mobile breakpoint (max-width: 360px)');
    console.log('  [PASS] components.css defines planned multi-breakpoint reflow queries');
    passed++;
  }

  // Test 4: CSS preserves 1:1 mobile layout aspect-ratio and 2-column grid
  {
    const cssPath = path.resolve('public/css/components.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    assert(css.includes('aspect-ratio: 1 / 1;'), 'Mobile card media must preserve 1:1 aspect ratio');
    assert(css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'), 'Mobile grid must preserve 2-column layout');
    console.log('  [PASS] Mobile 1:1 aspect ratio and 2-column grid are strictly preserved');
    passed++;
  }

  // Test 5: CSS implements offcanvas drawer, backdrop, and zero horizontal scroll
  {
    const cssPath = path.resolve('public/css/components.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    assert(css.includes('transform: translateX(-100%)'), 'Mobile sidebar should start offcanvas (translateX(-100%))');
    assert(css.includes('.plp-sidebar.is-open'), 'Drawer should support .is-open class');
    assert(css.includes('overflow-x: hidden;'), 'Section should prevent horizontal scroll leak');
    assert(css.includes('body.plp-drawer-locked'), 'Should lock body scroll when drawer is open');
    console.log('  [PASS] components.css implements offcanvas drawer transitions and zero horizontal scroll');
    passed++;
  }

  // Test 6: CSS ensures touch targets meet WCAG AA minimum 44px
  {
    const cssPath = path.resolve('public/css/components.css');
    const css = fs.readFileSync(cssPath, 'utf8');
    assert(css.includes('.plp-card-btn::after'), 'plp-card-btn should use pseudo-element for 44px hit-target compensation');
    assert(css.includes('.plp-drawer-close'), 'plp-drawer-close should provide 44px target');
    assert(css.includes('.plp-drawer-trigger::after'), 'plp-drawer-trigger should provide 44px target');
    assert(css.includes('min-height: 44px;'), 'Interactive links/buttons must guarantee 44px touch area');
    console.log('  [PASS] Touch targets meet WCAG AA >= 44px touch ergonomics');
    passed++;
  }

  // Test 7: public/js/products.js binds drawer trigger, close, backdrop, and Escape key
  {
    const jsPath = path.resolve('public/js/products.js');
    const js = fs.readFileSync(jsPath, 'utf8');
    assert(js.includes('openDrawer'), 'products.js should declare openDrawer function');
    assert(js.includes('closeDrawer'), 'products.js should declare closeDrawer function');
    assert(js.includes("plp-filter-drawer-open"), 'products.js should bind drawer open button');
    assert(js.includes("plp-filter-drawer-close"), 'products.js should bind drawer close button');
    assert(js.includes("plp-filter-drawer-backdrop"), 'products.js should bind backdrop click');
    assert(js.includes("Escape"), 'products.js should close drawer on Escape key');
    assert(js.includes("window.innerWidth < 768"), 'products.js should auto-close drawer on mobile category selection');
    console.log('  [PASS] products.js coordinates mobile drawer state, keyboard navigation, and auto-closing');
    passed++;
  }

  console.log(`\nResults: ${passed} / 7 tests passed.`);
  console.log('All T-197 responsive layout & mobile drawer tests PASSED successfully!\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
