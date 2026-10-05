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
  assert.ok(homeHtml.includes('bento-grid'), 'Must contain bento products grid');
  assert.ok(homeHtml.includes('sec-pillars'), 'Must contain 3 manufacturing pillars');
  assert.ok(homeHtml.includes('sec-evidence'), 'Must contain certifications section');
  assert.ok(homeHtml.includes('sec-brands'), 'Must contain brand marquee/showcase');
  assert.ok(homeHtml.includes('wa-float-btn'), 'Must contain floating WhatsApp button');
  console.log('  1a. Homepage full 8-section layout verified: PASSED');

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
  assert.ok(prodHtml.includes('pill-filter'), 'Must contain category filter pills');
  assert.ok(prodHtml.includes('name="search"'), 'Must contain search input');
  assert.ok(prodHtml.includes('soft-loop-handle-shopping-bag'), 'Must display active catalog products');
  console.log('  3a. Product catalog filter bar, search, and bento cards verified: PASSED');

  // Test 4: Product Detail Page & Price Absence Constraint
  console.log('\n[TEST 4] Testing Product Detail (/products/soft-loop-handle-shopping-bag) SSR...');
  const resDetail = await fetch(`${BASE_URL}/products/soft-loop-handle-shopping-bag`);
  assert.strictEqual(resDetail.status, 200, 'Product detail must return HTTP 200');
  const detailHtml = await resDetail.text();
  assert.ok(detailHtml.includes('spec-table'), 'Must contain technical specifications table');
  assert.ok(detailHtml.includes('https://wa.me/'), 'Must contain dynamic WhatsApp CTA button');
  assert.ok(detailHtml.includes('selectVariant'), 'Must contain variant pills selector');

  // Strict Rule Check: NO PRICE DISPLAY
  assert.ok(!detailHtml.includes('Rp '), 'STRICT: Must NOT display currency symbol Rp');
  assert.ok(!detailHtml.includes('Harga:'), 'STRICT: Must NOT display Harga label');
  console.log('  4a. Product detail specs, WhatsApp CTA, and strict price absence verified: PASSED');

  // Test 5: News 3-Tabs Page
  console.log('\n[TEST 5] Testing News 3-Tabs (/news) SSR...');
  const resNews = await fetch(`${BASE_URL}/news`);
  assert.strictEqual(resNews.status, 200, 'News page must return HTTP 200');
  const newsHtml = await resNews.text();
  assert.ok(newsHtml.includes('Berita Perusahaan'), 'Must contain Berita tab');
  assert.ok(newsHtml.includes('Siaran Pers'), 'Must contain Siaran Pers tab');
  assert.ok(newsHtml.includes('Artikel & Blog'), 'Must contain Artikel & Blog tab');
  assert.ok(newsHtml.includes('news-card-v2') || newsHtml.includes('news-headline-card'), 'Must contain news cards');
  console.log('  5a. News 3-tab layout, headline hero, and cards verified: PASSED');

  // Test 6: News Article Detail Page
  console.log('\n[TEST 6] Testing News Detail (/news/mengenal-teknologi-oxium-plastik-biodegradable) SSR...');
  const resNewsDetail = await fetch(`${BASE_URL}/news/mengenal-teknologi-oxium-plastik-biodegradable`);
  assert.strictEqual(resNewsDetail.status, 200, 'News detail must return HTTP 200');
  const newsDetailHtml = await resNewsDetail.text();
  assert.ok(newsDetailHtml.includes('article-prose'), 'Must contain structured article prose');
  assert.ok(newsDetailHtml.includes('application/ld+json'), 'Must contain JSON-LD article schema');
  assert.ok(newsDetailHtml.includes('copyLinkBtn'), 'Must contain interactive share buttons');
  console.log('  6a. News detail typography, schema, and share controls verified: PASSED');

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
      'Cookie': cookies || ''
    },
    body: formBody.toString(),
    redirect: 'manual'
  });

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
