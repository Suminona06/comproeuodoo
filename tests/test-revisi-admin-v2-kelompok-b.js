import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, execute } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = 'http://localhost:3000';

async function runKelompokBTests() {
  console.log('--- STARTING REVISI ADMIN V2 KELOMPOK B TEST SUITE (T-73 & T-74) ---\n');

  // Step 1: Login Admin
  console.log('[1] Login Admin Superadmin...');
  const loginPageRes = await fetch(`${BASE_URL}/admin/login`);
  const loginHtml = await loginPageRes.text();
  const rawCookies = loginPageRes.headers.get('set-cookie') || '';
  const initialCookie = rawCookies.split(';')[0];

  const csrfMatch = loginHtml.match(/name="_csrf"\s+value="([^"]+)"/);
  assert(csrfMatch, 'CSRF token must be present in admin login page');
  const csrfToken = csrfMatch[1];

  const loginRes = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': initialCookie
    },
    body: new URLSearchParams({
      email: 'admin@euodoo.com',
      password: 'AdminEuodoo2026!',
      _csrf: csrfToken
    }),
    redirect: 'manual'
  });

  const loginCookies = loginRes.headers.get('set-cookie') || '';
  const sessionMatch = loginCookies.match(/euodoo_session=[^;]+/);
  assert(sessionMatch, 'Login must set euodoo_session cookie');
  const sessionCookie = sessionMatch[0];
  const authCookieHeader = `${sessionCookie}; ${initialCookie}`;
  console.log('  ✓ Admin logged in successfully\n');

  // Step 2: T-73 Test - TinyMCE Self-Hosted Static Assets & Views
  console.log('[2] T-73 Test: TinyMCE Self-Hosted Assets & Template Integration...');
  
  // Test static JS bundle
  const tinymceJsRes = await fetch(`${BASE_URL}/tinymce/tinymce.min.js`);
  assert.strictEqual(tinymceJsRes.status, 200, 'TinyMCE JS bundle must be accessible');
  const tinymceJsContentType = tinymceJsRes.headers.get('content-type') || '';
  assert(tinymceJsContentType.includes('javascript'), 'TinyMCE JS bundle must have javascript content-type');
  console.log('  ✓ /tinymce/tinymce.min.js served with 200 OK');

  // Test static skin & theme assets
  const skinCssRes = await fetch(`${BASE_URL}/tinymce/skins/ui/oxide/skin.min.css`);
  assert.strictEqual(skinCssRes.status, 200, 'TinyMCE Oxide skin must be accessible');
  console.log('  ✓ /tinymce/skins/ui/oxide/skin.min.css served with 200 OK');

  const themeJsRes = await fetch(`${BASE_URL}/tinymce/themes/silver/theme.min.js`);
  assert.strictEqual(themeJsRes.status, 200, 'TinyMCE Silver theme must be accessible');
  console.log('  ✓ /tinymce/themes/silver/theme.min.js served with 200 OK');

  // Test custom CSS theme
  const customCssRes = await fetch(`${BASE_URL}/css/admin-tinymce.css`);
  assert.strictEqual(customCssRes.status, 200, 'Custom admin-tinymce.css must be accessible');
  const customCssText = await customCssRes.text();
  assert(customCssText.includes('.tox-tinymce'), 'admin-tinymce.css must style .tox-tinymce container');
  assert(customCssText.includes('#0055B8'), 'admin-tinymce.css must reference brand blue color');
  console.log('  ✓ /css/admin-tinymce.css verified with design token styling');

  // Test client initializer script
  const customJsRes = await fetch(`${BASE_URL}/js/admin-editor.js`);
  assert.strictEqual(customJsRes.status, 200, 'Custom admin-editor.js must be accessible');
  const customJsText = await customJsRes.text();
  assert(customJsText.includes('tinymce.init'), 'admin-editor.js must call tinymce.init');
  assert(customJsText.includes('uploadImageHandler'), 'admin-editor.js must define uploadImageHandler');
  console.log('  ✓ /js/admin-editor.js verified with editor initialization logic');

  // Test create post view integration
  const createViewRes = await fetch(`${BASE_URL}/admin/posts/create`, {
    headers: { 'Cookie': authCookieHeader }
  });
  assert.strictEqual(createViewRes.status, 200, 'Create post view must return 200');
  const createHtml = await createViewRes.text();
  assert(createHtml.includes('/css/admin-tinymce.css'), 'Create post view must link admin-tinymce.css');
  assert(createHtml.includes('/tinymce/tinymce.min.js'), 'Create post view must script tinymce.min.js');
  assert(createHtml.includes('/js/admin-editor.js'), 'Create post view must script admin-editor.js');
  assert(createHtml.includes('id="content_id"'), 'Create post view must contain content_id textarea');
  assert(createHtml.includes('id="content_en"'), 'Create post view must contain content_en textarea');
  console.log('  ✓ /admin/posts/create renders TinyMCE styles and scripts');

  // Extract csrf token for subsequent tests
  const adminCsrfMatch = createHtml.match(/name="csrf-token"\s+content="([^"]+)"/) || createHtml.match(/_csrf=([a-f0-9]+)/);
  const activeCsrfToken = adminCsrfMatch ? adminCsrfMatch[1] : csrfToken;

  // Step 3: T-74 Test - Image Upload Endpoint & Sharp WebP Conversion
  console.log('\n[3] T-74 Test: TinyMCE Image Upload Endpoint (POST /admin/posts/upload-image)...');

  // 3a. Unauthenticated upload test
  const unauthUploadRes = await fetch(`${BASE_URL}/admin/posts/upload-image?_csrf=${activeCsrfToken}`, {
    method: 'POST',
    redirect: 'manual'
  });
  assert([302, 401, 403].includes(unauthUploadRes.status), 'Unauthenticated upload must be rejected with 302/401/403');
  console.log('  ✓ Unauthenticated upload rejected as expected');

  // 3b. Missing CSRF token test
  const noCsrfFormData = new FormData();
  const test1Blob = new Blob(['sample-fake-image-bytes'], { type: 'image/png' });
  noCsrfFormData.append('file', test1Blob, 'test.png');
  const noCsrfRes = await fetch(`${BASE_URL}/admin/posts/upload-image`, {
    method: 'POST',
    headers: { 'Cookie': authCookieHeader },
    body: noCsrfFormData
  });
  assert.strictEqual(noCsrfRes.status, 403, 'Upload without CSRF must return 403 Forbidden');
  console.log('  ✓ Upload without CSRF token blocked with 403 Forbidden');

  // 3c. Missing file / empty submit test
  const emptyFormData = new FormData();
  const emptyRes = await fetch(`${BASE_URL}/admin/posts/upload-image?_csrf=${activeCsrfToken}`, {
    method: 'POST',
    headers: { 'Cookie': authCookieHeader },
    body: emptyFormData
  });
  assert.strictEqual(emptyRes.status, 400, 'Empty upload must return 400 Bad Request');
  const emptyJson = await emptyRes.json();
  assert(emptyJson.error, 'Response must include error message');
  console.log('  ✓ Empty file upload rejected with 400 Bad Request');

  // 3d. Valid Image Upload & WebP Conversion
  // Create a genuine 100x100 PNG using Sharp
  const sharp = (await import('sharp')).default;
  const testPngBuffer = await sharp({
    create: {
      width: 200,
      height: 150,
      channels: 4,
      background: { r: 0, g: 85, b: 184, alpha: 1 }
    }
  }).png().toBuffer();

  const uploadFormData = new FormData();
  const imageBlob = new Blob([testPngBuffer], { type: 'image/png' });
  uploadFormData.append('file', imageBlob, 'article-illustration.png');

  const uploadRes = await fetch(`${BASE_URL}/admin/posts/upload-image?_csrf=${activeCsrfToken}`, {
    method: 'POST',
    headers: { 'Cookie': authCookieHeader },
    body: uploadFormData
  });

  assert.strictEqual(uploadRes.status, 200, 'Valid image upload must return 200 OK');
  const uploadJson = await uploadRes.json();
  assert(uploadJson.location, 'Response must contain location property for TinyMCE');
  assert(uploadJson.location.startsWith('/uploads/posts/'), 'Location must point to /uploads/posts/');
  assert(uploadJson.location.endsWith('.webp'), 'Uploaded image must be converted to .webp');

  const savedDiskPath = path.join(rootDir, 'public', uploadJson.location.replace(/^\//, ''));
  assert(fs.existsSync(savedDiskPath), 'Converted WebP file must exist on disk');
  
  // Verify converted image metadata with Sharp
  const imageMeta = await sharp(savedDiskPath).metadata();
  assert.strictEqual(imageMeta.format, 'webp', 'Saved image format must be WebP');
  assert.strictEqual(imageMeta.width, 200, 'Saved image width verified');
  console.log(`  ✓ Image upload succeeded: ${uploadJson.location} (WebP format verified on disk)`);

  // Step 4: End-to-End Rich Text Article Lifecycle
  console.log('\n[4] End-to-End Rich Text Article Lifecycle...');
  const testArticleSlug = `uji-tinymce-${Date.now()}`;
  const richHtmlId = `<h2>Inovasi Produk Baru</h2><p>PT Euodoo telah meluncurkan <strong>kemasan ramah lingkungan</strong> dengan standar industri.</p><img src="${uploadJson.location}" alt="Inovasi"><p>Pelajari selengkapnya di situs kami.</p>`;
  const richHtmlEn = `<h2>New Product Innovation</h2><p>PT Euodoo has launched <strong>eco-friendly packaging</strong> meeting industrial standards.</p>`;

  const postFormData = new FormData();
  postFormData.append('type', 'berita');
  postFormData.append('title_id', 'Artikel Uji TinyMCE');
  postFormData.append('title_en', 'TinyMCE Test Article');
  postFormData.append('slug', testArticleSlug);
  postFormData.append('status', 'draft');
  postFormData.append('content_id', richHtmlId);
  postFormData.append('content_en', richHtmlEn);

  const createPostRes = await fetch(`${BASE_URL}/admin/posts?_csrf=${activeCsrfToken}`, {
    method: 'POST',
    headers: { 'Cookie': authCookieHeader },
    body: postFormData,
    redirect: 'manual'
  });

  console.log('  Create post redirect location:', createPostRes.headers.get('location'));
  assert.strictEqual(createPostRes.status, 302, 'Post creation must redirect with 302');
  const redirectLoc = createPostRes.headers.get('location') || '';
  assert(redirectLoc.includes('success'), 'Redirect location should include success param: ' + redirectLoc);
  console.log('  ✓ Article created with rich HTML content');

  // Verify in database
  const createdRows = await query('SELECT * FROM posts WHERE slug = ?', [testArticleSlug]);
  assert(createdRows && createdRows.length > 0, 'Created article must exist in database');
  const createdPost = createdRows[0];
  assert.strictEqual(createdPost.content_id, richHtmlId, 'HTML tags in content_id must be preserved intact');
  assert.strictEqual(createdPost.content_en, richHtmlEn, 'HTML tags in content_en must be preserved intact');
  console.log('  ✓ Database record verified with preserved HTML tags and structure');

  // Verify edit view renders TinyMCE assets and loads saved content
  const editViewRes = await fetch(`${BASE_URL}/admin/posts/${createdPost.id}/edit`, {
    headers: { 'Cookie': authCookieHeader }
  });
  assert.strictEqual(editViewRes.status, 200, 'Edit post view must return 200 OK');
  const editHtml = await editViewRes.text();
  assert(editHtml.includes('/css/admin-tinymce.css'), 'Edit view must include admin-tinymce.css');
  assert(editHtml.includes('/tinymce/tinymce.min.js'), 'Edit view must include tinymce.min.js');
  assert(editHtml.includes('/js/admin-editor.js'), 'Edit view must include admin-editor.js');
  assert(editHtml.includes('Inovasi Produk Baru'), 'Edit view textarea must populate saved HTML content');
  console.log('  ✓ /admin/posts/:id/edit view correctly populates rich HTML content');

  // Clean up
  await execute('DELETE FROM posts WHERE id = ?', [createdPost.id]);
  if (fs.existsSync(savedDiskPath)) {
    fs.unlinkSync(savedDiskPath);
  }
  console.log('  ✓ Test article and uploaded test image cleaned up');

  console.log('\n========================================================================');
  console.log('ALL KELOMPOK B TASKS (T-73 & T-74) PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
}

runKelompokBTests().catch((err) => {
  console.error('\n❌ KELOMPOK B TEST FAILED:', err);
  process.exit(1);
});
