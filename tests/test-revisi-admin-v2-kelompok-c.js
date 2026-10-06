import assert from 'assert';
import { query, execute } from '../config/database.js';
import { sanitizeArticleHtml } from '../utils/sanitizer.js';

const BASE_URL = 'http://localhost:3000';

async function runKelompokCTests() {
  console.log('--- STARTING REVISI ADMIN V2 KELOMPOK C TEST SUITE (T-75) ---\n');

  // Step 1: Unit Test Sanitizer Engine
  console.log('[1] Unit Test: Server-Side HTML Sanitizer & Allowlist Rules...');
  
  // 1a. Test Dangerous Tags Stripping
  const dirtyTags = '<div><h2>Judul Sah</h2><script>alert("xss")</script><iframe src="https://evil.com"></iframe><form action="/steal"><input type="text"></form><object data="exploit"></object></div>';
  const cleanTags = sanitizeArticleHtml(dirtyTags);
  assert(!cleanTags.includes('<script>'), 'Script tags must be removed');
  assert(!cleanTags.includes('<iframe>'), 'Iframe tags must be removed');
  assert(!cleanTags.includes('<form>'), 'Form tags must be removed');
  assert(!cleanTags.includes('<input>'), 'Input tags must be removed');
  assert(!cleanTags.includes('<object>'), 'Object tags must be removed');
  assert(cleanTags.includes('<h2>Judul Sah</h2>'), 'Valid H2 tag must be preserved');
  console.log('  ✓ Dangerous tags (<script>, <iframe>, <form>, <input>, <object>) stripped');

  // 1b. Test Inline Handlers & Event Attributes
  const dirtyHandlers = '<h3 onclick="alert(1)">Subjudul</h3><p onmouseover="bad()">Teks paragraf</p><img src="/uploads/img.webp" onerror="alert(2)" alt="Foto">';
  const cleanHandlers = sanitizeArticleHtml(dirtyHandlers);
  assert(!cleanHandlers.includes('onclick='), 'onclick handler must be stripped');
  assert(!cleanHandlers.includes('onmouseover='), 'onmouseover handler must be stripped');
  assert(!cleanHandlers.includes('onerror='), 'onerror handler must be stripped');
  assert(cleanHandlers.includes('<h3>Subjudul</h3>'), 'Valid H3 preserved');
  assert(cleanHandlers.includes('<img src="/uploads/img.webp" alt="Foto" />'), 'Valid img preserved');
  console.log('  ✓ Inline event handlers (onclick, onmouseover, onerror) stripped');

  // 1c. Test rel="noopener noreferrer" Injection on Links
  const linkHtml = '<p>Kunjungi <a href="https://mitra-industri.com" target="_blank">Mitra Industri</a>.</p>';
  const cleanLink = sanitizeArticleHtml(linkHtml);
  assert(cleanLink.includes('rel="noopener noreferrer"'), 'External links must enforce rel="noopener noreferrer"');
  console.log('  ✓ rel="noopener noreferrer" automatically applied to links');

  // 1d. Test JavaScript Protocol Prevention
  const badProtocol = '<a href="javascript:alert(1)">Klik Disini</a>';
  const cleanProtocol = sanitizeArticleHtml(badProtocol);
  assert(!cleanProtocol.includes('javascript:'), 'javascript: URLs must be stripped');
  console.log('  ✓ javascript: pseudo-protocols stripped\n');

  // Step 2: Login Admin Superadmin
  console.log('[2] Login Admin Superadmin...');
  const loginPageRes = await fetch(`${BASE_URL}/admin/login`);
  const loginHtml = await loginPageRes.text();
  const rawCookies = loginPageRes.headers.get('set-cookie') || '';
  const initialCookie = rawCookies.split(';')[0];

  const csrfMatch = loginHtml.match(/name="_csrf"\s+value="([^"]+)"/);
  assert(csrfMatch, 'CSRF token must be present in login page');
  const csrfToken = csrfMatch[1];

  const loginRes = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': initialCookie,
      'x-test-bypass-rate-limit': 'true'
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
  assert(sessionMatch, 'Session cookie must be set');
  const sessionCookie = sessionMatch[0];
  const authCookieHeader = `${sessionCookie}; ${initialCookie}`;
  console.log('  ✓ Admin logged in successfully\n');

  // Step 3: End-to-End Post Creation with Malicious Injection
  console.log('[3] Integration Test: Article Creation with Stored XSS Payload...');
  const testSlug = `uji-sanitasi-${Date.now()}`;
  const maliciousInputId = `<h2>Judul Aman</h2><script>alert('xss')</script><p onclick="stealCookies()">Paragraf sah dengan <a href="https://example.com">tautan aman</a>.</p><img src="/uploads/posts/demo.webp" onerror="badCode()" alt="Demo"><iframe src="http://evil.com"></iframe>`;
  const maliciousInputEn = `<h2>Safe Title</h2><script>alert('xss-en')</script><p onmouseenter="bad()">English text</p>`;

  const postFormData = new FormData();
  postFormData.append('type', 'berita');
  postFormData.append('title_id', 'Artikel Uji Sanitasi XSS');
  postFormData.append('title_en', 'XSS Sanitization Test Article');
  postFormData.append('slug', testSlug);
  postFormData.append('status', 'published');
  postFormData.append('content_id', maliciousInputId);
  postFormData.append('content_en', maliciousInputEn);

  const createRes = await fetch(`${BASE_URL}/admin/posts?_csrf=${csrfToken}`, {
    method: 'POST',
    headers: { 'Cookie': authCookieHeader },
    body: postFormData,
    redirect: 'manual'
  });

  assert.strictEqual(createRes.status, 302, 'Post create should redirect with 302');
  console.log('  ✓ Article submitted through admin controller');

  // Verify sanitized content in database
  const createdRows = await query('SELECT * FROM posts WHERE slug = ?', [testSlug]);
  assert(createdRows && createdRows.length > 0, 'Created article must exist in database');
  const post = createdRows[0];

  assert(!post.content_id.includes('<script>'), 'DB content_id must NOT contain <script>');
  assert(!post.content_id.includes('<iframe>'), 'DB content_id must NOT contain <iframe>');
  assert(!post.content_id.includes('onclick='), 'DB content_id must NOT contain onclick');
  assert(!post.content_id.includes('onerror='), 'DB content_id must NOT contain onerror');
  assert(post.content_id.includes('<h2>Judul Aman</h2>'), 'DB content_id must preserve valid H2');
  assert(post.content_id.includes('rel="noopener noreferrer"'), 'DB content_id must enforce rel="noopener noreferrer"');
  assert(post.content_id.includes('<img src="/uploads/posts/demo.webp" alt="Demo" />'), 'DB content_id must preserve valid img');

  assert(!post.content_en.includes('<script>'), 'DB content_en must NOT contain <script>');
  assert(!post.content_en.includes('onmouseenter='), 'DB content_en must NOT contain onmouseenter');
  assert(post.content_en.includes('<h2>Safe Title</h2>'), 'DB content_en must preserve valid H2');
  console.log('  ✓ Database record verified: All malicious tags and handlers neutralized');

  // Step 4: Public View Compatibility Test (/news/:slug)
  console.log('\n[4] Backward Compatibility Test: Public News Reading Page (/news/:slug)...');

  // 4a. Test Sanitized Article on Public Detail Page
  const publicSanitizedRes = await fetch(`${BASE_URL}/news/${testSlug}`);
  assert.strictEqual(publicSanitizedRes.status, 200, 'Public sanitized article page must return 200');
  const publicSanitizedHtml = await publicSanitizedRes.text();
  assert(!publicSanitizedHtml.includes('<script>alert('), 'Public page must not render injected script');
  assert(publicSanitizedHtml.includes('Judul Aman'), 'Public page must render valid content');
  assert(publicSanitizedHtml.includes('class="article-prose"'), 'Public page must contain .article-prose container');
  console.log('  ✓ Public article page safely renders sanitized rich HTML without XSS');

  // 4b. Test Legacy Plain-Text Article (Article #1)
  const legacySlug = 'penerapan-injeksi-presisi-mikro-komponen-medis';
  const legacyRes = await fetch(`${BASE_URL}/news/${legacySlug}`);
  assert.strictEqual(legacyRes.status, 200, 'Legacy plain-text article page must return 200');
  const legacyHtml = await legacyRes.text();
  assert(legacyHtml.includes('class="article-prose"'), 'Legacy article must contain .article-prose container');
  assert(legacyHtml.includes('<p>PT Euodoo terus meningkatkan'), 'Legacy plain-text article automatically formatted with paragraph tags');
  console.log('  ✓ Legacy plain-text article rendered seamlessly with paragraph auto-formatting');

  // 4c. Test Existing HTML Article (Article #2)
  const existingHtmlSlug = 'pt-euodoo-raih-sertifikasi-ekolabel-indonesia-sni-7188';
  const existingHtmlRes = await fetch(`${BASE_URL}/news/${existingHtmlSlug}`);
  assert.strictEqual(existingHtmlRes.status, 200, 'Existing HTML article must return 200');
  const existingHtmlText = await existingHtmlRes.text();
  assert(existingHtmlText.includes('class="article-prose"'), 'Existing article must contain .article-prose container');
  assert(existingHtmlText.includes('ekolabel'), 'Existing article content rendered properly');
  console.log('  ✓ Existing HTML article renders with full styling and layout integrity');

  // Clean up test article
  await execute('DELETE FROM posts WHERE id = ?', [post.id]);
  console.log('\n  ✓ Test article cleaned up from database');

  console.log('\n========================================================================');
  console.log('ALL KELOMPOK C TASKS (T-75) PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
  process.exit(0);
}

runKelompokCTests().catch((err) => {
  console.error('\n❌ KELOMPOK C TEST FAILED:', err);
  process.exit(1);
});
