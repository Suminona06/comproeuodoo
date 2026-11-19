import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ejs from 'ejs';
import pool from '../config/database.js';
import storage from '../config/storage.js';
import settingModel from '../models/settingModel.js';
import { mediaFilter, saveDocumentFile, saveVideoFile } from '../middleware/uploadMiddleware.js';
import { sanitizeSafeHref, sanitizeSafePath } from '../utils/sanitizer.js';
import homeContentModel from '../models/homeContentModel.js';
import productCategoryModel from '../models/productCategoryModel.js';
import mediaModel from '../models/mediaModel.js';
import aboutModel from '../models/aboutModel.js';
import aboutGalleryModel from '../models/aboutGalleryModel.js';
import aboutStatsModel from '../models/aboutStatsModel.js';
import aboutTimelineModel from '../models/aboutTimelineModel.js';
import { homeContentController } from '../controllers/admin/homeContentController.js';
import { mediaController } from '../controllers/admin/mediaController.js';
import { aboutController } from '../controllers/admin/aboutController.js';
import {
  ALLOWED_KICKER_ICONS,
  buildIntroSection,
  buildWcuSection,
  buildCategoriesSection,
  buildHomepageCategories,
  buildCertificationsSection,
  buildCtaSection,
  buildHomeContentPayload,
  getAdminHomeContentData,
  updateAdminHomeContent
} from '../services/homeContentService.js';
import {
  getMediaLibraryViewData,
  buildEmptyMediaLibraryViewData,
  getMediaPickerList,
  uploadAndCreateMedia,
  registerYoutubeMedia,
  checkMediaUsage,
  deleteMediaItem
} from '../services/mediaService.js';
import * as aboutService from '../services/aboutService.js';
import * as aboutCrudService from '../services/aboutCrudService.js';

after(async () => {
  await pool.end();
});

