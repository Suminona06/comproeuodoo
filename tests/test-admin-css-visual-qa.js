import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { chromium } from 'playwright';
import app from '../app.js';
import pool from '../config/database.js';
import { APP_CONFIG } from '../config/constants.js';
import { getJwtSecret } from '../config/secrets.js';

const SCRATCH_DIR = '/home/itpc/.gemini/antigravity/brain/6d7b1d79-4ea1-462e-b0a0-636c6ca9c66a/scratch';

const VIEWPORTS = [
  { name: '320px', width: 320, height: 800 },
  { name: '375px', width: 375, height: 812 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 800 },
  { name: '1440px', width: 1440, height: 900 }
];

const ADMIN_ROUTES = [
  { name: 'dashboard', path: '/admin/dashboard' },
  { name: 'inquiries', path: '/admin/inquiries' },
  { name: 'products', path: '/admin/products' },
  { name: 'products-create', path: '/admin/products/create' },
  { name: 'product-categories', path: '/admin/product-categories' },
  { name: 'brands', path: '/admin/brands' },
  { name: 'posts', path: '/admin/posts' },
  { name: 'posts-create', path: '/admin/posts/create' },
  { name: 'media', path: '/admin/media' },
  { name: 'banners', path: '/admin/banners' },
  { name: 'hero-banners', path: '/admin/hero-banners' },
  { name: 'about', path: '/admin/about' },
  { name: 'home-content', path: '/admin/home-content' },
  { name: 'contact', path: '/admin/contact' },
  { name: 'settings', path: '/admin/settings' },
  { name: 'users', path: '/admin/users' },
  { name: 'change-password', path: '/admin/change-password' }
];

const PUBLIC_ROUTES = [
  { name: 'public-home', path: '/' },
  { name: 'public-products', path: '/products' }
];

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function attachMonitors(page, failedCss, consoleErrors, pageErrors, isExpecting403) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      if (isExpecting403() && msg.text().includes('status of 403 (Forbidden)')) return;
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('/css/') && res.status() >= 400) {
      failedCss.push(`${res.status()} ${url}`);
    }
  });
}

async function auditLayoutOnPage(page, routeName, viewport) {
  const metrics = await page.evaluate(() => {
    const isVisible = (el) => {
      if (el.offsetParent === null) return false;
      const modal = el.closest('.admin-modal');
      if (modal && !modal.classList.contains('is-open')) return false;
      return window.getComputedStyle(el).visibility !== 'hidden';
    };
    const docOverflow = document.documentElement.scrollWidth - window.innerWidth;
    const triggers = Array.from(document.querySelectorAll('.eu-dd:not(.eu-dd--sm) .eu-dd-trigger'))
      .filter(isVisible)
      .map((el) => Math.round(el.getBoundingClientRect().height));
    const buttons = Array.from(document.querySelectorAll('.adm-btn:not(.adm-btn-sm)'))
      .filter((el) => isVisible(el) && !el.closest('.tox-tinymce'))
      .map((el) => ({
        text: el.textContent.trim().slice(0, 30),
        height: Math.round(el.getBoundingClientRect().height)
      }));
    return { docOverflow, triggers, buttons };
  });

  assert.ok(
    metrics.docOverflow <= 1,
    `[${routeName} @ ${viewport.name}] Horizontal overflow detected: scrollWidth - innerWidth = ${metrics.docOverflow}px`
  );

  for (const h of metrics.triggers) {
    if (viewport.width >= 1024) {
      assert.equal(h, 38, `[${routeName} @ ${viewport.name}] .eu-dd-trigger height expected 38px, got ${h}px`);
    } else if (viewport.width <= 768) {
      assert.ok(h >= 44, `[${routeName} @ ${viewport.name}] .eu-dd-trigger mobile height expected >=44px, got ${h}px`);
    }
  }

  if (viewport.width <= 768) {
    for (const btn of metrics.buttons) {
      assert.ok(
        btn.height >= 44,
        `[${routeName} @ ${viewport.name}] .adm-btn "${btn.text}" touch target expected >=44px, got ${btn.height}px`
      );
    }
  }
}

async function loginAsSuperadmin(page, baseUrl) {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', 'admin@euodoo.com');
  await page.fill('input[name="password"]', 'AdminEuodoo2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]')
  ]);
  assert.ok(!page.url().includes('/admin/login'), 'Superadmin login must redirect away from /admin/login');
}

async function verifyModalScrollAndFooter(page, modalSelector, triggerSelector, label) {
  await page.click(triggerSelector);
  await page.waitForSelector(modalSelector, { state: 'visible', timeout: 5000 });
  const modalBox = await page.evaluate((sel) => {
    const modal = document.querySelector(sel);
    const body = modal?.querySelector('.admin-modal-body, .media-picker-body, .modal-body');
    const footer = modal?.querySelector('.admin-modal-footer, .media-picker-footer, .modal-footer');
    const bodyStyle = body ? window.getComputedStyle(body) : null;
    return {
      hasBody: Boolean(body),
      overflowY: bodyStyle?.overflowY || '',
      footerBottom: footer ? footer.getBoundingClientRect().bottom : 0,
      viewportHeight: window.innerHeight
    };
  }, modalSelector);

  assert.ok(modalBox.hasBody, `[${label}] Modal body must exist`);
  assert.ok(
    ['auto', 'scroll'].includes(modalBox.overflowY),
    `[${label}] Modal body overflow-y must be auto/scroll, got "${modalBox.overflowY}"`
  );
  assert.ok(
    modalBox.footerBottom <= modalBox.viewportHeight + 1,
    `[${label}] Modal footer bottom (${modalBox.footerBottom}) must stay within viewport (${modalBox.viewportHeight})`
  );
}

