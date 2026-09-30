import assert from 'assert';
import { pool } from '../config/database.js';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting Modul 4 Public SSR & Localization Automated Tests...');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error('     Error:', err.message);
      failed++;
    }
  };

  // Helper to extract cookies from headers
  const getCookies = (res) => {
    const raw = res.headers.get('set-cookie');
    if (!raw) return {};
    const cookies = {};
    raw.split(/,(?=[^;]+=[^;]+)/).forEach(c => {
      const parts = c.split(';')[0].trim().split('=');
      if (parts.length >= 2) {
        cookies[parts[0]] = parts.slice(1).join('=');
      }
    });
    return cookies;
  };

  // Helper to format cookie string for requests
  const formatCookieHeader = (cookieObj) => {
    return Object.entries(cookieObj).map(([k, v]) => `${k}=${v}`).join('; ');
  };

  // Test 1: Language Switcher and Home Page localization
  await test('T-16 & T-18: Language switcher sets cookie and renders bilingual content', async () => {
    // ID Request
    const resId = await fetch(`${BASE_URL}/`, {
      headers: { 'Cookie': 'euodoo_lang=id' }
    });
    assert.strictEqual(resId.status, 200);
    const htmlId = await resId.text();
    assert.ok(htmlId.includes('Presisi Manufaktur') || htmlId.includes('PT Euodoo'));

    // EN Request
    const resEn = await fetch(`${BASE_URL}/`, {
      headers: { 'Cookie': 'euodoo_lang=en' }
    });
    assert.strictEqual(resEn.status, 200);
    const htmlEn = await resEn.text();
    assert.ok(htmlEn.includes('Precision') || htmlEn.includes('Manufacturing'));

    // Test /lang/en route redirect
    const resSwitch = await fetch(`${BASE_URL}/lang/en`, { redirect: 'manual' });
    assert.strictEqual(resSwitch.status, 302);
    const setCookie = resSwitch.headers.get('set-cookie');
    assert.ok(setCookie.includes('euodoo_lang=en'));
  });

  // Test 2: Product Catalog & Detail Page
  await test('T-19: Product catalog lists products and detail page displays specs', async () => {
    const resCat = await fetch(`${BASE_URL}/products`);
    assert.strictEqual(resCat.status, 200);
    const htmlCat = await resCat.text();
    assert.ok(htmlCat.includes('Katalog Produk') || htmlCat.includes('Product Catalog'));

    // Find active product slug
    const [prods] = await pool.query('SELECT slug FROM products WHERE is_active = 1 LIMIT 1');
    if (prods.length > 0) {
      const slug = prods[0].slug;
      const resDetail = await fetch(`${BASE_URL}/products/${slug}`);
      assert.strictEqual(resDetail.status, 200);
      const htmlDetail = await resDetail.text();
      assert.ok(htmlDetail.includes('Spesifikasi Teknis') || htmlDetail.includes('Technical Specifications'));
    }

    // 404 for invalid product slug
    const res404 = await fetch(`${BASE_URL}/products/non-existent-product-slug-xyz`);
    assert.strictEqual(res404.status, 404);
  });

  // Test 3: About Us & Capabilities Pages
  await test('T-20: About Us and Capabilities pages render with 200 OK', async () => {
    const resAbout = await fetch(`${BASE_URL}/about`);
    assert.strictEqual(resAbout.status, 200);
    const htmlAbout = await resAbout.text();
    assert.ok(htmlAbout.includes('Visi') || htmlAbout.includes('Vision'));

    const resCap = await fetch(`${BASE_URL}/capabilities`);
    assert.strictEqual(resCap.status, 200);
    const htmlCap = await resCap.text();
    assert.ok(htmlCap.includes('Kapabilitas') || htmlCap.includes('Capabilities'));
  });

  // Test 4: News Listing & Detail Page
  await test('T-20: News listing and detail render correctly, 404 for non-existent', async () => {
    const resNews = await fetch(`${BASE_URL}/news`);
    assert.strictEqual(resNews.status, 200);

    const [posts] = await pool.query('SELECT slug FROM posts WHERE status = "published" LIMIT 1');
    if (posts.length > 0) {
      const postSlug = posts[0].slug;
      const resPost = await fetch(`${BASE_URL}/news/${postSlug}`);
      assert.strictEqual(resPost.status, 200);
      const htmlPost = await resPost.text();
      assert.ok(htmlPost.includes(postSlug) || htmlPost.includes('Publikasi'));
    }

    const resPost404 = await fetch(`${BASE_URL}/news/non-existent-article-slug-xyz`);
    assert.strictEqual(resPost404.status, 404);
  });

  // Test 5: Contact Page & RFQ Form Submission
  await test('T-21: Contact RFQ submission creates lead and handles honeypot', async () => {
    // 1. Load contact page to get CSRF token and cookie
    const resContact = await fetch(`${BASE_URL}/contact`);
    assert.strictEqual(resContact.status, 200);
    const htmlContact = await resContact.text();

    const csrfMatch = htmlContact.match(/name="_csrf" value="([^"]+)"/);
    assert.ok(csrfMatch, 'CSRF token input must be present on /contact form');
    const csrfToken = csrfMatch[1];

    const cookies = getCookies(resContact);
    assert.ok(cookies['_csrf_token'], 'CSRF cookie must be set on /contact');

    // 2. Submit valid RFQ
    const testEmail = `prospect-${Date.now()}@testcompany.com`;
    const formParams = new URLSearchParams({
      _csrf: csrfToken,
      name: 'Budi Santoso',
      company: 'PT Mitra Sukses Industri',
      email: testEmail,
      phone: '081298765432',
      quantity: '50.000 unit/bulan',
      message: 'Permintaan penawaran cetak komponen presisi toleransi 0.02mm.'
    });

    const resSubmit = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': formatCookieHeader(cookies)
      },
      body: formParams.toString(),
      redirect: 'manual'
    });

    assert.strictEqual(resSubmit.status, 302, 'Successful form submission should redirect');
    assert.ok(resSubmit.headers.get('location').includes('success=1'), 'Redirect URL must contain success=1');

    // Verify lead was stored in database
    const [savedLeads] = await pool.query('SELECT * FROM leads WHERE email = ?', [testEmail]);
    assert.strictEqual(savedLeads.length, 1, 'Lead must be recorded in the database');
    assert.strictEqual(savedLeads[0].company, 'PT Mitra Sukses Industri');
    assert.strictEqual(savedLeads[0].status, 'baru');

    // 3. Test Honeypot spam submission (should redirect with success but NOT save to DB)
    const spamEmail = `spammer-${Date.now()}@bot.com`;
    const spamParams = new URLSearchParams({
      _csrf: csrfToken,
      hp_website: 'http://spam-link.ru',
      name: 'Spam Bot',
      email: spamEmail,
      phone: '0800000000',
      message: 'Buy cheap watches'
    });

    const resSpam = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': formatCookieHeader(cookies)
      },
      body: spamParams.toString(),
      redirect: 'manual'
    });

    assert.strictEqual(resSpam.status, 302);
    const [spamRows] = await pool.query('SELECT * FROM leads WHERE email = ?', [spamEmail]);
    assert.strictEqual(spamRows.length, 0, 'Spam honeypot submission must NOT be saved to database');
  });

  console.log(`\n========================================`);
  console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  await pool.end();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
