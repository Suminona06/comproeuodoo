import assert from 'assert';
import {
  FOOTER_DESC_MAX_LEN,
  FOOTER_LABEL_MAX_LEN,
  FOOTER_NAV_MAX_ITEMS,
  FOOTER_URL_MAX_LEN,
  isAllowedFooterUrl,
  isExternalFooterUrl,
  validateFooterDescriptions,
  parseAndValidateFooterNavLinks,
  buildSettingUpdates
} from '../services/settingService.js';
import settingController from '../controllers/admin/settingController.js';
import {
  settingsMiddleware,
  clearSettingsCache,
  normalizeFooterNavLinks,
  normalizeFooterSettings
} from '../middleware/settingsMiddleware.js';

console.log('--- Testing T-323 Footer Setting Service & Middleware ---');

// 1. Deskripsi footer (terpisah dari meta_description_*)
assert.deepStrictEqual(validateFooterDescriptions({}), {});
const exact350 = 'a'.repeat(FOOTER_DESC_MAX_LEN);
const validatedDesc = validateFooterDescriptions({
  footer_desc_id: `  ${exact350}  `,
  footer_desc_en: '  English summary  ',
  meta_description_id: 'Harus diabaikan'
});
assert.strictEqual(validatedDesc.footer_desc_id, exact350);
assert.strictEqual(validatedDesc.footer_desc_en, 'English summary');
assert.strictEqual(validatedDesc.meta_description_id, undefined);

assert.throws(
  () => validateFooterDescriptions({ footer_desc_id: 'a'.repeat(FOOTER_DESC_MAX_LEN + 1) }),
  /maksimal 350 karakter/
);
assert.throws(
  () => validateFooterDescriptions({ footer_desc_en: 'b'.repeat(FOOTER_DESC_MAX_LEN + 1) }),
  /maksimal 350 karakter/
);
console.log('✓ 1. validateFooterDescriptions passed (0/350/351 & isolated from SEO)');

// 2. Whitelist URL & isExternal
const allowedUrls = [
  ['/products', false],
  ['/about#sertifikasi', false],
  ['#kontak', false],
  ['https://euodoo.co.id/katalog', true],
  ['http://example.com/promo?v=1', true]
];
for (const [url, expectedExternal] of allowedUrls) {
  assert.strictEqual(isAllowedFooterUrl(url), true, `Expected allowed: ${url}`);
  assert.strictEqual(isExternalFooterUrl(url), expectedExternal, `External mismatch: ${url}`);
}

const blockedUrls = [
  '',
  '   ',
  'javascript:alert(1)',
  'JavaScript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  '//evil.com/phish',
  '///evil.com',
  '/\\evil.com',
  'about',
  'https://',
  'https:euodoo.co.id',
  'https://euodoo.co.id\njavascript:alert(1)',
  `/${'x'.repeat(FOOTER_URL_MAX_LEN)}`
];
for (const badUrl of blockedUrls) {
  assert.strictEqual(isAllowedFooterUrl(badUrl), false, `Expected blocked: ${badUrl}`);
}
console.log('✓ 2. isAllowedFooterUrl & isExternalFooterUrl whitelist passed');

// 3. Repeater 0, 4, 5 item & batasan field
assert.strictEqual(parseAndValidateFooterNavLinks(null), '[]');
assert.strictEqual(parseAndValidateFooterNavLinks(''), '[]');
assert.strictEqual(parseAndValidateFooterNavLinks('[]'), '[]');
assert.strictEqual(parseAndValidateFooterNavLinks([]), '[]');

const validFour = [
  { label_id: '<b>Produk</b>', label_en: 'Products', url: '/products' },
  { label_id: 'Tentang Kami', label_en: 'About Us', url: '/about#sertifikasi' },
  { label_id: 'Ke Atas', label_en: 'Back to Top', url: '#top' },
  { label_id: 'Katalog', label_en: 'Catalog', url: 'https://euodoo.co.id/catalog' }
];
const parsedFour = JSON.parse(parseAndValidateFooterNavLinks(JSON.stringify(validFour)));
assert.strictEqual(parsedFour.length, FOOTER_NAV_MAX_ITEMS);
assert.strictEqual(parsedFour[0].label_id, 'Produk');
assert.strictEqual(parsedFour[3].url, 'https://euodoo.co.id/catalog');

