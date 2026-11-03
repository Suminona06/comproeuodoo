import fs from 'fs';
import assert from 'assert';
import { chromium } from 'playwright';

console.log('Testing T-267 via Playwright Headless Chromium: 2x Desktop Scaling, ~1.5x Mobile, Gap & Marquee Duration...');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const tokensCss = fs.readFileSync('public/css/tokens.css', 'utf8');
  const componentsCss = fs.readFileSync('public/css/components.css', 'utf8');
  const mainJs = fs.readFileSync('public/js/main.js', 'utf8');

  const testHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <style>${tokensCss}</style>
      <style>${componentsCss}</style>
      <style>
        body { margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
      </style>
    </head>
    <body>
      <section class="sec-brands brand-strip-sec" id="merek" aria-label="Portofolio Merek">
        <div class="brand-strip-container">
          <div class="brand-strip-header">
            <h2 class="brand-strip-title">Merek Paten &amp; Terdaftar</h2>
          </div>

          <div class="brand-strip-wrapper" tabindex="0" role="region" aria-label="Daftar logo merek terdaftar yang bergulir">
            <div class="brand-strip-marquee">
              <!-- Track 1 -->
              <div class="brand-strip-track" id="track1">
                <div class="brand-strip-item js-brand-preview-trigger" role="button" tabindex="0"
                     aria-haspopup="dialog"
                     aria-label="Preview merek Brand A"
                     data-brand-name="Brand A"
                     data-brand-logo="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'></svg>"
                     data-brand-initials="BA">
                  <div class="brand-strip-logo-box">
                    <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'></svg>" 
                         alt="Logo Brand A" 
                         class="brand-strip-logo">
                    <span class="brand-zoom-hint" aria-hidden="true">🔍</span>
                  </div>
                </div>
                <div class="brand-strip-item js-brand-preview-trigger" role="button" tabindex="0"
                     aria-haspopup="dialog"
                     aria-label="Preview merek Brand B"
                     data-brand-name="Brand B"
                     data-brand-logo="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'></svg>"
                     data-brand-initials="BB">
                  <div class="brand-strip-logo-box">
                    <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'></svg>" 
                         alt="Logo Brand B" 
                         class="brand-strip-logo">
                    <span class="brand-zoom-hint" aria-hidden="true">🔍</span>
                  </div>
                </div>
              </div>

              <!-- Track 2 (Duplicate, aria-hidden) -->
              <div class="brand-strip-track" id="track2" aria-hidden="true">
                <div class="brand-strip-item js-brand-preview-trigger" role="button" tabindex="-1"
                     data-brand-name="Brand A"
                     data-brand-logo="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'></svg>"
                     data-brand-initials="BA">
                  <div class="brand-strip-logo-box">
                    <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'></svg>" 
                         alt="" 
                         class="brand-strip-logo">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Lightbox Preview Modal -->
      <div id="brandPreviewModal" class="brand-preview-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="brandModalTitle">
        <div class="brand-modal-backdrop" id="brandModalBackdrop"></div>
        <div class="brand-modal-dialog">
          <div class="brand-modal-header">
            <div class="brand-modal-header-info">
              <span class="brand-reg-tag">PORTOFOLIO RESMI</span>
              <h3 id="brandModalTitle" class="brand-modal-title">Nama Merek</h3>
            </div>
            <button type="button" class="brand-modal-close" id="brandModalCloseBtn" aria-label="Tutup preview">
              &times;
            </button>
          </div>
          <div class="brand-modal-body">
            <div class="brand-modal-img-wrap" id="brandModalImgWrap"></div>
          </div>
          <div class="brand-modal-footer">
            <span class="brand-modal-caption">PT Euodoo - Portofolio Merek Terdaftar</span>
            <button type="button" class="btn btn-secondary btn-sm" id="brandModalCloseAction">Tutup</button>
          </div>
        </div>
      </div>

      <script>${mainJs}</script>
    </body>
    </html>
  `;

  // 1. Desktop Test (1440 x 900)
  console.log('1. Verifikasi Desktop 1440px (2x Scaling, 48s Animation, Clamp Gap & Dimensions):');
  const contextDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.setContent(testHtml);

  const desktopLogo = await pageDesktop.locator('.brand-strip-logo').first();
  const desktopLogoBox = await desktopLogo.boundingBox();
  const desktopItem = await pageDesktop.locator('.brand-strip-item').first();
  const desktopItemBox = await desktopItem.boundingBox();

  const trackStyles = await pageDesktop.evaluate(() => {
    const track = document.getElementById('track1');
    const item = track.querySelector('.brand-strip-item');
    const logo = track.querySelector('.brand-strip-logo');
    const itemStyle = window.getComputedStyle(item);
    const trackStyle = window.getComputedStyle(track);
    const logoStyle = window.getComputedStyle(logo);
    return {
      animationDuration: trackStyle.animationDuration,
      animationName: trackStyle.animationName,
      gap: trackStyle.gap,
      itemMinWidth: itemStyle.minWidth,
      logoHeight: logoStyle.height,
      logoMaxHeight: logoStyle.maxHeight,
      logoMaxWidth: logoStyle.maxWidth
    };
  });

  console.log('   - Desktop logo height:', desktopLogoBox.height, 'px (spec: clamp(168px, 16vw, 220px))');
  console.log('   - Desktop item computed min-width:', trackStyles.itemMinWidth, '(spec: clamp(260px, 24vw, 360px))');
  console.log('   - Track animation duration:', trackStyles.animationDuration);
  console.log('   - Track gap:', trackStyles.gap);

  const minWidthNum = parseFloat(trackStyles.itemMinWidth);
  assert.ok(desktopLogoBox.height >= 168 && desktopLogoBox.height <= 221, `Desktop logo height ${desktopLogoBox.height} must be between 168px and 220px`);
  assert.ok(minWidthNum >= 260 && minWidthNum <= 361, `Desktop item min-width ${minWidthNum} must be between 260px and 360px`);
  assert.strictEqual(trackStyles.animationDuration, '48s', 'Track animation duration must be 48s');
  assert.strictEqual(trackStyles.animationName, 'brandStripScroll', 'Track animation name must be brandStripScroll');

  // Verify Pause on Hover
  await pageDesktop.hover('.brand-strip-wrapper');
  const isPaused = await pageDesktop.evaluate(() => {
    const track = document.getElementById('track1');
    return window.getComputedStyle(track).animationPlayState;
  });
  console.log('   - Marquee play state on hover:', isPaused);
  assert.strictEqual(isPaused, 'paused', 'Animation must pause on hover');

  // 2. Mobile Viewports Test (320px, 375px, 480px, 767px)
  console.log('2. Verifikasi Responsif Mobile (320px, 375px, 480px, 767px):');
  const viewports = [
    { width: 320, height: 600 },
    { width: 375, height: 667 },
    { width: 480, height: 800 },
    { width: 767, height: 1024 }
  ];

  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await page.setContent(testHtml);

    const logo = await page.locator('.brand-strip-logo').first();
    const logoBox = await logo.boundingBox();
    const item = await page.locator('.brand-strip-item').first();

    const mobileStyles = await page.evaluate(() => {
      const item = document.querySelector('.brand-strip-item');
      const logo = document.querySelector('.brand-strip-logo');
      return {
        itemMinWidth: window.getComputedStyle(item).minWidth,
        logoHeight: window.getComputedStyle(logo).height
      };
    });

    const docOverflow = await page.evaluate(() => {
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth
      };
    });

    const mobileMinWidthNum = parseFloat(mobileStyles.itemMinWidth);
    console.log(`   - Viewport ${vp.width}px:`);
    console.log(`     Logo height: ${logoBox.height}px, Item min-width: ${mobileStyles.itemMinWidth}`);
    console.log(`     Overflow: docClient=${docOverflow.clientWidth}, docScroll=${docOverflow.scrollWidth}`);

    assert.ok(logoBox.height >= 89 && logoBox.height <= 126, `Logo height at ${vp.width}px (${logoBox.height}) must be within mobile clamp range 90-120px`);
    assert.ok(mobileMinWidthNum >= 149 && mobileMinWidthNum <= 191, `Item min-width at ${vp.width}px (${mobileMinWidthNum}) must be within mobile clamp range 150-190px`);
    assert.strictEqual(docOverflow.scrollWidth, docOverflow.clientWidth, `No horizontal overflow at ${vp.width}px`);
    
    await ctx.close();
  }

  // Check 768px tablet boundary
  console.log('   - Viewport 768px (Tablet Boundary):');
  const ctxTablet = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const pageTablet = await ctxTablet.newPage();
  await pageTablet.setContent(testHtml);
  const tabletStyles = await pageTablet.evaluate(() => {
    const item = document.querySelector('.brand-strip-item');
    const logo = document.querySelector('.brand-strip-logo');
    return {
      itemMinWidth: window.getComputedStyle(item).minWidth,
      logoHeight: window.getComputedStyle(logo).height,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    };
  });
  console.log(`     Logo height: ${tabletStyles.logoHeight}, Item min-width: ${tabletStyles.itemMinWidth}`);
  console.log(`     Overflow: docClient=${tabletStyles.clientWidth}, docScroll=${tabletStyles.scrollWidth}`);
  assert.strictEqual(tabletStyles.logoHeight, '168px', 'Tablet 768px uses desktop min height clamp 168px');
  assert.strictEqual(tabletStyles.itemMinWidth, '260px', 'Tablet 768px uses desktop min width clamp 260px');
  assert.strictEqual(tabletStyles.scrollWidth, tabletStyles.clientWidth, 'No horizontal overflow at 768px');
  await ctxTablet.close();

  // 3. Modal Zoom Lightbox Test
  console.log('3. Verifikasi Modal Zoom Lightbox Preview (#brandPreviewModal):');
  const pageModal = await contextDesktop.newPage();
  await pageModal.setContent(testHtml);

  // Click first brand trigger via DOM dispatch
  await pageModal.evaluate(() => {
    const trigger = document.querySelector('.brand-strip-item.js-brand-preview-trigger');
    trigger.click();
  });

  const modalState = await pageModal.evaluate(() => {
    const modal = document.getElementById('brandPreviewModal');
    const title = document.getElementById('brandModalTitle');
    const imgWrap = document.getElementById('brandModalImgWrap');
    const style = window.getComputedStyle(modal);
    return {
      display: style.display,
      isOpen: modal.classList.contains('is-open'),
      titleText: title ? title.textContent : '',
      hasImg: imgWrap ? Boolean(imgWrap.querySelector('img')) : false,
      ariaHidden: modal.getAttribute('aria-hidden')
    };
  });
  console.log('   - Modal isOpen after click:', modalState.isOpen);
  console.log('   - Modal title text:', modalState.titleText);
  assert.ok(modalState.isOpen, 'Modal must have class is-open after click');
  assert.strictEqual(modalState.titleText, 'Brand A', 'Modal title should show brand name');
  assert.strictEqual(modalState.ariaHidden, 'false', 'Modal aria-hidden should be false');
  assert.ok(modalState.hasImg, 'Modal should render zoom image');

  // Press Escape to close modal
  await pageModal.keyboard.press('Escape');
  const modalAriaAfterEscape = await pageModal.evaluate(() => {
    const modal = document.getElementById('brandPreviewModal');
    return {
      ariaHidden: modal.getAttribute('aria-hidden'),
      isOpen: modal.classList.contains('is-open')
    };
  });
  console.log('   - Modal aria-hidden after Escape:', modalAriaAfterEscape.ariaHidden);
  assert.strictEqual(modalAriaAfterEscape.ariaHidden, 'true', 'Modal should be closed on Escape');
  assert.strictEqual(modalAriaAfterEscape.isOpen, false, 'Modal is-open class should be removed on Escape');

  // 4. Reduced Motion Test
  console.log('4. Verifikasi Fallback prefers-reduced-motion:');
  const contextReduced = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const pageReduced = await contextReduced.newPage();
  await pageReduced.setContent(testHtml);

  const reducedStyles = await pageReduced.evaluate(() => {
    const track = document.getElementById('track1');
    const track2 = document.getElementById('track2');
    const marquee = document.querySelector('.brand-strip-marquee');
    return {
      trackAnim: window.getComputedStyle(track).animationName,
      track2Display: window.getComputedStyle(track2).display,
      marqueeWrap: window.getComputedStyle(marquee).flexWrap
    };
  });
  console.log('   - Track animation name under reduced motion:', reducedStyles.trackAnim);
  console.log('   - Track 2 display under reduced motion:', reducedStyles.track2Display);
  console.log('   - Marquee flex-wrap under reduced motion:', reducedStyles.marqueeWrap);

  assert.strictEqual(reducedStyles.trackAnim, 'none', 'Animation must be disabled on reduced motion');
  assert.strictEqual(reducedStyles.track2Display, 'none', 'Duplicate track must be hidden on reduced motion');
  assert.strictEqual(reducedStyles.marqueeWrap, 'wrap', 'Marquee must wrap neatly on reduced motion');

  await browser.close();
  console.log('=== ALL T-267 TESTS PASSED SUCCESSFULLY! ===');
})();
