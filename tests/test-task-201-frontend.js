import fs from 'fs';
import path from 'path';
import assert from 'assert';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('--- RUNNING TEST SUITE FOR TASK T-201 ---');

  // 1. Verify CSS rules in public/css/components.css
  const cssContent = fs.readFileSync(path.join(__dirname, '../public/css/components.css'), 'utf-8');
  assert(cssContent.includes('.pd-card'), 'CSS must include .pd-card');
  assert(cssContent.includes('.pd-crumb'), 'CSS must include .pd-crumb');
  assert(cssContent.includes('.pd-title'), 'CSS must include .pd-title');
  assert(cssContent.includes('.pd-short-desc'), 'CSS must include .pd-short-desc');
  assert(cssContent.includes('.pd-grid'), 'CSS must include .pd-grid');
  assert(cssContent.includes('.pd-gallery'), 'CSS must include .pd-gallery');
  assert(cssContent.includes('.pd-gallery-main'), 'CSS must include .pd-gallery-main');
  assert(cssContent.includes('.pd-thumbs'), 'CSS must include .pd-thumbs');
  assert(cssContent.includes('.pd-variants'), 'CSS must include .pd-variants');
  assert(cssContent.includes('.pd-v-pills'), 'CSS must include .pd-v-pills');
  assert(cssContent.includes('.pd-cta-row'), 'CSS must include .pd-cta-row');
  assert(cssContent.includes('.pd-btn'), 'CSS must include .pd-btn');
  assert(cssContent.includes('.pd-btn-wa'), 'CSS must include .pd-btn-wa');
  assert(cssContent.includes('.pd-btn-outline'), 'CSS must include .pd-btn-outline');
  assert(cssContent.includes('.pd-tabs'), 'CSS must include .pd-tabs');
  assert(cssContent.includes('.pd-tabbar'), 'CSS must include .pd-tabbar');
  assert(cssContent.includes('.pd-panel'), 'CSS must include .pd-panel');
  assert(cssContent.includes('.pd-size-scroll'), 'CSS must include .pd-size-scroll');
  assert(cssContent.includes('.pd-size'), 'CSS must include .pd-size');
  assert(!cssContent.includes('.pd-sticky-cta'), 'CSS must NOT include .pd-sticky-cta (distilled)');
  assert(cssContent.includes('attr(data-l)'), 'CSS must include attr(data-l) for mobile table card mode');
  console.log('✓ All CSS classes and required responsive rules found in components.css');

  // 2. Verify public/js/product-detail.js
  const jsContent = fs.readFileSync(path.join(__dirname, '../public/js/product-detail.js'), 'utf-8');
  // Check no comments exist in JS
  const hasLineComment = /(^|[^\:])\/\/.+/m.test(jsContent);
  const hasBlockComment = /\/\*[\s\S]*?\*\//m.test(jsContent);
  assert(!hasLineComment && !hasBlockComment, 'product-detail.js must contain zero comments');
  assert(jsContent.includes('pd-fade-out'), 'JS must include fade-out class toggle');
  assert(jsContent.includes('decode'), 'JS must include img.decode');
  assert(jsContent.includes('prefers-reduced-motion'), 'JS must check prefers-reduced-motion');
  console.log('✓ public/js/product-detail.js is valid and comment-free');

  // 3. Verify views/public/product-detail.ejs
  const ejsContent = fs.readFileSync(path.join(__dirname, '../views/public/product-detail.ejs'), 'utf-8');
  const hasHtmlComment = /<!--[\s\S]*?-->/.test(ejsContent);
  assert(!hasHtmlComment, 'views/public/product-detail.ejs must contain zero HTML comments');
  assert(!ejsContent.includes('onclick='), 'EJS must not contain inline onclick');
  assert(!ejsContent.includes('style='), 'EJS must not contain inline style');
  console.log('✓ views/public/product-detail.ejs contains zero comments and zero inline styles/handlers');

  // 4. Verify HTTP Response from dev server
  const html = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:3000/products/soft-loop-handle-shopping-bag', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  assert(html.includes('class="pd-card"'), 'Rendered HTML contains .pd-card');
  assert(html.includes('class="pd-crumb"'), 'Rendered HTML contains .pd-crumb');
  assert(html.includes('class="pd-title"'), 'Rendered HTML contains .pd-title');
  assert(html.includes('class="pd-short-desc"'), 'Rendered HTML contains .pd-short-desc');
  assert(html.includes('class="pd-grid"'), 'Rendered HTML contains .pd-grid');
  assert(html.includes('class="pd-gallery"'), 'Rendered HTML contains .pd-gallery');
  assert(html.includes('class="pd-gallery-main"'), 'Rendered HTML contains .pd-gallery-main');
  assert(html.includes('class="pd-thumbs"'), 'Rendered HTML contains .pd-thumbs');
  assert(html.includes('class="pd-variants"'), 'Rendered HTML contains .pd-variants');
  assert(html.includes('class="pd-tabbar"'), 'Rendered HTML contains .pd-tabbar');
  assert(html.includes('class="pd-size"'), 'Rendered HTML contains .pd-size');
  assert(html.includes('data-l="Kode Produk"'), 'Rendered HTML size table contains data-l="Kode Produk"');
  assert(!html.includes('class="pd-sticky-cta"'), 'Rendered HTML must NOT contain .pd-sticky-cta (distilled)');
  assert(html.includes('href="https://wa.me/'), 'Rendered HTML contains WhatsApp quote link');
  assert(html.includes('Halo%2C%20saya%20tertarik%20dengan%20produk%20Soft%20Loop%20Handle%20Shopping%20Bag'), 'Rendered HTML contains properly encoded WhatsApp message');
  assert(html.includes('<script src="/js/product-detail.js" defer></script>'), 'Rendered HTML includes product-detail.js script tag');
  console.log('✓ HTTP Response successfully verified with all required HTML/DOM elements and data-l attributes');

  console.log('\n--- ALL T-201 ACCEPTANCE TESTS PASSED! ---');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
