import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import express from 'express';
import ejs from 'ejs';

import app from '../app.js';
import { pool } from '../config/database.js';
import { validateProductionSecrets } from '../config/secrets.js';
import sanitizer from '../utils/sanitizer.js';
import { verifyTurnstileToken } from '../utils/turnstileVerifier.js';
import { seoMiddleware } from '../middleware/seoMiddleware.js';
import { processAndSaveImage, saveSettingUpload, uploadMedia } from '../middleware/uploadMiddleware.js';

after(async () => {
  await pool.end();
});

const ROOT_DIR = process.cwd();
const DUMMY_TURNSTILE_SECRET = '1x0000000000000000000000000000000AA';
const XSS_PAYLOAD = '</script><img src=x onerror=alert(1)>';

function startTempServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

function closeServer(server) {
  server.closeAllConnections?.();
  return new Promise((resolve) => server.close(resolve));
}

function runInlineNode(code, envOverrides = {}) {
  const childEnv = { ...process.env, ...envOverrides };
  return spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: ROOT_DIR,
    env: childEnv,
    encoding: 'utf8',
    timeout: 25000
  });
}

function extractScriptBlock(relPath, scriptId) {
  const html = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8');
  const pattern = new RegExp(`<script\\s+type="application\\/json"\\s+id="${scriptId}">[\\s\\S]*?<\\/script>`);
  const match = html.match(pattern);
  assert.ok(match, `Missing #${scriptId} block in ${relPath}`);
  return match[0];
}

test('1. Rate limiters ignore spoofed x-test-bypass-rate-limit outside NODE_ENV=test', () => {
  const probeScript = `
    import http from 'node:http';
    import express from 'express';
    import { loginLimiter, leadLimiter } from './middleware/rateLimiter.js';
    const mini = express();
    mini.post('/login', loginLimiter, (_req, res) => res.status(200).json({ ok: true }));
    mini.post('/lead', leadLimiter, (_req, res) => res.status(200).json({ ok: true }));
    const srv = http.createServer(mini);
    srv.listen(0, '127.0.0.1', async () => {
      const base = 'http://127.0.0.1:' + srv.address().port;
      const h = { 'x-test-bypass-rate-limit': 'true' };
      const loginStatuses = [];
      for (let i = 0; i < 6; i += 1) {
        const r = await fetch(base + '/login', { method: 'POST', headers: h });
        loginStatuses.push(r.status);
      }
      const leadStatuses = [];
      for (let i = 0; i < 4; i += 1) {
        const r = await fetch(base + '/lead', { method: 'POST', headers: h, redirect: 'manual' });
        leadStatuses.push(r.status);
      }
      srv.closeAllConnections?.();
      srv.close();
      console.log(JSON.stringify({ loginStatuses, leadStatuses }));
      process.exit(0);
    });
  `;

  const devRun = runInlineNode(probeScript, { NODE_ENV: 'development' });
  assert.equal(devRun.status, 0, devRun.stderr);
  const devRes = JSON.parse(devRun.stdout.trim());
  assert.equal(devRes.loginStatuses[5], 429, `Expected 6th login throttled to 429, got ${devRes.loginStatuses}`);
  assert.equal(devRes.leadStatuses[3], 302, `Expected 4th lead throttled to 302, got ${devRes.leadStatuses}`);

  const testRun = runInlineNode(probeScript, { NODE_ENV: 'test' });
  assert.equal(testRun.status, 0, testRun.stderr);
  const testRes = JSON.parse(testRun.stdout.trim());
  assert.equal(testRes.loginStatuses[5], 200, 'NODE_ENV=test should remain exempt from throttling');
});

