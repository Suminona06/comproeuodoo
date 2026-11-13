import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { chromium } from 'playwright';
import { pool } from '../config/database.js';
import { i18nMiddleware } from '../middleware/i18nMiddleware.js';

function createMockPaginationServer() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.resolve('views'));
  app.use(express.static(path.resolve('public')));
  app.use(i18nMiddleware);

  const totalMockPosts = 25; // Dengan limit 9, menghasilkan 3 halaman (9, 9, 7)
  const allPosts = Array.from({ length: totalMockPosts }, (_, i) => ({
    id: i + 1,
    title_id: `Artikel Edukasi Lingkungan #${i + 1}`,
    title_en: `Eco Education Article #${i + 1}`,
    slug: `artikel-edukasi-${i + 1}`,
    excerpt_id: 'Ringkasan artikel edukasi plastik mudah terurai.',
    excerpt_en: 'Summary of biodegradable plastic article.',
    cover_image: '/images/hero-1.webp',
    type: 'berita',
    published_at: new Date('2026-10-01')
  }));

  app.get('/news', (req, res) => {
    res.locals.currentPath = '/news';
    res.locals.siteSettings = {
      company_name: 'PT Euodoo',
      whatsapp_number: '62811223344',
      company_email: 'info@euodoo.co.id'
    };

    const limit = 9;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * limit;

    let filtered = allPosts;
    const search = req.query.search ? String(req.query.search).trim() : null;
    if (search) {
      filtered = filtered.filter(p => p.title_id.toLowerCase().includes(search.toLowerCase()));
    }
    const type = req.query.type || 'all';
    if (type !== 'all') {
      filtered = filtered.filter(p => p.type === type);
    }

    const totalPosts = filtered.length;
    const totalPages = Math.ceil(totalPosts / limit) || 1;
    const paginatedPosts = filtered.slice(offset, offset + limit);

    const isAjax = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));
    if (isAjax) {
      return res.json({
        success: true,
        posts: paginatedPosts,
        categories: [],
        currentPage: page,
        totalPages,
        totalPosts,
        activeType: type,
        activeCategory: null,
        search
      });
    }

    res.render('public/news', {
      title: 'Publikasi | PT Euodoo',
      path: '/news',
      posts: paginatedPosts,
      headlinePosts: [],
      headlinePost: null,
      categories: [],
      activeType: type,
      activeCategory: null,
      search,
      currentPage: page,
      totalPages,
      totalPosts,
      heroBanner: null
    });
  });

  return http.createServer(app);
}

