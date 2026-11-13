import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import app from '../app.js';
import { pool } from '../config/database.js';

const VIEWPORTS = [
  { width: 320, height: 667 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 }
];
const LANGS = ['id', 'en'];
const LONG_TITLE_SLUG = 'mengenal-teknologi-oxium-plastik-biodegradable';
const NO_COVER_SLUG = 'penerapan-injeksi-presisi-mikro-komponen-medis';
const TEMP_SLUG = 't320-t321-empty-prose-regression';

function toLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseRgb(rgbString) {
  const nums = rgbString.match(/\d+(\.\d+)?/g);
  assert.ok(nums && nums.length >= 3, `Invalid rgb value: ${rgbString}`);
  return nums.slice(0, 3).map(Number);
}

function contrastRatio(fgRgb, bgRgb) {
  const [r1, g1, b1] = parseRgb(fgRgb).map(toLinear);
  const [r2, g2, b2] = parseRgb(bgRgb).map(toLinear);
  const l1 = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
  const l2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

async function openAndCheckViewport(browser, url, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(url, { waitUntil: 'load' });
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));

  assert.equal(errors.length, 0, `Console/page errors on ${url} at ${viewport.width}px: ${errors.join(' | ')}`);
  assert.ok(
    metrics.scrollWidth <= metrics.innerWidth + 1,
    `Horizontal overflow on ${url} at ${viewport.width}px (${metrics.scrollWidth} > ${metrics.innerWidth})`
  );
  return page;
}

async function verifyDetailDomAndEllipsis(page) {
  const domInfo = await page.evaluate(() => {
    const ld = document.head.querySelector('script[type="application/ld+json"]');
    const bodyScripts = Array.from(document.querySelectorAll('script:not([type="application/ld+json"])'));
    const inlineNonEmpty = bodyScripts.filter((s) => !s.src && s.textContent.trim().length > 0);
    const hasExtScript = bodyScripts.some((s) => (s.getAttribute('src') || '').includes('/js/news-detail.js'));
    const crumb = document.querySelector('.nwd-breadcrumb-current');
    const crumbCss = crumb ? getComputedStyle(crumb) : null;
    return {
      hasHeadJsonLd: Boolean(ld),
      jsonLdType: ld ? JSON.parse(ld.textContent)['@type'] : null,
      inlineScriptCount: inlineNonEmpty.length,
      hasExtScript,
      hasNwdProse: Boolean(document.querySelector('.nwd-prose')),
      hasLegacyProse: Boolean(document.querySelector('.article-prose')),
      crumbDisplay: crumbCss ? crumbCss.display : null,
      crumbOverflow: crumbCss ? crumbCss.textOverflow : null,
      crumbTruncated: crumb ? crumb.scrollWidth > crumb.clientWidth : false
    };
  });

  assert.equal(domInfo.hasHeadJsonLd, true, 'JSON-LD must live inside <head>');
  assert.equal(domInfo.jsonLdType, 'Article');
  assert.equal(domInfo.inlineScriptCount, 0, 'Detail page must have zero inline JS');
  assert.equal(domInfo.hasExtScript, true, 'Detail page must load /js/news-detail.js');
  assert.equal(domInfo.hasNwdProse, true, '.nwd-prose container must exist');
  assert.equal(domInfo.hasLegacyProse, false, 'Legacy .article-prose must be absent');
  assert.equal(domInfo.crumbDisplay, 'block', '.nwd-breadcrumb-current blockifies in flex parent so ellipsis triggers');
  assert.equal(domInfo.crumbOverflow, 'ellipsis');
  assert.equal(domInfo.crumbTruncated, true, 'Long breadcrumb title should truncate cleanly with ellipsis');
}

