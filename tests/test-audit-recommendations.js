import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import pool from '../config/database.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { csrfProtection } from '../middleware/csrfMiddleware.js';

after(async () => {
  await pool.end();
});

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    jsonPayload: null,
    cookiesSet: [],
    locals: {},
    cookie(name, val, opts) {
      this.cookiesSet.push({ name, val, opts });
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.jsonPayload = obj;
      return this;
    },
    send(html) {
      this.body = String(html || '');
      return this;
    }
  };
}

describe('Audit Recommendations Verification', () => {
  it('1. Migration sequence validator rejects duplicate new prefixes while allowing legacy 011', async () => {
    const { validateMigrationSequence } = await import('../utils/migrationSequence.js');
    const diskFiles = fs.readdirSync('database/migrations').filter((f) => f.endsWith('.sql')).sort();
    assert.doesNotThrow(() => validateMigrationSequence(diskFiles));
    assert.throws(
      () => validateMigrationSequence([...diskFiles, '020_a.sql', '020_b.sql']),
      /Duplikat prefix migrasi/i
    );
    assert.throws(
      () => validateMigrationSequence(['001_init.sql', 'invalid_name.sql']),
      /Format nama migrasi/i
    );
  });

  it('2. Shared extractYouTubeId utility works and controllers do not duplicate it', async () => {
    const { extractYouTubeId } = await import('../utils/youtube.js');
    assert.equal(extractYouTubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s'), 'dQw4w9WgXcQ');
    assert.equal(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(extractYouTubeId('https://example.com/not-youtube'), null);

    const bannerSrc = fs.readFileSync('controllers/admin/bannerController.js', 'utf8');
    const mediaSrc = fs.readFileSync('controllers/admin/mediaController.js', 'utf8');
    assert.equal(bannerSrc.includes('function extractYouTubeId'), false);
    assert.equal(mediaSrc.includes('function extractYouTubeId'), false);
  });

  it('3. authMiddleware drops unused requireRole helper', async () => {
    const mod = await import('../middleware/authMiddleware.js');
    assert.equal(mod.requireRole, undefined);
    assert.equal(authMiddleware.requireRole, undefined);
  });

  it('4. Product & About controllers are split cleanly into <= 300-line modules & services', async () => {
    const prodCtrlLines = fs.readFileSync('controllers/admin/productController.js', 'utf8').trim().split('\n').length;
    const aboutCtrlLines = fs.readFileSync('controllers/admin/aboutController.js', 'utf8').trim().split('\n').length;
    assert.ok(prodCtrlLines <= 300, `productController.js lines=${prodCtrlLines} exceeds 300`);
    assert.ok(aboutCtrlLines <= 300, `aboutController.js lines=${aboutCtrlLines} exceeds 300`);

    const prodSvc = await import('../services/productService.js');
    const sizeSvc = await import('../services/productSizeTableService.js');
    const aboutSvc = await import('../services/aboutService.js');
    const prodCtrl = await import('../controllers/admin/productController.js');

    assert.equal(typeof prodSvc.buildProductCreateData, 'function');
    assert.equal(typeof sizeSvc.parseDynamicSizeTable, 'function');
    assert.equal(typeof aboutSvc.buildAboutUpdatePayload, 'function');
    assert.equal(typeof prodCtrl.parseDynamicSizeTable, 'function');
    assert.equal(typeof prodCtrl.parseSizeTable, 'function');
    assert.equal(typeof prodCtrl.getProductsWithSizeTable, 'function');
  });

  it('5. Orphaned 16-byte settings upload artifacts are pruned while active favicons remain', () => {
    const dir = path.join('public', 'uploads', 'settings');
    const files = fs.readdirSync(dir);
    const tiny = files.filter((f) => fs.statSync(path.join(dir, f)).size <= 16);
    assert.equal(tiny.length, 0, `Found leftover 16-byte artifacts: ${tiny.join(', ')}`);
    for (const active of ['favicon-16x16.png', 'favicon-32x32.png', 'favicon-180x180.png', 'favicon-192x192.png', 'favicon-512x512.png']) {
      assert.ok(files.includes(active), `Missing active favicon: ${active}`);
    }
  });

  it('6. csrfMiddleware 403 HTML replaces javascript:history.back() with safe same-origin link', () => {
    const reqCrossOrigin = {
      method: 'POST',
      originalUrl: '/contact',
      cookies: { _csrf_token: 'expected-token-123' },
      body: { _csrf: 'bad-token' },
      headers: {},
      get(h) {
        if (h.toLowerCase() === 'host') return 'euodoo.co.id';
        if (h.toLowerCase() === 'referrer' || h.toLowerCase() === 'referer') return 'https://evil.example/steal';
        return '';
      }
    };
    const res1 = createMockRes();
    csrfProtection(reqCrossOrigin, res1, () => {});
    assert.equal(res1.statusCode, 403);
    assert.equal(res1.body.toLowerCase().includes('javascript:'), false);
    assert.ok(res1.body.includes('href="/"'), 'Cross-origin referer must fall back to /');

    const reqSameOriginAdmin = {
      method: 'POST',
      originalUrl: '/admin/products',
      cookies: { _csrf_token: 'expected-token-123' },
      body: { _csrf: 'bad-token' },
      headers: {},
      get(h) {
        if (h.toLowerCase() === 'host') return 'euodoo.co.id';
        if (h.toLowerCase() === 'referrer' || h.toLowerCase() === 'referer') return 'https://euodoo.co.id/admin/products/create';
        return '';
      }
    };
    const res2 = createMockRes();
    csrfProtection(reqSameOriginAdmin, res2, () => {});
    assert.equal(res2.statusCode, 403);
    assert.ok(res2.body.includes('href="/admin/products/create"'), 'Same-origin referer path should be preserved safely');

    let passedValid = false;
    const reqValid = {
      method: 'POST',
      originalUrl: '/contact',
      cookies: { _csrf_token: 'expected-token-123' },
      body: { _csrf: 'expected-token-123' },
      headers: {},
      get: () => ''
    };
    csrfProtection(reqValid, createMockRes(), () => { passedValid = true; });
    assert.equal(passedValid, true, 'Matching CSRF token must call next()');
  });

  it('7. Extracted product/about services build normalized payloads and CSV columns cleanly', async () => {
    const prodSvc = await import('../services/productService.js');
    const sizeSvc = await import('../services/productSizeTableService.js');
    const aboutSvc = await import('../services/aboutService.js');

    const validRes = prodSvc.validateProductFields({ name_id: 'Kantong HD', cta_text_id: '<b>Pesan</b>' }, { requireNameId: true });
    assert.equal(validRes.cleanCtaId, 'Pesan');
    assert.ok(prodSvc.validateProductFields({}, { requireNameId: true }).error);

    const st = sizeSvc.parseDynamicSizeTable({
      size_table: JSON.stringify({ columns: [{ id: 'c1', label: 'Kode' }], rows: [{ c1: '<b>HD-10</b>' }] })
    });
    assert.equal(st.columns[0].id, 'col_1');
    assert.equal(st.rows[0].col_1, 'HD-10');

    const { columns, rows } = sizeSvc.buildProductCsvExport([
      { id: 1, slug: 'p1', name_id: 'P1', name_en: 'P1', status: 'published', size_table: st }
    ]);
    assert.ok(columns.some((c) => c.label === 'Kode'));
    assert.equal(rows[0]['__dyn_kode'], 'HD-10');

    const created = prodSvc.buildProductCreateData(
      { name_id: 'Kantong Baru', category_id: '5', var_size: ['30x40'], var_thickness: ['20mc'] },
      { cleanCtaId: 'Pesan', cleanCtaEn: 'Order', imageUrl: '/uploads/a.webp', sizeTable: st }
    );
    assert.equal(created.slug, 'kantong-baru');
    assert.equal(created.category_id, 5);

    const statErr = aboutSvc.parseStatCreate({ stat_value: '99%', label_id: 'Mutu' }, 8);
    assert.ok(statErr.error);
  });

  it('8. Refactored shared partials and 404/capabilities views have zero inline styles/handlers/comments', () => {
    const cleanedViews = [
      'views/partials/whatsapp-btn.ejs',
      'views/partials/cta-global.ejs',
      'views/partials/navbar.ejs',
      'views/partials/footer.ejs',
      'views/public/404.ejs',
      'views/public/capabilities.ejs'
    ];
    for (const relPath of cleanedViews) {
      const content = fs.readFileSync(relPath, 'utf8');
      assert.equal(/\sstyle\s*=/i.test(content), false, `${relPath} must not contain inline style=`);
      assert.equal(/\son\w+\s*=/i.test(content), false, `${relPath} must not contain inline event handlers`);
      assert.equal(/<!--[\s\S]*?-->/.test(content), false, `${relPath} must not contain HTML comments`);
    }
    const navbarSrc = fs.readFileSync('views/partials/navbar.ejs', 'utf8');
    const mainJsSrc = fs.readFileSync('public/js/main.js', 'utf8');
    assert.ok(navbarSrc.includes('brand-logo-header'));
    assert.ok(mainJsSrc.includes('.brand-logo-header'));
  });
});
