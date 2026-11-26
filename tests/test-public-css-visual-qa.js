import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { chromium } from 'playwright';
import app from '../app.js';
import pool from '../config/database.js';
import { APP_CONFIG } from '../config/constants.js';
import { getJwtSecret } from '../config/secrets.js';
import productModel from '../models/productModel.js';
import postModel from '../models/postModel.js';

const OUTPUT_DIR = '/tmp/euodoo-public-css-qa';

const VIEWPORTS = [
  { name: '320x700', width: 320, height: 700 },
  { name: '375x812', width: 375, height: 812 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 }
];

function parseMode(argv) {
  if (argv.includes('--baseline')) return 'baseline';
  if (argv.includes('--verify')) return 'verify';
  return 'baseline';
}

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function resolveTargetRoutes() {
  const [products, posts] = await Promise.all([
    productModel.findAll({ activeOnly: true, limit: 1, offset: 0 }),
    postModel.findAll({ status: 'published', limit: 1, offset: 0 })
  ]);

  assert.ok(products.length > 0 && products[0].slug, 'Minimal 1 produk aktif diperlukan untuk QA');
  assert.ok(posts.length > 0 && posts[0].slug, 'Minimal 1 berita terbit diperlukan untuk QA');

  return [
    { key: '/', urlPath: '/', isPublic: true, expectedStatus: 200 },
    { key: '/about', urlPath: '/about', isPublic: true, expectedStatus: 200 },
    { key: '/products', urlPath: '/products', isPublic: true, expectedStatus: 200 },
    { key: `/products/${products[0].slug}`, urlPath: `/products/${products[0].slug}`, isPublic: true, expectedStatus: 200 },
    { key: '/capabilities', urlPath: '/capabilities', isPublic: true, expectedStatus: 200 },
    { key: '/news', urlPath: '/news', isPublic: true, expectedStatus: 200 },
    { key: `/news/${posts[0].slug}`, urlPath: `/news/${posts[0].slug}`, isPublic: true, expectedStatus: 200 },
    { key: '/contact', urlPath: '/contact', isPublic: true, expectedStatus: 200 },
    { key: '/halaman-tidak-ada-404', urlPath: '/halaman-tidak-ada-404', isPublic: true, expectedStatus: 404 },
    { key: '/admin/login', urlPath: '/admin/login', isPublic: false, expectedStatus: 200 },
    { key: '/403', urlPath: '/admin/settings', isPublic: false, expectedStatus: 403, needsEditorCookie: true }
  ];
}

function attachMonitors(page, consoleErrors, css404, expectedStatus) {
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (expectedStatus >= 400 && text.includes(`status of ${expectedStatus}`)) return;
    consoleErrors.push(text);
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('.css') && res.status() >= 400) {
      css404.push(`${res.status()} ${url}`);
    }
  });
}

async function addEditorCookie(context, baseUrl) {
  const editorToken = jwt.sign(
    { id: 999, name: 'Editor QA', email: 'editor@euodoo.com', role: 'editor' },
    getJwtSecret(),
    { expiresIn: '1h' }
  );
  await context.addCookies([{
    name: APP_CONFIG.SESSION_COOKIE_NAME,
    value: editorToken,
    url: baseUrl
  }]);
}

function installClsObserver(page) {
  return page.addInitScript(() => {
    window.__qaCls = 0;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__qaCls += entry.value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Abaikan jika browser tidak mendukung layout-shift observer
    }
  });
}

function computeUnusedRatio(ruleUsage, styleSheetLengths) {
  let totalChars = 0;
  for (const len of styleSheetLengths.values()) {
    totalChars += len;
  }
  if (totalChars === 0) return 0;

  let usedChars = 0;
  for (const rule of ruleUsage) {
    if (rule.used && styleSheetLengths.has(rule.styleSheetId)) {
      usedChars += Math.max(0, rule.endOffset - rule.startOffset);
    }
  }
  const unused = Math.max(0, totalChars - usedChars);
  return Number((unused / totalChars).toFixed(4));
}

async function measureRouteCdpMetrics(browser, baseUrl, route) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (route.needsEditorCookie) {
    await addEditorCookie(context, baseUrl);
  }
  const page = await context.newPage();
  await installClsObserver(page);

  const consoleErrors = [];
  const css404 = [];
  attachMonitors(page, consoleErrors, css404, route.expectedStatus);

  const cssResponses = [];
  page.on('response', async (res) => {
    const url = res.url();
    const contentType = res.headers()['content-type'] || '';
    const isCss = url.split('?')[0].endsWith('.css') || contentType.includes('text/css');
    if (!isCss || res.status() >= 400) return;
    try {
      const body = await res.body();
      cssResponses.push({ url, bytes: body.length });
    } catch {
      // Abaikan jika body tidak tersedia (mis. redirect)
    }
  });

  const cdp = await context.newCDPSession(page);
  const styleSheetLengths = new Map();
  cdp.on('CSS.styleSheetAdded', ({ header }) => {
    if (header?.styleSheetId && typeof header.length === 'number') {
      styleSheetLengths.set(header.styleSheetId, header.length);
    }
  });
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  await cdp.send('CSS.startRuleUsageTracking');

  const response = await page.goto(`${baseUrl}${route.urlPath}`, { waitUntil: 'load' });
  assert.equal(response.status(), route.expectedStatus, `[${route.key}] status mismatch`);
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);

  const { ruleUsage } = await cdp.send('CSS.stopRuleUsageTracking');
  const cls = await page.evaluate(() => Number((window.__qaCls || 0).toFixed(4)));
  const cssBytes = cssResponses.reduce((sum, item) => sum + item.bytes, 0);

  await context.close();

  return {
    cssRequests: cssResponses.length,
    cssBytes,
    unusedRatio: computeUnusedRatio(ruleUsage, styleSheetLengths),
    cls,
    consoleErrors,
    css404
  };
}

