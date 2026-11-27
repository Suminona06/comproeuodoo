import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import app from '../app.js';
import pool from '../config/database.js';

const QA_PREFIX = 'QA-BULK-';
const QA_SLUG_PREFIX = 'qa-bulk-';

const VIEWPORTS = [
  { name: '320px', width: 320, height: 800 },
  { name: '375px', width: 375, height: 812 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 800 },
  { name: '1280px', width: 1280, height: 800 },
  { name: '1440px', width: 1440, height: 900 },
  { name: 'zoom-125', width: 1024, height: 576 }
];

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function attachMonitors(page, consoleErrors, pageErrors, failedCss) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
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

async function seedQaData() {
  await cleanupQaData();

  const [pCat1] = await pool.query(
    'INSERT INTO product_categories (name_id, name_en, slug, sort_order, is_active) VALUES (?, ?, ?, 999, 1)',
    [`${QA_PREFIX}PCAT-1`, `${QA_PREFIX}PCAT-1`, `${QA_SLUG_PREFIX}pcat-1`]
  );
  await pool.query(
    'INSERT INTO product_categories (name_id, name_en, slug, sort_order, is_active) VALUES (?, ?, ?, 999, 1)',
    [`${QA_PREFIX}PCAT-2`, `${QA_PREFIX}PCAT-2`, `${QA_SLUG_PREFIX}pcat-2`]
  );

  for (let i = 1; i <= 11; i++) {
    const num = String(i).padStart(2, '0');
    await pool.query(
      'INSERT INTO products (category_id, name_id, name_en, slug, status, is_active, sort_order) VALUES (?, ?, ?, ?, ?, 1, 999)',
      [pCat1.insertId, `${QA_PREFIX}PROD-${num}`, `${QA_PREFIX}PROD-${num}`, `${QA_SLUG_PREFIX}prod-${num}`, 'published']
    );
  }

  const [postCat1] = await pool.query(
    'INSERT INTO post_categories (name_id, name_en, slug, type, sort_order) VALUES (?, ?, ?, ?, 999)',
    [`${QA_PREFIX}POSTCAT-1`, `${QA_PREFIX}POSTCAT-1`, `${QA_SLUG_PREFIX}postcat-1`, 'berita']
  );
  await pool.query(
    'INSERT INTO post_categories (name_id, name_en, slug, type, sort_order) VALUES (?, ?, ?, ?, 999)',
    [`${QA_PREFIX}POSTCAT-2`, `${QA_PREFIX}POSTCAT-2`, `${QA_SLUG_PREFIX}postcat-2`, 'berita']
  );

  for (let i = 1; i <= 3; i++) {
    await pool.query(
      'INSERT INTO posts (category_id, type, title_id, title_en, slug, status, is_headline) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [postCat1.insertId, 'berita', `${QA_PREFIX}POST-${i}`, `${QA_PREFIX}POST-${i}`, `${QA_SLUG_PREFIX}post-${i}`, 'published']
    );
  }
}

async function cleanupQaData() {
  await pool.query('DELETE FROM products WHERE slug LIKE ?', [`${QA_SLUG_PREFIX}%`]);
  await pool.query('DELETE FROM product_categories WHERE slug LIKE ?', [`${QA_SLUG_PREFIX}%`]);
  await pool.query('DELETE FROM posts WHERE slug LIKE ?', [`${QA_SLUG_PREFIX}%`]);
  await pool.query('DELETE FROM post_categories WHERE slug LIKE ?', [`${QA_SLUG_PREFIX}%`]);
}

async function waitTabTransitions(page, containerSel, btnSel) {
  await page.waitForFunction(
    ({ cSel, bSel }) => {
      const container = document.querySelector(cSel);
      if (!container) return false;
      const buttons = Array.from(container.querySelectorAll(bSel)).filter((el) => el.offsetParent !== null);
      return buttons.every((el) => {
        const isActive = el.classList.contains('active') || el.getAttribute('aria-selected') === 'true';
        const op = parseFloat(window.getComputedStyle(el, '::after').opacity);
        return isActive ? op === 1 : op === 0;
      });
    },
    { cSel: containerSel, bSel: btnSel },
    { timeout: 2000 }
  );
}

