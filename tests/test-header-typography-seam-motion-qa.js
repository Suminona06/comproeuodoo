import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { name: '320px', width: 320, height: 720, isMobile: true },
  { name: '375px', width: 375, height: 812, isMobile: true },
  { name: '390px', width: 390, height: 844, isMobile: true },
  { name: '768px', width: 768, height: 1024, isMobile: true },
  { name: '1024px', width: 1024, height: 768, isMobile: true },
  { name: '1025px', width: 1025, height: 768, isMobile: false },
  { name: '1440px', width: 1440, height: 900, isMobile: false }
];

const TRANSPARENT_ROUTES = ['/', '/about', '/products', '/news', '/contact'];
const LANGS = ['id', 'en'];
const ANIM_CLASSES = ['hdr-wipe-opening', 'hdr-wipe-closing', 'hdr-wipe-animating'];

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

function withLang(route, lang) {
  const sep = route.includes('?') ? '&' : '?';
  return `${BASE_URL}${route}${sep}lang=${lang}`;
}

async function gotoAndWaitStyles(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.length > 0 && links.every((link) => Boolean(link.sheet));
  });
}

async function discoverSolidRoutes(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  try {
    await gotoAndWaitStyles(page, withLang('/products', 'id'));
    const productHref = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/products/"]');
      return link ? link.getAttribute('href') : null;
    });

    await gotoAndWaitStyles(page, withLang('/news', 'id'));
    const newsHref = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/news/"]');
      return link ? link.getAttribute('href') : null;
    });

    assert.ok(productHref, 'Minimal 1 tautan detail produk /products/<slug> wajib tersedia');
    assert.ok(newsHref, 'Minimal 1 tautan detail berita /news/<slug> wajib tersedia');
    return [productHref, newsHref];
  } finally {
    await ctx.close();
  }
}

async function waitForHeaderSettled(page) {
  await page.waitForFunction(() => {
    const wrap = document.getElementById('headerWrap');
    const menu = document.getElementById('navMenu');
    const backdrop = document.getElementById('menuBackdrop');
    const targets = [wrap, menu, backdrop].filter(Boolean);
    return targets.every((el) => (
      !el.classList.contains('hdr-wipe-opening') &&
      !el.classList.contains('hdr-wipe-closing') &&
      !el.classList.contains('hdr-wipe-animating')
    ));
  }, { timeout: 2000 });
}

async function waitForBeforeOpacity(page, expected) {
  await page.waitForFunction((targetOpacity) => {
    const header = document.querySelector('.site-header');
    if (!header) return false;
    return getComputedStyle(header, '::before').opacity === targetOpacity;
  }, expected, { timeout: 2000 });
}

async function scrollToY(page, y) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  const wantScrolled = y > 30;
  await page.waitForFunction((expected) => {
    const wrap = document.getElementById('headerWrap');
    return Boolean(wrap) && wrap.classList.contains('is-scrolled') === expected;
  }, wantScrolled, { timeout: 2000 });
}

