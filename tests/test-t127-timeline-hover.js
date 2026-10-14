import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== TEST T-127: TRANSIKSI HOVER TIMELINE SEJARAH ===\n');

  console.log('[1] Verifying components.css timeline hover & interaction rules...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/components.css'), 'utf8');

  // 1. Base transitions
  assert.ok(css.includes('.tl-item {') && css.includes('transition: transform 250ms ease;'), '.tl-item must have transition for transform');
  assert.ok(css.includes('.tl-item::before {') && css.includes('transition: transform 250ms ease, box-shadow 250ms ease'), '.tl-item::before must have transition for transform and box-shadow');
  assert.ok(css.includes('.tl-item::after {') && css.includes('opacity: 0;'), '.tl-item::after must exist as overlay segment with initial opacity 0');
  assert.ok(css.includes('.tl-title {') && css.includes('transition: color 200ms ease;'), '.tl-title must have transition for color');

  // 2. Hover states inside @media (hover: hover)
  assert.ok(css.includes('@media (hover: hover)'), 'Hover rules must be scoped to @media (hover: hover)');
  assert.ok(css.includes('.tl-item:hover {') && css.includes('translateX(4px)'), '.tl-item:hover must translate 4px right');
  assert.ok(css.includes('.tl-item:hover::before {') && css.includes('scale(1.3)'), '.tl-item:hover::before must scale by 1.3');
  assert.ok(css.includes('0 0 0 6px rgba(0, 85, 184, 0.15)'), '.tl-item:hover::before must glow with box-shadow');
  assert.ok(css.includes('.tl-item:hover::after {') && css.includes('opacity: 0.6'), '.tl-item:hover::after segment must brighten to opacity 0.6');
  assert.ok(css.includes('.tl-item:hover .tl-title {') && css.includes('var(--primary'), '.tl-item:hover .tl-title must change to primary color');

  // 3. Touch active feedback
  assert.ok(css.includes('.tl-item:active {') && css.includes('translateX(2px)'), '.tl-item:active must provide translateX(2px) feedback');

  // 4. Reduced motion fallback
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'prefers-reduced-motion must be handled');
  assert.ok(css.includes('.tl-item:hover::before {\n    transform: none !important;'), 'Reduced motion must disable hover transform on ::before');

  console.log('  -> All timeline hover, active, and reduced motion rules verified.\n');
  console.log('=== ALL TESTS FOR T-127 PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
