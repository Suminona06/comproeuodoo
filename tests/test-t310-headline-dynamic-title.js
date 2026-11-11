import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { chromium } from 'playwright';
import { pool } from '../config/database.js';
import { i18nMiddleware } from '../middleware/i18nMiddleware.js';

function createMockNewsServer() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.resolve('views'));
  app.use(express.static(path.resolve('public')));
  app.use(i18nMiddleware);

  const mockHeadlines = [
    {
      id: 101,
      title_id: 'Euodoo Rilis Inovasi Kantong Singkong',
      title_en: 'Euodoo Launches Cassava Bag Innovation',
      slug: 'euodoo-rilis-inovasi-kantong-singkong',
      excerpt_id: 'Pengembangan material biodegradable untuk retail.',
      excerpt_en: 'Biodegradable material development for retail.',
      cover_image: '/images/hero-1.webp',
      type: 'berita',
      published_at: new Date('2026-10-01')
    },
    {
      id: 102,
      title_id: 'Siaran Pers: Kemitraan Strategis Pengurangan Sampah',
      title_en: 'Press Release: Strategic Partnership on Waste Reduction',
      slug: 'siaran-pers-kemitraan-strategis',
      excerpt_id: 'Kerja sama resmi dengan rantai ritel nasional.',
      excerpt_en: 'Official partnership with national retail chains.',
      cover_image: '/images/hero-2.webp',
      type: 'pers',
      published_at: new Date('2026-10-05')
    },
    {
      id: 103,
      title_id: 'Mengapa Degradasi Alami Penting Bagi Ekosistem',
      title_en: 'Why Natural Degradation Matters to Ecosystems',
      slug: 'mengapa-degradasi-alami-penting',
      excerpt_id: 'Artikel edukasi teknis proses dekomposisi biomassa.',
      excerpt_en: 'Technical education article on biomass decomposition.',
      cover_image: '/images/hero-3.webp',
      type: 'blog',
      published_at: new Date('2026-10-10')
    }
  ];

  app.get('/news', (req, res) => {
    res.locals.currentPath = '/news';
    res.locals.siteSettings = {
      company_name: 'PT Euodoo',
      whatsapp_number: '62811223344',
      company_email: 'info@euodoo.co.id'
    };

    const isAjax = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));
    if (isAjax) {
      return res.json({
        success: true,
        posts: [],
        categories: [],
        currentPage: 1,
        totalPages: 1,
        totalPosts: 3,
        activeType: req.query.type || 'all',
        activeCategory: null,
        search: null
      });
    }

    res.render('public/news', {
      title: 'Publikasi | PT Euodoo',
      path: '/news',
      posts: mockHeadlines,
      headlinePosts: mockHeadlines,
      headlinePost: mockHeadlines[0],
      categories: [
        { id: 1, name_id: 'Korporat', name_en: 'Corporate', slug: 'korporat' }
      ],
      activeType: req.query.type || 'all',
      activeCategory: null,
      search: null,
      currentPage: 1,
      totalPages: 1,
      totalPosts: 3,
      heroBanner: null
    });
  });

  return http.createServer(app);
}