async function verifyTypographyAndAntiSeam(page, vp, isSolid, label) {
  await scrollToY(page, 0);
  if (!isSolid) {
    await waitForBeforeOpacity(page, '0');
  }

  const idle = await page.evaluate(() => {
    const wrap = document.getElementById('headerWrap');
    const header = document.querySelector('.site-header');
    const toggle = document.getElementById('mobileToggle');
    const links = Array.from(document.querySelectorAll('#navMenu .nav-link'));
    const headerCs = getComputedStyle(header);
    const beforeCs = getComputedStyle(header, '::before');

    const linkMetrics = links.map((el) => {
      const cs = getComputedStyle(el);
      const range = document.createRange();
      range.selectNodeContents(el);
      return {
        text: el.textContent.trim(),
        active: el.classList.contains('active'),
        fontWeight: cs.fontWeight,
        textShadow: cs.textShadow,
        whiteSpace: cs.whiteSpace,
        lineRects: range.getClientRects().length
      };
    });

    const toggleRect = toggle ? toggle.getBoundingClientRect() : null;
    return {
      isSolidClass: wrap ? wrap.classList.contains('header-wrap--solid') : false,
      headerBoxShadow: headerCs.boxShadow,
      headerBorderBottomWidth: headerCs.borderBottomWidth,
      beforeOpacity: beforeCs.opacity,
      beforeBorderBottomWidth: beforeCs.borderBottomWidth,
      beforeBoxShadow: beforeCs.boxShadow,
      toggleWidth: toggleRect ? toggleRect.width : 0,
      toggleHeight: toggleRect ? toggleRect.height : 0,
      linkMetrics,
      overflowX: document.documentElement.scrollWidth > window.innerWidth
    };
  });

  assert.strictEqual(idle.overflowX, false, `${label}: horizontal overflow terdeteksi`);
  assert.strictEqual(idle.isSolidClass, isSolid, `${label}: class .header-wrap--solid tidak sesuai`);

  if (isSolid) {
    assert.strictEqual(idle.beforeOpacity, '1', `${label}: solid header ::before opacity wajib 1`);
    assert.strictEqual(idle.beforeBorderBottomWidth, '1px', `${label}: solid header ::before borderBottomWidth wajib 1px`);
    assert.notStrictEqual(idle.beforeBoxShadow, 'none', `${label}: solid header ::before boxShadow wajib aktif`);
  } else {
    assert.strictEqual(idle.headerBoxShadow, 'none', `${label}: transparan .site-header boxShadow wajib none`);
    assert.strictEqual(idle.headerBorderBottomWidth, '0px', `${label}: transparan .site-header borderBottomWidth wajib 0px`);
    assert.strictEqual(idle.beforeOpacity, '0', `${label}: transparan .site-header::before opacity wajib 0`);
  }

  for (const link of idle.linkMetrics) {
    const expectedWeight = link.active ? '700' : '600';
    assert.strictEqual(link.fontWeight, expectedWeight, `${label} link "${link.text}": fontWeight wajib ${expectedWeight}`);
  }

  if (!vp.isMobile) {
    verifyDesktopLinkRules(idle.linkMetrics, isSolid, label);
    await verifyScrolledDesktopState(page, label);
    return;
  }

  assert.ok(idle.toggleWidth >= 44 && idle.toggleHeight >= 44, `${label}: #mobileToggle wajib >= 44x44px (${idle.toggleWidth}x${idle.toggleHeight})`);
  await verifyMobileDrawerTypography(page, label);
}

function verifyDesktopLinkRules(linkMetrics, isSolid, label) {
  for (const link of linkMetrics) {
    assert.strictEqual(link.lineRects, 1, `${label} link "${link.text}": desktop nav-link tidak boleh wrap (${link.lineRects} baris)`);
    if (isSolid) {
      assert.strictEqual(link.textShadow, 'none', `${label} link "${link.text}": solid desktop textShadow wajib none`);
    } else {
      assert.notStrictEqual(link.textShadow, 'none', `${label} link "${link.text}": transparan desktop textShadow wajib aktif`);
    }
  }
}

async function verifyScrolledDesktopState(page, label) {
  await scrollToY(page, 220);
  await waitForBeforeOpacity(page, '1');

  const scrolled = await page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const beforeCs = getComputedStyle(header, '::before');
    const shadows = Array.from(document.querySelectorAll('#navMenu .nav-link'))
      .map((el) => getComputedStyle(el).textShadow);
    return {
      beforeOpacity: beforeCs.opacity,
      beforeBorderBottomWidth: beforeCs.borderBottomWidth,
      beforeBoxShadow: beforeCs.boxShadow,
      shadows
    };
  });

  assert.strictEqual(scrolled.beforeOpacity, '1', `${label} scrolled: ::before opacity wajib 1`);
  assert.strictEqual(scrolled.beforeBorderBottomWidth, '1px', `${label} scrolled: ::before borderBottomWidth wajib 1px`);
  assert.notStrictEqual(scrolled.beforeBoxShadow, 'none', `${label} scrolled: ::before boxShadow wajib aktif`);
  for (const shadow of scrolled.shadows) {
    assert.strictEqual(shadow, 'none', `${label} scrolled: .nav-link textShadow wajib none`);
  }
  await scrollToY(page, 0);
}

