import assert from 'assert';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import http from 'http';

const templatePath = path.resolve('views/public/index.ejs');
const cssPath = path.resolve('public/css/components.css');

async function renderIndexEjs(data) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, data, {
      root: path.resolve('views')
    }, (err, str) => {
      if (err) reject(err);
      else resolve(str);
    });
  });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function runT187Tests() {
  console.log('=== STARTING T-187 HERO PUBLIC DUAL CTA TESTS ===');

  console.log('1. Verifying CSS Isolated Tokens & Classes in public/css/components.css:');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert.ok(cssContent.includes('.hero-cta-wrap'), 'CSS must define .hero-cta-wrap');
  assert.ok(cssContent.includes('.hero-cta-btn'), 'CSS must define .hero-cta-btn');
  assert.ok(cssContent.includes('.hero-cta-btn--primary'), 'CSS must define .hero-cta-btn--primary');
  assert.ok(cssContent.includes('.hero-cta-btn--secondary'), 'CSS must define .hero-cta-btn--secondary');
  assert.ok(cssContent.includes('.hero-slide.is-active .hero-cta-wrap'), 'CSS must include slide transition for .hero-cta-wrap');
  assert.ok(cssContent.includes('prefers-reduced-motion: reduce'), 'CSS must include prefers-reduced-motion for hero-cta-btn');
  console.log('  1a. CSS classes, animations, tokens, and reduced-motion rules: PASSED');

  console.log('2. Unit Testing EJS Template Conditional Rendering Scenarios:');
  
  const baseMockData = {
    title: 'Test Homepage',
    path: '/',
    currentLang: 'id',
    featuredProducts: [],
    homepageCategories: [],
    brands: [],
    latestPosts: [],
    homeContent: {
      wcu_badge_id: 'Test Badge',
      wcu_badge_en: 'Test Badge EN',
      wcu_title_id: 'Test Title',
      wcu_title_en: 'Test Title EN',
      wcu_desc_id: 'Test Desc',
      wcu_desc_en: 'Test Desc EN',
      wcu_items: []
    },
    settings: {
      company_name: 'PT Euodoo',
      home_brand_title_id: 'Merek Terdaftar',
      home_brand_title_en: 'Registered Trademarks'
    },
    formatInlineText: (t) => t || '',
    user: null,
    csrfToken: 'test-token'
  };

  // Scenario A: Only primary CTA is present, secondary is empty
  const htmlScenarioA = await renderIndexEjs({
    ...baseMockData,
    banners: [{
      id: 101,
      title_id: 'Banner Uji Coba Single CTA',
      caption_id: 'Caption uji coba',
      cta_text_id: 'Hubungi Kami',
      cta_url: '/contact',
      cta_secondary_text_id: '',
      cta_secondary_url: '',
      file_url: '/images/hero-factory.jpg',
      media_type: 'image',
      is_active: 1
    }]
  });

  assert.ok(htmlScenarioA.includes('hero-cta-btn--primary'), 'Scenario A must render primary CTA button');
  assert.ok(htmlScenarioA.includes('Hubungi Kami'), 'Scenario A must render primary CTA text');
  assert.ok(!htmlScenarioA.includes('hero-cta-btn--secondary'), 'Scenario A must NOT render secondary CTA button');
  console.log('  2a. Scenario A (Only primary button rendered): PASSED');

  // Scenario B: Dual CTA with internal URLs
  const htmlScenarioB = await renderIndexEjs({
    ...baseMockData,
    banners: [{
      id: 102,
      title_id: 'Banner Dual CTA Internal',
      caption_id: 'Caption uji coba internal',
      cta_text_id: 'Konsultasi Gratis',
      cta_url: '/contact',
      cta_secondary_text_id: 'Katalog Produk',
      cta_secondary_url: '/products',
      file_url: '/images/hero-factory.jpg',
      media_type: 'image',
      is_active: 1
    }]
  });

  assert.ok(htmlScenarioB.includes('href="/contact"'), 'Scenario B must have internal link for primary CTA');
  assert.ok(htmlScenarioB.includes('href="/products"'), 'Scenario B must have internal link for secondary CTA');
  assert.ok(!htmlScenarioB.includes('href="/contact" target="_blank"'), 'Internal primary link must not have target="_blank"');
  assert.ok(!htmlScenarioB.includes('href="/products" target="_blank"'), 'Internal secondary link must not have target="_blank"');
  console.log('  2b. Scenario B (Dual CTA with internal URLs, no target="_blank"): PASSED');

  // Scenario C: Dual CTA with external URLs
  const htmlScenarioC = await renderIndexEjs({
    ...baseMockData,
    banners: [{
      id: 103,
      title_id: 'Banner Dual CTA External',
      caption_id: 'Caption uji coba external',
      cta_text_id: 'WhatsApp CS',
      cta_url: 'https://wa.me/628112117123',
      cta_secondary_text_id: 'Unduh Brosur',
      cta_secondary_url: 'https://example.com/brochure.pdf',
      file_url: '/images/hero-factory.jpg',
      media_type: 'image',
      is_active: 1
    }]
  });

  assert.ok(htmlScenarioC.includes('href="https://wa.me/628112117123"'), 'Scenario C must have external link for primary');
  assert.ok(htmlScenarioC.includes('href="https://example.com/brochure.pdf"'), 'Scenario C must have external link for secondary');
  
  // Verify target="_blank" rel="noopener noreferrer"
  assert.ok(htmlScenarioC.includes('target="_blank" rel="noopener noreferrer"'), 'External link must have target="_blank" rel="noopener noreferrer"');
  console.log('  2c. Scenario C (External URLs with target="_blank" and rel="noopener noreferrer"): PASSED');

  // Scenario D: URL fallback when cta_url is empty
  const htmlScenarioD = await renderIndexEjs({
    ...baseMockData,
    banners: [{
      id: 104,
      title_id: 'Banner Empty URL Fallback',
      caption_id: 'Caption uji coba fallback',
      cta_text_id: 'Tanya Tim Sales',
      cta_url: '',
      cta_secondary_text_id: '',
      cta_secondary_url: '',
      file_url: '/images/hero-factory.jpg',
      media_type: 'image',
      is_active: 1
    }]
  });

  assert.ok(htmlScenarioD.includes('href="/contact"'), 'Empty primary cta_url must fallback to /contact');
  assert.ok(htmlScenarioD.includes('Tanya Tim Sales'), 'Primary text must be preserved with fallback URL');
  console.log('  2d. Scenario D (Empty primary cta_url fallbacks to /contact): PASSED');

  // Scenario E: Bilingual language rendering
  const htmlScenarioE = await renderIndexEjs({
    ...baseMockData,
    currentLang: 'en',
    banners: [{
      id: 105,
      title_id: 'Judul ID',
      title_en: 'Title EN',
      caption_id: 'Keterangan ID',
      caption_en: 'Caption EN',
      cta_text_id: 'Hubungi Kami ID',
      cta_text_en: 'Contact Us EN',
      cta_url: '/contact',
      cta_secondary_text_id: 'Pelajari ID',
      cta_secondary_text_en: 'Learn More EN',
      cta_secondary_url: '/about',
      file_url: '/images/hero-factory.jpg',
      media_type: 'image',
      is_active: 1
    }]
  });

  assert.ok(htmlScenarioE.includes('Contact Us EN'), 'EN language mode must render cta_text_en');
  assert.ok(htmlScenarioE.includes('Learn More EN'), 'EN language mode must render cta_secondary_text_en');
  assert.ok(!htmlScenarioE.includes('Hubungi Kami ID'), 'EN language mode must not render ID primary text');
  assert.ok(!htmlScenarioE.includes('Pelajari ID'), 'EN language mode must not render ID secondary text');
  console.log('  2e. Scenario E (Bilingual language rendering ID vs EN): PASSED');

  // Scenario F: Neither primary nor secondary text provided
  const htmlScenarioF = await renderIndexEjs({
    ...baseMockData,
    banners: [{
      id: 106,
      title_id: 'Banner No CTA',
      caption_id: 'Caption without buttons',
      cta_text_id: '',
      cta_text_en: '',
      cta_url: '',
      cta_secondary_text_id: '',
      cta_secondary_text_en: '',
      cta_secondary_url: '',
      file_url: '/images/hero-factory.jpg',
      media_type: 'image',
      is_active: 1
    }]
  });

  assert.ok(!htmlScenarioF.includes('hero-cta-btn'), 'Scenario F with empty CTA text must NOT render any button tag');
  console.log('  2f. Scenario F (Empty CTA texts render zero button tags): PASSED');

  console.log('3. Live HTTP Integration Testing on Dev Server:');
  const resId = await fetchUrl('http://localhost:3000/');
  assert.strictEqual(resId.statusCode, 200, 'GET / must return 200 OK');
  assert.ok(resId.body.includes('hero-cta-wrap') || resId.body.includes('hero-actions'), 'Public page must contain hero buttons wrap');
  console.log('  3a. GET / HTTP 200 and hero button wrap verified: PASSED');

  const resEn = await fetchUrl('http://localhost:3000/?lang=en');
  assert.strictEqual(resEn.statusCode, 200, 'GET /?lang=en must return 200 OK');
  assert.ok(resEn.body.includes('hero-slider'), 'Public page in EN must render hero slider: PASSED');
  console.log('  3b. GET /?lang=en HTTP 200 verified: PASSED');

  console.log('=== ALL T-187 HERO PUBLIC DUAL CTA TESTS PASSED! ===');
}

runT187Tests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('T-187 Test Failed:', err);
    process.exit(1);
  });
