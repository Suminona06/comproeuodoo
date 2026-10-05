import dotenv from 'dotenv';
dotenv.config();

import { escapeCsvValue, generateCsv } from '../utils/csvExporter.js';
import brandModel from '../models/brandModel.js';
import mediaModel from '../models/mediaModel.js';
import productCategoryModel from '../models/productCategoryModel.js';
import productModel from '../models/productModel.js';
import postCategoryModel from '../models/postCategoryModel.js';
import postModel from '../models/postModel.js';
import inquiryModel from '../models/inquiryModel.js';
import bannerModel from '../models/bannerModel.js';
import userModel from '../models/userModel.js';

async function runModul11Tests() {
  console.log('--- STARTING MODUL 11 (CMS ADMIN v2.0) TESTS ---');

  // ==========================================
  // TEST 1: CSV Exporter Utility
  // ==========================================
  console.log('\n[TEST 1] Testing CSV Exporter...');
  const testVal = escapeCsvValue('Plastik, "Super", Tebal\nBaru');
  if (!testVal.includes('""Super""') || !testVal.startsWith('"')) {
    throw new Error('CSV escaping failed for special characters');
  }
  const csvOutput = generateCsv(
    [{ label: 'Nama', key: 'name' }, { label: 'Harga', key: 'price' }],
    [{ name: 'HDPE Bag', price: 1500 }]
  );
  if (!csvOutput.includes('Nama') || !csvOutput.includes('HDPE Bag')) {
    throw new Error('CSV generation failed');
  }
  console.log('  1a. CSV Escaping & Header Generation: PASSED');

  // ==========================================
  // TEST 2: Brand Model CRUD
  // ==========================================
  console.log('\n[TEST 2] Testing brandModel...');
  const testBrandId = await brandModel.create({
    name: 'Brand Unit Test',
    logo_url: '/uploads/brands/test.webp',
    description_id: 'Merek uji unit',
    description_en: 'Unit test brand',
    sort_order: 99,
    is_active: true
  });
  console.log('  2a. Brand created with ID:', testBrandId);

  const fetchedBrand = await brandModel.findById(testBrandId);
  if (!fetchedBrand || fetchedBrand.name !== 'Brand Unit Test') {
    throw new Error('Brand findById failed');
  }
  console.log('  2b. Brand retrieved successfully: PASSED');

  const toggled = await brandModel.toggleActive(testBrandId);
  if (toggled !== false) throw new Error('Expected brand is_active to toggle to false');
  console.log('  2c. Brand toggleActive: PASSED');

  await brandModel.delete(testBrandId);
  const deletedCheck = await brandModel.findById(testBrandId);
  if (deletedCheck) throw new Error('Brand was not deleted properly');
  console.log('  2d. Brand deleted and cleaned up: PASSED');

  // ==========================================
  // TEST 3: Media Model & YouTube Embeds
  // ==========================================
  console.log('\n[TEST 3] Testing mediaModel...');
  const testMediaId = await mediaModel.create({
    filename: 'Test Factory Video',
    file_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    mime_type: 'video/youtube',
    file_size: 0,
    media_type: 'youtube',
    youtube_id: 'dQw4w9WgXcQ',
    created_by: null
  });
  console.log('  3a. YouTube media entry created with ID:', testMediaId);

  const mediaCounts = await mediaModel.countByType();
  if (mediaCounts.youtube < 1) throw new Error('Expected at least 1 youtube media in count');
  console.log('  3b. Media countByType: PASSED (YouTube count:', mediaCounts.youtube, ')');

  await mediaModel.delete(testMediaId);
  console.log('  3c. Media deleted and cleaned up: PASSED');

  // ==========================================
  // TEST 4: Product Category Model CRUD
  // ==========================================
  console.log('\n[TEST 4] Testing productCategoryModel...');
  const testCatId = await productCategoryModel.create({
    name_id: 'Kategori Uji Unit',
    name_en: 'Unit Test Category',
    slug: 'kategori-uji-unit-' + Date.now(),
    sort_order: 88,
    description_id: 'Deskripsi kategori uji unit'
  });
  console.log('  4a. Product category created with ID:', testCatId);

  const fetchedCat = await productCategoryModel.findById(testCatId);
  if (!fetchedCat || fetchedCat.name_id !== 'Kategori Uji Unit') {
    throw new Error('Product category findById failed');
  }
  console.log('  4b. Product category retrieved: PASSED');

  await productCategoryModel.delete(testCatId);
  console.log('  4c. Product category deleted: PASSED');

  // ==========================================
  // TEST 5: Product Model v2 (Variants & JSON Specs)
  // ==========================================
  console.log('\n[TEST 5] Testing productModel v2...');
  const testProdId = await productModel.create({
    name_id: 'Produk Kantong Uji Unit',
    name_en: 'Unit Test Bag',
    slug: 'produk-kantong-uji-unit-' + Date.now(),
    material_specs: '100% Virgin Resins & Food Grade',
    technical_specs: { 'Tensile Strength': '35 MPa', 'Elongation': '400%' },
    variants: [
      { size_label: '24x40 cm', thickness: '0.035 mm', color: 'Putih', material_type: 'HDPE' },
      { size_label: '28x48 cm', thickness: '0.040 mm', color: 'Merah', material_type: 'HDPE' }
    ],
    status: 'published',
    featured: true,
    sort_order: 1
  });
  console.log('  5a. Product created with ID:', testProdId);

  const fetchedProd = await productModel.findById(testProdId);
  if (!fetchedProd || fetchedProd.name_id !== 'Produk Kantong Uji Unit') {
    throw new Error('Product retrieval failed');
  }
  if (!fetchedProd.technical_specs || fetchedProd.technical_specs['Tensile Strength'] !== '35 MPa') {
    throw new Error('Product technical_specs JSON was not parsed properly');
  }
  if (!fetchedProd.variants || fetchedProd.variants.length !== 2) {
    throw new Error('Product variants were not saved or retrieved properly');
  }
  console.log('  5b. Technical specs parsed:', fetchedProd.technical_specs);
  console.log('  5c. Product variants loaded (count: ' + fetchedProd.variants.length + '): PASSED');

  await productModel.delete(testProdId);
  const deletedProdCheck = await productModel.findById(testProdId);
  if (deletedProdCheck) throw new Error('Product was not deleted properly');
  console.log('  5d. Product and variants deleted cleanly: PASSED');

  // ==========================================
  // TEST 6: Post Category & Post Model v2
  // ==========================================
  console.log('\n[TEST 6] Testing postModel v2 (3-Tabs, Headlines & Schedule)...');
  const testPostCatId = await postCategoryModel.create({
    name_id: 'Kategori Berita Unit',
    slug: 'kategori-berita-unit-' + Date.now(),
    type: 'berita',
    sort_order: 1
  });

  const testPostId = await postModel.create({
    title_id: 'Siaran Pers Unit Test v2',
    slug: 'siaran-pers-unit-test-' + Date.now(),
    category_id: testPostCatId,
    content_id: 'Isi siaran pers uji unit...',
    type: 'pers',
    status: 'published',
    is_headline: true
  });
  console.log('  6a. Post created with ID:', testPostId);

  const fetchedPost = await postModel.findById(testPostId);
  if (!fetchedPost || fetchedPost.type !== 'pers' || !fetchedPost.is_headline) {
    throw new Error('Post retrieval or headline flag failed');
  }
  console.log('  6b. Post retrieved with type: ' + fetchedPost.type + ' and is_headline: ' + fetchedPost.is_headline + ': PASSED');

  await postModel.delete(testPostId);
  await postCategoryModel.delete(testPostCatId);
  console.log('  6c. Post and category deleted cleanly: PASSED');

  // ==========================================
  // TEST 7: Inquiry Model v2 (RFQ)
  // ==========================================
  console.log('\n[TEST 7] Testing inquiryModel v2...');
  const testInquiryId = await inquiryModel.create({
    name: 'Bapak Direktur Test',
    company: 'PT Maju Bersama Test',
    email: 'direktur@majubersama.co.id',
    phone: '081299887766',
    message: 'Kebutuhan 50.000 pcs shopping bag degradable',
    source: 'rfq_modal',
    status: 'baru'
  });
  console.log('  7a. Inquiry created with ID:', testInquiryId);

  const fetchedInq = await inquiryModel.findById(testInquiryId);
  if (!fetchedInq || fetchedInq.company !== 'PT Maju Bersama Test') {
    throw new Error('Inquiry retrieval failed');
  }
  console.log('  7b. Inquiry retrieved: PASSED');

  await inquiryModel.updateStatus(testInquiryId, 'ditindaklanjuti', 'Telah dihubungi sales dan dikirim penawaran');
  const updatedInq = await inquiryModel.findById(testInquiryId);
  if (updatedInq.status !== 'ditindaklanjuti' || !updatedInq.admin_notes.includes('Telah dihubungi')) {
    throw new Error('Inquiry status and admin_notes update failed');
  }
  console.log('  7c. Inquiry status updated to ditindaklanjuti with admin notes: PASSED');

  await inquiryModel.delete(testInquiryId);
  console.log('  7d. Inquiry deleted cleanly: PASSED');

  // ==========================================
  // TEST 8: Banner Model v2
  // ==========================================
  console.log('\n[TEST 8] Testing bannerModel v2...');
  const activeBannersCount = await bannerModel.countActive();
  if (activeBannersCount < 1) throw new Error('System should have at least 1 active banner from seed');
  console.log('  8a. Active banners count in DB:', activeBannersCount, ': PASSED');

  const allBanners = await bannerModel.findAll(false);
  if (allBanners.length < 1) throw new Error('No banners found in system');
  console.log('  8b. Total banners in DB:', allBanners.length, ': PASSED');

  console.log('\n--- ALL MODUL 11 TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runModul11Tests().catch(err => {
  console.error('\nMODUL 11 TEST FAILED:', err);
  process.exit(1);
});
