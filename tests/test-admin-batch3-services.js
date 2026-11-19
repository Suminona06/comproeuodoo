import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import userController from '../controllers/admin/userController.js';
import settingController from '../controllers/admin/settingController.js';
import contactCmsController from '../controllers/admin/contactCmsController.js';
import pageHeroBannerController from '../controllers/admin/pageHeroBannerController.js';
import capabilityController from '../controllers/admin/capabilityController.js';
import {
  createUser,
  getUserById,
  updateUser,
  deleteUser
} from '../services/userService.js';
import * as settingService from '../services/settingService.js';
import { applyLogoUpdates, applyFaviconUpdates } from '../services/settingMediaService.js';
import { validateFooterDescriptions, parseAndValidateFooterNavLinks } from '../services/settingFooterService.js';
import {
  normalizeOverlayOpacity,
  isSafeActionUrl,
  updatePageHeroBanner
} from '../services/pageHeroBannerService.js';
import {
  parsePositiveIntId,
  parseSortOrder,
  isSafeImageUrl,
  createCapability,
  updateCapability,
  deleteCapability
} from '../services/capabilityService.js';
import userModel from '../models/userModel.js';
import settingModel from '../models/settingModel.js';
import pageHeroBannerModel from '../models/pageHeroBannerModel.js';
import capabilityModel from '../models/capabilityModel.js';

function createMockRes() {
  return {
    statusCode: 200,
    locals: { csrfToken: 'test-csrf' },
    rendered: null,
    redirectedTo: null,
    status(code) { this.statusCode = code; return this; },
    render(view, data) { this.rendered = { view, data }; return this; },
    redirect(url) { this.redirectedTo = url; return this; }
  };
}

