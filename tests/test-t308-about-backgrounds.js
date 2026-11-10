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

describe('Task T-308: Latar Selang-Seling, Transisi Tepi Halus & Pembersihan Inline Style (/about)', () => {
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

  it('1. views/public/about.ejs bebas inline style statis & memuat class .abt-*', () => {
    const aboutContent = fs.readFileSync(path.resolve('views/public/about.ejs'), 'utf-8');
    assert.doesNotMatch(aboutContent, /style="max-width:\s*840px;"/i, 'style max-width 840px wajib dihapus');
    assert.doesNotMatch(aboutContent, /style="padding:\s*24px;\s*color:\s*var\(--text-muted\);/i, 'style tl-empty wajib dihapus');
    assert.doesNotMatch(aboutContent, /style="font-size:\s*15px;\s*color:\s*var\(--text-main/i, 'style poin misi wajib dihapus');
    assert.doesNotMatch(aboutContent, /style="display:\s*none;"/i, 'style display none pada bentoPager wajib diganti ke hidden');

    assert.match(aboutContent, /abt-hero-content/);
    assert.match(aboutContent, /abt-tl-empty/);
    assert.match(aboutContent, /abt-vm-point-text/);
    assert.match(aboutContent, /bentoPager.*hidden/);
  });

  it('2. Warna latar selang-seling terkomputasi dengan benar di desktop (1440px)', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/about`, { waitUntil: 'domcontentloaded' });

    const sectionColors = await page.evaluate(() => {
      const secStory = document.querySelector('.sec-story');
      const secVm = document.querySelector('.sec-vm');
      const secTkt = document.querySelector('.abt-tkt-section');
      const secGallery = document.querySelector('.sec-gallery');

      return {
        storyBg: secStory ? getComputedStyle(secStory).backgroundColor : null,
        vmBg: secVm ? getComputedStyle(secVm).backgroundColor : null,
        tktBg: secTkt ? getComputedStyle(secTkt).backgroundColor : null,
        galleryBg: secGallery ? getComputedStyle(secGallery).backgroundColor : null
      };
    });

    assert.equal(sectionColors.storyBg, 'rgb(243, 246, 243)', '.sec-story wajib memakai --bg-soft-green (#f3f6f3)');
    assert.equal(sectionColors.vmBg, 'rgb(248, 250, 252)', '.sec-vm wajib memakai --bg-subtle (#f8fafc)');
    assert.equal(sectionColors.tktBg, 'rgb(243, 246, 243)', '.abt-tkt-section fallback wajib memakai --bg-soft-green (#f3f6f3)');
    if (sectionColors.galleryBg) {
      assert.equal(sectionColors.galleryBg, 'rgb(248, 250, 252)', '.sec-gallery wajib memakai --bg-subtle (#f8fafc)');
    }

    await page.close();
  });

  it('3. Kartu di atas latar selang-seling memiliki batas putih & shadow jelas', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/about`, { waitUntil: 'domcontentloaded' });

    const cardStyles = await page.evaluate(() => {
      const statCard = document.querySelector('.story-stat');
      const vmCard = document.querySelector('.vm-card');

      return {
        statBg: statCard ? getComputedStyle(statCard).backgroundColor : null,
        statBorder: statCard ? getComputedStyle(statCard).borderColor : null,
        statShadow: statCard ? getComputedStyle(statCard).boxShadow : null,
        vmBg: vmCard ? getComputedStyle(vmCard).backgroundColor : null,
        vmBorder: vmCard ? getComputedStyle(vmCard).borderColor : null,
        vmShadow: vmCard ? getComputedStyle(vmCard).boxShadow : null
      };
    });

    if (cardStyles.statBg) {
      assert.equal(cardStyles.statBg, 'rgb(255, 255, 255)', '.story-stat wajib berlatar putih di atas --bg-soft-green');
      assert.notEqual(cardStyles.statShadow, 'none', '.story-stat wajib memiliki box-shadow');
    }
    assert.equal(cardStyles.vmBg, 'rgb(255, 255, 255)', '.vm-card wajib berlatar putih di atas --bg-subtle');
    assert.notEqual(cardStyles.vmShadow, 'none', '.vm-card wajib memiliki box-shadow');

    await page.close();
  });

  it('4. Gradasi transisi tepi terkomputasi 80px di desktop dan 48px di mobile', async () => {
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktopPage.goto(`${baseUrl}/about`, { waitUntil: 'domcontentloaded' });

    const desktopTransitions = await desktopPage.evaluate(() => {
      const vmBefore = getComputedStyle(document.querySelector('.sec-vm'), '::before');
      const vmAfter = getComputedStyle(document.querySelector('.sec-vm'), '::after');
      const galBefore = document.querySelector('.sec-gallery') ? getComputedStyle(document.querySelector('.sec-gallery'), '::before') : null;

      return {
        vmBeforeHeight: vmBefore.height,
        vmAfterHeight: vmAfter.height,
        galBeforeHeight: galBefore ? galBefore.height : null
      };
    });

    assert.equal(desktopTransitions.vmBeforeHeight, '80px', 'Transisi desktop .sec-vm::before wajib 80px');
    assert.equal(desktopTransitions.vmAfterHeight, '80px', 'Transisi desktop .sec-vm::after wajib 80px');
    if (desktopTransitions.galBeforeHeight) {
      assert.equal(desktopTransitions.galBeforeHeight, '80px', 'Transisi desktop .sec-gallery::before wajib 80px');
    }
    await desktopPage.close();

    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await mobilePage.goto(`${baseUrl}/about`, { waitUntil: 'domcontentloaded' });

    const mobileTransitions = await mobilePage.evaluate(() => {
      const vmBefore = getComputedStyle(document.querySelector('.sec-vm'), '::before');
      const vmAfter = getComputedStyle(document.querySelector('.sec-vm'), '::after');
      const galBefore = document.querySelector('.sec-gallery') ? getComputedStyle(document.querySelector('.sec-gallery'), '::before') : null;

      return {
        vmBeforeHeight: vmBefore.height,
        vmAfterHeight: vmAfter.height,
        galBeforeHeight: galBefore ? galBefore.height : null
      };
    });

    assert.equal(mobileTransitions.vmBeforeHeight, '48px', 'Transisi mobile .sec-vm::before wajib 48px');
    assert.equal(mobileTransitions.vmAfterHeight, '48px', 'Transisi mobile .sec-vm::after wajib 48px');
    if (mobileTransitions.galBeforeHeight) {
      assert.equal(mobileTransitions.galBeforeHeight, '48px', 'Transisi mobile .sec-gallery::before wajib 48px');
    }
    await mobilePage.close();
  });

  it('5. Responsif bebas horizontal overflow di seluruh breakpoint (320, 375, 480, 768, 1024, 1440)', async () => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 480, height: 800 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: vp });
      await page.goto(`${baseUrl}/about`, { waitUntil: 'domcontentloaded' });

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      assert.equal(hasOverflow, false, `Viewport ${vp.width}x${vp.height} tidak boleh mengalami horizontal overflow`);
      await page.close();
    }
  });

  it('6. Kunci i18n dwibahasa (ID & EN) terintegrasi pada breadcrumb dan navigasi pager', async () => {
    const pageId = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageId.goto(`${baseUrl}/about?lang=id`, { waitUntil: 'domcontentloaded' });
    const idText = await pageId.evaluate(() => {
      const breadcrumb = document.querySelector('.breadcrumbs .current');
      const pagerNext = document.querySelector('#bentoNext');
      return {
        breadcrumb: breadcrumb ? breadcrumb.textContent.trim() : null,
        nextAria: pagerNext ? pagerNext.getAttribute('aria-label') : null
      };
    });
    assert.equal(idText.breadcrumb, 'Tentang Kami');
    if (idText.nextAria) {
      assert.equal(idText.nextAria, 'Halaman galeri berikutnya');
    }
    await pageId.close();

    const pageEn = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageEn.goto(`${baseUrl}/about?lang=en`, { waitUntil: 'domcontentloaded' });
    const enText = await pageEn.evaluate(() => {
      const breadcrumb = document.querySelector('.breadcrumbs .current');
      const pagerNext = document.querySelector('#bentoNext');
      return {
        breadcrumb: breadcrumb ? breadcrumb.textContent.trim() : null,
        nextAria: pagerNext ? pagerNext.getAttribute('aria-label') : null
      };
    });
    assert.equal(enText.breadcrumb, 'About Us');
    if (enText.nextAria) {
      assert.equal(enText.nextAria, 'Next gallery page');
    }
    await pageEn.close();
  });
});

