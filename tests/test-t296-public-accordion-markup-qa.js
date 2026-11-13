import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('T-296: Public Ticket Accordion EJS Template & Markup QA', async (t) => {
  const partialPath = path.join(rootDir, 'views/partials/about/ticket-accordion.ejs');
  const aboutPath = path.join(rootDir, 'views/public/about.ejs');

  await t.test('ticket-accordion.ejs conforms to conventions (size, no inline styles, no raw hex, no html comments)', () => {
    assert.ok(fs.existsSync(partialPath), 'ticket-accordion.ejs should exist');
    const content = fs.readFileSync(partialPath, 'utf8');
    const lines = content.split('\n');

    assert.ok(lines.length <= 100, `Lines count should be <= 100, got ${lines.length}`);
    assert.strictEqual(/style\s*=\s*["'][^"']*["']/i.test(content), false, 'Should have zero style="..." inline attributes');
    assert.strictEqual(/#[0-9a-fA-F]{3,8}\b/.test(content), false, 'Should have zero raw hex colors');
    assert.strictEqual(/<!--[\s\S]*?-->/.test(content), false, 'Should have zero HTML comments');
    assert.strictEqual(content.includes('—'), false, 'Should have zero em-dash characters per antislop R-02');
  });

  await t.test('about.ejs includes ticket-accordion.ejs and removes legacy inline styles from #core-values', () => {
    const aboutContent = fs.readFileSync(aboutPath, 'utf8');
    assert.ok(aboutContent.includes("include('../partials/about/ticket-accordion')"), 'about.ejs must include ticket-accordion partial');
    assert.strictEqual(aboutContent.includes('sec-values'), false, 'about.ejs should not contain legacy sec-values class');
    assert.strictEqual(aboutContent.includes('pillar-card'), false, 'about.ejs should not contain legacy pillar-card class');
    assert.ok(aboutContent.includes('/js/ticket-accordion.js'), 'about.ejs must reference ticket-accordion.js');
  });

  await t.test('SSR render of ticket-accordion.ejs produces correct markup, ARIA roles, and active panel', () => {
    const template = fs.readFileSync(partialPath, 'utf8');
    const dummyAbout = {
      values_bg_image: '/images/hero-factory.jpg',
      values_pill_id: 'Budaya Kerja',
      values_pill_en: 'Corporate Culture',
      values_subtitle_id: 'Nilai filosofis',
      values_subtitle_en: 'Philosophical values',
      values: [
        { letter: 'T', title_id: 'Takut Tuhan', title_en: 'Fear of God', desc_id: 'Desc T', desc_en: 'Desc T EN', image_url: '/img/t.jpg', icon_key: 'praying-hands' },
        { letter: 'I', title_id: 'Integritas', title_en: 'Integrity', desc_id: 'Desc I', desc_en: 'Desc I EN', image_url: '/img/i.jpg', icon_key: 'shield-check' },
        { letter: 'C', title_id: 'Komunikasi', title_en: 'Communication', desc_id: 'Desc C', desc_en: 'Desc C EN', image_url: '/img/c.jpg', icon_key: 'chat-dots' },
        { letter: 'K', title_id: 'Kasih', title_en: 'Love', desc_id: 'Desc K', desc_en: 'Desc K EN', image_url: '/img/k.jpg', icon_key: 'heart' },
        { letter: 'E', title_id: 'Luar Biasa', title_en: 'Excellence', desc_id: 'Desc E', desc_en: 'Desc E EN', image_url: '/img/e.jpg', icon_key: 'star' },
        { letter: 'T', title_id: 'Taat', title_en: 'Obedience', desc_id: 'Desc T2', desc_en: 'Desc T2 EN', image_url: '/img/t2.jpg', icon_key: 'handshake' }
      ]
    };

    const renderedHtml = ejs.render(template, {
      about: dummyAbout,
      ticketAcronym: 'T - I - C - K - E - T',
      lang: 'id',
      t: (key) => key
    }, {
      filename: partialPath
    });

    assert.ok(renderedHtml.includes('T - I - C - K - E - T'), 'Should render acronym in header');
    assert.ok(renderedHtml.includes('Budaya Kerja'), 'Should render pill in ID');
    assert.ok(renderedHtml.includes('abt-tkt-accordion'), 'Should render accordion container');
    assert.ok(renderedHtml.includes('class="abt-tkt-vert-line"'), 'Should render vertical lines flanking value title');

    assert.ok(renderedHtml.includes('id="abt-tkt-tab-2"'), 'Should render tab 2');
    assert.ok(renderedHtml.includes('aria-controls="abt-tkt-panel-2"'), 'Should render aria-controls for panel 2');
    assert.match(renderedHtml, /class="[^"]*abt-tkt-panel\s+is-active[^"]*"\s+id="abt-tkt-tab-2"/, 'Panel index 2 must have is-active class');

    assert.match(renderedHtml, /class="[^"]*abt-tkt-dot\s+is-active[^"]*"\s+data-dot-index="2"/, 'Dot index 2 must have is-active class');

    assert.strictEqual(renderedHtml.includes('Pelajari Lebih Lanjut'), false, 'Must not contain Pelajari Lebih Lanjut button');
    assert.strictEqual(renderedHtml.includes('abt-tkt-kicker'), false, 'Must not contain kicker');
    assert.strictEqual(renderedHtml.includes('abt-tkt-note'), false, 'Must not contain note');
    assert.ok(renderedHtml.includes('class="abt-tkt-img"'), 'Must contain abt-tkt-img');
  });
});

