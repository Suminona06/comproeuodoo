import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildWcuSection } from '../services/homeContentService.js';
import { buildWcuViewModel } from '../services/homeService.js';
import homeContentModel from '../models/homeContentModel.js';
import settingModel from '../models/settingModel.js';

describe('WCU Dynamic Media Unit Tests (T-407)', () => {
  describe('1. buildWcuSection (homeContentService)', () => {
    it('1a. sanitizes valid local path and trims whitespace', () => {
      const res = buildWcuSection({ wcu_image_url: '  /uploads/media/wcu-photo.webp  ' });
      assert.equal(res.image_url, '/uploads/media/wcu-photo.webp');
    });

    it('1b. rejects unsafe schemes like javascript: and protocol-relative //evil', () => {
      assert.equal(buildWcuSection({ wcu_image_url: 'javascript:alert(1)' }).image_url, '');
      assert.equal(buildWcuSection({ wcu_image_url: '//evil.example/payload.png' }).image_url, '');
      assert.equal(buildWcuSection({ wcu_image_url: 'data:text/html,<svg onload=alert(1)>' }).image_url, '');
    });

    it('1c. preserves empty string when cleared and undefined when omitted', () => {
      assert.equal(buildWcuSection({ wcu_image_url: '' }).image_url, '');
      assert.equal(buildWcuSection({}).image_url, undefined);
    });
  });

  describe('2. homeContentModel (getHomeContentData & updateHomeContent)', () => {
    it('2a. exposes empty image_url in defaults and maps home_wcu_image_url in getHomeContentData', async () => {
      assert.equal(homeContentModel.getDefaults().why_choose_us.image_url, '');

      const origGetAll = settingModel.getAll;
      try {
        settingModel.getAll = async () => ({
          home_wcu_title_id: 'Mengapa Kami',
          home_wcu_image_url: '/uploads/media/wcu-db.webp'
        });
        const loaded = await homeContentModel.getHomeContentData();
        assert.equal(loaded.why_choose_us.image_url, '/uploads/media/wcu-db.webp');

        settingModel.getAll = async () => ({ home_wcu_title_id: 'Mengapa Kami' });
        const withoutImg = await homeContentModel.getHomeContentData();
        assert.equal(withoutImg.why_choose_us.image_url, '');
      } finally {
        settingModel.getAll = origGetAll;
      }
    });

    it('2b. persists home_wcu_image_url including empty string on updateHomeContent', async () => {
      const origUpdateMany = settingModel.updateMany;
      const calls = [];
      try {
        settingModel.updateMany = async (map) => {
          calls.push(map);
        };

        await homeContentModel.updateHomeContent({
          why_choose_us: { image_url: '/uploads/media/wcu-new.webp' }
        });
        await homeContentModel.updateHomeContent({
          why_choose_us: { image_url: '' }
        });

        assert.equal(calls.length, 2);
        assert.equal(calls[0].home_wcu_image_url, '/uploads/media/wcu-new.webp');
        assert.equal(calls[1].home_wcu_image_url, '');
      } finally {
        settingModel.updateMany = origUpdateMany;
      }
    });
  });

  describe('3. buildWcuViewModel (homeService)', () => {
    const baseWcu = {
      is_active: 1,
      title_id: 'Mengapa Kami',
      title_en: 'Why Choose Us',
      headline_id: 'Inovasi Material',
      headline_en: 'Material Innovation',
      desc_id: 'Deskripsi ID',
      desc_en: 'Description EN'
    };

    it('3a. falls back to default SVG and hasCustomImage=false when image_url is empty', () => {
      const vmId = buildWcuViewModel({ ...baseWcu, image_url: '' }, 'id');
      assert.equal(vmId.isActive, true);
      assert.equal(vmId.imageUrl, '/images/wcu-botanical.svg');
      assert.equal(vmId.hasCustomImage, false);

      const vmEn = buildWcuViewModel({ ...baseWcu }, 'en');
      assert.equal(vmEn.imageUrl, '/images/wcu-botanical.svg');
      assert.equal(vmEn.hasCustomImage, false);
    });

    it('3b. uses custom imageUrl and hasCustomImage=true when image_url is provided', () => {
      const vm = buildWcuViewModel({ ...baseWcu, image_url: '/uploads/media/wcu-custom.webp' }, 'id');
      assert.equal(vm.isActive, true);
      assert.equal(vm.imageUrl, '/uploads/media/wcu-custom.webp');
      assert.equal(vm.hasCustomImage, true);
    });

    it('3c. returns isActive=false when section is disabled', () => {
      const vm = buildWcuViewModel({ ...baseWcu, is_active: 0, image_url: '/uploads/media/wcu-custom.webp' }, 'id');
      assert.deepEqual(vm, { isActive: false });
    });
  });
});
