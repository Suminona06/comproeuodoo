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
    { name: 'Settings CMS', path: '/admin/settings' }
  ];

  for (const ep of adminEndpoints) {
    const res = await makeRequest({
      path: ep.path,
      headers: { 'Cookie': sessionCookie }
    });

    if (res.statusCode === 200) {
      console.log(`  [OK 200] ${ep.name.padEnd(25)} (${ep.path})`);
    } else {
      console.error(`  [FAIL ${res.statusCode}] ${ep.name} (${ep.path})`);
      throw new Error(`Endpoint ${ep.path} returned status ${res.statusCode}`);
    }
  }

  console.log('\n--- ALL HTTP ADMIN ENDPOINTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

testHttpEndpoints().catch(err => {
  console.error('\nHTTP TEST FAILED:', err);
  process.exit(1);
});
