import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { name: '320px', width: 320, height: 720, isMobile: true },
  { name: '375px', width: 375, height: 812, isMobile: true },
  { name: '480px', width: 480, height: 800, isMobile: true },
  { name: '768px', width: 768, height: 1024, isMobile: true },
  { name: '1024px', width: 1024, height: 768, isMobile: false },
  { name: '1280x720', width: 1280, height: 720, isMobile: false },
  { name: '1440x900', width: 1440, height: 900, isMobile: false }
];

const LANGS = ['id', 'en'];

function attachErrorListeners(page, errors, labelRef) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.consoleErrors.push(`[${labelRef.current}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    errors.pageErrors.push(`[${labelRef.current}] ${err.message}`);
  });
}

async function gotoAndWaitStyles(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.length > 0 && links.every((link) => Boolean(link.sheet));
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

function rectsOverlap(a, b) {
  if (!a || !b) return false;
  return !(
    a.x + a.width <= b.x + 0.5 ||
    b.x + b.width <= a.x + 0.5 ||
    a.y + a.height <= b.y + 0.5 ||
    b.y + b.height <= a.y + 0.5
  );
}

function unfilterPngByte(filter, cur, a, b, c) {
  if (filter === 1) return (cur + a) & 0xff;
  if (filter === 2) return (cur + b) & 0xff;
  if (filter === 3) return (cur + ((a + b) >> 1)) & 0xff;
  if (filter !== 4) return cur;
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  return (cur + pred) & 0xff;
}

function decodePngPixels(buf) {
  let pos = 8;
  let w = 0;
  let h = 0;
  let colorType = 6;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const rowIn = y * (stride + 1) + 1;
    const rowOut = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[rowOut + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      out[rowOut + x] = unfilterPngByte(filter, raw[rowIn + x], a, b, c);
    }
  }
  return { w, h, bpp, out };
}

function parseRgb(str) {
  const m = String(str || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (!m) return null;
  return {
    r: Number(m[1]),
    g: Number(m[2]),
    b: Number(m[3]),
    a: m[4] === undefined ? 1 : Number(m[4])
  };
}

function linearizeChannel(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb) {
  return 0.2126 * linearizeChannel(rgb[0]) +
    0.7152 * linearizeChannel(rgb[1]) +
    0.0722 * linearizeChannel(rgb[2]);
}

function contrastRatio(fgRgb, bgRgb) {
  const l1 = relativeLuminance(fgRgb);
  const l2 = relativeLuminance(bgRgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function blendOver(fg, bg) {
  return [
    Math.round(fg.a * fg.r + (1 - fg.a) * bg[0]),
    Math.round(fg.a * fg.g + (1 - fg.a) * bg[1]),
    Math.round(fg.a * fg.b + (1 - fg.a) * bg[2])
  ];
}

function samplePixel(img, x, y) {
  const cx = Math.min(img.w - 1, Math.max(0, Math.round(x)));
  const cy = Math.min(img.h - 1, Math.max(0, Math.round(y)));
  const idx = (cy * img.w + cx) * img.bpp;
  return [img.out[idx], img.out[idx + 1], img.out[idx + 2]];
}

async function verifyHeroAndSections(page, vp, lang) {
  const label = `Home ${lang} ${vp.name}`;
  const data = await page.evaluate(() => {
    const hero = document.querySelector('.hero.hero-slider');
    const grad = document.querySelector('.hero.hero-slider > .hero-grad');
    const activeSlide = document.querySelector('.hero-slide.is-active');
    const bg = activeSlide?.querySelector('.hero-bg');
    const content = activeSlide?.querySelector('.hero-content');
    const inner = activeSlide?.querySelector('.hero-inner');
    const body = activeSlide?.querySelector('.hero-body');
    const explore = document.querySelector('.hero-explore-indicator');
    const exploreText = explore?.querySelector('.hero-explore-text');
    const exploreLine = explore?.querySelector('.hero-explore-line');
    const controls = document.querySelector('.hero-slider-controls');
    const prevBtn = document.querySelector('.hero-slider-prev');
    const nextBtn = document.querySelector('.hero-slider-next');
    const waBtn = document.querySelector('.wa-float-btn');

    const mediaFilters = Array.from(document.querySelectorAll('.hero-bg img, .hero-youtube-poster'))
      .map((el) => getComputedStyle(el).filter);

    const ctaBoxes = Array.from(activeSlide ? activeSlide.querySelectorAll('.hero-cta-btn') : [])
      .map((el) => el.getBoundingClientRect());

    const requiredSections = [
      '.sec-intro',
      '.sec-products',
      '.sec-why-us',
      '.brand-strip-sec',
      '.sec-news',
      '#global-cta',
      '.site-footer'
    ].map((sel) => {
      const el = document.querySelector(sel);
      return {
        sel,
        exists: Boolean(el),
        height: el ? el.getBoundingClientRect().height : 0
      };
    });

    return {
      heroRect: hero ? hero.getBoundingClientRect() : null,
      gradCount: document.querySelectorAll('.hero-grad').length,
      gradDirectChild: Boolean(hero && grad && grad.parentElement === hero),
      gradBg: grad ? getComputedStyle(grad).backgroundImage : '',
      innerScrimColor: inner ? getComputedStyle(inner, '::before').backgroundColor : 'rgba(0, 0, 0, 0)',
      innerScrimFilter: inner ? getComputedStyle(inner, '::before').filter : 'none',
      innerScrimRadius: inner ? getComputedStyle(inner, '::before').borderRadius : '0px',
      z: {
        bg: bg ? Number(getComputedStyle(bg).zIndex) : NaN,
        grad: grad ? Number(getComputedStyle(grad).zIndex) : NaN,
        content: content ? Number(getComputedStyle(content).zIndex) : NaN,
        explore: explore ? Number(getComputedStyle(explore).zIndex) : NaN,
        controls: controls ? Number(getComputedStyle(controls).zIndex) : NaN
      },
      mediaFilters,
      bodyMaxWidth: body ? parseFloat(getComputedStyle(body).maxWidth) : 0,
      bodyWidth: body ? body.getBoundingClientRect().width : 0,
      ctaBoxes,
      exploreDisplay: explore ? getComputedStyle(explore).display : 'missing',
      exploreTextColor: exploreText ? getComputedStyle(exploreText).color : '',
      exploreTextWeight: exploreText ? parseInt(getComputedStyle(exploreText).fontWeight, 10) : 0,
      exploreLineWidth: exploreLine ? parseFloat(getComputedStyle(exploreLine).width) : 0,
      exploreRect: explore ? explore.getBoundingClientRect() : null,
      waRect: waBtn ? waBtn.getBoundingClientRect() : null,
      controlsRect: controls ? controls.getBoundingClientRect() : null,
      prevRect: prevBtn && getComputedStyle(prevBtn).display !== 'none' ? prevBtn.getBoundingClientRect() : null,
      contentRect: content ? content.getBoundingClientRect() : null,
      nextRect: nextBtn && getComputedStyle(nextBtn).display !== 'none' ? nextBtn.getBoundingClientRect() : null,
      requiredSections
    };
  });

  assert.ok(data.heroRect, `${label}: .hero.hero-slider must exist`);
  if (vp.isMobile) {
    assert.ok(
      data.heroRect.height >= vp.height - 1,
      `${label}: mobile hero height (${data.heroRect.height}) must be >= ${vp.height}`
    );
    for (const ctaBox of data.ctaBoxes) {
      assert.ok(
        ctaBox.y + ctaBox.height <= data.heroRect.y + data.heroRect.height + 1,
        `${label}: hero CTA bottom (${ctaBox.y + ctaBox.height}) clipped below hero (${data.heroRect.y + data.heroRect.height})`
      );
    }
    assert.strictEqual(data.exploreDisplay, 'none', `${label}: .hero-explore-indicator must be hidden on <= 768px`);
  } else {
    assert.ok(
      data.heroRect.height >= vp.height * 0.99,
      `${label}: desktop hero height (${data.heroRect.height}) must be >= 99% of ${vp.height}`
    );
    assert.notStrictEqual(data.exploreDisplay, 'none', `${label}: .hero-explore-indicator must be visible on desktop`);
    assert.ok(data.exploreRect && data.waRect, `${label}: explore indicator and WA button bounding boxes required`);
    const waClearance = data.waRect.y - (data.exploreRect.y + data.exploreRect.height);
    assert.ok(
      waClearance >= 12,
      `${label}: clearance between .hero-explore-indicator and .wa-float-btn (${waClearance.toFixed(1)}px) must be >= 12px`
    );
    assert.strictEqual(rectsOverlap(data.exploreRect, data.waRect), false, `${label}: explore overlaps WA`);
    assert.strictEqual(rectsOverlap(data.exploreRect, data.controlsRect), false, `${label}: explore overlaps slider controls`);
    assert.strictEqual(rectsOverlap(data.exploreRect, data.nextRect), false, `${label}: explore overlaps next arrow`);
    if (data.prevRect && data.contentRect) {
      const prevGap = data.contentRect.left - (data.prevRect.x + data.prevRect.width);
      assert.ok(prevGap >= 24, `${label}: clearance between .hero-slider-prev and .hero-content (${prevGap.toFixed(1)}px) must be >= 24px`);
    }
  }

  assert.strictEqual(data.gradCount, 1, `${label}: exactly 1 .hero-grad allowed`);
  assert.strictEqual(data.gradDirectChild, true, `${label}: .hero-grad must be direct child of .hero.hero-slider`);
  assert.strictEqual(data.gradBg.includes('90deg'), false, `${label}: .hero-grad must not apply half-screen 90deg horizontal curtain`);
  assert.notStrictEqual(data.innerScrimColor, 'rgba(0, 0, 0, 0)', `${label}: .hero-inner::before blurred scrim must be active`);
  assert.ok(data.innerScrimFilter.includes('blur'), `${label}: .hero-inner::before must use soft blur (${data.innerScrimFilter})`);
  assert.notStrictEqual(data.innerScrimRadius, '0px', `${label}: .hero-inner::before must use pill border-radius (${data.innerScrimRadius})`);
  assert.strictEqual(data.exploreTextColor, 'rgb(255, 255, 255)', `${label}: .hero-explore-text must be pure white`);
  assert.ok(data.exploreTextWeight >= 700, `${label}: .hero-explore-text fontWeight (${data.exploreTextWeight}) must be bold (>= 700)`);
  assert.ok(data.exploreLineWidth >= 2, `${label}: .hero-explore-line width (${data.exploreLineWidth}px) must be >= 2px`);
  assert.ok(
    data.z.bg < data.z.grad && data.z.grad < data.z.content && data.z.content < data.z.explore && data.z.explore < data.z.controls,
    `${label}: z-index order invalid (${JSON.stringify(data.z)})`
  );

  for (const filter of data.mediaFilters) {
    assert.strictEqual(filter.includes('brightness'), false, `${label}: .hero-bg img/poster must not have brightness filter (${filter})`);
  }
  assert.ok(data.bodyMaxWidth > 0 && data.bodyMaxWidth <= 540, `${label}: .hero-body max-width (${data.bodyMaxWidth}) must be <= 540px`);
  assert.ok(data.bodyWidth <= 540.5, `${label}: .hero-body rendered width (${data.bodyWidth}) must be <= 540px`);

  for (const sec of data.requiredSections) {
    assert.ok(sec.exists && sec.height > 0, `${label}: homepage section ${sec.sel} must remain rendered intact`);
  }
}

async function verifyHeroAndNavbarContrast(page, label) {
  await page.waitForTimeout(900);
  const targets = await page.evaluate(() => {
    const items = [];
    const add = (name, el, minRatio, padSample) => {
      if (!el) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      items.push({
        name,
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        color: cs.color,
        bgColor: cs.backgroundColor,
        minRatio,
        padSample
      });
    };
    add('hero-welcome', document.querySelector('.hero-slide.is-active .hero-welcome'), 4.5, false);
    add('hero-heading', document.querySelector('.hero-slide.is-active .hero-heading'), 3.0, false);
    add('hero-body', document.querySelector('.hero-slide.is-active .hero-body'), 4.5, false);
    add('hero-cta-primary', document.querySelector('.hero-slide.is-active .hero-cta-btn--primary'), 4.5, 'solid');
    add('hero-cta-secondary', document.querySelector('.hero-slide.is-active .hero-cta-btn--secondary'), 4.5, true);
    add('topbar-tagline', document.querySelector('.top-bar .top-tagline'), 4.5, false);
    document.querySelectorAll('.site-header .nav-link').forEach((el, idx) => {
      add(`navbar-link-${idx}`, el, 4.5, true);
    });
    return items;
  });

  const png = await page.screenshot({ type: 'png' });
  const img = decodePngPixels(png);

  for (const item of targets) {
    const fg = parseRgb(item.color);
    assert.ok(fg, `${label} ${item.name}: unable to parse color ${item.color}`);

    if (item.padSample === 'solid') {
      const bg = parseRgb(item.bgColor);
      assert.ok(bg && bg.a > 0.9, `${label} ${item.name}: solid bg expected`);
      const ratio = contrastRatio([fg.r, fg.g, fg.b], [bg.r, bg.g, bg.b]);
      assert.ok(ratio >= item.minRatio, `${label} ${item.name}: contrast ${ratio.toFixed(2)}:1 < ${item.minRatio}:1`);
      continue;
    }

    const bgPoint = item.padSample
      ? samplePixel(img, item.x + 2, item.y + 2)
      : samplePixel(img, Math.max(2, item.x - 4), item.y + item.h / 2);
    const effectiveFg = fg.a < 1 ? blendOver(fg, bgPoint) : [fg.r, fg.g, fg.b];
    const ratio = contrastRatio(effectiveFg, bgPoint);
    assert.ok(
      ratio >= item.minRatio,
      `${label} ${item.name}: contrast ${ratio.toFixed(2)}:1 < ${item.minRatio}:1 (fg=${effectiveFg.join(',')}, bg=${bgPoint.join(',')})`
    );
  }
}

async function verifyReducedMotion(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    reducedMotion: 'reduce'
  });
  const page = await ctx.newPage();
  await gotoAndWaitStyles(page, `${BASE_URL}/?lang=id`);
  const animName = await page.evaluate(() => {
    const line = document.querySelector('.hero-explore-line');
    return line ? getComputedStyle(line, '::after').animationName : null;
  });
  assert.strictEqual(animName, 'none', `Reduced motion: .hero-explore-line::after animationName must be "none" (got "${animName}")`);
  await ctx.close();
}

async function assertNoStaleCardFocus(page, scopeSelector, label) {
  const state = await page.evaluate((scope) => {
    const root = scope ? document.querySelector(scope) : document;
    if (!root) return { activeInCard: false, badCards: [], badLinks: [] };
    const cards = Array.from(root.querySelectorAll('.nwl-card'));
    const links = Array.from(root.querySelectorAll('.nwl-card-title-link'));
    const badCards = cards
      .map((c, idx) => ({ idx, style: getComputedStyle(c).outlineStyle, width: getComputedStyle(c).outlineWidth }))
      .filter((x) => x.style !== 'none' && x.width !== '0px');
    const badLinks = links
      .map((l, idx) => ({ idx, style: getComputedStyle(l).outlineStyle, width: getComputedStyle(l).outlineWidth }))
      .filter((x) => x.style !== 'none' && x.width !== '0px');
    return {
      activeInCard: Boolean(document.activeElement && document.activeElement.closest && document.activeElement.closest('.nwl-card')),
      badCards,
      badLinks
    };
  }, scopeSelector);

  assert.strictEqual(state.activeInCard, false, `${label}: activeElement must not stay inside .nwl-card after Back`);
  assert.deepStrictEqual(state.badCards, [], `${label}: stale .nwl-card focus outline after Back: ${JSON.stringify(state.badCards)}`);
  assert.deepStrictEqual(state.badLinks, [], `${label}: stale .nwl-card-title-link focus outline after Back: ${JSON.stringify(state.badLinks)}`);
}

async function verifyKeyboardTabFocus(page, scopeSelector, label) {
  const firstLink = page.locator(`${scopeSelector} .nwl-card-title-link`).first();
  await firstLink.scrollIntoViewIfNeeded();
  await firstLink.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');

  const focusState = await page.evaluate((scope) => {
    const active = document.activeElement;
    const card = active && active.closest ? active.closest(`${scope} .nwl-card`) : null;
    return {
      isTitleLink: Boolean(active && active.classList && active.classList.contains('nwl-card-title-link')),
      cardOutlineStyle: card ? getComputedStyle(card).outlineStyle : 'none',
      cardOutlineWidth: card ? parseFloat(getComputedStyle(card).outlineWidth) : 0
    };
  }, scopeSelector);

  assert.strictEqual(focusState.isTitleLink, true, `${label}: Tab must focus .nwl-card-title-link`);
  assert.notStrictEqual(focusState.cardOutlineStyle, 'none', `${label}: .nwl-card focus ring must be visible on keyboard Tab`);
  assert.ok(focusState.cardOutlineWidth >= 2, `${label}: .nwl-card outlineWidth (${focusState.cardOutlineWidth}px) must be >= 2px`);
}

async function clickCardAndVerifyBack(page, scopeSelector, label) {
  const firstCard = page.locator(`${scopeSelector} .nwl-card`).first();
  const firstLink = page.locator(`${scopeSelector} .nwl-card-title-link`).first();
  const targetHref = await firstLink.getAttribute('href');
  assert.ok(targetHref, `${label}: card href required`);

  await firstCard.scrollIntoViewIfNeeded();
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 120) window.scrollBy(0, r.top - 140);
  }, `${scopeSelector} .nwl-card`);

  const cardBox = await firstCard.boundingBox();
  assert.ok(cardBox, `${label}: .nwl-card boundingBox required`);

  await Promise.all([
    page.waitForURL((url) => url.pathname === targetHref, { waitUntil: 'domcontentloaded', timeout: 10000 }),
    page.mouse.click(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2)
  ]);

  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction((sel) => Boolean(document.querySelector(sel)), `${scopeSelector} .nwl-card`);
  await page.waitForTimeout(100);
  await assertNoStaleCardFocus(page, scopeSelector, `${label} after Back`);
  await verifyKeyboardTabFocus(page, scopeSelector, `${label} Tab`);
  return targetHref;
}

async function verifyNewsFocusFlows(page, lang) {
  await gotoAndWaitStyles(page, `${BASE_URL}/news?lang=${lang}`);
  const detailHref = await clickCardAndVerifyBack(page, '.nwl-grid', `/news ${lang}`);

  await gotoAndWaitStyles(page, `${BASE_URL}${detailHref}${detailHref.includes('?') ? '&' : '?'}lang=${lang}`);
  const relatedCount = await page.locator('.nwd-related-grid .nwl-card').count();
  if (relatedCount > 0) {
    await clickCardAndVerifyBack(page, '.nwd-related-grid', `${detailHref} ${lang} related`);
  }
}

async function verifyViewportSuite(browser, vp, lang, sampleDetailHref, errors, labelRef) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  attachErrorListeners(page, errors, labelRef);

  labelRef.current = `Home ${lang} ${vp.name}`;
  await gotoAndWaitStyles(page, `${BASE_URL}/?lang=${lang}`);
  await assertNoOverflow(page, labelRef.current);
  await verifyHeroAndSections(page, vp, lang);
  if (vp.name === '1280x720' || (lang === 'id' && vp.name === '375px')) {
    await verifyHeroAndNavbarContrast(page, labelRef.current);
  }

  labelRef.current = `/news ${lang} ${vp.name}`;
  await gotoAndWaitStyles(page, `${BASE_URL}/news?lang=${lang}`);
  await assertNoOverflow(page, labelRef.current);
  const resolvedHref = sampleDetailHref ||
    await page.locator('.nwl-grid .nwl-card-title-link').first().getAttribute('href');

  if (resolvedHref) {
    labelRef.current = `${resolvedHref} ${lang} ${vp.name}`;
    await gotoAndWaitStyles(page, `${BASE_URL}${resolvedHref}?lang=${lang}`);
    await assertNoOverflow(page, labelRef.current);
  }

  await ctx.close();
  return resolvedHref;
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const errors = { consoleErrors: [], pageErrors: [] };
  const labelRef = { current: 'init' };

  try {
    for (const lang of LANGS) {
      let sampleDetailHref = null;

      for (const vp of VIEWPORTS) {
        sampleDetailHref = await verifyViewportSuite(browser, vp, lang, sampleDetailHref, errors, labelRef);
      }

      const focusCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const focusPage = await focusCtx.newPage();
      attachErrorListeners(focusPage, errors, labelRef);
      labelRef.current = `Focus flow ${lang}`;
      await verifyNewsFocusFlows(focusPage, lang);
      await focusCtx.close();
    }

    await verifyReducedMotion(browser);
  } finally {
    await browser.close();
  }

  assert.strictEqual(errors.consoleErrors.length, 0, `Console errors: ${errors.consoleErrors.join('; ')}`);
  assert.strictEqual(errors.pageErrors.length, 0, `Page errors: ${errors.pageErrors.join('; ')}`);
  console.log('ALL T-471 QA CHECKS PASSED (7 viewports x ID/EN, hero 1:1, WCAG AA contrast, reduced-motion, /news & /news/:slug focus/Back).');
}

run().catch((err) => {
  console.error('T-471 QA FAILED:', err);
  process.exit(1);
});