test('2. Safe JSON serializer prevents stored script breakout across admin, about, and JSON-LD', () => {
  assert.equal(typeof sanitizer.safeJsonForHtml, 'function', 'safeJsonForHtml must be exported');
  const encoded = sanitizer.safeJsonForHtml({ name: XSS_PAYLOAD, extra: 'a & b > c' });
  assert.equal(encoded.includes('<'), false);
  assert.equal(encoded.includes('>'), false);
  assert.equal(encoded.includes('&'), false);
  assert.deepEqual(JSON.parse(encoded), { name: XSS_PAYLOAD, extra: 'a & b > c' });

  const templates = [
    ['views/admin/inquiries/index.ejs', 'inquiriesDataJson'],
    ['views/admin/dashboard.ejs', 'dashboardInquiriesJson'],
    ['views/public/about.ejs', 'bentoGalleryData']
  ];
  const locals = {
    inquiries: [{ id: 1, name: XSS_PAYLOAD, message: XSS_PAYLOAD }],
    recentInquiries: [{ id: 1, company_name: XSS_PAYLOAD }],
    gallerySlides: [{ image_url: '/a.webp', category_id: XSS_PAYLOAD, title_id: XSS_PAYLOAD }],
    currentLang: 'id',
    lang: 'id',
    safeJson: sanitizer.safeJsonForHtml
  };

  for (const [relPath, scriptId] of templates) {
    const block = extractScriptBlock(relPath, scriptId);
    const rendered = ejs.render(block, locals);
    assert.equal(rendered.includes('<img'), false, `Raw HTML breakout in ${relPath}`);
    assert.equal(rendered.split('</script>').length - 1, 1, `Closing script breakout in ${relPath}`);
  }

  const req = {
    path: '/contact',
    originalUrl: '/contact',
    headers: {},
    protocol: 'http',
    get: () => '127.0.0.1:3000',
    settings: { site_name: XSS_PAYLOAD }
  };
  const res = { locals: { settings: { site_name: XSS_PAYLOAD }, currentLang: 'id' } };
  seoMiddleware(req, res, () => {});
  res.locals.seo.addSchema({ '@type': 'Organization', name: XSS_PAYLOAD });
  const ldHtml = res.locals.seo.renderJsonLd();
  assert.equal(ldHtml.includes('<img'), false, 'JSON-LD output must escape < chars');
});

