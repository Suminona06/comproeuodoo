import assert from 'assert';
import dotenv from 'dotenv';
import { query, execute, pool } from '../config/database.js';

dotenv.config();

const BASE_URL = 'http://127.0.0.1:3000';
let cookieJar = {};

async function request(path, options = {}) {
  const cookieHeader = Object.entries(cookieJar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

  const headers = { ...(options.headers || {}) };
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body,
    redirect: 'manual'
  });

  // Extract set-cookie
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  if (setCookies.length === 0) {
    const rawSetCookie = res.headers.get('set-cookie');
    if (rawSetCookie) setCookies.push(rawSetCookie);
  }

  for (const cookieStr of setCookies) {
    const parts = cookieStr.split(';')[0].split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      cookieJar[name] = val;
    }
  }

  const body = await res.text();
  return {
    status: res.status,
    headers: res.headers,
    body
  };
}

function buildMultipartFormData(fields, boundary) {
  let postData = '';
  for (const [key, val] of Object.entries(fields)) {
    postData += `--${boundary}\r\n`;
    postData += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    postData += `${val}\r\n`;
  }
  postData += `--${boundary}--\r\n`;
  return postData;
}

async function runTests() {
  console.log('--- STARTING REVISI ADMIN V1 TEST SUITE ---');

  try {
    // 1. Dapatkan CSRF Token & Login Admin
    console.log('\n[1] Login Admin Superadmin');
    const loginPage = await request('/admin/login');
    assert.strictEqual(loginPage.status, 200, 'Login page must return 200');
    const csrfToken = cookieJar['_csrf_token'];
    assert.ok(csrfToken, 'CSRF cookie must be set');

    const loginPayload = `email=admin%40euodoo.com&password=AdminEuodoo2026%21&_csrf=${encodeURIComponent(csrfToken)}`;
    const loginRes = await request('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: loginPayload
    });
    assert.strictEqual(loginRes.status, 302, 'Login should redirect to admin dashboard');
    console.log('  ✓ Admin logged in successfully');

    // 2. Test T-61 Negative Test: Multipart Form TANPA CSRF token harus 403
    console.log('\n[2] T-61 Negative Test: Multipart Form TANPA CSRF token harus 403');
    const boundary = '----WebKitFormBoundaryTest123456';
    const fakeMultipartData = buildMultipartFormData({
      name_id: 'Test Fail Product',
      name_en: 'Test Fail Product EN',
      category_id: '1'
    }, boundary);

    const failRes = await request('/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: fakeMultipartData
    });
    assert.strictEqual(failRes.status, 403, 'Must return 403 Forbidden without CSRF');
    assert.ok(failRes.body.includes('Sesi pengiriman formulir tidak valid') || failRes.body.includes('CSRF'), 'Must show CSRF error message');
    console.log('  ✓ CSRF protection verified: blocked unauthorized multipart submit with 403');

    // 3. Test T-61 Positive Test: Multipart Create Product DENGAN ?_csrf query token
    console.log('\n[3] T-61 Positive Test: Multipart Create Product DENGAN ?_csrf query token');
    const cats = await query('SELECT id FROM categories LIMIT 1');
    const categoryId = cats[0].id;

    const prodBoundary = '----WebKitFormBoundaryTest789012';
    const prodMultipartData = buildMultipartFormData({
      name_id: 'Produk Uji T-61 CSRF',
      name_en: 'Test Product T-61 CSRF',
      category_id: String(categoryId),
      description_id: 'Deskripsi uji CSRF tanpa 403',
      description_en: 'Description test CSRF without 403',
      material_id: 'HDPE / Oxium',
      material_en: 'HDPE / Oxium',
      is_featured: '0',
      is_active: '1'
    }, prodBoundary);

    const createProdRes = await request(`/admin/products?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${prodBoundary}` },
      body: prodMultipartData
    });
    assert.strictEqual(createProdRes.status, 302, 'Product creation with query CSRF must succeed and redirect (302), NOT 403');
    console.log('  ✓ Product created successfully via multipart without 403');

    // Ambil id produk yang baru dibuat
    const insertedProd = await query('SELECT id FROM products WHERE name_id = ? ORDER BY id DESC LIMIT 1', ['Produk Uji T-61 CSRF']);
    assert.ok(insertedProd.length > 0, 'Product must exist in DB');
    const testProductId = insertedProd[0].id;

    // 4. Test T-61 Positive Test: Multipart Edit Product DENGAN ?_csrf query token
    console.log('\n[4] T-61 Positive Test: Multipart Edit Product DENGAN ?_csrf query token');
    const editProdBoundary = '----WebKitFormBoundaryEdit123';
    const editProdData = buildMultipartFormData({
      name_id: 'Produk Uji T-61 CSRF Updated',
      name_en: 'Test Product T-61 CSRF Updated',
      category_id: String(categoryId),
      description_id: 'Deskripsi sudah diupdate',
      description_en: 'Description updated',
      material_id: 'HDPE',
      material_en: 'HDPE',
      is_featured: '1',
      is_active: '1'
    }, editProdBoundary);

    const editProdRes = await request(`/admin/products/${testProductId}?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${editProdBoundary}` },
      body: editProdData
    });
    assert.strictEqual(editProdRes.status, 302, 'Product update with query CSRF must succeed (302), NOT 403');
    console.log('  ✓ Product updated successfully via multipart without 403');

    // Clean up test product
    await execute('DELETE FROM products WHERE id = ?', [testProductId]);
    console.log('  ✓ Test product cleaned up');

    // 5. Test T-61 Positive Test: Multipart Create Banner Hero DENGAN ?_csrf query token
    console.log('\n[5] T-61 Positive Test: Multipart Create Banner Hero DENGAN ?_csrf query token');
    const bannerBoundary = '----WebKitFormBoundaryBanner123';
    const bannerData = buildMultipartFormData({
      title_id: 'Banner Uji T-61 CSRF',
      title_en: 'Banner Test T-61 CSRF',
      caption_id: 'Caption uji multipart CSRF',
      caption_en: 'Caption test multipart CSRF',
      cta_text_id: 'Lihat Detail',
      cta_text_en: 'View Details',
      cta_url: '/products',
      image_url: '/uploads/hero-test.webp',
      sort_order: '99',
      is_active: '1'
    }, bannerBoundary);

    const bannerRes = await request(`/admin/banners?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${bannerBoundary}` },
      body: bannerData
    });
    assert.strictEqual(bannerRes.status, 302, 'Banner create with query CSRF must succeed (302), NOT 403');
    console.log('  ✓ Banner created successfully via multipart without 403');

    // Clean up test banner
    await execute('DELETE FROM banners WHERE title_id = ?', ['Banner Uji T-61 CSRF']);
    console.log('  ✓ Test banner cleaned up');

    // 6. Test T-62: Hero Banner Slider SSR
    console.log('\n[6] T-62 Test: Hero Banner Slider SSR & Controls');
    const homeRes = await request('/');
    assert.strictEqual(homeRes.status, 200, 'Homepage must return 200');
    assert.ok(homeRes.body.includes('hero-slider'), 'Must contain hero-slider class');
    assert.ok(homeRes.body.includes('hero-slide is-active'), 'Must contain active slide');
    assert.ok(homeRes.body.includes('hero-slider-nav hero-slider-prev'), 'Must contain prev arrow button');
    assert.ok(homeRes.body.includes('hero-slider-nav hero-slider-next'), 'Must contain next arrow button');
    assert.ok(homeRes.body.includes('hero-slider-dots'), 'Must contain pagination dots');
    assert.ok(homeRes.body.includes('hero-slide-counter'), 'Must contain slide counter');
    console.log('  ✓ Hero banner slider SSR structure, nav arrows, dots, and counter verified');

    // 7. Test T-63: CMS Halaman Kontak (GET & POST)
    console.log('\n[7] T-63 Test: CMS Halaman Kontak Admin (GET /admin/contact)');
    const contactCmsRes = await request('/admin/contact');
    assert.strictEqual(contactCmsRes.status, 200, 'GET /admin/contact must return 200');
    assert.ok(contactCmsRes.body.includes('CMS Konten Halaman Kontak'), 'Must render Contact CMS form title');
    assert.ok(contactCmsRes.body.includes('contact_address_id'), 'Must have ID address textarea');
    assert.ok(contactCmsRes.body.includes('contact_address_en'), 'Must have EN address textarea');
    assert.ok(contactCmsRes.body.includes('contact_working_hours_id'), 'Must have ID working hours input');
    console.log('  ✓ Contact CMS admin page loaded successfully');

    // 8. Test T-63: Update Pengaturan Kontak via POST /admin/contact
    console.log('\n[8] T-63 Test: POST /admin/contact update bilingual settings');
    const contactUpdatePayload = [
      'contact_address_id=' + encodeURIComponent('Alamat Uji Bandung ID 40214'),
      'contact_address_en=' + encodeURIComponent('Test Address Bandung EN 40214'),
      'contact_email=' + encodeURIComponent('sales-test@euodoo.com'),
      'contact_phone=' + encodeURIComponent('(022) 9988-7766'),
      'contact_working_hours_id=' + encodeURIComponent('Senin - Jumat 08:00 - 17:00 WIB'),
      'contact_working_hours_en=' + encodeURIComponent('Mon - Fri 08:00 - 17:00 WIB'),
      'contact_form_title_id=' + encodeURIComponent('Judul Form Uji ID'),
      'contact_form_title_en=' + encodeURIComponent('Test Form Title EN'),
      'contact_form_subtitle_id=' + encodeURIComponent('Subjudul form uji ID'),
      'contact_form_subtitle_en=' + encodeURIComponent('Test form subtitle EN'),
      '_csrf=' + encodeURIComponent(csrfToken)
    ].join('&');

    const updateContactRes = await request(`/admin/contact?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: contactUpdatePayload
    });
    assert.strictEqual(updateContactRes.status, 302, 'POST /admin/contact must redirect on success');
    console.log('  ✓ Contact settings updated via POST without 403');

    // 9. Test T-63: Public /contact SSR Bilingual Rendering
    console.log('\n[9] T-63 Test: Public /contact SSR Bilingual rendering');
    const publicContactId = await request('/contact?lang=id');
    assert.strictEqual(publicContactId.status, 200, 'GET /contact?lang=id must return 200');
    assert.ok(publicContactId.body.includes('Alamat Uji Bandung ID 40214'), 'Must render updated Indonesian address');
    assert.ok(publicContactId.body.includes('Judul Form Uji ID'), 'Must render updated Indonesian form title');

    const publicContactEn = await request('/contact?lang=en');
    assert.strictEqual(publicContactEn.status, 200, 'GET /contact?lang=en must return 200');
    assert.ok(publicContactEn.body.includes('Test Address Bandung EN 40214'), 'Must render updated English address');
    assert.ok(publicContactEn.body.includes('Test Form Title EN'), 'Must render updated English form title');
    console.log('  ✓ Public contact page correctly reflects bilingual CMS settings');

    console.log('\n=============================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! (T-61, T-62, T-63)');
    console.log('=============================================');
  } finally {
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error('\n❌ REVISI ADMIN V1 TEST FAILED:', err);
  process.exit(1);
});
