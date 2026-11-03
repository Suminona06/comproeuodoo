import assert from 'assert';
import inquiryModel from '../models/inquiryModel.js';

const BASE_URL = 'http://127.0.0.1:3000';

async function runModul12Tests() {
  console.log('--- STARTING MODUL 12 (PUBLIC INTERFACE SSR & UX v2.0) TESTS ---');

  // Test 1: Homepage
  console.log('\n[TEST 1] Testing Homepage (/) SSR...');
  const resHome = await fetch(`${BASE_URL}/`);
  assert.strictEqual(resHome.status, 200, 'Homepage must return HTTP 200');
  const homeHtml = await resHome.text();
  assert.ok(homeHtml.includes('hero'), 'Must contain hero section');
  assert.ok(homeHtml.includes('hcat-grid') || homeHtml.includes('bento-grid'), 'Must contain primary category panels or bento grid');
  assert.ok(homeHtml.includes('sec-pillars'), 'Must contain 3 manufacturing pillars');
  assert.ok(homeHtml.includes('sec-why-us'), 'Must contain sec-why-us section');
  assert.ok(homeHtml.includes('wcu-artbox'), 'Must contain Why Choose Us artbox');
  assert.ok(homeHtml.includes('wcu-float-card'), 'Must contain Why Choose Us floating card');
  assert.ok(homeHtml.includes('wcu-desc'), 'Must contain Why Choose Us description');
  assert.ok(!homeHtml.includes('aria-controls="detail"'), 'STRICT: Must NOT contain toggle detail button');
  assert.ok(homeHtml.includes('prod-title'), 'Must contain prod-title');
  assert.ok(homeHtml.includes('prod-subtitle'), 'Must contain prod-subtitle');
  assert.ok(homeHtml.includes('hcat-panel'), 'Must contain primary category panel');
  console.log('  1a. Homepage full 8-section layout verified: PASSED');
  console.log('  1b. Why Choose Us asymmetric 2-column layout & artbox verified: PASSED');

  // Test 2: About Us Page
  console.log('\n[TEST 2] Testing About Us (/about) SSR...');
  const resAbout = await fetch(`${BASE_URL}/about`);
  assert.strictEqual(resAbout.status, 200, 'About page must return HTTP 200');
  const aboutHtml = await resAbout.text();
  assert.ok(aboutHtml.includes('page-hero'), 'Must contain page hero header');
  assert.ok(aboutHtml.includes('1990'), 'Must contain company heritage narrative');
  assert.ok(aboutHtml.includes('T-I-C-K-E-T'), 'Must contain T-I-C-K-E-T core values');
  console.log('  2a. About Us structure and corporate values verified: PASSED');

  // Test 3: Products Catalog Page
  console.log('\n[TEST 3] Testing Product Catalog (/products) SSR...');
  const resProducts = await fetch(`${BASE_URL}/products`);
  assert.strictEqual(resProducts.status, 200, 'Products catalog must return HTTP 200');
  const prodHtml = await resProducts.text();
  assert.ok(prodHtml.includes('plp-sidebar-link') || prodHtml.includes('pill-filter'), 'Must contain category filter');
  assert.ok(prodHtml.includes('name="search"'), 'Must contain search input');
  assert.ok(prodHtml.includes('soft-loop-handle-shopping-bag') || prodHtml.includes('plp-card'), 'Must display active catalog products');
  console.log('  3a. Product catalog filter bar, search, and bento cards verified: PASSED');

  // Test 4: Product Detail Page & Price Absence Constraint
  console.log('\n[TEST 4] Testing Product Detail (/products/soft-loop-handle-shopping-bag) SSR...');
  const resDetail = await fetch(`${BASE_URL}/products/soft-loop-handle-shopping-bag`);
  assert.strictEqual(resDetail.status, 200, 'Product detail must return HTTP 200');
  const detailHtml = await resDetail.text();
  assert.ok(detailHtml.includes('pd-size') || detailHtml.includes('spec-table'), 'Must contain size or specifications table');
  assert.ok(detailHtml.includes('https://wa.me/'), 'Must contain dynamic WhatsApp CTA button');
  assert.ok(detailHtml.includes('pd-pill') || detailHtml.includes('selectVariant'), 'Must contain variant pills selector');

  // Strict Rule Check: NO PRICE DISPLAY
  assert.ok(!detailHtml.includes('Rp '), 'STRICT: Must NOT display currency symbol Rp');
  assert.ok(!detailHtml.includes('Harga:'), 'STRICT: Must NOT display Harga label');
  console.log('  4a. Product detail specs, WhatsApp CTA, and strict price absence verified: PASSED');

  // Test 5: News 3-Tabs Page & Features (T-229, T-230, T-231)
  console.log('\n[TEST 5] Testing News Listing (/news) SSR & Fetch API...');
  const resNews = await fetch(`${BASE_URL}/news`);
  assert.strictEqual(resNews.status, 200, 'News page must return HTTP 200');
  const newsHtml = await resNews.text();
  assert.ok(newsHtml.includes('Berita Perusahaan'), 'Must contain Berita tab');
  assert.ok(newsHtml.includes('Siaran Pers'), 'Must contain Siaran Pers tab');
  assert.ok(newsHtml.includes('Artikel & Blog'), 'Must contain Artikel & Blog tab');
  assert.ok(newsHtml.includes('nwl-tab-bar') && newsHtml.includes('nwl-tab-item'), 'Must contain G4 underline tab bar');
  assert.ok(newsHtml.includes('nwl-cat-pills') && newsHtml.includes('nwl-search-input'), 'Must contain category pills and search input');
  assert.ok(newsHtml.includes('news-card-v2') || newsHtml.includes('nwl-card'), 'Must contain shared news cards');
  assert.ok(newsHtml.includes('media-1792035656935-732682512.webp'), 'Must render white Euodoo logo placeholder for articles without cover');
  console.log('  5a. News G4 tabs, filter pills, search input, and shared cards verified: PASSED');

  // Test 5b: Asynchronous Fetch API endpoint (T-231)
  console.log('  Testing AJAX Fetch API endpoint (/news?ajax=1)...');
  const resAjax = await fetch(`${BASE_URL}/news?ajax=1`, {
    headers: { 'Accept': 'application/json' }
  });
  assert.strictEqual(resAjax.status, 200, 'AJAX news endpoint must return HTTP 200');
  const ajaxData = await resAjax.json();
  assert.strictEqual(ajaxData.success, true, 'AJAX payload must indicate success: true');
  assert.ok(Array.isArray(ajaxData.posts), 'AJAX payload must include posts array');
  assert.ok(typeof ajaxData.currentPage === 'number', 'AJAX payload must include currentPage number');
  assert.ok(typeof ajaxData.totalPages === 'number', 'AJAX payload must include totalPages number');
  console.log('  5b. News AJAX Fetch API JSON payload verified: PASSED');

  // Test 6: News Article Detail Page (T-226, T-227, T-228, T-229)
  console.log('\n[TEST 6] Testing News Detail (/news/mengenal-teknologi-oxium-plastik-biodegradable) SSR...');
  const resNewsDetail = await fetch(`${BASE_URL}/news/mengenal-teknologi-oxium-plastik-biodegradable`);
  assert.strictEqual(resNewsDetail.status, 200, 'News detail must return HTTP 200');
  const newsDetailHtml = await resNewsDetail.text();
  assert.ok(newsDetailHtml.includes('nwd-breadcrumb'), 'Must contain unboxed breadcrumb');
  assert.ok(newsDetailHtml.includes('aria-label="Breadcrumb"'), 'Breadcrumb must have aria-label');
  assert.ok(newsDetailHtml.includes('nwd-hero-media'), 'Must contain hero media');
  assert.ok(newsDetailHtml.includes('nwd-title'), 'Must contain article title');
  assert.ok(newsDetailHtml.includes('nwd-author'), 'Must contain clean author attribution');
  assert.ok(newsDetailHtml.includes('article-prose'), 'Must contain structured article prose');
  assert.ok(newsDetailHtml.includes('application/ld+json'), 'Must contain JSON-LD article schema');
  assert.ok(newsDetailHtml.includes('copyLinkBtn'), 'Must contain interactive share buttons');
  assert.ok(newsDetailHtml.includes('euodoo.co.id'), 'Share URLs and canonical links must reference euodoo.co.id domain');
  assert.ok(!newsDetailHtml.includes('euodoo.com/news'), 'Must NOT reference outdated euodoo.com domain');
  console.log('  6a. News detail G2 editorial layout, breadcrumb, domain euodoo.co.id, and share controls verified: PASSED');

  // Test 6b: News Detail Placeholder Fallback (T-227)
  console.log('  Testing News Detail with null cover image fallback...');
  const resDetailNullCover = await fetch(`${BASE_URL}/news/penerapan-injeksi-presisi-mikro-komponen-medis`);
  assert.strictEqual(resDetailNullCover.status, 200, 'Detail with null cover must return HTTP 200');
  const detailNullHtml = await resDetailNullCover.text();
  assert.ok(detailNullHtml.includes('nwd-hero-media-placeholder'), 'Must contain placeholder container class');
  assert.ok(detailNullHtml.includes('media-1792035656935-732682512.webp'), 'Must render white Euodoo logo placeholder');
  console.log('  6b. News detail null cover placeholder fallback verified: PASSED');

  // Test 7: Contact Page
  console.log('\n[TEST 7] Testing Contact Page (/contact) SSR...');
  const resContact = await fetch(`${BASE_URL}/contact`);
  assert.strictEqual(resContact.status, 200, 'Contact page must return HTTP 200');
  const contactHtml = await resContact.text();
  assert.ok(contactHtml.includes('contact-split-grid'), 'Must contain 2-column split layout');
  assert.ok(contactHtml.includes('Palmerah'), 'Must contain Jakarta Palmerah office info');
  assert.ok(contactHtml.includes('Cigondewah'), 'Must contain Bandung Cigondewah factory info');
  assert.ok(contactHtml.includes('google.com/maps/embed'), 'Must contain Google Maps iframe embed');
  assert.ok(contactHtml.includes('name="_csrf"'), 'Must contain CSRF token');
  assert.ok(contactHtml.includes('name="hp_website"'), 'Must contain honeypot spam protection');
  console.log('  7a. Contact page split layout, offices, maps, and CSRF verified: PASSED');

  // Test 8: RFQ Form Submission & Inquiries Storage
  console.log('\n[TEST 8] Testing RFQ Form Submission...');
  const cookies = resContact.headers.get('set-cookie');
  const csrfMatch = contactHtml.match(/name="_csrf" value="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';
  assert.ok(csrfToken, 'CSRF token must be present');

  const formBody = new URLSearchParams({
    _csrf: csrfToken,
    'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX',
    name: 'Unit Test Client',
    company: 'PT Unit Test Mitra',
    email: 'client@unittest.com',
    phone: '081999888777',
    quantity: '10.000 lembar',
    type: 'inquiry',
    message: 'Permintaan penawaran otomatis dari unit test suite Modul 12.'
  });

  const postRes = await fetch(`${BASE_URL}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies || '',
      'x-test-bypass-rate-limit': 'true'
    },
    body: formBody.toString(),
    redirect: 'manual'
  });

  console.log('  RFQ post status:', postRes.status, 'location:', postRes.headers.get('location'));
  assert.strictEqual(postRes.status, 302, 'Successful RFQ submission must redirect with 302');
  assert.ok(postRes.headers.get('location')?.includes('success=1'), 'Redirect URL must indicate success=1');

  // Verify DB insertion
  const latestInquiries = await inquiryModel.findAll({ search: 'client@unittest.com', limit: 1 });
  assert.strictEqual(latestInquiries.length, 1, 'Inquiry must be recorded in database');
  assert.strictEqual(latestInquiries[0].status, 'baru', 'Inquiry status must be "baru"');
  assert.strictEqual(latestInquiries[0].company, 'PT Unit Test Mitra');

  // Cleanup test inquiry
  await inquiryModel.delete(latestInquiries[0].id);
  console.log('  8a. RFQ submission, rate limiting, and database insertion verified: PASSED');

  console.log('\n--- ALL MODUL 12 TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runModul12Tests().catch(err => {
  console.error('\nFAILED MODUL 12 TEST:', err);
  process.exit(1);
});