function buildRouteSlugName(routeKey) {
  if (routeKey === '/') return 'home';
  return routeKey.replace(/^\//, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
}

async function auditViewportSet(page, routeKey, lang, screenshotDir) {
  let maxOverflow = 0;
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(50);
    const overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
    maxOverflow = Math.max(maxOverflow, overflow);

    if (lang === 'id' && (vp.name === '1440x900' || vp.name === '375x812')) {
      const fileName = `${buildRouteSlugName(routeKey)}-${vp.name}.png`;
      await page.screenshot({ path: path.join(screenshotDir, fileName) });
    }
  }
  return maxOverflow;
}

async function auditRouteViewports(browser, baseUrl, route, screenshotDir) {
  const langs = route.isPublic ? ['id', 'en'] : ['id'];
  const consoleErrors = [];
  const css404 = [];
  let maxOverflow = 0;

  const context = await browser.newContext();
  if (route.needsEditorCookie) {
    await addEditorCookie(context, baseUrl);
  }
  const page = await context.newPage();
  attachMonitors(page, consoleErrors, css404, route.expectedStatus);

  for (const lang of langs) {
    const suffix = lang === 'en' ? '?lang=en' : '';
    const targetUrl = `${baseUrl}${route.urlPath}${suffix}`;
    const res = await page.goto(targetUrl, { waitUntil: 'load' });
    assert.equal(res.status(), route.expectedStatus, `[${route.key} (${lang})] status mismatch`);
    await page.evaluate(() => document.fonts?.ready);

    const langOverflow = await auditViewportSet(page, route.key, lang, screenshotDir);
    maxOverflow = Math.max(maxOverflow, langOverflow);
  }

  await context.close();
  return { maxOverflow, consoleErrors, css404 };
}

function compareWithBaseline(baselinePath, currentReport) {
  if (!fs.existsSync(baselinePath)) {
    console.log('Info: baseline.json belum ditemukan, melewati perbandingan delta.');
    return;
  }
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  console.log('\n--- Perbandingan terhadap Baseline ---');
  for (const [routeKey, curr] of Object.entries(currentReport.routes)) {
    const base = baseline.routes?.[routeKey];
    if (!base) continue;
    const byteDelta = curr.cssBytes - base.cssBytes;
    const pct = base.cssBytes > 0 ? ((byteDelta / base.cssBytes) * 100).toFixed(1) : '0.0';
    console.log(
      `${routeKey}: cssBytes ${base.cssBytes} -> ${curr.cssBytes} (${pct}%), ` +
      `requests ${base.cssRequests} -> ${curr.cssRequests}, ` +
      `unused ${(base.unusedRatio * 100).toFixed(1)}% -> ${(curr.unusedRatio * 100).toFixed(1)}%, ` +
      `CLS ${base.cls} -> ${curr.cls}`
    );
  }
}

async function runPublicCssQa() {
  const mode = parseMode(process.argv.slice(2));
  const screenshotDir = path.join(OUTPUT_DIR, 'screenshots', mode);
  fs.mkdirSync(screenshotDir, { recursive: true });

  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const routes = await resolveTargetRoutes();
    const report = {
      mode,
      generatedAt: new Date().toISOString(),
      viewports: VIEWPORTS.map((v) => v.name),
      routes: {}
    };

    for (const route of routes) {
      const cdpMetrics = await measureRouteCdpMetrics(browser, baseUrl, route);
      const vpAudit = await auditRouteViewports(browser, baseUrl, route, screenshotDir);

      const allConsoleErrors = [...cdpMetrics.consoleErrors, ...vpAudit.consoleErrors];
      const allCss404 = [...cdpMetrics.css404, ...vpAudit.css404];

      report.routes[route.key] = {
        cssRequests: cdpMetrics.cssRequests,
        cssBytes: cdpMetrics.cssBytes,
        unusedRatio: cdpMetrics.unusedRatio,
        cls: cdpMetrics.cls,
        overflow: vpAudit.maxOverflow,
        consoleErrors: allConsoleErrors,
        css404: allCss404
      };

      assert.equal(allConsoleErrors.length, 0, `[${route.key}] Console errors: ${JSON.stringify(allConsoleErrors)}`);
      assert.equal(allCss404.length, 0, `[${route.key}] CSS >=400 errors: ${JSON.stringify(allCss404)}`);
      assert.ok(vpAudit.maxOverflow <= 1, `[${route.key}] Horizontal overflow: ${vpAudit.maxOverflow}px`);
    }

    const reportPath = path.join(OUTPUT_DIR, `${mode}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log(`QA mode=${mode} selesai untuk ${routes.length} rute. Laporan: ${reportPath}`);
    for (const [routeKey, metrics] of Object.entries(report.routes)) {
      console.log(
        `  ${routeKey}: requests=${metrics.cssRequests}, bytes=${metrics.cssBytes}, ` +
        `unused=${(metrics.unusedRatio * 100).toFixed(1)}%, cls=${metrics.cls}, overflow=${metrics.overflow}px`
      );
    }

    if (mode === 'verify') {
      compareWithBaseline(path.join(OUTPUT_DIR, 'baseline.json'), report);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

runPublicCssQa().catch((err) => {
  console.error('Public CSS Visual QA FAILED:', err);
  process.exit(1);
});
