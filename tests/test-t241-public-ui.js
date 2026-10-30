import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rootDir = process.cwd();
const footerPath = path.join(rootDir, 'views/partials/footer.ejs');
const contactPath = path.join(rootDir, 'views/public/contact.ejs');
const layoutCssPath = path.join(rootDir, 'public/css/layout.css');
const componentsCssPath = path.join(rootDir, 'public/css/components.css');

console.log('--- TEST SUITE T-241: Public UI & Layout Show/Hide Alamat ---');

// 1. CSS Rules Verification
const layoutCss = fs.readFileSync(layoutCssPath, 'utf8');
const componentsCss = fs.readFileSync(componentsCssPath, 'utf8');

assert.ok(layoutCss.includes('.ft-offices:has(> :only-child)'), 'layout.css must contain .ft-offices:has(> :only-child)');
assert.ok(layoutCss.includes('.ft-desc:last-child'), 'layout.css must contain .ft-desc:last-child');
assert.ok(componentsCss.includes('.cf-maps-wrap:only-child'), 'components.css must contain .cf-maps-wrap:only-child');
console.log('✓ Test 1 Passed: CSS rules for single child and clean omission exist.');

// Mock translation function
const mockTranslations = {
  id: {
    'contact.page_title': 'Kontak Kami',
    'contact.form_heading': 'Hubungi Kami',
    'contact.form_subheading': 'Silakan kirimkan kebutuhan Anda.',
    'contact.kicker_label': 'Formulir RFQ',
    'contact.name_label': 'Nama Lengkap',
    'contact.name_placeholder': 'Nama Anda',
    'contact.company_label': 'Perusahaan',
    'contact.company_placeholder': 'Nama Perusahaan',
    'contact.message_label': 'Pesan',
    'contact.message_placeholder': 'Tulis pesan...',
    'contact.submit_btn': 'Kirim Permintaan',
    'contact.badge_head_office': 'Kantor Pusat',
    'contact.badge_factory': 'Pabrik',
    'contact.phone_label_short': 'Telp:',
    'contact.fax_label_short': 'Faks:',
    'contact.email_label_short': 'Email:',
    'contact.hotline_label': 'Hotline:',
    'contact.operating_hours_label': 'Jam Operasional:',
    'contact.map_title': 'Peta Lokasi'
  },
  en: {
    'contact.page_title': 'Contact Us',
    'contact.form_heading': 'Contact Us',
    'contact.form_subheading': 'Please submit your inquiry.',
    'contact.kicker_label': 'RFQ Form',
    'contact.name_label': 'Full Name',
    'contact.name_placeholder': 'Your Name',
    'contact.company_label': 'Company',
    'contact.company_placeholder': 'Company Name',
    'contact.message_label': 'Message',
    'contact.message_placeholder': 'Write message...',
    'contact.submit_btn': 'Submit Request',
    'contact.badge_head_office': 'Head Office',
    'contact.badge_factory': 'Plant',
    'contact.phone_label_short': 'Phone:',
    'contact.fax_label_short': 'Fax:',
    'contact.email_label_short': 'Email:',
    'contact.hotline_label': 'Hotline:',
    'contact.operating_hours_label': 'Working Hours:',
    'contact.map_title': 'Location Map'
  }
};

const getT = (lang) => (key) => mockTranslations[lang][key] || key;

// 2. Test Footer Rendering Permutations
const footerTemplate = fs.readFileSync(footerPath, 'utf8');

const baseSettings = {
  site_logo_footer: '',
  company_name: 'PT. EUODOO',
  office_name_id: 'Kantor Pusat (Jakarta)',
  office_name_en: 'Head Office (Jakarta)',
  office_address: 'Karindra Building Jakarta',
  office_phone: '(021) 53668626',
  factory_name_id: 'Pabrik Manufaktur (Bandung)',
  factory_name_en: 'Manufacturing Plant (Bandung)',
  factory_address: 'Kawasan Industri Cigondewah',
  factory_phone: '(022) 6012519',
  social_linkedin_visible: '1',
  social_instagram_visible: '1',
  social_facebook_visible: '1',
  social_youtube_visible: '1',
  social_linkedin_url: 'https://linkedin.com/company/euodoo',
  social_instagram_url: 'https://instagram.com/euodoo',
  social_facebook_url: 'https://facebook.com/euodoo',
  social_youtube_url: 'https://youtube.com/euodoo'
};

const footerScenarios = [
  { office: '1', factory: '1', desc: 'both visible' },
  { office: '1', factory: '0', desc: 'office only' },
  { office: '0', factory: '1', desc: 'factory only' },
  { office: '0', factory: '0', desc: 'both hidden' }
];

