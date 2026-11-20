import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getRemainingLockMinutes,
  hasExpiredBruteForceLock,
  buildSessionCookieOptions,
  validateLoginInput,
  validatePasswordChangeInput,
  authenticateAdmin,
  changeAdminPassword
} from '../services/authService.js';
import {
  parseSortOrder,
  isValidCtaUrl,
  isValidCtaText,
  deleteOrphanUploadFile,
  createBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner
} from '../services/bannerService.js';
import {
  sanitizeBrandLogoUrl,
  validateSectionTitleInput,
  updateBrandSectionTitle,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus
} from '../services/brandService.js';
import {
  INQUIRY_STATUSES,
  isValidInquiryStatus,
  normalizeInquiryFilterStatus,
  normalizeExportStatus,
  normalizePerPage,
  clampPageNumber,
  getInquiryListData,
  getInquiryDetailAndMarkRead,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryCsvExportPayload
} from '../services/inquiryService.js';

describe('Batch 2 Admin Services Unit Tests (T-351..T-355)', () => {
  describe('1. authService (A1 & Keputusan 3 Opsi a)', () => {
    it('1a. validateLoginInput trims/lowercases email and rejects empty credentials', () => {
      assert.deepEqual(validateLoginInput({}), { error: 'Email dan kata sandi wajib diisi.' });
      assert.deepEqual(validateLoginInput({ email: '  ADMIN@Euodoo.com ', password: 'secret' }), {
        email: 'admin@euodoo.com',
        password: 'secret'
      });
    });

    it('1b. authenticateAdmin resets expired brute-force lock before recording a new failure (Bug A1)', async () => {
      const expiredLockDate = new Date(Date.now() - 60 * 1000).toISOString();
      const calls = [];
      const mockUserModel = {
        async findByEmail() {
          return {
            id: 7,
            email: 'admin@euodoo.com',
            password_hash: 'hashed',
            failed_attempts: 5,
            locked_until: expiredLockDate
          };
        },
        isAccountLocked(user) {
          return new Date(user.locked_until) > new Date();
        },
        async resetFailedAttempts(userId) {
          calls.push(['reset', userId]);
        },
        async recordFailedAttempt(userId, currentAttempts) {
          calls.push(['record', userId, currentAttempts]);
          return { isLocked: false, lockedUntil: null, attemptsLeft: 5 - (currentAttempts + 1) };
        }
      };
      const mockBcrypt = {
        async compare() {
          return false;
        }
      };

      const res = await authenticateAdmin(
        { email: 'admin@euodoo.com', password: 'wrong' },
        { userModel: mockUserModel, bcrypt: mockBcrypt }
      );

      assert.equal(res.status, 'unauthorized');
      assert.equal(res.statusCode, 401);
      assert.equal(res.attemptsLeft, 4);
      assert.deepEqual(calls, [
        ['reset', 7],
        ['record', 7, 0]
      ]);
    });

    it('1c. authenticateAdmin blocks active lock and computes remaining minutes', async () => {
      const nowMs = Date.now();
      const lockedUntil = new Date(nowMs + 8 * 60 * 1000).toISOString();
      const mockUserModel = {
        async findByEmail() {
          return { id: 1, email: 'admin@euodoo.com', locked_until: lockedUntil, failed_attempts: 5 };
        },
        isAccountLocked() {
          return true;
        }
      };

      const res = await authenticateAdmin(
        { email: 'admin@euodoo.com', password: 'any' },
        { userModel: mockUserModel, nowMs }
      );
      assert.equal(res.status, 'locked');
      assert.equal(res.statusCode, 403);
      assert.equal(res.remainingMinutes, 8);
      assert.equal(getRemainingLockMinutes(lockedUntil, nowMs), 8);
      assert.equal(hasExpiredBruteForceLock({ locked_until: lockedUntil }, mockUserModel), false);
    });

    it('1d. validatePasswordChangeInput & changeAdminPassword enforce Keputusan 3 (Opsi a)', async () => {
      assert.equal(
        validatePasswordChangeInput({ current_password: 'old', new_password: '        ', confirm_password: '        ' }).error,
        'Semua kolom kata sandi wajib diisi.'
      );
      assert.equal(
        validatePasswordChangeInput({ current_password: 'old', new_password: '  short ', confirm_password: '  short ' }).error,
        'Kata sandi baru minimal harus 8 karakter.'
      );
      assert.equal(
        validatePasswordChangeInput({ current_password: 'SamePassword123', new_password: 'SamePassword123', confirm_password: 'SamePassword123' }).error,
        'Kata sandi baru tidak boleh sama dengan kata sandi lama.'
      );

      const spacedValid = '  ValidPass123!  ';
      const validCheck = validatePasswordChangeInput({
        current_password: 'OldPassword123!',
        new_password: spacedValid,
        confirm_password: spacedValid
      });
      assert.equal(validCheck.newPassword, spacedValid);

      let hashedInput = null;
      const mockUserModel = {
        async findByEmail() {
          return { id: 3, email: 'admin@euodoo.com', password_hash: 'old_hash' };
        },
        async updatePassword(_id, newHash) {
          hashedInput = newHash;
        }
      };
      const mockBcrypt = {
        async compare(plain) {
          return plain === 'OldPassword123!';
        },
        async hash(plain) {
          return `HASHED:${plain}`;
        }
      };

      const res = await changeAdminPassword(
        'admin@euodoo.com',
        { current_password: 'OldPassword123!', new_password: spacedValid, confirm_password: spacedValid },
        { userModel: mockUserModel, bcrypt: mockBcrypt }
      );
      assert.equal(res.status, 'ok');
      assert.equal(hashedInput, `HASHED:${spacedValid}`);
      assert.equal(buildSessionCookieOptions({ NODE_ENV: 'production' }).secure, true);
    });
  });

  describe('2. bannerService (A2, Keputusan 1 Opsi a, & Keputusan 2 Opsi a)', () => {
    it('2a. isValidCtaUrl allows /, #, http, https, mailto, tel and blocks dangerous protocols (Keputusan 2 Opsi a)', () => {
      assert.equal(isValidCtaUrl(''), true);
      assert.equal(isValidCtaUrl('/products'), true);
      assert.equal(isValidCtaUrl('#merek'), true);
      assert.equal(isValidCtaUrl('https://wa.me/628123456789'), true);
      assert.equal(isValidCtaUrl('http://euodoo.co.id/catalog'), true);
      assert.equal(isValidCtaUrl('mailto:sales@euodoo.co.id'), true);
      assert.equal(isValidCtaUrl('tel:+622187654321'), true);

      assert.equal(isValidCtaUrl('javascript:alert(1)'), false);
      assert.equal(isValidCtaUrl('data:text/html,<script>alert(1)</script>'), false);
      assert.equal(isValidCtaUrl('vbscript:msgbox(1)'), false);
      assert.equal(isValidCtaUrl('//evil.example.com'), false);
      assert.equal(isValidCtaText('a'.repeat(100)), true);
      assert.equal(isValidCtaText('a'.repeat(101)), false);
    });

    it('2b. toggleBannerStatus returns not_found instead of crashing when model returns null (Bug A2a)', async () => {
      const mockBannerModel = {
        async toggleActive() {
          return null;
        }
      };
      const res = await toggleBannerStatus(999, { bannerModel: mockBannerModel });
      assert.deepEqual(res, { status: 'not_found', error: 'Banner tidak ditemukan.' });
    });

    it('2c. updateBanner validates YouTube URL strictly and rejects invalid links (Bug A2b)', async () => {
      const mockBannerModel = {
        async findById() {
          return { id: 5, title_id: 'Hero', media_type: 'image', file_url: '/uploads/banners/old.webp', sort_order: 2 };
        },
        async update() {
          return true;
        }
      };

      const badRes = await updateBanner(
        5,
        { media_type: 'youtube', youtube_url: 'https://not-youtube.example.com/watch' },
        null,
        { bannerModel: mockBannerModel }
      );
      assert.equal(badRes.status, 'validation_error');

      const createBadRes = await createBanner(
        { title_id: 'Banner Baru', media_type: 'youtube', youtube_url: 'bukan-url-youtube' },
        null,
        { bannerModel: mockBannerModel }
      );
      assert.equal(createBadRes.status, 'validation_error');
    });

    it('2d. deleteOrphanUploadFile & deleteBanner obey Keputusan 1 (Opsi a)', async () => {
      const deletedFiles = [];
      const mockStorage = {
        async delete(url) {
          deletedFiles.push(url);
        }
      };

      // 1) Never delete YouTube ID
      const ytDeleted = await deleteOrphanUploadFile('dQw4w9WgXcQ', { storage: mockStorage });
      assert.equal(ytDeleted, false);

      // 2) Never delete file registered in Media Library
      const registeredMediaModel = {
        async isRegisteredByUrl() {
          return true;
        },
        async checkUsage() {
          return [];
        }
      };
      const mediaDeleted = await deleteOrphanUploadFile('/uploads/media/shared.webp', {
        mediaModel: registeredMediaModel,
        storage: mockStorage
      });
      assert.equal(mediaDeleted, false);

      // 3) Delete local orphan upload not in media and with 0 usages
      const orphanMediaModel = {
        async isRegisteredByUrl() {
          return false;
        },
        async checkUsage() {
          return [];
        }
      };
      const mockBannerModel = {
        async findById() {
          return { id: 10, is_active: 0, file_url: '/uploads/banners/orphan.webp' };
        },
        async delete() {
          return true;
        }
      };

      const delRes = await deleteBanner(10, {
        bannerModel: mockBannerModel,
        mediaModel: orphanMediaModel,
        storage: mockStorage
      });
      assert.equal(delRes.status, 'ok');
      assert.deepEqual(deletedFiles, ['/uploads/banners/orphan.webp']);
    });
  });

  describe('3. brandService (A3 & Keputusan 1 Opsi a)', () => {
    it('3a. validateSectionTitleInput & updateBrandSectionTitle enforce <= 150 chars and clear cache', async () => {
      assert.ok(validateSectionTitleInput({ home_brand_title_id: 'x'.repeat(151) }).error);

      let savedSettings = null;
      let cacheCleared = false;
      const res = await updateBrandSectionTitle(
        { home_brand_title_id: ' Merek Kami ', home_brand_title_en: ' Our Brands ' },
        {
          settingModel: {
            async updateMany(data) {
              savedSettings = data;
            }
          },
          clearSettingsCache() {
            cacheCleared = true;
          }
        }
      );
      assert.equal(res.status, 'ok');
      assert.deepEqual(savedSettings, { home_brand_title_id: 'Merek Kami', home_brand_title_en: 'Our Brands' });
      assert.equal(cacheCleared, true);
    });

    it('3b. sanitizeBrandLogoUrl & parseSortOrder prevent path traversal and NaN sort_order (Bug A3b & A3c)', async () => {
      assert.deepEqual(sanitizeBrandLogoUrl('/uploads/brands/euodoo.webp'), { value: '/uploads/brands/euodoo.webp' });
      assert.ok(sanitizeBrandLogoUrl('../../etc/passwd').error);
      assert.ok(sanitizeBrandLogoUrl('javascript:alert(1)').error);
      assert.equal(parseSortOrder('not-a-number', 0), 0);
      assert.equal(parseSortOrder('', 7), 7);

      let createdPayload = null;
      const createRes = await createBrand(
        { name: 'Euodoo Brand', logo_url: '/uploads/brands/logo.webp', sort_order: 'abc', is_active: 'on' },
        null,
        {
          brandModel: {
            async create(data) {
              createdPayload = data;
              return 42;
            }
          }
        }
      );
      assert.equal(createRes.status, 'ok');
      assert.equal(createdPayload.sort_order, 0);
      assert.equal(Number.isNaN(createdPayload.sort_order), false);
    });

    it('3c. toggleBrandStatus, updateBrand & deleteBrand handle not_found and protect Media Library assets (Bug A3a & A3d)', async () => {
      const notFoundToggle = await toggleBrandStatus(404, {
        brandModel: {
          async toggleActive() {
            return null;
          }
        }
      });
      assert.deepEqual(notFoundToggle, { status: 'not_found', error: 'Merek tidak ditemukan.' });

      const deletedFiles = [];
      const updRes = await updateBrand(
        1,
        { name: 'Updated Brand', logo_url: '/uploads/media/new-logo.webp', sort_order: '' },
        null,
        {
          brandModel: {
            async findById() {
              return { id: 1, name: 'Old', logo_url: '/uploads/media/registered.webp', sort_order: 4 };
            },
            async update() {
              return true;
            }
          },
          mediaModel: {
            async isRegisteredByUrl() {
              return true;
            },
            async checkUsage() {
              return [];
            }
          },
          storage: {
            async delete(url) {
              deletedFiles.push(url);
            }
          }
        }
      );
      assert.equal(updRes.status, 'ok');
      assert.equal(deletedFiles.length, 0);

      const delNotFound = await deleteBrand(999, {
        brandModel: {
          async findById() {
            return null;
          }
        }
      });
      assert.equal(delNotFound.status, 'not_found');
    });
  });

  describe('4. inquiryService (A4 & Keputusan 4 Opsi a)', () => {
    it('4a. enforces INQUIRY_STATUSES whitelist across filter, export, and updateInquiryStatus (Bug A4 & Keputusan 4 Opsi a)', async () => {
      assert.deepEqual(INQUIRY_STATUSES, ['baru', 'dibaca', 'ditindaklanjuti', 'ditolak']);
      for (const st of INQUIRY_STATUSES) {
        assert.equal(isValidInquiryStatus(st), true);
        assert.equal(normalizeInquiryFilterStatus(st), st);
        assert.equal(normalizeExportStatus(st), st);
      }
      assert.equal(isValidInquiryStatus('diproses'), false);
      assert.equal(normalizeInquiryFilterStatus('hacked_status'), 'all');
      assert.equal(normalizeExportStatus('all'), null);
      assert.equal(normalizeExportStatus('illegal'), null);

      const mockInquiryModel = {
        async findById() {
          return { id: 12, status: 'baru' };
        },
        async updateStatus() {
          return true;
        }
      };

      const invalidUpdate = await updateInquiryStatus(
        12,
        { status: 'status_ilegal' },
        { inquiryModel: mockInquiryModel }
      );
      assert.deepEqual(invalidUpdate, {
        status: 'validation_error',
        error: 'Status inquiry tidak valid.'
      });

      const validUpdate = await updateInquiryStatus(
        12,
        { status: 'ditolak', admin_notes: 'Spam' },
        { inquiryModel: mockInquiryModel }
      );
      assert.equal(validUpdate.status, 'ok');
      assert.equal(validUpdate.newStatus, 'ditolak');
    });

    it('4b. normalizes pagination, auto-marks baru -> dibaca on detail, and handles not_found on deleteInquiry', async () => {
      assert.equal(normalizePerPage('25'), 25);
      assert.equal(normalizePerPage('999'), 10);
      assert.equal(clampPageNumber('-3', 5), 1);
      assert.equal(clampPageNumber('99', 5), 5);

      const listData = await getInquiryListData(
        { status: 'unknown', per_page: '500', page: '9' },
        {
          inquiryModel: {
            async countAll({ status }) {
              assert.equal(status, 'all');
              return 15;
            },
            async getStats() {
              return { total: 15, baru: 5, dibaca: 5, ditindaklanjuti: 3, ditolak: 2 };
            },
            async findAll({ limit, offset }) {
              assert.equal(limit, 10);
              assert.equal(offset, 10);
              return [{ id: 1 }];
            }
          }
        }
      );
      assert.equal(listData.currentPage, 2);
      assert.equal(listData.totalPages, 2);

      let markedReadId = null;
      const detailRes = await getInquiryDetailAndMarkRead(8, {
        inquiryModel: {
          async findById() {
            return { id: 8, name: 'PT Mitra', status: 'baru' };
          },
          async updateStatus(id, st) {
            if (st === 'dibaca') markedReadId = id;
          }
        }
      });
      assert.equal(detailRes.status, 'ok');
      assert.equal(detailRes.inquiry.status, 'dibaca');
      assert.equal(markedReadId, 8);

      const delMissing = await deleteInquiry(404, {
        inquiryModel: {
          async findById() {
            return null;
          }
        }
      });
      assert.equal(delMissing.status, 'not_found');

      const csvPayload = await getInquiryCsvExportPayload(
        { status: 'ditolak' },
        {
          date: new Date('2026-11-19T00:00:00Z'),
          inquiryModel: {
            async findAll({ status }) {
              assert.equal(status, 'ditolak');
              return [];
            }
          }
        }
      );
      assert.equal(csvPayload.filename, 'inquiries-rfq-euodoo-2026-11-19.csv');
      assert.equal(csvPayload.columns.length, 11);
    });
  });
});
