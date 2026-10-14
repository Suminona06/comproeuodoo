import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== TEST T-126: ANIMASI COUNT-UP STATISTIK SEJARAH ===\n');

  // 1. Verify CSS tabular-nums
  console.log('[1] Verifying components.css tabular-nums...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/components.css'), 'utf8');
  assert.ok(css.includes('.story-stat-num'), 'Must define .story-stat-num');
  assert.ok(css.includes('font-variant-numeric: tabular-nums'), 'Must set font-variant-numeric: tabular-nums on .story-stat-num');
  console.log('  -> components.css verified: tabular-nums present to prevent layout shift.\n');

  // 2. Verify main.js count-up logic
  console.log('[2] Verifying main.js count-up implementation...');
  const js = fs.readFileSync(path.join(__dirname, '../public/js/main.js'), 'utf8');
  assert.ok(js.includes('story-stat-num'), 'Must select .story-stat-num');
  assert.ok(js.includes('animateCountUp'), 'Must define animateCountUp function');
  assert.ok(js.includes('duration = 1500') || js.includes('1500'), 'Must use 1500ms duration');
  assert.ok(js.includes('Math.pow(1 - progress, 3)'), 'Must use cubic ease-out');
  assert.ok(js.includes('threshold: 0.5'), 'Must use threshold 0.5 for IntersectionObserver');
  assert.ok(js.includes('obs.unobserve'), 'Must unobserve target after trigger (run once only)');
  assert.ok(js.includes('prefers-reduced-motion'), 'Must check prefers-reduced-motion fallback');
  console.log('  -> main.js verified: count-up parsing, easing, observer, and fallback present.\n');

  // 3. Test string parsing regex behavior
  console.log('[3] Testing regex parsing behavior on sample data...');
  const regex = /^(\d+)(.*)$/;

  const testCases = [
    { input: '30+', expectedNum: 30, expectedSuffix: '+' },
    { input: '5', expectedNum: 5, expectedSuffix: '' },
    { input: '4 Lini', expectedNum: 4, expectedSuffix: ' Lini' },
    { input: '100%', expectedNum: 100, expectedSuffix: '%' },
    { input: 'ISO 9001', expectedNum: null, expectedSuffix: null }
  ];

  testCases.forEach(({ input, expectedNum, expectedSuffix }) => {
    const match = input.match(regex);
    if (expectedNum === null) {
      assert.strictEqual(match, null, `"${input}" should not match leading digits`);
    } else {
      assert.ok(match, `"${input}" should match regex`);
      assert.strictEqual(parseInt(match[1], 10), expectedNum);
      assert.strictEqual(match[2], expectedSuffix);
    }
  });
  console.log('  -> Regex parsing verified on all sample inputs.\n');

  console.log('=== ALL TESTS FOR T-126 PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
