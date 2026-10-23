import assert from 'assert';
import productModel from '../models/productModel.js';
import { productController as publicProductController } from '../controllers/public/productController.js';
import { productController as adminProductController } from '../controllers/admin/productController.js';

async function runTask200Tests() {
  console.log('--- STARTING TASK T-200 BACKEND MODEL & CONTROLLER TESTS ---');

  // 1. Test Model create with new fields
  console.log('\n[TEST 1] Testing productModel.create and findById/findBySlug with new fields...');
  const testSlug = 'test-prod-detail-t200-' + Date.now();
  const testPayload = {
    name_id: 'Produk Uji T200',
    name_en: 'Test Product T200',
    slug: testSlug,
    category_id: 1,
    short_description_id: 'Ini ringkasan pendek produk ID untuk uji T200.',
    short_description_en: 'This is a short summary EN for T200 testing.',
    description_id: '<p>Deskripsi lengkap produk.</p>',
    description_en: '<p>Full product description.</p>',
    variants: ['Varian A (40 micron)', 'Varian B (45 micron)'],
    size_table: [
      { product_code: 'EU-01', width: '30 cm', length: '40 cm', thickness: '40 mic', capacity: '5 kg', material: 'HDPE' },
      { product_code: 'EU-02', width: '35 cm', length: '45 cm', thickness: '45 mic', capacity: '8 kg', material: 'LLDPE' }
    ],
    gallery_images: [
      '/images/products/test-1.webp',
      '/images/products/test-2.webp'
    ],
    main_image: '/images/products/test-main.webp',
    status: 'published'
  };

  const createdId = await productModel.create(testPayload);
  assert.ok(createdId, 'Product must be created with insertId');
  console.log('  1a. Created test product with ID:', createdId);

  // 1b. Retrieve via findById
  const productById = await productModel.findById(createdId);
  assert.strictEqual(productById.id, createdId, 'ID must match');
  assert.strictEqual(productById.short_description_id, testPayload.short_description_id, 'short_description_id must match');
  assert.strictEqual(productById.short_description_en, testPayload.short_description_en, 'short_description_en must match');
  assert.ok(Array.isArray(productById.variants), 'variants must be an array');
  assert.strictEqual(productById.variants.length, 2, 'variants length must be 2');
  assert.ok(Array.isArray(productById.size_table), 'size_table must be an array');
  assert.strictEqual(productById.size_table.length, 2, 'size_table length must be 2');
  assert.strictEqual(productById.size_table[0].product_code, 'EU-01', 'size_table[0].product_code must match');
  assert.ok(Array.isArray(productById.gallery_images), 'gallery_images must be an array');
  assert.strictEqual(productById.gallery_images.length, 2, 'gallery_images length must be 2');
  console.log('  1b. productModel.findById verified with new fields: PASSED');

  // 1c. Retrieve via findBySlug
  const productBySlug = await productModel.findBySlug(testSlug);
  assert.strictEqual(productBySlug.id, createdId, 'findBySlug ID must match');
  assert.strictEqual(productBySlug.slug, testSlug, 'findBySlug slug must match');
  console.log('  1c. productModel.findBySlug verified: PASSED');

  // 2. Test Model update with new fields
  console.log('\n[TEST 2] Testing productModel.update with modified fields...');
  await productModel.update(createdId, {
    short_description_id: 'Ringkasan ID diperbarui.',
    variants: ['Varian Baru (50 micron)'],
    size_table: [
      { product_code: 'EU-UPD', width: '50 cm', length: '60 cm', thickness: '50 mic', capacity: '12 kg', material: 'HDPE Virgin' }
    ],
    gallery_images: ['/images/products/updated-gallery.webp']
  });

  const updatedProduct = await productModel.findById(createdId);
  assert.strictEqual(updatedProduct.short_description_id, 'Ringkasan ID diperbarui.');
  assert.strictEqual(updatedProduct.variants.length, 1);
  assert.strictEqual(updatedProduct.variants[0], 'Varian Baru (50 micron)');
  assert.strictEqual(updatedProduct.size_table.length, 1);
  assert.strictEqual(updatedProduct.size_table[0].product_code, 'EU-UPD');
  assert.strictEqual(updatedProduct.gallery_images.length, 1);
  console.log('  2a. productModel.update verified: PASSED');

  // 3. Test safe fallbacks for empty / null fields
  console.log('\n[TEST 3] Testing safe fallback for products with NULL new fields...');
  const emptySlug = 'test-prod-empty-' + Date.now();
  const emptyId = await productModel.create({
    name_id: 'Produk Null Fields',
    name_en: 'Null Product',
    slug: emptySlug,
    category_id: 1,
    status: 'published'
  });

  const emptyProduct = await productModel.findById(emptyId);
  assert.strictEqual(emptyProduct.short_description_id, null, 'short_description_id must be null');
  assert.ok(Array.isArray(emptyProduct.variants), 'variants must fallback to array');
  assert.strictEqual(emptyProduct.variants.length, 0, 'variants must be empty array');
  assert.ok(Array.isArray(emptyProduct.size_table), 'size_table must fallback to array');
  assert.strictEqual(emptyProduct.size_table.length, 0, 'size_table must be empty array');
  assert.ok(Array.isArray(emptyProduct.gallery_images), 'gallery_images must fallback to array');
  assert.strictEqual(emptyProduct.gallery_images.length, 0, 'gallery_images must be empty array');
  console.log('  3a. Safe fallback for NULL fields verified: PASSED');

  // 4. Test Public productController.detail rendering & WhatsApp URL
  console.log('\n[TEST 4] Testing public productController.detail SSR...');
  let renderedView = null;
  let renderedData = null;
  let statusSet = 200;

  const mockReq = {
    params: { slug: testSlug },
    protocol: 'https',
    get: (header) => (header === 'host' ? 'euodoo.com' : '')
  };

  const mockRes = {
    locals: {
      currentLang: 'id',
      settings: {
        company_name: 'PT Euodoo',
        whatsapp_number: '0812-9988-7766'
      }
    },
    status: (code) => {
      statusSet = code;
      return mockRes;
    },
    render: (view, data) => {
      renderedView = view;
      renderedData = data;
    }
  };

  await publicProductController.detail(mockReq, mockRes);
  assert.strictEqual(renderedView, 'public/product-detail', 'Must render public/product-detail');
  assert.ok(renderedData.product, 'Must pass product object');
  assert.ok(renderedData.whatsappQuoteUrl, 'Must pass whatsappQuoteUrl');
  assert.ok(renderedData.whatsappQuoteUrl.includes('6281299887766') || renderedData.whatsappQuoteUrl.includes('81299887766'), 'WA number must be normalized digits');
  assert.ok(renderedData.whatsappQuoteUrl.includes(encodeURIComponent('Halo PT Euodoo, saya tertarik dengan produk')), 'WA text must match spec');
  console.log('  4a. public productController.detail verified (WA link: ' + renderedData.whatsappQuoteUrl.slice(0, 50) + '...): PASSED');

  // Test public controller 404 for inactive / non-existent product
  const mock404Req = { params: { slug: 'non-existent-product-slug' }, protocol: 'https', get: () => 'euodoo.com' };
  let notFoundRendered = false;
  const mock404Res = {
    locals: {},
    status: (code) => {
      assert.strictEqual(code, 404);
      return mock404Res;
    },
    render: (view) => {
      if (view === 'public/404') notFoundRendered = true;
    }
  };
  await publicProductController.detail(mock404Req, mock404Res);
  assert.ok(notFoundRendered, 'Non-existent product must render 404');
  console.log('  4b. public productController.detail 404 handling verified: PASSED');

  // 5. Test Admin Validation & Input Parsing
  console.log('\n[TEST 5] Testing admin productController server-side validation...');
  // 5a. Validation: short_description > 500 chars rejected on store
  let adminStatus = 200;
  let adminError = null;
  const mockStoreReqOverLength = {
    body: {
      name_id: 'Produk Deskripsi Kepanjangan',
      short_description_id: 'A'.repeat(501)
    }
  };
  const mockStoreResOverLength = {
    locals: { csrfToken: 'mock-csrf' },
    status: (code) => {
      adminStatus = code;
      return mockStoreResOverLength;
    },
    render: (view, data) => {
      adminError = data.error;
    }
  };
  await adminProductController.store(mockStoreReqOverLength, mockStoreResOverLength);
  assert.strictEqual(adminStatus, 400, 'Over 500 chars short_desc must return 400');
  assert.ok(adminError.includes('500 karakter'), 'Error must mention 500 karakter limit');
  console.log('  5a. Admin store short description length limit verified: PASSED');

  // 5b. Validation: short_description > 500 chars rejected on update
  let redirectedUrl = null;
  const mockUpdateReqOverLength = {
    params: { id: createdId },
    body: {
      short_description_id: 'B'.repeat(505)
    }
  };
  const mockUpdateResOverLength = {
    redirect: (url) => {
      redirectedUrl = url;
    }
  };
  await adminProductController.update(mockUpdateReqOverLength, mockUpdateResOverLength);
  assert.ok(redirectedUrl.includes('error='), 'Update must redirect with error query parameter');
  assert.ok(redirectedUrl.includes('500'), 'Error must mention 500');
  console.log('  5b. Admin update short description length limit verified: PASSED');

  // 5c. Test Admin dynamic inputs parsing via store
  let successRedirect = null;
  const mockStoreReqValid = {
    body: {
      name_id: 'Produk Form Dinamis ' + Date.now(),
      category_id: 1,
      short_description_id: 'Valid short description',
      variant_labels: ['  10 Micron  ', '15 Micron', ''],
      size_code: ['SZ-01', 'SZ-02'],
      size_width: ['20cm', '25cm'],
      size_length: ['30cm', '35cm'],
      size_thickness: ['40mic', '45mic'],
      size_capacity: ['3kg', '5kg'],
      size_material: ['HDPE', 'LLDPE'],
      gallery_images: '["/images/valid1.webp", "invalid-no-protocol-or-slash", "https://euodoo.com/valid2.webp"]'
    }
  };
  const mockStoreResValid = {
    locals: { csrfToken: 'mock-csrf' },
    redirect: (url) => {
      successRedirect = url;
    }
  };
  await adminProductController.store(mockStoreReqValid, mockStoreResValid);
  assert.ok(successRedirect && successRedirect.includes('success='), 'Must redirect with success');

  // Check the newly created product in database
  const createdAdminProd = await productModel.findBySlug(createSlug(mockStoreReqValid.body.name_id));
  assert.ok(createdAdminProd, 'Product created via admin controller must be in DB');
  assert.strictEqual(createdAdminProd.variants.length, 2, 'Empty string variant must be filtered out');
  assert.strictEqual(createdAdminProd.variants[0], '10 Micron', 'Variant must be trimmed');
  assert.strictEqual(createdAdminProd.size_table.length, 2, 'Must have 2 size rows');
  assert.strictEqual(createdAdminProd.size_table[0].product_code, 'SZ-01');
  assert.strictEqual(createdAdminProd.gallery_images.length, 2, 'Invalid gallery URL must be dropped');
  assert.strictEqual(createdAdminProd.gallery_images[0], '/images/valid1.webp');
  assert.strictEqual(createdAdminProd.gallery_images[1], 'https://euodoo.com/valid2.webp');
  console.log('  5c. Admin input parsing (variants, 6-col size table, URL gallery filter) verified: PASSED');

  // Cleanup test products
  await productModel.delete(createdId);
  await productModel.delete(emptyId);
  await productModel.delete(createdAdminProd.id);
  console.log('\n[CLEANUP] Deleted test products cleanly.');

  console.log('\n--- ALL TASK T-200 BACKEND TESTS PASSED SUCCESSFULLY! ---');
}

function createSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

runTask200Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nFAILED T-200 TEST:', err);
    process.exit(1);
  });
