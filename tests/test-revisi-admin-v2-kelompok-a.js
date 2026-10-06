import assert from 'assert';
import dotenv from 'dotenv';
import pool from '../config/database.js';

dotenv.config();

const BASE_URL = 'http://127.0.0.1:3000';
let cookieJar = {};

async function request(path, options = {}) {
  const cookieHeader = Object.entries(cookieJar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

  const headers = {
    'x-test-bypass-rate-limit': 'true',
    ...(options.headers || {})
  };
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body,
    redirect: 'manual'
  });

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
    if (Array.isArray(val)) {
      for (const item of val) {
        postData += `--${boundary}\r\n`;
        postData += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
        postData += `${item}\r\n`;
      }
    } else {
      postData += `--${boundary}\r\n`;
      postData += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      postData += `${val}\r\n`;
    }
  }
  postData += `--${boundary}--\r\n`;
  return postData;
}

async function runKelompokATests() {
  console.log('--- STARTING REVISI ADMIN V2 KELOMPOK A TEST SUITE ---\n');

  // Step 1: Login Admin Superadmin
  console.log('[1] Login Admin Superadmin...');
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
  assert.ok(cookieJar['euodoo_session'], 'Auth token cookie must be stored (euodoo_session)');
  console.log('  ✓ Admin logged in successfully\n');

  // Step 2: T-69 Test - Flash Alert Single Rendering in About, Hero Banners, Contact, Change Password
  console.log('[2] T-69 Test: Flash Alert Single Rendering (Tentang Kami, Hero Banners, Contact, Change Password)...');
  
  // 2a. Update About and check response HTML
  const boundary = '----WebKitFormBoundaryAboutTest123';
  const aboutBody = buildMultipartFormData({
    _csrf: csrfToken,
    history_id: 'Sejarah perusahaan PT Euodoo telah diperbarui untuk uji alert tunggal.',
    history_en: 'Company history updated for single alert test.'
  }, boundary);
  const postAbout = await request(`/admin/about?_csrf=${encodeURIComponent(csrfToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: aboutBody
  });
  assert.strictEqual(postAbout.status, 302, 'About update should redirect');

  const aboutPage = await request('/admin/about?success=Data+tentang+kami+berhasil+diperbarui');
  const aboutAlertCount = (aboutPage.body.match(/class="alert alert-success"/g) || []).length;
  assert.strictEqual(aboutAlertCount, 1, `About page must have exactly 1 alert-success, found ${aboutAlertCount}`);
  console.log('  ✓ CMS Tentang Kami (/admin/about) renders exactly 1 flash alert success');

  // 2b. Test Contact update and check response HTML
  const contactBody = `_csrf=${encodeURIComponent(csrfToken)}&email=kontak@euodoo.com&phone=021-5551234&factory_address_id=Jl.+Raya+Industri+No.+1&factory_address_en=Jl.+Raya+Industri+No.+1&inquiry_title_id=Form+Inquiry&inquiry_title_en=Inquiry+Form`;
  const postContact = await request(`/admin/contact?_csrf=${encodeURIComponent(csrfToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: contactBody
  });
  assert.strictEqual(postContact.status, 302, 'Contact update should redirect');

  const contactPage = await request('/admin/contact?success=Pengaturan+halaman+kontak+berhasil+diperbarui');
  const contactAlertCount = (contactPage.body.match(/class="alert alert-success"/g) || []).length;
  assert.strictEqual(contactAlertCount, 1, `Contact page must have exactly 1 alert-success, found ${contactAlertCount}`);
  console.log('  ✓ CMS Kontak (/admin/contact) renders exactly 1 flash alert success');

  // 2c. Test Hero Banners render with flash message
  const heroPage = await request('/admin/hero-banners?success=Uji+Hero+Banner+Sukses');
  const heroAlertCount = (heroPage.body.match(/class="alert alert-success"/g) || []).length;
  assert.strictEqual(heroAlertCount, 1, `Hero Banners page must have exactly 1 alert-success, found ${heroAlertCount}`);
  console.log('  ✓ Hero Banners (/admin/hero-banners) renders exactly 1 flash alert success');

  // 2d. Test Change Password view with flash message
  const pwdPage = await request('/admin/change-password?success=Kata+sandi+berhasil+diperbarui');
  const pwdAlertCount = (pwdPage.body.match(/class="alert alert-success"/g) || []).length;
  assert.strictEqual(pwdAlertCount, 1, `Change password page must have exactly 1 alert-success, found ${pwdAlertCount}`);
  console.log('  ✓ Ganti Kata Sandi (/admin/change-password) renders exactly 1 flash alert success\n');

  // Step 3: T-70 Test - Tombol "Tinjau" di Halaman Inquiry & RFQ dan Dashboard
  console.log('[3] T-70 Test: Tombol "Tinjau" Inquiry & Dashboard Verification...');
  // 3a. Verify Dashboard HTML
  const dashPage = await request('/admin/dashboard');
  assert.ok(dashPage.body.includes('id="inquiryDetailModal"'), 'Dashboard must contain inquiryDetailModal');
  assert.ok(dashPage.body.includes('data-inquiry-id='), 'Dashboard review button must have data-inquiry-id attribute');
  assert.ok(dashPage.body.includes('viewInquiryDetail('), 'Dashboard must have viewInquiryDetail function');
  assert.ok(dashPage.body.includes('btn-action btn-action-view'), 'Dashboard must have btn-action-view button');
  console.log('  ✓ Dashboard contains inquiry modal, review buttons with data-inquiry-id, and click handlers');

  // 3b. Verify Inquiries Index HTML
  const inqPage = await request('/admin/inquiries');
  assert.ok(inqPage.body.includes('id="inquiryDetailModal"'), 'Inquiries page must contain inquiryDetailModal');
  assert.ok(inqPage.body.includes('data-inquiry-id='), 'Inquiries page review button must have data-inquiry-id attribute');
  assert.ok(inqPage.body.includes('openInquiryById('), 'Inquiries page must have openInquiryById function');
  console.log('  ✓ Inquiries index contains inquiry modal, review buttons with data-inquiry-id, and openInquiryById handler');

  // 3c. Verify Helmet CSP header includes script-src-attr 'unsafe-inline'
  const cspHeader = dashPage.headers.get('content-security-policy') || '';
  assert.ok(cspHeader.includes("script-src-attr 'self' 'unsafe-inline'"), 'CSP must include script-src-attr allowing inline handlers');
  console.log('  ✓ Helmet CSP script-src-attr verified: inline click handlers permitted\n');

  // Step 4: T-71 & T-72 Test - Form Tambah Produk dengan Baris Dinamis & Aksi Hapus Baris
  console.log('[4] T-71 & T-72 Test: Form Tambah Produk Dinamis & Aksi Hapus Baris...');
  // 4a. Verify Create Product Form HTML
  const createProdPage = await request('/admin/products/create');
  assert.ok(createProdPage.body.includes('id="btnAddSpecRow"'), 'Create product must have btnAddSpecRow button');
  assert.ok(createProdPage.body.includes('id="btnAddVariantRow"'), 'Create product must have btnAddVariantRow button');
  assert.ok(createProdPage.body.includes('btn-remove-spec'), 'Create product must have btn-remove-spec delete buttons on all spec rows');
  assert.ok(createProdPage.body.includes('btn-remove-variant'), 'Create product must have btn-remove-variant delete buttons on all variant rows');
  assert.ok(createProdPage.body.includes('removeSpecRow('), 'Create product script must have removeSpecRow function');
  assert.ok(createProdPage.body.includes('removeVariantRow('), 'Create product script must have removeVariantRow function');
  console.log('  ✓ Create product form structure verified: add buttons, delete buttons on all rows, and boundary functions');

  // 4b. Test Submit Create Product with 3 dynamic technical specs and 2 variants
  const prodSlug = `test-dynamic-product-${Date.now()}`;
  const prodBoundary = '----WebKitFormBoundaryProductTest789';
  const prodMultipart = buildMultipartFormData({
    _csrf: csrfToken,
    name_id: 'Produk Uji Baris Dinamis',
    name_en: 'Dynamic Rows Test Product',
    category_id: '1',
    status: 'draft',
    slug: prodSlug,
    'spec_key[]': ['Bahan Baku', 'Kekuatan Tarik', 'Sertifikasi'],
    'spec_val[]': ['Virgin LDPE Grade A', '28 MPa', 'ISO 9001:2015 & SNI'],
    'var_size[]': ['35 x 50 cm', '40 x 60 cm'],
    'var_thickness[]': ['0.045 mm', '0.050 mm'],
    'var_color[]': ['Biru, Putih', 'Hitam'],
    'var_material[]': ['LDPE Virgin', 'LDPE Virgin']
  }, prodBoundary);

  const postCreateProd = await request(`/admin/products?_csrf=${encodeURIComponent(csrfToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${prodBoundary}` },
    body: prodMultipart
  });
  assert.strictEqual(postCreateProd.status, 302, 'Create product must redirect on success');

  // 4c. Verify in database
  const [createdRows] = await pool.query('SELECT * FROM products WHERE name_id = ? ORDER BY id DESC LIMIT 1', ['Produk Uji Baris Dinamis']);
  assert.ok(createdRows.length > 0, 'Created product must exist in database');
  const createdProd = createdRows[0];
  const specsJson = typeof createdProd.technical_specs === 'string' ? JSON.parse(createdProd.technical_specs) : createdProd.technical_specs;
  assert.strictEqual(specsJson['Bahan Baku'], 'Virgin LDPE Grade A');
  assert.strictEqual(specsJson['Kekuatan Tarik'], '28 MPa');
  assert.strictEqual(specsJson['Sertifikasi'], 'ISO 9001:2015 & SNI');

  const [createdVariantsRaw] = await pool.query('SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC', [createdProd.id]);
  assert.strictEqual(createdVariantsRaw.length, 2, 'Must have 2 variants in database');
  const variant1Specs = typeof createdVariantsRaw[0].specs === 'string' ? JSON.parse(createdVariantsRaw[0].specs) : createdVariantsRaw[0].specs;
  const variant2Specs = typeof createdVariantsRaw[1].specs === 'string' ? JSON.parse(createdVariantsRaw[1].specs) : createdVariantsRaw[1].specs;
  assert.strictEqual(variant1Specs.size_label, '35 x 50 cm');
  assert.strictEqual(variant2Specs.size_label, '40 x 60 cm');
  console.log('  ✓ Product created with multiple dynamic specs and variants successfully verified in database');

  // 4d. Test Edit Product Form HTML and Deleting rows (simulating removal of 1 spec and 1 variant)
  const editProdPage = await request(`/admin/products/${createdProd.id}/edit`);
  assert.ok(editProdPage.body.includes('id="btnAddSpecRow"'), 'Edit product must have btnAddSpecRow button');
  assert.ok(editProdPage.body.includes('id="btnAddVariantRow"'), 'Edit product must have btnAddVariantRow button');
  assert.ok(editProdPage.body.includes('btn-remove-spec'), 'Edit product must have btn-remove-spec delete buttons on all spec rows');
  assert.ok(editProdPage.body.includes('btn-remove-variant'), 'Edit product must have btn-remove-variant delete buttons on all variant rows');

  // Submit edit with only 1 spec and 1 variant remaining (boundary condition: minimal 1 baris)
  const editBoundary = '----WebKitFormBoundaryEditProd999';
  const editMultipart = buildMultipartFormData({
    _csrf: csrfToken,
    name_id: 'Produk Uji Baris Dinamis (Teredit)',
    name_en: 'Dynamic Rows Test Product (Edited)',
    category_id: '1',
    status: 'draft',
    // Only 1 spec remaining
    'spec_key[]': ['Bahan Baku'],
    'spec_val[]': ['Virgin LDPE Grade A (Single Spec)'],
    // Only 1 variant remaining
    'var_size[]': ['50 x 70 cm'],
    'var_thickness[]': ['0.060 mm'],
    'var_color[]': ['Merah'],
    'var_material[]': ['LDPE Virgin Premium']
  }, editBoundary);

  const postEditProd = await request(`/admin/products/${createdProd.id}?_csrf=${encodeURIComponent(csrfToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${editBoundary}` },
    body: editMultipart
  });
  assert.strictEqual(postEditProd.status, 302, 'Edit product must redirect on success');

  // Verify updated data in database
  const [updatedRows] = await pool.query('SELECT * FROM products WHERE id = ?', [createdProd.id]);
  const updatedProd = updatedRows[0];
  const updatedSpecs = typeof updatedProd.technical_specs === 'string' ? JSON.parse(updatedProd.technical_specs) : updatedProd.technical_specs;
  assert.strictEqual(Object.keys(updatedSpecs).length, 1, 'Updated specs must have exactly 1 key');
  assert.strictEqual(updatedSpecs['Bahan Baku'], 'Virgin LDPE Grade A (Single Spec)');

  const [updatedVariantsRaw] = await pool.query('SELECT * FROM product_variants WHERE product_id = ?', [createdProd.id]);
  assert.strictEqual(updatedVariantsRaw.length, 1, 'Updated variants must have exactly 1 variant row');
  const updatedVarSpecs = typeof updatedVariantsRaw[0].specs === 'string' ? JSON.parse(updatedVariantsRaw[0].specs) : updatedVariantsRaw[0].specs;
  assert.strictEqual(updatedVarSpecs.size_label, '50 x 70 cm');
  console.log('  ✓ Edit product with reduced row count verified: boundary condition and database sync successful');

  // Cleanup test product
  await pool.query('DELETE FROM product_variants WHERE product_id = ?', [createdProd.id]);
  await pool.query('DELETE FROM products WHERE id = ?', [createdProd.id]);
  console.log('  ✓ Test product cleaned up from database\n');

  console.log('========================================================================');
  console.log('ALL KELOMPOK A TASKS (T-69, T-70, T-71, T-72) PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
  process.exit(0);
}

runKelompokATests().catch(err => {
  console.error('\n❌ KELOMPOK A TEST FAILED:', err);
  process.exit(1);
});
