import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { chromium } from 'playwright';

function getLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function createStaticTestServer() {
  const app = express();
  app.use(express.static(path.resolve('public')));
  app.get('/test-tokens', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="/css/tokens.css">
  <title>Token Test</title>
</head>
<body>
  <div id="testBox" style="background-color: var(--bg-soft-green); color: var(--color-text-main);">
    Testing Tokens
  </div>
</body>
</html>`);
  });
  return http.createServer(app);
}

describe('Task T-307: Token Warna Latar --bg-soft-green & Gradasi Transisi Halus', () => {
  let server;
  let baseUrl;
  let browser;

  before(async () => {
    server = createStaticTestServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  it('1. public/css/tokens.css mendefinisikan token baru tanpa mengubah token global eksisting', () => {
    const tokensContent = fs.readFileSync(path.resolve('public/css/tokens.css'), 'utf-8');
    assert.match(tokensContent, /--bg-base:\s*#ffffff;/i, '--bg-base wajib tetap #ffffff');
    assert.match(tokensContent, /--bg-subtle:\s*#f8fafc;/i, '--bg-subtle wajib tetap #f8fafc');
    assert.match(tokensContent, /--bg-soft-green:\s*#f3f6f3;/i, '--bg-soft-green wajib terdefinisi #f3f6f3');
    assert.match(tokensContent, /--color-bg-soft-green:\s*#f3f6f3;/i, '--color-bg-soft-green wajib terdefinisi #f3f6f3');
    assert.match(tokensContent, /--trans-soft-green-to-subtle:\s*linear-gradient\(to bottom,\s*#f3f6f3\s*0%,\s*#f8fafc\s*100%\);/i);
    assert.match(tokensContent, /--trans-subtle-to-soft-green:\s*linear-gradient\(to bottom,\s*#f8fafc\s*0%,\s*#f3f6f3\s*100%\);/i);
    assert.match(tokensContent, /--color-text-muted-on-soft:\s*#475569;/i, '--color-text-muted-on-soft wajib terdefinisi #475569');
  });

  it('2. Design/DESIGN.md mendokumentasikan token baru dan tabel kontras', () => {
    const designContent = fs.readFileSync(path.resolve('Design/DESIGN.md'), 'utf-8');
    assert.match(designContent, /bg-soft-green:\s*['"]#F3F6F3['"]/i);
    assert.match(designContent, /text-muted-on-soft:\s*['"]#475569['"]/i);
    assert.match(designContent, /--trans-soft-green-to-subtle/i);
    assert.match(designContent, /--trans-subtle-to-soft-green/i);
  });

  it('3. Perhitungan Kontras WCAG AA di atas --bg-soft-green (#F3F6F3) memenuhi standar >= 4.5:1', () => {
    const bgSoftGreen = '#F3F6F3';
    const textMain = '#0F172A';
    const textVariant = '#424753';
    const textMutedOnSoft = '#475569';
    const primary = '#00755A';
    const darkHeading = '#071F17';
    const textMutedOld = '#64748B';

    const contrastMain = getContrast(textMain, bgSoftGreen);
    const contrastVariant = getContrast(textVariant, bgSoftGreen);
    const contrastMutedOnSoft = getContrast(textMutedOnSoft, bgSoftGreen);
    const contrastPrimary = getContrast(primary, bgSoftGreen);
    const contrastDarkHeading = getContrast(darkHeading, bgSoftGreen);
    const contrastMutedOld = getContrast(textMutedOld, bgSoftGreen);

    assert.ok(contrastMain >= 4.5, `contrastMain ${contrastMain} < 4.5`);
    assert.ok(contrastMain >= 16.0, `contrastMain ${contrastMain} expected ~16.4`);

    assert.ok(contrastVariant >= 4.5, `contrastVariant ${contrastVariant} < 4.5`);
    assert.ok(contrastVariant >= 8.5, `contrastVariant ${contrastVariant} expected ~8.55`);

    assert.ok(contrastMutedOnSoft >= 4.5, `contrastMutedOnSoft ${contrastMutedOnSoft} < 4.5`);
    assert.ok(contrastMutedOnSoft >= 6.9, `contrastMutedOnSoft ${contrastMutedOnSoft} expected ~6.96`);

    assert.ok(contrastPrimary >= 4.5, `contrastPrimary ${contrastPrimary} < 4.5`);
    assert.ok(contrastPrimary >= 5.2, `contrastPrimary ${contrastPrimary} expected ~5.22`);

    assert.ok(contrastDarkHeading >= 4.5, `contrastDarkHeading ${contrastDarkHeading} < 4.5`);
    assert.ok(contrastDarkHeading >= 15.5, `contrastDarkHeading ${contrastDarkHeading} expected ~15.84`);

    assert.ok(contrastMutedOld < 4.5, `contrastMutedOld ${contrastMutedOld} expected < 4.5 as reason for calibrated token`);
  });

  it('4. Playwright memverifikasi computed values CSS token di browser', async () => {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/test-tokens`);

    const tokens = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const testBoxStyle = getComputedStyle(document.getElementById('testBox'));
      return {
        bgSoftGreen: rootStyle.getPropertyValue('--bg-soft-green').trim(),
        colorBgSoftGreen: rootStyle.getPropertyValue('--color-bg-soft-green').trim(),
        textMutedOnSoft: rootStyle.getPropertyValue('--color-text-muted-on-soft').trim(),
        transSoftGreenToSubtle: rootStyle.getPropertyValue('--trans-soft-green-to-subtle').trim(),
        transSubtleToSoftGreen: rootStyle.getPropertyValue('--trans-subtle-to-soft-green').trim(),
        testBoxBg: testBoxStyle.backgroundColor,
        testBoxColor: testBoxStyle.color
      };
    });

    assert.equal(tokens.bgSoftGreen, '#f3f6f3');
    assert.equal(tokens.colorBgSoftGreen, '#f3f6f3');
    assert.equal(tokens.textMutedOnSoft, '#475569');
    assert.ok(tokens.transSoftGreenToSubtle.includes('#f3f6f3'));
    assert.ok(tokens.transSoftGreenToSubtle.includes('#f8fafc'));
    assert.ok(tokens.transSubtleToSoftGreen.includes('#f8fafc'));
    assert.ok(tokens.transSubtleToSoftGreen.includes('#f3f6f3'));

    assert.equal(tokens.testBoxBg, 'rgb(243, 246, 243)');
    assert.equal(tokens.testBoxColor, 'rgb(15, 23, 42)');

    await page.close();
  });
});

