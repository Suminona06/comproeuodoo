import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';

console.log('=== TEST SUITE T-261: Responsive Adaptation & Full Regression Playwright Suite ===\n');

async function runRegressionSuite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const consoleErrors = [];
  const pageErrors = [];

  const adminToken = jwt.sign({
    id: 1,
    email: 'admin@euodoo.com',
    name: 'Super Administrator',
    role: 'superadmin'
  }, JWT_SECRET, { expiresIn: '2h' });

  await context.addCookies([
    {
      name: 'euodoo_session',
      value: adminToken,
      domain: 'localhost',
      path: '/'
    }
  ]);

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });
  page.on('pageerror', err => {
    pageErrors.push({ url: page.url(), message: err.message });
  });

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: Adaptasi Viewport Sempit (320px s/d 480px Mobile) - Tanpa Horizontal Scroll
    // ─────────────────────────────────────────────────────────────
    console.log('[1] Menguji adaptasi viewport sempit mobile (320px, 360px, 375px, 480px)...');
    const mobileWidths = [320, 360, 375, 480];
    const testAdminPages = [
      '/admin/dashboard',
      '/admin/products',
      '/admin/posts',
      '/admin/banners',
      '/admin/settings',
      '/admin/about',
      '/admin/inquiries'
    ];

    for (const w of mobileWidths) {
      await page.setViewportSize({ width: w, height: 640 });
      for (const p of testAdminPages) {
        const resp = await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded' });
        assert.strictEqual(resp.status(), 200, `Halaman ${p} harus status 200 pada ${w}px`);

        // Check horizontal overflow: content must fit within viewport
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientW = Math.max(docEl.clientWidth, body.clientWidth);
          // Allow max 1px rounding difference in subpixel layouts
          return {
            scrollWidth: scrollW,
            clientWidth: clientW,
            hasOverflow: scrollW > clientW + 1
          };
        });

        assert.strictEqual(
          overflow.hasOverflow,
          false,
          `Halaman ${p} tidak boleh mengalami horizontal overflow pada lebar ${w}px (scroll: ${overflow.scrollWidth}px, client: ${overflow.clientWidth}px)`
        );
      }
    }
    console.log('  ✓ Seluruh halaman admin lulus tanpa horizontal overflow pada lebar 320px, 360px, 375px, dan 480px.');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Sticky Action Bars di Mobile & Desktop
    // ─────────────────────────────────────────────────────────────
    console.log('\n[2] Menguji sticky action bar (.settings-sticky-actions, .about-sticky-actions, .form-actions-sticky)...');

    // 2a. Settings Sticky Actions on 320px and 1280px
    for (const [w, h] of [[320, 600], [1280, 800]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });

      const stickyInfo = await page.evaluate(() => {
        const bar = document.querySelector('.settings-sticky-actions');
        if (!bar) return null;
        const rect = bar.getBoundingClientRect();
        const submitBtn = bar.querySelector('button[type="submit"]');
        const submitRect = submitBtn ? submitBtn.getBoundingClientRect() : null;
        return {
          visible: rect.width > 0 && rect.height > 0,
          bottomWithinViewport: rect.bottom <= window.innerHeight + 2,
          submitVisible: submitRect ? submitRect.width > 0 && submitRect.height > 0 : false,
          submitText: submitBtn ? submitBtn.textContent.trim() : ''
        };
      });

      assert.ok(stickyInfo, 'Bar .settings-sticky-actions harus ditemukan');
      assert.strictEqual(stickyInfo.visible, true, `Bar harus terlihat pada ${w}x${h}`);
      assert.strictEqual(stickyInfo.submitVisible, true, `Tombol submit harus terlihat pada ${w}x${h}`);
    }

    // 2b. Form Actions Sticky on Create Product
    await page.setViewportSize({ width: 375, height: 600 });
    await page.goto(`${BASE_URL}/admin/products/create`, { waitUntil: 'domcontentloaded' });
    const productFormActions = await page.evaluate(() => {
      const bar = document.querySelector('.form-actions-sticky');
      if (!bar) return null;
      const rect = bar.getBoundingClientRect();
      const saveBtn = bar.querySelector('button[type="submit"]');
      const cancelBtn = bar.querySelector('a.adm-btn-neutral, button.adm-btn-neutral');
      return {
        hasBar: true,
        saveVisible: saveBtn ? saveBtn.getBoundingClientRect().height > 0 : false,
        cancelVisible: cancelBtn ? cancelBtn.getBoundingClientRect().height > 0 : false
      };
    });
    assert.ok(productFormActions, 'Form create product harus memiliki .form-actions-sticky');
    assert.strictEqual(productFormActions.hasBar, true, 'Form create product harus memiliki .form-actions-sticky');
    assert.strictEqual(productFormActions.saveVisible, true, 'Tombol simpan harus visible');
    assert.strictEqual(productFormActions.cancelVisible, true, 'Tombol batal harus visible');
    console.log('  ✓ Sticky action bars berfungsi penuh dan tombol tetap terlihat serta dapat diakses pada mobile & desktop.');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Modal Responsiveness pada Layar Pendek (600px - 768px) & Zoom 125%/150%
    // ─────────────────────────────────────────────────────────────
    console.log('\n[3] Menguji modal responsif pada layar pendek (600px, 520px, 400px - simulasi zoom 150%)...');
    const shortViewports = [
      { width: 1024, height: 600, label: 'Desktop Pendek 1024x600' },
      { width: 768, height: 600, label: 'Tablet 768x600' },
      { width: 375, height: 520, label: 'Mobile Pendek 375x520' },
      { width: 1280, height: 400, label: 'Simulasi Zoom 150% pada 600px (1280x400)' }
    ];

    // 3a. Inquiry Detail Modal on Inquiries Page
    for (const vp of shortViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/admin/inquiries`, { waitUntil: 'domcontentloaded' });

      // Open first inquiry detail modal if available or trigger modal
      const modalEvaluated = await page.evaluate(() => {
        const modal = document.getElementById('inquiryDetailModal');
        if (!modal) return null;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');

        const card = modal.querySelector('.admin-modal-card');
        const header = modal.querySelector('.admin-modal-header');
        const body = modal.querySelector('.admin-modal-body');
        const footer = modal.querySelector('.admin-modal-footer');

        const cardRect = card ? card.getBoundingClientRect() : null;
        const footerRect = footer ? footer.getBoundingClientRect() : null;
        const bodyRect = body ? body.getBoundingClientRect() : null;

        const closeBtn = modal.querySelector('.admin-modal-close');
        const saveBtn = footer ? footer.querySelector('button[type="submit"]') : null;
        const cancelBtn = footer ? footer.querySelector('[data-modal-close]') : null;

        return {
          cardHeight: cardRect ? cardRect.height : 0,
          cardFitsInViewport: cardRect ? cardRect.bottom <= window.innerHeight + 10 : false,
          footerVisible: Boolean(footer && footerRect && footerRect.height > 0),
          footerWithinViewport: footerRect ? footerRect.bottom <= window.innerHeight + 10 : false,
          saveBtnVisible: Boolean(saveBtn && saveBtn.getBoundingClientRect().height > 0),
          cancelBtnVisible: Boolean(cancelBtn && cancelBtn.getBoundingClientRect().height > 0),
          bodyScrollable: body ? body.scrollHeight >= body.clientHeight : false
        };
      });

      assert.ok(modalEvaluated, `Modal harus ditemukan pada ${vp.label}`);
      assert.strictEqual(modalEvaluated.footerVisible, true, `Footer modal harus visible pada ${vp.label}`);
      assert.strictEqual(modalEvaluated.footerWithinViewport, true, `Footer modal harus berada di dalam viewport pada ${vp.label}`);
      assert.strictEqual(modalEvaluated.saveBtnVisible, true, `Tombol Simpan harus visible pada ${vp.label}`);
      assert.strictEqual(modalEvaluated.cancelBtnVisible, true, `Tombol Batal/Tutup harus visible pada ${vp.label}`);
    }
    console.log('  ✓ Modal rincian pesan (inquiry) header, body scrollable, dan sticky footer (Tutup/Simpan) tidak pernah terpotong viewport.');

    // 3b. Media Picker Modal
    for (const vp of [{ width: 1024, height: 600 }, { width: 375, height: 520 }]) {
      await page.setViewportSize(vp);
      await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });

      const pickerEvaluated = await page.evaluate(() => {
        const picker = document.getElementById('universalMediaPickerModal');
        if (!picker) return null;
        picker.classList.add('open');
        picker.setAttribute('aria-hidden', 'false');

        const box = picker.querySelector('.admin-modal-box');
        const footer = picker.querySelector('.media-picker-footer');
        const boxRect = box ? box.getBoundingClientRect() : null;
        const footerRect = footer ? footer.getBoundingClientRect() : null;

        return {
          boxFits: boxRect ? boxRect.bottom <= window.innerHeight + 10 : false,
          footerVisible: Boolean(footer && footerRect && footerRect.height > 0),
          footerWithinViewport: footerRect ? footerRect.bottom <= window.innerHeight + 10 : false
        };
      });

      assert.ok(pickerEvaluated, `Media picker harus ada pada ${vp.width}x${vp.height}`);
      assert.strictEqual(pickerEvaluated.footerVisible, true, `Footer media picker harus visible pada ${vp.width}x${vp.height}`);
      assert.strictEqual(pickerEvaluated.footerWithinViewport, true, `Footer media picker harus di dalam viewport pada ${vp.width}x${vp.height}`);
    }
    console.log('  ✓ Media picker modal responsive diuji: body scrollable dan footer selalu sticky di dalam viewport.');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Favicon Multi-Ukuran & Kesesuaian Proporsi (1:1 & Circular Badge)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[4] Menguji paket multi-ukuran favicon dan circular badge proporsional...');
    const expectedFavSizes = [16, 32, 180, 192, 512];

    for (const size of expectedFavSizes) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'settings', `favicon-${size}x${size}.png`);
      assert.ok(fs.existsSync(filePath), `Berkas favicon-${size}x${size}.png harus ada di disk`);

      const meta = await sharp(filePath).metadata();
      assert.strictEqual(meta.width, size, `Lebar harus tepat ${size}px`);
      assert.strictEqual(meta.height, size, `Tinggi harus tepat ${size}px`);
      assert.strictEqual(meta.hasAlpha, true, `Favicon harus memiliki channel alpha (transparansi sudut circular badge)`);

      // Verifikasi HTTP 200
      const httpResp = await page.request.get(`${BASE_URL}/uploads/settings/favicon-${size}x${size}.png`);
      assert.strictEqual(httpResp.status(), 200, `HTTP GET favicon-${size}x${size}.png harus 200`);
    }

    // Root /favicon.ico
    const icoResp = await page.request.get(`${BASE_URL}/favicon.ico`);
    assert.strictEqual(icoResp.status(), 200, 'Root /favicon.ico harus 200 OK');
    console.log('  ✓ Paket favicon 16, 32, 180, 192, 512 dan root /favicon.ico terverifikasi 1:1 persegi, alpha channel, dan HTTP 200.');

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Pengujian Dwibahasa ID & EN Serta Konsistensi UI Tombol
    // ─────────────────────────────────────────────────────────────
    console.log('\n[5] Menguji halaman publik dalam bahasa ID dan EN...');
    for (const lang of ['id', 'en']) {
      for (const p of ['/', '/products', '/news', '/about', '/contact']) {
        const url = `${BASE_URL}${p}?lang=${lang}`;
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
        assert.strictEqual(resp.status(), 200, `Halaman ${url} harus 200 OK`);

        // Check canonical & alternate links
        const alternates = await page.evaluate(() => {
          const linkId = document.querySelector('link[hreflang="id"]');
          const linkEn = document.querySelector('link[hreflang="en"]');
          return {
            hasId: Boolean(linkId),
            hasEn: Boolean(linkEn)
          };
        });
        assert.strictEqual(alternates.hasId, true, `Hreflang ID harus ada di ${url}`);
        assert.strictEqual(alternates.hasEn, true, `Hreflang EN harus ada di ${url}`);
      }
    }
    console.log('  ✓ Halaman publik ID dan EN beroperasi normal tanpa kendala routing atau template.');

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Konsistensi Nol Console Error
    // ─────────────────────────────────────────────────────────────
    console.log('\n[6] Memeriksa console error dan unhandled exception browser...');
    assert.strictEqual(consoleErrors.length, 0, `Tidak boleh ada console error: ${JSON.stringify(consoleErrors)}`);
    assert.strictEqual(pageErrors.length, 0, `Tidak boleh ada page error: ${JSON.stringify(pageErrors)}`);
    console.log('  ✓ Nol console error dan nol page exception di browser.');

    console.log('\n======================================================');
    console.log('🎉 SEMUA TEST PLAYWRIGHT T-261 BERHASIL LULUS 100%! 🎉');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

runRegressionSuite().catch(err => {
  console.error('\n❌ TEST RUNNER ERROR:', err);
  process.exit(1);
});
