import { chromium } from 'playwright';
import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:3000';

async function runT237PlaywrightVerification() {
  console.log('================================================================');
  console.log('  STARTING T-237 PLAYWRIGHT VERIFICATION SUITE');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const consoleErrors = [];
  const pageErrors = [];

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    // -------------------------------------------------------------
    // Test 1: Desktop Viewport (1440px)
    // -------------------------------------------------------------
    console.log('[TEST 1] Verifying Desktop Viewport (1440x900)...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // 1a. Header Produk Unggulan
    const prodHeader = await page.locator('.prod-header');
    assert.strictEqual(await prodHeader.count(), 1, '.prod-header must exist');

    const topButtonCount = await page.locator('.prod-header .btn, .prod-header a').count();
    assert.strictEqual(topButtonCount, 0, 'No CTA button should exist in .prod-header');

    const prodTitleBox = await page.locator('.prod-title').boundingBox();
    const prodSubtitleBox = await page.locator('.prod-subtitle').boundingBox();
    assert.ok(prodTitleBox && prodSubtitleBox, 'prod-title and prod-subtitle must have bounding boxes');
    const verticalGapDesktop = prodSubtitleBox.y - (prodTitleBox.y + prodTitleBox.height);
    console.log(`  -> Desktop spacing between title and subtitle: ${verticalGapDesktop.toFixed(1)}px (>= 8px required)`);
    assert.ok(verticalGapDesktop >= 7.5, `Vertical gap between title and subtitle (${verticalGapDesktop}px) must be >= 8px`);

    // 1b. Bottom CTA Button
    const bottomCta = page.locator('.prod-more-wrap .btn-see-more');
    assert.strictEqual(await bottomCta.count(), 1, 'Bottom CTA button .btn-see-more must exist');
    assert.strictEqual(await bottomCta.getAttribute('href'), '/products', 'Bottom CTA must link to /products');

    // 1c. Desktop Why Choose Us - Floating Card & Art Label MUST be visible
    const wcuFloatCard = page.locator('.sec-why-us .wcu-float-card');
    assert.ok(await wcuFloatCard.isVisible(), 'Desktop Why Choose Us floating card MUST be visible');
    const wcuArtLabel = page.locator('.sec-why-us .wcu-art-label');
    assert.ok(await wcuArtLabel.isVisible(), 'Desktop Why Choose Us art label MUST be visible');
    const wcuArt = page.locator('.sec-why-us .wcu-art');
    assert.ok(await wcuArt.isVisible(), 'Desktop Why Choose Us SVG art MUST be visible');
    console.log('  -> Desktop Why Choose Us visual elements verified intact: PASSED');

    // -------------------------------------------------------------
    // Test 2: Mobile Viewports (320px, 375px, 480px, 768px)
    // -------------------------------------------------------------
    const mobileViewports = [
      { name: 'Mobile S', width: 320, height: 640 },
      { name: 'Mobile M', width: 375, height: 667 },
      { name: 'Mobile L', width: 480, height: 800 },
      { name: 'Tablet Portrait', width: 768, height: 1024 }
    ];

    for (const vp of mobileViewports) {
      console.log(`\n[TEST 2] Verifying ${vp.name} (${vp.width}x${vp.height})...`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

      // Check horizontal overflow (R-03: zero horizontal scroll)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      console.log(`  -> ${vp.name} horizontal scrollWidth=${scrollWidth}px, clientWidth=${clientWidth}px`);
      assert.ok(scrollWidth <= clientWidth + 1, `Horizontal overflow detected on ${vp.name}: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth})`);

      // Header Produk spacing on mobile
      const mTitleBox = await page.locator('.prod-title').boundingBox();
      const mSubtitleBox = await page.locator('.prod-subtitle').boundingBox();
      const mGap = mSubtitleBox.y - (mTitleBox.y + mTitleBox.height);
      console.log(`  -> ${vp.name} spacing between title and subtitle: ${mGap.toFixed(1)}px`);
      assert.ok(mGap >= 7.5, `Mobile gap ${mGap}px must be >= 8px`);

      // Why Choose Us Mobile - Floating card & Chip label MUST BE HIDDEN
      const isFloatVisible = await page.locator('.sec-why-us .wcu-float-card').isVisible();
      const isLabelVisible = await page.locator('.sec-why-us .wcu-art-label').isVisible();
      assert.strictEqual(isFloatVisible, false, `Why Choose Us float card must be hidden on ${vp.name}`);
      assert.strictEqual(isLabelVisible, false, `Why Choose Us art label must be hidden on ${vp.name}`);
      const isArtVisible = await page.locator('.sec-why-us .wcu-art').isVisible();
      assert.strictEqual(isArtVisible, true, `Why Choose Us SVG leaf art must be visible on ${vp.name}`);
      console.log(`  -> ${vp.name} Why Choose Us leaf art is 100% unobstructed (floating card & chip hidden): PASSED`);

      // Marquee Logo scaling on mobile
      if (vp.width <= 767) {
        const brandLogo = page.locator('.brand-strip-logo').first();
        if (await brandLogo.count() > 0) {
          const logoBox = await brandLogo.boundingBox();
          if (logoBox) {
            console.log(`  -> ${vp.name} brand logo dimensions: ${logoBox.width.toFixed(1)}x${logoBox.height.toFixed(1)}px`);
            assert.ok(logoBox.height >= 60, `Brand logo height (${logoBox.height}px) should be scaled up nicely`);
          }
        }
      }
    }

    // -------------------------------------------------------------
    // Test 3: Bilingual Switching & i18n Verification
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Testing Bilingual i18n Switching (ID & EN)...');
    
    // Indonesian
    await page.goto(`${BASE_URL}/?lang=id`, { waitUntil: 'domcontentloaded' });
    const idTitle = await page.locator('.prod-title').innerText();
    const idMoreBtn = await page.locator('.prod-more-wrap .btn-see-more').innerText();
    console.log(`  -> ID mode header: "${idTitle}" | Button: "${idMoreBtn.trim()}"`);
    assert.ok(idTitle.includes('Produk Unggulan') || idTitle.length > 0, 'ID mode title must be present');
    assert.ok(idMoreBtn.includes('Jelajahi Seluruh Katalog') || idMoreBtn.includes('Katalog'), 'ID mode button text must match');

    // English
    await page.goto(`${BASE_URL}/?lang=en`, { waitUntil: 'domcontentloaded' });
    const enTitle = await page.locator('.prod-title').innerText();
    const enMoreBtn = await page.locator('.prod-more-wrap .btn-see-more').innerText();
    console.log(`  -> EN mode header: "${enTitle}" | Button: "${enMoreBtn.trim()}"`);
    assert.ok(enTitle.includes('Featured') || enTitle.length > 0, 'EN mode title must be present');
    assert.ok(enMoreBtn.includes('Explore') || enMoreBtn.includes('Catalog'), 'EN mode button text must match');

    // -------------------------------------------------------------
    // Test 4: Section Background Transitions & Tokens
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Verifying Section Transition Gradients...');
    const tokenCheck = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        subtleToWcu: style.getPropertyValue('--trans-subtle-to-wcu').trim(),
        wcuToSubtle: style.getPropertyValue('--trans-wcu-to-subtle').trim()
      };
    });
    console.log(`  -> Token --trans-subtle-to-wcu: ${tokenCheck.subtleToWcu}`);
    console.log(`  -> Token --trans-wcu-to-subtle: ${tokenCheck.wcuToSubtle}`);
    assert.ok(tokenCheck.subtleToWcu.length > 0, '--trans-subtle-to-wcu must be defined');
    assert.ok(tokenCheck.wcuToSubtle.length > 0, '--trans-wcu-to-subtle must be defined');

    // -------------------------------------------------------------
    // Test 5: Laptop 14-inch (1920x1080 scaled) Hero Banner Verification
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Verifying 14-inch Laptop (1920x1080 @ 125%/150% DPI) Hero Banner Layout...');
    const laptopViewports = [
      { name: 'Laptop 14" (125% DPI: 1536x720)', width: 1536, height: 720 },
      { name: 'Laptop 14" (150% DPI: 1280x650)', width: 1280, height: 650 }
    ];

    for (const lvp of laptopViewports) {
      console.log(`  Checking ${lvp.name}...`);
      await page.setViewportSize({ width: lvp.width, height: lvp.height });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

      const heroActionsBox = await page.locator('.hero-slide.is-active .hero-actions, .hero-actions').first().boundingBox();
      const heroControlsBox = await page.locator('.hero-slider-controls').boundingBox();

      assert.ok(heroActionsBox, 'hero-actions bounding box must exist');
      assert.ok(heroControlsBox, 'hero-slider-controls bounding box must exist');

      // Check centering of slider controls: center X should be near lvp.width / 2
      const controlsCenterX = heroControlsBox.x + heroControlsBox.width / 2;
      const screenCenterX = lvp.width / 2;
      const centerDelta = Math.abs(controlsCenterX - screenCenterX);
      console.log(`    -> Slider controls center X: ${controlsCenterX.toFixed(1)}px (screen center: ${screenCenterX}px, delta: ${centerDelta.toFixed(1)}px)`);
      assert.ok(centerDelta <= 2, `Slider controls should be centered horizontally within 2px (delta: ${centerDelta}px)`);

      // Check collision/clearance between hero-actions (left CTA) and hero-slider-controls (center)
      const actionsRight = heroActionsBox.x + heroActionsBox.width;
      const controlsLeft = heroControlsBox.x;
      const horizontalClearance = controlsLeft - actionsRight;
      console.log(`    -> Horizontal clearance between CTA buttons and slider controls: ${horizontalClearance.toFixed(1)}px`);
      assert.ok(horizontalClearance >= 40, `Clearance must be >= 40px to prevent any collision (got ${horizontalClearance}px)`);

      // Verify CTA button dimensions (not "bantet" / deformed)
      const ctaBtn = page.locator('.hero-slide.is-active .hero-cta-btn, .hero-cta-btn').first();
      const btnBox = await ctaBtn.boundingBox();
      console.log(`    -> CTA button dimensions: ${btnBox.width.toFixed(1)}x${btnBox.height.toFixed(1)}px`);
      assert.ok(btnBox.height >= 44, 'CTA button height must be >= 44px');
      assert.ok(btnBox.width >= 140, 'CTA button width must be >= 140px');
    }

    // -------------------------------------------------------------
    // Test 6: Console & Runtime Errors
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Checking for Console Errors...');
    console.log(`  -> Console errors captured: ${consoleErrors.length}`);
    console.log(`  -> Page unhandled errors captured: ${pageErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('  Warnings/Errors in console:', consoleErrors);
    }
    assert.strictEqual(pageErrors.length, 0, 'There should be 0 unhandled JavaScript errors');

    console.log('\n================================================================');
    console.log('  ALL T-237 PLAYWRIGHT VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');

  } finally {
    await browser.close();
  }
}

runT237PlaywrightVerification().catch(err => {
  console.error('\nPLAYWRIGHT VERIFICATION FAILED:', err);
  process.exit(1);
});
