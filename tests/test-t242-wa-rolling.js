import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rootDir = process.cwd();
const templatePath = path.join(rootDir, 'views/partials/whatsapp-btn.ejs');
const template = fs.readFileSync(templatePath, 'utf8');

console.log('--- TEST SUITE T-242: WhatsApp Weighted Rolling SSR ---');

// Test 1: Weighted Rolling Distribution (40% vs 60%) across 1,000 SSR iterations
const multiSettings = {
  whatsapp_numbers_json: JSON.stringify([
    { number: '628111111111', formatted: '628111111111', label: 'Sales A Jakarta', percentage: 40 },
    { number: '628222222222', formatted: '628222222222', label: 'Sales B Bandung', percentage: 60 }
  ]),
  whatsapp_number: '628999999999',
  whatsapp_default_message: 'Halo PT Euodoo, salam dari ID',
  whatsapp_default_message_en: 'Hello PT Euodoo, greetings from EN'
};

const ITERATIONS = 1000;
let countA = 0;
let countB = 0;

for (let i = 0; i < ITERATIONS; i++) {
  const html = ejs.render(template, {
    settings: multiSettings,
    currentLang: 'id'
  }, { filename: templatePath });

  const hasA = html.includes('628111111111');
  const hasB = html.includes('628222222222');

  // Verify Mutual Exclusivity (Security & DOM Hygiene)
  assert.ok(hasA || hasB, 'Iteration must select either number A or number B');
  assert.ok(!(hasA && hasB), 'Iteration must NEVER leak both numbers into the public DOM');

  // Verify internal admin labels are NOT leaked to public DOM
  assert.ok(!html.includes('Sales A Jakarta'), 'Public DOM must not leak internal label Sales A');
  assert.ok(!html.includes('Sales B Bandung'), 'Public DOM must not leak internal label Sales B');

  if (hasA) countA++;
  if (hasB) countB++;
}

const pctA = (countA / ITERATIONS) * 100;
const pctB = (countB / ITERATIONS) * 100;
console.log(`Distribution over ${ITERATIONS} iterations: Number A (40%) = ${pctA.toFixed(1)}%, Number B (60%) = ${pctB.toFixed(1)}%`);

// 40% target with reasonable binomial confidence interval (+/- 6% for N=1000)
assert.ok(pctA >= 34 && pctA <= 46, `Expected ~40% for A, received ${pctA}%`);
assert.ok(pctB >= 54 && pctB <= 66, `Expected ~60% for B, received ${pctB}%`);
console.log('✓ Test 1 Passed: SSR weighted distribution strictly matches configured percentages.');

// Test 2: Bilingual Greeting URI Encoding
const htmlId = ejs.render(template, {
  settings: multiSettings,
  currentLang: 'id'
}, { filename: templatePath });
assert.ok(htmlId.includes(encodeURIComponent('Halo PT Euodoo, salam dari ID')), 'Indonesian greeting must be properly encoded');
assert.ok(htmlId.includes('Chat WhatsApp'), 'Indonesian tooltip must be Chat WhatsApp');

const htmlEn = ejs.render(template, {
  settings: multiSettings,
  currentLang: 'en'
}, { filename: templatePath });
assert.ok(htmlEn.includes(encodeURIComponent('Hello PT Euodoo, greetings from EN')), 'English greeting must be properly encoded');
assert.ok(htmlEn.includes('Chat on WhatsApp'), 'English tooltip must be Chat on WhatsApp');
console.log('✓ Test 2 Passed: Bilingual greetings and tooltips render accurately.');

// Test 3: Fallback Mechanism when whatsapp_numbers_json is empty or invalid
const fallbackSettings = {
  whatsapp_numbers_json: '[]',
  whatsapp_number: '081234567890',
  whatsapp_formatted_number: '6281234567890',
  whatsapp_default_message: 'Pesan fallback'
};

const htmlFallback = ejs.render(template, {
  settings: fallbackSettings,
  currentLang: 'id'
}, { filename: templatePath });

assert.ok(htmlFallback.includes('https://wa.me/6281234567890'), 'Should fall back to formatted legacy number');
console.log('✓ Test 3 Passed: Fallback to single legacy number works seamlessly.');

// Test 4: Fallback when total percentage is NOT 100%
const invalidSumSettings = {
  whatsapp_numbers_json: JSON.stringify([
    { number: '628111111111', percentage: 40 },
    { number: '628222222222', percentage: 40 } // Total = 80% (invalid)
  ]),
  whatsapp_number: '628999999999',
  whatsapp_default_message: 'Pesan fallback invalid sum'
};

const htmlInvalidSum = ejs.render(template, {
  settings: invalidSumSettings,
  currentLang: 'id'
}, { filename: templatePath });

assert.ok(htmlInvalidSum.includes('628999999999'), 'Should fall back to legacy number when sum != 100%');
assert.ok(!htmlInvalidSum.includes('628111111111'), 'Should not use multi-number if sum != 100%');
console.log('✓ Test 4 Passed: Invalid sum percentage gracefully falls back to legacy number.');

// Test 5: Empty configuration gracefully renders nothing
const emptySettings = {
  whatsapp_numbers_json: '[]',
  whatsapp_number: '',
  whatsapp_formatted_number: ''
};

const htmlEmpty = ejs.render(template, {
  settings: emptySettings,
  currentLang: 'id'
}, { filename: templatePath });

assert.strictEqual(htmlEmpty.trim(), '', 'Should render empty string if no numbers configured');
console.log('✓ Test 5 Passed: Empty configuration renders clean empty DOM.');

console.log('ALL T-242 TESTS PASSED SUCCESSFULLY! ✅');
process.exit(0);

