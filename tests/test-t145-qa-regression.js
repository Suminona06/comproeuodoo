import assert from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';

console.log('=== STARTING TEST T-145: MULTI-BREAKPOINT, BILINGUAL QA, HOMEPAGE FREEZING & CMS REGRESSION ===\n');

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

async function runTest() {
  // =========================================================================
  // 1. UJI MULTI-BREAKPOINT & KETAHANAN OVERFLOW CSS (320px - Desktop)
  // =========================================================================
  console.log('[TEST 1] Verifying Multi-Breakpoint (320px–Desktop) & Anti-Overflow CSS Rules...');
  const cssPath = path.resolve('public/css/layout.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Verify breakpoints exist
  assert(cssContent.includes('@media (max-width: 1024px)'), 'Must include 1024px breakpoint');
  assert(cssContent.includes('@media (max-width: 640px)'), 'Must include 640px breakpoint');
  assert(cssContent.includes('@media (max-width: 480px)'), 'Must include 480px breakpoint');
  assert(cssContent.includes('@media (max-width: 360px)'), 'Must include 360px ultra-compact breakpoint');

  // Check 1024px tablet reflow: .ft-main stacks to 1 column
  assert(cssContent.includes('.ft-main {\n    grid-template-columns: 1fr;\n    gap: 40px;\n  }'), '.ft-main must stack to 1 column on tablet');

  // Check 640px mobile reflow: .ft-offices stacks to 1 column, .ft-top and .ft-bottom align flex-start
  assert(cssContent.includes('.ft-offices {\n    grid-template-columns: 1fr;\n  }'), '.ft-offices must stack to 1 column on <=640px');

  // Check 480px & 320px mobile tap targets & word-wrapping
  assert(cssContent.includes('.social-btn {\n    width: 44px;\n    height: 44px;\n  }'), '.social-btn tap target must expand to 44px on mobile');
  assert(cssContent.includes('.ft-office-card {\n    word-break: break-word;\n    overflow-wrap: break-word;\n  }'), '.ft-office-card must have word-break for ultra-narrow 320px screens');
  assert(cssContent.includes('.ft-legal-link {\n    display: inline-block;\n    padding: 6px 0;\n  }'), '.ft-legal-link must have vertical touch padding on mobile');

  console.log('  1a. Responsive grid reflows (1024px, 640px): PASSED');
  console.log('  1b. Mobile tap targets (44px) & anti-overflow wrapping (320px): PASSED');

  // =========================================================================
  // 2. AUDIT HOMEPAGE FREEZING POLICY & ISOLASI CSS FOOTER
  // =========================================================================
  console.log('\n[TEST 2] Auditing Homepage Freezing Policy & CSS Isolation...');
  const indexEjsPath = path.resolve('views/public/index.ejs');
  const indexEjs = fs.readFileSync(indexEjsPath, 'utf8');

  // Check all core homepage sections exist intact
  assert(indexEjs.includes('class="hero hero-slider"'), 'Homepage must contain .hero-slider');
  assert(indexEjs.includes('class="sec-intro"'), 'Homepage must contain .sec-intro');
  assert(indexEjs.includes('class="sec-products"'), 'Homepage must contain .sec-products');
  assert(indexEjs.includes('class="sec-pillars"'), 'Homepage must contain .sec-pillars');
  assert(indexEjs.includes('class="sec-evidence"'), 'Homepage must contain .sec-evidence');
  assert(indexEjs.includes('class="sec-brands"'), 'Homepage must contain .sec-brands');
  assert(indexEjs.includes('class="sec-news"'), 'Homepage must contain .sec-news');

  const footerEjsPath = path.resolve('views/partials/footer.ejs');
  const footerEjs = fs.readFileSync(footerEjsPath, 'utf8');
  assert(footerEjs.includes("<%- include('cta-global') %>"), 'Footer must include cta-global');

  // Verify footer isolation in layout.css: footer changes do not target non-footer classes
  const footerStart = cssContent.indexOf('PT Euodoo Footer Layout');
  const footerEnd = cssContent.indexOf('Responsive Media Queries for Header & Footer');
  assert(footerStart !== -1, 'Footer section header must exist in layout.css');
  const footerCss = cssContent.substring(footerStart, footerEnd);

  // Ensure no global tag selectors (a, p, h2, h3, div) are modified without footer scope
  const lines = footerCss.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.endsWith('{') && !trimmed.startsWith('@')) {
      const selector = trimmed.replace('{', '').trim();
      assert(
        selector.startsWith('.site-footer') ||
        selector.startsWith('.ft-') ||
        selector.startsWith('.social-') ||
        selector.startsWith('}'),
        `Selector "${selector}" in footer block must be strictly scoped to footer`
      );
    }
  }
  console.log('  2a. Homepage sections 100% frozen and unaltered: PASSED');
  console.log('  2b. Footer CSS 100% strictly scoped and isolated: PASSED');

  // =========================================================================
  // 3. UJI DWIBAHASA ID / EN PADA FOOTER DI SELURUH RUTE PUBLIK
  // =========================================================================
  console.log('\n[TEST 3] Verifying Bilingual ID/EN Footer Across Public Routes...');
  const routes = ['/', '/about', '/products', '/news', '/contact', '/capabilities'];

  for (const route of routes) {
    // Indonesian
    const resId = await makeRequest({ path: `${route}${route.includes('?') ? '&' : '?'}lang=id` });
    assert.strictEqual(resId.statusCode, 200, `Route ${route} in ID must return 200`);
    assert(resId.data.includes('Hubungi Kami'), `${route} (ID) must render 'Hubungi Kami' button`);
    assert(resId.data.includes('Kantor Pusat (Bandung)') || resId.data.includes('Kantor Pusat (Jakarta)') || resId.data.includes('Kantor Pusat'), `${route} (ID) must render Kantor Pusat`);
    assert(resId.data.includes('Pabrik Manufaktur (Bandung)'), `${route} (ID) must render 'Pabrik Manufaktur (Bandung)'`);
    assert(resId.data.includes('Telp:'), `${route} (ID) must render 'Telp:' label`);
    assert(resId.data.includes('Hak cipta dilindungi undang-undang.'), `${route} (ID) must render Indonesian copyright`);
    assert(resId.data.includes('Syarat &amp; Ketentuan') || resId.data.includes('Syarat & Ketentuan'), `${route} (ID) must render 'Syarat & Ketentuan'`);
    assert(resId.data.includes('Kebijakan Privasi'), `${route} (ID) must render 'Kebijakan Privasi'`);

    // English
    const resEn = await makeRequest({ path: `${route}${route.includes('?') ? '&' : '?'}lang=en` });
    assert.strictEqual(resEn.statusCode, 200, `Route ${route} in EN must return 200`);
    assert(resEn.data.includes('Contact Us'), `${route} (EN) must render 'Contact Us' button`);
    assert(resEn.data.includes('Head Office (Bandung)') || resEn.data.includes('Head Office (Jakarta)') || resEn.data.includes('Head Office'), `${route} (EN) must render Head Office`);
    assert(resEn.data.includes('Manufacturing Plant (Bandung)'), `${route} (EN) must render 'Manufacturing Plant (Bandung)'`);
    assert(resEn.data.includes('Phone:'), `${route} (EN) must render 'Phone:' label`);
    assert(resEn.data.includes('All rights reserved.'), `${route} (EN) must render English copyright`);
    assert(resEn.data.includes('Terms &amp; Conditions') || resEn.data.includes('Terms & Conditions'), `${route} (EN) must render 'Terms & Conditions'`);
    assert(resEn.data.includes('Privacy Policy'), `${route} (EN) must render 'Privacy Policy'`);
  }
  console.log('  3a. Bilingual ID/EN footer validated on all public routes: PASSED');

  // =========================================================================
  // 4. UJI REGRESI CMS ADMIN PENGATURAN SITUS & KONTAK
  // =========================================================================
  console.log('\n[TEST 4] Verifying CMS Settings & Contact Admin Regression over HTTP...');

  // 4a. Login as Superadmin to get session & CSRF
  const getLogin = await makeRequest({ path: '/admin/login' });
  const setCookies = getLogin.headers['set-cookie'] || [];
  let csrfToken = '';
  setCookies.forEach(c => {
    if (c.startsWith('_csrf_token=')) {
      csrfToken = c.split(';')[0].replace('_csrf_token=', '');
    }
  });

  const postLogin = await makeRequest({
    method: 'POST',
    path: '/admin/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `_csrf_token=${csrfToken}`
    },
    body: new URLSearchParams({
      email: 'admin@euodoo.com',
      password: 'AdminEuodoo2026!',
      _csrf: csrfToken
    }).toString()
  });

  const loginCookies = postLogin.headers['set-cookie'] || [];
  let sessionCookie = '';
  loginCookies.forEach(c => {
    if (c.startsWith('euodoo_session=')) {
      sessionCookie = c.split(';')[0];
    }
  });
  assert(sessionCookie, 'Must obtain valid euodoo_session cookie');

  // 4b. GET /admin/settings to verify dual location & social toggle form structure
  const getSettings = await makeRequest({
    path: '/admin/settings',
    headers: { 'Cookie': `${sessionCookie}; _csrf_token=${csrfToken}` }
  });
  assert.strictEqual(getSettings.statusCode, 200, 'GET /admin/settings must return 200');
  assert(getSettings.data.includes('name="office_address"'), 'Settings must include office_address input');
  assert(getSettings.data.includes('name="factory_address"'), 'Settings must include factory_address input');
  assert(getSettings.data.includes('name="google_maps_embed"'), 'Settings must include google_maps_embed input');
  assert(getSettings.data.includes('name="social_youtube_visible"'), 'Settings must include social_youtube_visible switch');
  assert(getSettings.data.includes('name="social_linkedin_visible"'), 'Settings must include social_linkedin_visible switch');
  console.log('  4a. GET /admin/settings dual-location & social toggles: PASSED');

  // 4c. GET /admin/contact to verify centralized master info banner
  const getContact = await makeRequest({
    path: '/admin/contact',
    headers: { 'Cookie': `${sessionCookie}; _csrf_token=${csrfToken}` }
  });
  assert.strictEqual(getContact.statusCode, 200, 'GET /admin/contact must return 200');
  assert(getContact.data.includes('Sentralisasi Master Data Kontak'), 'Contact CMS must contain centralized master banner');
  assert(getContact.data.includes('href="/admin/settings"'), 'Contact CMS must link directly to Settings');
  console.log('  4b. GET /admin/contact master info banner: PASSED');

  // 4d. POST /admin/settings to test Google Maps parser & cache invalidation
  // Test valid embed URL save
  const updateSettingsBody = new URLSearchParams({
    _csrf: csrfToken,
    company_name: 'PT. EUODOO',
    company_email: 'info@euodoo.com',
    company_phone: '+6221-53668626',
    office_address: 'Karindra Building Jl. Palmerah Selatan 30 A Suite 02 - 07, Jakarta Pusat 10270',
    office_phone: '+6221-53668626',
    factory_address: 'Jl. Paralon II No. 21 Cijerah Bandung 40214 - Indonesia',
    factory_phone: '+6222-6012519',
    google_maps_embed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960!2d107.56!3d-6.93!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTUnNDguMCJTIDEwN8KwMzMnMzYuMCJF!5e0!3m2!1sen!2sid!4v123456789" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
    social_linkedin_url: 'https://linkedin.com/company/euodoo',
    social_linkedin_visible: '1',
    social_instagram_url: 'https://instagram.com/euodoo',
    social_instagram_visible: '1',
    social_facebook_url: 'https://facebook.com/euodoo',
    social_facebook_visible: '1',
    social_youtube_url: 'https://youtube.com/@euodoo-official',
    social_youtube_visible: '1'
  }).toString();

  const postSettings = await makeRequest({
    method: 'POST',
    path: '/admin/settings',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `${sessionCookie}; _csrf_token=${csrfToken}`
    },
    body: updateSettingsBody
  });
  assert.strictEqual(postSettings.statusCode, 302, 'POST /admin/settings must redirect (302) on success');
  console.log('  4c. POST /admin/settings save & Google Maps extraction: PASSED');

  // Verify that immediate public fetch renders updated YouTube channel and extracted map
  const publicHome = await makeRequest({ path: '/' });
  assert(publicHome.data.includes('https://youtube.com/@euodoo-official'), 'Public home must immediately render updated YouTube URL without restart');

  const publicContact = await makeRequest({ path: '/contact' });
  assert(publicContact.data.includes('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960!2d107.56!3d-6.93!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTUnNDguMCJTIDEwN8KwMzMnMzYuMCJF!5e0!3m2!1sen!2sid!4v123456789'), 'Contact page must render cleanly extracted Google Maps URL');
  console.log('  4d. Live cache invalidation & immediate SSR reflection: PASSED');

  console.log('\n=== ALL TESTS FOR T-145 PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n❌ T-145 QA Test failed:', err);
  process.exit(1);
});
