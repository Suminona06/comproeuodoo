import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { parseAndValidateGoogleMapsUrl } from '../controllers/admin/settingController.js';

console.log('--- STARTING TESTS FOR T-142 & T-143 (SPEC Kelompok B) ---');

// 1. Test Google Maps URL parser and validator
console.log('\n[TEST 1] Testing Google Maps URL parser and validator (T-142)...');

// 1a. Clean direct URL
const cleanUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126748!2d107.57!3d-6.90!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1';
assert.strictEqual(parseAndValidateGoogleMapsUrl(cleanUrl), cleanUrl);
console.log('  1a. Direct valid HTTPS Google Maps embed URL: PASSED');

// 1b. Full iframe tag with double quotes
const iframeDouble = `<iframe src="${cleanUrl}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;
assert.strictEqual(parseAndValidateGoogleMapsUrl(iframeDouble), cleanUrl);
console.log('  1b. Full <iframe> tag with double quotes: PASSED');

// 1c. Full iframe tag with single quotes
const iframeSingle = `<iframe src='${cleanUrl}' width="100%"></iframe>`;
assert.strictEqual(parseAndValidateGoogleMapsUrl(iframeSingle), cleanUrl);
console.log('  1c. Full <iframe> tag with single quotes: PASSED');

// 1d. Empty or whitespace input
assert.strictEqual(parseAndValidateGoogleMapsUrl(''), '');
assert.strictEqual(parseAndValidateGoogleMapsUrl('   '), '');
console.log('  1d. Empty input returns empty string: PASSED');

// 1e. Rejection of insecure HTTP
assert.throws(() => {
  parseAndValidateGoogleMapsUrl('http://www.google.com/maps/embed?pb=123');
}, /HTTPS/, 'Must reject non-HTTPS Google Maps URL');
console.log('  1e. Insecure HTTP rejection: PASSED');

// 1f. Rejection of malicious/external domain
assert.throws(() => {
  parseAndValidateGoogleMapsUrl('https://evil-phishing.com/maps/embed?pb=123');
}, /resmi Google Maps/, 'Must reject non-Google domain');
console.log('  1f. External domain rejection: PASSED');

// 1g. Rejection of non-maps path on google.com
assert.throws(() => {
  parseAndValidateGoogleMapsUrl('https://www.google.com/search?q=maps');
}, /google\.com\/maps\/embed/, 'Must reject non-maps Google path');
console.log('  1g. Non-maps path rejection: PASSED');

// 2. Test Views & Template Rendering for Footer & Contact
console.log('\n[TEST 2] Testing EJS template rendering for T-142 (Single Source Dual Offices)...');

const footerPath = path.resolve('views/partials/footer.ejs');
const footerContent = fs.readFileSync(footerPath, 'utf8')
  .replace(/<%- include\(['"]cta-global['"]\)(?:;)? %>/g, '<!-- mock cta -->')
  .replace(/<%- include\(['"]whatsapp-btn['"]\)(?:;)? %>/g, '<!-- mock wa -->')
  .replace(/<%- include\(['"].\/(?:whatsapp-btn)['"]\)(?:;)? %>/g, '<!-- mock wa -->');

const mockSettings = {
  office_name_id: 'Kantor Pusat PT Euodoo (Jakarta)',
  office_name_en: 'PT Euodoo Head Office (Jakarta)',
  office_address: 'Gedung Wisma 46 Kota BNI Lt. 12, Jakarta Pusat 10220',
  office_phone: '(021) 574-8899',
  company_phone: '(021) 574-8899',
  office_fax: '+6221-574-8890',
  factory_name_id: 'Pabrik Utama PT Euodoo (Bandung)',
  factory_name_en: 'PT Euodoo Main Plant (Bandung)',
  factory_address: 'Kawasan Industri Cigondewah No. 99, Kota Bandung 40214',
  factory_phone: '(022) 7788-9900',
  social_linkedin_visible: '1',
  social_linkedin_url: 'https://linkedin.com/company/pteuodoo-custom',
  social_instagram_visible: '0',
  social_instagram_url: 'https://instagram.com/pteuodoo-hidden',
  social_facebook_visible: '1',
  social_facebook_url: 'https://facebook.com/pteuodoo-custom',
  social_youtube_visible: '1',
  social_youtube_url: 'https://youtube.com/@pteuodoo-custom',
  google_maps_embed: cleanUrl
};

// Render footer in ID
const footerRenderedId = ejs.render(footerContent, {
  settings: mockSettings,
  currentLang: 'id',
  currentYear: 2026
});

assert.ok(footerRenderedId.includes('Kantor Pusat PT Euodoo (Jakarta)'), 'Footer must render dynamic office_name_id');
assert.ok(footerRenderedId.includes('Gedung Wisma 46 Kota BNI Lt. 12'), 'Footer must render dynamic office_address');
assert.ok(footerRenderedId.includes('tel:0215748899'), 'Footer must render sanitized office telephone link');
assert.ok(footerRenderedId.includes('Pabrik Utama PT Euodoo (Bandung)'), 'Footer must render dynamic factory_name_id');
assert.ok(footerRenderedId.includes('Kawasan Industri Cigondewah No. 99'), 'Footer must render dynamic factory_address');
assert.ok(footerRenderedId.includes('tel:02277889900'), 'Footer must render sanitized factory telephone link');
console.log('  2a. Footer dual location rendering (ID): PASSED');

// Render footer in EN
const footerRenderedEn = ejs.render(footerContent, {
  settings: mockSettings,
  currentLang: 'en',
  currentYear: 2026
});

assert.ok(footerRenderedEn.includes('PT Euodoo Head Office (Jakarta)'), 'Footer must render dynamic office_name_en');
assert.ok(footerRenderedEn.includes('PT Euodoo Main Plant (Bandung)'), 'Footer must render dynamic factory_name_en');
console.log('  2b. Footer dual location rendering (EN): PASSED');

// 3. Test T-143: Social Media Toggles in Footer
console.log('\n[TEST 3] Testing Social Media Toggles (T-143)...');

// In mockSettings: LinkedIn=1, Instagram=0, Facebook=1, YouTube=1
assert.ok(footerRenderedId.includes('https://linkedin.com/company/pteuodoo-custom'), 'LinkedIn should render when toggle is 1');
assert.ok(!footerRenderedId.includes('pteuodoo-hidden'), 'Instagram should NOT render when toggle is 0');
assert.ok(footerRenderedId.includes('https://facebook.com/pteuodoo-custom'), 'Facebook should render when toggle is 1');
assert.ok(footerRenderedId.includes('https://youtube.com/@pteuodoo-custom'), 'YouTube should render when toggle is 1');
console.log('  3a. Selective toggle rendering: PASSED');

// Test all toggles OFF -> social-row container should not exist
const mockSettingsAllOff = {
  ...mockSettings,
  social_linkedin_visible: '0',
  social_instagram_visible: '0',
  social_facebook_visible: '0',
  social_youtube_visible: '0'
};

const footerAllOff = ejs.render(footerContent, {
  settings: mockSettingsAllOff,
  currentLang: 'id',
  currentYear: 2026
});

assert.ok(!footerAllOff.includes('class="social-row"'), 'Empty/all-hidden socials must omit social-row');
console.log('  3b. All toggles disabled omits social-row: PASSED');

// Test non-https URL is filtered out
const mockSettingsInsecure = {
  ...mockSettings,
  social_linkedin_url: 'http://linkedin.com/insecure',
  social_linkedin_visible: '1'
};

const footerInsecure = ejs.render(footerContent, {
  settings: mockSettingsInsecure,
  currentLang: 'id',
  currentYear: 2026
});

assert.ok(!footerInsecure.includes('http://linkedin.com/insecure'), 'Non-https social link must not be rendered');
console.log('  3c. Insecure non-https social link ignored: PASSED');

// 4. Test Contact Page Template Binding
console.log('\n[TEST 4] Testing Contact Page SSR template binding (T-142)...');

const contactPath = path.resolve('views/public/contact.ejs');
const contactContent = fs.readFileSync(contactPath, 'utf8')
  .replace(/<%- include\(['"]\.\.\/partials\/header['"]\)(?:;)? %>/g, '<!-- mock header -->')
  .replace(/<%- include\(['"]\.\.\/partials\/navbar['"]\)(?:;)? %>/g, '<!-- mock navbar -->')
  .replace(/<%- include\(['"]\.\.\/partials\/footer['"]\)(?:;)? %>/g, '<!-- mock footer -->');

const mockT = (key) => key;

const contactRendered = ejs.render(contactContent, {
  settings: mockSettings,
  currentLang: 'id',
  t: mockT,
  csrfToken: 'test-csrf-token',
  turnstileSiteKey: '',
  products: [],
  selectedProduct: null
});

assert.ok(contactRendered.includes('Kantor Pusat PT Euodoo (Jakarta)'), 'Contact page must render dynamic office name');
assert.ok(contactRendered.includes('Gedung Wisma 46 Kota BNI Lt. 12'), 'Contact page must render dynamic office address');
assert.ok(contactRendered.includes('tel:0215748899'), 'Contact page must render sanitized office phone link');
assert.ok(contactRendered.includes('tel:02277889900'), 'Contact page must render sanitized factory phone link');
assert.ok(contactRendered.includes(cleanUrl), 'Contact page must render clean Google Maps embed URL');
console.log('  4a. Contact page dual cards and maps embed bound to settings: PASSED');

console.log('\n--- ALL T-142 & T-143 TESTS PASSED SUCCESSFULLY! ---');