describe('Task T-312: Unifikasi Komponen Paginasi Bersama (.pgn-*), Tampilan Mobile & Verifikasi End-to-End', () => {
  let server;
  let baseUrl;
  let browser;

  before(async () => {
    server = createMockPaginationServer();
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

  it('1. Pembersihan class lama: .pagination-bar & .pagination-item tidak ada di public/css/components.css', () => {
    const cssContent = fs.readFileSync(path.resolve('public/css/components.css'), 'utf-8');
    assert.doesNotMatch(cssContent, /\.pagination-bar\s*\{/i, 'Class .pagination-bar wajib dihapus dari components.css');
    assert.doesNotMatch(cssContent, /\.pagination-item\s*\{/i, 'Class .pagination-item wajib dihapus dari components.css');

    // Pastikan styling .pgn-bar--public terdefinisi di components.css
    assert.match(cssContent, /\.pgn-bar/i, 'Styling .pgn-bar wajib terdefinisi di components.css');
    assert.match(cssContent, /\.pgn-bar--public/i, 'Styling .pgn-bar--public wajib terdefinisi di components.css');
  });

  it('2. views/partials/pagination.ejs mendukung variant: "public", menyembunyikan .pgn-left, dan tanpa card putih (menyatu latar)', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

    const pgnState = await page.evaluate(() => {
      const pgnBar = document.querySelector('.pgn-bar--public');
      const pgnLeft = pgnBar ? pgnBar.querySelector('.pgn-left') : null;
      const pgnNav = pgnBar ? pgnBar.querySelector('.pgn-nav') : null;
      const cs = pgnBar ? window.getComputedStyle(pgnBar) : null;

      return {
        hasPublicBar: !!pgnBar,
        hasLeftControls: !!pgnLeft,
        hasNav: !!pgnNav,
        bgTransparent: cs ? (cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent') : false,
        noBorder: cs ? (cs.borderStyle === 'none' || cs.borderWidth === '0px') : false,
        noShadow: cs ? (cs.boxShadow === 'none') : false
      };
    });

    assert.equal(pgnState.hasPublicBar, true, 'Paginasi publik wajib memakai .pgn-bar--public');
    assert.equal(pgnState.hasLeftControls, false, 'Varian publik wajib menyembunyikan .pgn-left (page jump & per page)');
    assert.equal(pgnState.hasNav, true, 'Paginasi publik wajib memuat .pgn-nav');
    assert.equal(pgnState.bgTransparent, true, 'Paginasi publik wajib transparan menyatu dengan background tanpa card putih');
    assert.equal(pgnState.noBorder, true, 'Paginasi publik tidak boleh memiliki border card');
    assert.equal(pgnState.noShadow, true, 'Paginasi publik tidak boleh memiliki box-shadow card');

    await page.close();
  });

  it('3. Desktop (1440px): menampilkan kontrol navigasi, nomor halaman ber-elipsis, dan menyembunyikan .pgn-mobile-info', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news?page=2`, { waitUntil: 'domcontentloaded' });

    const desktopState = await page.evaluate(() => {
      const pgnBar = document.querySelector('.pgn-bar--public');
      const pagesContainer = pgnBar ? pgnBar.querySelector('.pgn-pages') : null;
      const mobileInfo = pgnBar ? pgnBar.querySelector('.pgn-mobile-info') : null;
      const activeNum = pagesContainer ? pagesContainer.querySelector('.pgn-num.is-active') : null;

      return {
        pagesDisplay: pagesContainer ? getComputedStyle(pagesContainer).display : null,
        mobileInfoDisplay: mobileInfo ? getComputedStyle(mobileInfo).display : null,
        activePageText: activeNum ? activeNum.textContent.trim() : null,
        hasFirstBtn: !!pgnBar.querySelector('.pgn-btn--first'),
        hasPrevBtn: !!pgnBar.querySelector('.pgn-btn--prev'),
        hasNextBtn: !!pgnBar.querySelector('.pgn-btn--next'),
        hasLastBtn: !!pgnBar.querySelector('.pgn-btn--last')
      };
    });

    assert.notEqual(desktopState.pagesDisplay, 'none', '.pgn-pages harus terlihat di desktop');
    assert.equal(desktopState.mobileInfoDisplay, 'none', '.pgn-mobile-info harus disembunyikan di desktop');
    assert.equal(desktopState.activePageText, '2', 'Halaman 2 harus aktif');
    assert.equal(desktopState.hasFirstBtn, true);
    assert.equal(desktopState.hasPrevBtn, true);
    assert.equal(desktopState.hasNextBtn, true);
    assert.equal(desktopState.hasLastBtn, true);

    await page.close();
  });

  it('4. Mobile (375px): menyembunyikan nomor halaman, menampilkan 4 tombol (>= 44x44px) mengapit ringkasan "2 / 3"', async () => {
    const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await page.goto(`${baseUrl}/news?page=2`, { waitUntil: 'domcontentloaded' });

    const mobileLayout = await page.evaluate(() => {
      const pgnBar = document.querySelector('.pgn-bar--public');
      const pagesContainer = pgnBar ? pgnBar.querySelector('.pgn-pages') : null;
      const mobileInfo = pgnBar ? pgnBar.querySelector('.pgn-mobile-info') : null;
      const cs = pgnBar ? window.getComputedStyle(pgnBar) : null;

      const btnFirst = pgnBar.querySelector('.pgn-btn--first');
      const btnPrev = pgnBar.querySelector('.pgn-btn--prev');
      const btnNext = pgnBar.querySelector('.pgn-btn--next');
      const btnLast = pgnBar.querySelector('.pgn-btn--last');

      const b1 = btnFirst.getBoundingClientRect();
      const b2 = btnPrev.getBoundingClientRect();
      const mi = mobileInfo.getBoundingClientRect();
      const b3 = btnNext.getBoundingClientRect();
      const b4 = btnLast.getBoundingClientRect();

      return {
        pagesDisplay: pagesContainer ? getComputedStyle(pagesContainer).display : null,
        mobileInfoText: mobileInfo ? mobileInfo.textContent.trim() : null,
        mobileInfoVisible: mi.width > 0 && mi.height > 0,
        bgTransparent: cs ? (cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent') : false,
        noBorder: cs ? (cs.borderStyle === 'none' || cs.borderWidth === '0px') : false,
        noShadow: cs ? (cs.boxShadow === 'none') : false,
        btnFirstSize: { w: b1.width, h: b1.height },
        btnPrevSize: { w: b2.width, h: b2.height },
        btnNextSize: { w: b3.width, h: b3.height },
        btnLastSize: { w: b4.width, h: b4.height },
        // Urutan horizontal: b1 < b2 < mi < b3 < b4
        isHorizontalOrderCorrect: b1.right <= b2.left + 8 && b2.right <= mi.left + 8 && mi.right <= b3.left + 8 && b3.right <= b4.left + 8
      };
    });

    assert.equal(mobileLayout.pagesDisplay, 'none', '.pgn-pages wajib disembunyikan di mobile');
    assert.equal(mobileLayout.mobileInfoText, '2 / 3', 'Ringkasan mobile harus menampilkan "2 / 3"');
    assert.equal(mobileLayout.mobileInfoVisible, true, 'Ringkasan mobile harus terlihat');
    assert.equal(mobileLayout.bgTransparent, true, 'Paginasi mobile wajib transparan menyatu dengan background');
    assert.equal(mobileLayout.noBorder, true, 'Paginasi mobile tidak boleh memiliki border card');
    assert.equal(mobileLayout.noShadow, true, 'Paginasi mobile tidak boleh memiliki box-shadow card');

    assert.ok(mobileLayout.btnFirstSize.w >= 44 && mobileLayout.btnFirstSize.h >= 44, 'Tombol first minimal 44x44');
    assert.ok(mobileLayout.btnPrevSize.w >= 44 && mobileLayout.btnPrevSize.h >= 44, 'Tombol prev minimal 44x44');
    assert.ok(mobileLayout.btnNextSize.w >= 44 && mobileLayout.btnNextSize.h >= 44, 'Tombol next minimal 44x44');
    assert.ok(mobileLayout.btnLastSize.w >= 44 && mobileLayout.btnLastSize.h >= 44, 'Tombol last minimal 44x44');

    assert.equal(mobileLayout.isHorizontalOrderCorrect, true, 'Urutan layout horizontal tombol mengapit ringkasan harus benar');

    await page.close();
  });

  it('5. State 1 Halaman: .pgn-bar tetap tampil utuh dengan tombol berstatus disabled', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    // Cari artikel yang hanya ada 1 hasil
    await page.goto(`${baseUrl}/news?search=Artikel%20Edukasi%20Lingkungan%20%2310`, { waitUntil: 'domcontentloaded' });

    const singlePageState = await page.evaluate(() => {
      const pgnBar = document.querySelector('.pgn-bar--public');
      if (!pgnBar) return null;

      const firstBtn = pgnBar.querySelector('.pgn-btn--first');
      const prevBtn = pgnBar.querySelector('.pgn-btn--prev');
      const nextBtn = pgnBar.querySelector('.pgn-btn--next');
      const lastBtn = pgnBar.querySelector('.pgn-btn--last');

      return {
        isBarVisible: getComputedStyle(pgnBar).display !== 'none',
        firstDisabled: firstBtn.classList.contains('is-disabled') || firstBtn.getAttribute('aria-disabled') === 'true',
        prevDisabled: prevBtn.classList.contains('is-disabled') || prevBtn.getAttribute('aria-disabled') === 'true',
        nextDisabled: nextBtn.classList.contains('is-disabled') || nextBtn.getAttribute('aria-disabled') === 'true',
        lastDisabled: lastBtn.classList.contains('is-disabled') || lastBtn.getAttribute('aria-disabled') === 'true'
      };
    });

    assert.ok(singlePageState, 'Paginasi bar wajib tetap ada saat 1 halaman');
    assert.equal(singlePageState.isBarVisible, true, 'Paginasi bar wajib terlihat saat 1 halaman');
    assert.equal(singlePageState.firstDisabled, true, 'Tombol first harus disabled');
    assert.equal(singlePageState.prevDisabled, true, 'Tombol prev harus disabled');
    assert.equal(singlePageState.nextDisabled, true, 'Tombol next harus disabled');
    assert.equal(singlePageState.lastDisabled, true, 'Tombol last harus disabled');

    await page.close();
  });

  it('6. Asynchronous Fetch API: navigasi halaman via JS memperbarui URL, grid, dan state paginasi', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

    // Klik tombol page 2
    const page2Btn = page.locator('#newsPagination .pgn-num[data-page="2"]');
    await page2Btn.click();
    await page.waitForTimeout(500);

    // URL harus tersinkronisasi ?page=2
    assert.match(page.url(), /page=2/, 'URL browser wajib tersinkronisasi ?page=2');

    const updatedState = await page.evaluate(() => {
      const activeNum = document.querySelector('#newsPagination .pgn-num.is-active');
      const firstCardTitle = document.querySelector('.nwl-card-title a');
      return {
        activePage: activeNum ? activeNum.textContent.trim() : null,
        firstCardText: firstCardTitle ? firstCardTitle.textContent.trim() : null
      };
    });

    assert.equal(updatedState.activePage, '2', 'Paginasi aktif harus berubah jadi 2');
    assert.equal(updatedState.firstCardText, 'Artikel Edukasi Lingkungan #10', 'Kartu pertama di halaman 2 harus artikel #10');

    await page.close();
  });

  it('7. Breakpoint lengkap (320, 375, 480, 768, 1024, 1440) & lokalisasi dwibahasa (ID & EN)', async () => {
    const breakpoints = [320, 375, 480, 768, 1024, 1440];
    for (const bp of breakpoints) {
      const page = await browser.newPage({ viewport: { width: bp, height: 750 } });
      await page.goto(`${baseUrl}/news?page=2&lang=id`, { waitUntil: 'domcontentloaded' });

      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(hasOverflow, false, `Viewport ${bp}px tidak boleh memicu horizontal overflow`);

      const ariaLabelsId = await page.evaluate(() => {
        const nextBtn = document.querySelector('.pgn-btn--next');
        const prevBtn = document.querySelector('.pgn-btn--prev');
        return {
          next: nextBtn ? nextBtn.getAttribute('aria-label') : null,
          prev: prevBtn ? prevBtn.getAttribute('aria-label') : null
        };
      });

      assert.equal(ariaLabelsId.next, 'Halaman berikutnya', 'Label ID berikutnya harus benar');
      assert.equal(ariaLabelsId.prev, 'Halaman sebelumnya', 'Label ID sebelumnya harus benar');

      await page.close();
    }

    // Uji bahasa Inggris di desktop dan mobile
    for (const bp of [375, 1440]) {
      const page = await browser.newPage({ viewport: { width: bp, height: 750 } });
      await page.goto(`${baseUrl}/news?page=2&lang=en`, { waitUntil: 'domcontentloaded' });

      const ariaLabelsEn = await page.evaluate(() => {
        const nextBtn = document.querySelector('.pgn-btn--next');
        const prevBtn = document.querySelector('.pgn-btn--prev');
        return {
          next: nextBtn ? nextBtn.getAttribute('aria-label') : null,
          prev: prevBtn ? prevBtn.getAttribute('aria-label') : null
        };
      });

      assert.equal(ariaLabelsEn.next, 'Next page', 'Label EN berikutnya harus benar');
      assert.equal(ariaLabelsEn.prev, 'Previous page', 'Label EN sebelumnya harus benar');

      await page.close();
    }
  });
});
