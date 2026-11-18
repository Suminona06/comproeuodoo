import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pool from '../config/database.js';
import storage from '../config/storage.js';
import homeContentModel from '../models/homeContentModel.js';
import productCategoryModel from '../models/productCategoryModel.js';
import mediaModel from '../models/mediaModel.js';
import { homeContentController } from '../controllers/admin/homeContentController.js';
import { mediaController } from '../controllers/admin/mediaController.js';
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
      cat_subtitle_en: '  Sub  '
    });
    assert.deepEqual(categories, {
      title_id: 'Kategori',
      title_en: '',
      subtitle_id: '',
      subtitle_en: 'Sub'
    });

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

