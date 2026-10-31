import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';

console.log('=== TEST SUITE T-255: Playwright Slug Display & Layout Audit ===');

async function runSlugAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const consoleErrors = [];
  const pageErrors = [];

  const adminToken = jwt.sign({
    id: 1,
    email: 'admin@euodoo.com',
    name: 'Super Administrator',
    role: 'superadmin'
  }, JWT_SECRET, { expiresIn: '1h' });

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
    // TEST 1: Daftar Produk Admin (/admin/products)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[1] Memeriksa tampilan slug di /admin/products...');
    await page.goto(`${BASE_URL}/admin/products`, { waitUntil: 'domcontentloaded' });

    const productsData = await page.evaluate(() => {
      const rows = document.querySelectorAll('.data-table tbody tr');
      const results = [];
      rows.forEach(row => {
        const titleEl = row.querySelector('.td-client-title');
        const slugEl = row.querySelector('.adm-slug-text');
        const subEl = row.querySelector('.td-client-sub');
        const legacyBullet = row.innerHTML.includes('&bull;') || row.innerHTML.includes('•');
        const editLink = row.querySelector('a.btn-action-edit');

        let computed = null;
        if (slugEl) {
          const style = window.getComputedStyle(slugEl);
          computed = {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            color: style.color,
            overflow: style.overflow,
            textOverflow: style.textOverflow,
            whiteSpace: style.whiteSpace
          };
        }

        results.push({
          title: titleEl ? titleEl.textContent.trim() : null,
          slugText: slugEl ? slugEl.textContent.trim() : null,
          slugTitleAttr: slugEl ? slugEl.getAttribute('title') : null,
          hasSubEl: Boolean(subEl),
          legacyBullet,
          computed,
          editHref: editLink ? editLink.getAttribute('href') : null
        });
      });
      return results;
    });

    assert.ok(productsData.length > 0, 'Daftar produk harus memiliki setidaknya 1 produk');
    console.log(`  ✓ Ditemukan ${productsData.length} baris produk.`);

    for (const p of productsData) {
      assert.ok(p.slugText, `Produk "${p.title}" harus memiliki slug teks`);
      assert.strictEqual(p.legacyBullet, false, `Produk "${p.title}" tidak boleh mengandung karakter bullet`);
      assert.strictEqual(p.hasSubEl, false, `Produk "${p.title}" tidak boleh lagi merender .td-client-sub lama`);
      assert.strictEqual(p.slugTitleAttr, p.slugText, `Atribut title harus sama dengan teks slug untuk tooltip`);
      assert.strictEqual(p.computed.overflow, 'hidden', `Slug harus overflow: hidden`);
      assert.strictEqual(p.computed.textOverflow, 'ellipsis', `Slug harus text-overflow: ellipsis`);
      assert.strictEqual(p.computed.whiteSpace, 'nowrap', `Slug harus white-space: nowrap`);
      assert.ok(p.computed.fontFamily.includes('monospace'), `Font slug harus monospace: ${p.computed.fontFamily}`);
    }
    console.log('  ✓ Seluruh baris produk merender 1 baris .adm-slug-text bersih tanpa bullet & tanpa teks EN.');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Daftar Artikel Berita Admin (/admin/posts)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[2] Memeriksa tampilan slug di /admin/posts...');
    await page.goto(`${BASE_URL}/admin/posts`, { waitUntil: 'domcontentloaded' });

    const postsData = await page.evaluate(() => {
      const rows = document.querySelectorAll('.data-table tbody tr');
      const results = [];
      rows.forEach(row => {
        const titleEl = row.querySelector('.td-client-title');
        const slugEl = row.querySelector('.adm-slug-text');
        const subEl = row.querySelector('.td-client-sub');
        const legacyBullet = row.innerHTML.includes('&bull;') || row.innerHTML.includes('•');
        const editLink = row.querySelector('a.btn-action-edit');

        results.push({
          title: titleEl ? titleEl.textContent.trim() : null,
          slugText: slugEl ? slugEl.textContent.trim() : null,
          slugTitleAttr: slugEl ? slugEl.getAttribute('title') : null,
          hasSubEl: Boolean(subEl),
          legacyBullet,
          editHref: editLink ? editLink.getAttribute('href') : null
        });
      });
      return results;
    });

    assert.ok(postsData.length > 0, 'Daftar berita harus memiliki setidaknya 1 artikel');
    console.log(`  ✓ Ditemukan ${postsData.length} baris artikel berita.`);

    for (const post of postsData) {
      assert.ok(post.slugText, `Artikel "${post.title}" harus memiliki slug teks`);
      assert.strictEqual(post.legacyBullet, false, `Artikel "${post.title}" tidak boleh mengandung karakter bullet`);
      assert.strictEqual(post.hasSubEl, false, `Artikel "${post.title}" tidak boleh lagi merender .td-client-sub lama`);
      assert.strictEqual(post.slugTitleAttr, post.slugText, `Atribut title harus sama dengan teks slug`);
    }
    console.log('  ✓ Seluruh baris artikel berita merender 1 baris .adm-slug-text bersih tanpa bullet & tanpa judul EN.');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Daftar Merek Admin (/admin/brands)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[3] Memeriksa tampilan slug di /admin/brands...');
    await page.goto(`${BASE_URL}/admin/brands`, { waitUntil: 'domcontentloaded' });

    const brandsData = await page.evaluate(() => {
      const rows = document.querySelectorAll('.data-table tbody tr');
      const results = [];
      rows.forEach(row => {
        const titleEl = row.querySelector('.td-client-title');
        const slugEl = row.querySelector('.adm-slug-text');
        const subEl = row.querySelector('.td-client-sub');

        results.push({
          title: titleEl ? titleEl.textContent.trim() : null,
          slugText: slugEl ? slugEl.textContent.trim() : null,
          hasSubEl: Boolean(subEl),
          rawCellHtml: row.children[1] ? row.children[1].innerHTML : ''
        });
      });
      return results;
    });

    assert.ok(brandsData.length > 0, 'Daftar merek harus memiliki setidaknya 1 merek');
    console.log(`  ✓ Ditemukan ${brandsData.length} baris merek.`);

    for (const b of brandsData) {
      assert.strictEqual(b.hasSubEl, false, `Merek "${b.title}" tidak boleh lagi merender .td-client-sub lama`);
      assert.strictEqual(b.rawCellHtml.includes('slug:'), false, `Merek "${b.title}" tidak boleh memuat awalan 'slug:'`);
      assert.strictEqual(b.rawCellHtml.includes('&bull;'), false, `Merek "${b.title}" tidak boleh memuat bullet`);
      if (b.slugText) {
        assert.ok(!b.slugText.startsWith('slug:'), `Slug merek "${b.title}" tidak boleh diawali 'slug:'`);
      }
    }
    console.log('  ✓ Seluruh baris merek terverifikasi bersih tanpa bug teks awalan "slug:".');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Daftar Kategori Produk & Kategori Berita
    // ─────────────────────────────────────────────────────────────
    console.log('\n[4] Memeriksa tampilan slug di /admin/product-categories & /admin/post-categories...');
    await page.goto(`${BASE_URL}/admin/product-categories`, { waitUntil: 'domcontentloaded' });
    const prodCatSlugs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.adm-slug-text')).map(el => el.textContent.trim());
    });
    assert.ok(prodCatSlugs.length > 0, 'Kategori produk harus memiliki elemen .adm-slug-text');
    console.log(`  ✓ Ditemukan ${prodCatSlugs.length} kategori produk dengan .adm-slug-text.`);

    await page.goto(`${BASE_URL}/admin/post-categories`, { waitUntil: 'domcontentloaded' });
    const postCatSlugs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.adm-slug-text')).map(el => el.textContent.trim());
    });
    assert.ok(postCatSlugs.length > 0, 'Kategori berita harus memiliki elemen .adm-slug-text');
    console.log(`  ✓ Ditemukan ${postCatSlugs.length} kategori berita dengan .adm-slug-text.`);

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Form Edit Produk - Box Slug Kanonik (/admin/products/:id/edit)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[5] Memeriksa box slug kanonik di form edit produk...');
    const firstProductEditHref = productsData[0].editHref;
    assert.ok(firstProductEditHref, 'Harus ada tautan edit produk');

    await page.goto(`${BASE_URL}${firstProductEditHref}`, { waitUntil: 'domcontentloaded' });

    const prodEditSlugBox = await page.evaluate(() => {
      const box = document.querySelector('.adm-slug-box');
      const prefix = box ? box.querySelector('.adm-slug-prefix') : null;
      const val = box ? box.querySelector('.adm-slug-val') : null;
      return {
        hasBox: Boolean(box),
        prefixText: prefix ? prefix.textContent.trim() : null,
        valText: val ? val.textContent.trim() : null,
        valTitle: val ? val.getAttribute('title') : null
      };
    });

    assert.strictEqual(prodEditSlugBox.hasBox, true, 'Form edit produk harus merender .adm-slug-box');
    assert.strictEqual(prodEditSlugBox.prefixText, '/products/', 'Prefix slug produk harus /products/');
    assert.strictEqual(prodEditSlugBox.valText, productsData[0].slugText, 'Nilai slug kanonik harus sesuai dengan slug produk');
    console.log(`  ✓ Box slug kanonik produk terverifikasi: ${prodEditSlugBox.prefixText}${prodEditSlugBox.valText}`);

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Form Tambah & Edit Berita - Input Slug Group
    // ─────────────────────────────────────────────────────────────
    console.log('\n[6] Memeriksa form tambah & edit berita (.adm-slug-input-group)...');
    await page.goto(`${BASE_URL}/admin/posts/create`, { waitUntil: 'domcontentloaded' });

    const createPostSlugCheck = await page.evaluate(() => {
      const group = document.querySelector('.adm-slug-input-group');
      const prefix = group ? group.querySelector('.adm-slug-prefix') : null;
      const input = group ? group.querySelector('input#slug') : null;
      return {
        hasGroup: Boolean(group),
        prefixText: prefix ? prefix.textContent.trim() : null,
        inputMaxlength: input ? input.getAttribute('maxlength') : null,
        inlineStyle: group ? group.getAttribute('style') : null
      };
    });

    assert.strictEqual(createPostSlugCheck.hasGroup, true, 'Form tambah berita harus merender .adm-slug-input-group');
    assert.strictEqual(createPostSlugCheck.prefixText, '/news/', 'Prefix slug berita harus /news/');
    assert.strictEqual(createPostSlugCheck.inputMaxlength, '191', 'Input slug harus memiliki maxlength="191"');
    assert.strictEqual(createPostSlugCheck.inlineStyle, null, 'Input grup slug tidak boleh memakai inline style');
    console.log('  ✓ Form create post terverifikasi menggunakan .adm-slug-input-group tanpa inline style.');

    const firstPostEditHref = postsData[0].editHref;
    if (firstPostEditHref) {
      await page.goto(`${BASE_URL}${firstPostEditHref}`, { waitUntil: 'domcontentloaded' });
      const editPostSlugCheck = await page.evaluate(() => {
        const group = document.querySelector('.adm-slug-input-group');
        const prefix = group ? group.querySelector('.adm-slug-prefix') : null;
        const input = group ? group.querySelector('input#slug') : null;
        return {
          hasGroup: Boolean(group),
          prefixText: prefix ? prefix.textContent.trim() : null,
          inputMaxlength: input ? input.getAttribute('maxlength') : null,
          inputValue: input ? input.value : null
        };
      });
      assert.strictEqual(editPostSlugCheck.hasGroup, true, 'Form edit berita harus merender .adm-slug-input-group');
      assert.strictEqual(editPostSlugCheck.prefixText, '/news/', 'Prefix slug berita edit harus /news/');
      assert.strictEqual(editPostSlugCheck.inputMaxlength, '191', 'Input slug edit harus memiliki maxlength="191"');
      assert.strictEqual(editPostSlugCheck.inputValue, postsData[0].slugText, 'Nilai input slug harus sesuai dengan slug artikel');
      console.log(`  ✓ Form edit post terverifikasi: /news/${editPostSlugCheck.inputValue}`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Responsivitas & Overflow Check (320px, 768px, 1440px)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[7] Memeriksa ketahanan layout pada 320px, 768px, dan 1440px...');
    const viewports = [
      { name: 'Mobile 320px', width: 320, height: 600 },
      { name: 'Tablet 768px', width: 768, height: 1024 },
      { name: 'Desktop 1440px', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/admin/products`, { waitUntil: 'domcontentloaded' });

      const overflowData = await page.evaluate(() => {
        const slugs = document.querySelectorAll('.adm-slug-text');
        let allClippedOrWithin = true;
        slugs.forEach(s => {
          const rect = s.getBoundingClientRect();
          if (rect.width <= 0) allClippedOrWithin = false;
        });
        return {
          slugCount: slugs.length,
          allValid: allClippedOrWithin
        };
      });

      assert.strictEqual(overflowData.allValid, true, `Slug harus valid dan render rapi pada ${vp.name}`);
      console.log(`  ✓ ${vp.name}: ${overflowData.slugCount} slug tampil rapi dan terpotong tanpa merusak tabel.`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 8: Console Error Check
    // ─────────────────────────────────────────────────────────────
    console.log('\n[8] Memeriksa console error browser...');
    assert.strictEqual(consoleErrors.length, 0, `Tidak boleh ada console error: ${JSON.stringify(consoleErrors)}`);
    assert.strictEqual(pageErrors.length, 0, `Tidak boleh ada page error: ${JSON.stringify(pageErrors)}`);
    console.log('  ✓ Nol console error dan nol page runtime error.');

    console.log('\n======================================================');
    console.log('🎉 SEMUA TEST PLAYWRIGHT T-255 BERHASIL LULUS 100%! 🎉');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

runSlugAudit().catch(err => {
  console.error('\n❌ TEST PLAYWRIGHT T-255 GAGAL:', err);
  process.exit(1);
});
