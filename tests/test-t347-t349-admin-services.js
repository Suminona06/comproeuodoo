import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../config/database.js';
import homeContentModel from '../models/homeContentModel.js';
import productCategoryModel from '../models/productCategoryModel.js';
import { homeContentController } from '../controllers/admin/homeContentController.js';
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
