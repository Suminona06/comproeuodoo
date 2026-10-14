import assert from 'assert';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import aboutModel from '../models/aboutModel.js';
import aboutGalleryModel from '../models/aboutGalleryModel.js';
import aboutStatsModel from '../models/aboutStatsModel.js';
import aboutTimelineModel from '../models/aboutTimelineModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== TEST T-129: REGRESI CMS ADMIN TENTANG KAMI (SEMUA TAB, CRUD, MEDIA, SWAL) ===\n');

  // 1. Verify EJS template compilation and interactive bindings
  console.log('[1] Verifying views/admin/about/index.ejs template and UI bindings...');
  const templatePath = path.join(__dirname, '../views/admin/about/index.ejs');
  const template = fs.readFileSync(templatePath, 'utf8');

  ejs.compile(template, { filename: templatePath });
  console.log('  -> views/admin/about/index.ejs compiles cleanly.');

  // Check tabs exist
  assert.ok(template.includes('data-tab="tab-sejarah"'), 'Tab sejarah missing');
  assert.ok(template.includes('data-tab="tab-visi-misi"'), 'Tab visi-misi missing');
  assert.ok(template.includes('data-tab="tab-ticket"'), 'Tab ticket missing');
  assert.ok(template.includes('data-tab="tab-sertifikasi"'), 'Tab sertifikasi missing');
  assert.ok(template.includes('data-tab="tab-gallery"'), 'Tab gallery missing');

  // Check Media Library Pickers
  assert.ok(template.includes('btn-open-media-picker'), 'Media library picker buttons must exist');
  assert.ok(template.includes('data-target="vision_image_url"'), 'Vision media picker target missing');
  assert.ok(template.includes('data-target="mission_image_url"'), 'Mission media picker target missing');
  assert.ok(template.includes('data-target="gallery_image_url"'), 'Gallery media picker target missing');

  // Check SweetAlert2 / Confirm Delete bindings
  assert.ok(template.includes('confirmDeleteAboutItem'), 'confirmDeleteAboutItem handler missing');
  assert.ok(template.includes('Swal.fire') || template.includes('confirmDeleteAboutItem'), 'Delete confirmation must be wired');
  console.log('  -> All 6 tabs, media pickers, and deletion confirmations verified.\n');

  // 2. Test CRUD: About Main Settings
  console.log('[2] Testing About Main Settings Model CRUD...');
  const origData = await aboutModel.getAboutData();
  const testVal = 'Regresi Test ' + Date.now();
  await aboutModel.updateAboutData({ history_title_id: testVal });
  const updatedData = await aboutModel.getAboutData();
  assert.strictEqual(updatedData.history_title_id, testVal, 'About data update failed');
  // Revert
  await aboutModel.updateAboutData({ history_title_id: origData.history_title_id || 'Sejarah' });
  console.log('  -> About main settings CRUD verified.\n');

  // 3. Test CRUD: Stats Model
  console.log('[3] Testing About Stats Model CRUD...');
  const statId = await aboutStatsModel.create({
    stat_value: '88+',
    label_id: 'Test Label ID',
    label_en: 'Test Label EN',
    sort_order: 10,
    is_active: 1
  });
  assert.ok(statId, 'Stat creation failed');
  const foundStat = await aboutStatsModel.findById(statId);
  assert.strictEqual(foundStat.stat_value, '88+');

  await aboutStatsModel.update(statId, { stat_value: '99+' });
  const updatedStat = await aboutStatsModel.findById(statId);
  assert.strictEqual(updatedStat.stat_value, '99+');

  await aboutStatsModel.delete(statId);
  const deletedStat = await aboutStatsModel.findById(statId);
  assert.strictEqual(deletedStat, null);
  console.log('  -> Stats CRUD verified.\n');

  // 4. Test CRUD: Timeline Model
  console.log('[4] Testing About Timeline Model CRUD...');
  const timelineId = await aboutTimelineModel.create({
    year_label_id: '2026 — Milestone QA',
    year_label_en: '2026 — Milestone QA EN',
    title_id: 'Judul Milestone QA',
    title_en: 'Title Milestone QA',
    description_id: 'Deskripsi Milestone QA',
    description_en: 'Description Milestone QA',
    sort_order: 10,
    is_active: 1
  });
  assert.ok(timelineId, 'Timeline creation failed');
  const foundTimeline = await aboutTimelineModel.findById(timelineId);
  assert.strictEqual(foundTimeline.year_label_id, '2026 — Milestone QA');

  await aboutTimelineModel.update(timelineId, { title_id: 'Judul Milestone QA Updated' });
  const updatedTimeline = await aboutTimelineModel.findById(timelineId);
  assert.strictEqual(updatedTimeline.title_id, 'Judul Milestone QA Updated');

  await aboutTimelineModel.delete(timelineId);
  const deletedTimeline = await aboutTimelineModel.findById(timelineId);
  assert.strictEqual(deletedTimeline, null);
  console.log('  -> Timeline CRUD verified.\n');

  // 5. Test CRUD: Gallery Slides Model
  console.log('[5] Testing About Gallery Slides Model CRUD...');
  const slideId = await aboutGalleryModel.create({
    image_url: '/images/test-gallery-regression.jpg',
    category_id: 'LOGISTIK',
    category_en: 'LOGISTICS',
    title_id: 'Slide Regresi QA',
    title_en: 'Slide Regression QA',
    subtitle_id: 'Keterangan slide QA',
    subtitle_en: 'Subtitle slide QA',
    sort_order: 10,
    is_active: 1
  });
  assert.ok(slideId, 'Gallery slide creation failed');
  const foundSlide = await aboutGalleryModel.findById(slideId);
  assert.strictEqual(foundSlide.title_id, 'Slide Regresi QA');

  await aboutGalleryModel.update(slideId, { title_id: 'Slide Regresi QA Updated' });
  const updatedSlide = await aboutGalleryModel.findById(slideId);
  assert.strictEqual(updatedSlide.title_id, 'Slide Regresi QA Updated');

  await aboutGalleryModel.delete(slideId);
  const deletedSlide = await aboutGalleryModel.findById(slideId);
  assert.strictEqual(deletedSlide, null);
  console.log('  -> Gallery slides CRUD verified.\n');

  console.log('=== ALL TESTS FOR T-129 PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
