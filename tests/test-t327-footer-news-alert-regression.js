import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import app from '../app.js';
import { pool } from '../config/database.js';
import { clearSettingsCache } from '../middleware/settingsMiddleware.js';

const VIEWPORTS = [
  { width: 320, height: 667 },
  { width: 375, height: 812 },
  { width: 480, height: 854 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 }
];
const LANGS = ['id', 'en'];
const DETAIL_SLUG = 'pt-euodoo-raih-sertifikasi-ekolabel-indonesia-sni-7188';
const TRACKED_SETTING_KEYS = [
  'footer_desc_id',
  'footer_desc_en',
  'footer_nav_links_json',
  'meta_description_id',
  'meta_description_en'
];

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@euodoo.com';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || 'AdminEuodoo2026!';

function toLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseRgb(rgbString) {
  const nums = rgbString.match(/\d+(\.\d+)?/g);
  assert.ok(nums && nums.length >= 3, `Invalid RGB value: ${rgbString}`);
  return nums.slice(0, 4).map(Number);
}

function blendOver(fgRgb, bgRgb) {
  const alpha = fgRgb.length === 4 ? fgRgb[3] : 1;
  if (alpha >= 0.999) return fgRgb.slice(0, 3);
  return [0, 1, 2].map((i) => fgRgb[i] * alpha + bgRgb[i] * (1 - alpha));
}

