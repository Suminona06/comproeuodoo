import assert from 'assert';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== TEST T-123: BENTO MOSAIC ANIMATIONS & POLISH ===\n');

  // 1. Verify CSS keyframes, stagger classes, hover, and reduced motion
  console.log('[1] Verifying components.css animation and interaction rules...');
  const css = fs.readFileSync(path.join(__dirname, '../public/css/components.css'), 'utf8');

  assert.ok(css.includes('@keyframes bentoTileOut'), 'Must have @keyframes bentoTileOut');
  assert.ok(css.includes('@keyframes bentoTileIn'), 'Must have @keyframes bentoTileIn');
  assert.ok(css.includes('.bento-tile.is-leaving'), 'Must have .bento-tile.is-leaving');
  assert.ok(css.includes('calc(var(--tile-i, 0) * 45ms)'), 'Leaving stagger delay must use 45ms step');
  assert.ok(css.includes('.bento-tile.is-entering'), 'Must have .bento-tile.is-entering');
  assert.ok(css.includes('calc(var(--tile-i, 0) * 60ms)'), 'Entering stagger delay must use 60ms step');
  assert.ok(css.includes('.bento-tile:active'), 'Must have .bento-tile:active');
  assert.ok(css.includes('scale(0.98)'), ':active must provide scale(0.98) feedback');
  assert.ok(css.includes('.bento-tile:focus-visible'), 'Must have .bento-tile:focus-visible');
  assert.ok(css.includes('var(--sky'), 'Focus outline must use var(--sky)');
  assert.ok(css.includes('@media (hover: hover)'), 'Hover zoom must be scoped to @media (hover: hover)');
  assert.ok(css.includes('scale(1.04)'), 'Hover must scale img by 1.04');
  assert.ok(css.includes('rgba(10, 25, 47, 0.88)'), 'Hover must darken caption overlay gradient');
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Must have @media (prefers-reduced-motion: reduce)');
  console.log('  -> CSS animation, hover, active, focus, and reduced-motion rules verified.\n');

  // 2. Verify main.js transition coordinator and keyboard handling
  console.log('[2] Verifying main.js transition coordinator and keyboard handlers...');
  const js = fs.readFileSync(path.join(__dirname, '../public/js/main.js'), 'utf8');

  assert.ok(js.includes('transitionToPage'), 'main.js must implement transitionToPage');
  assert.ok(js.includes('isTransitioning'), 'main.js must guard concurrent calls with isTransitioning');
  assert.ok(js.includes('is-leaving'), 'main.js must add is-leaving class to exiting tiles');
  assert.ok(js.includes('is-entering'), 'main.js must add is-entering class to mounting tiles');
  assert.ok(js.includes('--tile-i'), 'main.js must set --tile-i CSS property for stagger delay');
  assert.ok(js.includes('prefers-reduced-motion'), 'main.js must respect prefers-reduced-motion');
  assert.ok(js.includes('ArrowLeft') && js.includes('ArrowRight'), 'main.js must handle ArrowLeft & ArrowRight');
  assert.ok(js.includes('Spacebar') || js.includes("' '"), 'main.js must prevent spacebar scroll jump on focused tile');
  assert.ok(js.includes('Enter'), 'main.js must prevent Enter default on focused tile');
  console.log('  -> main.js transition coordinator and keyboard handlers verified.\n');

  // 3. Verify about.ejs renders SSR tiles with --tile-i and tabindex="0"
  console.log('[3] Verifying views/public/about.ejs SSR tile attributes...');
  const template = fs.readFileSync(path.join(__dirname, '../views/public/about.ejs'), 'utf8');
  const testSlides = [
    { id: 1, image_url: '/images/1.jpg', category_id: 'P1', title_id: 'Title 1' },
    { id: 2, image_url: '/images/2.jpg', category_id: 'P2', title_id: 'Title 2' }
  ];
  const rendered = ejs.render(template, {
    currentLang: 'id',
    lang: 'id',
    settings: { company_name: 'PT Euodoo' },
    title: 'Tentang Kami',
    path: '/about',
    about: {},
    heroBanner: null,
    gallerySlides: testSlides,
    stats: [],
    timeline: [],
    galleryHeader: { title_id: 'Galeri' },
    storyHeader: null,
    visionMissionImages: null
  }, { filename: path.join(__dirname, '../views/public/about.ejs') });

  assert.ok(rendered.includes('tabindex="0"'), 'SSR bento tiles must have tabindex="0"');
  assert.ok(rendered.includes('style="--tile-i: 0;"'), 'SSR tile 0 must have --tile-i: 0');
  assert.ok(rendered.includes('style="--tile-i: 1;"'), 'SSR tile 1 must have --tile-i: 1');
  console.log('  -> views/public/about.ejs SSR tile attributes verified.\n');

  console.log('=== ALL TESTS FOR T-123 PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