async function verifyMobileDrawerTypography(page, label) {
  await page.click('#mobileToggle');
  await waitForHeaderSettled(page);

  const openData = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('#navMenu .nav-link')).map((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        text: el.textContent.trim(),
        active: el.classList.contains('active'),
        fontWeight: cs.fontWeight,
        textShadow: cs.textShadow,
        width: rect.width,
        height: rect.height
      };
    });
    return { links };
  });

  for (const link of openData.links) {
    const expectedWeight = link.active ? '700' : '600';
    assert.strictEqual(link.fontWeight, expectedWeight, `${label} drawer "${link.text}": fontWeight wajib ${expectedWeight}`);
    assert.strictEqual(link.textShadow, 'none', `${label} drawer "${link.text}": textShadow wajib none`);
    assert.ok(link.width >= 44 && link.height >= 44, `${label} drawer "${link.text}": target sentuh wajib >= 44x44px (${link.width.toFixed(1)}x${link.height.toFixed(1)})`);
  }

  await page.click('#mobileToggle');
  await waitForHeaderSettled(page);
}

async function verifyUnifiedCornerWipeSync(page, isSolid, label) {
  if (!isSolid) {
    await verifyTransparentCloseSync(page, `${label} scrollY=0`);
    await scrollToY(page, 240);
    await waitForBeforeOpacity(page, '1');
    await verifyStableHeaderDuringToggle(page, `${label} is-scrolled`);
    await scrollToY(page, 0);
    await waitForBeforeOpacity(page, '0');
    return;
  }

  await scrollToY(page, 0);
  await verifyStableHeaderDuringToggle(page, `${label} solid`);
}

async function verifyTransparentCloseSync(page, label) {
  await scrollToY(page, 0);
  await waitForBeforeOpacity(page, '0');

  await page.click('#mobileToggle');
  await waitForHeaderSettled(page);

  const closeMetrics = await page.evaluate(async () => {
    const wrap = document.getElementById('headerWrap');
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('navMenu');
    const backdrop = document.getElementById('menuBackdrop');
    const header = document.querySelector('.site-header');

    const t0 = performance.now();
    toggle.click();

    await new Promise((resolve) => requestAnimationFrame(resolve));
    const immediateMs = performance.now() - t0;
    const immediate = {
      immediateMs,
      hasMenuOpen: wrap.classList.contains('menu-open'),
      wrapClosing: wrap.classList.contains('hdr-wipe-closing'),
      toggleActive: toggle.classList.contains('active'),
      menuClosing: menu.classList.contains('hdr-wipe-closing'),
      menuClipPath: getComputedStyle(menu).clipPath,
      beforeClipPath: getComputedStyle(header, '::before').clipPath
    };

    const doneMs = await new Promise((resolve) => {
      const check = () => {
        const stillAnimating = [wrap, menu, backdrop].filter(Boolean).some((el) => (
          el.classList.contains('hdr-wipe-opening') ||
          el.classList.contains('hdr-wipe-closing') ||
          el.classList.contains('hdr-wipe-animating')
        ));
        if (!stillAnimating || performance.now() - t0 > 600) {
          resolve(performance.now() - t0);
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });

    const finalState = {
      doneMs,
      remainingAnimClasses: [wrap, menu, backdrop].filter(Boolean).flatMap((el) => (
        ['hdr-wipe-opening', 'hdr-wipe-closing', 'hdr-wipe-animating'].filter((cls) => el.classList.contains(cls))
      )),
      beforeOpacityAfter: getComputedStyle(header, '::before').opacity
    };

    return { immediate, finalState };
  });

  assert.ok(closeMetrics.immediate.immediateMs < 50, `${label}: sampling pasca klik harus < 50ms (aktual ${closeMetrics.immediate.immediateMs.toFixed(1)}ms)`);
  assert.strictEqual(closeMetrics.immediate.hasMenuOpen, false, `${label}: #headerWrap tidak boleh punya .menu-open di t=0ms close`);
  assert.strictEqual(closeMetrics.immediate.wrapClosing, true, `${label}: #headerWrap wajib punya .hdr-wipe-closing saat close`);
  assert.strictEqual(closeMetrics.immediate.toggleActive, false, `${label}: #mobileToggle tidak boleh punya .active di t=0ms close`);
  assert.strictEqual(closeMetrics.immediate.menuClosing, true, `${label}: #navMenu wajib punya .hdr-wipe-closing saat close`);
  assert.strictEqual(closeMetrics.immediate.menuClipPath, 'none', `${label}: #navMenu wajib tanpa clip-path (100% GPU transform+opacity)`);
  assert.strictEqual(closeMetrics.immediate.beforeClipPath, 'none', `${label}: .site-header::before wajib tanpa clip-path (100% GPU opacity)`);
  assert.ok(closeMetrics.finalState.doneMs <= 360, `${label}: close wajib selesai <= 360ms (aktual ${closeMetrics.finalState.doneMs.toFixed(1)}ms)`);
  assert.deepStrictEqual(closeMetrics.finalState.remainingAnimClasses, [], `${label}: kelas animasi wajib bersih pasca close`);
  await waitForBeforeOpacity(page, '0');
}

async function verifyStableHeaderDuringToggle(page, label) {
  const samples = await page.evaluate(async () => {
    const toggle = document.getElementById('mobileToggle');
    const header = document.querySelector('.site-header');
    const read = (stage) => {
      const cs = getComputedStyle(header, '::before');
      return { stage, opacity: cs.opacity, clipPath: cs.clipPath };
    };
    const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));

    const out = [read('before-open')];
    toggle.click();
    await waitMs(80);
    out.push(read('mid-open'));
    await waitMs(320);
    out.push(read('after-open'));

    toggle.click();
    await waitMs(80);
    out.push(read('mid-close'));
    await waitMs(300);
    out.push(read('after-close'));
    return out;
  });

  for (const s of samples) {
    assert.strictEqual(s.opacity, '1', `${label} [${s.stage}]: ::before opacity wajib tetap 1 (0 kedip)`);
    assert.strictEqual(s.clipPath, 'none', `${label} [${s.stage}]: ::before clipPath wajib none (aktual ${s.clipPath})`);
  }
}