describe('T-347: homeContentService & homeContentController', () => {
  it('builds intro section with trimming, max length truncation, and checkbox flag', () => {
    const intro = buildIntroSection({
      intro_eyebrow_id: `  ${'A'.repeat(120)}  `,
      intro_title_en: '  Title EN  ',
      intro_paragraph_1_id: 'P1',
      intro_image_url: ' /uploads/intro.webp ',
      intro_is_active: 'on'
    });
    assert.equal(intro.eyebrow_id.length, 100);
    assert.equal(intro.title_en, 'Title EN');
    assert.equal(intro.image_url, '/uploads/intro.webp');
    assert.equal(intro.is_active, 1);

    const inactive = buildIntroSection({ intro_is_active: '0' });
    assert.equal(inactive.is_active, 0);
  });

  it('validates WCU chip_icon against whitelist and defaults invalid icons to tree', () => {
    for (const icon of ALLOWED_KICKER_ICONS) {
      assert.equal(buildWcuSection({ wcu_chip_icon: icon }).chip_icon, icon);
    }
    assert.equal(buildWcuSection({ wcu_chip_icon: 'invalid-icon' }).chip_icon, 'tree');
    assert.equal(buildWcuSection({ wcu_is_active: '1', wcu_float_title_id: '  Clean  ' }).float_title_id, 'Clean');
    assert.equal(buildWcuSection({ wcu_is_active: '1' }).is_active, 1);
  });

  it('builds categories section and filters valid homepage category slots', () => {
    const categories = buildCategoriesSection({
      cat_title_id: '  Kategori  ',
      cat_title_en: '',
      cat_subtitle_en: '  Sub  '
    });
    assert.deepEqual(categories, {
      title_id: 'Kategori',
      title_en: '',
      subtitle_id: undefined,
      subtitle_en: 'Sub'
    });

    assert.equal(buildHomepageCategories({}), undefined);

    const slots = buildHomepageCategories({
      home_cat_0_id: '4',
      home_cat_0_image_url: ' /images/a.webp ',
      home_cat_1_id: '0',
      home_cat_2_id: 'abc',
      home_cat_3_id: '7'
    });
    assert.deepEqual(slots, [
      { category_id: 4, image_url: '/images/a.webp', sort_order: 1 },
      { category_id: 7, image_url: '', sort_order: 4 }
    ]);
  });

  it('filters unnamed certification items and preserves defaults for certifications and CTA', () => {
    const certs = buildCertificationsSection({
      cert_0_name: '  SNI  ',
      cert_0_is_active: '1',
      cert_1_name: '   ',
      cert_2_name: 'OXIUM',
      cert_2_sort_order: '9',
      cert_btn_url: '',
      cert_show_btn: 'on',
      cert_is_active: '1'
    });
    assert.equal(certs.btn_url, '/about#sertifikasi');
    assert.equal(certs.show_btn, 1);
    assert.equal(certs.is_active, 1);
    assert.deepEqual(certs.items, [
      { name: 'SNI', desc_id: '', desc_en: '', logo_url: '', sort_order: 1, is_active: 1 },
      { name: 'OXIUM', desc_id: '', desc_en: '', logo_url: '', sort_order: 9, is_active: 0 }
    ]);

    const cta = buildCtaSection({
      cta_title_id: 'Hubungi',
      cta_btn1_url: '',
      cta_page_home: '1',
      cta_page_404: 'on',
      cta_is_active: '1'
    });
    assert.equal(cta.btn1_url, '/contact');
    assert.equal(cta.pages.home, 1);
    assert.equal(cta.pages['404'], 1);
    assert.equal(cta.pages.contact, 0);
    assert.equal(cta.is_active, 1);
  });

  it('preserves omitted EN/ID fields on partial payload without wiping existing content', () => {
    const partial = buildHomeContentPayload({ intro_title_id: 'Only ID' });
    assert.equal(partial.intro.title_id, 'Only ID');
    assert.equal(partial.intro.title_en, undefined);
    assert.equal(partial.intro.paragraph_1_id, undefined);
    assert.equal(partial.why_choose_us.title_en, undefined);
    assert.equal(partial.why_choose_us.is_active, undefined);
    assert.equal(partial.homepage_categories, undefined);
    assert.equal(partial.certifications.items, undefined);
    assert.equal(partial.cta.pages, undefined);
    assert.equal(partial.cta.title_en, undefined);
  });

  it('assembles full 6-section payload via buildHomeContentPayload', () => {
    const payload = buildHomeContentPayload({
      intro_title_id: 'Intro',
      wcu_title_id: 'WCU',
      cat_title_id: 'Cat',
      home_cat_0_id: '5',
      cert_0_name: 'ISO',
      cta_title_id: 'CTA'
    });
    assert.deepEqual(Object.keys(payload), [
      'intro',
      'why_choose_us',
      'categories',
      'homepage_categories',
      'certifications',
      'cta'
    ]);
    assert.equal(payload.homepage_categories.length, 1);
    assert.equal(payload.certifications.items.length, 1);
  });

  it('delegates getAdminHomeContentData and updateAdminHomeContent to models', async () => {
    const origGet = homeContentModel.getHomeContentData;
    const origFindAll = productCategoryModel.findAll;
    const origUpdate = homeContentModel.updateHomeContent;
    let savedPayload = null;

    homeContentModel.getHomeContentData = async () => ({ intro: { title_id: 'Mock' } });
    productCategoryModel.findAll = async () => null;
    homeContentModel.updateHomeContent = async (p) => { savedPayload = p; };

    try {
      const viewData = await getAdminHomeContentData();
      assert.deepEqual(viewData.homeContent, { intro: { title_id: 'Mock' } });
      assert.deepEqual(viewData.allCategories, []);
      assert.deepEqual(viewData.allowedKickerIcons, ALLOWED_KICKER_ICONS);

      await updateAdminHomeContent({ intro_title_id: 'Saved', intro_is_active: '1' });
      assert.equal(savedPayload.intro.title_id, 'Saved');
      assert.equal(savedPayload.intro.is_active, 1);
    } finally {
      homeContentModel.getHomeContentData = origGet;
      productCategoryModel.findAll = origFindAll;
      homeContentModel.updateHomeContent = origUpdate;
    }
  });

  it('renders admin view and handles redirects in homeContentController', async () => {
    const origGet = homeContentModel.getHomeContentData;
    const origFindAll = productCategoryModel.findAll;
    const origUpdate = homeContentModel.updateHomeContent;

    homeContentModel.getHomeContentData = async () => ({ intro: {} });
    productCategoryModel.findAll = async () => [{ id: 1, name_id: 'HDPE' }];
    homeContentModel.updateHomeContent = async () => {};

    try {
      let rendered = null;
      await homeContentController.index(
        { query: { success: 'OK' } },
        { locals: { csrfToken: 'tok' }, render: (v, d) => { rendered = { v, d }; }, redirect() {} }
      );
      assert.equal(rendered.v, 'admin/home-content/index');
      assert.equal(rendered.d.activeNav, 'home-content');
      assert.equal(rendered.d.csrfToken, 'tok');
      assert.equal(rendered.d.success, 'OK');
      assert.deepEqual(rendered.d.allowedKickerIcons, ALLOWED_KICKER_ICONS);

      let redirectUrl = '';
      await homeContentController.update(
        { body: { intro_title_id: 'X' } },
        { redirect: (u) => { redirectUrl = u; } }
      );
      assert.equal(redirectUrl, '/admin/home-content?success=Konten+homepage+berhasil+diperbarui.');

      homeContentModel.updateHomeContent = async () => { throw new Error('DB fail'); };
      await homeContentController.update(
        { body: {} },
        { redirect: (u) => { redirectUrl = u; } }
      );
      assert.ok(redirectUrl.startsWith('/admin/home-content?error='));

      homeContentModel.getHomeContentData = async () => { throw new Error('Load fail'); };
      await homeContentController.index(
        { query: {} },
        { locals: {}, render() {}, redirect: (u) => { redirectUrl = u; } }
      );
      assert.equal(redirectUrl, '/admin/dashboard?error=Gagal+memuat+halaman+konten+homepage.');
    } finally {
      homeContentModel.getHomeContentData = origGet;
      productCategoryModel.findAll = origFindAll;
      homeContentModel.updateHomeContent = origUpdate;
    }
  });
});

const TINY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

