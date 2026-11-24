import assert from 'assert';
import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3000';
const VIEWPORTS = [
  { name: '320px', width: 320, height: 720 },
  { name: '375px', width: 375, height: 812 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '1280px', width: 1280, height: 800 },
  { name: '1440px', width: 1440, height: 900 }
];
const LANGS = ['id', 'en'];

function attachErrorListeners(page, errors) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.pageErrors.push(err.message);
  });
}

async function injectClsObserver(page) {
  await page.addInitScript(() => {
    window.__clsScore = 0;
    if (!('PerformanceObserver' in window)) return;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__clsScore += entry.value;
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  });
}

async function assertNoOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  assert.ok(
    overflow.scrollWidth <= overflow.innerWidth,
    `${label}: horizontal overflow (${overflow.scrollWidth} > ${overflow.innerWidth})`
  );
}

async function verifyHomeLayout(page, vp, lang) {
  const data = await page.evaluate(() => {
    const sec = document.querySelector('.sec-news');
    const h2 = sec?.querySelector('.hnc-heading-group h2');
    const viewAll = sec?.querySelector('.hnc-view-all');
    const prev = document.getElementById('hncPrevBtn');
    const next = document.getElementById('hncNextBtn');
    const originals = Array.from(document.querySelectorAll('.hnc-slide:not(.hnc-slide--clone)'));
    const wide = document.querySelector('.hnc-slide--wide:not(.hnc-slide--clone)');
    const compact = document.querySelector('.hnc-slide--compact:not(.hnc-slide--clone)');
    const baseline = ['.hero', '.sec-intro', '.sec-products', '.sec-why-us', '.brand-strip-sec', '.site-footer']
      .every((sel) => Boolean(document.querySelector(sel)));
    return {
      hasSec: Boolean(sec && document.querySelector('.hnc-header')),
      baseline,
      h2Rect: h2 ? h2.getBoundingClientRect() : null,
      viewAllRect: viewAll ? viewAll.getBoundingClientRect() : null,
      prevRect: prev ? prev.getBoundingClientRect() : null,
      nextRect: next ? next.getBoundingClientRect() : null,
      slideCount: originals.length,
      hasTypeLabel: originals.every((s) => Boolean(s.querySelector('.hnc-type'))),
      hasNoDate: originals.every((s) => !s.querySelector('time')),
      wideRect: wide ? wide.getBoundingClientRect() : null,
      compactRect: compact ? compact.getBoundingClientRect() : null,
      cls: window.__clsScore || 0
    };
  });

  assert.ok(data.hasSec, `Home ${lang} ${vp.name}: .sec-news & .hnc-header must exist`);
  assert.ok(data.baseline, `Home ${lang} ${vp.name}: other homepage sections must stay intact`);
  assert.ok(data.slideCount >= 1 && data.slideCount <= 6, `Home ${lang} ${vp.name}: slide count 1..6`);
  assert.ok(data.hasTypeLabel && data.hasNoDate, `Home ${lang} ${vp.name}: .hnc-type without <time>`);
  assert.ok(data.cls < 0.01, `Home ${lang} ${vp.name}: CLS ${data.cls} must be < 0.01`);
  if (vp.width >= 768 && data.h2Rect && data.viewAllRect) {
    assert.ok(data.viewAllRect.left >= data.h2Rect.right - 2, `Home ${lang} ${vp.name}: view-all right of h2`);
  }
  if (data.prevRect && data.nextRect) {
    assert.ok(data.prevRect.width >= 44 && data.prevRect.height >= 44, 'Prev arrow >= 44px');
    assert.ok(data.nextRect.width >= 44 && data.nextRect.height >= 44, 'Next arrow >= 44px');
  }
  if (vp.width >= 1024 && data.wideRect && data.compactRect) {
    assert.ok(data.wideRect.width > data.compactRect.width, 'Desktop wide slide > compact slide');
    assert.ok(Math.abs(data.wideRect.height - data.compactRect.height) <= 2, 'Desktop slide heights match');
  }
}

