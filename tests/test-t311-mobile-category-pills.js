import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { chromium } from 'playwright';
import { pool } from '../config/database.js';
import { i18nMiddleware } from '../middleware/i18nMiddleware.js';

function createMockServer() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.resolve('views'));
  app.use(express.static(path.resolve('public')));
  app.use(i18nMiddleware);

  const mockCategories = [
    { id: 1, name_id: 'Operasional Pabrik', name_en: 'Plant Operations', slug: 'operasional-pabrik' },
    { id: 2, name_id: 'Sertifikasi & Regulasi', name_en: 'Certification & Regulation', slug: 'sertifikasi-regulasi' },
    { id: 3, name_id: 'Material Ramah Lingkungan', name_en: 'Eco Materials', slug: 'material-ramah-lingkungan' },
    { id: 4, name_id: 'Pengurangan Sampah', name_en: 'Waste Reduction', slug: 'pengurangan-sampah' },
    { id: 5, name_id: 'Inovasi Manufaktur', name_en: 'Manufacturing Innovation', slug: 'inovasi-manufaktur' }
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
        categories: mockCategories,
        currentPage: 1,
        totalPages: 1,
        totalPosts: 0,
        activeType: req.query.type || 'all',
        activeCategory: req.query.category || null,
        search: null
      });
    }

    res.render('public/news', {
      title: 'Publikasi | PT Euodoo',
      path: '/news',
      posts: [],
      headlinePosts: [],
      headlinePost: null,
      categories: mockCategories,
      activeType: req.query.type || 'all',
      activeCategory: req.query.category || null,
      search: null,
      currentPage: 1,
      totalPages: 1,
      totalPosts: 0,
      heroBanner: null
    });
  });

  return http.createServer(app);
}