describe('Batch 3 Admin Services Unit Tests (T-363..T-368)', () => {
  describe('1. userService & userController (T-363)', () => {
    it('1a. createUser trims name/email, validates email & role, and hashes raw password without trimming valid spaces', async () => {
      let createdPayload = null;
      let hashedRaw = null;
      const mockModel = {
        async findByEmail() { return null; },
        async create(data) { createdPayload = data; return 42; }
      };
      const mockBcrypt = {
        async hash(pw) { hashedRaw = pw; return 'hash:' + pw; }
      };

      const badEmail = await createUser(
        { name: '  ', email: 'budi@euodoo.com', password: 'password1', role: 'admin' },
        { userModel: mockModel, bcrypt: mockBcrypt }
      );
      assert.equal(badEmail.status, 'validation_error');

      const invalidEmail = await createUser(
        { name: 'Budi', email: 'not-an-email', password: 'password1', role: 'admin' },
        { userModel: mockModel, bcrypt: mockBcrypt }
      );
      assert.equal(invalidEmail.status, 'validation_error');

      const badRole = await createUser(
        { name: 'Budi', email: 'budi@euodoo.com', password: 'password1', role: 'owner' },
        { userModel: mockModel, bcrypt: mockBcrypt }
      );
      assert.equal(badRole.status, 'validation_error');

      const spacesOnlyPw = await createUser(
        { name: 'Budi', email: 'budi@euodoo.com', password: '        ', role: 'admin' },
        { userModel: mockModel, bcrypt: mockBcrypt }
      );
      assert.equal(spacesOnlyPw.status, 'validation_error');

      const shortTrimPw = await createUser(
        { name: 'Budi', email: 'budi@euodoo.com', password: ' 123456 ', role: 'admin' },
        { userModel: mockModel, bcrypt: mockBcrypt }
      );
      assert.equal(shortTrimPw.status, 'validation_error');

      const ok = await createUser(
        { name: '  Budi Santoso ', email: '  Budi@Euodoo.COM ', password: '  pass1234  ', role: 'editor' },
        { userModel: mockModel, bcrypt: mockBcrypt }
      );
      assert.equal(ok.status, 'ok');
      assert.equal(ok.id, 42);
      assert.equal(hashedRaw, '  pass1234  ');
      assert.equal(createdPayload.name, 'Budi Santoso');
      assert.equal(createdPayload.email, 'budi@euodoo.com');
      assert.equal(createdPayload.role, 'editor');
    });

    it('1b. getUserById and updateUser guard invalid IDs, role whitelist, and duplicate emails', async () => {
      assert.equal((await getUserById('abc')).status, 'not_found');
      assert.equal((await getUserById('0')).status, 'not_found');

      const mockModel = {
        async findById(id) {
          return id === 5 ? { id: 5, name: 'Old', email: 'old@euodoo.com', role: 'admin' } : null;
        },
        async findByEmail(email) {
          return email === 'taken@euodoo.com' ? { id: 9, email } : null;
        },
        async canDemoteUser() { return { canDemote: true }; },
        async update() { return true; }
      };

      const badRole = await updateUser(5, { name: 'New', email: 'old@euodoo.com', role: 'hacker' }, { userModel: mockModel });
      assert.equal(badRole.status, 'validation_error');

      const dupEmail = await updateUser(5, { name: 'New', email: 'taken@euodoo.com', role: 'admin' }, { userModel: mockModel });
      assert.equal(dupEmail.status, 'validation_error');

      const ok = await updateUser(5, { name: ' New ', email: 'NEW@Euodoo.com', role: 'editor', new_password: '' }, { userModel: mockModel });
      assert.equal(ok.status, 'ok');
    });

    it('1c. deleteUser prevents self-deletion and respects last-superadmin guard', async () => {
      const mockModel = {
        async canDeleteUser(id) {
          return id === 2 ? { canDelete: false, message: 'Last superadmin' } : { canDelete: true };
        },
        async delete() { return true; }
      };

      const selfRes = await deleteUser('3', 3, { userModel: mockModel });
      assert.equal(selfRes.status, 'forbidden');

      const lastSa = await deleteUser('2', 1, { userModel: mockModel });
      assert.equal(lastSa.status, 'forbidden');

      const ok = await deleteUser('4', 1, { userModel: mockModel });
      assert.equal(ok.status, 'ok');
    });

    it('1d. userController.index includes currentUser even on DB error fallback', async () => {
      const origFindAll = userModel.findAll;
      userModel.findAll = async () => { throw new Error('ER_CONNECTION_LOST'); };
      const res = createMockRes();
      try {
        await userController.index({ user: { id: 1, role: 'superadmin' } }, res);
      } finally {
        userModel.findAll = origFindAll;
      }
      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.rendered.data.currentUser, { id: 1, role: 'superadmin' });
    });
  });

  describe('2. settingService, settingMediaService, settingFooterService & settingController (T-364)', () => {
    it('2a. settingService re-exports footer helpers and validates media/footer updates', async () => {
      assert.equal(typeof settingService.isAllowedFooterUrl, 'function');
      assert.equal(typeof settingService.validateFooterDescriptions, 'function');
      assert.equal(typeof settingService.parseAndValidateFooterNavLinks, 'function');
      assert.deepEqual(validateFooterDescriptions({ footer_desc_id: '  Halo  ' }), { footer_desc_id: 'Halo' });
      assert.equal(parseAndValidateFooterNavLinks('[]'), '[]');

      const updates = {};
      await applyLogoUpdates(
        updates,
        { site_logo_header: ' /uploads/logo.webp ' },
        { logo_footer_file: [{ buffer: Buffer.from('x') }] },
        { saveSettingUpload: async () => '/uploads/footer.webp' }
      );
      assert.equal(updates.site_logo_header, '/uploads/logo.webp');
      assert.equal(updates.site_logo_footer, '/uploads/footer.webp');

      const favUpdates = {};
      await applyFaviconUpdates(
        favUpdates,
        { site_favicon: '/uploads/fav.png' },
        {},
        {
          settingModel: { async getAll() { return {}; } },
          generateFaviconSet: async () => ({
            favicon: '/uploads/fav-32.png',
            sizes: { 16: '/16.png', 32: '/32.png', 180: '/180.png', 192: '/192.png', 512: '/512.png' }
          })
        }
      );
      assert.equal(favUpdates.site_favicon, '/uploads/fav-32.png');
      assert.equal(favUpdates.site_favicon_512, '/512.png');
    });

    it('2b. updateSettings persists changes and invalidates cache', async () => {
      let saved = null;
      let cacheCleared = false;
      await settingService.updateSettings(
        { body: { company_name: ' PT Euodoo Plastic ', office_card_visible: '1' } },
        ['company_name'],
        {
          settingModel: { async updateMany(u) { saved = u; } },
          clearSettingsCache: () => { cacheCleared = true; }
        }
      );
      assert.equal(saved.company_name, 'PT Euodoo Plastic');
      assert.equal(saved.office_card_visible, '1');
      assert.equal(cacheCleared, true);
    });

    it('2c. settingController.update hides raw DB error messages while showing validation errors', async () => {
      const origUpdateMany = settingModel.updateMany;
      settingModel.updateMany = async () => { throw new Error('ER_ACCESS_DENIED_ERROR secret'); };
      const resDb = createMockRes();
      try {
        await settingController.update({ body: { company_name: 'PT Test' }, user: { email: 'a@b.com' } }, resDb);
      } finally {
        settingModel.updateMany = origUpdateMany;
      }
      assert.equal(resDb.redirectedTo.includes('ER_ACCESS_DENIED_ERROR'), false);
      assert.equal(decodeURIComponent(resDb.redirectedTo).includes('Silakan coba lagi.'), true);

      const resVal = createMockRes();
      await settingController.update({ body: { office_email: 'bad-email' }, user: { email: 'a@b.com' } }, resVal);
      assert.equal(decodeURIComponent(resVal.redirectedTo).includes('email kantor Jakarta'), true);
    });

    it('2d. updateContactSettings & contactCmsController reject non-string payloads and hide DB errors', async () => {
      await assert.rejects(
        () => settingService.updateContactSettings({ contact_form_title_id: ['array-injection'] }),
        (err) => err?.isValidationError === true
      );

      let savedContact = null;
      let cacheCleared = false;
      await settingService.updateContactSettings(
        { contact_working_hours_id: '  Senin - Jumat  ', contact_form_title_id: 'Judul Baru' },
        {
          settingModel: { async updateMany(u) { savedContact = u; } },
          clearSettingsCache: () => { cacheCleared = true; }
        }
      );
      assert.equal(savedContact.factory_working_hours_id, 'Senin - Jumat');
      assert.equal(cacheCleared, true);

      const resArr = createMockRes();
      await contactCmsController.update({ body: { contact_form_title_id: { nested: 'obj' } }, user: { email: 'a@b.com' } }, resArr);
      assert.equal(decodeURIComponent(resArr.redirectedTo).includes('Format input pengaturan kontak tidak valid.'), true);

      const origUpdateMany = settingModel.updateMany;
      settingModel.updateMany = async () => { throw new Error('ER_BAD_DB_SECRET'); };
      const resDb = createMockRes();
      try {
        await contactCmsController.update({ body: { contact_form_title_id: 'Valid' }, user: { email: 'a@b.com' } }, resDb);
      } finally {
        settingModel.updateMany = origUpdateMany;
      }
      assert.equal(resDb.redirectedTo.includes('ER_BAD_DB_SECRET'), false);
      assert.equal(decodeURIComponent(resDb.redirectedTo).includes('Gagal memperbarui pengaturan halaman kontak.'), true);
    });
  });

  describe('3. pageHeroBannerService & pageHeroBannerController (T-365)', () => {
    it('3a. normalizeOverlayOpacity clamps 0..1, falls back to 0.60, and preserves 0', () => {
      assert.equal(normalizeOverlayOpacity('0'), 0);
      assert.equal(normalizeOverlayOpacity(0), 0);
      assert.equal(normalizeOverlayOpacity('-0.5'), 0);
      assert.equal(normalizeOverlayOpacity('1.7'), 1);
      assert.equal(normalizeOverlayOpacity('not-a-num'), 0.6);
      assert.equal(normalizeOverlayOpacity(''), 0.6);
    });

    it('3b. isSafeActionUrl blocks javascript:, data:, and protocol-relative // URLs', () => {
      assert.equal(isSafeActionUrl('/products', true), true);
      assert.equal(isSafeActionUrl('#contact', true), true);
      assert.equal(isSafeActionUrl('https://euodoo.com/promo', true), true);
      assert.equal(isSafeActionUrl('javascript:alert(1)', true), false);
      assert.equal(isSafeActionUrl('data:text/html,<script>', false), false);
      assert.equal(isSafeActionUrl('//evil.com/x', true), false);
    });

    it('3c. updatePageHeroBanner validates pageKey/URLs and preserves overlay_opacity=0', async () => {
      let updated = null;
      const mockModel = {
        async updateByPageKey(key, data) { updated = { key, data }; return true; }
      };

      const badKey = await updatePageHeroBanner('unknown', {}, null, { pageHeroBannerModel: mockModel });
      assert.equal(badKey.status, 'validation_error');

      const badCta = await updatePageHeroBanner('about', { cta_url: 'javascript:alert(1)' }, null, { pageHeroBannerModel: mockModel });
      assert.equal(badCta.status, 'validation_error');

      const badImg = await updatePageHeroBanner('about', { image_url: '//evil.com/a.jpg' }, null, { pageHeroBannerModel: mockModel });
      assert.equal(badImg.status, 'validation_error');

      const ok = await updatePageHeroBanner(
        'products',
        { title_id: ' Produk ', overlay_opacity: '0', cta_url: '/contact', is_active: '1' },
        null,
        { pageHeroBannerModel: mockModel }
      );
      assert.equal(ok.status, 'ok');
      assert.equal(updated.key, 'products');
      assert.equal(updated.data.overlay_opacity, 0);
    });

    it('3d. pageHeroBannerController.update returns generic error on DB exception', async () => {
      const origUpdate = pageHeroBannerModel.updateByPageKey;
      pageHeroBannerModel.updateByPageKey = async () => { throw new Error('SQL syntax leak'); };
      const res = createMockRes();
      try {
        await pageHeroBannerController.update(
          { params: { pageKey: 'about' }, body: { title_id: 'About', overlay_opacity: '0.5' }, user: { email: 'a@b.com' } },
          res
        );
      } finally {
        pageHeroBannerModel.updateByPageKey = origUpdate;
      }
      assert.equal(res.redirectedTo.includes('SQL'), false);
      assert.equal(decodeURIComponent(res.redirectedTo).includes('Gagal memperbarui hero banner.'), true);
    });
  });

  describe('4. capabilityService & capabilityController (T-366)', () => {
    it('4a. helpers validate ID, sort_order NaN fallback, and safe image_url', () => {
      assert.equal(parsePositiveIntId('10'), 10);
      assert.equal(parsePositiveIntId('-1'), null);
      assert.equal(parsePositiveIntId('abc'), null);
      assert.equal(parseSortOrder('abc', 5), 5);
      assert.equal(parseSortOrder('12', 0), 12);
      assert.equal(isSafeImageUrl('/uploads/m1.webp'), true);
      assert.equal(isSafeImageUrl('javascript:alert(1)'), false);
      assert.equal(isSafeImageUrl('//evil.com/m.png'), false);
      assert.equal(isSafeImageUrl('/uploads/../etc/passwd'), false);
    });

    it('4b. createCapability, updateCapability, deleteCapability enforce guards and not_found', async () => {
      const mockModel = {
        async findById(id) { return id === 7 ? { id: 7, sort_order: 3 } : null; },
        async create(data) { return data.sort_order === 0 ? 11 : 0; },
        async update() { return true; },
        async delete() { return true; }
      };

      const emptyReq = await createCapability({ title_id: '  ', machine_type: 'Extruder' }, null, { capabilityModel: mockModel });
      assert.equal(emptyReq.status, 'validation_error');

      const badUrl = await createCapability({ title_id: 'Mesin A', machine_type: 'Extruder', image_url: 'data:image/png;base64,abc' }, null, { capabilityModel: mockModel });
      assert.equal(badUrl.status, 'validation_error');

      const created = await createCapability({ title_id: 'Mesin A', machine_type: 'Extruder', sort_order: 'bad' }, null, { capabilityModel: mockModel });
      assert.equal(created.status, 'ok');
      assert.equal(created.id, 11);

      const notFoundUpd = await updateCapability('999', { title_id: 'X', machine_type: 'Y' }, null, { capabilityModel: mockModel });
      assert.equal(notFoundUpd.status, 'not_found');

      const badUpd = await updateCapability('7', { title_id: 'X', machine_type: '  ' }, null, { capabilityModel: mockModel });
      assert.equal(badUpd.status, 'validation_error');

      const okUpd = await updateCapability('7', { title_id: 'X', machine_type: 'Y', sort_order: 'bad' }, null, { capabilityModel: mockModel });
      assert.equal(okUpd.status, 'ok');

      const notFoundDel = await deleteCapability('abc', { capabilityModel: mockModel });
      assert.equal(notFoundDel.status, 'not_found');

      const okDel = await deleteCapability('7', { capabilityModel: mockModel });
      assert.equal(okDel.status, 'ok');
    });

    it('4c. capabilityController.destroy returns generic error on DB failure', async () => {
      const origFind = capabilityModel.findById;
      const origDel = capabilityModel.delete;
      capabilityModel.findById = async () => ({ id: 1 });
      capabilityModel.delete = async () => { throw new Error('ER_ROW_IS_REFERENCED'); };
      const res = createMockRes();
      try {
        await capabilityController.destroy({ params: { id: '1' } }, res);
      } finally {
        capabilityModel.findById = origFind;
        capabilityModel.delete = origDel;
      }
      assert.equal(res.redirectedTo.includes('ER_ROW_IS_REFERENCED'), false);
      assert.equal(decodeURIComponent(res.redirectedTo).includes('Gagal menghapus data kapabilitas.'), true);
    });
  });
});