async function verifyTabsGrowingUnderline(page, containerSel, btnSel, label) {
  const result = await page.evaluate(({ containerSel: cSel, btnSel: bSel }) => {
    const container = document.querySelector(cSel);
    if (!container) return { found: false };
    const buttons = Array.from(container.querySelectorAll(bSel)).filter((el) => el.offsetParent !== null);
    const items = buttons.map((el) => {
      const style = window.getComputedStyle(el);
      const afterStyle = window.getComputedStyle(el, '::after');
      const rect = el.getBoundingClientRect();
      const isActive = el.classList.contains('active') || el.getAttribute('aria-selected') === 'true';
      return {
        text: el.textContent.trim(),
        isActive,
        fontSize: parseFloat(style.fontSize),
        height: Math.round(rect.height),
        afterBg: afterStyle.backgroundColor,
        afterOpacity: parseFloat(afterStyle.opacity),
        afterTransform: afterStyle.transform,
        afterOrigin: afterStyle.transformOrigin
      };
    });
    return {
      found: true,
      overflowX: window.getComputedStyle(container).overflowX,
      items
    };
  }, { containerSel, btnSel });

  assert.equal(result.found, true, `[${label}] Tab container ${containerSel} not found`);
  assert.ok(result.items.length >= 2, `[${label}] Expected >= 2 visible tabs in ${containerSel}`);

  const activeItems = result.items.filter((i) => i.isActive);
  assert.ok(activeItems.length >= 1, `[${label}] Expected at least 1 active tab in ${containerSel}`);

  for (const item of result.items) {
    assert.ok(item.fontSize >= 13, `[${label}] Tab "${item.text}" font-size ${item.fontSize}px < 13px`);
    assert.equal(
      item.afterBg,
      'rgb(0, 117, 90)',
      `[${label}] Tab "${item.text}" ::after color expected --primary rgb(0, 117, 90), got ${item.afterBg}`
    );
    const originParts = item.afterOrigin.split(' ').map((v) => parseFloat(v));
    assert.ok(originParts[0] > 0, `[${label}] Tab "${item.text}" ::after transform-origin must be centered, got ${item.afterOrigin}`);

    if (item.isActive) {
      assert.equal(item.afterOpacity, 1, `[${label}] Active tab "${item.text}" ::after opacity must be 1`);
      assert.equal(
        item.afterTransform,
        'matrix(1, 0, 0, 1, 0, 0)',
        `[${label}] Active tab "${item.text}" ::after transform must be scaleX(1), got ${item.afterTransform}`
      );
    } else {
      assert.equal(item.afterOpacity, 0, `[${label}] Inactive tab "${item.text}" ::after opacity must be 0`);
    }
  }
}

async function verifyMobileTabTouchTargets(page, containerSel, btnSel, label) {
  for (const vp of VIEWPORTS.filter((v) => v.width <= 768)) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(30);
    const metrics = await page.evaluate(({ cSel, bSel }) => {
      const container = document.querySelector(cSel);
      if (!container) return { found: false };
      const cStyle = window.getComputedStyle(container);
      const items = Array.from(container.querySelectorAll(bSel))
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({
          text: el.textContent.trim(),
          height: Math.round(el.getBoundingClientRect().height),
          clipped: el.scrollWidth > el.clientWidth + 2
        }));
      return {
        found: true,
        overflowX: cStyle.overflowX,
        verticalClipped: container.scrollHeight > container.clientHeight + 2,
        items
      };
    }, { cSel: containerSel, bSel: btnSel });

    assert.equal(metrics.found, true, `[${label} @ ${vp.name}] Container missing`);
    assert.equal(metrics.verticalClipped, false, `[${label} @ ${vp.name}] Tab container vertically clipped`);
    for (const item of metrics.items) {
      assert.ok(item.height >= 44, `[${label} @ ${vp.name}] Tab "${item.text}" height ${item.height}px < 44px`);
      assert.equal(item.clipped, false, `[${label} @ ${vp.name}] Tab "${item.text}" label clipped`);
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function verifyToolbarNoOverflowOrCollision(page, routeName) {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(30);
    const check = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - window.innerWidth;
      const toolbar = document.querySelector('.table-toolbar');
      const collisions = [];
      if (toolbar) {
        const controls = Array.from(
          toolbar.querySelectorAll('.filter-tabs-wrap, .adm-bulk-toolbar-group:not(.adm-bulk-hidden), .search-box, .eu-dd, a.adm-btn, button.adm-btn:not(.adm-bulk-hidden)')
        ).filter((el) => {
          if (el.offsetParent === null) return false;
          if (el.closest('.adm-bulk-toolbar-group') && !el.classList.contains('adm-bulk-toolbar-group')) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });

        for (let i = 0; i < controls.length; i++) {
          for (let j = i + 1; j < controls.length; j++) {
            const a = controls[i].getBoundingClientRect();
            const b = controls[j].getBoundingClientRect();
            const overlapX = a.left < b.right - 1 && b.left < a.right - 1;
            const overlapY = a.top < b.bottom - 1 && b.top < a.bottom - 1;
            if (overlapX && overlapY) {
              collisions.push(`${controls[i].className} <-> ${controls[j].className}`);
            }
          }
        }
      }
      return { overflow, collisions };
    });

    assert.ok(
      check.overflow <= 1,
      `[${routeName} @ ${vp.name}] Horizontal overflow: ${check.overflow}px`
    );
    assert.deepEqual(
      check.collisions,
      [],
      `[${routeName} @ ${vp.name}] Toolbar bounding-box collision: ${check.collisions.join(', ')}`
    );
  }
  await page.setViewportSize({ width: 1280, height: 800 });
}

