import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (file.endsWith('.ejs')) {
      results.push(fullPath);
    }
  }
  return results;
}

function getNestedValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function createTFunction(localeObj) {
  return function(keyPath) {
    const val = getNestedValue(localeObj, keyPath);
    return val !== undefined ? val : keyPath;
  };
}

function runAudit() {
  const rootDir = path.resolve(__dirname, '..');
  const idPath = path.join(rootDir, 'locales', 'id.json');
  const enPath = path.join(rootDir, 'locales', 'en.json');

  if (!fs.existsSync(idPath) || !fs.existsSync(enPath)) {
    console.error('Missing locale dictionaries: id.json or en.json');
    process.exit(1);
  }

  const idLocale = JSON.parse(fs.readFileSync(idPath, 'utf8'));
  const enLocale = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const viewDirs = [
    path.join(rootDir, 'views', 'public'),
    path.join(rootDir, 'views', 'partials')
  ];

  const ejsFiles = [];
  for (const dir of viewDirs) {
    if (fs.existsSync(dir)) {
      ejsFiles.push(...walkDir(dir));
    }
  }

  // Regex matches t('key') and t("key")
  const tKeyRegex = /t\(\s*['"]([a-zA-Z0-9_.]+)['"]\s*\)/g;
  const usedKeys = new Map();

  for (const filePath of ejsFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = tKeyRegex.exec(content)) !== null) {
      const key = match[1];
      if (!usedKeys.has(key)) {
        usedKeys.set(key, new Set());
      }
      usedKeys.get(key).add(path.relative(rootDir, filePath));
    }
  }

  let hasError = false;
  const missingInId = [];
  const missingInEn = [];

  for (const [key, files] of usedKeys.entries()) {
    const idVal = getNestedValue(idLocale, key);
    const enVal = getNestedValue(enLocale, key);

    if (idVal === undefined || typeof idVal !== 'string' || idVal.trim() === '') {
      hasError = true;
      missingInId.push({ key, files: Array.from(files) });
    }

    if (enVal === undefined || typeof enVal !== 'string' || enVal.trim() === '') {
      hasError = true;
      missingInEn.push({ key, files: Array.from(files) });
    }
  }

  console.log(`[CHECK 1] Audited ${ejsFiles.length} EJS files with ${usedKeys.size} unique i18n keys.`);

  if (missingInId.length > 0) {
    console.error(`\nKeys missing or empty in locales/id.json (${missingInId.length}):`);
    for (const item of missingInId) {
      console.error(`  - ${item.key} (used in: ${item.files.join(', ')})`);
    }
  }

  if (missingInEn.length > 0) {
    console.error(`\nKeys missing or empty in locales/en.json (${missingInEn.length}):`);
    for (const item of missingInEn) {
      console.error(`  - ${item.key} (used in: ${item.files.join(', ')})`);
    }
  }

  if (hasError) {
    console.error('\nI18N KEY AUDIT FAILED: Undefined translation keys detected in public views.');
    process.exit(1);
  }

  console.log('  -> All translation keys are properly defined in ID and EN locales: PASSED');

  // Verify contact view template rendering specifically
  console.log('\n[CHECK 2] Verifying EJS render for views/public/contact.ejs (T-146)...');
  const contactEjsPath = path.join(rootDir, 'views', 'public', 'contact.ejs');
  const rawContactContent = fs.readFileSync(contactEjsPath, 'utf8');

  // Strip all includes so template can be tested purely in memory
  const sanitizedContactContent = rawContactContent.replace(/<%[-=]\s*include\([^)]+\)\s*;?\s*%>/g, '<!-- mock include -->');

  const baseMockData = {
    csrfToken: 'test-csrf-token',
    turnstileSiteKey: 'test-turnstile-key',
    heroBanner: null,
    heroTitle: 'Test Title',
    heroSubtitle: 'Test Subtitle',
    formHeading: 'Form Heading',
    formSubheading: 'Form Subheading',
    products: [
      { id: 1, slug: 'kantong-hdpe', name_id: 'Kantong HDPE', name_en: 'HDPE Bag', category_name_id: 'Retail', category_name_en: 'Retail' }
    ],
    selectedProduct: null,
    officeName: 'Kantor Pusat Jakarta',
    officeAddress: 'Palmerah Selatan No. 30',
    officePhone: '+6221-53668626',
    officeFax: '+6221-53668627',
    companyEmail: 'info@euodoo.com',
    factoryName: 'Pabrik Bandung',
    factoryAddress: 'Cigondewah Bandung',
    factoryPhone: '+6222-6012519',
    factoryWorkingHours: 'Senin - Jumat 08:00 - 17:00 WIB',
    waNum: '628123456789',
    mapsEmbed: 'https://maps.google.com/embed',
    cleanTel: (val) => (val || '').replace(/[^0-9+]/g, ''),
    csrfToken: 'mock-csrf-token',
    currentLang: 'id',
    success: undefined,
    error: undefined,
    errorMsg: undefined
  };

  // Render Indonesian
  const renderedId = ejs.render(sanitizedContactContent, {
    ...baseMockData,
    currentLangCode: 'id',
    isEn: false,
    t: createTFunction(idLocale)
  });

  assert(!renderedId.includes('contact.product_label'), 'Rendered ID must not contain raw contact.product_label');
  assert(!renderedId.includes('contact.product_select_default'), 'Rendered ID must not contain raw contact.product_select_default');
  assert(renderedId.includes('Produk yang Diminati'), 'Rendered ID must contain "Produk yang Diminati"');
  assert(renderedId.includes('-- Pilih Produk (Opsional) --'), 'Rendered ID must contain "-- Pilih Produk (Opsional) --"');
  assert(renderedId.includes('Tipe Permintaan'), 'Rendered ID must contain "Tipe Permintaan"');
  assert(renderedId.includes('Permintaan Penawaran Harga (RFQ)'), 'Rendered ID must contain "Permintaan Penawaran Harga (RFQ)"');
  console.log('  -> Indonesian (ID) contact rendering assertions: PASSED');

  // Render English
  const renderedEn = ejs.render(sanitizedContactContent, {
    ...baseMockData,
    currentLang: 'en',
    currentLangCode: 'en',
    isEn: true,
    t: createTFunction(enLocale)
  });

  assert(!renderedEn.includes('contact.product_label'), 'Rendered EN must not contain raw contact.product_label');
  assert(!renderedEn.includes('contact.product_select_default'), 'Rendered EN must not contain raw contact.product_select_default');
  assert(renderedEn.includes('Product of Interest'), 'Rendered EN must contain "Product of Interest"');
  assert(renderedEn.includes('-- Select Product (Optional) --'), 'Rendered EN must contain "-- Select Product (Optional) --"');
  assert(renderedEn.includes('Inquiry Type'), 'Rendered EN must contain "Inquiry Type"');
  assert(renderedEn.includes('Request for Quotation (RFQ)'), 'Rendered EN must contain "Request for Quotation (RFQ)"');
  assert(renderedEn.includes('B2B RFQ FORM'), 'Rendered EN must contain "B2B RFQ FORM"');
  assert(renderedEn.includes('Corporate Head Office'), 'Rendered EN must contain "Corporate Head Office"');
  assert(renderedEn.includes('Manufacturing Plant'), 'Rendered EN must contain "Manufacturing Plant"');
  console.log('  -> English (EN) contact rendering assertions: PASSED');

  console.log('\nALL T-146 I18N CHECKS PASSED SUCCESSFULLY.');
  process.exit(0);
}

runAudit();
