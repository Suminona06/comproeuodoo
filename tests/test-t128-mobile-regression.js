import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== TEST T-128: MOBILE VERIFICATION & REGRESSION (ABOUT ID/EN) ===\n');

  // 1. Fetch Indonesian & English About Page
  console.log('[1] Fetching /about in ID and EN over HTTP...');
  const resId = await fetch('http://localhost:3000/about?lang=id');
  assert.strictEqual(resId.status, 200, '/about?lang=id must return 200');
  const htmlId = await resId.text();

  const resEn = await fetch('http://localhost:3000/about?lang=en');
  assert.strictEqual(resEn.status, 200, '/about?lang=en must return 200');
  const htmlEn = await resEn.text();
  console.log('  -> Both ID and EN pages returned HTTP 200.\n');

  // 2. Verify all 5 sections exist on both pages
  console.log('[2] Verifying core sections on /about...');
  assert.ok(htmlId.includes('class="page-hero"'), 'ID page must include .page-hero');
  assert.ok(htmlEn.includes('class="page-hero"'), 'EN page must include .page-hero');
  ['sejarah', 'visi-misi', 'core-values', 'galeri'].forEach((sec) => {
    assert.ok(htmlId.includes(`id="${sec}"`), `ID page must include section #${sec}`);
    assert.ok(htmlEn.includes(`id="${sec}"`), `EN page must include section #${sec}`);
  });
  console.log('  -> All 5 sections (.page-hero, #sejarah, #visi-misi, #core-values, #galeri) present.\n');

  // 3. Verify Hero section (no CTA, kicker, breadcrumb, title)
  console.log('[3] Verifying Hero section structure...');
  assert.ok(!htmlId.includes('hero-cta-btn'), 'ID Hero must not have CTA button');
  assert.ok(!htmlEn.includes('hero-cta-btn'), 'EN Hero must not have CTA button');
  assert.ok(htmlId.includes('Tentang Kami'), 'ID Hero must have Indonesian title');
  assert.ok(htmlEn.includes('About Us'), 'EN Hero must have English title');
  console.log('  -> Hero section verified without CTA and proper bilingual titles.\n');

  // 4. Verify Bento Mosaic Gallery structure
  console.log('[4] Verifying Bento Mosaic Gallery structure...');
  assert.ok(htmlId.includes('id="bentoGallery"'), 'Must have #bentoGallery');
  assert.ok(htmlId.includes('id="bentoGrid"'), 'Must have #bentoGrid');
  assert.ok(htmlId.includes('class="bento-tile'), 'Must have .bento-tile elements');
  assert.ok(htmlId.includes('id="bentoPager"'), 'Must have #bentoPager');
  assert.ok(htmlId.includes('id="bentoCur"'), 'Must have #bentoCur');
  assert.ok(htmlId.includes('id="bentoTotal"'), 'Must have #bentoTotal');
  assert.ok(htmlId.includes('id="bentoPrev"'), 'Must have #bentoPrev');
  assert.ok(htmlId.includes('id="bentoNext"'), 'Must have #bentoNext');
  assert.ok(htmlId.includes('id="bentoGalleryData"'), 'Must have JSON data block #bentoGalleryData');
  console.log('  -> Bento Gallery markup, data block, and pager controls verified.\n');

  // 5. Verify CSS Responsive & Anti-overflow constraints
  console.log('[5] Verifying CSS responsive rules for 320px safety...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/components.css'), 'utf8');
  assert.ok(css.includes('@media (max-width: 768px)'), 'Must have 768px breakpoint');
  assert.ok(css.includes('@media (max-width: 480px)'), 'Must have 480px breakpoint');
  assert.ok(css.includes('repeat(2, minmax(0, 1fr))'), '2-column grid must use minmax(0, 1fr) to prevent overflow');
  assert.ok(css.includes('word-break: break-word'), 'Bento title must have word-break for ultra-narrow screens');
  assert.ok(css.includes('touch-action: pan-y'), 'Bento gallery must have touch-action: pan-y');
  console.log('  -> Responsive CSS verified for seamless reflow from 320px to desktop.\n');

  console.log('=== ALL TESTS FOR T-128 PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