for (const sc of footerScenarios) {
  for (const lang of ['id', 'en']) {
    const settings = {
      ...baseSettings,
      office_card_visible: sc.office,
      factory_card_visible: sc.factory
    };

    const rendered = ejs.render(footerTemplate, {
      settings,
      currentLang: lang,
      currentYear: 2026,
      t: getT(lang)
    }, { filename: footerPath });

    const hasContainer = rendered.includes('class="ft-offices"');
    const hasOfficeCard = rendered.includes(lang === 'en' ? 'Head Office (Jakarta)' : 'Kantor Pusat (Jakarta)');
    const hasFactoryCard = rendered.includes(lang === 'en' ? 'Manufacturing Plant (Bandung)' : 'Pabrik Manufaktur (Bandung)');

    if (sc.office === '1' && sc.factory === '1') {
      assert.strictEqual(hasContainer, true, `Footer [${sc.desc}] [${lang}] should have .ft-offices`);
      assert.strictEqual(hasOfficeCard, true, `Footer [${sc.desc}] [${lang}] should have office card`);
      assert.strictEqual(hasFactoryCard, true, `Footer [${sc.desc}] [${lang}] should have factory card`);
    } else if (sc.office === '1' && sc.factory === '0') {
      assert.strictEqual(hasContainer, true, `Footer [${sc.desc}] [${lang}] should have .ft-offices`);
      assert.strictEqual(hasOfficeCard, true, `Footer [${sc.desc}] [${lang}] should have office card`);
      assert.strictEqual(hasFactoryCard, false, `Footer [${sc.desc}] [${lang}] should NOT have factory card`);
    } else if (sc.office === '0' && sc.factory === '1') {
      assert.strictEqual(hasContainer, true, `Footer [${sc.desc}] [${lang}] should have .ft-offices`);
      assert.strictEqual(hasOfficeCard, false, `Footer [${sc.desc}] [${lang}] should NOT have office card`);
      assert.strictEqual(hasFactoryCard, true, `Footer [${sc.desc}] [${lang}] should have factory card`);
    } else if (sc.office === '0' && sc.factory === '0') {
      assert.strictEqual(hasContainer, false, `Footer [${sc.desc}] [${lang}] should NOT have .ft-offices container`);
      assert.strictEqual(hasOfficeCard, false, `Footer [${sc.desc}] [${lang}] should NOT have office card`);
      assert.strictEqual(hasFactoryCard, false, `Footer [${sc.desc}] [${lang}] should NOT have factory card`);
    }
  }
}
console.log('✓ Test 2 Passed: Footer conditional rendering correctly handles all (1,1), (1,0), (0,1), (0,0) in ID and EN.');

// 3. Test Contact Page Rendering Permutations
const contactTemplate = fs.readFileSync(contactPath, 'utf8');

for (const sc of footerScenarios) {
  for (const lang of ['id', 'en']) {
    const settings = {
      ...baseSettings,
      office_card_visible: sc.office,
      factory_card_visible: sc.factory
    };

    const rendered = ejs.render(contactTemplate, {
      settings,
      path: '/contact',
      title: 'Kontak',
      currentLang: lang,
      t: getT(lang),
      csrfToken: 'test-csrf-token',
      turnstileSiteKey: 'test-key',
      success: false,
      error: false,
      errorMsg: null,
      heroBanner: null,
      products: [],
      selectedProduct: null
    }, { filename: contactPath });

    const hasOfficeCard = rendered.includes(lang === 'en' ? 'Head Office (Jakarta)' : 'Kantor Pusat (Jakarta)');
    const hasFactoryCard = rendered.includes(lang === 'en' ? 'Manufacturing Plant (Bandung)' : 'Pabrik Manufaktur (Bandung)');
    const hasMap = rendered.includes('class="cf-maps-wrap"');

    assert.strictEqual(hasMap, true, `Contact [${sc.desc}] [${lang}] should always render map`);

    if (sc.office === '1') {
      assert.strictEqual(hasOfficeCard, true, `Contact [${sc.desc}] [${lang}] should have office card`);
    } else {
      assert.strictEqual(hasOfficeCard, false, `Contact [${sc.desc}] [${lang}] should NOT have office card`);
    }

    if (sc.factory === '1') {
      assert.strictEqual(hasFactoryCard, true, `Contact [${sc.desc}] [${lang}] should have factory card`);
    } else {
      assert.strictEqual(hasFactoryCard, false, `Contact [${sc.desc}] [${lang}] should NOT have factory card`);
    }
  }
}
console.log('✓ Test 3 Passed: Contact page conditional rendering correctly handles all (1,1), (1,0), (0,1), (0,0) in ID and EN.');

console.log('ALL T-241 TESTS PASSED SUCCESSFULLY! ✅');
process.exit(0);
