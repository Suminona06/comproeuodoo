import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { APP_CONFIG } from '../config/constants.js';
import { execute, pool } from '../config/database.js';
import { getJwtSecret } from '../config/secrets.js';

const ENDPOINTS = [
  '/admin/products/bulk-delete',
  '/admin/product-categories/bulk-delete',
  '/admin/posts/bulk-delete',
  '/admin/post-categories/bulk-delete'
];

let server;
let baseUrl;
let csrfToken;
let adminSessionCookie;
let editorSessionCookie;

function signRoleCookie(role, id, email) {
  const token = jwt.sign({ id, email, role, name: `Test ${role}` }, getJwtSecret(), { expiresIn: '1h' });
  return `${APP_CONFIG.SESSION_COOKIE_NAME}=${token}`;
}

async function postBulk(endpoint, body, { cookie = adminSessionCookie, csrf = csrfToken, includeCsrfHeader = true } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
  const cookieParts = [];
  if (csrf) cookieParts.push(`_csrf_token=${csrf}`);
  if (cookie) cookieParts.push(cookie);
  if (cookieParts.length > 0) headers.Cookie = cookieParts.join('; ');
  if (includeCsrfHeader && csrf) headers['X-CSRF-Token'] = csrf;

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return { status: res.status, json };
}

