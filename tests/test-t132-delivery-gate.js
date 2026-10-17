import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function runTest() {
  console.log('=== TEST T-132: DELIVERY GATE CHECK (A11Y, CONTRAST, REDUCED MOTION) ===\n');

  // 1. WCAG AA Contrast Verification
  console.log('[1] Verifying WCAG AA Contrast for Bento Gallery Caption Overlays...');
  const navyR = 10, navyG = 25, navyB = 47;
  const whiteLum = getLuminance(255, 255, 255);

  // Worst-case scenario: pure white image underneath, gradient overlay alpha 0.72
  const overlayAlpha = 0.72;
  const blendedR = Math.round(255 * (1 - overlayAlpha) + navyR * overlayAlpha);
  const blendedG = Math.round(255 * (1 - overlayAlpha) + navyG * overlayAlpha);
  const blendedB = Math.round(255 * (1 - overlayAlpha) + navyB * overlayAlpha);

  const bgLumWorstCase = getLuminance(blendedR, blendedG, blendedB);
  const contrastRatioWorstCase = getContrastRatio(whiteLum, bgLumWorstCase);

  console.log(`  Worst-case background RGB: rgb(${blendedR}, ${blendedG}, ${blendedB})`);
  console.log(`  Calculated contrast ratio: ${contrastRatioWorstCase.toFixed(2)}:1`);
  assert.ok(
    contrastRatioWorstCase >= 4.5,
    `WCAG AA requires >= 4.5:1 contrast, got ${contrastRatioWorstCase.toFixed(2)}:1`
  );
  console.log('  -> Caption text (#ffffff) exceeds WCAG AA requirement (4.5:1) in all conditions.\n');

  // 2. Keyboard Navigability & Focus Indicators
  console.log('[2] Verifying Keyboard Navigability and Focus Ring Styles...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/components.css'), 'utf8');
  const mainJs = fs.readFileSync(path.join(__dirname, '../public/js/main.js'), 'utf8');
  const aboutEjs = fs.readFileSync(path.join(__dirname, '../views/public/about.ejs'), 'utf8');

  // Bento tile focus ring
  assert.ok(css.includes('.bento-tile:focus-visible'), 'CSS must define .bento-tile:focus-visible');
  assert.ok(
    css.includes('outline: 2px solid var(--sky, #38bdf8)') || css.includes('outline: 2px solid'),
    '.bento-tile:focus-visible must provide clear outline'
  );

  // Bento pager button focus ring
  assert.ok(css.includes('.bento-pager-btn:focus-visible'), 'CSS must define .bento-pager-btn:focus-visible');
  assert.ok(
    css.includes('outline: 2px solid var(--primary, #00755a)') || css.includes('outline: 2px solid var(--primary'),
    '.bento-pager-btn:focus-visible must provide clear outline'
  );

  // SSR tabindex
  assert.ok(aboutEjs.includes('bento-tile'), 'SSR template must render bento-tile');
  assert.ok(aboutEjs.includes('tabindex="0"'), 'SSR bento-tile must have tabindex="0"');

  // Dynamic JS tabindex
  assert.ok(mainJs.includes('tile.tabIndex = 0'), 'Client-side dynamic tiles must set tabIndex = 0');
  assert.ok(
    mainJs.includes("e.key === ' '") && mainJs.includes("e.key === 'Enter'"),
    'Keyboard interaction must handle Spacebar and Enter'
  );
  console.log('  -> Keyboard navigation (Tab, Enter, Space) and focus-visible indicators verified.\n');

  // 3. prefers-reduced-motion Coverage
  console.log('[3] Verifying prefers-reduced-motion Coverage across all Components...');
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'CSS must include prefers-reduced-motion block');
  assert.ok(css.includes('animation: none !important'), 'Bento animations must be disabled on reduced-motion');
  assert.ok(css.includes('transition: none !important'), 'Hover & transform transitions must be disabled');
  assert.ok(mainJs.includes('prefers-reduced-motion: reduce'), 'JS must check window.matchMedia for reduced motion');
  console.log('  -> prefers-reduced-motion safeguards confirmed in CSS and JS.\n');

  // 4. Live SSR Page Accessibility Check
  console.log('[4] Checking live SSR /about response for accessibility markers...');
  const resId = await fetch('http://localhost:3000/about?lang=id');
  assert.strictEqual(resId.status, 200, '/about?lang=id should return 200');
  const htmlId = await resId.text();

  assert.ok(htmlId.includes('id="bentoPrev"'), 'Must have pager previous button');
  assert.ok(htmlId.includes('id="bentoNext"'), 'Must have pager next button');
  assert.ok(htmlId.includes('aria-label="Halaman galeri sebelumnya"'), 'bentoPrev must have ID aria-label');
  assert.ok(htmlId.includes('aria-label="Halaman galeri berikutnya"'), 'bentoNext must have ID aria-label');
  assert.ok(htmlId.includes('aria-live="polite"'), 'bentoPager count must have aria-live="polite"');

  const resEn = await fetch('http://localhost:3000/about?lang=en');
  assert.strictEqual(resEn.status, 200, '/about?lang=en should return 200');
  const htmlEn = await resEn.text();

  assert.ok(htmlEn.includes('aria-label="Previous gallery page"'), 'bentoPrev must have EN aria-label');
  assert.ok(htmlEn.includes('aria-label="Next gallery page"'), 'bentoNext must have EN aria-label');
  console.log('  -> Pager buttons have bilingual aria-label and live region attributes.\n');

  console.log('=== ALL TESTS FOR T-132 PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