async function confirmSweetAlertAndWait(page, { expectedHtmlSubstr = null, waitToast = true } = {}) {
  const popup = page.locator('.swal2-custom-popup');
  await popup.waitFor({ state: 'visible', timeout: 5000 });
  if (expectedHtmlSubstr !== null) {
    const htmlText = await popup.locator('.swal2-custom-html').innerText();
    assert.ok(
      htmlText.includes(String(expectedHtmlSubstr)),
      `Expected SweetAlert2 text to include "${expectedHtmlSubstr}", got "${htmlText}"`
    );
  }
  const bulkResPromise = page.waitForResponse(
    (res) => res.url().includes('/bulk-delete') && res.request().method() === 'POST'
  );
  const navPromise = waitToast ? Promise.resolve() : page.waitForNavigation({ waitUntil: 'networkidle' });
  await popup.locator('.swal2-confirm').click();
  const bulkRes = await bulkResPromise;
  assert.equal(bulkRes.status(), 200, `Expected bulk-delete 200 OK, got ${bulkRes.status()}`);
  if (waitToast) {
    await page.locator('.swal2-toast-custom').waitFor({ state: 'visible', timeout: 5000 });
  } else {
    await navPromise;
  }
}

async function runQa() {
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const failedCss = [];

  try {
    await seedQaData();

    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    attachMonitors(page, consoleErrors, pageErrors, failedCss);
    await loginAsSuperadmin(page, baseUrl);

    // 1. Verify Growing Underline Tabs across all 3 tab types
    await page.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle' });
    await verifyTabsGrowingUnderline(page, '#prodFilterTabs', '.tab-btn', 'admin/products');
    await verifyMobileTabTouchTargets(page, '#prodFilterTabs', '.tab-btn', 'admin/products');

    await page.goto(`${baseUrl}/admin/posts`, { waitUntil: 'networkidle' });
    await verifyTabsGrowingUnderline(page, '.filter-tabs-wrap', '.tab-btn', 'admin/posts');

    await page.goto(`${baseUrl}/admin/about`, { waitUntil: 'networkidle' });
    await verifyTabsGrowingUnderline(page, '.about-tabs-nav', '.about-tab-btn', 'admin/about');
    await verifyMobileTabTouchTargets(page, '.about-tabs-nav', '.about-tab-btn', 'admin/about');
    await page.click('.about-tabs-nav .about-tab-btn:nth-child(2)');
    await waitTabTransitions(page, '.about-tabs-nav', '.about-tab-btn');
    await verifyTabsGrowingUnderline(page, '.about-tabs-nav', '.about-tab-btn', 'admin/about (tab 2)');

    // Reduced motion check
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedDur = await page.evaluate(() => {
      const btn = document.querySelector('.about-tabs-nav .about-tab-btn');
      return {
        btn: window.getComputedStyle(btn).transitionDuration,
        after: window.getComputedStyle(btn, '::after').transitionDuration
      };
    });
    assert.equal(reducedDur.btn, '0s', 'prefers-reduced-motion must disable tab button transition');
    assert.equal(reducedDur.after, '0s', 'prefers-reduced-motion must disable ::after transition');
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await page.goto(`${baseUrl}/admin/home-content`, { waitUntil: 'networkidle' });
    await verifyTabsGrowingUnderline(page, '.about-tabs-nav', '.about-tab-btn', 'admin/home-content');
    await page.click('.about-tabs-nav .about-tab-btn:nth-child(2)');
    await waitTabTransitions(page, '.about-tabs-nav', '.about-tab-btn');
    await verifyTabsGrowingUnderline(page, '.about-tabs-nav', '.about-tab-btn', 'admin/home-content (tab 2)');

    // Media Picker modal tabs
    await page.goto(`${baseUrl}/admin/products/create`, { waitUntil: 'networkidle' });
    await page.click('.btn-open-media-picker, [data-open-media-picker]');
    await page.waitForSelector('#universalMediaPickerModal', { state: 'visible', timeout: 5000 });
    await waitTabTransitions(page, '#universalMediaPickerModal .media-picker-tabs', '.media-picker-tab-btn');
    await verifyTabsGrowingUnderline(page, '#universalMediaPickerModal .media-picker-tabs', '.media-picker-tab-btn', 'MediaPicker');
    await page.click('#universalMediaPickerModal .media-picker-tab-btn[data-tab="upload"]');
    await waitTabTransitions(page, '#universalMediaPickerModal .media-picker-tabs', '.media-picker-tab-btn');
    await verifyTabsGrowingUnderline(page, '#universalMediaPickerModal .media-picker-tabs', '.media-picker-tab-btn', 'MediaPicker (upload)');
    await page.click('#btnCloseMediaPicker');

    // 2. Bulk Delete Module 1: /admin/products (Fetch pagination + reset + auto step-back)
    await page.goto(`${baseUrl}/admin/products`, { waitUntil: 'networkidle' });
    await page.fill('#prodSearchInput', `${QA_PREFIX}PROD`);
    await page.waitForFunction(
      (prefix) => {
        const rows = document.querySelectorAll('#productTableBody tr[data-id], #productTableBody tr input[data-bulk-id]');
        return rows.length === 10 && document.body.innerText.includes(prefix);
      },
      `${QA_PREFIX}PROD-`
    );

    const bulkBtn = page.locator('[data-bulk-delete-btn]');
    const selectAll = page.locator('[data-bulk-select-all]');
    const rowChecks = page.locator('#productTableBody [data-bulk-id]');

    assert.equal(await bulkBtn.isVisible(), false, 'Bulk delete button must be hidden when 0 selected');
    await rowChecks.first().check();
    assert.equal(await bulkBtn.isVisible(), true, 'Bulk delete button must appear when >= 1 selected');
    assert.ok((await bulkBtn.innerText()).includes('1'), 'Bulk delete counter must show 1');
    assert.equal(await selectAll.evaluate((el) => el.indeterminate), true, 'Header checkbox must be indeterminate');
    assert.equal(await selectAll.evaluate((el) => el.checked), false, 'Header checkbox must not be checked');

    await selectAll.click();
    assert.equal(await selectAll.evaluate((el) => el.checked), true, 'Header checkbox must be checked');
    assert.equal(await selectAll.evaluate((el) => el.indeterminate), false, 'Header checkbox must not be indeterminate');
    assert.ok((await bulkBtn.innerText()).includes('10'), 'Bulk delete counter must show 10');

    // Toolbar collision & overflow check while bulk button is visible!
    await verifyToolbarNoOverflowOrCollision(page, 'products-with-bulk');

    // Switch to page 2 via .pgn-num -> selection must reset
    await page.click('#productPaginationWrap a.pgn-num[data-page="2"]');
    await page.waitForFunction(() => document.querySelectorAll('#productTableBody [data-bulk-id]').length === 1);
    assert.equal(await bulkBtn.isVisible(), false, 'Selection must reset after pagination change');
    assert.equal(await selectAll.evaluate((el) => el.checked), false, 'Header checkbox must reset after pagination');

    // Delete the single item on page 2 -> must auto step-back to page 1
    await rowChecks.first().check();
    await bulkBtn.click();
    await confirmSweetAlertAndWait(page);
    await page.waitForFunction(() => document.querySelectorAll('#productTableBody [data-bulk-id]').length === 10);

    // Delete 2 items on page 1 -> 8 remaining
    await rowChecks.nth(0).check();
    await rowChecks.nth(1).check();
    await bulkBtn.click();
    await confirmSweetAlertAndWait(page);
    await page.waitForFunction(() => document.querySelectorAll('#productTableBody [data-bulk-id]').length === 8);

    // 3. Bulk Delete Module 2: /admin/product-categories (related products warning)
    await page.goto(`${baseUrl}/admin/product-categories`, { waitUntil: 'networkidle' });
    await verifyToolbarNoOverflowOrCollision(page, 'product-categories');

    const pCatChecks = page.locator(`tr:has-text("${QA_PREFIX}PCAT-") [data-bulk-id]`);
    assert.equal(await pCatChecks.count(), 2, 'Expected 2 QA product categories');
    await pCatChecks.nth(0).check();
    await pCatChecks.nth(1).check();
    await page.locator('[data-bulk-delete-btn]').click();
    await confirmSweetAlertAndWait(page, { expectedHtmlSubstr: '8', waitToast: false });
    assert.equal(await page.locator(`tr:has-text("${QA_PREFIX}PCAT-")`).count(), 0, 'QA product categories must be deleted');

    // 4. Bulk Delete Module 4 before Posts: /admin/post-categories (related posts warning = 3)
    await page.goto(`${baseUrl}/admin/post-categories`, { waitUntil: 'networkidle' });
    await verifyToolbarNoOverflowOrCollision(page, 'post-categories');

    const postCatChecks = page.locator(`tr:has-text("${QA_PREFIX}POSTCAT-") [data-bulk-id]`);
    assert.equal(await postCatChecks.count(), 2, 'Expected 2 QA post categories');
    await postCatChecks.nth(0).check();
    await postCatChecks.nth(1).check();
    await page.locator('[data-bulk-delete-btn]').click();
    await confirmSweetAlertAndWait(page, { expectedHtmlSubstr: '3', waitToast: false });
    assert.equal(await page.locator(`tr:has-text("${QA_PREFIX}POSTCAT-")`).count(), 0, 'QA post categories must be deleted');

    // 5. Bulk Delete Module 3: /admin/posts (#liveSearchInput sync)
    await page.goto(`${baseUrl}/admin/posts`, { waitUntil: 'networkidle' });
    await verifyToolbarNoOverflowOrCollision(page, 'posts');

    const qaPostChecks = page.locator(`tr:has-text("${QA_PREFIX}POST-") [data-bulk-id]`);
    assert.equal(await qaPostChecks.count(), 3, 'Expected 3 QA posts');
    await qaPostChecks.first().check();
    assert.equal(await page.locator('[data-bulk-delete-btn]').isVisible(), true, 'Posts bulk button must be visible');

    // Filter with #liveSearchInput -> selection must reset and only matching row visible
    await page.fill('#liveSearchInput', `${QA_PREFIX}POST-1`);
    await page.waitForTimeout(100);
    assert.equal(await page.locator('[data-bulk-delete-btn]').isVisible(), false, 'Live search must reset bulk selection');

    await page.locator('[data-bulk-select-all]').click();
    assert.ok((await page.locator('[data-bulk-delete-btn]').innerText()).includes('1'), 'Select-all under live search must select only visible row');

    // Clear search -> selection resets; filter QA-BULK-POST -> select all 3 -> bulk delete
    await page.fill('#liveSearchInput', `${QA_PREFIX}POST`);
    await page.waitForTimeout(100);
    assert.equal(await page.locator('[data-bulk-delete-btn]').isVisible(), false, 'Changing search must reset selection');
    await page.locator('[data-bulk-select-all]').click();
    assert.ok((await page.locator('[data-bulk-delete-btn]').innerText()).includes('3'), 'Select-all must select 3 QA posts');
    await page.locator('[data-bulk-delete-btn]').click();
    await confirmSweetAlertAndWait(page, { waitToast: false });
    assert.equal(await page.locator(`tr:has-text("${QA_PREFIX}POST-")`).count(), 0, 'QA posts must be deleted');

    assert.deepEqual(failedCss, [], `Failed CSS requests: ${failedCss.join(', ')}`);
    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join('\n')}`);
    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join('\n')}`);

    console.log('ALL PLAYWRIGHT TABS & BULK DELETE QA CHECKS PASSED!');
    await context.close();
  } finally {
    await cleanupQaData();
    await browser.close();
    server.close();
    await pool.end();
  }
}

runQa().catch((err) => {
  console.error('TABS & BULK DELETE QA FAILED:', err);
  process.exit(1);
});
