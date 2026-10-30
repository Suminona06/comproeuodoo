import assert from 'assert';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

console.log('--- Testing Admin Settings EJS Render (T-240) ---');

const templatePath = path.resolve('views/admin/settings/index.ejs');
const templateStr = fs.readFileSync(templatePath, 'utf8');

const mockSettings = {
  office_card_visible: '1',
  factory_card_visible: '0',
  whatsapp_number: '6281234567890',
  whatsapp_numbers_json: JSON.stringify([
    { number: '6281234567890', formatted: '6281234567890', label: 'Sales Retail', percentage: 40 },
    { number: '6289876543210', formatted: '6289876543210', label: 'Sales Industri', percentage: 60 }
  ]),
  social_linkedin_visible: '1',
  social_instagram_visible: '1',
  social_facebook_visible: '0',
  social_youtube_visible: '1'
};

const rendered = ejs.render(templateStr, {
  title: 'Pengaturan Situs',
  pageTitle: 'Pengaturan Situs',
  activeNav: 'settings',
  settings: mockSettings,
  error: null,
  success: null,
  csrfToken: 'test_csrf_token_xyz',
  currentYear: 2026,
  user: { email: 'superadmin@euodoo.com', role: 'superadmin' }
}, {
  filename: templatePath,
  views: [path.resolve('views')]
});

// 1. Verify office_card_visible toggle switch exists and is checked
assert.ok(rendered.includes('name="office_card_visible"'), 'Should contain office_card_visible input');
assert.ok(rendered.includes('name="office_card_visible" value="1" checked'), 'Office toggle should be checked');
console.log('✓ 1. office_card_visible toggle switch rendered and checked');

// 2. Verify factory_card_visible toggle switch exists and is NOT checked (since value is 0)
assert.ok(rendered.includes('name="factory_card_visible"'), 'Should contain factory_card_visible input');
assert.ok(!rendered.includes('name="factory_card_visible" value="1" checked'), 'Factory toggle should NOT be checked');
console.log('✓ 2. factory_card_visible toggle switch rendered and un-checked');

// 3. Verify whatsapp_numbers_json hidden input and repeater container exist
assert.ok(rendered.includes('id="whatsapp_numbers_json"'), 'Should contain whatsapp_numbers_json input');
assert.ok(rendered.includes('id="waRepeaterContainer"'), 'Should contain waRepeaterContainer element');
assert.ok(rendered.includes('id="btnAddWaRow"'), 'Should contain btnAddWaRow element');
assert.ok(rendered.includes('id="waTotalBadge"'), 'Should contain waTotalBadge element');
assert.ok(rendered.includes('id="waTableBody"'), 'Should contain waTableBody element');
console.log('✓ 3. WhatsApp multi-number repeater structure rendered');

// 4. Verify admin-settings.js is included without inline event handlers
assert.ok(rendered.includes('src="/js/admin-settings.js?v=1.0"'), 'Should include admin-settings.js');
assert.ok(!rendered.includes('onclick="'), 'Should not contain inline onclick');
assert.ok(!rendered.includes('onchange="'), 'Should not contain inline onchange');
console.log('✓ 4. Script included and zero inline handlers (CSP compliant)');

console.log('All T-240 Admin UI EJS tests passed successfully!');
process.exit(0);
