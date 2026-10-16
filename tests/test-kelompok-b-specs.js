/**
 * Test Suite: Kelompok B (Perubahan Spesifikasi: T-147, T-148, T-149)
 * Revisi Kontak & Footer v1
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

const rootDir = process.cwd();

console.log('--- STARTING TESTS: KELOMPOK B (T-147, T-148, T-149) ---');

// ----------------------------------------------------
// TEST 1: T-147 - WhatsApp Consultation Card Removal
// ----------------------------------------------------
console.log('\n[TEST 1] T-147: WhatsApp Consultation Card Removal');
const contactEjsPath = path.join(rootDir, 'views/public/contact.ejs');
const contactEjsContent = fs.readFileSync(contactEjsPath, 'utf8');

assert(
  !contactEjsContent.includes('Konsultasi WhatsApp Langsung'),
  'FAIL: contact.ejs still contains "Konsultasi WhatsApp Langsung" title'
);
assert(
  !contactEjsContent.includes('Chat WhatsApp Sales'),
  'FAIL: contact.ejs still contains "Chat WhatsApp Sales" CTA'
);
assert(
  !contactEjsContent.includes('wa-pulse'),
  'FAIL: contact.ejs still contains wa-pulse CSS classes'
);
assert(
  !contactEjsContent.includes('waNum'),
  'FAIL: contact.ejs still references unused waNum variable'
);

// Verify floating button is still intact in partials
const waBtnPath = path.join(rootDir, 'views/partials/whatsapp-btn.ejs');
assert(fs.existsSync(waBtnPath), 'FAIL: views/partials/whatsapp-btn.ejs must exist');
const waBtnContent = fs.readFileSync(waBtnPath, 'utf8');
assert(
  waBtnContent.includes('whatsapp') || waBtnContent.includes('wa.me'),
  'FAIL: whatsapp-btn.ejs must contain whatsapp trigger'
);

// Verify settings index still has whatsapp_number
const adminSettingsPath = path.join(rootDir, 'views/admin/settings/index.ejs');
const adminSettingsContent = fs.readFileSync(adminSettingsPath, 'utf8');
assert(
  adminSettingsContent.includes('whatsapp_number'),
  'FAIL: admin settings must still retain whatsapp_number'
);

console.log('✅ PASS: T-147 card removed cleanly while floating button & admin settings remain intact.');

// ----------------------------------------------------
// TEST 2: T-148 - Single Source of Truth Fax & Email
// ----------------------------------------------------
console.log('\n[TEST 2] T-148: Single Source of Truth Fax & Email');

// 2.1 Check Migration
const migrationPath = path.join(rootDir, 'database/migrations/010_revisi_kontak_footer_v1.sql');
assert(fs.existsSync(migrationPath), 'FAIL: migration 010 must exist');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');
assert(migrationSql.includes('office_email'), 'FAIL: migration must insert office_email');
assert(migrationSql.includes('factory_fax'), 'FAIL: migration must insert factory_fax');
assert(migrationSql.includes('factory_email'), 'FAIL: migration must insert factory_email');

// 2.2 Check Admin Settings Form
assert(
  adminSettingsContent.includes('name="office_email"'),
  'FAIL: admin settings must have name="office_email"'
);
assert(
  adminSettingsContent.includes('name="factory_fax"'),
  'FAIL: admin settings must have name="factory_fax"'
);
assert(
  adminSettingsContent.includes('name="factory_email"'),
  'FAIL: admin settings must have name="factory_email"'
);

// 2.3 Check Admin Controller Whitelist & Validation
const settingCtrlPath = path.join(rootDir, 'controllers/admin/settingController.js');
const settingCtrlContent = fs.readFileSync(settingCtrlPath, 'utf8');
assert(
  settingCtrlContent.includes('office_email'),
  'FAIL: settingController whitelist must include office_email'
);
assert(
  settingCtrlContent.includes('factory_fax'),
  'FAIL: settingController whitelist must include factory_fax'
);
assert(
  settingCtrlContent.includes('factory_email'),
  'FAIL: settingController whitelist must include factory_email'
);

// 2.4 Check Footer EJS
const footerEjsPath = path.join(rootDir, 'views/partials/footer.ejs');
const footerEjsContent = fs.readFileSync(footerEjsPath, 'utf8');

// Strip includes for testing footer rendering in isolation
const strippedFooter = footerEjsContent.replace(/<%[-=]\s*include\([^)]+\)\s*;?\s*%>/g, '');

// Case A: Full Settings Provided
const fullSettings = {
  office_name_id: 'Kantor Pusat (Jakarta)',
  office_address: 'Palmerah Selatan 30 A',
  office_phone: '+6221–53668626',
  office_fax: '+6221–53668648',
  office_email: 'jkt@euodoo.com',
  factory_name_id: 'Pabrik Manufaktur (Bandung)',
  factory_address: 'Cigondewah Kaler No. 88',
  factory_phone: '+6222–6012519',
  factory_fax: '+6222–6012520',
  factory_email: 'bdg@euodoo.com'
};

const renderedFooterFull = ejs.render(strippedFooter, {
  settings: fullSettings,
  currentLang: 'id',
  currentYear: 2026
});

// Assert full render
assert(renderedFooterFull.includes('+6221–53668626'), 'FAIL: phone format must be preserved as-is');
assert(renderedFooterFull.includes('+6221–53668648'), 'FAIL: office fax must be displayed');
assert(renderedFooterFull.includes('jkt@euodoo.com'), 'FAIL: office email must be displayed');
assert(renderedFooterFull.includes('+6222–6012520'), 'FAIL: factory fax must be displayed');
assert(renderedFooterFull.includes('bdg@euodoo.com'), 'FAIL: factory email must be displayed');
assert(renderedFooterFull.includes('tel:+622153668626'), 'FAIL: clean tel in href required');
assert(renderedFooterFull.includes('mailto:jkt@euodoo.com'), 'FAIL: mailto href required');

// Case B: Minimal Settings (Empty factory fax & email, empty office fax)
const minimalSettings = {
  office_name_id: 'Kantor Pusat (Jakarta)',
  office_address: 'Palmerah Selatan 30 A',
  office_phone: '+6221–53668626',
  office_fax: '',
  company_email: 'info@euodoo.com',
  office_email: '',
  factory_name_id: 'Pabrik Manufaktur (Bandung)',
  factory_address: 'Cigondewah Kaler No. 88',
  factory_phone: '+6222–6012519',
  factory_fax: '',
  factory_email: ''
};

const renderedFooterMin = ejs.render(strippedFooter, {
  settings: minimalSettings,
  currentLang: 'id',
  currentYear: 2026
});

assert(renderedFooterMin.includes('info@euodoo.com'), 'FAIL: office_email must fallback to company_email');
// Factory email must NOT fallback to company_email!
const bandungSection = renderedFooterMin.split('Pabrik Manufaktur (Bandung)')[1] || '';
assert(
  !bandungSection.includes('info@euodoo.com'),
  'FAIL: factory email must not fallback to company_email (zero fallback rule)'
);
assert(!bandungSection.includes('Faks:'), 'FAIL: no empty fax row in Bandung');
assert(!bandungSection.includes('Email:'), 'FAIL: no empty email row in Bandung');

// 2.5 Check Contact Page Rendering
const strippedContact = contactEjsContent.replace(/<%[-=]\s*include\([^)]+\)\s*;?\s*%>/g, '');
const renderedContactFull = ejs.render(strippedContact, {
  settings: fullSettings,
  currentLang: 'id',
  csrfToken: 'mock-token',
  t: (k) => k,
  products: [],
  selectedProduct: null,
  success: false,
  error: false,
  errorMsg: null,
  heroBanner: null,
  turnstileSiteKey: 'test-key'
});

assert(renderedContactFull.includes('+6221–53668648'), 'FAIL: office fax must render in contact');
assert(renderedContactFull.includes('jkt@euodoo.com'), 'FAIL: office email must render in contact');
assert(renderedContactFull.includes('+6222–6012520'), 'FAIL: factory fax must render in contact');
assert(renderedContactFull.includes('bdg@euodoo.com'), 'FAIL: factory email must render in contact');

const renderedContactMin = ejs.render(strippedContact, {
  settings: minimalSettings,
  currentLang: 'id',
  csrfToken: 'mock-token',
  t: (k) => k,
  products: [],
  selectedProduct: null,
  success: false,
  error: false,
  errorMsg: null,
  heroBanner: null,
  turnstileSiteKey: 'test-key'
});

const contactBdgSection = renderedContactMin.split('Pabrik Manufaktur (Bandung)')[1] || '';
assert(!contactBdgSection.includes('info@euodoo.com'), 'FAIL: contact Bandung factory email must have zero fallback');

console.log('✅ PASS: T-148 fax and email single source of truth & zero empty rows verified.');

// ----------------------------------------------------
// TEST 3: T-149 - Server-Side Form Validation & Security
// ----------------------------------------------------
console.log('\n[TEST 3] T-149: Server-Side Form Validation & Security');

const contactCtrlPath = path.join(rootDir, 'controllers/public/contactController.js');
const contactCtrlContent = fs.readFileSync(contactCtrlPath, 'utf8');

// Check length validations
assert(contactCtrlContent.includes('cleanName.length > 100'), 'FAIL: name max 100 validation missing');
assert(contactCtrlContent.includes('cleanCompany.length > 150'), 'FAIL: company max 150 validation missing');
assert(contactCtrlContent.includes('cleanEmail.length > 100'), 'FAIL: email max 100 validation missing');
assert(contactCtrlContent.includes('cleanQuantity.length > 100'), 'FAIL: quantity max 100 validation missing');
assert(contactCtrlContent.includes('cleanMessage.length > 3000'), 'FAIL: message max 3000 validation missing');

// Check phone regex
assert(
  contactCtrlContent.includes('/^[0-9\\s+\\-()]{7,30}$/'),
  'FAIL: phone regex /^[0-9\\s+\\-()]{7,30}$/ missing'
);

// Check product_id integer validation
assert(
  contactCtrlContent.includes('/^\\d+$/') && contactCtrlContent.includes('parseInt('),
  'FAIL: product_id positive integer validation missing'
);

// Check type whitelist
assert(
  contactCtrlContent.includes("['inquiry', 'partnership', 'general']"),
  'FAIL: validTypes whitelist missing'
);

// Check Turnstile verification
assert(
  contactCtrlContent.includes('verifyTurnstileToken'),
  'FAIL: Turnstile verification missing'
);

// Verify NO unescaped user inputs (<%-) in contact.ejs
const unescapedMatches = contactEjsContent.match(/<%-\s*(name|company|email|phone|quantity|message|errorMsg)\b/g);
assert(!unescapedMatches, `FAIL: Found unescaped user input: ${unescapedMatches}`);

console.log('✅ PASS: T-149 server-side validation & CSP/XSS compliance verified.');

console.log('\n🎉 ALL KELOMPOK B TESTS PASSED SUCCESSFULLY! 🎉\n');
