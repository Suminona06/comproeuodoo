import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import express from 'express';

import { pool } from '../config/database.js';
import { UPLOAD_CONFIG } from '../config/constants.js';
import mailer from '../config/mailer.js';
import storage from '../config/storage.js';
import leadController from '../controllers/admin/leadController.js';
import userController from '../controllers/admin/userController.js';
import contactController from '../controllers/public/contactController.js';
import leadModel from '../models/leadModel.js';
import inquiryModel from '../models/inquiryModel.js';
import postModel from '../models/postModel.js';
import userModel from '../models/userModel.js';
import { seoMiddleware } from '../middleware/seoMiddleware.js';
import { errorHandler } from '../middleware/errorHandler.js';
import * as uploadMod from '../middleware/uploadMiddleware.js';

after(async () => {
  await pool.end();
});

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    locals: { currentLang: 'id' },
    bodyChunks: [],
    rendered: null,
    redirectedTo: null,
    jsonPayload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    write(chunk) { this.bodyChunks.push(chunk); },
    end(chunk) { if (chunk) this.bodyChunks.push(chunk); },
    send(chunk) { if (chunk) this.bodyChunks.push(chunk); return this; },
    json(obj) { this.jsonPayload = obj; return this; },
    render(view, data) { this.rendered = { view, data }; return this; },
    redirect(url) { this.redirectedTo = url; return this; }
  };
}

function parseJsonLdObject(renderedHtml) {
  const match = renderedHtml.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(match, 'Expected JSON-LD script block');
  return JSON.parse(match[1]);
}

test('1. Mailer escapes HTML/mailto payloads, strips CR/LF in subject, and validates TLS by default', async () => {
  assert.equal(mailer.transporter.options.tls?.rejectUnauthorized, true, 'TLS rejectUnauthorized must default to true');
  const origSendMail = mailer.transporter.sendMail.bind(mailer.transporter);
  let captured = null;
  mailer.transporter.sendMail = async (opts) => { captured = opts; return { messageId: 'mock-id' }; };
  try {
    await mailer.sendLeadNotification({
      name: '<img src=x onerror=alert(1)>\r\nBcc: evil@attacker.com',
      company_name: '<b>PT Evil</b>\r\nSubject: Hijacked',
      email: 'user@evil.com?bcc=spy@evil.com"><script>alert(2)</script>',
      phone: '<u>+62812</u>',
      product_name: '<i>Custom Bag</i>',
      estimated_quantity: '<svg onload=1>',
      message: '<script>steal()</script>'
    });
  } finally {
    mailer.transporter.sendMail = origSendMail;
  }
  assert.ok(captured, 'sendMail must be called');
  assert.equal(/[\r\n]/.test(captured.subject), false, 'Subject must strip CR/LF');
  for (const raw of ['<img src=x', '<b>PT Evil</b>', '<script>steal()', '<svg onload=1>', 'mailto:user@evil.com?bcc=']) {
    assert.equal(captured.html.includes(raw), false, `Unescaped fragment leaked: ${raw}`);
  }
  assert.equal(captured.html.includes('&lt;b&gt;PT Evil&lt;/b&gt;'), true);
});

test('2. leadController.exportCsv delegates to csvExporter and neutralizes formula payloads', async () => {
  const origExportAll = leadModel.exportAll;
  leadModel.exportAll = async () => [{
    id: 1, tanggal: '2026-11-14T00:00:00Z', jenis_inquiry: 'inquiry',
    nama: '=cmd|"/C calc"!A0', perusahaan: '+SUM(1,2)', email: 'a@b.com',
    telepon: '-1+1', produk_terkait: 'HDPE', estimasi_kuantitas: '@SUM(1,1)',
    pesan: '\t=1+1', status: 'baru', catatan_admin: '=HYPERLINK("http://x")'
  }];
  const res = createMockRes();
  try {
    await leadController.exportCsv({}, res);
  } finally {
    leadModel.exportAll = origExportAll;
  }
  const csv = res.bodyChunks.join('');
  assert.equal(res.headers['pragma'], 'no-cache');
  for (const safePrefix of ["'=cmd", "'+SUM(1,2)", "'-1+1", "'@SUM(1,1)", "'\t=1+1", "'=HYPERLINK"]) {
    assert.equal(csv.includes(safePrefix), true, `Missing CSV formula neutralization: ${safePrefix}`);
  }
});

