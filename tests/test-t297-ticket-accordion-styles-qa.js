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

function relativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function compositeOverWhite(r, g, b, alpha) {
  const comp = (c) => Math.round(c * alpha + 255 * (1 - alpha)).toString(16).padStart(2, '0');
  return `#${comp(r)}${comp(g)}${comp(b)}`;
}

function assertViewportMetrics(vp, metrics) {
  assert.strictEqual(metrics.docOverflow, false, `Must have zero horizontal overflow at ${vp.width}px`);

  if (vp.mode === 'desktop') {
    assert.strictEqual(metrics.flexDirection, 'row', `Desktop ${vp.width}px must use row layout`);
    assert.strictEqual(metrics.accHeight, vp.expectedAccordionHeight, `Desktop ${vp.width}px accordion height must be ${vp.expectedAccordionHeight}px`);
    assert.ok(metrics.activeWidth >= metrics.inactiveWidth * 2.5, `Active panel width (${metrics.activeWidth}) must be >= 2.5x inactive width (${metrics.inactiveWidth}) at ${vp.width}px`);
    assert.notStrictEqual(metrics.vertLineDisplay, 'none', `Vertical accent lines must be visible at ${vp.width}px`);
    return;
  }

  assert.strictEqual(metrics.flexDirection, 'column', `Mobile ${vp.width}px must stack vertically`);
  assert.ok(metrics.inactiveHeight >= 68, `Mobile ${vp.width}px inactive row height (${metrics.inactiveHeight}px) must be >= 68px (>= 44px touch target)`);
  assert.ok(metrics.activeHeight >= 320, `Mobile ${vp.width}px active row height (${metrics.activeHeight}px) must expand >= 320px`);
  assert.strictEqual(metrics.vertLineDisplay, 'none', `Vertical accent lines must be hidden on mobile ${vp.width}px`);
}

