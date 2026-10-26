import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import productModel from '../models/productModel.js';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== STARTING T-211 AUTOMATED REGRESSION & QA AUDIT (PRODUCT CTA & SPECS PRUNING) ===\n');

async function runQaSuite() {
  let createdProductId = null;

  try {
    // ----------------------------------------------------
    // [1/6] DATABASE SCHEMA & DROPPED SPECS AUDIT
    // ----------------------------------------------------
    console.log('[1/6] Auditing database schema for products table...');
    const columns = await query('DESCRIBE products');
    const columnNames = columns.map(c => c.Field);

    assert(!columnNames.includes('material_specs'), 'Database column "material_specs" must be DROPPED');
    assert(!columnNames.includes('technical_specs'), 'Database column "technical_specs" must be DROPPED');
    assert(columnNames.includes('cta_text_id'), 'Database column "cta_text_id" must exist');
    assert(columnNames.includes('cta_text_en'), 'Database column "cta_text_en" must exist');
    console.log('  -> Database schema verified: legacy specs dropped, cta_text columns present: PASSED');

    // ----------------------------------------------------
    // [2/6] ADMIN VIEWS MARKUP & FORM CLEANUP AUDIT
    // ----------------------------------------------------
    console.log('\n[2/6] Auditing admin create.ejs and edit.ejs markup...');
    const createPath = path.join(rootDir, 'views', 'admin', 'products', 'create.ejs');
    const editPath = path.join(rootDir, 'views', 'admin', 'products', 'edit.ejs');
    const createContent = fs.readFileSync(createPath, 'utf8');
    const editContent = fs.readFileSync(editPath, 'utf8');

    for (const [viewName, content] of [['create.ejs', createContent], ['edit.ejs', editContent]]) {
      assert(!content.includes('material_specs'), `${viewName} must NOT contain material_specs`);
      assert(!content.includes('btnAddSpecRow'), `${viewName} must NOT contain btnAddSpecRow`);
      assert(!content.includes('specsContainer'), `${viewName} must NOT contain specsContainer`);
      assert(!content.includes('createSpecRow'), `${viewName} must NOT contain createSpecRow JS function`);
      assert(!content.includes('spec-item-row'), `${viewName} must NOT contain spec-item-row`);
      assert(!content.includes('spec_key'), `${viewName} must NOT contain spec_key[] input`);

      assert(content.includes('id="cta_text_id"'), `${viewName} must contain id="cta_text_id" input`);
      assert(content.includes('id="cta_text_en"'), `${viewName} must contain id="cta_text_en" input`);
      assert(content.includes('maxlength="50"'), `${viewName} must enforce maxlength="50" on CTA inputs`);

      assert(content.includes('3. Variasi Ukuran'), `${viewName} must have Card 3 as Variasi Ukuran`);
      assert(content.includes('4. Tabel Ukuran'), `${viewName} must have Card 4 as Tabel Ukuran`);
      assert(content.includes('5. Pengaturan Meta SEO'), `${viewName} must have Card 5 as Meta SEO`);
    }
    console.log('  -> Admin form views markup verified: clean numbering and CTA inputs present: PASSED');

    // ----------------------------------------------------
    // [3/6] ADMIN CSS HYGIENE AUDIT (public/css/admin.css)
    // ----------------------------------------------------
    console.log('\n[3/6] Auditing admin.css rules...');
    const adminCssPath = path.join(rootDir, 'public', 'css', 'admin.css');
    const adminCss = fs.readFileSync(adminCssPath, 'utf8');

    assert(!adminCss.includes('.spec-item-row'), 'admin.css must NOT contain .spec-item-row');
    assert(!adminCss.includes('.spec-col-key'), 'admin.css must NOT contain .spec-col-key');
    assert(!adminCss.includes('.spec-col-val'), 'admin.css must NOT contain .spec-col-val');
    assert(adminCss.includes('.btn-add-row'), 'admin.css must preserve shared .btn-add-row class');
    console.log('  -> admin.css verified: obsolete spec selectors purged, shared buttons intact: PASSED');

    // ----------------------------------------------------
    // [4/6] MODEL CRUD & CTA FIELD INTEGRATION
    // ----------------------------------------------------
    console.log('\n[4/6] Testing productModel CRUD with custom CTA fields...');
    const testSlug = `test-cta-qa-${Date.now()}`;
    const newProd = {
      name_id: 'Produk Kantong Uji QA CTA',
      name_en: 'QA Test CTA Bag',
      slug: testSlug,
      cta_text_id: 'Dapatkan Penawaran Khusus',
      cta_text_en: 'Get Special Quote Now',
      variants: ['30 x 40 cm (40 Micron)', '35 x 45 cm (45 Micron)'],
      size_table: [
        { kode_produk: 'QA-3040', lebar: '30 cm', panjang: '40 cm', tebal_micron: '40', kapasitas: '5 kg', bahan: 'HDPE' }
      ],
      status: 'published'
    };

    createdProductId = await productModel.create(newProd);
    assert(createdProductId, 'productModel.create must return an ID');

    let fetched = await productModel.findById(createdProductId);
    assert.strictEqual(fetched.cta_text_id, 'Dapatkan Penawaran Khusus');
    assert.strictEqual(fetched.cta_text_en, 'Get Special Quote Now');
    assert.strictEqual(fetched.material_specs, undefined, 'material_specs must not be returned');
    assert.strictEqual(fetched.technical_specs, undefined, 'technical_specs must not be returned');

    // Update with empty CTA string to verify null fallback in database
    await productModel.update(createdProductId, {
      cta_text_id: '   ',
      cta_text_en: ''
    });

    fetched = await productModel.findById(createdProductId);
    assert.strictEqual(fetched.cta_text_id, null, 'Empty CTA ID must save as null');
    assert.strictEqual(fetched.cta_text_en, null, 'Empty CTA EN must save as null');

    // Update with custom CTA string again
    await productModel.update(createdProductId, {
      cta_text_id: 'Chat Penjualan Pabrik',
      cta_text_en: 'Direct Factory Chat'
    });

    fetched = await productModel.findById(createdProductId);
    assert.strictEqual(fetched.cta_text_id, 'Chat Penjualan Pabrik');
    assert.strictEqual(fetched.cta_text_en, 'Direct Factory Chat');
    console.log('  -> productModel CRUD and null-handling verified: PASSED');

    // ----------------------------------------------------
    // [5/6] I18N DICTIONARY INTEGRITY (id.json & en.json)
    // ----------------------------------------------------
    console.log('\n[5/6] Auditing i18n dictionaries for CTA fallbacks...');
    const idPath = path.join(rootDir, 'locales', 'id.json');
    const enPath = path.join(rootDir, 'locales', 'en.json');
    const idJson = JSON.parse(fs.readFileSync(idPath, 'utf8'));
    const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    assert.strictEqual(idJson.product_detail?.cta_whatsapp_default, 'Minta Penawaran via WhatsApp');
    assert.strictEqual(enJson.product_detail?.cta_whatsapp_default, 'Request Quote via WhatsApp');
    console.log('  -> i18n dictionaries verified: symmetric fallback keys present: PASSED');

    // ----------------------------------------------------
    // [6/6] SSR RENDERING OF PRODUCT DETAIL PAGE (views/public/product-detail.ejs)
    // ----------------------------------------------------
    console.log('\n[6/6] Testing SSR rendering for product detail page (custom CTA vs fallback)...');
    const pdEjsPath = path.join(rootDir, 'views', 'public', 'product-detail.ejs');
    const rawPdContent = fs.readFileSync(pdEjsPath, 'utf8');

    // Mock includes for isolated EJS compilation
    const sanitizedPdContent = rawPdContent.replace(/<%[-=]\s*include\([^)]+\)\s*;?\s*%>/g, '<!-- mock-include -->');

    const mockProductWithCta = {
      ...fetched,
      category_name_id: 'Retail',
      category_name_en: 'Retail',
      category_slug: 'retail',
      canonical_url: 'http://localhost:3000/products/' + testSlug,
      whatsapp_quote_url: 'https://wa.me/6281234567890?text=Halo'
    };

    const mockProductWithoutCta = {
      ...mockProductWithCta,
      cta_text_id: null,
      cta_text_en: null
    };

    const tId = (key) => key === 'product_detail.cta_whatsapp_default' ? 'Minta Penawaran via WhatsApp' : key;
    const tEn = (key) => key === 'product_detail.cta_whatsapp_default' ? 'Request Quote via WhatsApp' : key;

    // Test 6a: Custom CTA in Indonesian
    const htmlCustomId = ejs.render(sanitizedPdContent, {
      product: mockProductWithCta,
      currentLang: 'id',
      whatsappQuoteUrl: mockProductWithCta.whatsapp_quote_url,
      canonicalUrl: mockProductWithCta.canonical_url,
      relatedProducts: [],
      t: tId
    });
    assert(htmlCustomId.includes('Chat Penjualan Pabrik'), 'ID view must render custom cta_text_id');
    assert(!htmlCustomId.includes('Minta Penawaran via WhatsApp'), 'ID view must not use fallback when custom CTA exists');

    // Test 6b: Custom CTA in English
    const htmlCustomEn = ejs.render(sanitizedPdContent, {
      product: mockProductWithCta,
      currentLang: 'en',
      whatsappQuoteUrl: mockProductWithCta.whatsapp_quote_url,
      canonicalUrl: mockProductWithCta.canonical_url,
      relatedProducts: [],
      t: tEn
    });
    assert(htmlCustomEn.includes('Direct Factory Chat'), 'EN view must render custom cta_text_en');
    assert(!htmlCustomEn.includes('Request Quote via WhatsApp'), 'EN view must not use fallback when custom CTA exists');

    // Test 6c: Fallback CTA in Indonesian when cta_text_id is NULL
    const htmlFallbackId = ejs.render(sanitizedPdContent, {
      product: mockProductWithoutCta,
      currentLang: 'id',
      whatsappQuoteUrl: mockProductWithoutCta.whatsapp_quote_url,
      canonicalUrl: mockProductWithoutCta.canonical_url,
      relatedProducts: [],
      t: tId
    });
    assert(htmlFallbackId.includes('Minta Penawaran via WhatsApp'), 'ID view must fallback to default CTA when null');

    // Test 6d: Fallback CTA in English when cta_text_en is NULL
    const htmlFallbackEn = ejs.render(sanitizedPdContent, {
      product: mockProductWithoutCta,
      currentLang: 'en',
      whatsappQuoteUrl: mockProductWithoutCta.whatsapp_quote_url,
      canonicalUrl: mockProductWithoutCta.canonical_url,
      relatedProducts: [],
      t: tEn
    });
    assert(htmlFallbackEn.includes('Request Quote via WhatsApp'), 'EN view must fallback to default CTA when null');

    // Test 6e: XSS Escaping Safety Test
    const mockXssProduct = {
      ...mockProductWithCta,
      cta_text_id: '<script>alert(1)</script>Penawaran Aman',
      cta_text_en: '<img src=x onerror=alert(1)>Safe Quote'
    };

    const htmlXss = ejs.render(sanitizedPdContent, {
      product: mockXssProduct,
      currentLang: 'id',
      whatsappQuoteUrl: mockProductWithCta.whatsapp_quote_url,
      canonicalUrl: mockProductWithCta.canonical_url,
      relatedProducts: [],
      t: tId
    });
    assert(!htmlXss.includes('<script>alert(1)</script>'), 'CTA output must not render unescaped script tag');
    assert(htmlXss.includes('&lt;script&gt;alert(1)&lt;/script&gt;Penawaran Aman'), 'CTA output must be safely HTML escaped');
    console.log('  -> SSR rendering verified: custom CTA, bilingual fallback, and XSS escaping: PASSED');

    console.log('\n======================================================');
    console.log('ALL T-211 AUTOMATED REGRESSION TESTS PASSED (6 / 6)!');
    console.log('======================================================\n');
  } finally {
    if (createdProductId) {
      await productModel.delete(createdProductId).catch(() => {});
    }
  }

  process.exit(0);
}

runQaSuite().catch(err => {
  console.error('\nQA AUDIT FAILED:', err);
  process.exit(1);
});
