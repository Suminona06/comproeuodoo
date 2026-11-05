import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TICKET_ICONS, TICKET_ICON_KEYS, isValidTicketIconKey, getTicketIconSvg } from '../utils/ticketIcons.js';
import aboutModel from '../models/aboutModel.js';

describe('T-294: Ticket Icons Whitelist & Data Model Normalizer', () => {
  it('should provide exactly 6 valid SVG icons matching reference design', () => {
    assert.equal(TICKET_ICON_KEYS.length, 6, 'Must define exactly 6 icon keys');
    const expectedKeys = ['praying-hands', 'shield-check', 'chat-dots', 'heart', 'star', 'handshake'];
    expectedKeys.forEach((key) => {
      assert.ok(isValidTicketIconKey(key), `Key "${key}" must be valid in whitelist`);
      const icon = TICKET_ICONS[key];
      assert.ok(icon, `Icon object for "${key}" must exist`);
      assert.ok(icon.label_id, `label_id for "${key}" must exist`);
      assert.ok(icon.label_en, `label_en for "${key}" must exist`);
      assert.ok(icon.svg.includes('viewBox="0 0 24 24"'), `SVG for "${key}" must have 24x24 viewBox`);
      assert.ok(icon.svg.includes('stroke="currentColor"'), `SVG for "${key}" must use stroke currentColor`);
      assert.ok(!icon.svg.includes('style='), `SVG for "${key}" must not have inline style`);
      assert.ok(!icon.svg.includes('#'), `SVG for "${key}" must not have raw hex color`);
    });
  });

  it('should return SVG with customized class name via getTicketIconSvg', () => {
    const svgWithClass = getTicketIconSvg('heart', 'abt-tkt-custom-icon');
    assert.ok(svgWithClass.includes('class="abt-tkt-custom-icon"'), 'Custom className must be injected into svg tag');
    const defaultSvg = getTicketIconSvg('unknown-key');
    assert.ok(defaultSvg.includes('viewBox="0 0 24 24"'), 'Fallback to praying-hands SVG when key unknown');
  });

  it('should provide complete 6-pillar defaults in aboutModel.getDefaults()', () => {
    const defaults = aboutModel.getDefaults();
    assert.ok(Array.isArray(defaults.values), 'defaults.values must be an array');
    assert.equal(defaults.values.length, 6, 'defaults.values must contain 6 items');
    
    assert.equal(defaults.values_pill_id, 'Budaya Kerja');
    assert.equal(defaults.values_pill_en, 'Corporate Culture');
    assert.ok(defaults.values_subtitle_id);
    assert.ok(defaults.values_subtitle_en);
    assert.ok(defaults.values_bg_image);

    const expectedLetters = ['T', 'I', 'C', 'K', 'E', 'T'];
    defaults.values.forEach((v, idx) => {
      assert.equal(v.letter, expectedLetters[idx], `Pillar ${idx + 1} letter mismatch`);
      assert.ok(v.title_id, `title_id required on pillar ${idx + 1}`);
      assert.ok(v.title_en, `title_en required on pillar ${idx + 1}`);
      assert.ok(v.desc_id, `desc_id required on pillar ${idx + 1}`);
      assert.ok(v.desc_en, `desc_en required on pillar ${idx + 1}`);
      assert.ok(v.image_url, `image_url required on pillar ${idx + 1}`);
      assert.ok(isValidTicketIconKey(v.icon_key), `icon_key "${v.icon_key}" must be in whitelist on pillar ${idx + 1}`);
      assert.equal(v.sort_order, idx + 1, `sort_order must match 1-based index on pillar ${idx + 1}`);
    });
  });

  it('should normalize legacy JSON data in getAboutData() with graceful fallbacks', async () => {
    const aboutData = await aboutModel.getAboutData();
    assert.ok(aboutData.values, 'aboutData.values must exist');
    assert.equal(aboutData.values.length, 6, 'aboutData.values must have 6 items');
    assert.ok(aboutData.values_bg_image, 'values_bg_image must be present');
    assert.ok(aboutData.values_pill_id, 'values_pill_id must be present');
    assert.ok(aboutData.values_pill_en, 'values_pill_en must be present');
    assert.ok(aboutData.values_subtitle_id, 'values_subtitle_id must be present');
    assert.ok(aboutData.values_subtitle_en, 'values_subtitle_en must be present');

    aboutData.values.forEach((v, idx) => {
      assert.ok(v.letter, `Pillar ${idx} letter must exist`);
      assert.ok(v.image_url, `Pillar ${idx} image_url must exist`);
      assert.ok(v.icon_key, `Pillar ${idx} icon_key must exist`);
      assert.ok(isValidTicketIconKey(v.icon_key), `Pillar ${idx} icon_key must be valid`);
      assert.ok(typeof v.sort_order === 'number', `Pillar ${idx} sort_order must be number`);
    });
  });
});

