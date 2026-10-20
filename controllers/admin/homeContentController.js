import homeContentModel from '../../models/homeContentModel.js';
import productCategoryModel from '../../models/productCategoryModel.js';
import logger from '../../utils/logger.js';

const ALLOWED_KICKER_ICONS = ['tree', 'leaf', 'sparkle'];

const cleanStr = (val, maxLen = 255) => {
  if (val === undefined || val === null) return '';
  const trimmed = String(val).trim();
  return maxLen ? trimmed.slice(0, maxLen) : trimmed;
};

export const homeContentController = {
  async index(req, res) {
    try {
      const [homeContent, allCategories] = await Promise.all([
        homeContentModel.getHomeContentData(),
        productCategoryModel.findAll()
      ]);
      res.render('admin/home-content/index', {
        title: 'Manajemen Konten Homepage - PT Euodoo CMS',
        activeNav: 'home-content',
        homeContent,
        allCategories: allCategories || [],
        allowedKickerIcons: ALLOWED_KICKER_ICONS,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('homeContentController.index error:', { message: err.message, stack: err.stack });
      res.redirect('/admin/dashboard?error=Gagal+memuat+halaman+konten+homepage.');
    }
  },

  async update(req, res) {
    try {
      const b = req.body;

      const intro = {
        eyebrow_id: cleanStr(b.intro_eyebrow_id, 100),
        eyebrow_en: cleanStr(b.intro_eyebrow_en, 100),
        title_id: cleanStr(b.intro_title_id, 255),
        title_en: cleanStr(b.intro_title_en, 255),
        paragraph_1_id: cleanStr(b.intro_paragraph_1_id, 2000),
        paragraph_1_en: cleanStr(b.intro_paragraph_1_en, 2000),
        paragraph_2_id: cleanStr(b.intro_paragraph_2_id, 2000),
        paragraph_2_en: cleanStr(b.intro_paragraph_2_en, 2000),
        image_url: cleanStr(b.intro_image_url, 500),
        is_active: (b.intro_is_active === '1' || b.intro_is_active === 'on') ? 1 : 0
      };

      if (!intro.title_id) {
        return res.redirect('/admin/home-content?error=Judul+Intro+wajib+diisi.');
      }

      const why_choose_us = {
        is_active: (b.wcu_is_active === '1' || b.wcu_is_active === 'on') ? 1 : 0,
        eyebrow_id: cleanStr(b.wcu_eyebrow_id, 100),
        eyebrow_en: cleanStr(b.wcu_eyebrow_en, 100),
        title_id: cleanStr(b.wcu_title_id, 255) || 'Why choose us[accent]?[/accent]',
        title_en: cleanStr(b.wcu_title_en, 255) || 'Why choose us[accent]?[/accent]',
        chip_label_id: cleanStr(b.wcu_chip_label_id, 100),
        chip_label_en: cleanStr(b.wcu_chip_label_en, 100),
        chip_icon: ALLOWED_KICKER_ICONS.includes(cleanStr(b.wcu_chip_icon)) ? cleanStr(b.wcu_chip_icon) : 'tree',
        headline_id: cleanStr(b.wcu_headline_id, 255),
        headline_en: cleanStr(b.wcu_headline_en, 255),
        desc_id: cleanStr(b.wcu_desc_id, 2000),
        desc_en: cleanStr(b.wcu_desc_en, 2000),
        callout_lead_id: cleanStr(b.wcu_callout_lead_id, 255),
        callout_lead_en: cleanStr(b.wcu_callout_lead_en, 255),
        callout_body_id: cleanStr(b.wcu_callout_body_id, 1000),
        callout_body_en: cleanStr(b.wcu_callout_body_en, 1000),
        note_id: cleanStr(b.wcu_note_id, 500),
        note_en: cleanStr(b.wcu_note_en, 500),
        art_label_id: cleanStr(b.wcu_art_label_id, 100),
        art_label_en: cleanStr(b.wcu_art_label_en, 100),
        float_eyebrow_id: cleanStr(b.wcu_float_eyebrow_id, 100),
        float_eyebrow_en: cleanStr(b.wcu_float_eyebrow_en, 100),
        float_title_id: cleanStr(b.wcu_float_title_id, 100),
        float_title_en: cleanStr(b.wcu_float_title_en, 100),
        float_desc_id: cleanStr(b.wcu_float_desc_id, 255),
        float_desc_en: cleanStr(b.wcu_float_desc_en, 255)
      };

      const categories = {
        title_id: cleanStr(b.cat_title_id, 255) || 'Produk Unggulan Manufaktur',
        title_en: cleanStr(b.cat_title_en, 255) || 'Featured Manufacturing Products',
        subtitle_id: cleanStr(b.cat_subtitle_id, 1000),
        subtitle_en: cleanStr(b.cat_subtitle_en, 1000)
      };

      const homepage_categories = [0, 1, 2, 3].map(idx => {
        const rawCatId = b[`home_cat_${idx}_id`];
        const catId = Number(rawCatId);
        const imageUrl = cleanStr(b[`home_cat_${idx}_image_url`], 500);
        return {
          category_id: !isNaN(catId) && catId > 0 ? catId : 0,
          image_url: imageUrl,
          sort_order: idx + 1
        };
      }).filter(c => c.category_id > 0);

      const certItems = [0, 1, 2, 3].map((idx) => {
        return {
          name: cleanStr(b[`cert_${idx}_name`], 255),
          desc_id: cleanStr(b[`cert_${idx}_desc_id`], 500),
          desc_en: cleanStr(b[`cert_${idx}_desc_en`], 500),
          logo_url: cleanStr(b[`cert_${idx}_logo_url`], 500),
          sort_order: Number(b[`cert_${idx}_sort_order`]) || (idx + 1),
          is_active: (b[`cert_${idx}_is_active`] === '1' || b[`cert_${idx}_is_active`] === 'on') ? 1 : 0
        };
      }).filter(c => Boolean(c.name));

      const certifications = {
        title_id: cleanStr(b.cert_title_id, 255),
        title_en: cleanStr(b.cert_title_en, 255),
        body_id: cleanStr(b.cert_body_id, 1000),
        body_en: cleanStr(b.cert_body_en, 1000),
        btn_text_id: cleanStr(b.cert_btn_text_id, 100),
        btn_text_en: cleanStr(b.cert_btn_text_en, 100),
        btn_url: cleanStr(b.cert_btn_url, 500) || '/about#sertifikasi',
        show_btn: (b.cert_show_btn === '1' || b.cert_show_btn === 'on') ? 1 : 0,
        is_active: (b.cert_is_active === '1' || b.cert_is_active === 'on') ? 1 : 0,
        items: certItems
      };

      const ctaPages = {
        home: (b.cta_page_home === '1' || b.cta_page_home === 'on') ? 1 : 0,
        about: (b.cta_page_about === '1' || b.cta_page_about === 'on') ? 1 : 0,
        products: (b.cta_page_products === '1' || b.cta_page_products === 'on') ? 1 : 0,
        product_detail: (b.cta_page_product_detail === '1' || b.cta_page_product_detail === 'on') ? 1 : 0,
        capabilities: (b.cta_page_capabilities === '1' || b.cta_page_capabilities === 'on') ? 1 : 0,
        news: (b.cta_page_news === '1' || b.cta_page_news === 'on') ? 1 : 0,
        news_detail: (b.cta_page_news_detail === '1' || b.cta_page_news_detail === 'on') ? 1 : 0,
        contact: (b.cta_page_contact === '1' || b.cta_page_contact === 'on') ? 1 : 0,
        '404': (b['cta_page_404'] === '1' || b['cta_page_404'] === 'on') ? 1 : 0
      };

      const cta = {
        title_id: cleanStr(b.cta_title_id, 255),
        title_en: cleanStr(b.cta_title_en, 255),
        subtitle_id: cleanStr(b.cta_subtitle_id, 1000),
        subtitle_en: cleanStr(b.cta_subtitle_en, 1000),
        btn1_title_id: cleanStr(b.cta_btn1_title_id, 100),
        btn1_title_en: cleanStr(b.cta_btn1_title_en, 100),
        btn1_sub_id: cleanStr(b.cta_btn1_sub_id, 100),
        btn1_sub_en: cleanStr(b.cta_btn1_sub_en, 100),
        btn1_url: cleanStr(b.cta_btn1_url, 500) || '/contact',
        btn2_title_id: cleanStr(b.cta_btn2_title_id, 100),
        btn2_title_en: cleanStr(b.cta_btn2_title_en, 100),
        btn2_sub_id: cleanStr(b.cta_btn2_sub_id, 100),
        btn2_sub_en: cleanStr(b.cta_btn2_sub_en, 100),
        btn2_url: cleanStr(b.cta_btn2_url, 500),
        pages: ctaPages,
        is_active: (b.cta_is_active === '1' || b.cta_is_active === 'on') ? 1 : 0
      };

      await homeContentModel.updateHomeContent({
        intro,
        why_choose_us,
        categories,
        homepage_categories,
        certifications,
        cta
      });

      logger.info('homeContentController: Home content successfully updated');
      return res.redirect('/admin/home-content?success=Konten+homepage+berhasil+diperbarui.');
    } catch (err) {
      logger.error('homeContentController.update error:', { message: err.message, stack: err.stack });
      return res.redirect(`/admin/home-content?error=${encodeURIComponent('Gagal memperbarui konten: ' + err.message)}`);
    }
  }
};

export default homeContentController;