test('3. userController.store and update consistently require minimum 8-char passwords', async () => {
  const orig = {
    findByEmail: userModel.findByEmail, create: userModel.create,
    findById: userModel.findById, update: userModel.update
  };
  let createCalls = 0;
  let updateCalls = 0;
  userModel.findByEmail = async () => null;
  userModel.create = async () => { createCalls += 1; };
  userModel.findById = async () => ({ id: 99, name: 'Admin', email: 'a@euodoo.com', role: 'admin' });
  userModel.update = async () => { updateCalls += 1; };

  try {
    for (const shortPw of ['1', '1234567']) {
      const storeRes = createMockRes();
      await userController.store({ body: { name: 'U', email: 'u@e.com', password: shortPw, role: 'admin' } }, storeRes);
      assert.equal(storeRes.statusCode, 400, `store must reject password length ${shortPw.length}`);
      assert.equal(storeRes.rendered?.view, 'admin/users/create');

      const updRes = createMockRes();
      await userController.update({ params: { id: 99 }, body: { name: 'U', email: 'u@e.com', role: 'admin', new_password: shortPw } }, updRes);
      assert.equal(updRes.statusCode, 400, `update must return 400 for short new_password (${shortPw.length})`);
      assert.equal(updRes.rendered?.view, 'admin/users/edit');
    }
    assert.equal(createCalls, 0);
    assert.equal(updateCalls, 0);

    const keepOldPwRes = createMockRes();
    await userController.update({ params: { id: 99 }, body: { name: 'U', email: 'u@e.com', role: 'admin', new_password: '' } }, keepOldPwRes);
    assert.equal(updateCalls, 1);
    assert.match(keepOldPwRes.redirectedTo || '', /success=/);
  } finally {
    Object.assign(userModel, orig);
  }
});

test('4. postModel throttles scheduled publish checks and contactController stops duplicate lead inserts', async () => {
  postModel.resetScheduledPublishCache?.();
  const firstCheck = await postModel.checkScheduledPublish();
  assert.equal(firstCheck?.skipped, false, 'First check should execute');
  const secondCheck = await postModel.checkScheduledPublish();
  assert.equal(secondCheck?.skipped, true, 'Immediate repeat check must be throttled');

  const prevEnv = process.env.NODE_ENV;
  const orig = { inqCreate: inquiryModel.create, leadCreate: leadModel.create, sendMail: mailer.sendLeadNotification };
  let inqCalls = 0;
  let leadCalls = 0;
  inquiryModel.create = async () => { inqCalls += 1; return 777; };
  leadModel.create = async () => { leadCalls += 1; return 888; };
  mailer.sendLeadNotification = async () => ({ success: true });
  process.env.NODE_ENV = 'test';
  const req = {
    body: {
      name: 'Budi', company: 'PT Test', email: 'budi@test.com', phone: '08123456789',
      message: 'Permintaan penawaran plastik industri minimal 10 karakter.',
      'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX'
    },
    headers: { accept: 'application/json' }, xhr: true, ip: '127.0.0.1'
  };
  const res = createMockRes();
  try {
    await contactController.submit(req, res);
  } finally {
    Object.assign(inquiryModel, { create: orig.inqCreate });
    Object.assign(leadModel, { create: orig.leadCreate });
    mailer.sendLeadNotification = orig.sendMail;
    process.env.NODE_ENV = prevEnv;
  }
  assert.equal(res.jsonPayload?.success, true);
  assert.equal(inqCalls, 1);
  assert.equal(leadCalls, 0, 'contactController.submit must not duplicate inserts into leadModel');
});