async function verifyCarouselInteractions(page) {
  await page.locator('.sec-news').scrollIntoViewIfNeeded();
  const isStatic = await page.locator('#hncCarousel').evaluate((el) => el.classList.contains('is-static'));
  if (isStatic) return;

  const getTransform = () => page.locator('#hncTrack').evaluate((el) => el.style.transform);
  const t0 = await getTransform();
  await page.waitForTimeout(3350);
  const tAuto = await getTransform();
  assert.notStrictEqual(tAuto, t0, 'Carousel autoplay should advance after 3s');

  await page.locator('#hncCarousel').hover();
  await page.waitForTimeout(3250);
  assert.strictEqual(await getTransform(), tAuto, 'Carousel should pause on hover');
  await page.mouse.move(0, 0);

  await page.locator('#hncNextBtn').focus();
  await page.waitForTimeout(3250);
  assert.strictEqual(await getTransform(), tAuto, 'Carousel should pause on focus');

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(3250);
  assert.strictEqual(await getTransform(), tAuto, 'Carousel should pause when tab hidden');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await page.locator('#hncNextBtn').click();
  await page.locator('#hncNextBtn').click();
  await page.locator('#hncPrevBtn').click();
  await page.waitForTimeout(600);
  const tClick = await getTransform();
  assert.ok(tClick.includes('translate3d'), 'Rapid prev/next clicks must keep valid transform');

  await page.locator('#hncNextBtn').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);
  assert.notStrictEqual(await getTransform(), tClick, 'ArrowRight must advance carousel');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(600);
}