const invalidFive = [...validFour, { label_id: 'Ekstra', label_en: 'Extra', url: '/contact' }];
assert.throws(
  () => parseAndValidateFooterNavLinks(invalidFive),
  /Maksimal 4 tautan menu footer/
);
assert.throws(
  () => parseAndValidateFooterNavLinks([{ label_id: '', label_en: 'Test', url: '/products' }]),
  /Label \(ID\).*wajib diisi/
);
assert.throws(
  () => parseAndValidateFooterNavLinks([{ label_id: 'a'.repeat(FOOTER_LABEL_MAX_LEN + 1), label_en: 'Test', url: '/products' }]),
  /maksimal 80 karakter/
);
assert.throws(
  () => parseAndValidateFooterNavLinks([{ label_id: 'Bad', label_en: 'Bad', url: 'javascript:alert(1)' }]),
  /tidak valid/
);
assert.throws(
  () => parseAndValidateFooterNavLinks('{bad_json'),
  /Format data tautan menu footer tidak valid/
);
console.log('✓ 3. parseAndValidateFooterNavLinks (0/4/5, length, XSS/URL checks) passed');

// 4. Sanitasi ulang middleware (anti JSON rusak, >4 item, URL berbahaya)
assert.deepStrictEqual(normalizeFooterNavLinks('{corrupt_json'), []);
assert.deepStrictEqual(normalizeFooterNavLinks('{"not":"array"}'), []);

const mixedDbPayload = JSON.stringify([
  { label_id: 'Menu 1', label_en: 'Menu 1 EN', url: '/products' },
  { label_id: 'XSS', label_en: 'XSS', url: 'javascript:alert(1)' },
  { label_id: 'ProtoRel', label_en: 'ProtoRel', url: '//evil.com' },
  { label_id: 'Menu 2', label_en: 'Menu 2 EN', url: 'https://euodoo.co.id' },
  { label_id: 'Menu 3', label_en: 'Menu 3 EN', url: '/about' },
  { label_id: 'Menu 4', label_en: 'Menu 4 EN', url: '#top' },
  { label_id: 'Menu 5', label_en: 'Menu 5 EN', url: '/contact' }
]);
const normalizedNav = normalizeFooterNavLinks(mixedDbPayload);
assert.strictEqual(normalizedNav.length, 4);
assert.strictEqual(normalizedNav[0].isExternal, false);
assert.strictEqual(normalizedNav[1].isExternal, true);
assert.strictEqual(normalizedNav[3].url, '#top');

const mockSettingsObj = {
  footer_desc_id: `  ${'z'.repeat(400)} `,
  footer_desc_en: '  Valid EN  ',
  footer_nav_links_json: mixedDbPayload
};
const navFromNormalize = normalizeFooterSettings(mockSettingsObj);
assert.strictEqual(mockSettingsObj.footer_desc_id.length, FOOTER_DESC_MAX_LEN);
assert.strictEqual(mockSettingsObj.footer_desc_en, 'Valid EN');
assert.strictEqual(navFromNormalize.length, 4);
console.log('✓ 4. normalizeFooterNavLinks & normalizeFooterSettings defensive fallback passed');

// 5. buildSettingUpdates dry-run & settingsMiddleware integration
const updates = await buildSettingUpdates(
  {
    body: {
      footer_desc_id: '  Deskripsi ID baru  ',
      footer_desc_en: '  New EN description  ',
      footer_nav_links_json: JSON.stringify(validFour)
    }
  },
  ['company_name']
);
assert.strictEqual(updates.footer_desc_id, 'Deskripsi ID baru');
assert.strictEqual(updates.footer_desc_en, 'New EN description');
assert.strictEqual(JSON.parse(updates.footer_nav_links_json).length, 4);

clearSettingsCache();
const mockRes = { locals: {} };
let nextCalled = false;
await settingsMiddleware({}, mockRes, () => {
  nextCalled = true;
});
assert.strictEqual(nextCalled, true);
assert.ok(Array.isArray(mockRes.locals.footerNavLinks));
assert.ok(mockRes.locals.footerNavLinks.length <= FOOTER_NAV_MAX_ITEMS);
assert.strictEqual(typeof mockRes.locals.settings.footer_desc_id, 'string');
assert.strictEqual(typeof mockRes.locals.settings.footer_desc_en, 'string');

// 6. settingController.update menolak payload footer berbahaya tanpa mutasi DB
let errRedirect = '';
await settingController.update(
  {
    body: {
      footer_nav_links_json: JSON.stringify([
        { label_id: 'X', label_en: 'X', url: 'javascript:alert(1)' }
      ])
    },
    user: { email: 'superadmin@euodoo.com' }
  },
  { redirect: (url) => { errRedirect = url; } }
);
assert.ok(errRedirect.includes('error='), 'Invalid footer URL must redirect with error');

let descErrRedirect = '';
await settingController.update(
  {
    body: { footer_desc_id: 'x'.repeat(FOOTER_DESC_MAX_LEN + 1) },
    user: { email: 'superadmin@euodoo.com' }
  },
  { redirect: (url) => { descErrRedirect = url; } }
);
assert.ok(descErrRedirect.includes('error='), 'Oversized footer_desc_id must redirect with error');
console.log('✓ 5. buildSettingUpdates, settingController guardrails & settingsMiddleware integration passed');

console.log('\n--- ALL T-323 TESTS PASSED ---');
process.exit(0);
