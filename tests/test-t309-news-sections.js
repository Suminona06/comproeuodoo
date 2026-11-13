import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { chromium } from 'playwright';
import { postController } from '../controllers/public/postController.js';
import { pool } from '../config/database.js';
import { i18nMiddleware } from '../middleware/i18nMiddleware.js';

function createTestServer() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.resolve('views'));
  app.use(express.static(path.resolve('public')));
  app.use(i18nMiddleware);

  app.get('/news', (req, res, next) => {
    res.locals.currentPath = '/news';
    res.locals.siteSettings = {
      company_name: 'PT Euodoo',
      whatsapp_number: '62811223344',
      company_email: 'info@euodoo.co.id'
    };
    return postController.index(req, res, next);
  });

  return http.createServer(app);
}

describe('Task T-309: Pemecahan Section News, Latar Selang-Seling & Pembersihan Inline Style/Script (/news)', () => {
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

  it('1. views/public/news.ejs dan partial bebas inline style statis serta inline script', () => {
    const newsContent = fs.readFileSync(path.resolve('views/public/news.ejs'), 'utf-8');
    const headlinePartial = fs.readFileSync(path.resolve('views/partials/news/headline-section.ejs'), 'utf-8');
    const filterPartial = fs.readFileSync(path.resolve('views/partials/news/filter-bar.ejs'), 'utf-8');

    assert.doesNotMatch(newsContent, /style="max-width:\s*840px;"/i, 'style max-width 840px wajib dipindah ke CSS');
    assert.doesNotMatch(newsContent, /style="margin-top:\s*20px;"/i, 'style margin-top 20px wajib dipindah ke CSS');
    assert.doesNotMatch(newsContent, /style="background-color:\s*var\(--bg-base/i, 'section style background-color wajib dipindah ke CSS');
    assert.doesNotMatch(newsContent, /<script>[\s\S]*<\/script>/i, 'inline script wajib diekstrak ke news-filter.js');

    assert.match(newsContent, /nwl-sec-directory/, 'news.ejs wajib memuat .nwl-sec-directory');
    assert.match(headlinePartial, /nwl-sec-headline/, 'headline-section wajib memuat .nwl-sec-headline');

    const headlineLines = headlinePartial.trim().split('\n').length;
    const filterLines = filterPartial.trim().split('\n').length;
    assert.ok(headlineLines <= 100, `headline-section.ejs (${headlineLines} baris) harus <= 100 baris`);
    assert.ok(filterLines <= 100, `filter-bar.ejs (${filterLines} baris) harus <= 100 baris`);
  });

  it('2. Warna latar selang-seling terkomputasi dengan benar di desktop (1440px)', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

    const sectionColors = await page.evaluate(() => {
      const secHeadline = document.querySelector('.nwl-sec-headline');
      const secDirectory = document.querySelector('.nwl-sec-directory');

      return {
        headlineBg: secHeadline ? getComputedStyle(secHeadline).backgroundColor : null,
        directoryBg: secDirectory ? getComputedStyle(secDirectory).backgroundColor : null
      };
    });

    if (sectionColors.headlineBg) {
      assert.equal(sectionColors.headlineBg, 'rgb(243, 246, 243)', '.nwl-sec-headline wajib memakai --bg-soft-green (#f3f6f3)');
    }
    assert.equal(sectionColors.directoryBg, 'rgb(248, 250, 252)', '.nwl-sec-directory wajib memakai --bg-subtle (#f8fafc)');

    await page.close();
  });

  it('3. Pseudo-element gradasi transisi tepi terpasang setinggi 80px desktop dan 48px mobile', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

    const desktopTransitionHeight = await page.evaluate(() => {
      const secDirectory = document.querySelector('.nwl-sec-directory');
      if (!secDirectory) return null;
      return getComputedStyle(secDirectory, '::before').height;
    });

    assert.equal(desktopTransitionHeight, '80px', 'Transisi tepi desktop wajib 80px');

    await page.setViewportSize({ width: 375, height: 667 });
    const mobileTransitionHeight = await page.evaluate(() => {
      const secDirectory = document.querySelector('.nwl-sec-directory');
      if (!secDirectory) return null;
      return getComputedStyle(secDirectory, '::before').height;
    });

    assert.equal(mobileTransitionHeight, '48px', 'Transisi tepi mobile wajib 48px');

    await page.close();
  });

  it('4. Kartu berita (.nwl-card) memiliki latar putih dan border yang jelas', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

    const cardStyles = await page.evaluate(() => {
      const card = document.querySelector('.nwl-card');
      if (!card) return null;
      const computed = getComputedStyle(card);
      return {
        bg: computed.backgroundColor,
        borderWidth: computed.borderTopWidth
      };
    });

    if (cardStyles) {
      assert.equal(cardStyles.bg, 'rgb(255, 255, 255)', 'Latar kartu berita wajib putih');
      assert.equal(cardStyles.borderWidth, '1px', 'Border kartu berita wajib 1px');
    }

    await page.close();
  });

  it('5. Bebas horizontal overflow di mobile (320px & 375px)', async () => {
    for (const width of [320, 375]) {
      const page = await browser.newPage({ viewport: { width, height: 667 } });
      await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      assert.equal(hasOverflow, false, `Viewport ${width}px tidak boleh memicu horizontal overflow`);
      await page.close();
    }
  });

  it('6. Slider headline dapat diinisialisasi dan dieksekusi tanpa error', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

    const sliderExists = await page.evaluate(() => {
      return !!document.getElementById('nwlHeadlineSlider');
    });

    if (sliderExists) {
      const nextBtn = page.locator('#nwlNextBtn');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    assert.equal(consoleErrors.length, 0, `Tidak boleh ada console error: ${consoleErrors.join(', ')}`);
    await page.close();
  });
});

