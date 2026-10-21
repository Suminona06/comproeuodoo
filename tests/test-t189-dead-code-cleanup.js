import fs from 'fs';
import path from 'path';
import assert from 'assert';
import http from 'http';

console.log('=== STARTING T-189 DEAD CODE CLEANUP & MODAL RETENTION TESTS ===');

// 1. Verify dead CSS classes are completely pruned from public/css/components.css
console.log('1. Verifying Dead CSS Classes Pruned from public/css/components.css:');
const cssPath = path.resolve('public/css/components.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const deadSelectors = [
  'brand-card',
  'brand-logo-wrap',
  'brand-meta-wrap',
  'brand-name-text',
  'brands-header',
  'brands-kicker',
  'brands-title',
  'brands-desc',
  'marquee-wrapper',
  'marquee-group'
];

deadSelectors.forEach(sel => {
  const regex = new RegExp(`\\.${sel}\\b`, 'g');
  const matches = cssContent.match(regex);
  assert.strictEqual(matches, null, `Selector .${sel} should have 0 occurrences in components.css, but found ${matches ? matches.length : 0}`);
  console.log(`  1a. Verified dead selector .${sel} is completely removed: PASSED`);
});

// 2. Verify modal zoom preview and zoom hint classes & logic are retained
console.log('2. Verifying Modal Zoom Preview & Zoom Hint Retained:');
const retainedCssSelectors = [
  'brand-preview-modal',
  'brand-modal-dialog',
  'brand-modal-backdrop',
  'brand-modal-close',
  'brand-modal-img-wrap',
  'brand-zoom-hint',
  'brand-fallback-initials'
];

retainedCssSelectors.forEach(sel => {
  const regex = new RegExp(`\\.${sel}\\b`, 'g');
  const matches = cssContent.match(regex);
  assert(matches && matches.length > 0, `Selector .${sel} should exist in components.css for modal zoom preview`);
  console.log(`  2a. Verified retained modal selector .${sel} exists: PASSED`);
});

// 3. Verify public/js/main.js has active modal zoom preview handler
console.log('3. Verifying public/js/main.js Modal Controller:');
const jsPath = path.resolve('public/js/main.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

assert(jsContent.includes('brandPreviewModal'), 'main.js must contain brandPreviewModal reference');
assert(jsContent.includes('.js-brand-preview-trigger'), 'main.js must attach listener to .js-brand-preview-trigger');
assert(jsContent.includes('brandModalCloseBtn'), 'main.js must handle close button');
console.log('  3a. Verified main.js brandPreviewModal event controller is active: PASSED');

// 4. Verify views/public/index.ejs contains brand marquee + zoom preview modal
console.log('4. Verifying views/public/index.ejs Markup:');
const ejsPath = path.resolve('views/public/index.ejs');
const ejsContent = fs.readFileSync(ejsPath, 'utf8');

assert(ejsContent.includes('brand-strip-marquee'), 'index.ejs must contain brand-strip-marquee');
assert(ejsContent.includes('brand-zoom-hint'), 'index.ejs must contain brand-zoom-hint for logo hover badge');
assert(ejsContent.includes('id="brandPreviewModal"'), 'index.ejs must contain #brandPreviewModal element');
assert(ejsContent.includes('js-brand-preview-trigger'), 'index.ejs must contain js-brand-preview-trigger on logos');
console.log('  4a. Verified index.ejs contains strip marquee, zoom hint, and preview modal: PASSED');

// 5. Live HTTP verification on local dev server
console.log('5. Live HTTP Integration Testing:');
const req = http.get('http://127.0.0.1:3000', (res) => {
  assert.strictEqual(res.statusCode, 200, `Expected HTTP 200 from homepage, got ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    assert(body.includes('brand-strip-marquee'), 'Live HTML must contain brand-strip-marquee');
    assert(body.includes('brandPreviewModal'), 'Live HTML must contain brandPreviewModal');
    assert(body.includes('brand-zoom-hint'), 'Live HTML must contain brand-zoom-hint');
    console.log('  5a. Live homepage returns 200 with active marquee & zoom modal: PASSED');
    console.log('=== ALL T-189 DEAD CODE CLEANUP & MODAL RETENTION TESTS PASSED! ===');
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('HTTP request failed:', err.message);
  process.exit(1);
});