async function verifyReducedMotion(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce'
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/?lang=id`, { waitUntil: 'load' });
  const isStatic = await page.locator('#hncCarousel').evaluate((el) => el.classList.contains('is-static'));
  if (!isStatic) {
    const t0 = await page.locator('#hncTrack').evaluate((el) => el.style.transform);
    await page.waitForTimeout(3300);
    assert.strictEqual(await page.locator('#hncTrack').evaluate((el) => el.style.transform), t0, 'Reduced motion disables autoplay');
    await page.locator('#hncNextBtn').focus();
    await page.keyboard.press('ArrowRight');
    assert.notStrictEqual(await page.locator('#hncTrack').evaluate((el) => el.style.transform), t0, 'Manual ArrowRight still works in reduced motion');
  }
  await ctx.close();
}

async function verifyFlatEditorialCards(page, label) {
  const cardCheck = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.nwl-card'));
    if (!cards.length) return { count: 0 };
    const first = cards[0];
    const cs = getComputedStyle(first);
    const media = first.querySelector('.nwl-card-media');
    const mRect = media ? media.getBoundingClientRect() : null;
    const action = first.querySelector('.nwl-card-action');
    const aCs = action ? getComputedStyle(action) : null;
    const link = first.querySelector('.nwl-card-link');
    const lRect = link ? link.getBoundingClientRect() : null;
    const svg = link ? link.querySelector('svg') : null;
    return {
      count: cards.length,
      bg: cs.backgroundColor,
      borderTop: cs.borderTopWidth,
      shadow: cs.boxShadow,
      ratio: mRect && mRect.height > 0 ? mRect.width / mRect.height : 0,
      actionBorder: aCs ? aCs.borderTopWidth : '',
      actionJustify: aCs ? aCs.justifyContent : '',
      linkHeight: lRect ? lRect.height : 0,
      hasSvg: Boolean(svg),
      hasAuthor: Boolean(first.querySelector('.nwl-card-author'))
    };
  });
  if (cardCheck.count === 0) return;
  assert.strictEqual(cardCheck.bg, 'rgba(0, 0, 0, 0)', `${label}: .nwl-card background transparent`);
  assert.strictEqual(cardCheck.borderTop, '0px', `${label}: .nwl-card no border`);
  assert.strictEqual(cardCheck.shadow, 'none', `${label}: .nwl-card no box-shadow`);
  assert.ok(Math.abs(cardCheck.ratio - 16 / 9) < 0.1, `${label}: media 16:9 ratio`);
  assert.strictEqual(cardCheck.actionBorder, '1px', `${label}: full horizontal border above action`);
  assert.strictEqual(cardCheck.actionJustify, 'flex-end', `${label}: action right-aligned`);
  assert.ok(cardCheck.linkHeight >= 44, `${label}: .nwl-card-link >= 44px`);
  assert.ok(cardCheck.hasSvg && !cardCheck.hasAuthor, `${label}: SVG arrow present, no author`);
}

async function verifyNewsPages(page, vp, lang) {
  await page.goto(`${BASE_URL}/news?lang=${lang}`, { waitUntil: 'load' });
  await assertNoOverflow(page, `/news ${lang} ${vp.name}`);
  await verifyFlatEditorialCards(page, `/news ${lang} ${vp.name}`);

  const arrows = await page.evaluate(() => {
    const prev = document.getElementById('nwlPrevBtn');
    const next = document.getElementById('nwlNextBtn');
    if (!prev || !next) return null;
    const pR = prev.getBoundingClientRect();
    const nR = next.getBoundingClientRect();
    return {
      pw: pR.width,
      ph: pR.height,
      nw: nR.width,
      nh: nR.height,
      pSvg: Boolean(prev.querySelector('svg line') && prev.querySelector('svg polyline')),
      nSvg: Boolean(next.querySelector('svg line') && next.querySelector('svg polyline'))
    };
  });
  if (arrows) {
    assert.ok(arrows.pw >= 44 && arrows.ph >= 44 && arrows.nw >= 44 && arrows.nh >= 44, 'Headline arrows >= 44px');
    assert.ok(arrows.pSvg && arrows.nSvg, 'Headline arrows use full line+polyline SVG');
  }

  if (vp.width === 1280 && lang === 'id') {
    const secondTab = page.locator('.nwl-tab-item').nth(1);
    if (await secondTab.count()) {
      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/news') && r.request().headers()['x-requested-with'] === 'XMLHttpRequest' && r.status() === 200),
        secondTab.click()
      ]);
      await page.waitForTimeout(150);
      await verifyFlatEditorialCards(page, '/news after AJAX tab');
    }

    const firstHref = await page.locator('.nwl-card-title-link').first().getAttribute('href');
    if (firstHref) {
      await page.goto(`${BASE_URL}${firstHref}?lang=id`, { waitUntil: 'load' });
      await assertNoOverflow(page, `${firstHref} ${vp.name}`);
      await verifyFlatEditorialCards(page, `Related cards on ${firstHref}`);
    }

    await page.goto(`${BASE_URL}/news?search=__no_such_article_xyz__&lang=id`, { waitUntil: 'load' });
    assert.ok(await page.locator('#newsEmptyState').isVisible(), 'Empty state visible on zero search results');
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const errors = { consoleErrors: [], pageErrors: [] };
  try {
    for (const lang of LANGS) {
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await ctx.newPage();
        attachErrorListeners(page, errors);
        await injectClsObserver(page);

        await page.goto(`${BASE_URL}/?lang=${lang}`, { waitUntil: 'load' });
        await assertNoOverflow(page, `Home ${lang} ${vp.name}`);
        await verifyHomeLayout(page, vp, lang);
        if (lang === 'id' && vp.width === 1280) {
          await verifyCarouselInteractions(page);
        }
        await verifyNewsPages(page, vp, lang);
        await ctx.close();
      }
    }
    await verifyReducedMotion(browser);
  } finally {
    await browser.close();
  }
  assert.strictEqual(errors.consoleErrors.length, 0, `Console errors: ${errors.consoleErrors.join('; ')}`);
  assert.strictEqual(errors.pageErrors.length, 0, `Page errors: ${errors.pageErrors.join('; ')}`);
  console.log('ALL T-414 E2E CHECKS PASSED (6 viewports x ID/EN, autoplay, CLS, reduced-motion, /news & /news/:slug).');
}

run().catch((err) => {
  console.error('T-414 E2E FAILED:', err);
  process.exit(1);
});
