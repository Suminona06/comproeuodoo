import assert from 'assert';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import http from 'http';
import settingModel from '../models/settingModel.js';
import { clearSettingsCache } from '../middleware/settingsMiddleware.js';
import { pool } from '../config/database.js';

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

async function runT188Tests() {
  console.log('=== STARTING T-188 BRAND STRIP MARQUEE TESTS ===');

  console.log('1. Verifying CSS Isolated Tokens & Classes in public/css/components.css:');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  assert.ok(cssContent.includes('.brand-strip-sec'), 'CSS must define .brand-strip-sec');
  assert.ok(cssContent.includes('.brand-strip-title'), 'CSS must define .brand-strip-title');
  assert.ok(cssContent.includes('.brand-strip-wrapper'), 'CSS must define .brand-strip-wrapper');
  assert.ok(cssContent.includes('.brand-strip-marquee'), 'CSS must define .brand-strip-marquee');
  assert.ok(cssContent.includes('.brand-strip-track'), 'CSS must define .brand-strip-track');
  assert.ok(cssContent.includes('@keyframes brandStripScroll'), 'CSS must define @keyframes brandStripScroll');
  assert.ok(cssContent.includes('animation-play-state: paused'), 'CSS must pause on hover and focus-within');
  assert.ok(cssContent.includes('prefers-reduced-motion: reduce'), 'CSS must include prefers-reduced-motion fallback');
  console.log('  1a. CSS classes, animations, mask, and reduced-motion rules: PASSED');

  console.log('2. Testing Admin Section Title Update Logic & Model:');
  // Store original settings to restore later
  const originalTitleId = await settingModel.get('home_brand_title_id', 'Merek Paten & Terdaftar');
  const originalTitleEn = await settingModel.get('home_brand_title_en', 'Registered Trademarks');

  try {
    // Update setting
    await settingModel.updateMany({
      home_brand_title_id: 'Merek Unggulan Pabrik',
      home_brand_title_en: 'Featured Factory Brands'
    });
    clearSettingsCache();

    const updatedTitleId = await settingModel.get('home_brand_title_id');
    const updatedTitleEn = await settingModel.get('home_brand_title_en');
    assert.strictEqual(updatedTitleId, 'Merek Unggulan Pabrik');
    assert.strictEqual(updatedTitleEn, 'Featured Factory Brands');
    console.log('  2a. Admin setting model update & persistence: PASSED');

    console.log('3. Unit Testing EJS Template Conditional Rendering Scenarios:');
    const baseMockData = {
      title: 'Test Homepage',
      path: '/',
      currentLang: 'id',
      featuredProducts: [],
      homepageCategories: [],
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
        home_brand_title_id: 'Merek Unggulan Pabrik',
        home_brand_title_en: 'Featured Factory Brands'
      },
      formatInlineText: (t) => t || '',
      user: null,
      csrfToken: 'test-token',
      banners: []
    };

    // Scenario A: Auto-duplication when brands < 8
    const smallBrandList = [
      { id: 1, name: 'Brand Alpha', logo_url: '/uploads/brands/alpha.webp', is_active: 1 },
      { id: 2, name: 'Brand Beta', logo_url: '/uploads/brands/beta.webp', is_active: 1 },
      { id: 3, name: 'Brand Gamma', logo_url: '/uploads/brands/gamma.webp', is_active: 1 }
    ];

    const htmlScenarioA = await renderIndexEjs({
      ...baseMockData,
      brands: smallBrandList
    });

    assert.ok(htmlScenarioA.includes('brand-strip-sec'), 'Must render .brand-strip-sec');
    assert.ok(htmlScenarioA.includes('Merek Unggulan Pabrik'), 'Must render customized section title');
    assert.ok(!htmlScenarioA.includes('brands-kicker'), 'Must NOT render old kicker');
    assert.ok(!htmlScenarioA.includes('brands-desc'), 'Must NOT render old description');
    assert.ok(htmlScenarioA.includes('brand-preview-modal'), 'Must preserve brand zoom modal lightbox');
    assert.ok(htmlScenarioA.includes('brand-zoom-hint'), 'Must preserve brand zoom hint icon');

    // Count occurrences of Brand Alpha img tags across both tracks via src:
    // With 3 brands, duplicated until >= 8, array has 9 items per track = 18 total (6 img tags with alpha.webp).
    const alphaCount = (htmlScenarioA.match(/src="\/uploads\/brands\/alpha\.webp"/g) || []).length;
    assert.strictEqual(alphaCount, 6, `Small list must be auto-duplicated to 9 items per track (got ${alphaCount} img tags across both tracks)`);
    assert.ok(htmlScenarioA.includes('aria-hidden="true"'), 'Second track must have aria-hidden="true"');
    console.log('  3a. Scenario A (Auto-duplication < 8 items, seamless tracks): PASSED');

    // Scenario B: Bilingual rendering (EN mode)
    const htmlScenarioB = await renderIndexEjs({
      ...baseMockData,
      currentLang: 'en',
      brands: smallBrandList
    });
    assert.ok(htmlScenarioB.includes('Featured Factory Brands'), 'EN mode must render English section title');
    assert.ok(!htmlScenarioB.includes('Merek Unggulan Pabrik'), 'EN mode must not render ID section title');
    console.log('  3b. Scenario B (Bilingual section title rendering): PASSED');

    // Scenario C: Fallback default titles when settings are empty
    const htmlScenarioC = await renderIndexEjs({
      ...baseMockData,
      settings: {},
      brands: smallBrandList
    });
    assert.ok(htmlScenarioC.includes('Merek Paten &amp; Terdaftar') || htmlScenarioC.includes('Merek Paten & Terdaftar'), 'Default fallback must be "Merek Paten & Terdaftar" in ID mode');
    console.log('  3c. Scenario C (Default title fallback): PASSED');

    // Scenario D: Empty brands array renders nothing
    const htmlScenarioD = await renderIndexEjs({
      ...baseMockData,
      brands: []
    });
    assert.ok(!htmlScenarioD.includes('brand-strip-sec'), 'Empty brands list must not render brand section');
    console.log('  3d. Scenario D (Zero brands renders no section): PASSED');

  } finally {
    // Restore original settings
    await settingModel.updateMany({
      home_brand_title_id: originalTitleId,
      home_brand_title_en: originalTitleEn
    });
    clearSettingsCache();
    await pool.end();
  }

  console.log('4. Live HTTP Integration Testing on Dev Server:');
  const resHome = await fetchUrl('http://localhost:3000/');
  assert.strictEqual(resHome.statusCode, 200, 'GET / must return 200 OK');
  assert.ok(resHome.body.includes('brand-strip-sec'), 'Public homepage must contain .brand-strip-sec');
  assert.ok(resHome.body.includes('brand-strip-marquee'), 'Public homepage must contain .brand-strip-marquee');
  console.log('  4a. GET / HTTP 200 and brand strip marquee verified: PASSED');

  console.log('=== ALL T-188 BRAND STRIP MARQUEE TESTS PASSED! ===');
}

runT188Tests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('T-188 Test Failed:', err);
    process.exit(1);
  });