describe('Task T-310: Judul Section Headline Dinamis Mengikuti Jenis Artikel pada Slide Headline Aktif', () => {
  let server;
  let baseUrl;
  let browser;

  before(async () => {
    server = createMockNewsServer();
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

  it('1. Kunci kamus headline dwibahasa terdaftar simetris di id.json dan en.json', () => {
    const idLocales = JSON.parse(fs.readFileSync(path.resolve('locales/id.json'), 'utf-8'));
    const enLocales = JSON.parse(fs.readFileSync(path.resolve('locales/en.json'), 'utf-8'));

    const expectedKeys = [
      'headline_title_berita',
      'headline_title_pers',
      'headline_title_blog',
      'headline_aria_berita',
      'headline_aria_pers',
      'headline_aria_blog'
    ];

    for (const key of expectedKeys) {
      assert.ok(idLocales.news && idLocales.news[key], `id.json wajib memiliki news.${key}`);
      assert.ok(enLocales.news && enLocales.news[key], `en.json wajib memiliki news.${key}`);
    }

    assert.equal(idLocales.news.headline_title_berita, 'Berita');
    assert.equal(enLocales.news.headline_title_berita, 'News');
    assert.equal(idLocales.news.headline_title_pers, 'Siaran Pers');
    assert.equal(enLocales.news.headline_title_pers, 'Press Releases');
    assert.equal(idLocales.news.headline_title_blog, 'Blog');
    assert.equal(enLocales.news.headline_title_blog, 'Blog');

    assert.equal(idLocales.news.headline_aria_berita, 'Berita Utama');
    assert.equal(enLocales.news.headline_aria_berita, 'Featured News');
    assert.equal(idLocales.news.headline_aria_pers, 'Siaran Pers Utama');
    assert.equal(enLocales.news.headline_aria_pers, 'Featured Press Releases');
    assert.equal(idLocales.news.headline_aria_blog, 'Blog Utama');
    assert.equal(enLocales.news.headline_aria_blog, 'Featured Blog');
  });

  it('2. SSR merender judul dan aria-label sesuai tipe slide pertama (ID: Berita)', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news?lang=id`, { waitUntil: 'domcontentloaded' });

    const headlineData = await page.evaluate(() => {
      const titleEl = document.querySelector('.nwl-headline-sec-title');
      const secEl = document.getElementById('nwlHeadlineSec');
      const sliderEl = document.getElementById('nwlHeadlineSlider');
      return {
        titleText: titleEl ? titleEl.textContent.trim() : null,
        ariaLabel: secEl ? secEl.getAttribute('aria-label') : null,
        dataTitleBerita: sliderEl ? sliderEl.getAttribute('data-title-berita') : null,
        dataTitlePers: sliderEl ? sliderEl.getAttribute('data-title-pers') : null,
        dataTitleBlog: sliderEl ? sliderEl.getAttribute('data-title-blog') : null
      };
    });

    assert.equal(headlineData.titleText, 'Berita', 'Judul SSR awal harus Berita');
    assert.equal(headlineData.ariaLabel, 'Berita Utama', 'aria-label awal harus Berita Utama');
    assert.equal(headlineData.dataTitleBerita, 'Berita');
    assert.equal(headlineData.dataTitlePers, 'Siaran Pers');
    assert.equal(headlineData.dataTitleBlog, 'Blog');

    await page.close();
  });

  it('3. SSR bahasa Inggris merender News dan Featured News', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news?lang=en`, { waitUntil: 'domcontentloaded' });

    const headlineData = await page.evaluate(() => {
      const titleEl = document.querySelector('.nwl-headline-sec-title');
      const secEl = document.getElementById('nwlHeadlineSec');
      return {
        titleText: titleEl ? titleEl.textContent.trim() : null,
        ariaLabel: secEl ? secEl.getAttribute('aria-label') : null
      };
    });

    assert.equal(headlineData.titleText, 'News', 'Judul SSR EN awal harus News');
    assert.equal(headlineData.ariaLabel, 'Featured News', 'aria-label EN awal harus Featured News');

    await page.close();
  });

  it('4. Pergantian slide headline mengubah judul dan aria-label secara dinamis', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news?lang=id`, { waitUntil: 'domcontentloaded' });

    const nextBtn = page.locator('#nwlNextBtn');
    assert.ok(await nextBtn.isVisible(), 'Tombol Next harus terlihat');

    // Slide 1 -> Slide 2 (type: pers -> "Siaran Pers")
    await nextBtn.click();
    await page.waitForTimeout(500);

    const slide2Title = await page.$eval('.nwl-headline-sec-title', (el) => el.textContent.trim());
    const slide2Aria = await page.$eval('#nwlHeadlineSec', (el) => el.getAttribute('aria-label'));
    assert.equal(slide2Title, 'Siaran Pers', 'Slide kedua harus mengubah judul jadi Siaran Pers');
    assert.equal(slide2Aria, 'Siaran Pers Utama', 'Slide kedua harus mengubah aria-label jadi Siaran Pers Utama');

    // Slide 2 -> Slide 3 (type: blog -> "Blog")
    await nextBtn.click();
    await page.waitForTimeout(500);

    const slide3Title = await page.$eval('.nwl-headline-sec-title', (el) => el.textContent.trim());
    const slide3Aria = await page.$eval('#nwlHeadlineSec', (el) => el.getAttribute('aria-label'));
    assert.equal(slide3Title, 'Blog', 'Slide ketiga harus mengubah judul jadi Blog');
    assert.equal(slide3Aria, 'Blog Utama', 'Slide ketiga harus mengubah aria-label jadi Blog Utama');

    await page.close();
  });

  it('5. Klik tab filter direktori tidak mengubah judul atau isi slider headline', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news?lang=id`, { waitUntil: 'domcontentloaded' });

    // Pindah ke slide 2 (Siaran Pers)
    const nextBtn = page.locator('#nwlNextBtn');
    await nextBtn.click();
    await page.waitForTimeout(500);

    let titleText = await page.$eval('.nwl-headline-sec-title', (el) => el.textContent.trim());
    assert.equal(titleText, 'Siaran Pers');

    // Klik tab "Berita Perusahaan" pada direktori filter di bawahnya
    const beritaTab = page.locator('.nwl-tab-item[data-type="berita"]');
    if (await beritaTab.isVisible()) {
      await beritaTab.click();
      await page.waitForTimeout(500);

      // Judul headline HARUS TETAP "Siaran Pers" karena slide aktif adalah slide 2 (pers), BUKAN berubah jadi tab aktif
      titleText = await page.$eval('.nwl-headline-sec-title', (el) => el.textContent.trim());
      assert.equal(titleText, 'Siaran Pers', 'Filter direktori dilarang mengubah judul section headline');
    }

    await page.close();
  });
});
