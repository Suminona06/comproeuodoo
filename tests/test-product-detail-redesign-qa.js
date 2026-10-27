import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

function request(pathUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: 3000,
      path: pathUrl,
      method: options.method || 'GET',
      headers: {
        Host: '127.0.0.1:3000',
        ...(options.headers || {})
      }
    };
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function calculateLuminance(r, g, b) {
  const linearize = (val) => {
    const c = val / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function calculateContrastRatio(rgb1, rgb2) {
  const lum1 = calculateLuminance(...rgb1);
  const lum2 = calculateLuminance(...rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

console.log('=== STARTING T-203 COMPREHENSIVE QA & REGRESSION AUDIT ===');

async function runFullQA() {
  let passedModules = 0;

  console.log('\n[1/7] AUDITING WCAG AA COLOR CONTRAST & ACCESSIBILITY TOKENS...');
  {
    const white = [255, 255, 255];
    const surfaceDark = [7, 31, 23];
    const textPrimary = [0, 117, 90];
    const primaryDark = [0, 87, 63];
    const ink1 = [15, 23, 42];
    const ink2 = [71, 85, 105];
    const ink3 = [100, 116, 139];
    const borderMain = [226, 232, 240];

    const ratioInk1 = calculateContrastRatio(ink1, white);
    assert(ratioInk1 >= 4.5, `ink-1 contrast ${ratioInk1.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - Ink 1 (#0f172a on white): ${ratioInk1.toFixed(2)}:1 (PASS >= 4.5:1)`);

    const ratioInk2 = calculateContrastRatio(ink2, white);
    assert(ratioInk2 >= 4.5, `ink-2 contrast ${ratioInk2.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - Ink 2 (#475569 on white): ${ratioInk2.toFixed(2)}:1 (PASS >= 4.5:1)`);

    const ratioPrimary = calculateContrastRatio(textPrimary, white);
    assert(ratioPrimary >= 4.5, `primary contrast ${ratioPrimary.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - Primary accent (#00755a on white): ${ratioPrimary.toFixed(2)}:1 (PASS >= 4.5:1)`);

    const ratioWhiteOnPrimary = calculateContrastRatio(white, textPrimary);
    assert(ratioWhiteOnPrimary >= 4.5, `white on primary button ${ratioWhiteOnPrimary.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - White on primary button (#ffffff on #00755a): ${ratioWhiteOnPrimary.toFixed(2)}:1 (PASS >= 4.5:1)`);

    const ratioSurfaceDark = calculateContrastRatio(surfaceDark, white);
    assert(ratioSurfaceDark >= 4.5, `surface dark contrast ${ratioSurfaceDark.toFixed(2)} must be >= 4.5:1`);
    console.log(`  - Surface Dark (#071f17 on white): ${ratioSurfaceDark.toFixed(2)}:1 (PASS >= 4.5:1)`);

    passedModules++;
  }

  console.log('\n[2/7] AUDITING PUBLIC PRODUCT DETAIL PAGE (ID & EN)...');
  {
    const resId = await request('/products/soft-loop-handle-shopping-bag?lang=id');
    assert.strictEqual(resId.statusCode, 200, 'Product detail (ID) must return HTTP 200');
    assert(resId.body.includes('pd-card'), 'Detail page must render .pd-card component');
    assert(resId.body.includes('pd-title'), 'Detail page must render .pd-title');
    assert(resId.body.includes('pd-gallery'), 'Detail page must render .pd-gallery');
    assert(resId.body.includes('pd-tabs'), 'Detail page must render tab bar');
    assert(resId.body.includes('Deskripsi'), 'Detail ID must have Indonesian tab label');
    assert(resId.body.includes('Tabel Ukuran') || resId.body.includes('Spesifikasi'), 'Detail ID must render size table tab');
    assert(!resId.body.includes('pd-sticky-cta'), 'Detail page must NOT render sticky CTA bar (distilled)');
    console.log('  - Product detail (ID) structure & components: PASS');

    const resEn = await request('/products/soft-loop-handle-shopping-bag?lang=en');
    assert.strictEqual(resEn.statusCode, 200, 'Product detail (EN) must return HTTP 200');
    assert(resEn.body.includes('Overview') || resEn.body.includes('Description'), 'Detail EN must render English tab label');
    assert(resEn.body.includes('Size Chart') || resEn.body.includes('Size Table'), 'Detail EN must render English size table label');
    assert(resEn.body.includes('Contact Us via WhatsApp') || resEn.body.includes('WhatsApp'), 'Detail EN must render English WhatsApp label');
    assert(resEn.body.includes('Request a Quote') || resEn.body.includes('RFQ'), 'Detail EN must render English RFQ label');
    console.log('  - Product detail (EN) bilingual labels & structure: PASS');

    passedModules++;
  }

  console.log('\n[3/7] AUDITING CSP, INLINE STYLES, INLINE HANDLERS & COMMENTS HYGIENE...');
  {
    const res = await request('/products/soft-loop-handle-shopping-bag');
    assert.strictEqual(res.statusCode, 200);

    const cspHeader = res.headers['content-security-policy'] || res.headers['content-security-policy-report-only'];
    assert(cspHeader, 'Response headers must include Content-Security-Policy');
    assert(cspHeader.includes("default-src 'self'"), 'CSP must define default-src self');
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff', 'X-Content-Type-Options must be nosniff');
    console.log('  - Helmet CSP & security headers: PASS');

    const mainMatch = res.body.match(/<main[\s\S]*?<\/main>/i);
    const mainHtml = mainMatch ? mainMatch[0] : res.body;

    const inlineHandlerRegex = /\son[a-zA-Z]+\s*=\s*["'][^"']*["']/g;
    const inlineHandlers = mainHtml.match(inlineHandlerRegex) || [];
    assert.strictEqual(inlineHandlers.length, 0, `Inline event handlers found: ${inlineHandlers.join(', ')}`);
    console.log('  - Zero inline event handlers (onclick, onchange, etc.): PASS');

    const cardMatch = res.body.match(/<section class="pd-card"[\s\S]*?<\/section>/i);
    if (cardMatch) {
      const inlineStyleRegex = /\sstyle\s*=\s*["'][^"']*["']/g;
      const inlineStyles = cardMatch[0].match(inlineStyleRegex) || [];
      assert.strictEqual(inlineStyles.length, 0, `Inline styles found in .pd-card: ${inlineStyles.join(', ')}`);
      console.log('  - Zero inline styles in .pd-card: PASS');
    }

    const htmlCommentRegex = /<!--(?!\[if)[\s\S]*?-->/g;
    const comments = (mainHtml.match(htmlCommentRegex) || []).filter(c => !c.includes('__VUE') && !c.includes('react'));
    assert.strictEqual(comments.length, 0, `HTML comments found in inspected output: ${comments.join(', ')}`);
    console.log('  - Zero HTML comments rendered to client inspect element: PASS');

    const inlineScriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
    const unallowedInlineScripts = [];
    let scriptMatch;
    while ((scriptMatch = inlineScriptRegex.exec(res.body)) !== null) {
      const content = scriptMatch[1].trim();
      if (content.length > 0 && !scriptMatch[0].includes('application/ld+json')) {
        unallowedInlineScripts.push(scriptMatch[0]);
      }
    }
    assert.strictEqual(unallowedInlineScripts.length, 0, `Unallowed inline scripts found: ${unallowedInlineScripts.join('\n')}`);
    console.log('  - Zero unallowed inline script tags (JSON-LD and external scripts only): PASS');

    passedModules++;
  }

  console.log('\n[4/7] AUDITING PUBLIC PRODUCT LISTING REGRESSION (/products)...');
  {
    const plpRes = await request('/products');
    assert.strictEqual(plpRes.statusCode, 200, 'Product listing must return HTTP 200');
    assert(plpRes.body.includes('plp-sidebar'), 'Catalog must include .plp-sidebar');
    assert(plpRes.body.includes('plp-products-grid'), 'Catalog must include .plp-products-grid');
    assert(plpRes.body.includes('plp-filter-drawer-open'), 'Catalog must include mobile filter drawer trigger');
    assert(!plpRes.body.includes('pd-card'), 'Listing page must NOT contain pd-card components');
    console.log('  - Product listing (/products) layout & components intact: PASS');

    const fragRes = await request('/products?format=fragment', {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    assert.strictEqual(fragRes.statusCode, 200, 'AJAX fragment endpoint must return HTTP 200');
    const fragData = JSON.parse(fragRes.body);
    assert.strictEqual(typeof fragData.totalProducts, 'number', 'Fragment response must contain totalProducts count');
    console.log('  - Product listing AJAX fragment endpoint intact: PASS');

    passedModules++;
  }

  console.log('\n[5/7] AUDITING CSRF & TURNSTILE CAPTCHA INTEGRITY...');
  {
    const contactRes = await request('/contact');
    assert.strictEqual(contactRes.statusCode, 200, 'Contact page must return HTTP 200');
    assert(contactRes.body.includes('cf-turnstile') || contactRes.body.includes('challenges.cloudflare.com'), 'Contact page must retain Cloudflare Turnstile integration');
    console.log('  - Contact page Turnstile CAPTCHA intact: PASS');

    passedModules++;
  }

  console.log('\n[6/7] AUDITING ADMIN CMS AUTHENTICATION & FORM INTEGRITY...');
  {
    const getLogin = await request('/admin/login');
    assert.strictEqual(getLogin.statusCode, 200, 'Admin login page must return HTTP 200');

    const setCookies = getLogin.headers['set-cookie'] || [];
    let csrfCookie = '';
    let csrfToken = '';
    setCookies.forEach(c => {
      if (c.startsWith('_csrf_token=')) {
        csrfCookie = c.split(';')[0];
        csrfToken = csrfCookie.replace('_csrf_token=', '');
      }
    });

    assert(csrfToken, 'Admin login page must yield CSRF token');

    const postBody = new URLSearchParams({
      email: 'admin@euodoo.com',
      password: 'AdminEuodoo2026!',
      _csrf: csrfToken
    }).toString();

    const postLogin = await request('/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postBody),
        'Cookie': csrfCookie
      },
      body: postBody
    });

    assert.strictEqual(postLogin.statusCode, 302, 'Successful admin login must return 302 redirect');
    const authCookies = postLogin.headers['set-cookie'] || [];
    const cookieMap = {};
    authCookies.forEach(c => {
      const pair = c.split(';')[0];
      const [k, v] = pair.split('=');
      cookieMap[k.trim()] = v ? v.trim() : '';
    });
    const sessionCookie = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ');

    const adminPages = [
      { name: 'Dashboard', path: '/admin/dashboard' },
      { name: 'Product Index', path: '/admin/products' },
      { name: 'Product Create', path: '/admin/products/create' },
      { name: 'Product Categories', path: '/admin/product-categories' },
      { name: 'Media Library', path: '/admin/media' },
      { name: 'Posts/Articles', path: '/admin/posts' },
      { name: 'Inquiries', path: '/admin/inquiries' },
      { name: 'Settings', path: '/admin/settings' }
    ];

    for (const page of adminPages) {
      const res = await request(page.path, {
        headers: { 'Cookie': sessionCookie }
      });
      assert.strictEqual(res.statusCode, 200, `Admin ${page.name} (${page.path}) must return HTTP 200`);
      console.log(`  - Admin ${page.name}: HTTP 200 PASS`);
    }

    const createFormRes = await request('/admin/products/create', {
      headers: { 'Cookie': sessionCookie }
    });
    assert(createFormRes.body.includes('short_description_id'), 'Create form must have short_description_id field');
    assert(createFormRes.body.includes('short_description_en'), 'Create form must have short_description_en field');
    assert(createFormRes.body.includes('counter_short_desc_id') || createFormRes.body.includes('char-counter'), 'Create form must have live char counter');
    assert(createFormRes.body.includes('prod-gallery-wrap'), 'Create form must have gallery upload container');
    assert(createFormRes.body.includes('btnAddVariant'), 'Create form must have Add Variant button');
    assert(createFormRes.body.includes('btnAddSizeRow'), 'Create form must have Add Size Table Row button');
    assert(createFormRes.body.includes('_csrf='), 'Create form must have CSRF protection in action URL');

    const inlineStylesInCreate = createFormRes.body.match(/<form id="productCreateForm"[\s\S]*?<\/form>/i);
    if (inlineStylesInCreate) {
      const styleMatches = inlineStylesInCreate[0].match(/\sstyle\s*=\s*["'][^"']*["']/g) || [];
      assert.strictEqual(styleMatches.length, 0, `Inline styles found in productCreateForm: ${styleMatches.join(', ')}`);
      const handlerMatches = inlineStylesInCreate[0].match(/\son[a-zA-Z]+\s*=\s*["'][^"']*["']/g) || [];
      assert.strictEqual(handlerMatches.length, 0, `Inline handlers found in productCreateForm: ${handlerMatches.join(', ')}`);
    }
    console.log('  - Product Create form components, CSRF, and zero inline styles/handlers: PASS');

    passedModules++;
  }

  console.log('\n[7/7] AUDITING CSS TOKENS, RESPONSIVE CLASSES & JAVASCRIPT HYGIENE...');
  {
    const compCssPath = path.resolve('public/css/components.css');
    const compCss = fs.readFileSync(compCssPath, 'utf8');

    assert(compCss.includes('.pd-card'), 'components.css must define .pd-card');
    assert(compCss.includes('.pd-grid'), 'components.css must define .pd-grid');
    assert(compCss.includes('.pd-gallery'), 'components.css must define .pd-gallery');
    assert(compCss.includes('.pd-pill:focus-visible'), 'components.css must define focus styles for variant pills');
    assert(compCss.includes('.pd-tab-btn:focus-visible') || compCss.includes('.pd-tab:focus-visible'), 'components.css must define focus styles for tabs');
    assert(!compCss.includes('.pd-sticky-cta'), 'components.css must NOT define .pd-sticky-cta (distilled)');

    const detailJsPath = path.resolve('public/js/product-detail.js');
    const detailJs = fs.readFileSync(detailJsPath, 'utf8');
    assert(!detailJs.includes('eval('), 'product-detail.js must not contain eval()');
    assert(!detailJs.includes('<!--'), 'product-detail.js must not contain HTML comments');

    const adminCssPath = path.resolve('public/css/admin.css');
    const adminCss = fs.readFileSync(adminCssPath, 'utf8');
    assert(adminCss.includes('.media-picker-checkbox'), 'admin.css must define .media-picker-checkbox');
    assert(adminCss.includes('.char-counter'), 'admin.css must define .char-counter');
    assert(adminCss.includes('.prod-gallery-wrap'), 'admin.css must define .prod-gallery-wrap');
    assert(adminCss.includes('.form-actions-sticky'), 'admin.css must define .form-actions-sticky');

    console.log('  - CSS tokens, focus-visible states, and CSP eval compliance: PASS');
    passedModules++;
  }

  console.log('\n======================================================');
  console.log(`ALL T-203 QA & REGRESSION MODULES PASSED (${passedModules} / 7)!`);
  console.log('======================================================\n');
}

runFullQA()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nQA AUDIT FAILED:', err);
    process.exit(1);
  });