async function assertRejectsWithoutArtifact(fn) {
  let resolved = null;
  let caughtErr = null;
  try {
    resolved = await fn();
  } catch (err) {
    caughtErr = err;
  }
  const savedUrl = typeof resolved === 'string' ? resolved : resolved?.url || null;
  if (savedUrl && savedUrl.startsWith('/uploads/')) {
    const abs = path.join(ROOT_DIR, 'public', savedUrl);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
  assert.ok(caughtErr, 'Expected SVG upload operation to reject');
}

test('3. Raw SVG uploads are rejected and existing /uploads/*.svg are sandboxed', async () => {
  const svgBuf = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
  await assertRejectsWithoutArtifact(() => processAndSaveImage(svgBuf, 'media', 'evil.svg', 'image/svg+xml'));
  await assertRejectsWithoutArtifact(() => processAndSaveImage(svgBuf, 'media', 'spoof.svg', 'image/png'));
  await assertRejectsWithoutArtifact(() => saveSettingUpload({ originalname: 'logo.svg', mimetype: 'image/svg+xml', buffer: svgBuf }, 'logo'));
  await assertRejectsWithoutArtifact(() => saveSettingUpload({ originalname: 'logo.svg', mimetype: 'image/png', buffer: svgBuf }, 'logo'));

  const mini = express();
  mini.post('/up', (req, res) => {
    uploadMedia.single('file')(req, res, (err) => {
      res.status(err ? 400 : 200).json({ rejected: Boolean(err) });
    });
  });
  const { server: upSrv, baseUrl: upUrl } = await startTempServer(mini);
  try {
    for (const mime of ['image/svg+xml', 'image/png']) {
      const form = new FormData();
      form.append('file', new Blob([svgBuf], { type: mime }), 'xss.svg');
      const r = await fetch(`${upUrl}/up`, { method: 'POST', body: form });
      const body = await r.json();
      assert.equal(r.status, 400, `Multer accepted .svg with MIME ${mime}`);
      assert.equal(body.rejected, true);
    }
  } finally {
    await closeServer(upSrv);
  }

  const uploadsDir = path.join(ROOT_DIR, 'public', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const tempSvgPath = path.join(uploadsDir, '__tdd_security_svg_probe.svg');
  fs.writeFileSync(tempSvgPath, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const { server: appSrv, baseUrl: appUrl } = await startTempServer(app);
  try {
    const res = await fetch(`${appUrl}/uploads/__tdd_security_svg_probe.svg`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-security-policy') || '', /sandbox/i);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.match(res.headers.get('content-disposition') || '', /attachment/i);
  } finally {
    await closeServer(appSrv);
    if (fs.existsSync(tempSvgPath)) fs.unlinkSync(tempSvgPath);
  }
});

test('4. Turnstile verifier fails closed on missing/dummy secret in production and network errors', async () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.TURNSTILE_SECRET_KEY;
  const prevFetch = globalThis.fetch;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.TURNSTILE_SECRET_KEY;
    const prodMissing = await verifyTurnstileToken('any-token', '127.0.0.1');
    assert.equal(prodMissing.success, false, 'Production missing secret must fail closed');

    process.env.TURNSTILE_SECRET_KEY = DUMMY_TURNSTILE_SECRET;
    const prodDummy = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.XXXX', '127.0.0.1');
    assert.equal(prodDummy.success, false, 'Production dummy secret must fail closed');

    process.env.NODE_ENV = 'development';
    delete process.env.TURNSTILE_SECRET_KEY;
    const devMissing = await verifyTurnstileToken('any-token', '127.0.0.1');
    assert.equal(devMissing.success, false, 'Missing secret in non-test must fail closed');

    process.env.TURNSTILE_SECRET_KEY = DUMMY_TURNSTILE_SECRET;
    globalThis.fetch = async () => { throw new Error('ECONNRESET'); };
    const devNetErr = await verifyTurnstileToken('real-looking-token', '127.0.0.1');
    assert.equal(devNetErr.success, false, 'Non-test network error must fail closed');

    process.env.NODE_ENV = 'test';
    const testDummy = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.XXXX', '127.0.0.1');
    assert.equal(testDummy.success, true, 'NODE_ENV=test dummy token must continue passing');
  } finally {
    globalThis.fetch = prevFetch;
    if (prevEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevEnv;
    if (prevSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = prevSecret;
  }
});

test('5. Hardcoded dev secret fallbacks removed and production boot rejects missing/weak secrets', () => {
  for (const rel of ['app.js', 'middleware/authMiddleware.js', 'controllers/admin/authController.js']) {
    const content = fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
    assert.equal(content.includes('euodoo_jwt_secret_dev'), false, `${rel} retains hardcoded JWT fallback`);
    assert.equal(content.includes('euodoo_cookie_secret_dev'), false, `${rel} retains hardcoded cookie fallback`);
  }

  const strongA = 'euodoo_prod_jwt_secret_9d8f7a6c5e4b3a210987654321abcdef';
  const strongB = 'euodoo_prod_cookie_secret_1a2b3c4d5e6f708192a3b4c5d6e7f8';
  const bootCode = "import './app.js';";

  const emptyJwt = runInlineNode(bootCode, { NODE_ENV: 'production', JWT_SECRET: '', COOKIE_SECRET: strongB });
  assert.notEqual(emptyJwt.status, 0, 'Production boot must fail on empty JWT_SECRET');

  const placeholderJwt = runInlineNode(bootCode, {
    NODE_ENV: 'production',
    JWT_SECRET: 'super_secret_jwt_key_change_in_production_min_32_chars',
    COOKIE_SECRET: strongB
  });
  assert.notEqual(placeholderJwt.status, 0, 'Production boot must fail on example placeholder JWT_SECRET');

  const shortCookie = runInlineNode(bootCode, { NODE_ENV: 'production', JWT_SECRET: strongA, COOKIE_SECRET: 'too_short' });
  assert.notEqual(shortCookie.status, 0, 'Production boot must fail on weak COOKIE_SECRET');

  assert.throws(() => validateProductionSecrets({ NODE_ENV: 'production' }), /JWT_SECRET/);
  assert.throws(
    () => validateProductionSecrets({ NODE_ENV: 'production', JWT_SECRET: strongA }),
    /COOKIE_SECRET/
  );

  const validProd = runInlineNode(bootCode, { NODE_ENV: 'production', JWT_SECRET: strongA, COOKIE_SECRET: strongB });
  assert.equal(validProd.status, 0, `Production boot failed with strong secrets: ${validProd.stderr}`);
});

test('6. Open redirect via Referrer header on /lang/:code is blocked', async () => {
  const { server, baseUrl } = await startTempServer(app);
  const { port } = server.address();
  try {
    const blockedRefs = ['https://evil.example/phish', '//evil.example/phish', '/\\evil.example', 'javascript:alert(1)'];
    for (const ref of blockedRefs) {
      const res = await fetch(`${baseUrl}/lang/en`, { redirect: 'manual', headers: { Referrer: ref } });
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), '/', `Ref '${ref}' must fallback to '/'`);
    }

    const sameOrigin = await fetch(`${baseUrl}/lang/en`, {
      redirect: 'manual',
      headers: { Referrer: `http://127.0.0.1:${port}/products?page=2` }
    });
    assert.equal(sameOrigin.status, 302);
    assert.equal(sameOrigin.headers.get('location'), '/products?page=2');

    const localRel = await fetch(`${baseUrl}/lang/id`, { redirect: 'manual', headers: { Referrer: '/news?type=pers' } });
    assert.equal(localRel.status, 302);
    assert.equal(localRel.headers.get('location'), '/news?type=pers');
  } finally {
    await closeServer(server);
  }
});
