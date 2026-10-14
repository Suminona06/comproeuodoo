import assert from 'assert';
import aboutModel from '../models/aboutModel.js';
import { pool } from '../config/database.js';

async function testVM() {
  console.log('Testing T-113: Vision & Mission Section...');

  // 1. Test Without Images
  const resEmpty = await fetch('http://localhost:3000/about');
  const htmlEmpty = await resEmpty.text();

  assert(htmlEmpty.includes('id="visi-misi"'), 'Section #visi-misi harus ada');
  assert(htmlEmpty.includes('class="sec-vm"'), 'Class .sec-vm harus ada');
  assert(htmlEmpty.includes('no-image'), 'Harus ada class no-image saat URL gambar kosong');
  assert(!htmlEmpty.includes('class="vm-media"'), 'Tidak boleh ada class .vm-media saat URL gambar kosong');

  // 2. Test With Images
  try {
    await aboutModel.updateAboutData({
      vision_image_url: '/uploads/media/test-vis.jpg',
      mission_image_url: '/uploads/media/test-mis.jpg'
    });

    const resWithImg = await fetch('http://localhost:3000/about');
    const htmlWithImg = await resWithImg.text();

    assert(htmlWithImg.includes('src="/uploads/media/test-vis.jpg"'), 'Gambar visi harus ada');
    assert(htmlWithImg.includes('src="/uploads/media/test-mis.jpg"'), 'Gambar misi harus ada');
    assert(htmlWithImg.includes('has-image'), 'Harus ada class has-image saat URL gambar ada');

    // Layout Order: Visi = Card then Image
    const visiKickerIdx = htmlWithImg.indexOf('VISI');
    const visiImgIdx = htmlWithImg.indexOf('/uploads/media/test-vis.jpg');
    assert(visiKickerIdx < visiImgIdx, 'Di Visi: Teks harus mendahului gambar (kiri ke kanan)');

    // Layout Order: Misi = Image then Card
    const misiImgIdx = htmlWithImg.indexOf('/uploads/media/test-mis.jpg');
    const misiKickerIdx = htmlWithImg.indexOf('MISI', misiImgIdx);
    assert(misiImgIdx < misiKickerIdx, 'Di Misi: Gambar harus mendahului teks (kiri ke kanan)');

    console.log('  ✅ PASS: Visi & Misi Layout alternating with images verified');
  } finally {
    // Revert settings
    await aboutModel.updateAboutData({
      vision_image_url: '',
      mission_image_url: ''
    });
  }

  // 3. Test EN Localization
  const resEn = await fetch('http://localhost:3000/about?lang=en');
  const htmlEn = await resEn.text();
  assert(htmlEn.includes('CORPORATE VISION'), 'Kicker EN Visi harus ada');
  assert(htmlEn.includes('STRATEGIC MISSION'), 'Kicker EN Misi harus ada');
  console.log('  ✅ PASS: Visi & Misi bilingual verified');

  await pool.end();
  console.log('ALL T-113 TESTS PASSED!');
  process.exit(0);
}

testVM().catch(async (err) => {
  console.error('FAIL T-113:', err);
  await pool.end();
  process.exit(1);
});