test('5. seoMiddleware ignores spoofed Host/proto and builds Organization JSON-LD from settings', () => {
  const prevBase = process.env.APP_BASE_URL;
  try {
    delete process.env.APP_BASE_URL;
    const spoofReq = {
      cookies: { euodoo_lang: 'id' }, protocol: 'http', originalUrl: '/products',
      headers: { 'x-forwarded-proto': 'javascript' }, get: () => 'evil.attacker.com'
    };
    const spoofRes = { locals: { settings: {} } };
    seoMiddleware(spoofReq, spoofRes, () => {});
    assert.equal(spoofRes.locals.seo.canonicalUrl.includes('evil.attacker.com'), false);
    assert.equal(spoofRes.locals.seo.canonicalUrl.startsWith('javascript:'), false);
    assert.equal(spoofRes.locals.seo.ogImage.includes('evil.attacker.com'), false);

    process.env.APP_BASE_URL = 'https://euodoo.co.id/';
    const customSettings = {
      company_name: 'PT Euodoo Custom', office_card_visible: '0', factory_card_visible: '1',
      factory_address: 'Jl. Paralon II No. 21 Cijerah Bandung 40214', factory_phone: '+6222-6012519',
      factory_email: 'sales@euodoo.co.id'
    };
    const homeReq = { cookies: { euodoo_lang: 'id' }, protocol: 'http', originalUrl: '/', headers: {}, get: () => 'evil.example' };
    const homeRes = { locals: { settings: customSettings } };
    seoMiddleware(homeReq, homeRes, () => {});
    assert.equal(homeRes.locals.seo.canonicalUrl, 'https://euodoo.co.id');
    const org = parseJsonLdObject(homeRes.locals.seo.renderJsonLd());
    const addrText = JSON.stringify(org.address);
    assert.equal(addrText.includes('Jl. Paralon II No. 21 Cijerah Bandung 40214'), true);
    assert.equal(addrText.includes('Karindra Building'), false, 'Hidden Jakarta address must not be hardcoded');
    assert.equal(JSON.stringify(org.contactPoint).includes('6221-53668626'), false);
  } finally {
    if (prevBase === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = prevBase;
  }
});

test('6. Image memory upload is capped at 10MB, disk upload streams cleanly, and errorHandler hides stack outside dev', async () => {
  assert.equal(uploadMod.uploadMedia.limits.fileSize, UPLOAD_CONFIG.MAX_FILE_SIZE);
  assert.equal(typeof uploadMod.uploadLargeMedia?.single, 'function', 'uploadLargeMedia middleware must be exported');

  const mini = express();
  mini.post('/stream', uploadMod.uploadLargeMedia.single('media'), async (req, res) => {
    try {
      const hasBuf = Boolean(req.file?.buffer);
      const hasPath = Boolean(req.file?.path);
      const saved = await storage.saveFromFile(req.file.path, `probe-${Date.now()}.mp4`, 'video/mp4', 'banners');
      await storage.delete(saved.url);
      res.json({ hasBuf, hasPath, savedUrl: saved.url });
    } finally {
      await uploadMod.cleanupTempFile?.(req.file);
    }
  });
  const srv = http.createServer(mini);
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  try {
    const form = new FormData();
    form.append('media', new Blob(['fake-mp4-stream-payload'], { type: 'video/mp4' }), 'demo.mp4');
    const r = await fetch(`http://127.0.0.1:${srv.address().port}/stream`, { method: 'POST', body: form });
    const data = await r.json();
    assert.equal(data.hasBuf, false, 'Disk-streamed upload must not keep Buffer in RAM');
    assert.equal(data.hasPath, true, 'Disk-streamed upload must expose temp file path');
    const leftover = path.join(os.tmpdir(), path.basename(data.savedUrl));
    assert.equal(fs.existsSync(leftover), false);
  } finally {
    srv.closeAllConnections?.();
    await new Promise((r) => srv.close(r));
  }

  const prevEnv = process.env.NODE_ENV;
  const setEnv = (val) => { if (val === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = val; };
  try {
    for (const envName of [undefined, 'staging', 'test']) {
      setEnv(envName);
      const errRes = createMockRes();
      errorHandler(new Error('SQL leaked secret_table'), { originalUrl: '/api/x', path: '/api/x', method: 'GET', xhr: true, headers: { accept: 'application/json' } }, errRes, () => {});
      assert.equal(errRes.statusCode, 500);
      assert.equal(errRes.jsonPayload?.stack, undefined, `Stack leaked in NODE_ENV=${envName}`);
      assert.equal(String(errRes.jsonPayload?.error).includes('secret_table'), false);
    }
    setEnv('development');
    const xssRes = createMockRes();
    errorHandler(new Error('<img src=x onerror=alert(1)>'), { originalUrl: '/x', path: '/x', method: 'GET', headers: {} }, xssRes, () => {});
    assert.equal(xssRes.bodyChunks.join('').includes('<img src=x'), false, 'Dev error HTML must escape err.message');
  } finally {
    setEnv(prevEnv);
  }
});