function contrastRatio(fgString, bgString) {
  const bg = parseRgb(bgString).slice(0, 3);
  const fg = blendOver(parseRgb(fgString), bg);
  const [r1, g1, b1] = fg.map(toLinear);
  const [r2, g2, b2] = bg.map(toLinear);
  const l1 = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
  const l2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function parseSetCookies(headerList = []) {
  const map = new Map();
  for (const raw of headerList) {
    const pair = raw.split(';')[0];
    const eqIdx = pair.indexOf('=');
    if (eqIdx > 0) map.set(pair.slice(0, eqIdx).trim(), pair.slice(eqIdx + 1).trim());
  }
  return map;
}

function httpRequest(baseUrl, { method = 'GET', reqPath = '/', headers = {}, body = null }) {
  const url = new URL(reqPath, baseUrl);
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function loginAdminSession(baseUrl) {
  const loginRes = await httpRequest(baseUrl, { reqPath: '/admin/login' });
  const csrfCookies = parseSetCookies(loginRes.headers['set-cookie']);
  const csrfToken = csrfCookies.get('_csrf_token') || '';
  assert.ok(csrfToken, 'GET /admin/login must issue _csrf_token cookie');

  const formBody = new URLSearchParams({
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    _csrf: csrfToken
  }).toString();

  const postRes = await httpRequest(baseUrl, {
    method: 'POST',
    reqPath: '/admin/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `_csrf_token=${csrfToken}`
    },
    body: formBody
  });
  const sessionCookies = parseSetCookies(postRes.headers['set-cookie']);
  const sessionVal = sessionCookies.get('euodoo_session') || '';
  assert.ok(sessionVal, 'Admin login must issue euodoo_session cookie');

  return {
    csrfToken,
    cookieHeader: `euodoo_session=${sessionVal}; _csrf_token=${csrfToken}`,
    playwrightCookies: [
      { name: 'euodoo_session', value: sessionVal, url: baseUrl },
      { name: '_csrf_token', value: csrfToken, url: baseUrl }
    ]
  };
}

async function snapshotSettings(allKeys = false) {
  if (allKeys) {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    return rows;
  }
  const placeholders = TRACKED_SETTING_KEYS.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${placeholders})`,
    TRACKED_SETTING_KEYS
  );
  return rows;
}

async function restoreSettings(snapshotRows) {
  for (const row of snapshotRows) {
    await pool.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [
      row.setting_value,
      row.setting_key
    ]);
  }
  clearSettingsCache();
}

async function updateFooterSettingsViaDbAndCache(descId, descEn, navLinks) {
  const payload = [
    ['footer_desc_id', descId],
    ['footer_desc_en', descEn],
    ['footer_nav_links_json', JSON.stringify(navLinks)]
  ];
  for (const [key, val] of payload) {
    await pool.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [val, key]);
  }
  clearSettingsCache();
}

function snapshotFaviconMtimes() {
  const candidates = [
    'public/favicon.ico',
    'public/uploads/settings/favicon-16x16.png',
    'public/uploads/settings/favicon-32x32.png',
    'public/uploads/settings/favicon-180x180.png',
    'public/uploads/settings/favicon-192x192.png',
    'public/uploads/settings/favicon-512x512.png'
  ].filter((rel) => fs.existsSync(path.resolve(rel)));
  assert.ok(candidates.length >= 5, 'Expected existing generated favicon files before save');
  return Object.fromEntries(candidates.map((rel) => [rel, fs.statSync(path.resolve(rel)).mtimeMs]));
}

function assertFaviconMtimesUnchanged(mtimeBefore) {
  for (const [rel, beforeMs] of Object.entries(mtimeBefore)) {
    assert.equal(fs.statSync(path.resolve(rel)).mtimeMs, beforeMs, `Saving footer settings must not regenerate ${rel}`);
  }
}

async function createMonitoredPage(browser, viewport, authCookies = null, extraOpts = {}) {
  const context = await browser.newContext({ viewport, ...extraOpts });
  if (authCookies) await context.addCookies(authCookies);
  const page = await context.newPage();

  const state = { consoleErrors: [], pageErrors: [], serverErrors: [], cspViolations: [], dialogs: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') state.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => state.pageErrors.push(err.message));
  page.on('response', (res) => {
    if (res.status() >= 500) state.serverErrors.push(`${res.status()} ${res.url()}`);
  });
  page.on('dialog', async (dialog) => {
    state.dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push(`${e.violatedDirective}:${e.blockedURI}`);
    });
  });
  return { context, page, state };
}

async function assertCleanPageViewport(browser, url, viewport, authCookies = null) {
  const { context, page, state } = await createMonitoredPage(browser, viewport, authCookies);
  await page.goto(url, { waitUntil: 'load' });
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    csp: window.__cspViolations || []
  }));

  assert.equal(state.consoleErrors.length, 0, `Console errors on ${url} (${viewport.width}px): ${state.consoleErrors.join(' | ')}`);
  assert.equal(state.pageErrors.length, 0, `Page errors on ${url} (${viewport.width}px): ${state.pageErrors.join(' | ')}`);
  assert.equal(state.serverErrors.length, 0, `500+ responses on ${url} (${viewport.width}px): ${state.serverErrors.join(' | ')}`);
  assert.equal(metrics.csp.length, 0, `CSP violations on ${url} (${viewport.width}px): ${metrics.csp.join(' | ')}`);
  assert.ok(
    metrics.scrollWidth <= metrics.innerWidth + 1,
    `Horizontal overflow on ${url} at ${viewport.width}px (${metrics.scrollWidth} > ${metrics.innerWidth})`
  );
  return { context, page, state };
}

async function checkPublicViewportMetrics(browser, baseUrl, routePath, lang, viewport) {
  const url = `${baseUrl}${routePath}?lang=${lang}`;
  const { context, page } = await assertCleanPageViewport(browser, url, viewport);
  try {
    const boxes = await page.evaluate(() => {
      const footer = document.querySelector('.site-footer');
      const desc = document.querySelector('.ft-desc');
      const navLinks = Array.from(document.querySelectorAll('.ft-nav-link'));
      const shareBtns = Array.from(document.querySelectorAll('.nwd-share-btn'));
      return {
        footerBg: footer ? getComputedStyle(footer).backgroundColor : null,
        descColor: desc ? getComputedStyle(desc).color : null,
        navColor: navLinks[0] ? getComputedStyle(navLinks[0]).color : null,
        navRects: navLinks.map((el) => el.getBoundingClientRect()),
        shareRects: shareBtns.map((el) => el.getBoundingClientRect())
      };
    });

    assert.ok(boxes.footerBg && boxes.descColor, `Footer missing on ${url}`);
    assert.ok(contrastRatio(boxes.descColor, boxes.footerBg) >= 4.5, `.ft-desc contrast must be >= 4.5 on ${url}`);
    if (boxes.navColor) {
      assert.ok(contrastRatio(boxes.navColor, boxes.footerBg) >= 4.5, `.ft-nav-link contrast must be >= 4.5 on ${url}`);
    }
    for (const rect of boxes.navRects) {
      assert.ok(rect.height >= 44 && rect.width >= 44, `.ft-nav-link touch target < 44px on ${url} (${viewport.width}px)`);
    }
    for (const rect of boxes.shareRects) {
      assert.ok(rect.height >= 44 && rect.width >= 44, `.nwd-share-btn touch target < 44px on ${url} (${viewport.width}px)`);
    }
  } finally {
    await context.close();
  }
}

async function checkAdminSettingsViewport(browser, baseUrl, authCookies, viewport) {
  const url = `${baseUrl}/admin/settings`;
  const { context, page } = await assertCleanPageViewport(browser, url, viewport, authCookies);
  try {
    const metrics = await page.evaluate(() => {
      const card = document.getElementById('footerNavRepeaterContainer')?.closest('.form-card');
      const addBtn = document.getElementById('btnAddFooterNav');
      const ctrlBtns = Array.from(document.querySelectorAll('.stg-footer-ctrl-btn'));
      const titleEl = document.querySelector('.stg-footer-title');
      const descEl = document.querySelector('.stg-footer-desc');
      const hintEl = document.getElementById('footerNavLimitHint');
      const navBadgeEl = document.getElementById('footerNavCountBadge');
      const repeater = document.getElementById('footerNavRepeaterContainer');
      const countBadge = document.getElementById('footerDescIdCount');
      return {
        hasCard: Boolean(card),
        addRect: addBtn ? addBtn.getBoundingClientRect() : null,
        ctrlRects: ctrlBtns.map((b) => b.getBoundingClientRect()),
        titleColor: titleEl ? getComputedStyle(titleEl).color : null,
        descColor: descEl ? getComputedStyle(descEl).color : null,
        hintColor: hintEl ? getComputedStyle(hintEl).color : null,
        navBadgeColor: navBadgeEl ? getComputedStyle(navBadgeEl).color : null,
        navBadgeBg: navBadgeEl ? getComputedStyle(navBadgeEl).backgroundColor : null,
        repeaterBg: repeater ? getComputedStyle(repeater).backgroundColor : null,
        countColor: countBadge ? getComputedStyle(countBadge).color : null,
        countBg: countBadge ? getComputedStyle(countBadge).backgroundColor : null
      };
    });

    assert.equal(metrics.hasCard, true, 'Card 6 footer content must render on /admin/settings');
    assert.ok(metrics.addRect.height >= 44 && metrics.addRect.width >= 44, `#btnAddFooterNav touch target < 44px at ${viewport.width}px`);
    for (const rect of metrics.ctrlRects) {
      assert.ok(rect.height >= 44 && rect.width >= 44, `.stg-footer-ctrl-btn touch target < 44px at ${viewport.width}px`);
    }
    assert.ok(contrastRatio(metrics.titleColor, metrics.repeaterBg) >= 4.5, '.stg-footer-title contrast < 4.5:1');
    assert.ok(contrastRatio(metrics.descColor, metrics.repeaterBg) >= 4.5, '.stg-footer-desc contrast < 4.5:1');
    assert.ok(contrastRatio(metrics.hintColor, metrics.repeaterBg) >= 4.5, '.stg-footer-hint contrast < 4.5:1');
    assert.ok(contrastRatio(metrics.navBadgeColor, metrics.navBadgeBg) >= 4.5, '.stg-footer-count-badge contrast < 4.5:1');
    assert.ok(contrastRatio(metrics.countColor, metrics.countBg) >= 4.5, '.stg-char-count contrast < 4.5:1');
  } finally {
    await context.close();
  }
}

