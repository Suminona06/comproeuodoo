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

async function runKelompokCTests() {
  console.log('=== STARTING TESTS KELOMPOK C (T-115 - T-119) ===\n');

  // -------------------------------------------------------------
  // Test T-115: CTA Button Absence on Public About Hero
  // -------------------------------------------------------------
  console.log('[TEST T-115] Verifying absence of CTA button on Public About hero...');
  const aboutEjsContent = fs.readFileSync(path.join(__dirname, '../views/public/about.ejs'), 'utf8');
  assert.ok(!aboutEjsContent.includes('heroBanner.cta_url'), 'T-115 Failed: heroBanner.cta_url should be removed from about.ejs hero');
  assert.ok(!aboutEjsContent.includes('hero-cta-btn'), 'T-115 Failed: hero-cta-btn should be removed from about.ejs hero');
  console.log('  -> T-115 PASSED: CTA button completely removed from /about hero section.\n');

  // -------------------------------------------------------------
  // Test T-116: Admin CMS Gallery Tab & Slide CRUD
  // -------------------------------------------------------------
  console.log('[TEST T-116] Testing Gallery Tab in CMS Admin & Model CRUD...');
  const adminAboutEjs = fs.readFileSync(path.join(__dirname, '../views/admin/about/index.ejs'), 'utf8');
  assert.ok(adminAboutEjs.includes('data-tab="tab-gallery"'), 'T-116 Failed: Tab button tab-gallery missing');
  assert.ok(adminAboutEjs.includes('id="tab-gallery"'), 'T-116 Failed: Tab pane tab-gallery missing');
  assert.ok(adminAboutEjs.includes('id="galleryModal"'), 'T-116 Failed: galleryModal missing');
  assert.ok(adminAboutEjs.includes('id="gallery_image_url"'), 'T-116 Failed: gallery_image_url input missing');
  assert.ok(adminAboutEjs.includes('openGalleryModal'), 'T-116 Failed: openGalleryModal handler missing');

  // Verify that views/admin/about/index.ejs compiles cleanly with EJS compiler without any SyntaxError
  ejs.compile(adminAboutEjs, { filename: path.join(__dirname, '../views/admin/about/index.ejs') });
  console.log('  -> EJS Template views/admin/about/index.ejs compiles with ZERO syntax errors.');

  // Test Gallery Model CRUD
  const testSlideId = await aboutGalleryModel.create({
    image_url: '/images/test-gallery-unit.jpg',
    category_id: 'TEST KATEGORI',
    category_en: 'TEST CATEGORY',
    title_id: 'Test Slide Judul Unit',
    title_en: 'Test Slide Title Unit',
    subtitle_id: 'Keterangan slide unit test',
    subtitle_en: 'Unit test slide subtitle',
    sort_order: 99,
    is_active: 1
  });
  assert.ok(testSlideId, 'T-116 Failed: Slide creation should return an ID');

  const retrievedSlide = await aboutGalleryModel.findById(testSlideId);
  assert.strictEqual(retrievedSlide.title_id, 'Test Slide Judul Unit');

  await aboutGalleryModel.update(testSlideId, { title_id: 'Test Slide Judul Updated' });
  const updatedSlide = await aboutGalleryModel.findById(testSlideId);
  assert.strictEqual(updatedSlide.title_id, 'Test Slide Judul Updated');

  await aboutGalleryModel.delete(testSlideId);
  const deletedSlide = await aboutGalleryModel.findById(testSlideId);
  assert.strictEqual(deletedSlide, null);
  console.log('  -> T-116 PASSED: Gallery Tab UI and CRUD model methods verified.\n');

  // -------------------------------------------------------------
  // Test T-117: Admin CMS Sejarah Tab (Stats + Timeline)
  // -------------------------------------------------------------
  console.log('[TEST T-117] Testing Sejarah Tab (Stats & Timeline) & Model CRUD...');
  assert.ok(adminAboutEjs.includes('id="about_story_kicker_id"'), 'T-117 Failed: story kicker id input missing');
  assert.ok(adminAboutEjs.includes('id="statsModal"'), 'T-117 Failed: statsModal missing');
  assert.ok(adminAboutEjs.includes('id="timelineModal"'), 'T-117 Failed: timelineModal missing');
  assert.ok(adminAboutEjs.includes('openStatsModal'), 'T-117 Failed: openStatsModal handler missing');
  assert.ok(adminAboutEjs.includes('openTimelineModal'), 'T-117 Failed: openTimelineModal handler missing');

  // Test Stats Model CRUD
  const testStatId = await aboutStatsModel.create({
    stat_value: '99+',
    label_id: 'Test Stat Label Unit',
    label_en: 'Test Stat Label EN',
    sort_order: 99,
    is_active: 1
  });
  assert.ok(testStatId, 'T-117 Failed: Stat creation should return an ID');

  const retrievedStat = await aboutStatsModel.findById(testStatId);
  assert.strictEqual(retrievedStat.stat_value, '99+');

  await aboutStatsModel.update(testStatId, { stat_value: '100+' });
  const updatedStat = await aboutStatsModel.findById(testStatId);
  assert.strictEqual(updatedStat.stat_value, '100+');

  await aboutStatsModel.delete(testStatId);
  const deletedStat = await aboutStatsModel.findById(testStatId);
  assert.strictEqual(deletedStat, null);

  // Test Timeline Model CRUD
  const testTimelineId = await aboutTimelineModel.create({
    year_label_id: '2026 — Milestone Unit',
    year_label_en: '2026 — Unit Milestone',
    title_id: 'Judul Timeline Unit',
    title_en: 'Unit Timeline Title',
    description_id: 'Deskripsi unit timeline',
    description_en: 'Unit timeline description',
    sort_order: 99,
    is_active: 1
  });
  assert.ok(testTimelineId, 'T-117 Failed: Timeline creation should return an ID');

  const retrievedTimeline = await aboutTimelineModel.findById(testTimelineId);
  assert.strictEqual(retrievedTimeline.year_label_id, '2026 — Milestone Unit');

  await aboutTimelineModel.update(testTimelineId, { title_id: 'Updated Timeline Title' });
  const updatedTimeline = await aboutTimelineModel.findById(testTimelineId);
  assert.strictEqual(updatedTimeline.title_id, 'Updated Timeline Title');

  await aboutTimelineModel.delete(testTimelineId);
  const deletedTimeline = await aboutTimelineModel.findById(testTimelineId);
  assert.strictEqual(deletedTimeline, null);
  console.log('  -> T-117 PASSED: Sejarah Tab UI and Stats & Timeline CRUD verified.\n');

  // -------------------------------------------------------------
  // Test T-118: Media Library Picker for Vision & Mission in CMS
  // -------------------------------------------------------------
  console.log('[TEST T-118] Testing Media Library Picker for Vision & Mission in CMS...');
  assert.ok(adminAboutEjs.includes('id="vision_image_url"'), 'T-118 Failed: vision_image_url missing in Tab 2');
  assert.ok(adminAboutEjs.includes('id="mission_image_url"'), 'T-118 Failed: mission_image_url missing in Tab 2');
  assert.ok(adminAboutEjs.includes('data-target="vision_image_url"'), 'T-118 Failed: media picker target vision_image_url missing');
  assert.ok(adminAboutEjs.includes('data-target="mission_image_url"'), 'T-118 Failed: media picker target mission_image_url missing');

  // Test Getter & Setter on aboutModel
  const initialVm = await aboutModel.getVisionMissionImages();
  assert.ok(typeof initialVm === 'object', 'T-118 Failed: getVisionMissionImages should return an object');

  await aboutModel.updateAboutData({
    vision_image_url: '/images/hero-factory.jpg',
    mission_image_url: '/images/segment-sustainability.jpg'
  });
  const updatedVm = await aboutModel.getVisionMissionImages();
  assert.strictEqual(updatedVm.vision_image_url, '/images/hero-factory.jpg');
  assert.strictEqual(updatedVm.mission_image_url, '/images/segment-sustainability.jpg');
  console.log('  -> T-118 PASSED: Media Library Picker and model settings verified.\n');

  // -------------------------------------------------------------
  // Test T-119: Initial Seed Data Validation
  // -------------------------------------------------------------
  console.log('[TEST T-119] Testing Initial Seed Data (7 Slides, 4 Stats, 4 Milestones)...');
  const allSlides = await aboutGalleryModel.findAll();
  assert.ok(allSlides.length >= 7, `T-119 Failed: Expected at least 7 slides, found ${allSlides.length}`);

  const allStats = await aboutStatsModel.findAll();
  assert.ok(allStats.length >= 4, `T-119 Failed: Expected at least 4 stats, found ${allStats.length}`);

  const allTimeline = await aboutTimelineModel.findAll();
  assert.ok(allTimeline.length >= 4, `T-119 Failed: Expected at least 4 timeline items, found ${allTimeline.length}`);

  const galleryHeader = await aboutModel.getGalleryHeader();
  assert.ok(galleryHeader.title_id, 'T-119 Failed: galleryHeader title_id should be seeded');

  const storyHeader = await aboutModel.getStoryHeader();
  assert.ok(storyHeader.kicker_id, 'T-119 Failed: storyHeader kicker_id should be seeded');

  console.log('  -> T-119 PASSED: Seed data contains 7 slides, 4 stats, 4 milestones, and headers.\n');

  console.log('=== ALL TESTS FOR KELOMPOK C (T-115 - T-119) PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runKelompokCTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