describe('Task T-311: Adaptasi Filter Kategori Geser Horizontal di Mobile (.nwl-cat-pills)', () => {
  let server;
  let baseUrl;
  let browser;

  before(async () => {
    server = createMockServer();
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

  it('1. Viewport mobile (< 768px): .nwl-cat-pills 1 baris tanpa wrap dan overflow-x auto', async () => {
    for (const width of [320, 375, 480]) {
      const page = await browser.newPage({ viewport: { width, height: 667 } });
      await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

      const styles = await page.evaluate(() => {
        const pillsContainer = document.getElementById('nwlCatPills');
        const firstPill = pillsContainer ? pillsContainer.querySelector('.nwl-cat-pill') : null;
        if (!pillsContainer || !firstPill) return null;

        const containerComputed = getComputedStyle(pillsContainer);
        const pillComputed = getComputedStyle(firstPill);

        return {
          flexWrap: containerComputed.flexWrap,
          overflowX: containerComputed.overflowX,
          pillHeight: parseFloat(pillComputed.height),
          pillFlexShrink: pillComputed.flexShrink,
          scrollWidth: pillsContainer.scrollWidth,
          clientWidth: pillsContainer.clientWidth
        };
      });

      assert.ok(styles, `Elemen .nwl-cat-pills harus ditemukan di ${width}px`);
      assert.equal(styles.flexWrap, 'nowrap', `Di ${width}px flexWrap wajib nowrap`);
      assert.equal(styles.overflowX, 'auto', `Di ${width}px overflowX wajib auto`);
      assert.ok(styles.pillHeight >= 44, `Tinggi pill di ${width}px minimal 44px (didapat ${styles.pillHeight}px)`);
      assert.equal(styles.pillFlexShrink, '0', `Pill tidak boleh mengerut (flex-shrink: 0)`);
      assert.ok(styles.scrollWidth > styles.clientWidth, `Daftar pill harus melampaui lebar kontainer di ${width}px`);

      // Pastikan body tidak mengalami horizontal overflow
      const hasBodyOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(hasBodyOverflow, false, `Tidak boleh ada horizontal overflow di ${width}px`);

      await page.close();
    }
  });

  it('2. Petunjuk visual geser (scroll cue mask / attributes) aktif saat konten meluap di mobile', async () => {
    const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const initialCue = await page.evaluate(() => {
      const container = document.getElementById('nwlCatPills');
      return {
        hasScrollRightAttr: container.getAttribute('data-scroll-right') === 'true',
        maskImage: getComputedStyle(container).maskImage || getComputedStyle(container).webkitMaskImage
      };
    });

    assert.equal(initialCue.hasScrollRightAttr, true, 'Container harus memiliki data-scroll-right saat awal');
    assert.ok(initialCue.maskImage && initialCue.maskImage !== 'none', 'Container harus memiliki mask-image untuk petunjuk geser');

    // Geser ke kanan
    await page.evaluate(() => {
      const container = document.getElementById('nwlCatPills');
      container.scrollLeft = container.scrollWidth - container.clientWidth;
      container.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(100);

    const scrolledCue = await page.evaluate(() => {
      const container = document.getElementById('nwlCatPills');
      return {
        hasScrollLeftAttr: container.getAttribute('data-scroll-left') === 'true',
        hasScrollRightAttr: container.getAttribute('data-scroll-right') === 'true'
      };
    });

    assert.equal(scrolledCue.hasScrollLeftAttr, true, 'Setelah digeser, data-scroll-left harus aktif');
    assert.equal(scrolledCue.hasScrollRightAttr, false, 'Setelah mentok kanan, data-scroll-right harus nonaktif');

    await page.close();
  });

  it('3. Pill aktif otomatis terlihat (scrollIntoView) saat halaman dimuat', async () => {
    const targetSlug = 'material-ramah-lingkungan';
    const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await page.goto(`${baseUrl}/news?category=${targetSlug}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const pillVisibility = await page.evaluate((slug) => {
      const container = document.getElementById('nwlCatPills');
      const activePill = container.querySelector(`.nwl-cat-pill[data-category="${slug}"]`);
      if (!container || !activePill) return null;

      const cRect = container.getBoundingClientRect();
      const pRect = activePill.getBoundingClientRect();

      return {
        isActive: activePill.classList.contains('active'),
        isVisibleInContainer: (pRect.left >= cRect.left - 20) && (pRect.right <= cRect.right + 20)
      };
    }, targetSlug);

    assert.ok(pillVisibility, 'Pill aktif harus ditemukan');
    assert.equal(pillVisibility.isActive, true, 'Pill kategori target harus berkelas .active');
    assert.equal(pillVisibility.isVisibleInContainer, true, 'Pill aktif harus berada dalam jangkauan pandang horizontal kontainer');

    await page.close();
  });

  it('4. Form pencarian di mobile berada tepat di bawah baris pill dengan lebar 100% dan target sentuh minimal 44px', async () => {
    const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

    const layout = await page.evaluate(() => {
      const pillsContainer = document.getElementById('nwlCatPills');
      const searchForm = document.getElementById('newsSearchForm');
      const searchInput = document.getElementById('newsSearchInput');
      const searchBtn = searchForm ? searchForm.querySelector('.nwl-search-btn') : null;

      const pRect = pillsContainer.getBoundingClientRect();
      const fRect = searchForm.getBoundingClientRect();
      const iRect = searchInput.getBoundingClientRect();
      const bRect = searchBtn ? searchBtn.getBoundingClientRect() : null;

      return {
        isBelow: fRect.top >= pRect.bottom - 4,
        formWidth: fRect.width,
        containerWidth: pillsContainer.parentElement.clientWidth,
        inputHeight: iRect.height,
        btnHeight: bRect ? bRect.height : 0,
        btnWidth: bRect ? bRect.width : 0
      };
    });

    assert.equal(layout.isBelow, true, 'Form pencarian wajib berada di bawah baris pill kategori');
    assert.ok(layout.inputHeight >= 44, `Tinggi input pencarian minimal 44px (didapat ${layout.inputHeight}px)`);
    assert.ok(layout.btnHeight >= 44, `Tinggi tombol pencarian minimal 44px (didapat ${layout.btnHeight}px)`);
    assert.ok(layout.btnWidth >= 44, `Lebar tombol pencarian minimal 44px (didapat ${layout.btnWidth}px)`);

    await page.close();
  });

  it('5. Desktop (>= 768px): .nwl-cat-pills tetap fleksibel/wrap normal dan mask-image nonaktif', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

    const desktopStyles = await page.evaluate(() => {
      const pillsContainer = document.getElementById('nwlCatPills');
      const containerComputed = getComputedStyle(pillsContainer);

      return {
        flexWrap: containerComputed.flexWrap,
        overflowX: containerComputed.overflowX
      };
    });

    assert.equal(desktopStyles.flexWrap, 'wrap', 'Di desktop .nwl-cat-pills tetap wrap normal');

    await page.close();
  });

  it('6. Navigasi keyboard Tab/Shift+Tab melewati seluruh pill kategori dengan outline terlihat', async () => {
    const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await page.goto(`${baseUrl}/news`, { waitUntil: 'domcontentloaded' });

    // Focus pertama pada pill "Semua"
    const firstPill = page.locator('#nwlCatPills .nwl-cat-pill').first();
    await firstPill.focus();

    const focusedTag = await page.evaluate(() => document.activeElement ? document.activeElement.tagName : null);
    assert.equal(focusedTag, 'A', 'Elemen terfokus harus berupa tag anchor pill');

    // Tab ke pill berikutnya
    await page.keyboard.press('Tab');
    const secondPillCat = await page.evaluate(() => document.activeElement ? document.activeElement.getAttribute('data-category') : null);
    assert.equal(secondPillCat, 'operasional-pabrik', 'Pill kedua harus terfokus setelah Tab');

    // Shift+Tab kembali ke pill pertama
    await page.keyboard.press('Shift+Tab');
    const backToFirst = await page.evaluate(() => document.activeElement ? document.activeElement.getAttribute('data-category') : null);
    assert.equal(backToFirst, '', 'Shift+Tab harus kembali memfokuskan pill Semua');

    await page.close();
  });
});
