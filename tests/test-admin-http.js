import http from 'http';

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

async function testHttpEndpoints() {
  console.log('--- STARTING HTTP ENDPOINT INTEGRATION TESTS ---');

  // Step 1: GET /admin/login to get CSRF token
  const getLogin = await makeRequest({ path: '/admin/login' });
  console.log('1. GET /admin/login status:', getLogin.statusCode);
  if (getLogin.statusCode !== 200) throw new Error('Expected 200 for GET /admin/login');

  const setCookies = getLogin.headers['set-cookie'] || [];
  let csrfCookie = '';
  let csrfToken = '';
  setCookies.forEach(c => {
    if (c.startsWith('_csrf_token=')) {
      csrfCookie = c.split(';')[0];
      csrfToken = csrfCookie.replace('_csrf_token=', '');
    }
  });

  console.log('   CSRF Token extracted:', csrfToken.substring(0, 10) + '...');

  // Step 2: POST /admin/login with Superadmin credentials
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

  console.log('2. POST /admin/login status:', postLogin.statusCode, '(Location:', postLogin.headers.location, ')');
  if (postLogin.statusCode !== 302) throw new Error('Expected 302 redirect for successful login');

  const authCookies = postLogin.headers['set-cookie'] || [];
  const cookieMap = {};
  authCookies.forEach(c => {
    const pair = c.split(';')[0];
    const [k, v] = pair.split('=');
    cookieMap[k.trim()] = v ? v.trim() : '';
  });

  const sessionCookie = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');
  console.log('   Authenticated session cookie obtained:', sessionCookie);

  // Step 3: Test each CMS Admin Endpoint
  const adminEndpoints = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Products Index', path: '/admin/products' },
    { name: 'Products Create View', path: '/admin/products/create' },
    { name: 'Products CSV Export', path: '/admin/products/export' },
    { name: 'Product Categories', path: '/admin/product-categories' },
    { name: 'Posts (News/Blog/Press)', path: '/admin/posts' },
    { name: 'Post Categories', path: '/admin/post-categories' },
    { name: 'Inquiries (RFQ)', path: '/admin/inquiries' },
    { name: 'Inquiries CSV Export', path: '/admin/inquiries/export' },
    { name: 'Banners', path: '/admin/banners' },
    { name: 'Brands', path: '/admin/brands' },
    { name: 'Media Library', path: '/admin/media' },
    { name: 'Users Management', path: '/admin/users' },
    { name: 'Settings CMS', path: '/admin/settings' },
    { name: 'About CMS', path: '/admin/about' },
    { name: 'Home Content CMS', path: '/admin/home-content' }
  ];

  for (const ep of adminEndpoints) {
    const res = await makeRequest({
      path: ep.path,
      headers: { 'Cookie': sessionCookie }
    });

    if (res.statusCode === 200) {
      if (ep.path === '/admin/home-content') {
        if (!res.data.includes('tab-home-wcu') || !res.data.includes('tab-home-categories')) {
          throw new Error('Home Content CMS view missing tab-home-wcu or tab-home-categories');
        }
        if (!res.data.includes('name="wcu_title_id"') || !res.data.includes('name="home_cat_0_id"')) {
          throw new Error('Home Content CMS view missing Why Choose Us or 4 Categories form fields');
        }
      }
      if (ep.path === '/admin/products') {
        if (res.data.includes('>Unggulan<') || res.data.includes('badge-status--primary">Featured')) {
          throw new Error('Products index table should NOT contain Unggulan column or Featured badge');
        }
      }
      if (ep.path === '/admin/products/create') {
        if (res.data.includes('name="featured"')) {
          throw new Error('Products create view should NOT contain featured checkbox');
        }
      }
      if (ep.path === '/admin/products/export') {
        if (res.data.includes('Unggulan (Featured)')) {
          throw new Error('Products CSV export should NOT contain Unggulan (Featured) column');
        }
      }
      console.log(`  [OK 200] ${ep.name.padEnd(25)} (${ep.path})`);
    } else {
      console.error(`  [FAIL ${res.statusCode}] ${ep.name} (${ep.path})`);
    }
  }

  // Step 4: Test POST /admin/home-content update
  console.log('\nStep 4: Testing POST /admin/home-content update...');
  const getHomeRes = await makeRequest({
    path: '/admin/home-content',
    headers: { 'Cookie': `${sessionCookie}; ${csrfCookie}` }
  });
  const homeSetCookies = getHomeRes.headers['set-cookie'] || [];
  homeSetCookies.forEach(c => {
    if (c.startsWith('_csrf_token=')) {
      csrfCookie = c.split(';')[0];
    }
  });
  const m = getHomeRes.data.match(/name="_csrf"\s+value="([^"]+)"/);
  const homeCsrf = m ? m[1] : csrfToken;

  const homeUpdateBody = new URLSearchParams({
    _csrf: homeCsrf,
    intro_title_id: 'Dedikasi Manufaktur Plastik Berkualitas Sejak 1990',
    intro_eyebrow_id: 'TENTANG PT EUODOO',
    intro_is_active: '1',
    wcu_is_active: '1',
    wcu_title_id: 'Why choose us[accent]?[/accent]',
    wcu_chip_icon: 'tree',
    wcu_chip_label_id: 'Solusi ramah lingkungan',
    wcu_headline_id: 'Inovasi material, dengan [mark]dampak yang lebih baik.[/mark]',
    wcu_desc_id: 'Sebagai [strong]pionir penerapan aditif ramah lingkungan[/strong], kami menghadirkan solusi teruji SNI.',
    wcu_art_label_id: 'Material · Alam · Masa depan',
    wcu_float_eyebrow_id: 'Berorientasi masa depan',
    wcu_float_title_id: 'Better by design.',
    wcu_float_desc_id: 'Inovasi material untuk langkah yang lebih bertanggung jawab.',
    cat_title_id: 'Produk Unggulan Manufaktur',
    cat_subtitle_id: 'Kantong plastik HDPE dan LLDPE berkualitas tinggi untuk berbagai kebutuhan retail dan industri.',
    home_cat_0_id: '4',
    home_cat_1_id: '5',
    home_cat_2_id: '6',
    home_cat_3_id: '7',
    cert_is_active: '1',
    cta_is_active: '1',
    cta_page_home: '1'
  }).toString();

  const postHomeRes = await makeRequest({
    method: 'POST',
    path: '/admin/home-content',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(homeUpdateBody),
      'Cookie': `${sessionCookie}; ${csrfCookie}`
    },
    body: homeUpdateBody
  });

  if (postHomeRes.statusCode !== 302 || !postHomeRes.headers.location.includes('success')) {
    throw new Error(`POST /admin/home-content failed: status ${postHomeRes.statusCode}, location: ${postHomeRes.headers.location}`);
  }
  console.log('  [OK 302] POST /admin/home-content persisted successfully (Location:', postHomeRes.headers.location, ')');

  // Step 5: Test POST /admin/products (Create & Edit without featured flag)
  console.log('\nStep 5: Testing POST /admin/products store & update without featured flag...');
  const createProdBody = new URLSearchParams({
    _csrf: homeCsrf,
    name_id: 'Produk Uji T177 Tanpa Featured',
    name_en: 'Test Product T177 No Featured',
    category_id: '4',
    description_id: 'Deskripsi uji t177',
    status: 'published'
  }).toString();

  const postCreateProd = await makeRequest({
    method: 'POST',
    path: `/admin/products?_csrf=${encodeURIComponent(homeCsrf)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(createProdBody),
      'Cookie': `${sessionCookie}; ${csrfCookie}`
    },
    body: createProdBody
  });

  if (postCreateProd.statusCode !== 302 || !postCreateProd.headers.location.includes('success')) {
    throw new Error(`POST /admin/products store failed: status ${postCreateProd.statusCode}, location: ${postCreateProd.headers.location}`);
  }
  console.log('  [OK 302] POST /admin/products store succeeded (Location:', postCreateProd.headers.location, ')');

  // Import productModel dynamically to find & clean up
  const { default: productModel } = await import('../models/productModel.js');
  const prods = await productModel.findAll({ search: 'Produk Uji T177' });
  if (prods.length === 0) throw new Error('Created test product not found in database');
  const createdTestProd = prods[0];

  const updateProdBody = new URLSearchParams({
    _csrf: homeCsrf,
    name_id: 'Produk Uji T177 Updated',
    name_en: 'Test Product T177 Updated',
    category_id: '4',
    status: 'published'
  }).toString();

  const postUpdateProd = await makeRequest({
    method: 'POST',
    path: `/admin/products/${createdTestProd.id}?_csrf=${encodeURIComponent(homeCsrf)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(updateProdBody),
      'Cookie': `${sessionCookie}; ${csrfCookie}`
    },
    body: updateProdBody
  });

  if (postUpdateProd.statusCode !== 302 || !postUpdateProd.headers.location.includes('success')) {
    throw new Error(`POST /admin/products/:id update failed: status ${postUpdateProd.statusCode}`);
  }
  console.log('  [OK 302] POST /admin/products/:id update succeeded (Location:', postUpdateProd.headers.location, ')');

  await productModel.delete(createdTestProd.id);
  console.log('  [CLEANUP] Test product deleted cleanly.');

  console.log('\n--- ALL HTTP ADMIN ENDPOINTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

testHttpEndpoints().catch(err => {
  console.error('\nHTTP TEST FAILED:', err);
  process.exit(1);
});