async function verifyCdpPerformance4x(browser, solidRoute, errors, labelRef) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  attachErrorListeners(page, errors, labelRef);

  const client = await ctx.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  try {
    await runCdpAuditOnRoute(page, '/', false, 'CDP 4x 390px /', labelRef);
    await runCdpAuditOnRoute(page, solidRoute, true, `CDP 4x 390px ${solidRoute}`, labelRef);
  } finally {
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await ctx.close();
  }
}

async function runCdpAuditOnRoute(page, route, isSolid, label, labelRef) {
  labelRef.current = label;
  await gotoAndWaitStyles(page, withLang(route, 'id'));
  await page.waitForTimeout(150);

  await page.evaluate(() => {
    window.__hdrQaCls = 0;
    window.__hdrQaLongTasks = [];
    window.__hdrQaClsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__hdrQaCls += entry.value;
      }
    });
    window.__hdrQaClsObs.observe({ type: 'layout-shift', buffered: false });

    window.__hdrQaLtObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          window.__hdrQaLongTasks.push({ name: entry.name, duration: Math.round(entry.duration) });
        }
      }
    });
    window.__hdrQaLtObs.observe({ type: 'longtask', buffered: false });
  });

  await page.click('#mobileToggle');
  await waitForHeaderSettled(page);
  await page.click('#mobileToggle');
  await waitForHeaderSettled(page);

  await scrollToY(page, 260);
  await waitForBeforeOpacity(page, '1');
  await scrollToY(page, 0);
  if (!isSolid) {
    await waitForBeforeOpacity(page, '0');
  }
  await page.waitForTimeout(120);

  const audit = await page.evaluate(() => {
    if (window.__hdrQaClsObs) window.__hdrQaClsObs.disconnect();
    if (window.__hdrQaLtObs) window.__hdrQaLtObs.disconnect();

    const wrap = document.getElementById('headerWrap');
    const header = document.querySelector('.site-header');
    const menu = document.getElementById('navMenu');
    const backdrop = document.getElementById('menuBackdrop');
    const items = Array.from(document.querySelectorAll('#navMenu li'));

    const inlineStyled = [wrap, header, menu, backdrop, ...items]
      .filter((el) => el && el.hasAttribute('style') && el.getAttribute('style').trim() !== '')
      .map((el) => `${el.tagName}#${el.id || ''}:${el.getAttribute('style')}`);

    const willChanges = [
      ['headerWrap', getComputedStyle(wrap).willChange],
      ['site-header::before', getComputedStyle(header, '::before').willChange],
      ['navMenu', getComputedStyle(menu).willChange],
      ['menuBackdrop', getComputedStyle(backdrop).willChange]
    ];

    return {
      cls: window.__hdrQaCls,
      longTasks: window.__hdrQaLongTasks,
      backdropFilterMenuBackdrop: getComputedStyle(backdrop).backdropFilter,
      backdropFilterHeaderBefore: getComputedStyle(header, '::before').backdropFilter,
      willChanges,
      inlineStyled
    };
  });

  assert.strictEqual(audit.cls, 0, `${label}: CLS wajib 0 (aktual ${audit.cls})`);
  assert.deepStrictEqual(audit.longTasks, [], `${label}: terdeteksi long task > 50ms: ${JSON.stringify(audit.longTasks)}`);
  assert.strictEqual(audit.backdropFilterMenuBackdrop, 'none', `${label}: .menu-backdrop backdropFilter wajib none`);
  if (!isSolid) {
    assert.strictEqual(audit.backdropFilterHeaderBefore, 'none', `${label}: .site-header::before non-scrolled backdropFilter wajib none`);
  }
  for (const [elName, wc] of audit.willChanges) {
    assert.strictEqual(wc, 'auto', `${label}: ${elName} willChange wajib auto pasca animasi (aktual ${wc})`);
  }
  assert.deepStrictEqual(audit.inlineStyled, [], `${label}: wajib 0 inline style tersisa: ${JSON.stringify(audit.inlineStyled)}`);
}

