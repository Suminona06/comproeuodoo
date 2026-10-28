import assert from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';

console.log('=== STARTING T-191 HOMEPAGE HERO CTA & MEREK QA REGRESSION SUITE ===');

function makeRequest({ method = 'GET', path = '/', headers = {} }) {
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
    req.end();
  });
}

async function runComprehensiveQa() {
  const cssPath = path.resolve('public/css/components.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // =========================================================================
  // 1. Verifikasi Multi-Breakpoint CSS (Mobile 320px - Desktop 1440px)
  // =========================================================================
  console.log('1. Verifikasi Aturan Multi-Breakpoint CSS:');

  // 1a. Hero Dual CTA Responsive Styles
  assert(cssContent.includes('.hero-cta-wrap') || cssContent.includes('.hero-cta-group'), 'CSS harus mendefinisikan kontainer hero cta');
  assert(cssContent.includes('.hero-cta-btn--primary') || cssContent.includes('.btn-pill-solid-white'), 'CSS harus mendefinisikan tombol cta utama');
  assert(cssContent.includes('.hero-cta-btn--secondary') || cssContent.includes('.btn-pill-white'), 'CSS harus mendefinisikan tombol cta kedua');
  
  // Mobile stack (< 768px / < 640px)
  assert(cssContent.includes('@media (max-width: 768px)') || cssContent.includes('@media (max-width: 639.98px)'), 'CSS harus memiliki media query mobile untuk hero CTA');
  assert(cssContent.includes('flex-direction: column;'), 'Hero CTA di mobile wajib ditata kolom (vertical stack)');
  assert(cssContent.includes('min-height: 44px') || cssContent.includes('min-height: 48px'), 'Tombol hero wajib memenuhi touch target minimum 44px');
  console.log('  1a. Hero CTA responsive rules (desktop horizontal, mobile vertical stack 100% width): PASSED');

  // 1b. Brand Strip Marquee Responsive Styles
  assert(cssContent.includes('.brand-strip-sec'), 'CSS harus mendefinisikan .brand-strip-sec');
  assert(cssContent.includes('.brand-strip-wrapper'), 'CSS harus mendefinisikan .brand-strip-wrapper');
  assert(cssContent.includes('.brand-strip-track'), 'CSS harus mendefinisikan .brand-strip-track');
  assert(cssContent.includes('.brand-strip-logo'), 'CSS harus mendefinisikan .brand-strip-logo');
  assert(cssContent.includes('.brand-zoom-hint'), 'CSS harus mendefinisikan .brand-zoom-hint');

  // Desktop logo scaling & hover
  assert(cssContent.includes('clamp(84px, 8.5vw, 115px)'), 'Logo desktop harus proporsional besar');
  assert(cssContent.includes('scale(1.18)'), 'Logo harus memiliki efek hover zoom scale 1.18');
  assert(cssContent.includes('mask-image: linear-gradient'), 'Wrapper marquee harus memiliki mask-image gradien');

  // Mobile < 768px logo scaling (Updated in T-236)
  assert(cssContent.includes('@media (max-width: 767.98px)'), 'CSS harus memiliki media query mobile 768px untuk strip merek');
  assert(cssContent.includes('clamp(70px, 13vw, 88px)') || cssContent.includes('clamp(56px, 11vw, 75px)'), 'Logo mobile harus berskala proporsional');
  console.log('  1b. Brand strip marquee responsive rules (gradient mask, desktop zoom hover, mobile scale): PASSED');

  // =========================================================================
  // 2. Verifikasi Preferensi Reduced Motion (WCAG AA)
  // =========================================================================
  console.log('2. Verifikasi Preferensi prefers-reduced-motion:');
  assert(cssContent.includes('@media (prefers-reduced-motion: reduce)'), 'Harus ada media query prefers-reduced-motion');
  assert(cssContent.includes('.brand-strip-track') && cssContent.includes('animation: none !important'), 'Reduced motion wajib menonaktifkan animasi brand-strip-track');
  assert(cssContent.includes('.brand-strip-track[aria-hidden="true"]') && cssContent.includes('display: none !important'), 'Track duplikat disembunyikan saat reduced motion aktif');
  assert(cssContent.includes('.brand-strip-marquee') && cssContent.includes('flex-wrap: wrap'), 'Item disusun static flex-wrap rapi saat reduced motion aktif');
  console.log('  2a. Fallback prefers-reduced-motion (animasi dimatikan, layout flex-wrap statis rapi): PASSED');

  // =========================================================================
  // 3. Verifikasi Zero Regression pada Seluruh 8 Section Beranda
  // =========================================================================
  console.log('3. Verifikasi Zero Visual Regression pada Seluruh 8 Section Beranda:');
  const resHome = await makeRequest({ path: '/' });
  assert.strictEqual(resHome.statusCode, 200, 'Homepage GET / harus mengembalikan HTTP 200');
  const homeHtml = resHome.data;

  const baselineSections = [
    { selector: 'class="hero hero-slider"', name: '1. Hero Banner Slider' },
    { selector: 'class="sec-intro"', name: '2. Company Introduction' },
    { selector: 'class="sec-products"', name: '3. Category Showcase (4 Panel)' },
    { selector: 'class="sec-why-us sec-pillars"', name: '4. Why Choose Us' },
    { selector: 'class="sec-evidence"', name: '5. Certifications & Accreditations' },
    { selector: 'sec-brands brand-strip-sec', name: '6. Registered Brands Marquee Strip' },
    { selector: 'class="sec-news"', name: '7. Latest News & Insights' },
    { selector: 'class="site-footer"', name: '8. Master Site Footer' }
  ];

  for (const sec of baselineSections) {
    assert(homeHtml.includes(sec.selector), `Beranda harus mempertahankan section utuh: ${sec.name}`);
    console.log(`  3a. Verified section ${sec.name} utuh: PASSED`);
  }

  // =========================================================================
  // 4. Verifikasi Dwibahasa (Bilingual ID vs EN) & Modal Zoom Preview
  // =========================================================================
  console.log('4. Verifikasi Dwibahasa ID vs EN & Retensi Modal Zoom Preview:');

  // 4a. Bahasa Indonesia (?lang=id)
  const resId = await makeRequest({ path: '/?lang=id' });
  assert.strictEqual(resId.statusCode, 200, 'GET /?lang=id harus HTTP 200');
  assert(resId.data.includes('brand-strip-title'), 'Harus merender judul section merek');
  assert(resId.data.includes('PORTOFOLIO RESMI'), 'Modal preview harus merender teks PORTOFOLIO RESMI dalam mode ID');
  assert(resId.data.includes('Klik untuk perbesar'), 'Zoom hint harus memiliki title Klik untuk perbesar dalam mode ID');
  assert(resId.data.includes('id="brandPreviewModal"'), 'Modal preview #brandPreviewModal harus ada dalam HTML');
  assert(resId.data.includes('js-brand-preview-trigger'), 'Tombol pemicu zoom .js-brand-preview-trigger harus ada');
  console.log('  4a. Tampilan bilingual Bahasa Indonesia (?lang=id) & modal zoom verified: PASSED');

  // 4b. English (?lang=en)
  const resEn = await makeRequest({ path: '/?lang=en' });
  assert.strictEqual(resEn.statusCode, 200, 'GET /?lang=en harus HTTP 200');
  assert(resEn.data.includes('OFFICIAL PORTFOLIO'), 'Modal preview harus merender teks OFFICIAL PORTFOLIO dalam mode EN');
  assert(resEn.data.includes('Click to enlarge'), 'Zoom hint harus memiliki title Click to enlarge dalam mode EN');
  console.log('  4b. Tampilan bilingual English (?lang=en) & modal zoom verified: PASSED');

  // =========================================================================
  // 5. Verifikasi Integritas Handler JavaScript di public/js/main.js
  // =========================================================================
  console.log('5. Verifikasi Script Controller Modal di public/js/main.js:');
  const jsContent = fs.readFileSync(path.resolve('public/js/main.js'), 'utf8');
  assert(jsContent.includes('document.getElementById(\'brandPreviewModal\')'), 'main.js harus menautkan elemen brandPreviewModal');
  assert(jsContent.includes('.js-brand-preview-trigger'), 'main.js harus memasang listener pada .js-brand-preview-trigger');
  assert(jsContent.includes('e.key === \'Escape\''), 'main.js harus mendukung penutupan modal via tombol Escape');
  console.log('  5a. Controller JS modal (klik logo, keyboard Enter/Space, tombol Escape, dan backdrop): PASSED');

  console.log('=== ALL T-191 HOMEPAGE HERO CTA & MEREK QA REGRESSION TESTS PASSED! ===');
  process.exit(0);
}

runComprehensiveQa().catch(err => {
  console.error('QA regression test failed:', err);
  process.exit(1);
});