async function runVisualQa() {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });

  const consoleErrors = [];
  const pageErrors = [];
  const failedCss = [];
  let checkedRoutes = 0;

  try {
    // 1. Unauthenticated /admin/login + Editor /admin/403 across 5 viewports
    const authContext = await browser.newContext();
    const authPage = await authContext.newPage();
    let expecting403 = false;
    attachMonitors(authPage, failedCss, consoleErrors, pageErrors, () => expecting403);

    for (const vp of VIEWPORTS) {
      await authPage.setViewportSize({ width: vp.width, height: vp.height });
      const res = await authPage.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle' });
      assert.equal(res.status(), 200, `[/admin/login @ ${vp.name}] must return 200`);
      await auditLayoutOnPage(authPage, 'login', vp);
    }
    checkedRoutes += 1;

    const editorToken = jwt.sign(
      { id: 999, name: 'Editor QA', email: 'editor@euodoo.com', role: 'editor' },
      getJwtSecret(),
      { expiresIn: '1h' }
    );
    await authContext.addCookies([{
      name: APP_CONFIG.SESSION_COOKIE_NAME,
      value: editorToken,
      url: baseUrl
    }]);

    expecting403 = true;
    for (const vp of VIEWPORTS) {
      await authPage.setViewportSize({ width: vp.width, height: vp.height });
      const res403 = await authPage.goto(`${baseUrl}/admin/settings`, { waitUntil: 'networkidle' });
      assert.equal(res403.status(), 403, `[/admin/403 @ ${vp.name}] editor accessing /admin/settings must return 403`);
      await auditLayoutOnPage(authPage, '403', vp);
    }
    expecting403 = false;
    checkedRoutes += 1;
    await authContext.close();

    // 2. Authenticated Superadmin across 17 admin routes x 5 viewports
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    attachMonitors(adminPage, failedCss, consoleErrors, pageErrors, () => false);
    await loginAsSuperadmin(adminPage, baseUrl);

    for (const route of ADMIN_ROUTES) {
      const res = await adminPage.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
      assert.equal(res.status(), 200, `[${route.name}] must return 200`);
      for (const vp of VIEWPORTS) {
        await adminPage.setViewportSize({ width: vp.width, height: vp.height });
        await adminPage.waitForTimeout(30);
        await auditLayoutOnPage(adminPage, route.name, vp);
      }
      checkedRoutes += 1;
    }

    await adminPage.setViewportSize({ width: 1440, height: 900 });
    await adminPage.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'networkidle' });
    await adminPage.screenshot({ path: path.join(SCRATCH_DIR, 'qa-dashboard-1440.png') });

    await adminPage.setViewportSize({ width: 375, height: 812 });
    await adminPage.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle' });
    await adminPage.screenshot({ path: path.join(SCRATCH_DIR, 'qa-products-375.png') });

    // 3. Zoom 125% / short height (1024x576 & 1280x720) modal checks on /admin/products/create
    await adminPage.setViewportSize({ width: 1024, height: 576 });
    await adminPage.goto(`${baseUrl}/admin/products/create`, { waitUntil: 'networkidle' });
    await verifyModalScrollAndFooter(adminPage, '#universalMediaPickerModal', '.btn-open-media-picker, [data-open-media-picker]', 'MediaPicker-Zoom125');
    await adminPage.click('#universalMediaPickerModal [data-tab="upload"]');
    await adminPage.waitForSelector('#mediaPickerTabUpload:not(.adm-d-none)', { state: 'visible', timeout: 3000 });
    await adminPage.screenshot({ path: path.join(SCRATCH_DIR, 'qa-mediapicker-576.png') });
    await adminPage.click('#btnCloseMediaPicker');

    await adminPage.setViewportSize({ width: 1280, height: 720 });
    await verifyModalScrollAndFooter(adminPage, '#modalCopySizeColumns', '#btnCopySizeColumns', 'CopySizeTable-720');
    await adminPage.click('#btnCloseCopyModal');

    // 4. Public pages regression check
    for (const pub of PUBLIC_ROUTES) {
      const res = await adminPage.goto(`${baseUrl}${pub.path}`, { waitUntil: 'load' });
      assert.equal(res.status(), 200, `[${pub.name}] must return 200`);
      for (const vp of VIEWPORTS) {
        await adminPage.setViewportSize({ width: vp.width, height: vp.height });
        await adminPage.waitForTimeout(30);
        const overflow = await adminPage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(overflow <= 1, `[${pub.name} @ ${vp.name}] Public overflow detected: ${overflow}px`);
      }
    }

    await adminContext.close();

    assert.equal(failedCss.length, 0, `CSS asset HTTP errors: ${JSON.stringify(failedCss)}`);
    assert.equal(consoleErrors.length, 0, `Browser console errors: ${JSON.stringify(consoleErrors)}`);
    assert.equal(pageErrors.length, 0, `Uncaught page errors: ${JSON.stringify(pageErrors)}`);

    console.log(`ALL T-432 VISUAL & FUNCTIONAL QA PASSED (${checkedRoutes} admin routes x 5 viewports + Zoom 125% + 2 public routes)`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
}

runVisualQa().catch((err) => {
  console.error('T-432 QA FAILED:', err);
  process.exit(1);
});
