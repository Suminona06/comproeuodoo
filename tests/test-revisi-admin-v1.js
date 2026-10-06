import assert from 'assert';
import dotenv from 'dotenv';
import { query, execute, pool } from '../config/database.js';
import productModel from '../models/productModel.js';
import bannerModel from '../models/bannerModel.js';
import postModel from '../models/postModel.js';

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

function buildMultipartWithFiles(fields, files, boundary) {
  const chunks = [];
  for (const [key, val] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
  }
  for (const file of files) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`));
    chunks.push(Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content));
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
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

    // 10. Test T-64 & T-65: GET /admin/settings renders file upload inputs & enctype
    console.log('\n[10] T-64 & T-65 Test: GET /admin/settings renders favicon & dual logo inputs');
    const settingsPageRes = await request('/admin/settings');
    assert.strictEqual(settingsPageRes.status, 200, 'GET /admin/settings must return 200');
    assert.ok(settingsPageRes.body.includes('enctype="multipart/form-data"'), 'Settings form must be multipart/form-data');
    assert.ok(settingsPageRes.body.includes('name="favicon_file"'), 'Settings form must contain favicon_file input');
    assert.ok(settingsPageRes.body.includes('name="logo_header_file"'), 'Settings form must contain logo_header_file input');
    assert.ok(settingsPageRes.body.includes('name="logo_footer_file"'), 'Settings form must contain logo_footer_file input');
    console.log('  ✓ Settings page renders all visual identity upload inputs properly');

    // 11. Test T-64 & T-65: POST /admin/settings with multipart files
    console.log('\n[11] T-64 & T-65 Test: POST /admin/settings upload favicon & dual logos');
    const settingsBoundary = '----WebKitFormBoundarySettingsUpload999';
    const sampleIco = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00, 0x20, 0x00, 0x68, 0x04]);
    const samplePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);

    const settingsMultipartBody = buildMultipartWithFiles(
      {
        company_name: 'PT Euodoo Presisi Indonesia',
        company_email: 'info@euodoo.com',
        _csrf: csrfToken
      },
      [
        { name: 'favicon_file', filename: 'custom-fav.ico', contentType: 'image/x-icon', content: sampleIco },
        { name: 'logo_header_file', filename: 'custom-header-logo.png', contentType: 'image/png', content: samplePng },
        { name: 'logo_footer_file', filename: 'custom-footer-logo.png', contentType: 'image/png', content: samplePng }
      ],
      settingsBoundary
    );

    const updateSettingsRes = await request(`/admin/settings?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${settingsBoundary}` },
      body: settingsMultipartBody
    });
    assert.strictEqual(updateSettingsRes.status, 302, 'POST /admin/settings with uploads must redirect (302)');
    console.log('  ✓ Settings upload submitted successfully with 302 redirect');

    // Verifikasi DB settings
    const updatedFav = await query('SELECT setting_value FROM settings WHERE setting_key = "site_favicon"');
    const updatedLogoH = await query('SELECT setting_value FROM settings WHERE setting_key = "site_logo_header"');
    const updatedLogoF = await query('SELECT setting_value FROM settings WHERE setting_key = "site_logo_footer"');

    assert.ok(updatedFav[0]?.setting_value?.startsWith('/uploads/settings/favicon-'), 'Favicon path must be saved in DB');
    assert.ok(updatedLogoH[0]?.setting_value?.startsWith('/uploads/settings/logo-header-'), 'Logo header path must be saved in DB');
    assert.ok(updatedLogoF[0]?.setting_value?.startsWith('/uploads/settings/logo-footer-'), 'Logo footer path must be saved in DB');
    console.log('  ✓ Database settings verified with uploaded file URLs');

    // 12. Test T-64 & T-65: Favicon and Dual Logo on Public & Admin Pages
    console.log('\n[12] T-64 & T-65 Test: Favicon & Logo injection into Public and Admin headers');
    const publicHomeRes = await request('/');
    assert.strictEqual(publicHomeRes.status, 200, 'GET / must return 200');
    assert.ok(publicHomeRes.body.includes(updatedFav[0].setting_value), 'Public page must include custom favicon link');
    assert.ok(publicHomeRes.body.includes(updatedLogoH[0].setting_value), 'Public page navbar must render custom header logo');
    assert.ok(publicHomeRes.body.includes(updatedLogoF[0].setting_value), 'Public page footer must render custom footer logo');

    const adminDashRes = await request('/admin/dashboard');
    assert.strictEqual(adminDashRes.status, 200, 'GET /admin/dashboard must return 200');
    assert.ok(adminDashRes.body.includes(updatedFav[0].setting_value), 'Admin dashboard must include custom favicon link');
    console.log('  ✓ Custom favicon and dual logos verified across public and admin templates');

    // 13. Test T-66: GET /admin/hero-banners
    console.log('\n[13] T-66 Test: GET /admin/hero-banners render configuration cards');
    const heroBannersPageRes = await request('/admin/hero-banners');
    assert.strictEqual(heroBannersPageRes.status, 200, 'GET /admin/hero-banners must return 200');
    assert.ok(heroBannersPageRes.body.includes('Hero Banner Per Halaman Publik'), 'Must render Hero Banners title');
    assert.ok(heroBannersPageRes.body.includes('card-about'), 'Must contain About card');
    assert.ok(heroBannersPageRes.body.includes('card-products'), 'Must contain Products card');
    assert.ok(heroBannersPageRes.body.includes('card-news'), 'Must contain News card');
    assert.ok(heroBannersPageRes.body.includes('card-contact'), 'Must contain Contact card');
    console.log('  ✓ Hero banners admin page renders all 4 page cards properly');

    // 14. Test T-66: POST /admin/hero-banners/about update
    console.log('\n[14] T-66 Test: POST /admin/hero-banners/about update bilingual content');
    const heroBoundary = '----WebKitFormBoundaryHeroUpdate123';
    const heroMultipartBody = buildMultipartFormData({
      title_id: 'Profil Keunggulan Pabrik Euodoo ID',
      title_en: 'Euodoo Plant Excellence Profile EN',
      subtitle_id: 'Manufaktur kantong plastik ramah lingkungan modern',
      subtitle_en: 'Modern eco-friendly plastic bag manufacturing',
      overlay_opacity: '0.70',
      cta_text_id: 'Hubungi Sales',
      cta_text_en: 'Contact Sales',
      cta_url: '/contact',
      is_active: '1',
      _csrf: csrfToken
    }, heroBoundary);

    const updateHeroRes = await request(`/admin/hero-banners/about?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${heroBoundary}` },
      body: heroMultipartBody
    });
    assert.strictEqual(updateHeroRes.status, 302, 'POST /admin/hero-banners/about must redirect (302)');
    console.log('  ✓ Hero banner updated successfully via multipart without 403');

    // Verifikasi DB
    const dbAboutHero = await query('SELECT * FROM page_hero_banners WHERE page_key = "about"');
    assert.strictEqual(dbAboutHero[0].title_id, 'Profil Keunggulan Pabrik Euodoo ID');
    assert.strictEqual(dbAboutHero[0].title_en, 'Euodoo Plant Excellence Profile EN');
    console.log('  ✓ Database page_hero_banners verified for page about');

    // 15. Test T-66: Public SSR Rendering for Hero Banners
    console.log('\n[15] T-66 Test: Public pages SSR rendering with custom hero banners');
    const publicAboutId = await request('/about?lang=id');
    assert.strictEqual(publicAboutId.status, 200, 'GET /about?lang=id must return 200');
    assert.ok(publicAboutId.body.includes('Profil Keunggulan Pabrik Euodoo ID'), 'About ID must render updated hero title');

    const publicAboutEn = await request('/about?lang=en');
    assert.strictEqual(publicAboutEn.status, 200, 'GET /about?lang=en must return 200');
    assert.ok(publicAboutEn.body.includes('Euodoo Plant Excellence Profile EN'), 'About EN must render updated hero title');

    const publicProductsRes = await request('/products');
    assert.strictEqual(publicProductsRes.status, 200, 'GET /products must return 200');

    const publicNewsRes = await request('/news');
    assert.strictEqual(publicNewsRes.status, 200, 'GET /news must return 200');

    const publicContactRes = await request('/contact');
    assert.strictEqual(publicContactRes.status, 200, 'GET /contact must return 200');
    console.log('  ✓ Public pages (/about, /products, /news, /contact) all render hero banners smoothly');

    // 16. Test T-67: Create article with custom slug and uniqueness check
    console.log('\n[16] T-67 Test: Create article with custom slug & uniqueness validation');
    await execute('DELETE FROM posts WHERE slug IN ("uji-custom-slug-awal", "uji-custom-slug-baru")');
    await execute('DELETE FROM slug_redirects WHERE entity_type = "post" AND (old_slug IN ("uji-custom-slug-awal", "uji-custom-slug-baru") OR new_slug IN ("uji-custom-slug-awal", "uji-custom-slug-baru"))');

    const postCats = await query('SELECT id FROM post_categories LIMIT 1');
    const postCatId = postCats[0]?.id || 1;

    const initialSlug = 'uji-custom-slug-awal';
    const postBoundary1 = '----WebKitFormBoundaryPostSlug1';
    const postMultipartBody1 = buildMultipartFormData({
      title_id: 'Judul Uji Custom Slug',
      title_en: 'Test Custom Slug Title',
      slug: initialSlug,
      type: 'berita',
      category_id: String(postCatId),
      content_id: 'Konten artikel uji slug custom.',
      content_en: 'Content test custom slug.',
      status: 'published',
      _csrf: csrfToken
    }, postBoundary1);

    const createPostRes1 = await request(`/admin/posts?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${postBoundary1}` },
      body: postMultipartBody1
    });
    assert.strictEqual(createPostRes1.status, 302, 'Create post with custom slug must redirect (302)');

    const createdPost = await query('SELECT id, slug FROM posts WHERE slug = ?', [initialSlug]);
    assert.strictEqual(createdPost.length, 1, 'Post must be saved with exact custom slug');
    const testPostId = createdPost[0].id;
    console.log('  ✓ Post created successfully with custom slug: ' + initialSlug);

    // Negative test duplicate slug
    const duplicateBody = buildMultipartFormData({
      title_id: 'Judul Lain Duplikat Slug',
      slug: initialSlug,
      type: 'berita',
      _csrf: csrfToken
    }, '----WebKitFormBoundaryDup');
    const dupRes = await request(`/admin/posts?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryDup' },
      body: duplicateBody
    });
    assert.strictEqual(dupRes.status, 400, 'Duplicate slug submission must return 400 validation error');
    assert.ok(dupRes.body.includes('sudah digunakan'), 'Must show error message that slug is taken');
    console.log('  ✓ Duplicate slug rejected properly with 400');

    // 17. Test T-67: Edit article slug and record 301 redirect
    console.log('\n[17] T-67 Test: Edit article slug and record 301 redirect');
    const updatedSlug = 'uji-custom-slug-baru';
    const postBoundary2 = '----WebKitFormBoundaryPostSlug2';
    const postMultipartBody2 = buildMultipartFormData({
      title_id: 'Judul Uji Custom Slug Diperbarui',
      title_en: 'Updated Test Custom Slug Title',
      slug: updatedSlug,
      type: 'berita',
      category_id: String(postCatId),
      content_id: 'Konten artikel dengan slug baru.',
      content_en: 'Article content with new slug.',
      status: 'published',
      _csrf: csrfToken
    }, postBoundary2);

    const editPostRes = await request(`/admin/posts/${testPostId}?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${postBoundary2}` },
      body: postMultipartBody2
    });
    assert.strictEqual(editPostRes.status, 302, 'Edit post must redirect (302)');

    // Verifikasi slug_redirects
    const redirects = await query('SELECT * FROM slug_redirects WHERE entity_type = "post" AND old_slug = ? AND new_slug = ?', [initialSlug, updatedSlug]);
    assert.strictEqual(redirects.length, 1, 'slug_redirects must have 1 record mapping old_slug to new_slug');
    console.log('  ✓ 301 redirect recorded in slug_redirects table: ' + initialSlug + ' -> ' + updatedSlug);

    // 18. Test T-67: Public 301 Permanent Redirect on old slug & 200 on new slug
    console.log('\n[18] T-67 Test: Public 301 Permanent Redirect on old slug');
    const oldSlugRes = await request(`/news/${initialSlug}`);
    assert.strictEqual(oldSlugRes.status, 301, 'Requesting old slug must return HTTP 301 Moved Permanently');
    assert.strictEqual(oldSlugRes.headers.get('location'), `/news/${updatedSlug}`, '301 location header must point to new slug');
    console.log('  ✓ Public GET /news/' + initialSlug + ' returned 301 -> /news/' + updatedSlug);

    const newSlugRes = await request(`/news/${updatedSlug}?lang=id`);
    assert.strictEqual(newSlugRes.status, 200, 'Requesting new slug must return 200 OK');
    assert.ok(newSlugRes.body.includes('Judul Uji Custom Slug Diperbarui'), 'Must render article content with new slug');
    assert.ok(newSlugRes.body.includes('Konten artikel dengan slug baru'), 'Must render article body with new slug');
    console.log('  ✓ Public GET /news/' + updatedSlug + ' returned 200 with article content');

    // Clean up test post & redirects
    await execute('DELETE FROM posts WHERE id = ?', [testPostId]);
    await execute('DELETE FROM slug_redirects WHERE entity_type = "post" AND (old_slug = ? OR new_slug = ?)', [initialSlug, updatedSlug]);
    console.log('  ✓ Test article and slug redirects cleaned up');

    // 19. Test T-68: GET /contact renders Cloudflare Turnstile widget
    console.log('\n[19] T-68 Test: GET /contact renders Turnstile widget container');
    const contactPageRes = await request('/contact');
    assert.strictEqual(contactPageRes.status, 200, 'GET /contact must return 200');
    assert.ok(contactPageRes.body.includes('class="cf-turnstile"'), 'Must render cf-turnstile widget');
    assert.ok(contactPageRes.body.includes('data-sitekey='), 'Must contain data-sitekey attribute');
    assert.ok(contactPageRes.body.includes('challenges.cloudflare.com/turnstile/v0/api.js'), 'Must load Turnstile API script');
    console.log('  ✓ Public contact form includes Turnstile widget and API script');

    // 20. Test T-68: Negative Test: POST /contact TANPA Turnstile token ditolak
    console.log('\n[20] T-68 Negative Test: POST /contact without Turnstile token must be rejected');
    const noTurnstileBody = new URLSearchParams({
      name: 'Tester Bot',
      email: 'bot@example.com',
      phone: '08123456789',
      message: 'Ini pesan spam bot tanpa CAPTCHA',
      _csrf: csrfToken
    }).toString();

    const noTurnstileRes = await request('/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-test-bypass-rate-limit': 'true'
      },
      body: noTurnstileBody
    });
    assert.strictEqual(noTurnstileRes.status, 302, 'Standard submit without Turnstile must redirect');
    assert.ok(noTurnstileRes.headers.get('location').includes('error=turnstile'), 'Must redirect to error=turnstile');

    // Test juga via AJAX (harus 400 JSON)
    const ajaxNoTurnstileRes = await request('/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'x-test-bypass-rate-limit': 'true'
      },
      body: noTurnstileBody
    });
    assert.strictEqual(ajaxNoTurnstileRes.status, 400, 'AJAX submit without Turnstile must return 400 Bad Request');
    const ajaxErrorJson = JSON.parse(ajaxNoTurnstileRes.body);
    assert.strictEqual(ajaxErrorJson.success, false, 'AJAX response must indicate failure');
    assert.ok(ajaxErrorJson.message.includes('Turnstile'), 'AJAX error message must mention Turnstile');
    console.log('  ✓ Submissions without Turnstile token blocked properly (302 redirect & 400 JSON)');

    // 21. Test T-68: Positive Test: POST /contact DENGAN dummy testing token diterima
    console.log('\n[21] T-68 Positive Test: POST /contact with testing Turnstile token accepted');
    const validTurnstileBody = new URLSearchParams({
      name: 'PT Mitra Sukses Mandiri',
      company: 'PT Mitra Sukses',
      email: 'procurement@mitrasukses.com',
      phone: '081298765432',
      message: 'Permintaan penawaran 50.000 pcs kantong belanja oxium ramah lingkungan.',
      'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX',
      _csrf: csrfToken
    }).toString();

    const validTurnstileRes = await request('/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-test-bypass-rate-limit': 'true'
      },
      body: validTurnstileBody
    });
    assert.strictEqual(validTurnstileRes.status, 302, 'Submission with valid Turnstile token must redirect (302)');
    assert.ok(validTurnstileRes.headers.get('location').includes('success=1'), 'Must redirect to success=1');

    // Verifikasi DB inquiry masuk
    const insertedInquiries = await query('SELECT * FROM inquiries WHERE email = "procurement@mitrasukses.com" ORDER BY id DESC LIMIT 1');
    assert.ok(insertedInquiries.length > 0, 'Inquiry must be recorded in database');
    assert.strictEqual(insertedInquiries[0].name, 'PT Mitra Sukses Mandiri');
    console.log('  ✓ Inquiry successfully created in DB after passing Turnstile verification');

    // Clean up test inquiry
    await execute('DELETE FROM inquiries WHERE id = ?', [insertedInquiries[0].id]);
    console.log('  ✓ Test inquiry cleaned up');

    // 22. Test T-61 Khusus Aksi Hapus / DELETE di CMS Admin
    console.log('\n[22] T-61 Verification: Form Delete & Aksi Hapus pada CRUD Admin (Products, Banners, Posts)');

    // 22a. Verifikasi HTML SSR memuat token CSRF di form delete
    const productsListView = await request('/admin/products');
    assert.strictEqual(productsListView.status, 200, 'GET /admin/products must return 200');
    assert.ok(productsListView.body.includes('/delete?_csrf='), 'Products delete form must have ?_csrf in action URL');
    assert.ok(productsListView.body.includes('name="_csrf"'), 'Products delete form must contain hidden _csrf input');
    console.log('  ✓ Form delete markup includes CSRF query param and hidden input in SSR views');

    // 22b. Uji Hapus Produk
    const dummyProductId = await productModel.create({
      slug: 'produk-uji-hapus-csrf',
      name_id: 'Produk Uji Hapus',
      name_en: 'Test Delete Product',
      description_id: 'Desc',
      description_en: 'Desc',
      status: 'published'
    });

    const deleteProductRes = await request(`/admin/products/${dummyProductId}/delete?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ _csrf: csrfToken }).toString()
    });
    assert.strictEqual(deleteProductRes.status, 302, 'Delete product must redirect with 302 (Not 403)');
    const checkProduct = await query('SELECT * FROM products WHERE id = ?', [dummyProductId]);
    assert.strictEqual(checkProduct.length, 0, 'Product must be permanently deleted from database');
    console.log('  ✓ Delete product executed successfully without 403');

    // 22c. Uji Hapus Banner
    const dummyBannerId = await bannerModel.create({
      title_id: 'Banner Uji Hapus',
      title_en: 'Test Delete Banner',
      file_url: '/images/banner-test.webp',
      sort_order: 99,
      is_active: 0
    });

    const deleteBannerRes = await request(`/admin/banners/${dummyBannerId}/delete?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ _csrf: csrfToken }).toString()
    });
    assert.strictEqual(deleteBannerRes.status, 302, 'Delete banner must redirect with 302 (Not 403)');
    const checkBanner = await query('SELECT * FROM banners WHERE id = ?', [dummyBannerId]);
    assert.strictEqual(checkBanner.length, 0, 'Banner must be permanently deleted from database');
    console.log('  ✓ Delete banner executed successfully without 403');

    // 22d. Uji Hapus Post / Artikel
    const dummyPostId = await postModel.create({
      slug: 'artikel-uji-hapus-csrf',
      title_id: 'Artikel Uji Hapus',
      title_en: 'Test Delete Article',
      excerpt_id: 'Ex',
      excerpt_en: 'Ex',
      content_id: 'Cont',
      content_en: 'Cont',
      status: 'draft'
    });

    const deletePostRes = await request(`/admin/posts/${dummyPostId}/delete?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ _csrf: csrfToken }).toString()
    });
    assert.strictEqual(deletePostRes.status, 302, 'Delete post must redirect with 302 (Not 403)');
    const checkPost = await query('SELECT * FROM posts WHERE id = ?', [dummyPostId]);
    assert.strictEqual(checkPost.length, 0, 'Post must be permanently deleted from database');
    console.log('  ✓ Delete article/post executed successfully without 403');

    // 22e. Uji Hapus dengan query-only CSRF (multi-source resolution)
    const dummyPostId2 = await postModel.create({
      slug: 'artikel-uji-query-csrf',
      title_id: 'Artikel Uji Query CSRF',
      title_en: 'Test Delete Article Query',
      excerpt_id: 'Ex',
      excerpt_en: 'Ex',
      content_id: 'Cont',
      content_en: 'Cont',
      status: 'draft'
    });
    const deleteQueryOnlyRes = await request(`/admin/posts/${dummyPostId2}/delete?_csrf=${encodeURIComponent(csrfToken)}`, {
      method: 'POST'
    });
    assert.strictEqual(deleteQueryOnlyRes.status, 302, 'Delete with query-only CSRF must succeed with 302');
    const checkPost2 = await query('SELECT * FROM posts WHERE id = ?', [dummyPostId2]);
    assert.strictEqual(checkPost2.length, 0, 'Post deleted via query-only CSRF must be gone');
    console.log('  ✓ Delete with query-only CSRF executed successfully without 403');

    // 22f. Uji Hapus dengan body-only CSRF (standard form post resolution)
    const dummyPostId3 = await postModel.create({
      slug: 'artikel-uji-body-csrf',
      title_id: 'Artikel Uji Body CSRF',
      title_en: 'Test Delete Article Body',
      excerpt_id: 'Ex',
      excerpt_en: 'Ex',
      content_id: 'Cont',
      content_en: 'Cont',
      status: 'draft'
    });
    const deleteBodyOnlyRes = await request(`/admin/posts/${dummyPostId3}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ _csrf: csrfToken }).toString()
    });
    assert.strictEqual(deleteBodyOnlyRes.status, 302, 'Delete with body-only CSRF must succeed with 302');
    const checkPost3 = await query('SELECT * FROM posts WHERE id = ?', [dummyPostId3]);
    assert.strictEqual(checkPost3.length, 0, 'Post deleted via body-only CSRF must be gone');
    console.log('  ✓ Delete with body-only CSRF executed successfully without 403');

    // [23] Verifikasi UI Polish (C1 - C7)
    console.log('\n[23] Verification UI Polish C1 - C7: Collapsible Sidebar, CRUD Buttons, Close Buttons, RFQ Footer, Change Password, Tentang Kami Tabs');

    // C6: Change Password View
    const changePassRes = await request('/admin/change-password');
    assert.strictEqual(changePassRes.status, 200, 'Change password page must return 200');
    assert.ok(changePassRes.body.includes('app-sidebar'), 'Change password must include sidebar');
    assert.ok(changePassRes.body.includes('content-header'), 'Change password must include content-header');
    assert.ok(changePassRes.body.includes('form-card'), 'Change password must include form-card');
    assert.ok(changePassRes.body.includes('id="current_password"'), 'Change password must have current_password input');
    console.log('  ✓ C6: Change Password layout standardized with sidebar and form-card');

    // C7: About Us CMS View
    const aboutRes = await request('/admin/about');
    assert.strictEqual(aboutRes.status, 200, 'About page must return 200');
    assert.ok(aboutRes.body.includes('about-tabs-nav'), 'About page must render tabs navigation');
    assert.ok(aboutRes.body.includes('id="tab-sejarah"'), 'About page must render tab-sejarah');
    assert.ok(aboutRes.body.includes('id="tab-visi-misi"'), 'About page must render tab-visi-misi');
    assert.ok(aboutRes.body.includes('id="tab-ticket"'), 'About page must render tab-ticket');
    assert.ok(aboutRes.body.includes('id="tab-sertifikasi"'), 'About page must render tab-sertifikasi');
    assert.ok(aboutRes.body.includes('about-sticky-actions'), 'About page must render sticky action bar');
    console.log('  ✓ C7: CMS Tentang Kami redesigned with modern tabs and preserved fields');

    // C1, C4, C5: Dashboard RFQ Widget, Collapsible Toggle, Modal Close
    const dashRes = await request('/admin/dashboard');
    assert.strictEqual(dashRes.status, 200, 'Dashboard must return 200');
    assert.ok(dashRes.body.includes('id="sidebarToggleBtn"'), 'Dashboard must have sidebar toggle button');
    assert.ok(dashRes.body.includes('table-footer'), 'RFQ widget must have table-footer');
    assert.ok(dashRes.body.includes('modal-close-btn'), 'Inquiry modal must have reusable modal-close-btn');
    console.log('  ✓ C1, C4, C5: Collapsible sidebar toggle, RFQ table-footer, and modal close button verified');

    // C3 & C2: Inquiries & Brands layout and CRUD button symmetry
    const inqRes = await request('/admin/inquiries');
    assert.strictEqual(inqRes.status, 200, 'Inquiries page must return 200');
    assert.ok(inqRes.body.includes('content-header'), 'Inquiries must use standard content-header');
    assert.ok(inqRes.body.includes('btn-action'), 'Inquiries must use standardized btn-action');

    const brandRes = await request('/admin/brands');
    assert.strictEqual(brandRes.status, 200, 'Brands page must return 200');
    assert.ok(brandRes.body.includes('content-header'), 'Brands must use standard content-header');
    assert.ok(brandRes.body.includes('btn-action'), 'Brands must use standardized btn-action');
    console.log('  ✓ C3 & C2: Inquiries & Brands standardized with content-header and symmetric action buttons');

    console.log('\n============================================================================');
    console.log('ALL REVISI ADMIN V1 TASKS & POLISH C1-C7 PASSED SUCCESSFULLY!');
    console.log('============================================================================');
  } finally {
    await pool.end();
  }
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ REVISI ADMIN V1 TEST FAILED:', err);
    process.exit(1);
  });
