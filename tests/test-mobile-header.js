import assert from 'assert';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('📱 Starting Automated Verification for Mobile Header Revision v1...');
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error('     Error:', err.message);
      failed++;
    }
  };

  // 1. SSR HTML structure verification for ID
  await test('T-82 & T-83: SSR HTML renders mobile top-bar, borderless toggle, drawer, and CTA (ID)', async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { 'Cookie': 'euodoo_lang=id' }
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    // Check top-bar mobile email element exists
    assert.ok(html.includes('top-email-mobile'), 'Top bar mobile email container must be rendered');
    assert.ok(html.includes('Email: info@euodoo.com') || html.includes('top-email-mobile'), 'Email address must be present');

    // Check brand text and badge
    assert.ok(html.includes('PT EUODOO') || html.includes('brand-name'), 'Brand name must be present');
    assert.ok(html.includes('MANUFACTURING') || html.includes('brand-badge'), 'Manufacturing badge must be present');

    // Check hamburger toggle
    assert.ok(html.includes('id="mobileToggle"'), 'mobileToggle button must exist');
    assert.ok(html.includes('aria-controls="navMenu"'), 'aria-controls attribute must point to navMenu');

    // Check drawer navigation menu & CTA
    assert.ok(html.includes('id="navMenu"'), 'navMenu element must exist');
    assert.ok(html.includes('nav-menu-cta'), 'nav-menu-cta must exist inside drawer');
    assert.ok(html.includes('Minta Penawaran'), 'Indonesian CTA "Minta Penawaran" must be present');

    // Check backdrop
    assert.ok(html.includes('id="menuBackdrop"'), 'menuBackdrop element must exist');
  });

  // 2. SSR HTML structure verification for EN
  await test('T-84: SSR HTML renders English translation correctly (EN)', async () => {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { 'Cookie': 'euodoo_lang=en' }
    });
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('WELCOME TO PT. EUODOO'), 'English welcome banner must be present');
    assert.ok(html.includes('Request a Quote'), 'English CTA "Request a Quote" must be present');
    assert.ok(html.includes('Home'), 'English navigation link "Home" must be present');
    assert.ok(html.includes('About Us'), 'English navigation link "About Us" must be present');
  });

  // 3. CSS rule verification for Bug A1 & Bug A2
  await test('T-80 & T-81: CSS rules resolve hero overlap and slider controls collision', async () => {
    const compCss = fs.readFileSync(path.resolve('./public/css/components.css'), 'utf-8');

    // Hero offset (Bug A1)
    assert.ok(compCss.includes('padding-top: calc(34px + 64px + 24px)'), 'Hero slide must have safe padding-top offset (122px)');
    
    // Slider controls relocated to top-right (Bug A2)
    assert.ok(compCss.includes('.hero-slider-controls {') && compCss.includes('top: calc(34px + 64px + 12px)'), 'Slider controls must be positioned below navbar at top-right');
    assert.ok(compCss.includes('right: 16px'), 'Slider controls must be aligned to right edge');
    assert.ok(compCss.includes('bottom: auto'), 'Slider controls bottom must be reset to auto');
  });

  // 4. CSS rule verification for UI Polish C1 & C2
  await test('T-82 & T-83: CSS rules implement single-row top-bar, borderless toggle, and white drawer', async () => {
    const layoutCss = fs.readFileSync(path.resolve('./public/css/layout.css'), 'utf-8');

    // Borderless toggle
    assert.ok(layoutCss.includes('.mobile-toggle {') && layoutCss.includes('border: none;'), 'Mobile toggle must have border: none');
    
    // Active rounded-square X button with primary tint
    assert.ok(layoutCss.includes('background: rgba(0, 85, 184, 0.08);') && layoutCss.includes('border-radius: 8px;'), 'Active toggle must be rounded-square with primary tint');

    // White panel drawer
    assert.ok(layoutCss.includes('border-radius: 0 0 16px 16px'), 'Drawer must have rounded bottom corners');
    assert.ok(layoutCss.includes('min-height: 44px'), 'Drawer menu items must have min-height 44px');
    assert.ok(layoutCss.includes('background: rgba(0, 85, 184, 0.08)'), 'Active menu link must have light blue tint highlight');

    // Single row top bar on mobile
    assert.ok(layoutCss.includes('.top-tagline {') && layoutCss.includes('display: none !important;'), 'Tagline must be hidden on mobile');
    assert.ok(layoutCss.includes('flex-direction: row !important;'), 'Top bar inner must maintain flex-direction: row on mobile');
  });

  // 5. JavaScript verification for drawer interactions
  await test('T-83: Client script handles open, close, escape, and resize listeners', async () => {
    const mainJs = fs.readFileSync(path.resolve('./public/js/main.js'), 'utf-8');

    assert.ok(mainJs.includes('openMobileMenu'), 'openMobileMenu function must exist');
    assert.ok(mainJs.includes('closeMobileMenu'), 'closeMobileMenu function must exist');
    assert.ok(mainJs.includes("aria-expanded', 'true'"), 'aria-expanded must be set to true on open');
    assert.ok(mainJs.includes("aria-expanded', 'false'"), 'aria-expanded must be set to false on close');
    assert.ok(mainJs.includes("document.body.style.overflow = 'hidden'"), 'Body overflow must be locked when open');
    assert.ok(mainJs.includes("e.key === 'Escape'"), 'Escape key listener must be present');
    assert.ok(mainJs.includes("window.innerWidth > 1024"), 'Resize handler must close menu when expanded to desktop');
  });

  console.log(`\n========================================`);
  console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
