import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { aboutController } from '../controllers/admin/aboutController.js';
import aboutModel from '../models/aboutModel.js';
import { TICKET_ICON_KEYS, isValidTicketIconKey } from '../utils/ticketIcons.js';

describe('T-295: Admin Ticket CMS Form & Controller Validation', () => {
  it('should verify tab-nilai.ejs and tab-nilai-card.ejs comply with conventions (<100 lines, zero inline styles/hex)', () => {
    const tabNilaiPath = path.resolve('views/admin/about/partials/tab-nilai.ejs');
    const tabCardPath = path.resolve('views/admin/about/partials/tab-nilai-card.ejs');

    assert.ok(fs.existsSync(tabNilaiPath), 'tab-nilai.ejs must exist');
    assert.ok(fs.existsSync(tabCardPath), 'tab-nilai-card.ejs must exist');

    const tabNilaiContent = fs.readFileSync(tabNilaiPath, 'utf8');
    const tabCardContent = fs.readFileSync(tabCardPath, 'utf8');

    const tabNilaiLines = tabNilaiContent.split('\n').length;
    const tabCardLines = tabCardContent.split('\n').length;

    assert.ok(tabNilaiLines <= 100, `tab-nilai.ejs has ${tabNilaiLines} lines (must be <= 100)`);
    assert.ok(tabCardLines <= 100, `tab-nilai-card.ejs has ${tabCardLines} lines (must be <= 100)`);

    assert.ok(!tabNilaiContent.includes('style='), 'tab-nilai.ejs must not contain inline style=""');
    assert.ok(!tabCardContent.includes('style='), 'tab-nilai-card.ejs must not contain inline style=""');

    assert.ok(!/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/.test(tabNilaiContent), 'tab-nilai.ejs must not contain raw hex');
    assert.ok(!/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/.test(tabCardContent), 'tab-nilai-card.ejs must not contain raw hex');

    assert.ok(tabNilaiContent.includes('about_values_bg_image'), 'Must include about_values_bg_image input');
    assert.ok(tabNilaiContent.includes('about_values_pill_id'), 'Must include about_values_pill_id input');
    assert.ok(tabNilaiContent.includes('about_values_subtitle_id'), 'Must include about_values_subtitle_id input');
    assert.ok(tabCardContent.includes('val_letter_'), 'Must include val_letter input');
    assert.ok(tabCardContent.includes('val_icon_key_'), 'Must include val_icon_key select');
    assert.ok(tabCardContent.includes('val_image_url_'), 'Must include val_image_url input');
    assert.ok(tabCardContent.includes('data-eu-dropdown'), 'Dropdown must have data-eu-dropdown');
  });

  it('should render admin/about/index with ticketIcons and ticketIconKeys in aboutController.index', async () => {
    let renderedView = '';
    let renderedData = null;

    const req = { query: {} };
    const res = {
      locals: { csrfToken: 'mock-csrf-token' },
      render(view, data) {
        renderedView = view;
        renderedData = data;
      },
      redirect() {}
    };

    await aboutController.index(req, res);

    assert.equal(renderedView, 'admin/about/index');
    assert.ok(renderedData, 'Render data must be provided');
    assert.ok(renderedData.about, 'about data must be provided');
    assert.ok(renderedData.ticketIcons, 'ticketIcons dictionary must be provided');
    assert.ok(Array.isArray(renderedData.ticketIconKeys), 'ticketIconKeys array must be provided');
    assert.equal(renderedData.ticketIconKeys.length, 6, 'Must provide 6 icon keys');
  });

  it('should validate and sanitize values payload in aboutController.update', async () => {
    let capturedPayload = null;

    // Spy on aboutModel.updateAboutData
    const originalUpdate = aboutModel.updateAboutData;
    aboutModel.updateAboutData = async (payload) => {
      capturedPayload = payload;
      return true;
    };

    try {
      const req = {
        body: {
          about_values_bg_image: '/images/hero-factory.jpg',
          about_values_pill_id: 'Nilai Inti Kita',
          about_values_pill_en: 'Our Core Pillars',
          about_values_subtitle_id: 'Prinsip yang mengarahkan kami',
          about_values_subtitle_en: 'Principles guiding us',
          // Pillar 1: Valid
          val_letter_T: 'T',
          val_icon_key_T: 'praying-hands',
          val_image_url_T: '/images/hero-factory.jpg',
          val_title_id_T: 'Takut Tuhan',
          val_title_en_T: 'Fear of God',
          val_desc_id_T: 'Landasan etika spiritual.',
          val_desc_en_T: 'Spiritual foundation.',
          // Pillar 2: Custom letter & XSS attempt in icon_key & invalid image
          val_letter_I: 'Z',
          val_icon_key_I: 'malicious-xss-script',
          val_image_url_I: 'https://evil.com/phishing.jpg',
          val_title_id_I: 'Kejujuran',
          val_title_en_I: 'Honesty',
          val_desc_id_I: 'Selalu konsisten.',
          val_desc_en_I: 'Always consistent.'
        }
      };

      let redirectedUrl = '';
      const res = {
        redirect(url) {
          redirectedUrl = url;
        }
      };

      await aboutController.update(req, res);

      assert.ok(redirectedUrl.includes('success'), 'Must redirect to success url');
      assert.ok(capturedPayload, 'updateAboutData must be called with payload');
      assert.equal(capturedPayload.about_values_pill_id, 'Nilai Inti Kita');
      assert.equal(capturedPayload.about_values_bg_image, '/images/hero-factory.jpg');

      assert.ok(Array.isArray(capturedPayload.values), 'values must be an array');
      assert.equal(capturedPayload.values.length, 6, 'values must have 6 items');

      // Pillar 1 verified
      const p1 = capturedPayload.values[0];
      assert.equal(p1.letter, 'T');
      assert.equal(p1.icon_key, 'praying-hands');
      assert.equal(p1.image_url, '/images/hero-factory.jpg');

      // Pillar 2 verified: letter Z accepted, malicious icon rejected & fallback used, evil URL rejected & fallback used
      const p2 = capturedPayload.values[1];
      assert.equal(p2.letter, 'Z');
      assert.ok(isValidTicketIconKey(p2.icon_key), 'Invalid icon_key must fallback to valid whitelist icon');
      assert.ok(p2.image_url.startsWith('/images/') || p2.image_url.startsWith('/uploads/'), 'Invalid image must fallback to safe path');
    } finally {
      aboutModel.updateAboutData = originalUpdate;
    }
  });
});