test('T-297: Desktop & Mobile Accordion Token Styling, Contrast & Responsive QA', async (t) => {
  const cssPath = path.join(rootDir, 'public/css/components.css');
  const tokensPath = path.join(rootDir, 'public/css/tokens.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const tokensContent = fs.readFileSync(tokensPath, 'utf8');

  const startIdx = cssContent.indexOf('.abt-tkt-section');
  const endIdx = cssContent.indexOf('/* ═══ GALLERY SLIDER', startIdx);
  const abtTktCssBlock = cssContent.slice(startIdx, endIdx);

  await t.test('100% token compliance and zero raw hex in .abt-tkt-* CSS block', () => {
    assert.ok(startIdx !== -1 && endIdx !== -1, '.abt-tkt-* block must exist in components.css');
    assert.ok(tokensContent.includes('--shadow-glow-primary:'), 'tokens.css must define --shadow-glow-primary');

    const hexMatches = abtTktCssBlock.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g);
    assert.strictEqual(hexMatches, null, `Should have zero raw hex colors in .abt-tkt-* block, found: ${hexMatches}`);

    assert.ok(abtTktCssBlock.includes('var(--r-xl)'), 'Should reference var(--r-xl)');
    assert.ok(abtTktCssBlock.includes('var(--shadow-glow-primary)'), 'Should reference var(--shadow-glow-primary)');
    assert.ok(abtTktCssBlock.includes('var(--focus-ring)'), 'Should reference var(--focus-ring)');
    assert.ok(abtTktCssBlock.includes('.abt-tkt-panel:focus-visible'), 'Should define :focus-visible for panel');
    assert.ok(abtTktCssBlock.includes('.abt-tkt-dot:focus-visible'), 'Should define :focus-visible for dot');
  });

  await t.test('WCAG AA contrast ratios for header, inactive panel, active panel, and dots', () => {
    // Header text over #F8FAFC scrim
    assert.ok(contrastRatio('#00755A', '#F8FAFC') >= 4.5, 'Pill text on light scrim must be >= 4.5:1');
    assert.ok(contrastRatio('#00573F', '#F8FAFC') >= 4.5, 'Title text on light scrim must be >= 4.5:1');
    assert.ok(contrastRatio('#424753', '#F8FAFC') >= 4.5, 'Subtitle text on light scrim must be >= 4.5:1');

    // Worst-case white photo (#FFFFFF) under inactive overlay rgba(7, 31, 23, 0.65)
    const inactiveMidBg = compositeOverWhite(7, 31, 23, 0.65);
    assert.ok(contrastRatio('#FFFFFF', inactiveMidBg) >= 4.5, `Inactive vertical title contrast (${contrastRatio('#FFFFFF', inactiveMidBg).toFixed(2)}) must be >= 4.5:1`);

    // Worst-case white photo (#FFFFFF) under active content overlay rgba(4, 30, 27, 0.86)
    const activeContentBg = compositeOverWhite(4, 30, 27, 0.86);
    assert.ok(contrastRatio('#FFFFFF', activeContentBg) >= 4.5, `Active panel description contrast (${contrastRatio('#FFFFFF', activeContentBg).toFixed(2)}) must be >= 4.5:1`);

    // Non-text contrast for inactive dot (#737784 on #F8FAFC) >= 3.0:1
    assert.ok(contrastRatio('#737784', '#F8FAFC') >= 3.0, 'Inactive dot non-text contrast must be >= 3.0:1');
  });

  await t.test('Responsive layout across 320px, 375px, 768px, 1024px, and 1440px in Chromium', async () => {
    const partialPath = path.join(rootDir, 'views/partials/about/ticket-accordion.ejs');
    const template = fs.readFileSync(partialPath, 'utf8');
    const dummyAbout = {
      values_bg_image: '/images/hero-factory.jpg',
      values_pill_id: 'Budaya Kerja',
      values_pill_en: 'Corporate Culture',
      values_subtitle_id: 'Nilai-nilai yang membentuk langkah kami menuju masa depan yang lebih baik',
      values_subtitle_en: 'The values that shape our journey towards a better future',
      values: [
        { letter: 'T', title_id: 'Takut Tuhan', title_en: 'Fear of God', desc_id: 'Menjadikan nilai ketuhanan sebagai landasan dalam bekerja.', desc_en: 'Desc T', image_url: '/images/hero-factory.jpg', icon_key: 'praying-hands' },
        { letter: 'I', title_id: 'Integritas', title_en: 'Integrity', desc_id: 'Konsisten antara perkataan dan tindakan di setiap lini.', desc_en: 'Desc I', image_url: '/images/hero-factory.jpg', icon_key: 'shield-check' },
        { letter: 'C', title_id: 'Komunikasi', title_en: 'Communication', desc_id: 'Membangun komunikasi yang terbuka, jelas, dan efektif untuk mencapai kerja sama yang lebih baik.', desc_en: 'Desc C', image_url: '/images/hero-factory.jpg', icon_key: 'chat-dots' },
        { letter: 'K', title_id: 'Kasih', title_en: 'Love', desc_id: 'Menghadirkan kepedulian, empati, dan rasa hormat.', desc_en: 'Desc K', image_url: '/images/hero-factory.jpg', icon_key: 'heart' },
        { letter: 'E', title_id: 'Luar Biasa', title_en: 'Excellence', desc_id: 'Terus meningkatkan kualitas dan ketelitian hasil.', desc_en: 'Desc E', image_url: '/images/hero-factory.jpg', icon_key: 'star' },
        { letter: 'T', title_id: 'Taat', title_en: 'Obedience', desc_id: 'Mematuhi kebijakan, prosedur, dan standar keselamatan.', desc_en: 'Desc T2', image_url: '/images/hero-factory.jpg', icon_key: 'handshake' }
      ]
    };

    const sectionHtml = ejs.render(template, {
      about: dummyAbout,
      ticketAcronym: 'T - I - C - K - E - T',
      lang: 'id',
      t: (key) => key
    }, { filename: partialPath });

    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${tokensContent}\nbody { margin: 0; font-family: var(--font-family-base); }\n.container { max-width: 1320px; margin: 0 auto; padding: 0 16px; box-sizing: border-box; }\n${abtTktCssBlock}</style>
</head>
<body>${sectionHtml}</body>
</html>`;

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

      const viewports = [
        { width: 1440, height: 900, mode: 'desktop', expectedAccordionHeight: 510 },
        { width: 1024, height: 768, mode: 'desktop', expectedAccordionHeight: 460 },
        { width: 768, height: 1024, mode: 'mobile' },
        { width: 375, height: 812, mode: 'mobile' },
        { width: 320, height: 640, mode: 'mobile' }
      ];

      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const metrics = await page.evaluate(() => {
          const docOverflow = document.documentElement.scrollWidth > window.innerWidth;
          const acc = document.querySelector('.abt-tkt-accordion');
          const accStyle = window.getComputedStyle(acc);
          const accRect = acc.getBoundingClientRect();
          const inactivePanel = document.querySelector('.abt-tkt-panel:not(.is-active)');
          const activePanel = document.querySelector('.abt-tkt-panel.is-active');
          const inactiveRect = inactivePanel.getBoundingClientRect();
          const activeRect = activePanel.getBoundingClientRect();
          const vertLine = document.querySelector('.abt-tkt-vert-line');
          const vertLineDisplay = window.getComputedStyle(vertLine).display;
          return {
            docOverflow,
            flexDirection: accStyle.flexDirection,
            accHeight: Math.round(accRect.height),
            inactiveWidth: inactiveRect.width,
            activeWidth: activeRect.width,
            inactiveHeight: Math.round(inactiveRect.height),
            activeHeight: Math.round(activeRect.height),
            vertLineDisplay
          };
        });

        assertViewportMetrics(vp, metrics);
      }
    } finally {
      await browser.close();
    }
  });
});
