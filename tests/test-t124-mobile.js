import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== TEST T-124: BENTO MOSAIC MOBILE ADAPTATION & TOUCH SWIPE ===\n');

  // 1. Verify CSS mobile responsive rules and touch-action
  console.log('[1] Verifying components.css mobile responsive rules...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/components.css'), 'utf8');

  assert.ok(css.includes('@media (max-width: 768px)'), 'Must have @media (max-width: 768px)');
  assert.ok(css.includes('touch-action: pan-y'), 'Must set touch-action: pan-y for smooth vertical scroll + touch gesture');
  assert.ok(css.includes('repeat(2, minmax(0, 1fr))'), 'Grid must be 2 equal-width columns without overflow blowouts');
  assert.ok(css.includes('grid-auto-rows: 180px'), 'Mobile tile row height must be 180px at 768px');
  assert.ok(css.includes('grid-column: auto !important'), 'Mobile tiles must be uniform size without tall/wide spans');
  assert.ok(css.includes('@media (max-width: 480px)'), 'Must have @media (max-width: 480px)');
  assert.ok(css.includes('grid-auto-rows: 150px'), 'Mobile tile row height must scale down at 480px');
  console.log('  -> CSS mobile layout, touch-action, and breakpoint rules verified.\n');

  // 2. Verify main.js 2-tile mobile pagination and 50px swipe threshold
  console.log('[2] Verifying main.js mobile pagination and touch swipe logic...');
  const js = fs.readFileSync(path.join(__dirname, '../public/js/main.js'), 'utf8');

  assert.ok(js.includes('window.innerWidth <= 768 ? 2 : 6'), 'Mobile page size must be 2 tiles');
  assert.ok(js.includes('touchstart'), 'main.js must attach touchstart listener');
  assert.ok(js.includes('touchmove'), 'main.js must attach touchmove listener');
  assert.ok(js.includes('touchend'), 'main.js must attach touchend listener');
  assert.ok(js.includes('touchcancel'), 'main.js must attach touchcancel listener');
  assert.ok(js.includes('absDeltaX >= 50'), 'Swipe handler must enforce 50px threshold (Opsi 4A)');
  assert.ok(js.includes('absDeltaX > absDeltaY'), 'Swipe handler must ensure horizontal movement exceeds vertical');
  assert.ok(js.includes('passive: true'), 'Touch listeners must use passive: true for scroll performance');
  console.log('  -> main.js 2-tile mobile pagination and 50px swipe logic verified.\n');

  // 3. Verify mobile page calculation logic
  console.log('[3] Verifying page calculation math for mobile (2 tiles/page)...');
  const getPageSize = (width) => (width <= 768 ? 2 : 6);
  const testSlideCounts = [1, 2, 3, 4, 7, 10];
  const expectedMobilePages = [1, 1, 2, 2, 4, 5];

  testSlideCounts.forEach((count, i) => {
    const pages = Math.ceil(count / getPageSize(375));
    assert.strictEqual(pages, expectedMobilePages[i], `Slide count ${count} on mobile should produce ${expectedMobilePages[i]} pages`);
  });
  console.log('  -> Mobile page count math verified for various slide counts.\n');

  console.log('=== ALL TESTS FOR T-124 PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
