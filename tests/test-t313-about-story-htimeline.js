import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';
import { chromium } from 'playwright';
import { groupTimelineByYear } from '../services/publicPageService.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = process.env.T313_BASE_URL || 'http://127.0.0.1:3000';
const ADMIN_EMAIL = process.env.T313_ADMIN_EMAIL || 'admin@euodoo.com';
const ADMIN_PASSWORD = process.env.T313_ADMIN_PASSWORD || 'AdminEuodoo2026!';
const SHOT_DIR = path.join(ROOT, 'tests', 'screenshots-audit');
const FIXTURE_URL = `${BASE}/__t317_fixture__`;
const SETTLE_MS = 700;
const VIEWPORTS = [
  [320, 568],
  [375, 667],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1440, 900]
];

const LOCALES = {
  id: JSON.parse(fs.readFileSync(path.join(ROOT, 'locales/id.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.join(ROOT, 'locales/en.json'), 'utf8'))
};

const HEADER_DEFAULTS = {
  id: { tagline: 'Perjalanan Kami', title: 'Jejak Langkah & Tonggak Sejarah' },
  en: { tagline: 'Our Journey', title: 'Milestones & Historical Journey' }
};

const STATS_6 = ['1990', '1.500+', '30+', '100%', '50', '7'].map((v, i) => ({
  stat_value: v, label_id: `Label ${i + 1}`, label_en: `Label EN ${i + 1}`
}));
const STATS_3 = STATS_6.slice(0, 3);

function makeTimeline(years = ['2010', '2015', '2015', '2020', '2024', '2024']) {
  return years.map((yr, i) => ({
    year_label_id: yr,
    year_label_en: yr,
    title_id: `Tonggak ${i + 1}`,
    title_en: `Milestone ${i + 1}`,
    description_id: `Deskripsi tonggak ${i + 1}.`,
    description_en: `Milestone description ${i + 1}.`
  }));
}

function translator(lang) {
  return (key) => key.split('.').reduce((o, k) => (o ? o[k] : undefined), LOCALES[lang]) ?? key;
}

async function renderFixture({ lang = 'id', stats = STATS_6.slice(0, 4), timeline = makeTimeline(), timelineHeader = {}, spacer = 0 } = {}) {
  const locals = {
    currentLang: lang,
    t: translator(lang),
    about: {},
    storyHeader: {},
    stats,
    timeline,
    timelineHeader,
    groupTimelineByYear
  };
  const counter = await ejs.renderFile(path.join(ROOT, 'views/partials/about/story-counter.ejs'), locals);
  const htl = await ejs.renderFile(path.join(ROOT, 'views/partials/about/history-timeline.ejs'), locals);
  const css = ['tokens', 'base', 'layout', 'components']
    .map((name) => `<link rel="stylesheet" href="${BASE}/css/${name}.css">`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${css}</head>
<body><main><div style="height:${spacer}px"></div><section class="sec-story" id="sejarah"><div class="container">${counter}${htl}</div></section></main>
<script src="${BASE}/vendor/animejs/anime.min.js"></script>
<script src="${BASE}/js/main.js"></script>
<script src="${BASE}/js/about-story.js" defer></script></body></html>`;
}

let browser;

async function openPage({ width = 1440, height = 900, reducedMotion = 'no-preference', hasTouch = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion, hasTouch });
  const page = await context.newPage();
  return { context, page };
}

async function openFixture(fixtureOpts, pageOpts) {
  const { context, page } = await openPage(pageOpts);
  const html = await renderFixture(fixtureOpts);
  await page.route(FIXTURE_URL, (route) => route.fulfill({ contentType: 'text/html', body: html }));
  await page.goto(FIXTURE_URL, { waitUntil: 'load' });
  return { context, page };
}

function attachErrorCollector(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    const url = msg.location().url || '';
    if (msg.type() === 'error' && (url === '' || url.startsWith(BASE))) errors.push(msg.text());
  });
  return errors;
}

async function readVerticalState(page) {
  return page.evaluate(() => ({
    sortDir: document.querySelector('.abt-htl-layout')?.getAttribute('data-sort-dir'),
    ascPressed: document.querySelector('.abt-htl-sort-btn[data-sort-dir="asc"]')?.getAttribute('aria-pressed'),
    descPressed: document.querySelector('.abt-htl-sort-btn[data-sort-dir="desc"]')?.getAttribute('aria-pressed'),
    pillKeys: [...document.querySelectorAll('.abt-htl-year-pill')].map((el) => el.getAttribute('data-year-key')),
    groupKeys: [...document.querySelectorAll('.abt-htl-group')].map((el) => el.getAttribute('data-year-key')),
    activePillKey: document.querySelector('.abt-htl-year-pill[aria-current="true"]')?.getAttribute('data-year-key'),
    progress: parseFloat(document.querySelector('.abt-htl-rail')?.style.getPropertyValue('--abt-htl-progress') || '0')
  }));
}

async function readHeader(page) {
  return page.evaluate(() => ({
    tagline: document.querySelector('.abt-htl-tagline').textContent.trim(),
    title: document.querySelector('.abt-htl-title').textContent.trim(),
    desc: document.querySelector('.abt-htl-desc').textContent.trim()
  }));
}

before(async () => {
  const res = await fetch(`${BASE}/about`).catch(() => null);
  assert.ok(res && res.status === 200, `Server harus berjalan di ${BASE} (npm run dev) sebelum tes ini`);
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  browser = await chromium.launch();
});

after(async () => {
  if (browser) await browser.close();
});

async function assertViewportLayout(width, height) {
  const { context, page } = await openPage({ width, height, hasTouch: width < 1024 });
  const errors = attachErrorCollector(page);
  await page.goto(`${BASE}/about`, { waitUntil: 'load' });
  const m = await page.evaluate(() => {
    const grid = document.querySelector('.abt-cnt-grid');
    const activeCard = document.querySelector('.abt-htl-group.is-active .abt-htl-card');
    const btns = [...document.querySelectorAll('.abt-htl-sort-btn, .abt-htl-year-pill')];
    return {
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      gridCols: getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length,
      activeBorderColor: activeCard ? getComputedStyle(activeCard).borderTopColor : '',
      minBtnHeight: Math.min(...btns.map((el) => el.getBoundingClientRect().height))
    };
  });
  assert.deepEqual(errors, [], `${width}px: console/page error ditemukan`);
  assert.ok(m.scrollW <= m.innerW, `${width}px: horizontal overflow (${m.scrollW} > ${m.innerW})`);
  assert.equal(m.gridCols, 2, `${width}px: grid stat harus 2 kolom`);
  if (width < 1024) {
    assert.equal(m.activeBorderColor, 'rgb(0, 117, 90)', `${width}px: kartu aktif harus berborder primary`);
    assert.ok(m.minBtnHeight >= 44, `${width}px: target sentuh tombol minimal 44px (${m.minBtnHeight}px)`);
  }
  await context.close();
}

test('1. Live /about multi-viewport: 0 error, 0 overflow, grid stat 2x2, border aktif & touch target >= 44px', async () => {
  for (const [width, height] of VIEWPORTS) {
    await assertViewportLayout(width, height);
  }
});

test('2. Stat: 6 data -> 4 kartu quad; 3 data -> 3 kartu tanpa notch dan lencana', async () => {
  let { context, page } = await openFixture({ stats: STATS_6 });
  assert.equal(await page.locator('.abt-cnt-card').count(), 4);
  assert.equal(await page.locator('.abt-cnt-grid--quad').count(), 1);
  assert.equal(await page.locator('.abt-cnt-badge').count(), 4);
  await context.close();

  ({ context, page } = await openFixture({ stats: STATS_3 }));
  assert.equal(await page.locator('.abt-cnt-card').count(), 3);
  assert.equal(await page.locator('.abt-cnt-grid--quad').count(), 0);
  assert.equal(await page.locator('.abt-cnt-badges').count(), 0);
  const mask = await page.$eval('.abt-cnt-card--q1', (el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage);
  assert.equal(mask, 'none', 'Kartu non-quad tidak boleh punya notch');
  await context.close();
});

test('3. Count-up berjalan sampai nilai akhir; reduced motion langsung nilai akhir', async () => {
  const stats = STATS_6.slice(0, 4);
  const finals = stats.map((s) => s.stat_value);

  let { context, page } = await openFixture({ stats, spacer: 1600 }, { height: 600 });
  await page.evaluate(() => {
    window.__t317Seen = [];
    const el = document.querySelector('.abt-cnt-card--q2 .abt-cnt-num');
    new MutationObserver(() => window.__t317Seen.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
  });
  await page.locator('.abt-cnt-grid').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => (window.__t317Seen || []).length > 0, null, { timeout: 5000 });
  await page.waitForFunction((expected) => [...document.querySelectorAll('.abt-cnt-num')]
    .every((el, i) => el.textContent.trim() === expected[i]), finals, { timeout: 5000 });
  const seen = await page.evaluate(() => window.__t317Seen);
  assert.ok(seen.some((v) => v !== '1.500+'), 'Count-up harus menampilkan nilai antara sebelum nilai akhir');
  assert.ok(seen.some((v) => /^\d{1,3}(\.\d{3})+\+$/.test(v) || /^\d+\+$/.test(v)), 'Format pemisah ribuan & sufiks dipertahankan');
  await context.close();

  ({ context, page } = await openFixture({ stats }, { reducedMotion: 'reduce' }));
  const texts = await page.$$eval('.abt-cnt-num', (els) => els.map((el) => el.textContent.trim()));
  assert.deepEqual(texts, finals);
  await context.close();
});

test('4. Kartu kuadran punya mask radial-gradient; lencana aria-hidden', async () => {
  const { context, page } = await openFixture({});
  const masks = await page.$$eval('.abt-cnt-card', (els) => els.map((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage));
  masks.forEach((m, i) => assert.match(m, /radial-gradient/, `Kartu q${i + 1} tanpa mask`));
  assert.equal(await page.getAttribute('.abt-cnt-badges', 'aria-hidden'), 'true');
  await context.close();
});

test('5. Hover kartu menggeser panah lencana via Anime.js lalu kembali', async () => {
  const { context, page } = await openFixture({});
  await page.locator('.abt-cnt-grid').scrollIntoViewIfNeeded();
  await page.hover('.abt-cnt-card--q1', { position: { x: 30, y: 30 } });
  await page.waitForTimeout(SETTLE_MS);
  let s = await page.$eval('.abt-cnt-badge--q1', (b) => ({
    hovered: b.classList.contains('is-hovered'),
    transform: b.querySelector('.abt-cnt-badge-arrow').style.transform
  }));
  assert.ok(s.hovered, 'Lencana q1 harus .is-hovered');
  assert.match(s.transform, /translateX\(2\.5px\).*translateY\(2\.5px\)/);

  await page.mouse.move(2, 2);
  await page.waitForTimeout(SETTLE_MS);
  s = await page.$eval('.abt-cnt-badge--q1', (b) => ({
    hovered: b.classList.contains('is-hovered'),
    transform: b.querySelector('.abt-cnt-badge-arrow').style.transform
  }));
  assert.ok(!s.hovered);
  assert.match(s.transform, /translateX\(0(px)?\).*translateY\(0(px)?\)/);
  await context.close();
});

test('6. SSR timeline vertikal ID & EN: struktur semantik baru, jumlah peristiwa, bebas carousel lama', async () => {
  for (const lang of ['id', 'en']) {
    const { context, page } = await openFixture({ lang });
    const ssr = await page.evaluate(() => ({
      header: document.querySelectorAll('header.abt-htl-header').length,
      sidebar: document.querySelectorAll('.abt-htl-sidebar').length,
      sortBtns: document.querySelectorAll('.abt-htl-sort-btn[aria-pressed]').length,
      yearNav: document.querySelectorAll('nav.abt-htl-year-nav').length,
      pills: document.querySelectorAll('.abt-htl-year-pill[aria-current]').length,
      railFill: document.querySelectorAll('.abt-htl-rail > .abt-htl-rail-fill').length,
      list: document.querySelectorAll('ol.abt-htl-list').length,
      groups: document.querySelectorAll('.abt-htl-group').length,
      cards: document.querySelectorAll('.abt-htl-card').length,
      counts: [...document.querySelectorAll('.abt-htl-count')].map((el) => el.textContent.trim()),
      oldCarousel: document.querySelectorAll('[aria-roledescription="carousel"], .abt-htl-btn--prev, .abt-htl-btn--next').length
    }));
    assert.equal(ssr.header, 1);
    assert.equal(ssr.sidebar, 1);
    assert.equal(ssr.sortBtns, 2);
    assert.equal(ssr.yearNav, 1);
    assert.equal(ssr.pills, 4);
    assert.equal(ssr.railFill, 1);
    assert.equal(ssr.list, 1);
    assert.equal(ssr.groups, 4);
    assert.equal(ssr.cards, 6);
    assert.equal(ssr.oldCarousel, 0, 'Atribut/tombol carousel lama harus sudah dihapus');
    const expectedWord = lang === 'en' ? /Event/ : /Peristiwa/;
    ssr.counts.forEach((txt) => assert.match(txt, expectedWord));
    await context.close();
  }
});

test('7. Sort default Terlama (asc) dan klik Terkini (desc) membalik urutan DOM tanpa reload', async () => {
  const { context, page } = await openFixture({ lang: 'id' });
  const before = await readVerticalState(page);
  assert.equal(before.sortDir, 'asc');
  assert.equal(before.ascPressed, 'true');
  assert.equal(before.descPressed, 'false');
  assert.deepEqual(before.pillKeys, ['2010', '2015', '2020', '2024']);
  assert.deepEqual(before.groupKeys, ['2010', '2015', '2020', '2024']);

  await page.click('.abt-htl-sort-btn[data-sort-dir="desc"]');
  await page.waitForTimeout(250);
  const after = await readVerticalState(page);
  assert.equal(after.sortDir, 'desc');
  assert.equal(after.ascPressed, 'false');
  assert.equal(after.descPressed, 'true');
  assert.deepEqual(after.pillKeys, ['2024', '2020', '2015', '2010']);
  assert.deepEqual(after.groupKeys, ['2024', '2020', '2015', '2010']);
  await context.close();
});

test('8. Klik pill tahun mengaktifkan aria-current, scroll halaman mengupdate progress & reveal kartu', async () => {
  const { context, page } = await openFixture({ lang: 'id', spacer: 300 }, { width: 1280, height: 720 });
  await page.click('.abt-htl-year-pill[data-year-key="2020"]');
  await page.waitForTimeout(SETTLE_MS);
  const afterClick = await readVerticalState(page);
  assert.equal(afterClick.activePillKey, '2020');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(SETTLE_MS);
  const afterScroll = await readVerticalState(page);
  assert.ok(afterScroll.progress > 0, `Progress rail harus terupdate saat scroll (${afterScroll.progress})`);
  const revealed = await page.locator('.abt-htl-card.is-revealed').count();
  assert.ok(revealed > 0, 'Kartu harus mendapat kelas .is-revealed saat masuk viewport');
  await context.close();
});

test('9. Header timeline ID/EN dari settings dan fallback bawaan', async () => {
  for (const lang of ['id', 'en']) {
    const { context, page } = await openPage();
    await page.goto(`${BASE}/about?lang=${lang}`, { waitUntil: 'load' });
    const h = await readHeader(page);
    assert.ok(h.tagline && h.title && h.desc, `Header ${lang} harus terisi`);
    await context.close();

    const fx = await openFixture({ lang, timelineHeader: {} });
    const fh = await readHeader(fx.page);
    assert.equal(fh.tagline, HEADER_DEFAULTS[lang].tagline);
    assert.equal(fh.title, HEADER_DEFAULTS[lang].title);
    await fx.context.close();
  }
});

test('10. Live /about bebas console error dan anchor #sejarah berfungsi', async () => {
  const { context, page } = await openPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    const url = msg.location().url || '';
    if (msg.type() === 'error' && (url === '' || url.startsWith(BASE))) errors.push(msg.text());
  });
  await page.goto(`${BASE}/about#sejarah`, { waitUntil: 'load' });
  await page.waitForTimeout(SETTLE_MS);
  assert.deepEqual(errors, []);
  const top = await page.$eval('#sejarah', (el) => el.getBoundingClientRect().top);
  assert.ok(top >= -2 && top < 300, `#sejarah harus berada di atas viewport (top=${top})`);
  await context.close();
});

test('11. Admin menyimpan 6 field header timeline dan tampil di publik (nilai asli dipulihkan)', async () => {
  const { context, page } = await openPage();
  const fields = ['tagline_id', 'tagline_en', 'title_id', 'title_en', 'desc_id', 'desc_en']
    .map((k) => `about_timeline_${k}`);
  const stamp = Date.now().toString(36);
  const testValues = Object.fromEntries(fields.map((f) => [f, `T317 ${f.split('_').slice(2).join(' ')} ${stamp}`]));

  async function saveAbout(values) {
    await page.goto(`${BASE}/admin/about`, { waitUntil: 'load' });
    for (const [name, value] of Object.entries(values)) await page.fill(`[name="${name}"]`, value);
    await Promise.all([
      page.waitForURL(/\/admin\/about\?success=/),
      page.click('.about-sticky-actions button[type="submit"]')
    ]);
  }

  await page.goto(`${BASE}/admin/login`, { waitUntil: 'load' });
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await Promise.all([page.waitForURL(/\/admin\/(dashboard|about)/), page.click('.adm-login-btn-submit')]);

  await page.goto(`${BASE}/admin/about`, { waitUntil: 'load' });
  const original = {};
  for (const f of fields) original[f] = await page.inputValue(`[name="${f}"]`);

  try {
    await saveAbout(testValues);
    for (const lang of ['id', 'en']) {
      await page.goto(`${BASE}/about?lang=${lang}`, { waitUntil: 'load' });
      const h = await readHeader(page);
      assert.equal(h.tagline, testValues[`about_timeline_tagline_${lang}`]);
      assert.equal(h.title, testValues[`about_timeline_title_${lang}`]);
      assert.equal(h.desc, testValues[`about_timeline_desc_${lang}`]);
    }
  } finally {
    await saveAbout(original);
    await context.close();
  }
});

test('12. Bukti visual #sejarah di 320, 768, 1440', async () => {
  for (const width of [320, 768, 1440]) {
    const { context, page } = await openPage({ width, reducedMotion: 'reduce' });
    await page.goto(`${BASE}/about#sejarah`, { waitUntil: 'load' });
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible')));
    const file = path.join(SHOT_DIR, `t317-about-sejarah-${width}.png`);
    await page.locator('#sejarah').screenshot({ path: file });
    assert.ok(fs.statSync(file).size > 0);
    await context.close();
  }
});