async function verifyEdgeCases(browser, errors, labelRef) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  attachErrorListeners(page, errors, labelRef);

  try {
    labelRef.current = 'Edge cases 375px /';
    await gotoAndWaitStyles(page, withLang('/', 'id'));

    // 1. Rapid tap 5x berulang
    for (let i = 0; i < 5; i++) {
      await page.click('#mobileToggle');
      await page.waitForTimeout(45);
    }
    await waitForHeaderSettled(page);
    const afterOdd = await readDrawerState(page);
    assert.strictEqual(afterOdd.menuOpen, true, 'Rapid tap 5x: state akhir wajib konsisten terbuka');
    assert.strictEqual(afterOdd.ariaExpanded, 'true', 'Rapid tap 5x: aria-expanded wajib "true"');
    assert.strictEqual(afterOdd.bodyLocked, true, 'Rapid tap 5x: body.menu-scroll-locked wajib aktif');

    // 2. Escape mengembalikan fokus ke #mobileToggle
    await page.keyboard.press('Escape');
    await waitForHeaderSettled(page);
    const afterEsc = await readDrawerState(page);
    assert.strictEqual(afterEsc.menuOpen, false, 'Escape: drawer wajib tertutup');
    assert.strictEqual(afterEsc.activeElementId, 'mobileToggle', 'Escape: fokus wajib kembali ke #mobileToggle');
    assert.strictEqual(afterEsc.bodyLocked, false, 'Escape: body.menu-scroll-locked wajib dilepas');

    // 3. Klik backdrop menutup menu
    await page.click('#mobileToggle');
    await waitForHeaderSettled(page);
    await page.mouse.click(180, 760);
    await waitForHeaderSettled(page);
    const afterBackdrop = await readDrawerState(page);
    assert.strictEqual(afterBackdrop.menuOpen, false, 'Klik backdrop: drawer wajib tertutup');

    // 4. Resize 375px -> 1280px auto-close bersih
    await page.click('#mobileToggle');
    await waitForHeaderSettled(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await waitForHeaderSettled(page);
    const afterResize = await readDrawerState(page);
    assert.strictEqual(afterResize.menuOpen, false, 'Resize 375px->1280px: drawer wajib auto-close');
    assert.strictEqual(afterResize.bodyLocked, false, 'Resize 375px->1280px: scroll lock wajib bersih');
    assert.deepStrictEqual(afterResize.animClasses, [], 'Resize 375px->1280px: kelas animasi wajib bersih');
  } finally {
    await ctx.close();
  }

  await verifyReducedMotionInstant(browser, errors, labelRef);
}