describe('T-348: mediaService & mediaController', () => {
  it('computes pagination and fallback view data cleanly', async () => {
    const origFindAll = mediaModel.findAll;
    const origCount = mediaModel.count;
    const origCountByType = mediaModel.countByType;
    let capturedArgs = null;

    mediaModel.findAll = async (args) => {
      capturedArgs = args;
      return [{ id: 1, filename: 'a.webp' }];
    };
    mediaModel.count = async () => 85;
    mediaModel.countByType = async () => ({ all: 85, image: 80, video: 3, document: 1, youtube: 1 });

    try {
      const viewData = await getMediaLibraryViewData({ type: 'image', search: 'box', page: '0' });
      assert.equal(capturedArgs.limit, 40);
      assert.equal(capturedArgs.offset, 0);
      assert.equal(viewData.currentPage, 1);
      assert.equal(viewData.totalPages, 3);

      const picker = await getMediaPickerList({ type: 'video', page: '2', limit: '500' });
      assert.equal(capturedArgs.limit, 100);
      assert.equal(capturedArgs.offset, 100);
      assert.equal(picker.pagination.page, 2);
      assert.equal(picker.pagination.limit, 100);
      assert.equal(picker.pagination.totalPages, 1);

      const empty = buildEmptyMediaLibraryViewData();
      assert.equal(empty.totalPages, 1);
      assert.deepEqual(empty.countsByType, { all: 0, image: 0, video: 0, document: 0, youtube: 0 });
    } finally {
      mediaModel.findAll = origFindAll;
      mediaModel.count = origCount;
      mediaModel.countByType = origCountByType;
    }
  });

  it('handles image, video, pdf, missing, and unsupported uploads via unified uploadAndCreateMedia', async () => {
    const origSave = storage.save;
    const origCreate = mediaModel.create;
    const origFindById = mediaModel.findById;
    const createdRecords = [];

    storage.save = async (_buf, filename, mimeType, subFolder) => ({
      driver: 'local',
      filename,
      subFolder,
      url: `/uploads/${subFolder}/${filename}`,
      size: 123,
      mimeType
    });
    mediaModel.create = async (payload) => {
      createdRecords.push(payload);
      return createdRecords.length;
    };
    mediaModel.findById = async (id) => ({ id, ...createdRecords[id - 1] });

    try {
      assert.equal((await uploadAndCreateMedia(null, 1)).status, 'missing_file');
      assert.equal(
        (await uploadAndCreateMedia({ mimetype: 'application/zip', originalname: 'a.zip', size: 10 }, 1)).status,
        'unsupported_type'
      );

      const imgRes = await uploadAndCreateMedia(
        { mimetype: 'image/png', originalname: 'pic.png', size: TINY_PNG_BUFFER.length, buffer: TINY_PNG_BUFFER },
        7,
        { includeRecord: true }
      );
      assert.equal(imgRes.status, 'created');
      assert.equal(imgRes.media.media_type, 'image');
      assert.equal(imgRes.media.created_by, 7);

      const vidRes = await uploadAndCreateMedia(
        { mimetype: 'video/mp4', originalname: 'clip.mp4', size: 3, buffer: Buffer.from('mp4') },
        7
      );
      assert.equal(vidRes.status, 'created');
      assert.equal(vidRes.media, null);
      assert.equal(createdRecords[1].media_type, 'video');

      const docRes = await uploadAndCreateMedia(
        { mimetype: 'application/pdf', originalname: 'spec.pdf', size: 4, buffer: Buffer.from('%PDF') },
        null
      );
      assert.equal(docRes.status, 'created');
      assert.equal(createdRecords[2].media_type, 'document');
    } finally {
      storage.save = origSave;
      mediaModel.create = origCreate;
      mediaModel.findById = origFindById;
    }
  });

  it('registers YouTube media and checks usage', async () => {
    const origCreate = mediaModel.create;
    const origCheckUsage = mediaModel.checkUsage;
    let saved = null;

    mediaModel.create = async (data) => { saved = data; return 55; };
    mediaModel.checkUsage = async (url) => (url === '/used.webp' ? [{ source: 'Banner', label: 'Hero' }] : []);

    try {
      assert.equal((await registerYoutubeMedia({ youtubeUrl: 'https://example.com' })).status, 'invalid_url');
      const ok = await registerYoutubeMedia({
        youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
        title: '  Company Tour  ',
        userId: 3
      });
      assert.equal(ok.status, 'created');
      assert.equal(ok.id, 55);
      assert.equal(saved.filename, 'Company Tour');
      assert.equal(saved.youtube_id, 'dQw4w9WgXcQ');
      assert.equal(saved.file_url, 'https://www.youtube.com/embed/dQw4w9WgXcQ');

      assert.deepEqual(await checkMediaUsage(''), { inUse: false, usages: [] });
      assert.deepEqual(await checkMediaUsage('/used.webp'), {
        inUse: true,
        usages: [{ source: 'Banner', label: 'Hero' }]
      });
    } finally {
      mediaModel.create = origCreate;
      mediaModel.checkUsage = origCheckUsage;
    }
  });

  it('returns structured statuses in deleteMediaItem for not_found, in_use, force, and youtube', async () => {
    const origFindById = mediaModel.findById;
    const origCheckUsage = mediaModel.checkUsage;
    const origDelete = mediaModel.delete;
    const origStorageDelete = storage.delete;
    const storageDeletes = [];
    const dbDeletes = [];

    storage.delete = async (url) => { storageDeletes.push(url); return true; };
    mediaModel.delete = async (id) => { dbDeletes.push(id); return true; };

    try {
      mediaModel.findById = async () => null;
      assert.deepEqual(await deleteMediaItem(999), { status: 'not_found', usages: [] });

      mediaModel.findById = async () => ({ id: 10, media_type: 'image', file_url: '/uploads/media/a.webp' });
      mediaModel.checkUsage = async () => [{ source: 'Produk', label: 'Bag' }];
      const inUseRes = await deleteMediaItem(10);
      assert.equal(inUseRes.status, 'in_use');
      assert.equal(inUseRes.usages.length, 1);
      assert.equal(dbDeletes.length, 0);

      const forcedRes = await deleteMediaItem(10, { force: true });
      assert.equal(forcedRes.status, 'deleted');
      assert.deepEqual(storageDeletes, ['/uploads/media/a.webp']);
      assert.deepEqual(dbDeletes, [10]);

      mediaModel.findById = async () => ({ id: 11, media_type: 'youtube', file_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' });
      const ytRes = await deleteMediaItem(11, { force: true });
      assert.equal(ytRes.status, 'deleted');
      assert.equal(storageDeletes.length, 1);
      assert.deepEqual(dbDeletes, [10, 11]);
    } finally {
      mediaModel.findById = origFindById;
      mediaModel.checkUsage = origCheckUsage;
      mediaModel.delete = origDelete;
      storage.delete = origStorageDelete;
    }
  });

  it('preserves mediaController HTTP responses, JSON formats, and temp file cleanup', async () => {
    const origFindById = mediaModel.findById;
    const origCheckUsage = mediaModel.checkUsage;
    const origDelete = mediaModel.delete;
    const origStorageDelete = storage.delete;
    const origSave = storage.save;
    const origCreate = mediaModel.create;

    const tmpPath = path.join(os.tmpdir(), `euodoo-test-${Date.now()}.png`);
    fs.writeFileSync(tmpPath, TINY_PNG_BUFFER);

    storage.save = async (_buf, filename) => ({ url: `/uploads/media/${filename}` });
    mediaModel.create = async () => 77;
    mediaModel.findById = async (id) => (id === 77 ? { id: 77, filename: 'ok.png' } : null);
    mediaModel.checkUsage = async () => [{ source: 'Banner', label: 'Home' }];
    mediaModel.delete = async () => true;
    storage.delete = async () => true;

    try {
      let jsonOut = null;
      let statusCode = 200;
      const makeRes = () => ({
        status(code) { statusCode = code; return this; },
        json(body) { jsonOut = body; return this; },
        redirect(url) { jsonOut = { redirect: url }; return this; }
      });

      await mediaController.apiUpload(
        { file: { mimetype: 'image/png', originalname: 'ok.png', size: 10, path: tmpPath }, user: { id: 2 } },
        makeRes()
      );
      assert.equal(jsonOut.success, true);
      assert.equal(jsonOut.data.id, 77);
      assert.equal(fs.existsSync(tmpPath), false, 'Temp file must be cleaned up in finally block');

      statusCode = 200;
      await mediaController.apiUpload({ file: null }, makeRes());
      assert.equal(statusCode, 400);
      assert.equal(jsonOut.success, false);

      statusCode = 200;
      await mediaController.destroy(
        { params: { id: '99' }, query: {}, headers: { accept: 'application/json' } },
        makeRes()
      );
      assert.equal(statusCode, 404);

      mediaModel.findById = async () => ({ id: 12, media_type: 'image', file_url: '/uploads/media/x.webp' });
      statusCode = 200;
      await mediaController.destroy(
        { params: { id: '12' }, query: {}, headers: { accept: 'application/json' } },
        makeRes()
      );
      assert.equal(statusCode, 409);
      assert.equal(jsonOut.inUse, true);

      statusCode = 200;
      await mediaController.destroy(
        { params: { id: '12' }, query: { force: 'true' }, headers: { accept: 'application/json' } },
        makeRes()
      );
      assert.equal(statusCode, 200);
      assert.equal(jsonOut.success, true);
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      mediaModel.findById = origFindById;
      mediaModel.checkUsage = origCheckUsage;
      mediaModel.delete = origDelete;
      storage.delete = origStorageDelete;
      storage.save = origSave;
      mediaModel.create = origCreate;
    }
  });
});

describe('T-349: aboutService, aboutCrudService & aboutController', () => {
  it('re-exports sub-item parsers from aboutService for backward compatibility', () => {
    for (const fn of [
      'parseGallerySlideCreate',
      'parseGallerySlideUpdate',
      'parseStatCreate',
      'parseStatUpdate',
      'parseTimelineCreate',
      'parseTimelineUpdate'
    ]) {
      assert.equal(typeof aboutService[fn], 'function');
    }
  });

  it('loads admin about page data and updates content with WebP file or image_url', async () => {
    const origGetAbout = aboutModel.getAboutData;
    const origUpdateAbout = aboutModel.updateAboutData;
    const origGetGalleryHdr = aboutModel.getGalleryHeader;
    const origGetStoryHdr = aboutModel.getStoryHeader;
    const origGetTimelineHdr = aboutModel.getTimelineHeader;
    const origGetVm = aboutModel.getVisionMissionImages;
    const origGalAll = aboutGalleryModel.findAll;
    const origStatAll = aboutStatsModel.findAll;
    const origTimeAll = aboutTimelineModel.findAll;
    const origSave = storage.save;

    const payloads = [];
    aboutModel.getAboutData = async () => ({ founded_year: '1990', values: aboutModel.getDefaults().values });
    aboutModel.getGalleryHeader = async () => ({ title_id: 'Gal' });
    aboutModel.getStoryHeader = async () => ({ kicker_id: 'Kisah' });
    aboutModel.getTimelineHeader = async () => ({ title_id: 'Timeline' });
    aboutModel.getVisionMissionImages = async () => ({ vision_image_url: '', mission_image_url: '' });
    aboutGalleryModel.findAll = async () => [{ id: 1 }];
    aboutStatsModel.findAll = async () => [{ id: 2 }];
    aboutTimelineModel.findAll = async () => [{ id: 3 }];
    aboutModel.updateAboutData = async (p) => { payloads.push(p); };
    storage.save = async (_buf, filename) => ({ url: `/uploads/pages/${filename}`, size: 100, driver: 'local' });

    try {
      const pageData = await aboutService.getAdminAboutPageData();
      assert.equal(pageData.about.founded_year, '1990');
      assert.equal(pageData.ticketIconKeys.length, 6);
      assert.equal(pageData.gallerySlides.length, 1);
      assert.equal(pageData.stats.length, 1);
      assert.equal(pageData.timeline.length, 1);

      await aboutService.updateAdminAboutContent({ vision_id: 'Visi Baru' }, { buffer: TINY_PNG_BUFFER });
      assert.ok(payloads[0].image_url.startsWith('/uploads/pages/'));
      assert.equal(payloads[0].vision_id, 'Visi Baru');

      await aboutService.updateAdminAboutContent({ image_url: ' /images/plant.webp ' }, null);
      assert.equal(payloads[1].image_url, '/images/plant.webp');

      await aboutService.updateAdminAboutContent({ image_url: '' }, null);
      assert.equal(payloads[2].image_url, '');
    } finally {
      aboutModel.getAboutData = origGetAbout;
      aboutModel.updateAboutData = origUpdateAbout;
      aboutModel.getGalleryHeader = origGetGalleryHdr;
      aboutModel.getStoryHeader = origGetStoryHdr;
      aboutModel.getTimelineHeader = origGetTimelineHdr;
      aboutModel.getVisionMissionImages = origGetVm;
      aboutGalleryModel.findAll = origGalAll;
      aboutStatsModel.findAll = origStatAll;
      aboutTimelineModel.findAll = origTimeAll;
      storage.save = origSave;
    }
  });

  it('handles CRUD validation, 404, and persistence in aboutCrudService', async () => {
    const origGal = { findById: aboutGalleryModel.findById, create: aboutGalleryModel.create, update: aboutGalleryModel.update, delete: aboutGalleryModel.delete };
    const origStat = { findAll: aboutStatsModel.findAll, findById: aboutStatsModel.findById, create: aboutStatsModel.create, update: aboutStatsModel.update, delete: aboutStatsModel.delete };
    const origTime = { findById: aboutTimelineModel.findById, create: aboutTimelineModel.create, update: aboutTimelineModel.update, delete: aboutTimelineModel.delete };

    aboutGalleryModel.findById = async (id) => (id === '1' ? { id: 1 } : null);
    aboutGalleryModel.create = async () => 11;
    aboutGalleryModel.update = async () => true;
    aboutGalleryModel.delete = async () => true;

    aboutStatsModel.findAll = async () => [];
    aboutStatsModel.findById = async (id) => (id === '2' ? { id: 2 } : null);
    aboutStatsModel.create = async () => 22;
    aboutStatsModel.update = async () => true;
    aboutStatsModel.delete = async () => true;

    aboutTimelineModel.findById = async (id) => (id === '3' ? { id: 3 } : null);
    aboutTimelineModel.create = async () => 33;
    aboutTimelineModel.update = async () => true;
    aboutTimelineModel.delete = async () => true;

    try {
      assert.equal((await aboutCrudService.createGallerySlide({})).status, 'validation_error');
      assert.deepEqual(await aboutCrudService.createGallerySlide({ image_url: '/uploads/media/img.webp' }), { status: 'ok', id: 11 });
      assert.equal((await aboutCrudService.updateGallerySlide('999', {})).status, 'not_found');
      assert.equal((await aboutCrudService.updateGallerySlide('1', { image_url: '' })).status, 'validation_error');
      assert.deepEqual(await aboutCrudService.updateGallerySlide('1', { title_id: 'Baru' }), { status: 'ok' });
      assert.equal((await aboutCrudService.deleteGallerySlide('999')).status, 'not_found');
      assert.deepEqual(await aboutCrudService.deleteGallerySlide('1'), { status: 'ok' });

      assert.equal((await aboutCrudService.createStat({})).status, 'validation_error');
      assert.deepEqual(await aboutCrudService.createStat({ stat_value: '35+', label_id: 'Tahun' }), { status: 'ok', id: 22 });
      aboutStatsModel.findAll = async () => new Array(8).fill({});
      assert.equal((await aboutCrudService.createStat({ stat_value: '99%', label_id: 'X' })).status, 'validation_error');
      assert.equal((await aboutCrudService.updateStat('999', {})).status, 'not_found');
      assert.deepEqual(await aboutCrudService.updateStat('2', { stat_value: '40+' }), { status: 'ok' });
      assert.equal((await aboutCrudService.deleteStat('999')).status, 'not_found');
      assert.deepEqual(await aboutCrudService.deleteStat('2'), { status: 'ok' });

      assert.equal((await aboutCrudService.createTimeline({})).status, 'validation_error');
      assert.deepEqual(await aboutCrudService.createTimeline({ year_label_id: '1990', title_id: 'Berdiri' }), { status: 'ok', id: 33 });
      assert.equal((await aboutCrudService.updateTimeline('999', {})).status, 'not_found');
      assert.deepEqual(await aboutCrudService.updateTimeline('3', { title_id: 'Revisi' }), { status: 'ok' });
      assert.equal((await aboutCrudService.deleteTimeline('999')).status, 'not_found');
      assert.deepEqual(await aboutCrudService.deleteTimeline('3'), { status: 'ok' });
    } finally {
      Object.assign(aboutGalleryModel, origGal);
      Object.assign(aboutStatsModel, origStat);
      Object.assign(aboutTimelineModel, origTime);
    }
  });

  it('preserves aboutController JSON/redirect responses and error handling', async () => {
    const origGetAbout = aboutModel.getAboutData;
    const origUpdateAbout = aboutModel.updateAboutData;
    const origGalFind = aboutGalleryModel.findById;
    const origStatCreate = aboutStatsModel.create;
    const origStatAll = aboutStatsModel.findAll;
    const origTimeFind = aboutTimelineModel.findById;

    aboutGalleryModel.findById = async () => null;
    aboutStatsModel.findAll = async () => [];
    aboutStatsModel.create = async () => 88;
    aboutTimelineModel.findById = async () => { throw new Error('DB timeline fail'); };

    try {
      let out = null;
      let statusCode = 200;
      const makeRes = () => ({
        locals: {},
        status(c) { statusCode = c; return this; },
        json(b) { out = b; return this; },
        redirect(u) { out = { redirect: u }; return this; },
        render() {}
      });

      await aboutController.updateGallerySlide(
        { params: { id: '404' }, body: {}, xhr: true, headers: { accept: 'application/json' } },
        makeRes()
      );
      assert.equal(statusCode, 404);
      assert.equal(out.success, false);

      await aboutController.storeStats(
        { body: { stat_value: '10+', label_id: 'Produk' }, xhr: false, headers: {} },
        makeRes()
      );
      assert.ok(out.redirect.includes('/admin/about?tab=tab-sejarah&success='));

      statusCode = 200;
      await aboutController.deleteTimeline(
        { params: { id: '1' }, xhr: true, headers: { accept: 'application/json' } },
        makeRes()
      );
      assert.equal(statusCode, 500);
      assert.equal(out.message, 'DB timeline fail');

      aboutModel.getAboutData = async () => { throw new Error('Load err'); };
      await aboutController.index({ query: {} }, makeRes());
      assert.equal(out.redirect, '/admin/dashboard?error=Gagal+memuat+halaman+tentang+kami.');

      aboutModel.getAboutData = origGetAbout;
      aboutModel.updateAboutData = async () => { throw new Error('Save err'); };
      await aboutController.update({ body: {} }, makeRes());
      assert.ok(out.redirect.startsWith('/admin/about?error='));
    } finally {
      aboutModel.getAboutData = origGetAbout;
      aboutModel.updateAboutData = origUpdateAbout;
      aboutGalleryModel.findById = origGalFind;
      aboutStatsModel.create = origStatCreate;
      aboutStatsModel.findAll = origStatAll;
      aboutTimelineModel.findById = origTimeFind;
    }
  });
});

describe('T-350: strict ESLint enforcement & boundary checks', () => {
  it('enforces strict error-level rules in eslint.config.js on all 7 refactored files', async () => {
    const { default: eslintConfig } = await import('../eslint.config.js');
    const strictTargets = [
      'controllers/admin/aboutController.js',
      'controllers/admin/homeContentController.js',
      'controllers/admin/mediaController.js',
      'services/aboutService.js',
      'services/aboutCrudService.js',
      'services/homeContentService.js',
      'services/mediaService.js'
    ];
    const strictBlock = eslintConfig.find(
      (entry) => Array.isArray(entry.files) && strictTargets.every((f) => entry.files.includes(f))
    );
    assert.ok(strictBlock, 'Strict override block for all 7 refactored files must exist in eslint.config.js');
    assert.equal(strictBlock.files.length, 7);
    for (const ruleName of ['max-lines', 'max-lines-per-function', 'max-depth', 'complexity', 'no-unused-vars']) {
      const ruleVal = strictBlock.rules?.[ruleName];
      assert.equal(Array.isArray(ruleVal) ? ruleVal[0] : ruleVal, 'error', `${ruleName} must be set to error`);
    }
  });

  it('handles mediaController.index fallback and bodyless DELETE safely', async () => {
    const origFindAll = mediaModel.findAll;
    const origFindById = mediaModel.findById;
    const origDelete = mediaModel.delete;

    mediaModel.findAll = async () => { throw new Error('Query failed'); };
    mediaModel.findById = async () => ({ id: 21, media_type: 'youtube', file_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' });
    mediaModel.delete = async () => true;

    try {
      let rendered = null;
      let statusCode = 200;
      await mediaController.index(
        { query: {}, user: { id: 1 } },
        {
          status(code) { statusCode = code; return this; },
          render(view, data) { rendered = { view, data }; }
        }
      );
      assert.equal(statusCode, 500);
      assert.equal(rendered.view, 'admin/media/index');
      assert.deepEqual(rendered.data.mediaList, []);
      assert.equal(rendered.data.error, 'Gagal memuat media library.');

      let jsonRes = null;
      await mediaController.destroy(
        { params: { id: '21' }, query: {}, headers: { accept: 'application/json' } },
        { status() { return this; }, json(b) { jsonRes = b; return this; } }
      );
      assert.equal(jsonRes.success, true);
    } finally {
      mediaModel.findAll = origFindAll;
      mediaModel.findById = origFindById;
      mediaModel.delete = origDelete;
    }
  });
});

function runMediaFilterCheck(originalname, mimetype) {
  return new Promise((resolve, reject) => {
    mediaFilter({}, { originalname, mimetype }, (err, accepted) => {
      if (err) reject(err);
      else resolve(accepted);
    });
  });
}

describe('Security & Correctness Audit Fixes', () => {
  it('Fix #1: enforces MIME-to-extension matching and safe extensions in uploadMiddleware & mediaService', async () => {
    for (const [name, mime] of [
      ['evil.html', 'application/pdf'],
      ['evil.html', 'video/mp4'],
      ['evil.svg', 'image/svg+xml'],
      ['mismatch.webm', 'video/mp4']
    ]) {
      await assert.rejects(runMediaFilterCheck(name, mime));
    }

    for (const [name, mime] of [
      ['brochure.pdf', 'application/pdf'],
      ['clip.mp4', 'video/mp4'],
      ['clip.webm', 'video/webm'],
      ['pic.png', 'image/png'],
      ['favicon.ico', 'image/x-icon']
    ]) {
      assert.equal(await runMediaFilterCheck(name, mime), true);
    }

    const origSave = storage.save;
    const origCreate = mediaModel.create;
    const savedNames = [];
    storage.save = async (_buf, filename, _mime, subFolder) => {
      savedNames.push(filename);
      return { driver: 'local', filename, url: `/uploads/${subFolder}/${filename}`, size: 4 };
    };
    mediaModel.create = async () => 99;

    try {
      const doc = await saveDocumentFile(Buffer.from('%PDF'), 'evil.html', 'media');
      assert.ok(doc.url.endsWith('.pdf'));

      const mp4Url = await saveVideoFile(Buffer.from('v'), 'evil.html', 'media', 'video/mp4');
      const webmUrl = await saveVideoFile(Buffer.from('v'), 'evil.html', 'media', 'video/webm');
      assert.ok(mp4Url.endsWith('.mp4'));
      assert.ok(webmUrl.endsWith('.webm'));
      await assert.rejects(saveVideoFile(Buffer.from('v'), 'evil.html', 'media'));

      assert.equal(
        (await uploadAndCreateMedia({ mimetype: 'image/svg+xml', originalname: 'x.svg', size: 10 }, 1)).status,
        'unsupported_type'
      );
      assert.equal(
        (await uploadAndCreateMedia({ mimetype: 'video/quicktime', originalname: 'x.mov', size: 10 }, 1)).status,
        'unsupported_type'
      );
      const forgedPdf = await uploadAndCreateMedia(
        { mimetype: 'application/pdf', originalname: 'evil.html', size: 4, buffer: Buffer.from('%PDF') },
        1
      );
      assert.equal(forgedPdf.status, 'created');
      assert.ok(savedNames.at(-1).endsWith('.pdf'));
    } finally {
      storage.save = origSave;
      mediaModel.create = origCreate;
    }
  });

  it('Fix #2: blocks javascript:/data:/traversal URLs across homeContent, about, and cta-global', async () => {
    assert.equal(sanitizeSafeHref('javascript:alert(1)', '/fallback'), '/fallback');
    assert.equal(sanitizeSafeHref('data:text/html,<script>', '/fallback'), '/fallback');
    assert.equal(sanitizeSafeHref('//evil.com', '/fallback'), '/fallback');
    assert.equal(sanitizeSafeHref('/contact\nX-Test: 1', '/fallback'), '/fallback');
    assert.equal(sanitizeSafeHref('https://euodoo.co.id/promo', ''), 'https://euodoo.co.id/promo');
    assert.equal(sanitizeSafeHref('mailto:sales@euodoo.co.id', ''), 'mailto:sales@euodoo.co.id');
    assert.equal(sanitizeSafeHref('tel:+62211234', ''), 'tel:+62211234');
    assert.equal(sanitizeSafeHref('#sertifikasi', ''), '#sertifikasi');

    assert.equal(sanitizeSafePath('/uploads/../secret.js', ''), '');
    assert.equal(sanitizeSafePath('javascript:alert(1)', ''), '');
    assert.equal(sanitizeSafePath('https://evil.com/x.png', ''), '');
    assert.equal(sanitizeSafePath('/uploads/media/ok.webp', ''), '/uploads/media/ok.webp');

    const cert = buildCertificationsSection({ cert_btn_url: 'javascript:alert(1)' });
    assert.equal(cert.btn_url, '/about#sertifikasi');
    const cta = buildCtaSection({ cta_btn1_url: 'javascript:alert(1)', cta_btn2_url: 'data:text/html,1' });
    assert.equal(cta.btn1_url, '/contact');
    assert.equal(cta.btn2_url, '');
    const intro = buildIntroSection({ intro_image_url: 'javascript:alert(1)' });
    assert.equal(intro.image_url, '');
    const cats = buildHomepageCategories({ home_cat_0_id: '1', home_cat_0_image_url: 'https://evil.com/x.jpg' });
    assert.equal(cats[0].image_url, '');

    const aboutPayload = aboutService.buildAboutUpdatePayload({
      vision_image_url: 'javascript:alert(1)',
      mission_image_url: '/uploads/media/mission.webp'
    });
    assert.equal(aboutPayload.vision_image_url, '');
    assert.equal(aboutPayload.mission_image_url, '/uploads/media/mission.webp');

    assert.ok(aboutCrudService.parseGallerySlideCreate({ image_url: 'javascript:alert(1)' }).error);
    assert.ok(aboutCrudService.parseGallerySlideUpdate({ image_url: '/etc/passwd' }).error);

    const renderedCta = await ejs.renderFile(path.resolve('views/partials/cta-global.ejs'), {
      path: '/',
      currentLang: 'en',
      settings: { whatsapp_url: 'https://wa.me/628112117123' },
      globalCta: {
        title_en: 'Need custom bags?',
        btn1_title_en: 'Contact',
        btn1_url: 'javascript:alert(1)',
        btn2_title_en: 'Chat',
        btn2_url: 'javascript:alert(2)',
        pages: { home: 1 },
        is_active: 1
      }
    });
    assert.ok(!renderedCta.includes('javascript:'));
    assert.ok(renderedCta.includes('href="/contact"'));
    assert.ok(renderedCta.includes('href="https://wa.me/628112117123"'));
  });

  it('Fix #3: prevents literal "null" in about_image_url on clear and guards stale "null"', async () => {
    const origUpdateMany = settingModel.updateMany;
    const origGetAll = settingModel.getAll;
    let written = null;
    settingModel.updateMany = async (obj) => { written = obj; };

    try {
      await aboutModel.updateAboutData({
        image_url: null,
        vision_image_url: null,
        values_bg_image: null
      });
      assert.equal(written.about_image_url, '');
      assert.equal(written.vision_image_url, '');
      assert.equal(written.about_values_bg_image, '');

      settingModel.getAll = async () => ({ about_image_url: '' });
      assert.equal((await aboutModel.getAboutData()).image_url, '');

      settingModel.getAll = async () => ({ about_image_url: 'null' });
      assert.equal((await aboutModel.getAboutData()).image_url, '');
    } finally {
      settingModel.updateMany = origUpdateMany;
      settingModel.getAll = origGetAll;
    }
  });

  it('Fix #4: prevents NaN sort_order in About CRUD create and update parsers', () => {
    assert.equal(aboutCrudService.parseGallerySlideCreate({ image_url: '/uploads/a.webp', sort_order: '' }).data.sort_order, 0);
    assert.equal(aboutCrudService.parseGallerySlideCreate({ image_url: '/uploads/a.webp', sort_order: 'abc' }).data.sort_order, 0);
    assert.equal(aboutCrudService.parseStatCreate({ stat_value: '10+', label_id: 'A', sort_order: '  ' }).data.sort_order, 0);
    assert.equal(aboutCrudService.parseTimelineCreate({ year_label_id: '2026', title_id: 'T', sort_order: 'xyz' }).data.sort_order, 0);

    for (const badVal of ['', '   ', 'abc', null]) {
      assert.equal(aboutCrudService.parseGallerySlideUpdate({ sort_order: badVal }).data.sort_order, undefined);
      assert.equal(aboutCrudService.parseStatUpdate({ sort_order: badVal }).sort_order, undefined);
      assert.equal(aboutCrudService.parseTimelineUpdate({ sort_order: badVal }).sort_order, undefined);
    }
    assert.equal(aboutCrudService.parseGallerySlideUpdate({ sort_order: '0' }).data.sort_order, 0);
    assert.equal(aboutCrudService.parseStatUpdate({ sort_order: '5' }).sort_order, 5);
    assert.equal(aboutCrudService.parseTimelineUpdate({ sort_order: '12' }).sort_order, 12);
  });

  it('Fix #5: checks about_gallery_slides usage and propagates DB errors instead of returning []', async () => {
    const testUrl = `/uploads/media/test-fix5-${Date.now()}.webp`;
    let slideId = null;
    try {
      slideId = await aboutGalleryModel.create({
        image_url: testUrl,
        title_id: 'Slide Audit Fix 5',
        sort_order: 99,
        is_active: 1
      });
      const usages = await mediaModel.checkUsage(testUrl);
      assert.ok(
        usages.some((u) => u.source === 'Galeri Tentang Kami' && u.label === 'Slide Audit Fix 5'),
        'about_gallery_slides usage must be reported by mediaModel.checkUsage'
      );
    } finally {
      if (slideId) await aboutGalleryModel.delete(slideId);
    }

    const origPoolQuery = pool.query;
    const origFindById = mediaModel.findById;
    const origMediaDelete = mediaModel.delete;
    const origStorageDelete = storage.delete;
    let deletedFromStorage = false;
    let deletedFromDb = false;

    pool.query = async () => { throw new Error('Simulated DB error'); };
    mediaModel.findById = async () => ({ id: 55, media_type: 'image', file_url: '/uploads/media/protected.webp' });
    storage.delete = async () => { deletedFromStorage = true; return true; };
    mediaModel.delete = async () => { deletedFromDb = true; return true; };

    try {
      await assert.rejects(mediaModel.checkUsage('/uploads/media/protected.webp'), /Simulated DB error/);
      await assert.rejects(deleteMediaItem(55), /Simulated DB error/);
      assert.equal(deletedFromStorage, false);
      assert.equal(deletedFromDb, false);

      let statusCode = 200;
      let jsonOut = null;
      await mediaController.destroy(
        { params: { id: '55' }, query: {}, headers: { accept: 'application/json' } },
        {
          status(code) { statusCode = code; return this; },
          json(body) { jsonOut = body; return this; }
        }
      );
      assert.equal(statusCode, 500);
      assert.equal(jsonOut.success, false);
    } finally {
      pool.query = origPoolQuery;
      mediaModel.findById = origFindById;
      mediaModel.delete = origMediaDelete;
      storage.delete = origStorageDelete;
    }
  });
});