describe('Admin Bulk Delete HTTP Integration Tests (T-466)', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    const loginRes = await fetch(`${baseUrl}/admin/login`);
    assert.equal(loginRes.status, 200);
    const setCookies = loginRes.headers.getSetCookie();
    const csrfPair = setCookies.find((c) => c.startsWith('_csrf_token='));
    assert.ok(csrfPair, 'Expected _csrf_token cookie from /admin/login');
    csrfToken = csrfPair.split(';')[0].replace('_csrf_token=', '');

    adminSessionCookie = signRoleCookie('admin', 9001, 'test-admin@euodoo.local');
    editorSessionCookie = signRoleCookie('editor', 9002, 'test-editor@euodoo.local');
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
  });

  it('rejects requests without valid CSRF token with 403', async () => {
    for (const endpoint of ENDPOINTS) {
      const noHeader = await postBulk(endpoint, { ids: [1] }, { includeCsrfHeader: false });
      assert.equal(noHeader.status, 403, `Expected 403 without CSRF header on ${endpoint}`);

      const wrongHeader = await postBulk(endpoint, { ids: [1] }, { csrf: csrfToken, includeCsrfHeader: false });
      assert.equal(wrongHeader.status, 403, `Expected 403 with missing CSRF on ${endpoint}`);
    }
  });

  it('rejects unauthenticated requests with 401 JSON', async () => {
    for (const endpoint of ENDPOINTS) {
      const res = await postBulk(endpoint, { ids: [1] }, { cookie: '' });
      assert.equal(res.status, 401, `Expected 401 without session on ${endpoint}`);
      assert.equal(res.json.success, false);
    }
  });

  it('enforces RBAC: editor gets 403 on products/product-categories, allowed on posts/post-categories', async () => {
    const prodRes = await postBulk('/admin/products/bulk-delete', { ids: [1] }, { cookie: editorSessionCookie });
    assert.equal(prodRes.status, 403);
    assert.equal(prodRes.json.success, false);

    const pcatRes = await postBulk('/admin/product-categories/bulk-delete', { ids: [1] }, { cookie: editorSessionCookie });
    assert.equal(pcatRes.status, 403);
    assert.equal(pcatRes.json.success, false);

    const postRes = await postBulk('/admin/posts/bulk-delete', { ids: [] }, { cookie: editorSessionCookie });
    assert.equal(postRes.status, 400);
    assert.equal(postRes.json.success, false);

    const postCatRes = await postBulk('/admin/post-categories/bulk-delete', { ids: [] }, { cookie: editorSessionCookie });
    assert.equal(postCatRes.status, 400);
    assert.equal(postCatRes.json.success, false);
  });

  it('returns 400 with { success: false, message } for invalid payloads across all 4 endpoints', async () => {
    const overLimit = Array.from({ length: 101 }, (_, i) => i + 1);
    const badPayloads = [{ ids: [] }, { ids: ['abc'] }, { ids: [0, -1] }, { ids: overLimit }];

    for (const endpoint of ENDPOINTS) {
      for (const payload of badPayloads) {
        const res = await postBulk(endpoint, payload);
        assert.equal(res.status, 400, `Expected 400 on ${endpoint} for ${JSON.stringify(payload).slice(0, 40)}`);
        assert.equal(res.json.success, false);
        assert.equal(typeof res.json.message, 'string');
        assert.ok(res.json.message.length > 0);
      }
    }
  });

  it('returns 404 when none of the requested IDs exist', async () => {
    for (const endpoint of ENDPOINTS) {
      const res = await postBulk(endpoint, { ids: [999999991] });
      assert.equal(res.status, 404, `Expected 404 on ${endpoint}`);
      assert.equal(res.json.success, false);
      assert.equal(typeof res.json.message, 'string');
    }
  });

  it('returns 200 and expected contract for temporary records across all 4 modules with cleanup', async () => {
    const stamp = Date.now();
    let pcatId = null;
    let prodId = null;
    let postCatId = null;
    let postId = null;

    try {
      const pcatRes = await execute(
        'INSERT INTO product_categories (name_id, name_en, slug, sort_order, is_active) VALUES (?, ?, ?, 999, 1)',
        [`TEST-BULK-PCAT-${stamp}`, `TEST-BULK-PCAT-${stamp}`, `test-bulk-pcat-${stamp}`]
      );
      pcatId = pcatRes.insertId;

      const prodRes = await execute(
        'INSERT INTO products (category_id, name_id, name_en, slug, status) VALUES (?, ?, ?, ?, ?)',
        [pcatId, `TEST-BULK-PROD-${stamp}`, `TEST-BULK-PROD-${stamp}`, `test-bulk-prod-${stamp}`, 'draft']
      );
      prodId = prodRes.insertId;

      const postCatRes = await execute(
        'INSERT INTO post_categories (name_id, name_en, slug, type, sort_order) VALUES (?, ?, ?, ?, 999)',
        [`TEST-BULK-POSTCAT-${stamp}`, `TEST-BULK-POSTCAT-${stamp}`, `test-bulk-postcat-${stamp}`, 'berita']
      );
      postCatId = postCatRes.insertId;

      const postRes = await execute(
        'INSERT INTO posts (category_id, title_id, title_en, slug, type, status) VALUES (?, ?, ?, ?, ?, ?)',
        [postCatId, `TEST-BULK-POST-${stamp}`, `TEST-BULK-POST-${stamp}`, `test-bulk-post-${stamp}`, 'berita', 'draft']
      );
      postId = postRes.insertId;

      const delProd = await postBulk('/admin/products/bulk-delete', { ids: [prodId] });
      assert.equal(delProd.status, 200);
      assert.equal(delProd.json.success, true);
      assert.equal(delProd.json.deletedCount, 1);
      assert.equal(delProd.json.requestedCount, 1);
      assert.deepEqual(delProd.json.skippedIds, []);
      assert.equal(typeof delProd.json.message, 'string');
      prodId = null;

      const delPcat = await postBulk('/admin/product-categories/bulk-delete', { ids: [pcatId, 999999992] });
      assert.equal(delPcat.status, 200);
      assert.equal(delPcat.json.success, true);
      assert.equal(delPcat.json.deletedCount, 1);
      assert.equal(delPcat.json.requestedCount, 2);
      assert.deepEqual(delPcat.json.skippedIds, [999999992]);
      assert.equal(delPcat.json.affectedItemsCount, 0);
      assert.equal(typeof delPcat.json.message, 'string');
      pcatId = null;

      const delPost = await postBulk('/admin/posts/bulk-delete', { ids: [postId] }, { cookie: editorSessionCookie });
      assert.equal(delPost.status, 200);
      assert.equal(delPost.json.success, true);
      assert.equal(delPost.json.deletedCount, 1);
      assert.equal(delPost.json.requestedCount, 1);
      assert.deepEqual(delPost.json.skippedIds, []);
      assert.equal(typeof delPost.json.message, 'string');
      postId = null;

      const delPostCat = await postBulk('/admin/post-categories/bulk-delete', { ids: [postCatId] }, { cookie: editorSessionCookie });
      assert.equal(delPostCat.status, 200);
      assert.equal(delPostCat.json.success, true);
      assert.equal(delPostCat.json.deletedCount, 1);
      assert.equal(delPostCat.json.requestedCount, 1);
      assert.deepEqual(delPostCat.json.skippedIds, []);
      assert.equal(delPostCat.json.affectedItemsCount, 0);
      assert.equal(typeof delPostCat.json.message, 'string');
      postCatId = null;
    } finally {
      if (prodId) await execute('DELETE FROM products WHERE id = ?', [prodId]);
      if (pcatId) await execute('DELETE FROM product_categories WHERE id = ?', [pcatId]);
      if (postId) await execute('DELETE FROM posts WHERE id = ?', [postId]);
      if (postCatId) await execute('DELETE FROM post_categories WHERE id = ?', [postCatId]);
    }
  });
});
