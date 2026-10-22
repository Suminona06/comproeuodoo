import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

function request(pathUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: pathUrl,
      method: options.method || 'GET',
      headers: {
        Host: '127.0.0.1:3000',
        ...(options.headers || {})
      }
    };
    const req = http.request(reqOptions, (res) => {
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

function calculateLuminance(r, g, b) {
  const linearize = (val) => {
    const c = val / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function calculateContrastRatio(rgb1, rgb2) {
  const lum1 = calculateLuminance(...rgb1);
  const lum2 = calculateLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

console.log('--- COMPREHENSIVE QA AUDIT: T-198 ACCESSIBILITY, CSP & SYSTEM REGRESSION ---');

async function runQAAudit() {
  let passed = 0;

  // 1. WCAG AA COLOR CONTRAST AUDIT (Formula & Token Validation)
  {
    console.log('\n[1/4] AUDITING WCAG AA COLOR CONTRAST...');
    const white = [255, 255, 255];
    const textMain = [15, 23, 42];     // #0f172a
    const textVariant = [100, 116, 139]; // #64748b
    const textPrimary = [0, 117, 90];    // #00755a
    const primaryDark = [0, 87, 63];     // #00573f
    const borderSlate = [124, 143, 166]; // #7c8fa6

    const ratioTextMain = calculateContrastRatio(textMain, white);
    assert(ratioTextMain >= 4.5, `text-main contrast ${ratioTextMain.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - Text Main (#0f172a on white): ${ratioTextMain.toFixed(2)}:1 (PASS >= 4.5:1)`);

    const ratioTextVariant = calculateContrastRatio(textVariant, white);
    assert(ratioTextVariant >= 4.5, `text-variant contrast ${ratioTextVariant.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - Text Variant / Cat Count (#64748b on white): ${ratioTextVariant.toFixed(2)}:1 (PASS >= 4.5:1)`);

    const ratioPrimary = calculateContrastRatio(textPrimary, white);
    assert(ratioPrimary >= 4.5, `primary text contrast ${ratioPrimary.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - Primary Text (#00755a on white): ${ratioPrimary.toFixed(2)}:1 (PASS >= 4.5:1)`);

    const ratioWhiteOnPrimary = calculateContrastRatio(white, textPrimary);
    assert(ratioWhiteOnPrimary >= 4.5, `white on primary ${ratioWhiteOnPrimary.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - White on Primary button (#ffffff on #00755a): ${ratioWhiteOnPrimary.toFixed(2)}:1 (PASS >= 4.5:1)`);

    const ratioWhiteOnDark = calculateContrastRatio(white, primaryDark);
    assert(ratioWhiteOnDark >= 4.5, `white on primary-dark ${ratioWhiteOnDark.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - White on Primary Dark button (#ffffff on #00573f): ${ratioWhiteOnDark.toFixed(2)}:1 (PASS >= 4.5:1)`);

    const ratioBorder = calculateContrastRatio(borderSlate, white);
    assert(ratioBorder >= 3.0, `button border outline contrast ${ratioBorder.toFixed(2)} must be >= 3.0:1`);
    console.log(`  - Button Border Outline (#7c8fa6 on white): ${ratioBorder.toFixed(2)}:1 (PASS >= 3.0:1)`);

    passed++;
  }

  // 2. CSP (CONTENT SECURITY POLICY) & SCRIPT HYGIENE AUDIT
  {
    console.log('\n[2/4] AUDITING CSP & SCRIPT HYGIENE (HELMET)...');
    const res = await request('/products');
    assert.strictEqual(res.statusCode, 200);

    const cspHeader = res.headers['content-security-policy'] || res.headers['content-security-policy-report-only'];
    assert(cspHeader, 'Response headers must include Content-Security-Policy');
    assert(cspHeader.includes("default-src 'self'"), 'CSP must define default-src self');
    assert(res.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options must be nosniff');
    console.log('  - Helmet CSP & security headers verified intact');

    // Verify ZERO inline event handlers in PLP content (onclick, onchange, onsubmit, onkeydown, onkeyup, etc.)
    const mainMatch = res.body.match(/<main[\s\S]*?<\/main>/i);
    const mainHtml = mainMatch ? mainMatch[0] : res.body;
    const inlineHandlerRegex = /\son[a-zA-Z]+\s*=\s*["'][^"']*["']/g;
    const inlineMatches = mainHtml.match(inlineHandlerRegex) || [];
    assert.strictEqual(inlineMatches.length, 0, `Found inline event handlers in PLP main content: ${inlineMatches.join(', ')}`);
    console.log('  - Zero inline event handlers (onclick, onchange, etc.) in PLP main content: PASS');

    // Verify NO inline <script> blocks without src attribute
    const inlineScriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
    const inlineScripts = [];
    let scriptMatch;
    while ((scriptMatch = inlineScriptRegex.exec(res.body)) !== null) {
      const content = scriptMatch[1].trim();
      if (content.length > 0 && !scriptMatch[0].includes('application/ld+json')) {
        inlineScripts.push(scriptMatch[0]);
      }
    }
    assert.strictEqual(inlineScripts.length, 0, `Found unallowed inline scripts: ${inlineScripts.join('\n')}`);
    console.log('  - Zero inline executable script tags (external defer only): PASS');

    passed++;
  }

  // 3. KEYBOARD NAVIGATION & FOCUS RING AUDIT
  {
    console.log('\n[3/4] AUDITING KEYBOARD NAVIGATION & FOCUS RINGS...');
    const cssPath = path.resolve('public/css/components.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert(css.includes('.plp-sidebar-link:focus-visible') || css.includes('.plp-sidebar-link:focus'), 'Sidebar links must have visible focus indicator');
    assert(css.includes('.plp-search-input:focus'), 'Search input must have visible focus indicator');
    assert(css.includes('.plp-sort-select:focus'), 'Sort select must have visible focus indicator');
    assert(css.includes('.plp-card-media:focus-visible') || css.includes('.plp-card-media:focus'), 'Card media must have visible focus indicator');
    assert(css.includes('.plp-card-btn:focus-visible'), 'Card button must have visible focus indicator');
    assert(css.includes('.plp-more-btn:focus-visible'), 'Load more button must have visible focus indicator');
    assert(css.includes('.plp-drawer-trigger:focus-visible'), 'Drawer trigger button must have visible focus indicator');
    assert(css.includes('.plp-drawer-close:focus-visible') || css.includes('.plp-drawer-close:hover'), 'Drawer close button must have focus style');

    // Check accessible live region
    const res = await request('/products');
    assert(res.body.includes('id="plp-live-region"'), 'DOM must contain live region element');
    assert(res.body.includes('aria-live="polite"'), 'Live region must have aria-live="polite"');
    assert(res.body.includes('role="status"'), 'Live region must have role="status"');
    console.log('  - Focus rings (:focus-visible) and aria-live status regions verified: PASS');

    passed++;
  }

  // 4. FULL SYSTEM REGRESSION TESTING
  {
    console.log('\n[4/4] RUNNING SYSTEM-WIDE REGRESSION AUDIT...');

    // A. Homepage (/)
    const homeRes = await request('/');
    assert.strictEqual(homeRes.statusCode, 200, 'Homepage must return 200');
    assert(homeRes.body.includes('hcat-grid') || homeRes.body.includes('hcat-panel'), 'Homepage category section must be intact');
    assert(homeRes.body.includes('/products?category='), 'Homepage must link to /products?category=<slug>');
    assert(!homeRes.body.includes('plp-layout'), 'Homepage must NOT be polluted with plp-* layout classes');
    console.log('  - Homepage (/) regression test: PASS');

    // B. Product Detail Page (/products/:slug)
    const detailRes = await request('/products/soft-loop-handle-shopping-bag');
    assert.strictEqual(detailRes.statusCode, 200, 'Product detail page must return 200');
    assert(detailRes.body.includes('Soft Loop Handle Shopping Bag'), 'Detail page must render product name');
    assert(detailRes.body.includes('Spesifikasi') || detailRes.body.includes('technical_specs'), 'Detail page must render specs section');
    console.log('  - Product detail (/products/:slug) regression test: PASS');

    // C. Admin CMS Route (/admin/products)
    const adminRes = await request('/admin/products');
    assert([200, 302].includes(adminRes.statusCode), 'Admin products route must respond safely (200 or 302 redirect)');
    console.log(`  - Admin products route responded with status ${adminRes.statusCode}: PASS`);

    // D. Catalog Listing & Mobile Drawer (/products)
    const plpRes = await request('/products');
    assert.strictEqual(plpRes.statusCode, 200);
    assert(plpRes.body.includes('plp-sidebar'), 'Catalog must include plp-sidebar');
    assert(plpRes.body.includes('plp-filter-drawer-open'), 'Catalog must include mobile filter drawer trigger');
    assert(plpRes.body.includes('plp-products-grid'), 'Catalog must include plp-products-grid');
    console.log('  - Catalog Listing (/products) regression test: PASS');

    // E. Fragment AJAX Endpoint
    const fragRes = await request('/products?format=fragment', {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    assert.strictEqual(fragRes.statusCode, 200);
    const fragData = JSON.parse(fragRes.body);
    assert.strictEqual(typeof fragData.totalProducts, 'number');
    console.log('  - Fragment AJAX endpoint regression test: PASS');

    passed++;
  }

  console.log(`\n========================================`);
  console.log(`QA AUDIT PASSED: ${passed} / 4 test modules successful.`);
  console.log('All T-198 accessibility, CSP, and regression checks PASSED 100%!');
  console.log(`========================================\n`);
}

runQAAudit().catch((err) => {
  console.error('\nQA Audit Failed:', err);
  process.exit(1);
});