async function readDrawerState(page) {
  return page.evaluate((animClasses) => {
    const wrap = document.getElementById('headerWrap');
    const menu = document.getElementById('navMenu');
    const toggle = document.getElementById('mobileToggle');
    const backdrop = document.getElementById('menuBackdrop');
    const activeAnim = [wrap, menu, backdrop].filter(Boolean).flatMap((el) => (
      animClasses.filter((cls) => el.classList.contains(cls))
    ));
    return {
      menuOpen: menu.classList.contains('open'),
      wrapMenuOpen: wrap.classList.contains('menu-open'),
      ariaExpanded: toggle.getAttribute('aria-expanded'),
      bodyLocked: document.body.classList.contains('menu-scroll-locked'),
      activeElementId: document.activeElement ? document.activeElement.id : '',
      animClasses: activeAnim
    };
  }, ANIM_CLASSES);
}

async function verifyReducedMotionInstant(browser, errors, labelRef) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: 'reduce'
  });
  const page = await ctx.newPage();
  attachErrorListeners(page, errors, labelRef);

  try {
    labelRef.current = 'Reduced motion 375px /';
    await gotoAndWaitStyles(page, withLang('/', 'id'));

    const res = await page.evaluate(() => {
      const wrap = document.getElementById('headerWrap');
      const menu = document.getElementById('navMenu');
      const toggle = document.getElementById('mobileToggle');
      const hasAnim = () => (
        wrap.classList.contains('hdr-wipe-opening') ||
        wrap.classList.contains('hdr-wipe-closing') ||
        wrap.classList.contains('hdr-wipe-animating') ||
        menu.classList.contains('hdr-wipe-animating')
      );

      toggle.click();
      const openInstant = menu.classList.contains('open') && !hasAnim();
      toggle.click();
      const closeInstant = !menu.classList.contains('open') && !hasAnim();
      return { openInstant, closeInstant };
    });

    assert.strictEqual(res.openInstant, true, 'prefers-reduced-motion: open wajib instan tanpa kelas animasi');
    assert.strictEqual(res.closeInstant, true, 'prefers-reduced-motion: close wajib instan tanpa kelas animasi');
  } finally {
    await ctx.close();
  }
}

async function runViewportChecks(browser, vp, lang, routes, solidRoutes, wipeSyncViewports, errors, labelRef) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  attachErrorListeners(page, errors, labelRef);

  try {
    for (const route of routes) {
      const isSolid = solidRoutes.includes(route);
      const label = `${route} [${lang}] ${vp.name}`;
      labelRef.current = label;
      await gotoAndWaitStyles(page, withLang(route, lang));
      await verifyTypographyAndAntiSeam(page, vp, isSolid, label);

      const shouldTestWipe = vp.isMobile && lang === 'id' && wipeSyncViewports.has(vp.name) && (route === '/' || route === solidRoutes[0]);
      if (shouldTestWipe) {
        await verifyUnifiedCornerWipeSync(page, isSolid, label);
      }
    }
  } finally {
    await ctx.close();
  }
}

async function runViewportMatrix(browser, solidRoutes, errors, labelRef) {
  const fullRouteViewports = new Set(['375px', '1024px', '1025px', '1440px']);
  const wipeSyncViewports = new Set(['375px', '390px', '768px', '1024px']);

  for (const lang of LANGS) {
    for (const vp of VIEWPORTS) {
      const routes = fullRouteViewports.has(vp.name)
        ? [...TRANSPARENT_ROUTES, ...solidRoutes]
        : ['/', solidRoutes[0]];
      await runViewportChecks(browser, vp, lang, routes, solidRoutes, wipeSyncViewports, errors, labelRef);
    }
  }
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const errors = { consoleErrors: [], pageErrors: [] };
  const labelRef = { current: 'init' };

  try {
    const solidRoutes = await discoverSolidRoutes(browser);
    await runViewportMatrix(browser, solidRoutes, errors, labelRef);
    await verifyCdpPerformance4x(browser, solidRoutes[0], errors, labelRef);
    await verifyEdgeCases(browser, errors, labelRef);
  } finally {
    await browser.close();
  }

  assert.strictEqual(errors.consoleErrors.length, 0, `Console errors: ${errors.consoleErrors.join('; ')}`);
  assert.strictEqual(errors.pageErrors.length, 0, `Page errors: ${errors.pageErrors.join('; ')}`);
  console.log('ALL T-474 HEADER QA CHECKS PASSED (7 viewports x ID/EN, transparent & solid routes, Unified Corner Wipe sync, CDP 4x CPU throttling, edge cases).');
}

run().catch((err) => {
  console.error('T-474 HEADER QA FAILED:', err);
  process.exit(1);
});
