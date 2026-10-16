/**
 * Test Suite: Kelompok D (QA & Regression Test: T-157)
 * Revisi Kontak & Footer v1
 */

import assert from 'assert';
import http from 'http';

const BASE_URL = 'http://localhost:3000';

function fetchUrl(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = http.request(url, reqOptions, (res) => {
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
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

console.log('--- STARTING TESTS: KELOMPOK D (T-157 QA & FULL REGRESSION) ---');

async function runRegressionSuite() {
  // 1. PUBLIC PAGES SMOKE & INTEGRITY CHECKS
  console.log('\n[CHECK 1] Public Pages & Navigation Status');
  const publicRoutes = [
    { path: '/', title: 'Beranda' },
    { path: '/about', title: 'Tentang Kami' },
    { path: '/products', title: 'Katalog Produk' },
    { path: '/capabilities', title: 'Kapabilitas Pabrik' },
    { path: '/news', title: 'Berita & Publikasi' },
    { path: '/contact', title: 'Kontak & RFQ' },
    { path: '/robots.txt', expectedStatus: 200 },
    { path: '/sitemap.xml', expectedStatus: 200 }
  ];

  for (const r of publicRoutes) {
    const res = await fetchUrl(r.path);
    const expected = r.expectedStatus || 200;
    assert.strictEqual(
      res.statusCode,
      expected,
      `FAIL: Route ${r.path} returned status ${res.statusCode}, expected ${expected}`
    );
    console.log(`  -> Route ${r.path.padEnd(16)} : ${res.statusCode} OK`);

    if (r.path !== '/robots.txt' && r.path !== '/sitemap.xml') {
      // Verify footer integrity on every public HTML page
      assert(
        res.body.includes('class="site-footer"'),
        `FAIL: Route ${r.path} missing footer container`
      );
      assert(
        res.body.includes('class="ft-phone-val"'),
        `FAIL: Route ${r.path} missing ft-phone-val white bold link styling in footer`
      );
      assert(
        res.body.includes('whatsapp') || res.body.includes('wa-float-btn'),
        `FAIL: Route ${r.path} missing floating WhatsApp button`
      );
    }
  }

  // 2. 404 CUSTOM PAGE CHECK
  console.log('\n[CHECK 2] Custom 404 Not Found Page');
  const res404 = await fetchUrl('/non-existent-page-qa-regression-test-404');
  assert.strictEqual(res404.statusCode, 404, 'FAIL: 404 route must return HTTP 404');
  assert(
    res404.body.includes('404') || res404.body.includes('Tidak Ditemukan'),
    'FAIL: Custom 404 view not rendered'
  );
  console.log('  -> Custom 404 page status & rendering: PASSED (404)');

  // 3. CONTACT PAGE DEEP AUDIT (.cf-*, NO WA CARD, CLEAN LABELS, HONEYPOT)
  console.log('\n[CHECK 3] Contact Page Visual Polish & Element Hierarchy');
  const contactRes = await fetchUrl('/contact');
  assert.strictEqual(contactRes.statusCode, 200, 'FAIL: /contact must return 200');

  // Verify .cf-* classes rendered
  assert(contactRes.body.includes('cf-section'), 'FAIL: cf-section missing');
  assert(contactRes.body.includes('cf-form-row'), 'FAIL: cf-form-row missing');
  assert(contactRes.body.includes('cf-office-card'), 'FAIL: cf-office-card missing');
  assert(contactRes.body.includes('cf-select'), 'FAIL: cf-select missing');
  assert(contactRes.body.includes('cf-btn-submit'), 'FAIL: cf-btn-submit missing');
  assert(contactRes.body.includes('cf-kicker'), 'FAIL: cf-kicker missing');

  // Verify WhatsApp card is NOT on contact page
  assert(
    !contactRes.body.includes('Konsultasi WhatsApp Langsung'),
    'FAIL: Contact page must not contain "Konsultasi WhatsApp Langsung" card'
  );
  assert(
    !contactRes.body.includes('wa-pulse'),
    'FAIL: Contact page must not contain wa-pulse classes'
  );

  // Verify dual location cards
  assert(contactRes.body.includes('Kantor Pusat'), 'FAIL: Jakarta card missing');
  assert(contactRes.body.includes('Pabrik Manufaktur'), 'FAIL: Bandung card missing');
  console.log('  -> Contact page layout, dual locations & form components: PASSED');

  // 4. BILINGUAL SWITCHER AUDIT (ID & EN)
  console.log('\n[CHECK 4] Bilingual Switcher & Localization Integrity');
  const enRes = await fetchUrl('/contact', {
    headers: {
      Cookie: 'euodoo_lang=en'
    }
  });
  assert.strictEqual(enRes.statusCode, 200, 'FAIL: EN contact page must return 200');
  assert(
    enRes.body.includes('Product of Interest') || enRes.body.includes('B2B RFQ FORM'),
    'FAIL: EN translations not rendered when cookie euodoo_lang=en'
  );
  assert(
    enRes.body.includes('Head Office (Jakarta)'),
    'FAIL: EN office name not rendered'
  );
  console.log('  -> Bilingual cookie switching & localization: PASSED');

  // 5. SERVER-SIDE FORM VALIDATION / CONTACT SUBMISSION
  console.log('\n[CHECK 5] Contact Form Server-Side Validation & Security Rejection');
  
  // 5.1 Invalid submit (missing required fields)
  const invalidRes = await fetchUrl('/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: 'name=&email=&phone=&message='
  });
  assert(
    invalidRes.statusCode === 400 || invalidRes.statusCode === 403,
    `FAIL: Empty submission should return 400 or 403 (CSRF), got ${invalidRes.statusCode}`
  );
  console.log(`  -> Invalid form rejection: PASSED (HTTP ${invalidRes.statusCode})`);

  // 6. ADMIN LOGIN PAGE SMOKE TEST
  console.log('\n[CHECK 6] Admin Portal Login Page');
  const adminLoginRes = await fetchUrl('/admin/login');
  assert.strictEqual(adminLoginRes.statusCode, 200, 'FAIL: /admin/login must return 200');
  assert(adminLoginRes.body.includes('password'), 'FAIL: /admin/login missing password field');
  console.log('  -> Admin login page availability: PASSED (HTTP 200)');

  console.log('\n🎉 ALL T-157 QA & REGRESSION CHECKS PASSED SUCCESSFULLY! 🎉\n');
}

runRegressionSuite().catch((err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err);
  process.exit(1);
});
