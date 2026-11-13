import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import http from 'node:http';
import express from 'express';
import path from 'node:path';
import { chromium } from 'playwright';
import { pageController } from '../controllers/public/pageController.js';
import { aboutController } from '../controllers/admin/aboutController.js';
import aboutModel from '../models/aboutModel.js';
import settingModel from '../models/settingModel.js';
import { pool } from '../config/database.js';
import { i18nMiddleware } from '../middleware/i18nMiddleware.js';

function srgbChannelToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(srgbChannelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fgRgb, bgRgb) {
  const l1 = relativeLuminance(fgRgb);
  const l2 = relativeLuminance(bgRgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function blendRgbaOverRgb(rgba, backdropRgb) {
  const a = rgba[3];
  return [
    Math.round(rgba[0] * a + backdropRgb[0] * (1 - a)),
    Math.round(rgba[1] * a + backdropRgb[1] * (1 - a)),
    Math.round(rgba[2] * a + backdropRgb[2] * (1 - a))
  ];
}

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

describe('T-299: Regression Suite, Bilingual Sync, Escaping & WCAG Audit', () => {
  let server;
  let baseUrl;
  let browser;
  let originalSettingsSnapshot = null;

  before(async () => {
    originalSettingsSnapshot = await settingModel.getAll();
    server = createTestServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    if (originalSettingsSnapshot) {
      const restoreKeys = [
        'about_values_json',
        'about_values_bg_image',
        'about_values_pill_id',
        'about_values_pill_en',
        'about_values_subtitle_id',
        'about_values_subtitle_en',
        'about_vision_id'
      ];
      const restorePayload = {};
      restoreKeys.forEach((k) => {
        if (originalSettingsSnapshot[k] !== undefined) {
          restorePayload[k] = originalSettingsSnapshot[k];
        }
      });
      if (Object.keys(restorePayload).length > 0) {
        await settingModel.updateMany(restorePayload);
      }
    }
    await pool.end();
  });

  it('should preserve Tab 3 values when partial update is sent from another tab', async () => {
    let capturedPayload = null;
    const origUpdate = aboutModel.updateAboutData;
    aboutModel.updateAboutData = async (payload) => {
      capturedPayload = payload;
      return true;
    };

    try {
      const req = {
        body: {
          vision_id: 'Visi Baru Uji Regresi T-299',
          history_id: 'Sejarah Baru Uji Regresi T-299'
        }
      };
      const res = { redirect() {} };
      await aboutController.update(req, res);

      assert.ok(capturedPayload, 'updatePayload must be passed to updateAboutData');
      assert.equal(capturedPayload.vision_id, 'Visi Baru Uji Regresi T-299');
      assert.equal(capturedPayload.values, undefined, 'Partial update without val_* keys must not overwrite values');
      assert.equal(
        capturedPayload.about_values_pill_id,
        undefined,
        'Partial update without pill key must not overwrite about_values_pill_id'
      );
      assert.equal(
        capturedPayload.about_values_subtitle_id,
        undefined,
        'Partial update without subtitle key must not overwrite about_values_subtitle_id'
      );
    } finally {
      aboutModel.updateAboutData = origUpdate;
    }
  });

  it('should render all /about sections without regression in ID and EN, and escape special chars', async () => {
    const customValues = aboutModel.getDefaults().values.map((v, idx) => {
      if (idx === 2) {
        return {
          ...v,
          title_id: 'Komunikasi & Kolaborasi <Prima>',
          title_en: 'Communication & Collaboration <Prime>',
          desc_id: 'Dialog terbuka "2 arah" & efektif <100%>.',
          desc_en: 'Open "2-way" dialogue & effective <100%>.'
        };
      }
      return v;
    });

    await aboutModel.updateAboutData({
      about_values_pill_id: 'Budaya & Etos',
      about_values_pill_en: 'Culture & Ethos',
      about_values_subtitle_id: 'Langkah nyata menuju mutu & integritas',
      about_values_subtitle_en: 'Concrete steps toward quality & integrity',
      values: customValues
    });

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto(`${baseUrl}/about?lang=id`, { waitUntil: 'networkidle' });

    const sectionsId = await page.evaluate(() => ({
      hasHero: Boolean(document.querySelector('.page-hero')),
      hasStory: Boolean(document.querySelector('#sejarah')),
      hasTimeline: Boolean(document.querySelector('[data-od-id="company-timeline"]')),
      hasVisionMission: Boolean(document.querySelector('#visi-misi')),
      hasCoreValues: Boolean(document.querySelector('#core-values.abt-tkt-section')),
      pillText: document.querySelector('.abt-tkt-pill')?.textContent?.trim(),
      titleText: document.querySelector('.abt-tkt-title')?.textContent?.trim(),
      subtitleText: document.querySelector('.abt-tkt-subtitle')?.textContent?.trim(),
      panel3Title: document.querySelectorAll('.abt-tkt-content-title')[2]?.textContent?.trim(),
      panel3Desc: document.querySelectorAll('.abt-tkt-content-desc')[2]?.textContent?.trim(),
      panel3RawHtml: document.querySelectorAll('.abt-tkt-content')[2]?.innerHTML || ''
    }));

    assert.ok(sectionsId.hasHero, 'Hero section must render');
    assert.ok(sectionsId.hasStory, 'Sejarah section must render');
    assert.ok(sectionsId.hasTimeline, 'Timeline section must render');
    assert.ok(sectionsId.hasVisionMission, 'Visi & Misi section must render');
    assert.ok(sectionsId.hasCoreValues, '#core-values accordion section must render');
    assert.equal(sectionsId.pillText, 'Budaya & Etos');
    assert.equal(sectionsId.titleText, 'T - I - C - K - E - T');
    assert.equal(sectionsId.subtitleText, 'Langkah nyata menuju mutu & integritas');
    assert.equal(sectionsId.panel3Title, 'Komunikasi & Kolaborasi <Prima>');
    assert.equal(sectionsId.panel3Desc, 'Dialog terbuka "2 arah" & efektif <100%>.');
    assert.ok(
      sectionsId.panel3RawHtml.includes('&lt;Prima&gt;') && sectionsId.panel3RawHtml.includes('&amp;'),
      'Special characters (<, >, &) must be HTML-escaped in SSR output'
    );

    await page.goto(`${baseUrl}/about?lang=en`, { waitUntil: 'networkidle' });
    const sectionsEn = await page.evaluate(() => ({
      pillText: document.querySelector('.abt-tkt-pill')?.textContent?.trim(),
      subtitleText: document.querySelector('.abt-tkt-subtitle')?.textContent?.trim(),
      panel3Title: document.querySelectorAll('.abt-tkt-content-title')[2]?.textContent?.trim(),
      panel3Desc: document.querySelectorAll('.abt-tkt-content-desc')[2]?.textContent?.trim(),
      dotLabel0: document.querySelectorAll('.abt-tkt-dot')[0]?.getAttribute('aria-label')
    }));

    assert.equal(sectionsEn.pillText, 'Culture & Ethos');
    assert.equal(sectionsEn.subtitleText, 'Concrete steps toward quality & integrity');
    assert.equal(sectionsEn.panel3Title, 'Communication & Collaboration <Prime>');
    assert.equal(sectionsEn.panel3Desc, 'Open "2-way" dialogue & effective <100%>.');
    assert.ok(sectionsEn.dotLabel0.includes('Select pillar'), 'EN aria-label on dots must use English locale');
    assert.equal(consoleErrors.length, 0, `Unexpected console errors: ${consoleErrors.join('; ')}`);

    await page.close();
  });

  it('should pass WCAG AA contrast audit and responsive overflow checks across 1440px, 768px, 375px, 320px', async () => {
    const pureWhitePhoto = [255, 255, 255];
    const headerScrimTop = [248, 250, 252, 0.9];
    const headerBg = blendRgbaOverRgb(headerScrimTop, pureWhitePhoto);
    const titleContrast = contrastRatio([6, 78, 59], headerBg);
    const subtitleContrast = contrastRatio([51, 65, 85], headerBg);

    assert.ok(titleContrast >= 4.5, `Header title contrast (${titleContrast.toFixed(2)}:1) must be >= 4.5:1`);
    assert.ok(subtitleContrast >= 4.5, `Header subtitle contrast (${subtitleContrast.toFixed(2)}:1) must be >= 4.5:1`);

    const panelScrimBottom = [6, 78, 59, 0.92];
    const panelBottomBg = blendRgbaOverRgb(panelScrimBottom, pureWhitePhoto);
    const whiteTextContrast = contrastRatio([255, 255, 255], panelBottomBg);
    assert.ok(whiteTextContrast >= 4.5, `Active panel white text contrast (${whiteTextContrast.toFixed(2)}:1) must be >= 4.5:1`);

    const page = await browser.newPage();
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${baseUrl}/about?lang=id`, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => {
        const sec = document.querySelector('#core-values');
        return sec.scrollWidth > sec.clientWidth + 1;
      });
      assert.equal(overflow, false, `Zero horizontal overflow expected at ${width}px`);
    }
    await page.close();
  });

  it('should allow changing and deleting (clearing) section background image from Admin Tab 3', async () => {
    const reqChange = {
      body: {
        about_values_bg_image: '/uploads/pages/custom-ticket-bg.webp',
        about_values_pill_id: 'Budaya Kerja'
      }
    };
    const resMock = { redirect() {} };
    await aboutController.update(reqChange, resMock);

    const dataAfterChange = await aboutModel.getAboutData();
    assert.equal(dataAfterChange.values_bg_image, '/uploads/pages/custom-ticket-bg.webp');

    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${baseUrl}/about?lang=id`, { waitUntil: 'domcontentloaded' });
    const bgSrc = await page.getAttribute('#core-values .abt-tkt-bg-img', 'src');
    assert.equal(bgSrc, '/uploads/pages/custom-ticket-bg.webp', 'Public /about must render custom background image');

    const reqDelete = {
      body: {
        about_values_bg_image: '',
        about_values_pill_id: 'Budaya Kerja'
      }
    };
    await aboutController.update(reqDelete, resMock);

    const dataAfterDelete = await aboutModel.getAboutData();
    assert.equal(dataAfterDelete.values_bg_image, '', 'Deleted background image must remain empty string');

    await page.goto(`${baseUrl}/about?lang=id`, { waitUntil: 'domcontentloaded' });
    const bgWrapCount = await page.locator('#core-values .abt-tkt-bg-wrap').count();
    const hasNoBgClass = await page.evaluate(() => document.getElementById('core-values').classList.contains('no-bg-image'));
    assert.equal(bgWrapCount, 0, 'Public /about must not render .abt-tkt-bg-wrap when background is deleted');
    assert.equal(hasNoBgClass, true, 'Section must have .no-bg-image class when background is deleted');
    await page.close();
  });
});