describe('Regression T-327: Footer Dinamis, CMS Settings & Toast Salin Tautan News', () => {
  let server;
  let baseUrl;
  let browser;
  let snapshotRows;
  let adminAuth;
  const idDict = JSON.parse(fs.readFileSync(path.resolve('locales/id.json'), 'utf8'));
  const enDict = JSON.parse(fs.readFileSync(path.resolve('locales/en.json'), 'utf8'));

  let fullSnapshotRows;

  before(async () => {
    fullSnapshotRows = await snapshotSettings(true);
    snapshotRows = fullSnapshotRows.filter((r) => TRACKED_SETTING_KEYS.includes(r.setting_key));
    clearSettingsCache();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    adminAuth = await loginAdminSession(baseUrl);
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    try {
      await restoreSettings(fullSnapshotRows);
    } finally {
      if (browser) await browser.close();
      if (server) await new Promise((resolve) => server.close(resolve));
      await pool.end();
    }
  });

  it('1. 6 viewports x ID/EN on /, /news/:slug & /admin/settings pass overflow, contrast, 44px & zero error gates', async () => {
    for (const viewport of VIEWPORTS) {
      for (const lang of LANGS) {
        await checkPublicViewportMetrics(browser, baseUrl, '/', lang, viewport);
        await checkPublicViewportMetrics(browser, baseUrl, `/news/${DETAIL_SLUG}`, lang, viewport);
      }
      await checkAdminSettingsViewport(browser, baseUrl, adminAuth.playwrightCookies, viewport);
    }
  });

  it('2. Homepage stays frozen cleanly, excludes SweetAlert2 assets & layout.css footer rules stay isolated', async () => {
    const layoutCss = fs.readFileSync(path.resolve('public/css/layout.css'), 'utf8');
    const footerStart = layoutCss.indexOf('PT Euodoo Footer Layout');
    const footerEnd = layoutCss.indexOf('Responsive Media Queries for Header & Footer');
    assert.ok(footerStart !== -1 && footerEnd !== -1, 'Footer CSS boundary comments must exist');

    const { context, page } = await createMonitoredPage(browser, { width: 1440, height: 900 });
    try {
      await page.goto(`${baseUrl}/?lang=id`, { waitUntil: 'load' });
      const homeInfo = await page.evaluate(() => ({
        hasSwalCss: Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
          .some((el) => (el.getAttribute('href') || '').includes('sweetalert2')),
        hasSwalJs: Array.from(document.querySelectorAll('script[src]'))
          .some((el) => (el.getAttribute('src') || '').includes('sweetalert2')),
        swalDefined: typeof window.Swal !== 'undefined'
      }));
      assert.equal(homeInfo.hasSwalCss, false, 'Homepage must NOT load sweetalert2 CSS');
      assert.equal(homeInfo.hasSwalJs, false, 'Homepage must NOT load sweetalert2 JS');
      assert.equal(homeInfo.swalDefined, false, 'window.Swal must NOT exist on homepage');
    } finally {
      await context.close();
    }
  });

  it('3. End-to-end CMS footer sync for 0, 2 & 4 items (ID/EN), external link attrs & SEO meta isolation', async () => {
    const metaDescId = snapshotRows.find((r) => r.setting_key === 'meta_description_id')?.setting_value || '';
    const metaDescEn = snapshotRows.find((r) => r.setting_key === 'meta_description_en')?.setting_value || '';
    const customDescId = 'Deskripsi dinamis footer ID untuk regresi T-327.';
    const customDescEn = 'Dynamic English footer description for T-327 regression.';

    const twoItems = [
      { label_id: 'Produk Kami', label_en: 'Our Products', url: '/products' },
      { label_id: 'Sertifikasi', label_en: 'Certifications', url: '/about#sertifikasi' }
    ];
    const fourItems = [
      ...twoItems,
      { label_id: 'Beranda', label_en: 'Home', url: '#top' },
      { label_id: 'Portal Eksternal', label_en: 'External Portal', url: 'https://euodoo.co.id/katalog' }
    ];

    try {
      await updateFooterSettingsViaDbAndCache(customDescId, customDescEn, []);
      const p0 = await createMonitoredPage(browser, { width: 1440, height: 900 });
      try {
        await p0.page.goto(`${baseUrl}/?lang=id`, { waitUntil: 'load' });
        const zeroState = await p0.page.evaluate(() => {
          const ftMain = document.querySelector('.ft-main');
          const cols = ftMain ? getComputedStyle(ftMain).gridTemplateColumns.trim().split(/\s+/).length : 0;
          return {
            hasNav: Boolean(document.querySelector('.ft-nav')),
            cols,
            descText: document.querySelector('.ft-desc')?.textContent?.trim() || '',
            metaDesc: document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
          };
        });
        assert.equal(zeroState.hasNav, false, '0 menu items must omit .ft-nav');
        assert.equal(zeroState.cols, 1, '0 menu items must collapse .ft-main to single column');
        assert.equal(zeroState.descText, customDescId, 'ID footer must reflect footer_desc_id');
        assert.equal(zeroState.metaDesc, metaDescId, 'meta_description_id must stay isolated from footer_desc_id');
      } finally {
        await p0.context.close();
      }

      await updateFooterSettingsViaDbAndCache(customDescId, customDescEn, twoItems);
      const p2 = await createMonitoredPage(browser, { width: 1440, height: 900 });
      try {
        await p2.page.goto(`${baseUrl}/?lang=en`, { waitUntil: 'load' });
        const twoState = await p2.page.evaluate(() => ({
          labels: Array.from(document.querySelectorAll('.ft-nav-link .ft-nav-text')).map((el) => el.textContent.trim()),
          descText: document.querySelector('.ft-desc')?.textContent?.trim() || '',
          metaDesc: document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
        }));
        assert.deepEqual(twoState.labels, ['Our Products', 'Certifications']);
        assert.equal(twoState.descText, customDescEn, 'EN footer must reflect footer_desc_en');
        assert.equal(twoState.metaDesc, metaDescEn, 'meta_description_en must stay isolated from footer_desc_en');
      } finally {
        await p2.context.close();
      }

      const pCms = await createMonitoredPage(browser, { width: 1280, height: 900 }, adminAuth.playwrightCookies);
      try {
        await pCms.page.goto(`${baseUrl}/admin/settings`, { waitUntil: 'load' });
        await pCms.page.fill('#footer_desc_id', 'Uji CMS UI deskripsi ID');
        await pCms.page.fill('#footer_desc_en', 'CMS UI test EN description');
        const counterText = await pCms.page.$eval('#footerDescIdCount', (el) => el.textContent.trim());
        assert.equal(counterText, '23 / 350');
        await pCms.page.click('#btnAddFooterNav');
        await pCms.page.click('#btnAddFooterNav');
        const rowsCount = await pCms.page.locator('#footerNavList .stg-footer-item').count();
        assert.equal(rowsCount, 4, 'Repeater must add up to 4 items and disable add button');
        assert.equal(await pCms.page.isDisabled('#btnAddFooterNav'), true);

        const row3Inputs = pCms.page.locator('#footerNavList .stg-footer-item').nth(2).locator('input');
        await row3Inputs.nth(0).fill('Ke Atas');
        await row3Inputs.nth(1).fill('Back to Top');
        await row3Inputs.nth(2).fill('#top');

        const row4Inputs = pCms.page.locator('#footerNavList .stg-footer-item').nth(3).locator('input');
        await row4Inputs.nth(0).fill(fourItems[3].label_id);
        await row4Inputs.nth(1).fill(fourItems[3].label_en);
        await row4Inputs.nth(2).fill(fourItems[3].url);

        const mtimeBefore = snapshotFaviconMtimes();

        await Promise.all([
          pCms.page.waitForURL((u) => u.pathname === '/admin/settings'),
          pCms.page.click('.settings-sticky-actions button[type="submit"]')
        ]);

        assertFaviconMtimesUnchanged(mtimeBefore);
      } finally {
        await pCms.context.close();
      }

      clearSettingsCache();
      const p4 = await createMonitoredPage(browser, { width: 1440, height: 900 });
      try {
        await p4.page.goto(`${baseUrl}/news/${DETAIL_SLUG}?lang=id`, { waitUntil: 'load' });
        const linksMeta = await p4.page.evaluate(() =>
          Array.from(document.querySelectorAll('.ft-nav-link')).map((a) => ({
            href: a.getAttribute('href'),
            target: a.getAttribute('target'),
            rel: a.getAttribute('rel')
          }))
        );
        assert.equal(linksMeta.length, 4);
        assert.equal(linksMeta[0].target, null, 'Internal link must not open new tab');
        assert.equal(linksMeta[3].href, fourItems[3].url);
        assert.equal(linksMeta[3].target, '_blank');
        assert.equal(linksMeta[3].rel, 'noopener noreferrer');
      } finally {
        await p4.context.close();
      }
    } finally {
      await restoreSettings(snapshotRows);
    }
  });

  it('4. Server POST /admin/settings rejects dangerous URLs, >4 menu items & >350 char descriptions without DB mutation', async () => {
    const beforeSnapshot = JSON.stringify(await snapshotSettings());
    const maliciousPayloads = [
      { footer_nav_links_json: JSON.stringify([{ label_id: 'Bad', label_en: 'Bad', url: 'javascript:alert(1)' }]) },
      { footer_nav_links_json: JSON.stringify([{ label_id: 'Bad', label_en: 'Bad', url: 'data:text/html,<h1>x</h1>' }]) },
      { footer_nav_links_json: JSON.stringify([{ label_id: 'Bad', label_en: 'Bad', url: '//evil.example/phish' }]) },
      {
        footer_nav_links_json: JSON.stringify([
          { label_id: '1', label_en: '1', url: '/a' },
          { label_id: '2', label_en: '2', url: '/b' },
          { label_id: '3', label_en: '3', url: '/c' },
          { label_id: '4', label_en: '4', url: '/d' },
          { label_id: '5', label_en: '5', url: '/e' }
        ])
      },
      { footer_desc_id: 'x'.repeat(351) },
      { footer_desc_en: 'y'.repeat(351) }
    ];

    try {
      for (const fields of maliciousPayloads) {
        const body = new URLSearchParams({ _csrf: adminAuth.csrfToken, ...fields }).toString();
        const res = await httpRequest(baseUrl, {
          method: 'POST',
          reqPath: '/admin/settings',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: adminAuth.cookieHeader
          },
          body
        });
        assert.equal(res.statusCode, 302);
        assert.ok((res.headers.location || '').includes('error='), `Expected error redirect for ${Object.keys(fields)[0]}`);
      }

      const afterSnapshot = JSON.stringify(await snapshotSettings());
      assert.equal(afterSnapshot, beforeSnapshot, 'Rejected payloads must leave DB settings unchanged');
    } finally {
      await restoreSettings(snapshotRows);
    }
  });

  it('5. /news/:slug shows 2s green SweetAlert2 toast (0 native alerts), passes AA/44px/viewport & supports error + reduced-motion', async () => {
    for (const lang of LANGS) {
      const dict = lang === 'en' ? enDict : idDict;
      const { context, page, state } = await createMonitoredPage(browser, { width: 320, height: 667 });
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: async () => undefined }
        });
      });

      try {
        await page.goto(`${baseUrl}/news/${DETAIL_SLUG}?lang=${lang}`, { waitUntil: 'load' });
        await page.click('#copyLinkBtn');
        await page.waitForSelector('.nwd-swal-popup.nwd-swal-success', { state: 'visible', timeout: 1500 });

        const toastCheck = await page.evaluate(() => {
          const popup = document.querySelector('.nwd-swal-popup.nwd-swal-success');
          const title = popup.querySelector('.nwd-swal-title');
          const closeBtn = popup.querySelector('.nwd-swal-close');
          const statusEl = document.getElementById('nwdCopyStatus');
          const popupCss = getComputedStyle(popup);
          return {
            titleText: title.textContent.trim(),
            liveText: statusEl.textContent.trim(),
            popupRect: popup.getBoundingClientRect(),
            closeRect: closeBtn.getBoundingClientRect(),
            leftBorder: popupCss.borderLeftColor,
            popupBg: popupCss.backgroundColor,
            titleColor: getComputedStyle(title).color,
            closeColor: getComputedStyle(closeBtn).color,
            innerWidth: window.innerWidth
          };
        });

        assert.equal(state.dialogs.length, 0, 'Must never trigger browser native alert/confirm/prompt');
        assert.equal(toastCheck.titleText, dict.news_detail.copy_success);
        assert.equal(toastCheck.liveText, dict.news_detail.copy_success);
        assert.equal(toastCheck.leftBorder, 'rgb(0, 117, 90)', 'Toast accent border must match --color-primary (#00755a)');
        assert.ok(toastCheck.popupRect.left >= 0 && toastCheck.popupRect.right <= toastCheck.innerWidth + 1);
        assert.ok(toastCheck.closeRect.width >= 44 && toastCheck.closeRect.height >= 44, 'Toast close button < 44px');
        assert.ok(contrastRatio(toastCheck.titleColor, toastCheck.popupBg) >= 4.5);
        assert.ok(contrastRatio(toastCheck.closeColor, toastCheck.popupBg) >= 4.5);

        await page.waitForTimeout(2400);
        const stillVisible = await page.locator('.nwd-swal-popup').isVisible();
        assert.equal(stillVisible, false, '2s toast must auto-dismiss within ~2.4s');
      } finally {
        await context.close();
      }
    }

    const errSetup = await createMonitoredPage(
      browser,
      { width: 1280, height: 800 },
      null,
      { reducedMotion: 'reduce' }
    );
    await errSetup.page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async () => { throw new Error('denied'); } }
      });
      document.execCommand = () => false;
    });

    try {
      await errSetup.page.goto(`${baseUrl}/news/${DETAIL_SLUG}?lang=en`, { waitUntil: 'load' });
      await errSetup.page.click('#copyLinkBtn');
      await errSetup.page.waitForSelector('.nwd-swal-popup.nwd-swal-error', { state: 'visible', timeout: 1500 });

      const errCheck = await errSetup.page.evaluate(() => {
        const popup = document.querySelector('.nwd-swal-popup.nwd-swal-error');
        const title = popup.querySelector('.nwd-swal-title');
        return {
          titleText: title.textContent.trim(),
          animName: getComputedStyle(popup).animationName,
          popupBg: getComputedStyle(popup).backgroundColor,
          titleColor: getComputedStyle(title).color
        };
      });

      assert.equal(errCheck.titleText, enDict.news_detail.copy_error);
      assert.equal(errCheck.animName, 'none', 'prefers-reduced-motion must disable popup animation');
      assert.ok(contrastRatio(errCheck.titleColor, errCheck.popupBg) >= 4.5, 'Error toast title contrast < 4.5:1');
      assert.equal(errSetup.state.consoleErrors.length, 0);
    } finally {
      await errSetup.context.close();
    }
  });
});
