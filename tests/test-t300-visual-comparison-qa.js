import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { chromium } from 'playwright';
import { pageController } from '../controllers/public/pageController.js';
import { pool } from '../config/database.js';
import { i18nMiddleware } from '../middleware/i18nMiddleware.js';

const ARTIFACT_DIR = '/home/itpc/.gemini/antigravity/brain/fad49e82-5b1f-48df-b055-08340beadb61';

function createTestServer() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.resolve('views'));
  app.use(express.static(path.resolve('public')));
  app.use(i18nMiddleware);

  app.get('/about', (req, res, next) => {
    res.locals.currentPath = '/about';
    res.locals.siteSettings = {
      company_name: 'PT Euodoo',
      whatsapp_number: '62811223344',
      company_email: 'info@euodoo.co.id'
    };
    return pageController.about(req, res, next);
  });

  return http.createServer(app);
}

describe('T-300: 1440px Desktop & Mobile Visual Comparison Screenshot QA', () => {
  let server;
  let baseUrl;
  let browser;

  before(async () => {
    server = createTestServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
  });

  it('should capture 1440px desktop and 375px mobile screenshots of #core-values with panel 3 open and verify geometry', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.goto(`${baseUrl}/about?lang=id`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.navbar, .whatsapp-float { display: none !important; }' });

    const section = page.locator('#core-values');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const desktopShotPath = path.join(ARTIFACT_DIR, 't300-desktop-1440px.png');
    await section.screenshot({ path: desktopShotPath });
    assert.ok(fs.existsSync(desktopShotPath), '1440px desktop screenshot must be saved');

    const metrics = await page.evaluate(() => {
      const panels = Array.from(document.querySelectorAll('.abt-tkt-panel'));
      const activePanel = panels[2];
      const closedPanel = panels[0];
      const activeRect = activePanel.getBoundingClientRect();
      const closedRect = closedPanel.getBoundingClientRect();
      const activeStyle = window.getComputedStyle(activePanel);
      const learnBtn = document.querySelector('#core-values .learn');
      const dots = Array.from(document.querySelectorAll('.abt-tkt-dot'));
      return {
        panelCount: panels.length,
        activeIndex: panels.findIndex((p) => p.classList.contains('is-active')),
        widthRatio: Number((activeRect.width / closedRect.width).toFixed(2)),
        activeBoxShadow: activeStyle.boxShadow,
        hasLearnBtn: Boolean(learnBtn),
        dotCount: dots.length,
        activeDotIndex: dots.findIndex((d) => d.classList.contains('is-active'))
      };
    });

    assert.equal(metrics.panelCount, 6, 'Must render 6 panels');
    assert.equal(metrics.activeIndex, 2, 'Panel 3 (index 2: C - Komunikasi) must be active');
    assert.ok(metrics.widthRatio >= 2.5 && metrics.widthRatio <= 3.2, `Active/closed width ratio (${metrics.widthRatio}) must be ~2.5x-3.0x`);
    assert.ok(metrics.activeBoxShadow && metrics.activeBoxShadow !== 'none', 'Active panel must have emerald outer glow shadow');
    assert.equal(metrics.hasLearnBtn, false, 'Must NOT render Pelajari Lebih Lanjut button');
    assert.equal(metrics.dotCount, 6, 'Must render 6 indicator dots');
    assert.equal(metrics.activeDotIndex, 2, '3rd indicator dot must be active');

    await page.setViewportSize({ width: 375, height: 900 });
    await page.waitForTimeout(300);
    const mobileShotPath = path.join(ARTIFACT_DIR, 't300-mobile-375px.png');
    await section.screenshot({ path: mobileShotPath });
    assert.ok(fs.existsSync(mobileShotPath), '375px mobile screenshot must be saved');

    await page.close();
  });
});
