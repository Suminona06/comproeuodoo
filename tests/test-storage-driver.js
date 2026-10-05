import sharp from 'sharp';
import storage from '../config/storage.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

async function runStorageTest() {
  console.log('Testing storage driver & Sharp WebP pipeline...');

  // 1. Test basic storage save
  const testBuffer = Buffer.from('test storage content');
  const saved = await storage.save(testBuffer, 'test-unit-file.txt', 'text/plain', 'media');
  console.log('1. Saved file to storage:', saved.url, '| Driver:', saved.driver);

  // 2. Test sharp processing (100x100 PNG to WebP)
  const sampleImage = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 0, g: 85, b: 184, alpha: 1 }
    }
  }).png().toBuffer();

  const webpUrl = await uploadMiddleware.processAndSaveWebP(sampleImage, 'banners');
  console.log('2. Processed and saved WebP banner:', webpUrl);

  const productWebpUrl = await uploadMiddleware.processAndSaveWebP(sampleImage, 'products');
  console.log('3. Processed and saved WebP product:', productWebpUrl);

  const brandWebpUrl = await uploadMiddleware.processAndSaveWebP(sampleImage, 'brands');
  console.log('4. Processed and saved WebP brand:', brandWebpUrl);

  // 3. Test video saving
  const mockVideoBuffer = Buffer.from('mock video mp4 data');
  const videoUrl = await uploadMiddleware.saveVideoFile(mockVideoBuffer, 'sample.mp4', 'banners');
  console.log('5. Saved video file:', videoUrl);

  // 4. Test document saving
  const mockDocBuffer = Buffer.from('mock pdf data');
  const docResult = await uploadMiddleware.saveDocumentFile(mockDocBuffer, 'sample.pdf', 'media');
  console.log('6. Saved doc file:', docResult.url);

  // 5. Clean up test files
  await storage.delete(saved.url);
  await uploadMiddleware.deleteUploadedFile(webpUrl);
  await uploadMiddleware.deleteUploadedFile(productWebpUrl);
  await uploadMiddleware.deleteUploadedFile(brandWebpUrl);
  await uploadMiddleware.deleteUploadedFile(videoUrl);
  await uploadMiddleware.deleteUploadedFile(docResult.url);
  console.log('7. Successfully cleaned up all test files.');

  console.log('ALL STORAGE & PIPELINE TESTS PASSED!');
  process.exit(0);
}

runStorageTest().catch(err => {
  console.error('Test storage failed:', err);
  process.exit(1);
});
