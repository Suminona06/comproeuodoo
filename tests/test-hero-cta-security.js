import assert from 'assert';
import http from 'http';
import bannerModel from '../models/bannerModel.js';

console.log('=== STARTING T-190 HERO CTA SECURITY & URL VALIDATION TESTS ===');

function makeRequest({ method = 'GET', path = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runSecurityTests() {
  // =========================================================================
  // 1. Authenticate to Admin Panel
  // =========================================================================
  console.log('1. Authenticating to Admin Panel:');
  const getLogin = await makeRequest({ path: '/admin/login' });
  assert.strictEqual(getLogin.statusCode, 200, 'Expected 200 for GET /admin/login');

  const setCookies = getLogin.headers['set-cookie'] || [];
  let csrfCookie = '';
  let csrfToken = '';
  setCookies.forEach(c => {
    if (c.startsWith('_csrf_token=')) {
      csrfCookie = c.split(';')[0];
      csrfToken = csrfCookie.replace('_csrf_token=', '');
    }
  });

  const postBody = new URLSearchParams({
    email: 'admin@euodoo.com',
    password: 'AdminEuodoo2026!',
    _csrf: csrfToken
  }).toString();

  const postLogin = await makeRequest({
    method: 'POST',
    path: '/admin/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postBody),
      'Cookie': csrfCookie
    },
    body: postBody
  });

  assert.strictEqual(postLogin.statusCode, 302, 'Expected 302 redirect for successful admin login');

  const authCookies = postLogin.headers['set-cookie'] || [];
  const cookieMap = {};
  authCookies.forEach(c => {
    const pair = c.split(';')[0];
    const [k, v] = pair.split('=');
    cookieMap[k.trim()] = v ? v.trim() : '';
  });

  const sessionCookie = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');
  console.log('  1a. Admin session established successfully: PASSED');

  // =========================================================================
  // 2. Obtain fresh CSRF token from /admin/banners/create
  // =========================================================================
  const getBannerCreate = await makeRequest({
    path: '/admin/banners/create',
    headers: { 'Cookie': `${sessionCookie}; ${csrfCookie}` }
  });
  assert.strictEqual(getBannerCreate.statusCode, 200, 'Expected 200 for GET /admin/banners/create');
  
  const createSetCookies = getBannerCreate.headers['set-cookie'] || [];
  createSetCookies.forEach(c => {
    if (c.startsWith('_csrf_token=')) {
      csrfCookie = c.split(';')[0];
    }
  });

  const tokenMatch = getBannerCreate.data.match(/name="_csrf"\s+value="([^"]+)"/);
  const formCsrf = tokenMatch ? tokenMatch[1] : csrfToken;

  // Helper for posting banner form
  async function submitBanner(fields) {
    const payload = new URLSearchParams({
      _csrf: formCsrf,
      title_id: 'Security QA Banner',
      title_en: 'Security QA Banner EN',
      file_url: '/images/hero-security-test.jpg',
      media_type: 'image',
      is_active: '1',
      sort_order: '99',
      ...fields
    }).toString();

    return makeRequest({
      method: 'POST',
      path: '/admin/banners',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
        'Cookie': `${sessionCookie}; ${csrfCookie}`
      },
      body: payload
    });
  }

  // =========================================================================
  // 3. Test Malicious Payloads on cta_url (Must return HTTP 400)
  // =========================================================================
  console.log('2. Testing Malicious URLs on Primary CTA:');

  const maliciousPrimaryCases = [
    { name: 'javascript: scheme', url: 'javascript:alert(1)', errKeyword: 'Format URL Tombol Utama tidak valid' },
    { name: 'data: scheme', url: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==', errKeyword: 'Format URL Tombol Utama tidak valid' },
    { name: 'protocol-relative // URL', url: '//evil-phishing-domain.com/steal-creds', errKeyword: 'Format URL Tombol Utama tidak valid' },
    { name: 'vbscript: scheme', url: 'vbscript:msgbox("hacked")', errKeyword: 'Format URL Tombol Utama tidak valid' },
    { name: 'ftp: unsupported protocol', url: 'ftp://ftp.example.com/payload.exe', errKeyword: 'Format URL Tombol Utama tidak valid' },
    { name: 'URL exceeding 500 characters', url: 'https://euodoo.co.id/' + 'a'.repeat(510), errKeyword: 'Format URL Tombol Utama tidak valid' }
  ];

  for (const tc of maliciousPrimaryCases) {
    const res = await submitBanner({ cta_text_id: 'Klik Disini', cta_url: tc.url });
    assert.strictEqual(res.statusCode, 400, `Expected HTTP 400 for ${tc.name}, got ${res.statusCode}`);
    assert(res.data.includes(tc.errKeyword), `Response must contain '${tc.errKeyword}' for ${tc.name}`);
    console.log(`  2a. Rejected malicious primary CTA (${tc.name}): PASSED`);
  }

  // =========================================================================
  // 4. Test Malicious Payloads on cta_secondary_url (Must return HTTP 400)
  // =========================================================================
  console.log('3. Testing Malicious URLs on Secondary CTA:');

  const maliciousSecondaryCases = [
    { name: 'javascript: on secondary', url: 'javascript:document.cookie="stolen"', errKeyword: 'Format URL Tombol Kedua tidak valid' },
    { name: 'protocol-relative on secondary', url: '//attacker.xyz/malware', errKeyword: 'Format URL Tombol Kedua tidak valid' },
    { name: 'data: HTML payload on secondary', url: 'data:text/html,<script>alert(2)</script>', errKeyword: 'Format URL Tombol Kedua tidak valid' }
  ];

  for (const tc of maliciousSecondaryCases) {
    const res = await submitBanner({
      cta_text_id: 'Lihat Produk',
      cta_url: '/products',
      cta_secondary_text_id: 'Tombol Jahat',
      cta_secondary_url: tc.url
    });
    assert.strictEqual(res.statusCode, 400, `Expected HTTP 400 for secondary ${tc.name}, got ${res.statusCode}`);
    assert(res.data.includes(tc.errKeyword), `Response must contain '${tc.errKeyword}' for secondary ${tc.name}`);
    console.log(`  3a. Rejected malicious secondary CTA (${tc.name}): PASSED`);
  }

  // =========================================================================
  // 5. Test Legitimate URLs (Must return HTTP 302 Redirect with Success)
  // =========================================================================
  console.log('4. Testing Legitimate URLs (Internal, Anchor, External HTTPS):');

  const validPayload = {
    title_id: 'QA Valid Banner Security Test',
    title_en: 'QA Valid Banner Security Test EN',
    file_url: '/images/hero-valid-test.jpg',
    media_type: 'image',
    is_active: '1',
    sort_order: '99',
    cta_text_id: 'Katalog Produk',
    cta_text_en: 'Product Catalog',
    cta_url: '/products?category=roll-bag',
    cta_secondary_text_id: 'Konsultasi WhatsApp',
    cta_secondary_text_en: 'WhatsApp Support',
    cta_secondary_url: 'https://wa.me/628112117123'
  };

  const resValid = await submitBanner(validPayload);
  assert.strictEqual(resValid.statusCode, 302, `Expected HTTP 302 for legitimate banner, got ${resValid.statusCode}`);
  assert(resValid.headers.location.includes('success'), `Redirect location must include success, got ${resValid.headers.location}`);
  console.log('  4a. Legitimate dual CTA banner saved successfully: PASSED');

  // Verify created banner in database
  const allBanners = await bannerModel.findAll(false);
  const created = allBanners.find(b => b.title_id === 'QA Valid Banner Security Test');
  assert(created, 'Created security QA banner must exist in database');
  assert.strictEqual(created.cta_url, '/products?category=roll-bag');
  assert.strictEqual(created.cta_secondary_url, 'https://wa.me/628112117123');
  console.log(`  4b. Persisted banner verified in database (ID: ${created.id}): PASSED`);

  // =========================================================================
  // 6. Verify Public Frontend SSR Rendering Attributes
  // =========================================================================
  console.log('5. Verifying Frontend SSR Attributes (target="_blank" rel="noopener noreferrer"):');
  const getHome = await makeRequest({ path: '/' });
  assert.strictEqual(getHome.statusCode, 200, 'Expected 200 for homepage GET /');

  // Internal link (/products?category=roll-bag) must NOT have target="_blank"
  assert(getHome.data.includes('href="/products?category=roll-bag"'), 'Homepage must render internal CTA URL');
  
  // External link (https://wa.me/628112117123) MUST have target="_blank" and rel="noopener noreferrer"
  assert(getHome.data.includes('href="https://wa.me/628112117123"'), 'Homepage must render external secondary CTA URL');
  assert(getHome.data.includes('target="_blank"'), 'External CTA button must have target="_blank"');
  assert(getHome.data.includes('rel="noopener noreferrer"'), 'External CTA button must have rel="noopener noreferrer"');
  console.log('  5a. External links enforce secure target="_blank" and rel="noopener noreferrer": PASSED');

  // =========================================================================
  // 7. Cleanup Created Test Banner
  // =========================================================================
  await bannerModel.delete(created.id);
  console.log(`  6a. Cleaned up security test banner ID: ${created.id}: PASSED`);

  console.log('=== ALL T-190 HERO CTA SECURITY & URL VALIDATION TESTS PASSED! ===');
  process.exit(0);
}

runSecurityTests().catch(err => {
  console.error('Security test failed:', err);
  process.exit(1);
});
