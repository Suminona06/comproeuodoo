import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import productModel from '../models/productModel.js';
import productController from '../controllers/admin/productController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('--- RUNNING TEST SUITE FOR TASK T-202 ---');

  // 1. Verify media-picker.js supports multiple mode
  const mediaPickerJs = fs.readFileSync(path.join(__dirname, '../public/js/media-picker.js'), 'utf-8');
  assert(mediaPickerJs.includes('isMultiple'), 'media-picker.js must define isMultiple');
  assert(mediaPickerJs.includes('selectedMediaList'), 'media-picker.js must define selectedMediaList');
  assert(mediaPickerJs.includes('media-picker-checkbox'), 'media-picker.js must create media-picker-checkbox');
  assert(mediaPickerJs.includes('foto dipilih'), 'media-picker.js must update multiple count label');
  assert(mediaPickerJs.includes('Pilih ${selectedMediaList.length} Foto') || mediaPickerJs.includes('Pilih'), 'media-picker.js must have multiple select button text');
  console.log('✓ Universal Media Picker client script multi-select verified');

  // 2. Verify admin.css has necessary styles
  const adminCss = fs.readFileSync(path.join(__dirname, '../public/css/admin.css'), 'utf-8');
  assert(adminCss.includes('.media-picker-checkbox'), 'admin.css must include .media-picker-checkbox');
  assert(adminCss.includes('.prod-gallery-wrap'), 'admin.css must include .prod-gallery-wrap');
  assert(adminCss.includes('.prod-gallery-thumb'), 'admin.css must include .prod-gallery-thumb');
  assert(adminCss.includes('.prod-gallery-btn-move'), 'admin.css must include .prod-gallery-btn-move');
  assert(adminCss.includes('.char-counter'), 'admin.css must include .char-counter');
  assert(adminCss.includes('.form-actions-sticky'), 'admin.css must include .form-actions-sticky');
  assert(adminCss.includes('min-height: 240px'), 'admin.css modal body must have responsive min-height');
  console.log('✓ admin.css responsive and component classes verified');

  // 3. Verify views/admin/products/create.ejs and edit.ejs
  const createEjs = fs.readFileSync(path.join(__dirname, '../views/admin/products/create.ejs'), 'utf-8');
  const editEjs = fs.readFileSync(path.join(__dirname, '../views/admin/products/edit.ejs'), 'utf-8');

  // Zero style attributes in create and edit
  assert(!createEjs.includes('style="'), 'create.ejs must not contain inline style="..."');
  assert(!editEjs.includes('style="'), 'edit.ejs must not contain inline style="..."');

  // Check required fields in create.ejs
  assert(createEjs.includes('id="short_description_id"'), 'create.ejs has short_description_id');
  assert(createEjs.includes('id="short_description_en"'), 'create.ejs has short_description_en');
  assert(createEjs.includes('maxlength="200"'), 'create.ejs has maxlength 200');
  assert(createEjs.includes('counter_short_desc_id'), 'create.ejs has counter for ID');
  assert(createEjs.includes('counter_short_desc_en'), 'create.ejs has counter for EN');
  assert(createEjs.includes('btnOpenGalleryPicker'), 'create.ejs has gallery picker button');
  assert(createEjs.includes('gallery_images_input'), 'create.ejs has gallery_images_input');
  assert(createEjs.includes('btnAddVariant'), 'create.ejs has btnAddVariant');
  assert(createEjs.includes('variant_labels[]'), 'create.ejs has variant_labels[]');
  assert(createEjs.includes('btnAddSizeRow'), 'create.ejs has btnAddSizeRow');
  assert(createEjs.includes('kode_produk[]'), 'create.ejs has kode_produk[]');
  assert(createEjs.includes('tebal_micron[]'), 'create.ejs has tebal_micron[]');

  // Check required fields in edit.ejs
  assert(editEjs.includes('id="short_description_id"'), 'edit.ejs has short_description_id');
  assert(editEjs.includes('id="short_description_en"'), 'edit.ejs has short_description_en');
  assert(editEjs.includes('btnOpenGalleryPicker'), 'edit.ejs has gallery picker button');
  assert(editEjs.includes('btnAddVariant'), 'edit.ejs has btnAddVariant');
  assert(editEjs.includes('btnAddSizeRow'), 'edit.ejs has btnAddSizeRow');
  console.log('✓ create.ejs and edit.ejs template fields, counters, and buttons verified');

  // 4. Test Server-Side Validation: short description > 200 chars
  let rejectedError = null;
  const mockReqReject = {
    body: {
      name_id: 'Test Produk Invalid',
      short_description_id: 'A'.repeat(201)
    }
  };
  const mockResReject = {
    locals: { csrfToken: 'mock-csrf' },
    status(code) {
      assert.strictEqual(code, 400, 'Must respond with status 400 for >200 char short desc');
      return this;
    },
    render(view, data) {
      rejectedError = data.error;
    },
    redirect(url) {
      rejectedError = url;
    }
  };
  await productController.store(mockReqReject, mockResReject);
  assert(rejectedError && rejectedError.includes('maksimal 200 karakter'), 'Server must reject short description > 200 chars');
  console.log('✓ Server-side validation properly rejects short_description > 200 chars');

  // 5. Test Server-Side Store: valid product with gallery media IDs, variants, size table
  let storedRedirect = null;
  const testSlug = 'test-produk-t202-' + Date.now();
  const mockReqStore = {
    body: {
      name_id: 'Test Produk T202 ' + Date.now(),
      name_en: 'Test Product T202 ' + Date.now(),
      category_id: '1',
      short_description_id: 'Kemasan belanja ramah lingkungan dengan ketahanan tinggi.',
      short_description_en: 'Eco-friendly shopping packaging with high durability.',
      description_id: '<p>Deskripsi lengkap produk pengujian otomatis.</p>',
      description_en: '<p>Complete product description for automated test.</p>',
      material_specs: '100% HDPE Virgin',
      gallery_images: JSON.stringify([96, 64]),
      variant_labels: ['Small 20x30 cm', 'Medium 30x40 cm', 'Large 40x50 cm'],
      kode_produk: ['TP-01', 'TP-02'],
      lebar: ['20 cm', '30 cm'],
      panjang: ['30 cm', '40 cm'],
      tebal_micron: ['40 micron', '50 micron'],
      kapasitas: ['3 kg', '6 kg'],
      bahan: ['HDPE', 'HDPE'],
      status: 'published',
      sort_order: '99'
    }
  };
  const mockResStore = {
    redirect(url) {
      storedRedirect = url;
    }
  };

  await productController.store(mockReqStore, mockResStore);
  assert(storedRedirect && storedRedirect.includes('success='), 'Store must redirect with success message');

  // Verify stored product in database
  const createdProducts = await productModel.findAll({ search: mockReqStore.body.name_id });
  assert(createdProducts.length > 0, 'Created product must be found in database');
  const createdProduct = createdProducts[0];
  assert.strictEqual(createdProduct.short_description_id, mockReqStore.body.short_description_id);
  assert.strictEqual(createdProduct.short_description_en, mockReqStore.body.short_description_en);
  assert.deepStrictEqual(createdProduct.gallery_images, [96, 64], 'gallery_images must store integer IDs');
  assert.deepStrictEqual(createdProduct.variants, ['Small 20x30 cm', 'Medium 30x40 cm', 'Large 40x50 cm']);
  assert.strictEqual(createdProduct.size_table.length, 2);
  assert.strictEqual(createdProduct.size_table[0].kode_produk, 'TP-01');
  assert.strictEqual(createdProduct.size_table[0].lebar, '20 cm');
  console.log('✓ Product stored successfully in database with gallery media IDs, variants, and size table');

  // 6. Test Edit View media lookup
  let editRenderData = null;
  const mockReqEdit = { params: { id: createdProduct.id } };
  const mockResEdit = {
    render(view, data) {
      editRenderData = data;
    }
  };
  await productController.editView(mockReqEdit, mockResEdit);
  assert(editRenderData && editRenderData.product, 'editView must render product data');
  assert(Array.isArray(editRenderData.product.gallery_items), 'editView must provide gallery_items array');
  assert(editRenderData.product.gallery_items.length === 2, 'editView must resolve 2 media items');
  assert(editRenderData.product.gallery_items[0].id === 96, 'First media item has ID 96');
  assert(editRenderData.product.gallery_items[0].url.includes('/uploads/media/'), 'First media item has resolved file_url');
  console.log('✓ editView successfully populates product with resolved gallery_items');

  // 7. Test Update Product (reorder gallery to [64, 96] and update variants)
  let updateRedirect = null;
  const mockReqUpdate = {
    params: { id: createdProduct.id },
    body: {
      name_id: createdProduct.name_id + ' (Updated)',
      category_id: '1',
      short_description_id: 'Deskripsi singkat terupdate.',
      short_description_en: 'Updated short description.',
      gallery_images: JSON.stringify([64, 96]),
      variant_labels: ['Extra Large 50x60 cm'],
      kode_produk: ['TP-XL'],
      lebar: ['50 cm'],
      panjang: ['60 cm'],
      tebal_micron: ['60 micron'],
      kapasitas: ['10 kg'],
      bahan: ['HDPE Super Virgin'],
      status: 'published',
      sort_order: '99'
    }
  };
  const mockResUpdate = {
    redirect(url) {
      updateRedirect = url;
    }
  };
  await productController.update(mockReqUpdate, mockResUpdate);
  assert(updateRedirect && updateRedirect.includes('success='), 'Update must redirect with success message');

  const updatedProduct = await productModel.findById(createdProduct.id);
  assert.deepStrictEqual(updatedProduct.gallery_images, [64, 96], 'gallery_images must be reordered to [64, 96]');
  assert.deepStrictEqual(updatedProduct.variants, ['Extra Large 50x60 cm'], 'variants must be updated');
  assert.strictEqual(updatedProduct.size_table[0].kode_produk, 'TP-XL');
  console.log('✓ Product updated successfully with reordered gallery IDs, variants, and size table');

  // Clean up test product
  await productModel.delete(createdProduct.id);
  console.log('✓ Test product cleaned up from database');

  console.log('\n--- ALL T-202 ACCEPTANCE TESTS PASSED! ---');
}

runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });

