import assert from 'assert';
import bannerModel from '../models/bannerModel.js';
import { pool } from '../config/database.js';

function isValidCtaUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length > 500) return false;

  const dangerousPatterns = /^(javascript:|data:|vbscript:|\/\/)/i;
  if (dangerousPatterns.test(trimmed)) {
    return false;
  }

  const isInternal = /^\/([a-zA-Z0-9\-_./?#=&%~]*)$/.test(trimmed) || /^#[a-zA-Z0-9\-_]+$/.test(trimmed);
  if (isInternal) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidCtaText(text) {
  if (!text || typeof text !== 'string') return true;
  return text.trim().length <= 100;
}

async function runT186Tests() {
  console.log('=== STARTING T-186 DUAL CTA BANNER TESTS ===');

  console.log('1. Testing URL Validation Logic:');
  const dangerousUrls = [
    'javascript:alert(1)',
    'JAVASCRIPT:alert("xss")',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox("hello")',
    '//attacker.com/evil',
    'ftp://example.com/file',
    'file:///etc/passwd'
  ];
  for (const url of dangerousUrls) {
    assert.strictEqual(isValidCtaUrl(url), false, `Dangerous URL should be rejected: ${url}`);
  }
  console.log('  1a. Dangerous URLs rejected: PASSED');

  const validUrls = [
    '/products',
    '/contact',
    '/products?cat=skincare&page=1',
    '#inquiry',
    '#kontak-kami',
    'https://wa.me/628112117123',
    'https://example.com/brochure.pdf',
    'http://test.local/demo',
    '',
    null,
    undefined
  ];
  for (const url of validUrls) {
    assert.strictEqual(isValidCtaUrl(url), true, `Valid URL should be accepted: ${url}`);
  }
  console.log('  1b. Valid internal and external URLs accepted: PASSED');

  const over500Url = 'https://example.com/' + 'a'.repeat(500);
  assert.strictEqual(isValidCtaUrl(over500Url), false, 'URL over 500 chars should be rejected');
  console.log('  1c. Over 500 characters URL rejected: PASSED');

  console.log('2. Testing Text Length Validation Logic:');
  assert.strictEqual(isValidCtaText('Hubungi Kami'), true);
  assert.strictEqual(isValidCtaText('a'.repeat(100)), true);
  assert.strictEqual(isValidCtaText('a'.repeat(101)), false);
  console.log('  2a. Text length <= 100 chars validation: PASSED');

  console.log('3. Testing Database CRUD with Dual CTA Fields:');
  let testBannerId = null;
  try {
    testBannerId = await bannerModel.create({
      title_id: 'Test Banner Hero Dual CTA',
      title_en: 'Test Banner Hero Dual CTA EN',
      caption_id: 'Subtitle ID Uji Coba',
      caption_en: 'Subtitle EN Test',
      media_type: 'image',
      file_url: '/uploads/banners/test-banner.webp',
      cta_text_id: 'Konsultasi Sekarang',
      cta_text_en: 'Consult Now',
      cta_url: '/contact',
      cta_secondary_text_id: 'Lihat Produk',
      cta_secondary_text_en: 'View Products',
      cta_secondary_url: '/products',
      sort_order: 99,
      is_active: false
    });

    assert.ok(testBannerId, 'Banner should be inserted with insertId');
    console.log('  3a. Banner created with secondary CTA, ID:', testBannerId);

    const banner = await bannerModel.findById(testBannerId);
    assert.strictEqual(banner.title_id, 'Test Banner Hero Dual CTA');
    assert.strictEqual(banner.cta_text_id, 'Konsultasi Sekarang');
    assert.strictEqual(banner.cta_url, '/contact');
    assert.strictEqual(banner.cta_secondary_text_id, 'Lihat Produk');
    assert.strictEqual(banner.cta_secondary_text_en, 'View Products');
    assert.strictEqual(banner.cta_secondary_url, '/products');
    console.log('  3b. Secondary CTA fields retrieved & normalized: PASSED');

    const updateSuccess = await bannerModel.update(testBannerId, {
      cta_secondary_text_id: 'Hubungi WhatsApp',
      cta_secondary_text_en: 'WhatsApp Us',
      cta_secondary_url: 'https://wa.me/628112117123'
    });
    assert.strictEqual(updateSuccess, true, 'Banner update should succeed');

    const updatedBanner = await bannerModel.findById(testBannerId);
    assert.strictEqual(updatedBanner.cta_secondary_text_id, 'Hubungi WhatsApp');
    assert.strictEqual(updatedBanner.cta_secondary_text_en, 'WhatsApp Us');
    assert.strictEqual(updatedBanner.cta_secondary_url, 'https://wa.me/628112117123');
    console.log('  3c. Secondary CTA update persisted: PASSED');

    const resetSuccess = await bannerModel.update(testBannerId, {
      cta_secondary_text_id: null,
      cta_secondary_text_en: null,
      cta_secondary_url: null
    });
    assert.strictEqual(resetSuccess, true, 'Banner secondary CTA reset should succeed');

    const resetBanner = await bannerModel.findById(testBannerId);
    assert.strictEqual(resetBanner.cta_secondary_text_id, '');
    assert.strictEqual(resetBanner.cta_secondary_text_en, '');
    assert.strictEqual(resetBanner.cta_secondary_url, '');
    console.log('  3d. Secondary CTA reset to empty values: PASSED');

    console.log('=== ALL T-186 DUAL CTA BANNER TESTS PASSED! ===');
  } finally {
    if (testBannerId) {
      await bannerModel.delete(testBannerId);
      console.log('Cleaned up test banner ID:', testBannerId);
    }
    await pool.end();
  }
}

runT186Tests()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
