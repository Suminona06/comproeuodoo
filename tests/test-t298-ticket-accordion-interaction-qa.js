import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function buildTestPageHtml() {
  const partialPath = path.join(rootDir, 'views/partials/about/ticket-accordion.ejs');
  const tokensContent = fs.readFileSync(path.join(rootDir, 'public/css/tokens.css'), 'utf8');
  const cssContent = fs.readFileSync(path.join(rootDir, 'public/css/components.css'), 'utf8');
  const animeJsContent = fs.readFileSync(path.join(rootDir, 'public/vendor/animejs/anime.min.js'), 'utf8');
  const accordionJsContent = fs.readFileSync(path.join(rootDir, 'public/js/ticket-accordion.js'), 'utf8');

  const startIdx = cssContent.indexOf('.abt-tkt-section');
  const endIdx = cssContent.indexOf('/* ═══ GALLERY SLIDER', startIdx);
  const abtTktCssBlock = cssContent.slice(startIdx, endIdx);

  const template = fs.readFileSync(partialPath, 'utf8');
  const dummyAbout = {
    values_bg_image: '/images/hero-factory.jpg',
    values_pill_id: 'Budaya Kerja',
    values_pill_en: 'Corporate Culture',
    values_subtitle_id: 'Nilai-nilai yang membentuk langkah kami menuju masa depan yang lebih baik',
    values_subtitle_en: 'The values that shape our journey towards a better future',
    values: [
      { letter: 'T', title_id: 'Takut Tuhan', title_en: 'Fear of God', desc_id: 'Desc T', desc_en: 'Desc T', image_url: '/images/hero-factory.jpg', icon_key: 'praying-hands' },
      { letter: 'I', title_id: 'Integritas', title_en: 'Integrity', desc_id: 'Desc I', desc_en: 'Desc I', image_url: '/images/hero-factory.jpg', icon_key: 'shield-check' },
      { letter: 'C', title_id: 'Komunikasi', title_en: 'Communication', desc_id: 'Desc C', desc_en: 'Desc C', image_url: '/images/hero-factory.jpg', icon_key: 'chat-dots' },
      { letter: 'K', title_id: 'Kasih', title_en: 'Love', desc_id: 'Desc K', desc_en: 'Desc K', image_url: '/images/hero-factory.jpg', icon_key: 'heart' },
      { letter: 'E', title_id: 'Luar Biasa', title_en: 'Excellence', desc_id: 'Desc E', desc_en: 'Desc E', image_url: '/images/hero-factory.jpg', icon_key: 'star' },
      { letter: 'T', title_id: 'Taat', title_en: 'Obedience', desc_id: 'Desc T2', desc_en: 'Desc T2', image_url: '/images/hero-factory.jpg', icon_key: 'handshake' }
    ]
  };

  const sectionHtml = ejs.render(template, {
    about: dummyAbout,
    ticketAcronym: 'T - I - C - K - E - T',
    lang: 'id',
    t: (key) => key
  }, { filename: partialPath });

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${tokensContent}\nbody { margin: 0; font-family: var(--font-family-base); }\n.container { max-width: 1320px; margin: 0 auto; padding: 0 16px; box-sizing: border-box; }\n${abtTktCssBlock}</style>
</head>
<body>
${sectionHtml}
<script>${animeJsContent}</script>
<script>${accordionJsContent}</script>
</body>
</html>`;
}

test('T-298: Anime.js v3 Orchestration & Client Interaction Logic QA', async (t) => {
  const html = buildTestPageHtml();
  const browser = await chromium.launch({ headless: true });

  t.after(async () => {
    await browser.close();
  });

  await t.test('hover does not change active panel; click, rapid click, and keyboard work with zero CLS and zero console errors', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const initialActive = await page.getAttribute('#core-values', 'data-active-index');
    assert.strictEqual(initialActive, '2', 'Initial active index must be 2');

    await page.hover('#abt-tkt-tab-0');
    await page.waitForTimeout(150);
    const afterHoverActive = await page.getAttribute('#core-values', 'data-active-index');
    assert.strictEqual(afterHoverActive, '2', 'Hover must NOT trigger panel change');

    await page.click('#abt-tkt-tab-0');
    assert.strictEqual(await page.getAttribute('#core-values', 'data-active-index'), '0');
    assert.strictEqual(await page.getAttribute('#abt-tkt-tab-0', 'aria-expanded'), 'true');
    assert.strictEqual(await page.getAttribute('#abt-tkt-tab-2', 'aria-expanded'), 'false');

    await page.click('[data-dot-index="4"]');
    assert.strictEqual(await page.getAttribute('#core-values', 'data-active-index'), '4');

    // Rapid clicks across multiple panels
    await page.click('#abt-tkt-tab-1');
    await page.click('#abt-tkt-tab-3');
    await page.click('#abt-tkt-tab-5');
    assert.strictEqual(await page.getAttribute('#core-values', 'data-active-index'), '5');

    // Wait for Anime.js 650ms animation to finish and verify inline style cleanup & zero CLS
    await page.waitForTimeout(750);
    const postAnimState = await page.evaluate(() => {
      const acc = document.querySelector('.abt-tkt-accordion');
      const panel5 = document.getElementById('abt-tkt-tab-5');
      return {
        accHeight: Math.round(acc.getBoundingClientRect().height),
        inlineFlexGrow: panel5.style.flexGrow,
        isActiveClass: panel5.classList.contains('is-active')
      };
    });
    assert.strictEqual(postAnimState.accHeight, 510, 'Accordion height must remain stable at 510px (zero CLS)');
    assert.strictEqual(postAnimState.inlineFlexGrow, '', 'Inline flexGrow must be cleaned up after animation completes');
    assert.strictEqual(postAnimState.isActiveClass, true, 'Panel 5 must remain active');

    // Keyboard navigation (ArrowRight wraps 5 -> 0, ArrowLeft 0 -> 5, Home -> 0, End -> 5)
    await page.focus('#abt-tkt-tab-5');
    await page.keyboard.press('ArrowRight');
    assert.strictEqual(await page.getAttribute('#core-values', 'data-active-index'), '0');

    await page.keyboard.press('End');
    assert.strictEqual(await page.getAttribute('#core-values', 'data-active-index'), '5');

    await page.keyboard.press('Home');
    assert.strictEqual(await page.getAttribute('#core-values', 'data-active-index'), '0');

    assert.strictEqual(consoleErrors.length, 0, `Should have 0 console errors, got: ${consoleErrors.join('; ')}`);
    await page.close();
  });

  await t.test('prefers-reduced-motion: reduce switches panels instantaneously without JS animation', async () => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    await page.click('#abt-tkt-tab-1');
    const state = await page.evaluate(() => {
      const p1 = document.getElementById('abt-tkt-tab-1');
      return {
        activeIndex: document.getElementById('core-values').dataset.activeIndex,
        inlineFlexGrow: p1.style.flexGrow,
        expanded: p1.getAttribute('aria-expanded')
      };
    });

    assert.strictEqual(state.activeIndex, '1');
    assert.strictEqual(state.inlineFlexGrow, '', 'Should not set inline flexGrow when prefers-reduced-motion is reduce');
    assert.strictEqual(state.expanded, 'true');
    await context.close();
  });

  await t.test('mobile (393x851 Redmi Note 14 Pro) animates with zero container height drift and zero image re-crop', async () => {
    const page = await browser.newPage({ viewport: { width: 393, height: 851 } });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const beforeMetrics = await page.evaluate(() => {
      const acc = document.querySelector('.abt-tkt-accordion');
      const wrap0 = document.querySelector('#abt-tkt-tab-0 .abt-tkt-media-wrap');
      return {
        accHeight: Math.round(acc.getBoundingClientRect().height),
        wrap0Height: Math.round(wrap0.getBoundingClientRect().height),
        wrap0Width: Math.round(wrap0.getBoundingClientRect().width)
      };
    });

    assert.strictEqual(beforeMetrics.accHeight, 740, 'Mobile accordion height must be locked at 740px');
    assert.strictEqual(beforeMetrics.wrap0Height, 336, 'Mobile media wrapper must stay pre-rasterized at 336px height');
    assert.ok(beforeMetrics.wrap0Width > 300, 'Mobile media wrapper must span full panel width');

    await page.click('#abt-tkt-tab-0');
    await page.waitForTimeout(180);

    const midMetrics = await page.evaluate(() => {
      const acc = document.querySelector('.abt-tkt-accordion');
      const wrap0 = document.querySelector('#abt-tkt-tab-0 .abt-tkt-media-wrap');
      return {
        accHeight: Math.round(acc.getBoundingClientRect().height),
        wrap0Height: Math.round(wrap0.getBoundingClientRect().height)
      };
    });

    assert.strictEqual(midMetrics.accHeight, 740, 'Mobile accordion height must not drift mid-animation');
    assert.strictEqual(midMetrics.wrap0Height, 336, 'Mobile media wrapper height must not resize mid-animation');

    await page.waitForTimeout(400);
    const afterMetrics = await page.evaluate(() => {
      const acc = document.querySelector('.abt-tkt-accordion');
      const p0 = document.getElementById('abt-tkt-tab-0');
      return {
        accHeight: Math.round(acc.getBoundingClientRect().height),
        p0Height: Math.round(p0.getBoundingClientRect().height),
        inlineFlexGrow: p0.style.flexGrow
      };
    });

    assert.strictEqual(afterMetrics.accHeight, 740, 'Mobile accordion height must remain 740px after animation');
    assert.ok(afterMetrics.p0Height >= 320, `Expanded mobile panel height (${afterMetrics.p0Height}px) must be >= 320px`);
    assert.strictEqual(afterMetrics.inlineFlexGrow, '', 'Inline flexGrow must be cleaned up on mobile');
    await page.close();
  });
});

