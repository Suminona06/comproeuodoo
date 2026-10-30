import assert from 'assert';
import { parseAndValidateWhatsAppNumbers } from '../controllers/admin/settingController.js';

console.log('--- Testing parseAndValidateWhatsAppNumbers (T-239) ---');

// 1. Empty / null input returns '[]'
assert.strictEqual(parseAndValidateWhatsAppNumbers(null), '[]');
assert.strictEqual(parseAndValidateWhatsAppNumbers(undefined), '[]');
assert.strictEqual(parseAndValidateWhatsAppNumbers(''), '[]');
assert.strictEqual(parseAndValidateWhatsAppNumbers('   '), '[]');
assert.strictEqual(parseAndValidateWhatsAppNumbers('[]'), '[]');
console.log('✓ 1. Empty/null fallback passed');

// 2. Valid multi-number list summing to 100%
const validList = [
  { number: '+6281234567890', label: 'Sales A', percentage: 40 },
  { number: '081987654321', label: 'Sales B', percentage: 60 }
];
const resultJson = parseAndValidateWhatsAppNumbers(JSON.stringify(validList));
const parsedResult = JSON.parse(resultJson);
assert.strictEqual(parsedResult.length, 2);
assert.strictEqual(parsedResult[0].number, '6281234567890');
assert.strictEqual(parsedResult[0].formatted, '6281234567890');
assert.strictEqual(parsedResult[0].label, 'Sales A');
assert.strictEqual(parsedResult[0].percentage, 40);
assert.strictEqual(parsedResult[1].number, '081987654321');
assert.strictEqual(parsedResult[1].percentage, 60);
console.log('✓ 2. Valid list summing to 100% passed');

// 3. Total percentage 90% (must fail)
assert.throws(() => {
  parseAndValidateWhatsAppNumbers(JSON.stringify([
    { number: '6281234567890', label: 'Sales A', percentage: 40 },
    { number: '6289876543210', label: 'Sales B', percentage: 50 }
  ]));
}, /Total alokasi persentase seluruh nomor WhatsApp wajib tepat 100% \(saat ini: 90%\)/);
console.log('✓ 3. Total percentage 90% correctly rejected');

// 4. Total percentage 110% (must fail)
assert.throws(() => {
  parseAndValidateWhatsAppNumbers(JSON.stringify([
    { number: '6281234567890', label: 'Sales A', percentage: 50 },
    { number: '6289876543210', label: 'Sales B', percentage: 60 }
  ]));
}, /Total alokasi persentase seluruh nomor WhatsApp wajib tepat 100% \(saat ini: 110%\)/);
console.log('✓ 4. Total percentage 110% correctly rejected');

// 5. Invalid characters in phone number (must fail)
assert.throws(() => {
  parseAndValidateWhatsAppNumbers(JSON.stringify([
    { number: '0812abc345', label: 'Sales A', percentage: 100 }
  ]));
}, /Nomor WhatsApp pada baris ke-1 wajib berisi 9-16 digit angka yang valid/);
console.log('✓ 5. Invalid characters in phone number correctly rejected');

// 6. Phone number too short (must fail)
assert.throws(() => {
  parseAndValidateWhatsAppNumbers(JSON.stringify([
    { number: '12345', label: 'Sales A', percentage: 100 }
  ]));
}, /Nomor WhatsApp pada baris ke-1 wajib berisi 9-16 digit angka yang valid/);
console.log('✓ 6. Too short phone number correctly rejected');

// 7. HTML injection in label is sanitized
const sanitized = JSON.parse(parseAndValidateWhatsAppNumbers(JSON.stringify([
  { number: '6281234567890', label: '<script>alert("xss")</script>Sales <b>VIP</b>', percentage: 100 }
])));
assert.strictEqual(sanitized[0].label, 'alert("xss")Sales VIP');
console.log('✓ 7. HTML tags in label stripped correctly');

// 8. Invalid JSON string
assert.throws(() => {
  parseAndValidateWhatsAppNumbers('{not_valid_json');
}, /Format data nomor WhatsApp tidak valid/);
console.log('✓ 8. Malformed JSON correctly rejected');

// 9. Integration test on settingController.update
console.log('--- Testing settingController.update (T-239) ---');
import settingController from '../controllers/admin/settingController.js';
import settingModel from '../models/settingModel.js';

// 9a. Submitting with total != 100% redirects with error
let redirectedUrl = '';
const mockResError = {
  redirect: (url) => { redirectedUrl = url; }
};
const mockReqError = {
  body: {
    whatsapp_numbers_json: JSON.stringify([
      { number: '6281234567890', label: 'Sales A', percentage: 90 }
    ])
  },
  user: { email: 'superadmin@euodoo.com' }
};
await settingController.update(mockReqError, mockResError);
assert.ok(redirectedUrl.includes('error='), 'Should redirect with error query parameter');
assert.ok(decodeURIComponent(redirectedUrl).includes('100%'), 'Error message should mention 100%');
console.log('✓ 9a. Controller update with total != 100% properly redirects with error');

// 9b. Submitting valid toggles and valid numbers updates settings and redirects with success
let redirectedSuccessUrl = '';
const mockResSuccess = {
  redirect: (url) => { redirectedSuccessUrl = url; }
};
const mockReqSuccess = {
  body: {
    office_card_visible: '1',
    factory_card_visible: '0',
    whatsapp_numbers_json: JSON.stringify([
      { number: '6281234567890', label: 'Sales Retail', percentage: 40 },
      { number: '6289876543210', label: 'Sales Industri', percentage: 60 }
    ])
  },
  user: { email: 'superadmin@euodoo.com' }
};
await settingController.update(mockReqSuccess, mockResSuccess);
assert.ok(redirectedSuccessUrl.includes('success='), 'Should redirect with success query parameter');

const currentSettings = await settingModel.getAllAsMap();
assert.strictEqual(currentSettings.office_card_visible, '1');
assert.strictEqual(currentSettings.factory_card_visible, '0');
const parsedStored = JSON.parse(currentSettings.whatsapp_numbers_json);
assert.strictEqual(parsedStored.length, 2);
assert.strictEqual(parsedStored[0].percentage, 40);
assert.strictEqual(parsedStored[1].percentage, 60);
console.log('✓ 9b. Controller update with valid toggles & numbers successfully stored in DB');

// Reset to default (1, 1, [])
await settingModel.updateMany({
  office_card_visible: '1',
  factory_card_visible: '1',
  whatsapp_numbers_json: '[]'
});
console.log('✓ 9c. Database reset back to clean default');

console.log('All T-239 unit & integration tests passed successfully!');
process.exit(0);
