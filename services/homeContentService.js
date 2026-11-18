import homeContentModel from '../models/homeContentModel.js';
import productCategoryModel from '../models/productCategoryModel.js';

export const ALLOWED_KICKER_ICONS = ['tree', 'leaf', 'sparkle'];

const CTA_PAGE_KEYS = [
  'home',
  'about',
  'products',
  'product_detail',
  'capabilities',
  'news',
  'news_detail',
  'contact',
  '404'
];

function cleanStr(val, maxLen = 255) {
  if (val === undefined || val === null) return '';
  const trimmed = String(val).trim();
  return maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function isChecked(val) {
  return val === '1' || val === 'on' ? 1 : 0;
}

export function buildIntroSection(b = {}) {
  return {
    eyebrow_id: cleanStr(b.intro_eyebrow_id, 100),
    eyebrow_en: cleanStr(b.intro_eyebrow_en, 100),
    title_id: cleanStr(b.intro_title_id, 255),
    title_en: cleanStr(b.intro_title_en, 255),
    paragraph_1_id: cleanStr(b.intro_paragraph_1_id, 2000),
    paragraph_1_en: cleanStr(b.intro_paragraph_1_en, 2000),
    paragraph_2_id: cleanStr(b.intro_paragraph_2_id, 2000),
    paragraph_2_en: cleanStr(b.intro_paragraph_2_en, 2000),
    image_url: cleanStr(b.intro_image_url, 500),
    is_active: isChecked(b.intro_is_active)
  };
}

export function buildWcuSection(b = {}) {
  const chipIcon = cleanStr(b.wcu_chip_icon);
  return {
    is_active: isChecked(b.wcu_is_active),
    eyebrow_id: cleanStr(b.wcu_eyebrow_id, 100),
    eyebrow_en: cleanStr(b.wcu_eyebrow_en, 100),
    title_id: cleanStr(b.wcu_title_id, 255),
    title_en: cleanStr(b.wcu_title_en, 255),
    chip_label_id: cleanStr(b.wcu_chip_label_id, 100),
    chip_label_en: cleanStr(b.wcu_chip_label_en, 100),
    chip_icon: ALLOWED_KICKER_ICONS.includes(chipIcon) ? chipIcon : 'tree',
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
}

export function buildCategoriesSection(b = {}) {
  return {
    title_id: cleanStr(b.cat_title_id, 255),
    title_en: cleanStr(b.cat_title_en, 255),
    subtitle_id: cleanStr(b.cat_subtitle_id, 1000),
    subtitle_en: cleanStr(b.cat_subtitle_en, 1000)
  };
}

export function buildHomepageCategories(b = {}) {
  return [0, 1, 2, 3]
    .map((idx) => {
      const catId = Number(b[`home_cat_${idx}_id`]);
      return {
        category_id: !Number.isNaN(catId) && catId > 0 ? catId : 0,
        image_url: cleanStr(b[`home_cat_${idx}_image_url`], 500),
        sort_order: idx + 1
      };
    })
    .filter((c) => c.category_id > 0);
}

export function buildCertificationsSection(b = {}) {
  const items = [0, 1, 2, 3]
    .map((idx) => ({
      name: cleanStr(b[`cert_${idx}_name`], 255),
      desc_id: cleanStr(b[`cert_${idx}_desc_id`], 500),
      desc_en: cleanStr(b[`cert_${idx}_desc_en`], 500),
      logo_url: cleanStr(b[`cert_${idx}_logo_url`], 500),
      sort_order: Number(b[`cert_${idx}_sort_order`]) || idx + 1,
      is_active: isChecked(b[`cert_${idx}_is_active`])
    }))
    .filter((c) => Boolean(c.name));

  return {
    title_id: cleanStr(b.cert_title_id, 255),
    title_en: cleanStr(b.cert_title_en, 255),
    body_id: cleanStr(b.cert_body_id, 1000),
    body_en: cleanStr(b.cert_body_en, 1000),
    btn_text_id: cleanStr(b.cert_btn_text_id, 100),
    btn_text_en: cleanStr(b.cert_btn_text_en, 100),
    btn_url: cleanStr(b.cert_btn_url, 500) || '/about#sertifikasi',
    show_btn: isChecked(b.cert_show_btn),
    is_active: isChecked(b.cert_is_active),
    items
  };
}

function buildCtaPages(b = {}) {
  const pages = {};
  for (const key of CTA_PAGE_KEYS) {
    pages[key] = isChecked(b[`cta_page_${key}`]);
  }
  return pages;
}

export function buildCtaSection(b = {}) {
  return {
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
    pages: buildCtaPages(b),
    is_active: isChecked(b.cta_is_active)
  };
}

export function buildHomeContentPayload(body = {}) {
  const b = body || {};
  return {
    intro: buildIntroSection(b),
    why_choose_us: buildWcuSection(b),
    categories: buildCategoriesSection(b),
    homepage_categories: buildHomepageCategories(b),
    certifications: buildCertificationsSection(b),
    cta: buildCtaSection(b)
  };
}

export async function getAdminHomeContentData() {
  const [homeContent, allCategories] = await Promise.all([
    homeContentModel.getHomeContentData(),
    productCategoryModel.findAll()
  ]);
  return {
    homeContent,
    allCategories: allCategories || [],
    allowedKickerIcons: ALLOWED_KICKER_ICONS
  };
}

export async function updateAdminHomeContent(body) {
  const payload = buildHomeContentPayload(body);
  await homeContentModel.updateHomeContent(payload);
  return payload;
}

export default {
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
};
