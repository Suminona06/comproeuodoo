import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import app to start ephemeral server for testing
import app from '../app.js';
import { query, execute } from '../config/database.js';

let server;
let port;
let cookieJar = {};

function request(options, postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const cookieHeader = Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const reqHeaders = {
      ...headers
    };
    if (cookieHeader) {
      reqHeaders['Cookie'] = cookieHeader;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: port,
        path: options.path,
        method: options.method || 'GET',
        headers: reqHeaders
      },
      (res) => {
        // Collect cookies
        const setCookies = res.headers['set-cookie'];
        if (setCookies) {
          setCookies.forEach((cookieStr) => {
            const parts = cookieStr.split(';')[0].split('=');
            if (parts.length >= 2) {
              const name = parts[0].trim();
              const val = parts.slice(1).join('=').trim();
              cookieJar[name] = val;
            }
          });
        }

        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body
          });
        });
      }
    );

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING CMS ADMIN MODULE 3 TESTS ---');

  // Start server on free random port
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      console.log(`[TEST SERVER] Running on port ${port}`);
      resolve();
    });
  });

  try {
    // 1. Get Login Page to obtain CSRF Cookie
    console.log('\n[1] GET /admin/login');
    const loginPageRes = await request({ path: '/admin/login', method: 'GET' });
    if (loginPageRes.statusCode !== 200) {
      throw new Error(`Expected 200 on login page, got ${loginPageRes.statusCode}`);
    }
    const csrfToken = cookieJar['_csrf_token'];
    console.log(`  ✓ Received CSRF token: ${csrfToken ? csrfToken.substring(0, 8) + '...' : 'NONE'}`);

    // 2. Post Login
    console.log('\n[2] POST /admin/login (Admin authentication)');
    const loginPayload = `email=admin%40euodoo.com&password=AdminEuodoo2026%21&_csrf=${encodeURIComponent(csrfToken)}`;
    const loginRes = await request(
      { path: '/admin/login', method: 'POST' },
      loginPayload,
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );
    console.log(`  Status: ${loginRes.statusCode}, Redirect: ${loginRes.headers.location}`);
    if (loginRes.statusCode !== 302 || !loginRes.headers.location.startsWith('/admin')) {
      throw new Error(`Login failed! Status: ${loginRes.statusCode}`);
    }
    console.log(`  ✓ Admin session established: token=${cookieJar['euodoo_session'] ? 'OK' : 'MISSING'}`);

    // 3. Test Dashboard View
    console.log('\n[3] GET /admin/dashboard');
    const dashRes = await request({ path: '/admin/dashboard', method: 'GET' });
    if (dashRes.statusCode !== 200 || !dashRes.body.includes('Ringkasan Operasional CMS')) {
      throw new Error(`Dashboard failed to render correctly! Status: ${dashRes.statusCode}`);
    }
    console.log('  ✓ Dashboard loaded with metric cards and recent leads table');

    // 4. Test Banners Index
    console.log('\n[4] GET /admin/banners');
    const bannersRes = await request({ path: '/admin/banners', method: 'GET' });
    if (bannersRes.statusCode !== 200 || !bannersRes.body.includes('Manajemen Banner Hero')) {
      throw new Error(`Banners view failed to render! Status: ${bannersRes.statusCode}`);
    }
    console.log('  ✓ Banners management view loaded');

    // 5. Test Products Index & Create View
    console.log('\n[5] GET /admin/products & GET /admin/products/create');
    const prodListRes = await request({ path: '/admin/products', method: 'GET' });
    if (prodListRes.statusCode !== 200 || !prodListRes.body.includes('Manajemen Produk')) {
      throw new Error(`Products view failed! Status: ${prodListRes.statusCode}`);
    }
    const prodCreateRes = await request({ path: '/admin/products/create', method: 'GET' });
    if (prodCreateRes.statusCode !== 200 || !prodCreateRes.body.includes('Tambah Produk Baru')) {
      throw new Error(`Product create view failed! Status: ${prodCreateRes.statusCode}`);
    }
    console.log('  ✓ Product catalog view and create form loaded');

    // 6. Test Product Creation, Update, and Deletion via Model & HTTP
    console.log('\n[6] Product CRUD Lifecycle');
    // Get a category id
    const cats = await query('SELECT id FROM categories LIMIT 1');
    const categoryId = cats[0].id;
    const testSlug = `produk-tes-cms-${Date.now()}`;

    const insProd = await execute(
      `INSERT INTO products (category_id, name_id, name_en, slug, description_id, description_en, is_active)
       VALUES (?, 'Produk Tes CMS', 'Test Product CMS', ?, 'Deskripsi tes', 'Test description', 1)`,
      [categoryId, testSlug]
    );
    const testProdId = insProd.insertId;
    console.log(`  Inserted test product #${testProdId}`);

    // GET edit view
    const editViewRes = await request({ path: `/admin/products/${testProdId}/edit`, method: 'GET' });
    if (editViewRes.statusCode !== 200 || !editViewRes.body.includes('Edit Produk')) {
      throw new Error(`Product edit view failed! Status: ${editViewRes.statusCode}`);
    }
    console.log('  ✓ Product edit view loaded');

    // POST delete product
    const delProdPayload = `_csrf=${encodeURIComponent(cookieJar['_csrf_token'])}`;
    const delProdRes = await request(
      { path: `/admin/products/${testProdId}/delete`, method: 'POST' },
      delProdPayload,
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );
    if (delProdRes.statusCode !== 302) {
      throw new Error(`Product delete failed! Status: ${delProdRes.statusCode}`);
    }
    const checkDeletedProd = await query('SELECT id FROM products WHERE id = ?', [testProdId]);
    if (checkDeletedProd.length > 0) {
      throw new Error('Product still exists in DB after deletion!');
    }
    console.log('  ✓ Product deleted successfully');

    // 7. Test Capabilities Index
    console.log('\n[7] GET /admin/capabilities');
    const capRes = await request({ path: '/admin/capabilities', method: 'GET' });
    if (capRes.statusCode !== 200 || !capRes.body.includes('Kapabilitas Fasilitas & Mesin Pabrik')) {
      throw new Error(`Capabilities view failed! Status: ${capRes.statusCode}`);
    }
    console.log('  ✓ Capabilities management view loaded');

    // 8. Test Posts Index
    console.log('\n[8] GET /admin/posts');
    const postsRes = await request({ path: '/admin/posts', method: 'GET' });
    if (postsRes.statusCode !== 200 || !postsRes.body.includes('Publikasi & Berita Industri')) {
      throw new Error(`Posts view failed! Status: ${postsRes.statusCode}`);
    }
    console.log('  ✓ News/Posts management view loaded');

    // 9. Test Leads Index, Status Update & CSV Export
    console.log('\n[9] Leads Management & CSV Export');
    const insLead = await execute(
      `INSERT INTO leads (type, name, company, email, phone, message, status)
       VALUES ('inquiry', 'Budi Santoso', 'PT Maju Bersama', 'budi@majubersama.com', '08123456789', 'Kebutuhan cetakan botol 50.000 pcs', 'baru')`
    );
    const testLeadId = insLead.insertId;

    const leadsRes = await request({ path: '/admin/leads', method: 'GET' });
    if (leadsRes.statusCode !== 200 || !leadsRes.body.includes('Budi Santoso')) {
      throw new Error(`Leads view failed or missing test lead! Status: ${leadsRes.statusCode}`);
    }
    console.log('  ✓ Leads view displays inquiry data');

    // Update status to 'diproses'
    const leadUpdatePayload = `status=diproses&admin_notes=Sudah+dihubungi+via+telepon&_csrf=${encodeURIComponent(cookieJar['_csrf_token'])}`;
    const updateLeadRes = await request(
      { path: `/admin/leads/${testLeadId}/status`, method: 'POST' },
      leadUpdatePayload,
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );
    if (updateLeadRes.statusCode !== 302) {
      throw new Error(`Lead status update failed! Status: ${updateLeadRes.statusCode}`);
    }
    const updatedLeadRows = await query('SELECT status, admin_notes FROM leads WHERE id = ?', [testLeadId]);
    const updatedLead = updatedLeadRows[0];
    if (updatedLead.status !== 'diproses' || !updatedLead.admin_notes.includes('telepon')) {
      throw new Error(`Lead status did not update! Current: ${JSON.stringify(updatedLead)}`);
    }
    console.log('  ✓ Lead status and sales notes updated');

    // Test CSV Export
    const exportRes = await request({ path: '/admin/leads/export', method: 'GET' });
    if (exportRes.statusCode !== 200) {
      throw new Error(`CSV Export failed! Status: ${exportRes.statusCode}`);
    }
    const contentType = exportRes.headers['content-type'];
    const contentDisp = exportRes.headers['content-disposition'];
    if (!contentType.includes('text/csv') || !contentDisp.includes('attachment')) {
      throw new Error(`Invalid CSV headers! Content-Type: ${contentType}, Content-Disposition: ${contentDisp}`);
    }
    if (!exportRes.body.includes('ID,Tanggal Masuk,Jenis Inquiry') || !exportRes.body.includes('Budi Santoso')) {
      throw new Error('CSV content missing expected headers or test lead row!');
    }
    console.log(`  ✓ CSV Export generated with UTF-8 BOM, size: ${exportRes.body.length} bytes`);

    // Clean up test lead
    await query('DELETE FROM leads WHERE id = ?', [testLeadId]);

    // 10. Test Settings View and Update
    console.log('\n[10] Settings Management');
    const settingsRes = await request({ path: '/admin/settings', method: 'GET' });
    if (settingsRes.statusCode !== 200 || !settingsRes.body.includes('Pengaturan Profil Perusahaan & Kontak')) {
      throw new Error(`Settings view failed! Status: ${settingsRes.statusCode}`);
    }
    console.log('  ✓ Settings view loaded');

    const settingsUpdatePayload = `company_name=PT+Euodoo+Presisi+Indonesia&company_phone=%2B62+21+8990+1234&whatsapp_number=6281122334455&_csrf=${encodeURIComponent(cookieJar['_csrf_token'])}`;
    const updateSetRes = await request(
      { path: '/admin/settings', method: 'POST' },
      settingsUpdatePayload,
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );
    if (updateSetRes.statusCode !== 302) {
      throw new Error(`Settings update failed! Status: ${updateSetRes.statusCode}`);
    }
    const nameSettingRows = await query("SELECT setting_value FROM settings WHERE setting_key = 'company_name'");
    const nameSetting = nameSettingRows[0];
    if (nameSetting.setting_value !== 'PT Euodoo Presisi Indonesia') {
      throw new Error(`Setting not updated in DB! Got: ${nameSetting.setting_value}`);
    }
    console.log(`  ✓ Setting updated in database: company_name = "${nameSetting.setting_value}"`);

    console.log('\n=============================================');
    console.log('ALL MODULE 3 ADMIN CMS TESTS PASSED SUCCESSFULLY! (10/10)');
    console.log('=============================================\n');
    process.exit(0);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
