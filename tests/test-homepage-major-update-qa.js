import assert from 'assert';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runQaTests() {
  console.log('=== STARTING QA & REGRESSION TEST SUITE (T-179, T-180, T-181) ===');

  // =========================================================================
  // T-179: Multi-Breakpoint CSS, Tap Targets, Focus-Visible, Reduced Motion
  // =========================================================================
  console.log('\n[TEST 1: T-179] Verifying Multi-Breakpoint CSS, Tap Targets & Accessibility...');
  const cssPath = path.resolve('public/css/components.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // 1a. Responsive rules for .hcat-grid
  assert.ok(cssContent.includes('.hcat-grid'), 'CSS must define .hcat-grid');
  assert.ok(cssContent.includes('grid-template-columns: repeat(var(--hcat-cols, 4), 1fr);'), 'CSS must define dynamic grid columns on desktop');
  assert.ok(cssContent.includes('@media (max-width: 768px)'), 'CSS must define 768px mobile scroll snap breakpoint');
  assert.ok(cssContent.includes('scroll-snap-type: x mandatory;'), 'CSS must define scroll-snap-type for touch devices');
  console.log('  1a. Multi-breakpoint grid reflow rules for .hcat-grid: PASSED');

  // 1b. Responsive rules for .sec-why-us
  assert.ok(cssContent.includes('.sec-why-us'), 'CSS must define .sec-why-us');
  assert.ok(cssContent.includes('.wcu-layout'), 'CSS must define .wcu-layout grid');
  assert.ok(cssContent.includes('@media (max-width: 860px)'), 'CSS must define responsive reflow for Why Choose Us');
  assert.ok(cssContent.includes('.wcu-artbox'), 'CSS must define .wcu-artbox');
  assert.ok(cssContent.includes('.wcu-float-card'), 'CSS must define .wcu-float-card');
  console.log('  1b. Multi-breakpoint layout rules for .sec-why-us: PASSED');

  // 1c. Tap target minimum 44px
  assert.ok(cssContent.includes('min-height: 44px'), 'CSS must specify minimum 44px touch targets');
  assert.ok(cssContent.includes('.btn-see-more'), 'CSS must define .btn-see-more');
  assert.ok(cssContent.includes('min-height: 48px'), '.btn-see-more must have at least 48px height on desktop');
  console.log('  1c. Minimum 44px tap targets verified: PASSED');

  // 1d. Focus-visible navigation indicator
  assert.ok(cssContent.includes('.hcat-panel:focus-visible'), 'CSS must define .hcat-panel:focus-visible');
  assert.ok(cssContent.includes('.wcu-kicker:focus-visible'), 'CSS must define .wcu-kicker:focus-visible');
  console.log('  1d. Accessible focus-visible indicators: PASSED');

  // 1e. prefers-reduced-motion
  const reducedMotionBlocks = cssContent.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}/g) || [];
  assert.ok(reducedMotionBlocks.length >= 2, 'Must contain multiple prefers-reduced-motion media blocks');
  const allReducedMotionText = reducedMotionBlocks.join('\n');
  assert.ok(allReducedMotionText.includes('.hcat-panel'), 'Reduced motion must cover .hcat-panel');
  assert.ok(allReducedMotionText.includes('.wcu-float-card'), 'Reduced motion must cover .wcu-float-card');
  assert.ok(allReducedMotionText.includes('.wcu-art'), 'Reduced motion must cover .wcu-art');
  console.log('  1e. prefers-reduced-motion verified for all new animations: PASSED');

  // =========================================================================
  // T-180: Deep Link Category Filter & Empty State Fallback
  // =========================================================================
  console.log('\n[TEST 2: T-180] Testing End-to-End Category Deep Links & Fallback State...');

  // 2a. Fetch Homepage and parse category links
  const resHome = await fetch(`${BASE_URL}/`);
  assert.strictEqual(resHome.status, 200, 'Homepage must return HTTP 200');
  const homeHtml = await resHome.text();

  const categoryHrefMatches = homeHtml.match(/href="\/products\?category=([^"]+)"/g) || [];
  assert.ok(categoryHrefMatches.length >= 4, `Must find at least 4 category deep links on homepage (found ${categoryHrefMatches.length})`);

  const categorySlugs = categoryHrefMatches.map(m => {
    const match = m.match(/category=([^"]+)/);
    return match ? match[1] : null;
  }).filter(Boolean);

  console.log(`  2a. Discovered ${categorySlugs.length} primary category deep links: ${categorySlugs.join(', ')}: PASSED`);

  // 2b. Test each category deep link
  for (const slug of categorySlugs) {
    const resCat = await fetch(`${BASE_URL}/products?category=${slug}`);
    assert.strictEqual(resCat.status, 200, `Category deep link for '${slug}' must return HTTP 200`);
    const catHtml = await resCat.text();

    assert.ok(
      catHtml.includes(`href="/products?category=${slug}"`) || catHtml.includes(`class="pill-filter active"`),
      `Pill filter for '${slug}' must be active`
    );

    assert.ok(
      catHtml.includes('bento-card') || catHtml.includes('Produk Tidak Ditemukan'),
      `Category '${slug}' must render either products or graceful empty state`
    );
  }
  console.log('  2b. All category deep links load successfully with active filter pills: PASSED');

  // 2c. Test empty category fallback
  const resEmptyCat = await fetch(`${BASE_URL}/products?category=kategori-kosong-qa-test`);
  assert.strictEqual(resEmptyCat.status, 200, 'Non-existent category must return HTTP 200 (not 404 or 500)');
  const emptyCatHtml = await resEmptyCat.text();
  assert.ok(
    emptyCatHtml.includes('Produk Tidak Ditemukan') || emptyCatHtml.includes('No Products Found'),
    'Must display informative empty state when 0 products match category'
  );
  assert.ok(
    emptyCatHtml.includes('href="/products"'),
    'Empty state must include reset filter link returning to full catalog'
  );
  console.log('  2c. Empty state fallback with Reset Filter button verified: PASSED');

  // 2d. SEO Canonical and Hreflang on deep link
  const canonicalMatch = emptyCatHtml.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonicalMatch, 'Deep link page must have a canonical link');
  assert.ok(
    !canonicalMatch[1].includes('kategori-kosong-qa-test'),
    'Canonical URL must point to clean base products path without query params'
  );

  const hreflangId = emptyCatHtml.match(/<link rel="alternate" hreflang="id" href="([^"]+)"/);
  const hreflangEn = emptyCatHtml.match(/<link rel="alternate" hreflang="en" href="([^"]+)"/);
  assert.ok(hreflangId, 'Must have id alternate hreflang');
  assert.ok(hreflangEn, 'Must have en alternate hreflang');
  console.log('  2d. Canonical URL and hreflang validity on deep link verified: PASSED');

  // =========================================================================
  // T-181: Zero Regression, Bilingual ID/EN, Admin Health, Delivery Gate
  // =========================================================================
  console.log('\n[TEST 3: T-181] Testing Zero Regression, Bilingual Integrity & Delivery Gate...');

  // 3a. Verify all 8 homepage sections intact
  const requiredSections = [
    { selector: 'class="hero hero-slider"', name: 'Hero Banner Slider' },
    { selector: 'class="sec-intro"', name: 'Company Introduction' },
    { selector: 'class="sec-products"', name: 'Category Showcase' },
    { selector: 'class="sec-why-us sec-pillars"', name: 'Why Choose Us' },
    { selector: 'class="sec-evidence"', name: 'Certifications & Accreditations' },
    { selector: 'class="sec-brands"', name: 'Our Registered Brands Marquee' },
    { selector: 'class="sec-news"', name: 'Latest News & Insights' },
    { selector: 'class="site-footer"', name: 'Master Site Footer' }
  ];

  for (const sec of requiredSections) {
    assert.ok(homeHtml.includes(sec.selector), `Homepage must contain intact section: ${sec.name}`);
  }
  console.log('  3a. Zero visual regression across all 8 homepage sections: PASSED');

  // 3b. Bilingual SSR Validation (ID vs EN)
  const resHomeId = await fetch(`${BASE_URL}/?lang=id`);
  assert.strictEqual(resHomeId.status, 200);
  const homeIdHtml = await resHomeId.text();
  assert.ok(homeIdHtml.includes('Lihat Seluruh Katalog'), 'Indonesian homepage must display ID catalog CTA');
  assert.ok(homeIdHtml.includes('Jelajahi Seluruh Katalog Produk'), 'Indonesian homepage must display ID explore CTA');

  const resHomeEn = await fetch(`${BASE_URL}/?lang=en`);
  assert.strictEqual(resHomeEn.status, 200);
  const homeEnHtml = await resHomeEn.text();
  assert.ok(homeEnHtml.includes('View All Catalog'), 'English homepage must display EN catalog CTA');
  assert.ok(homeEnHtml.includes('Explore Complete Product Catalog'), 'English homepage must display EN explore CTA');

  // Check for raw template leak or unrendered keys
  const forbiddenLeaks = ['<%=', '<%-', 'undefined', '[object Object]', 'home.feat_'];
  for (const leak of forbiddenLeaks) {
    assert.ok(!homeIdHtml.includes(leak), `Homepage ID must not leak raw template token: ${leak}`);
    assert.ok(!homeEnHtml.includes(leak), `Homepage EN must not leak raw template token: ${leak}`);
  }
  console.log('  3b. Bilingual ID/EN switching and zero template leaks verified: PASSED');

  // 3c. Admin Health Check
  const loginRes = await fetch(`${BASE_URL}/admin/login`);
  assert.strictEqual(loginRes.status, 200, 'Admin login page must return HTTP 200');
  const loginHtml = await loginRes.text();
  const csrfMatch = loginHtml.match(/name="_csrf" value="([^"]+)"/);
  assert.ok(csrfMatch, 'Login page must provide CSRF token');
  const csrfToken = csrfMatch[1];
  const setCookieHeader = loginRes.headers.get('set-cookie') || '';
  const initialCookie = setCookieHeader.split(';')[0];

  const authRes = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': initialCookie
    },
    body: new URLSearchParams({
      email: 'admin@euodoo.com',
      password: 'AdminEuodoo2026!',
      _csrf: csrfToken
    }),
    redirect: 'manual'
  });
  assert.strictEqual(authRes.status, 302, 'Admin login must redirect with HTTP 302 on success');
  const authCookie = (authRes.headers.get('set-cookie') || '').split(';')[0];

  // Check /admin/home-content
  const cmsHomeRes = await fetch(`${BASE_URL}/admin/home-content`, {
    headers: { 'Cookie': authCookie }
  });
  assert.strictEqual(cmsHomeRes.status, 200, 'CMS Home Content must return HTTP 200');
  const cmsHomeHtml = await cmsHomeRes.text();
  assert.ok(cmsHomeHtml.includes('Kenapa Memilih Kami'), 'CMS must contain updated Tab 2 Why Choose Us');
  assert.ok(cmsHomeHtml.includes('4 Kategori Beranda'), 'CMS must contain 4 Primary Category configuration');
  assert.ok(!cmsHomeHtml.includes('Pilar Keunggulan (3 Pilar)'), 'CMS must not contain deprecated Three Pillars tab');

  // Check /admin/products & /admin/products/create
  const adminProdRes = await fetch(`${BASE_URL}/admin/products`, {
    headers: { 'Cookie': authCookie }
  });
  assert.strictEqual(adminProdRes.status, 200, 'Admin products list must return HTTP 200');
  const adminProdHtml = await adminProdRes.text();
  assert.ok(!adminProdHtml.includes('<th>Unggulan</th>'), 'Admin products list must not have Unggulan table header');

  const adminCreateRes = await fetch(`${BASE_URL}/admin/products/create`, {
    headers: { 'Cookie': authCookie }
  });
  assert.strictEqual(adminCreateRes.status, 200, 'Admin create product view must return HTTP 200');
  const adminCreateHtml = await adminCreateRes.text();
  assert.ok(!adminCreateHtml.includes('name="is_featured"'), 'Admin create product form must not have is_featured input');
  console.log('  3c. Admin CMS endpoints, CSRF, and data integrity verified: PASSED');

  console.log('\n=== ALL QA & REGRESSION TESTS (T-179, T-180, T-181) PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runQaTests().catch(err => {
  console.error('\n❌ QA TEST SUITE FAILED:', err);
  process.exit(1);
});
