import 'dotenv/config';
import http from 'http';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import app from '../app.js';

const JWT_SECRET = process.env.JWT_SECRET || 'euodoo_jwt_secret_dev';
const OUTPUT_DIR = path.resolve('tests/screenshots-audit');
const ARTIFACT_DIR = path.resolve('/home/itpc/.gemini/antigravity/brain/46947dee-f2e1-4c93-92f5-123614646aa7');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function run() {
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Server listening on ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const token = jwt.sign({
    id: 1,
    email: 'admin@euodoo.com',
    name: 'Super Admin',
    role: 'superadmin'
  }, JWT_SECRET, { expiresIn: '1h' });

  const viewports = [
    { width: 1440, height: 900, name: 'desktop-1440' },
    { width: 1280, height: 850, name: 'desktop-1280' },
    { width: 768, height: 1024, name: 'tablet-768' },
    { width: 375, height: 812, name: 'mobile-375' }
  ];

  const pages = [
    '/admin/dashboard',
    '/admin/inquiries',
    '/admin/products'
  ];

  const auditResults = [];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await context.addCookies([{
      name: 'euodoo_session',
      value: token,
      domain: '127.0.0.1',
      path: '/'
    }]);

    const page = await context.newPage();

    for (const pagePath of pages) {
      await page.goto(`${baseUrl}${pagePath}`, { waitUntil: 'networkidle' });

      const slug = pagePath.replace(/\//g, '-').replace(/^-/, '');
      const filename = `${slug}-${vp.name}.png`;
      const ssPath = path.join(OUTPUT_DIR, filename);
      await page.screenshot({ path: ssPath, fullPage: vp.width <= 768 });

      // Copy to artifact dir for direct user viewing
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      fs.copyFileSync(ssPath, artifactPath);

      const metrics = await page.evaluate(() => {
        const card = document.querySelector('.table-card');
        const wrapper = document.querySelector('.table-scroll-wrapper, .table-scroll-wrapper--mobile-only');
        const table = document.querySelector('.data-table');
        const pgn = document.querySelector('.pgn-bar');

        const cardOverflow = card ? card.scrollWidth > card.clientWidth : false;
        const wrapperOverflow = wrapper ? wrapper.scrollWidth > wrapper.clientWidth : false;
        const bodyOverflow = document.body.scrollWidth > document.body.clientWidth;

        return {
          cardWidth: card?.offsetWidth || 0,
          cardScrollWidth: card?.scrollWidth || 0,
          wrapperWidth: wrapper?.offsetWidth || 0,
          wrapperScrollWidth: wrapper?.scrollWidth || 0,
          tableWidth: table?.offsetWidth || 0,
          pgnWidth: pgn?.offsetWidth || 0,
          hasCardHorizontalOverflow: cardOverflow,
          hasWrapperHorizontalOverflow: wrapperOverflow,
          hasBodyHorizontalOverflow: bodyOverflow,
          wrapperOverflowX: wrapper ? window.getComputedStyle(wrapper).overflowX : 'n/a',
          pgnMarginTop: pgn ? window.getComputedStyle(pgn).marginTop : 'n/a',
          pgnBorderTop: pgn ? window.getComputedStyle(pgn).borderTop : 'n/a'
        };
      });

      auditResults.push({
        path: pagePath,
        viewport: vp.name,
        width: vp.width,
        screenshot: filename,
        ...metrics
      });
    }

    await context.close();
  }

  await browser.close();
  server.close();

  console.log('\n=== PLAYWRIGHT TABLE & VIEWPORT AUDIT REPORT ===');
  console.table(auditResults.map(r => ({
    Path: r.path,
    Viewport: r.viewport,
    'Wrapper Width': r.wrapperWidth,
    'Wrapper ScrollW': r.wrapperScrollWidth,
    'Wrapper Overflow?': r.hasWrapperHorizontalOverflow,
    'Body Overflow?': r.hasBodyHorizontalOverflow,
    'Pgn MarginTop': r.pgnMarginTop
  })));

  const anyFailures = auditResults.filter(r => r.hasWrapperHorizontalOverflow || r.hasBodyHorizontalOverflow);
  if (anyFailures.length > 0) {
    console.error(`FAILED: ${anyFailures.length} viewports have horizontal overflow!`);
    process.exit(1);
  } else {
    console.log('\nALL VIEWPORTS PASSED: Zero horizontal overflow on desktop, tablet, and mobile!');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