describe('Regression T-320 & T-321: News Listing & Detail Accessibility, Hygiene & Interactions', () => {
  let server;
  let baseUrl;
  let browser;
  const idDict = JSON.parse(fs.readFileSync(path.resolve('locales/id.json'), 'utf8'));
  const enDict = JSON.parse(fs.readFileSync(path.resolve('locales/en.json'), 'utf8'));

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    await pool.query('DELETE FROM posts WHERE slug = ?', [TEMP_SLUG]);
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
  });

  it('1. Static template hygiene, CSS contrast token & breadcrumb ellipsis rule (T-320 & T-321)', () => {
    const newsTpl = fs.readFileSync(path.resolve('views/public/news.ejs'), 'utf8');
    const detailTpl = fs.readFileSync(path.resolve('views/public/news-detail.ejs'), 'utf8');
    const componentsCss = fs.readFileSync(path.resolve('public/css/components.css'), 'utf8');

    assert.equal(/<script(?![^>]*src=)[^>]*>/i.test(newsTpl), false, 'news.ejs must not contain inline <script> blocks');
    assert.ok(newsTpl.includes('<script src="/js/news-filter.js" defer></script>'), 'news.ejs must load /js/news-filter.js');
    assert.equal(newsTpl.includes('1. PAGE HERO'), false, 'news.ejs must not contain numbered hero comment');
    assert.equal(newsTpl.includes('2. HEADLINE SECTION'), false, 'news.ejs must not contain numbered headline comment');
    assert.equal(newsTpl.includes('3. DIRECTORY & LISTING SECTION'), false, 'news.ejs must not contain numbered directory comment');
    assert.ok(newsTpl.includes("t('news.empty_desc')"), 'news.ejs must localize empty state description');
    assert.ok(newsTpl.includes("t('news.empty_reset')"), 'news.ejs must localize empty state reset button');

    assert.ok(detailTpl.includes('<script src="/js/news-detail.js" defer></script>'), 'news-detail.ejs must load /js/news-detail.js');
    assert.equal(/<script(?![^>]*src=)(?![^>]*ld\+json)[^>]*>/i.test(detailTpl), false, 'news-detail.ejs must have no inline script');
    assert.ok(detailTpl.includes('class="nwd-prose"'), 'news-detail.ejs must use .nwd-prose container');
    assert.equal(detailTpl.includes('article-prose'), false, 'news-detail.ejs must not reference legacy .article-prose');
    assert.equal(detailTpl.includes('copySuccessToast'), false, 'news-detail.ejs must not contain removed #copySuccessToast');

    const svgTags = detailTpl.match(/<svg[^>]*>/g) || [];
    assert.ok(svgTags.length >= 4, 'news-detail.ejs share buttons must render 4 SVG icons');
    for (const tag of svgTags) {
      assert.ok(tag.includes('aria-hidden="true"'), `Decorative SVG missing aria-hidden="true": ${tag}`);
    }

    assert.match(componentsCss, /\.nwd-breadcrumb-current\s*\{[^}]*display:\s*inline-block;/s);
    assert.match(componentsCss, /\.nwl-slide-date\s*\{[^}]*color:\s*var\(--color-text-muted-on-soft\);/s);
    assert.match(componentsCss, /\.nwl-slide-excerpt\s*\{[^}]*color:\s*var\(--color-text-muted-on-soft\);/s);
  });

  it('2. /news renders zero overflow & zero console errors across 320/375/768/1440px in ID and EN', async () => {
    for (const lang of LANGS) {
      for (const viewport of VIEWPORTS) {
        const page = await openAndCheckViewport(browser, `${baseUrl}/news?lang=${lang}`, viewport);
        await page.close();
      }
    }
  });

  it('3. /news headline muted text contrast passes WCAG AA (>= 4.5:1) against soft green surface', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/news?lang=id`, { waitUntil: 'load' });

    const colors = await page.evaluate(() => {
      const sec = document.querySelector('.nwl-sec-headline');
      const dateEl = document.querySelector('.nwl-slide-date');
      const excerptEl = document.querySelector('.nwl-slide-excerpt');
      return {
        bg: sec ? getComputedStyle(sec).backgroundColor : null,
        dateColor: dateEl ? getComputedStyle(dateEl).color : null,
        excerptColor: excerptEl ? getComputedStyle(excerptEl).color : null
      };
    });

    assert.ok(colors.bg && colors.dateColor && colors.excerptColor, 'Headline elements must be rendered');
    const dateRatio = contrastRatio(colors.dateColor, colors.bg);
    const excerptRatio = contrastRatio(colors.excerptColor, colors.bg);
    assert.ok(dateRatio >= 4.5, `Slide date contrast ${dateRatio.toFixed(2)}:1 is below 4.5:1`);
    assert.ok(excerptRatio >= 4.5, `Slide excerpt contrast ${excerptRatio.toFixed(2)}:1 is below 4.5:1`);
    await page.close();
  });

  it('4. /news localized empty state & Fetch reset + category filter & popstate history work', async () => {
    const checks = [
      { lang: 'id', dict: idDict },
      { lang: 'en', dict: enDict }
    ];

    for (const item of checks) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${baseUrl}/news?lang=${item.lang}&search=euodoo_no_match_99999`, { waitUntil: 'load' });

      const emptyText = await page.$eval('#newsEmptyState p', (el) => el.textContent.trim());
      const resetText = await page.$eval('#nwlEmptyResetBtn', (el) => el.textContent.trim());
      assert.equal(emptyText, item.dict.news.empty_desc);
      assert.equal(resetText, item.dict.news.empty_reset);

      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/news') && res.status() === 200),
        page.click('#nwlEmptyResetBtn')
      ]);
      await page.waitForSelector('#newsGrid article', { state: 'visible', timeout: 5000 });
      await page.close();
    }

    const navPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await navPage.goto(`${baseUrl}/news?lang=id`, { waitUntil: 'load' });
    const pillCount = await navPage.locator('.nwl-cat-pill').count();
    assert.ok(pillCount > 1, 'Expected category filter pills');
    await Promise.all([
      navPage.waitForResponse((res) => res.url().includes('/news') && res.status() === 200),
      navPage.locator('.nwl-cat-pill').nth(1).click()
    ]);
    await navPage.waitForFunction(() => window.location.search.includes('category='));
    assert.ok(navPage.url().includes('category='), 'Clicking category pill should push category query param');
    await navPage.goBack({ waitUntil: 'domcontentloaded' });
    assert.equal(new URL(navPage.url()).searchParams.get('category'), null, 'Back button should restore clean URL');
    await navPage.close();
  });

  it('5. /news/:slug renders cleanly across viewports & verifies JSON-LD, external JS, .nwd-prose and breadcrumb ellipsis', async () => {
    const cases = LANGS.flatMap((lang) => VIEWPORTS.map((viewport) => ({ lang, viewport })));
    for (const { lang, viewport } of cases) {
      const page = await openAndCheckViewport(browser, `${baseUrl}/news/${LONG_TITLE_SLUG}?lang=${lang}`, viewport);
      if (viewport.width === 1440 && lang === 'id') await verifyDetailDomAndEllipsis(page);
      await page.close();
    }
  });

  it('6. /news/:slug null cover & empty prose fallbacks work safely in ID and EN', async () => {
    const noCoverPage = await openAndCheckViewport(browser, `${baseUrl}/news/${NO_COVER_SLUG}?lang=id`, VIEWPORTS[3]);
    const hasFeaturedImg = await noCoverPage.evaluate(() => Boolean(document.querySelector('.nwd-featured-img')));
    assert.equal(hasFeaturedImg, false, 'Null cover article should omit broken featured image');
    await noCoverPage.close();

    await pool.query('DELETE FROM posts WHERE slug = ?', [TEMP_SLUG]);
    const [insertRes] = await pool.query(
      'INSERT INTO posts (title_id, title_en, slug, content_id, content_en, status, published_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      ['Judul Uji Kosong', 'Empty Content Test Title', TEMP_SLUG, '', '', 'published']
    );
    const tempId = insertRes.insertId;

    try {
      for (const [lang, expected] of [['id', idDict.news_detail.empty_prose], ['en', enDict.news_detail.empty_prose]]) {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        await page.goto(`${baseUrl}/news/${TEMP_SLUG}?lang=${lang}`, { waitUntil: 'load' });
        const proseText = await page.$eval('.nwd-prose', (el) => el.textContent.trim());
        assert.ok(proseText.includes(expected), `Expected empty prose fallback in ${lang}, got: ${proseText}`);
        await page.close();
      }
    } finally {
      await pool.query('DELETE FROM posts WHERE id = ?', [tempId]);
    }
  });

  it('7. Share buttons verify href/noopener/aria-hidden SVG, Tab focus, clipboard & execCommand fallback', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      window.__copiedText = null;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.__copiedText = text;
          }
        }
      });
    });

    await page.goto(`${baseUrl}/news/${LONG_TITLE_SLUG}?lang=id`, { waitUntil: 'load' });

    const shareMeta = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.nwd-share-btns a.nwd-share-btn'));
      const svgs = Array.from(document.querySelectorAll('.nwd-share-btns svg'));
      const copyBtn = document.getElementById('copyLinkBtn');
      return {
        links: links.map((a) => ({
          href: a.getAttribute('href') || '',
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel'),
          ariaLabel: a.getAttribute('aria-label')
        })),
        svgAriaHidden: svgs.map((svg) => svg.getAttribute('aria-hidden')),
        shareUrl: copyBtn ? copyBtn.getAttribute('data-share-url') : null
      };
    });

    assert.equal(shareMeta.links.length, 3);
    assert.ok(shareMeta.links[0].href.startsWith('https://wa.me/?text='));
    assert.ok(shareMeta.links[1].href.startsWith('https://www.facebook.com/sharer/sharer.php?u='));
    assert.ok(shareMeta.links[2].href.startsWith('https://twitter.com/intent/tweet?text='));
    for (const link of shareMeta.links) {
      assert.equal(link.target, '_blank');
      assert.equal(link.rel, 'noopener noreferrer');
      assert.ok(link.ariaLabel, 'Share link requires accessible label');
    }
    assert.deepEqual(shareMeta.svgAriaHidden, ['true', 'true', 'true', 'true']);

    await page.focus('.nwd-share-btns a.nwd-share-btn');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const activeId = await page.evaluate(() => document.activeElement?.id || null);
    assert.equal(activeId, 'copyLinkBtn', 'Keyboard Tab order must reach #copyLinkBtn');

    await page.click('#copyLinkBtn');
    await page.waitForTimeout(150);
    const copied = await page.evaluate(() => window.__copiedText);
    assert.equal(copied, shareMeta.shareUrl);
    await page.close();

    const fallbackPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const fallbackErrors = [];
    fallbackPage.on('pageerror', (err) => fallbackErrors.push(err.message));
    await fallbackPage.addInitScript(() => {
      window.__execCommands = [];
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error('Clipboard permission denied');
          }
        }
      });
      document.execCommand = (cmd) => {
        window.__execCommands.push(cmd);
        return true;
      };
    });

    await fallbackPage.goto(`${baseUrl}/news/${LONG_TITLE_SLUG}?lang=en`, { waitUntil: 'load' });
    await fallbackPage.click('#copyLinkBtn');
    await fallbackPage.waitForTimeout(150);
    const execCalls = await fallbackPage.evaluate(() => window.__execCommands);
    assert.ok(execCalls.includes('copy'), 'Rejecting clipboard API should invoke document.execCommand("copy") fallback');
    assert.equal(fallbackErrors.length, 0);
    await fallbackPage.close();
  });
});
