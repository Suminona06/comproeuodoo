import homeContentModel from '../models/homeContentModel.js';
import productCategoryModel from '../models/productCategoryModel.js';
import { sanitizeSafeHref, sanitizeSafePath } from '../utils/sanitizer.js';

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

function cleanOptStr(val, maxLen = 255) {
  if (val === undefined || val === null) return undefined;
  const trimmed = String(val).trim();
  return maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function cleanOptPath(val) {
  if (val === undefined || val === null) return undefined;
  const trimmed = String(val).trim();
  return trimmed === '' ? '' : sanitizeSafePath(trimmed, '');
}

function cleanOptHref(val, fallback = '') {
  if (val === undefined || val === null) return undefined;
  return sanitizeSafeHref(String(val), fallback);
}

function isChecked(val) {
  return val === '1' || val === 'on' ? 1 : 0;
}

function hasAnyKey(obj, keys) {
  return keys.some((k) => obj[k] !== undefined);
}

function resolveSectionFlag(b, flagKey, anchorKeys) {
  if (b[flagKey] === undefined && !hasAnyKey(b, anchorKeys)) return undefined;
  return isChecked(b[flagKey]);
}

function resolveChipIcon(rawIcon) {
  if (rawIcon === undefined) return undefined;
  const icon = cleanOptStr(rawIcon);
  return ALLOWED_KICKER_ICONS.includes(icon) ? icon : 'tree';
}

export function buildIntroSection(b = {}) {
  return {
    eyebrow_id: cleanOptStr(b.intro_eyebrow_id, 100),
    eyebrow_en: cleanOptStr(b.intro_eyebrow_en, 100),
    title_id: cleanOptStr(b.intro_title_id, 255),
    title_en: cleanOptStr(b.intro_title_en, 255),
    paragraph_1_id: cleanOptStr(b.intro_paragraph_1_id, 2000),
    paragraph_1_en: cleanOptStr(b.intro_paragraph_1_en, 2000),
    paragraph_2_id: cleanOptStr(b.intro_paragraph_2_id, 2000),
    paragraph_2_en: cleanOptStr(b.intro_paragraph_2_en, 2000),
    image_url: cleanOptPath(b.intro_image_url),
    is_active: resolveSectionFlag(b, 'intro_is_active', ['intro_title_id', 'intro_title_en'])
  };
}

export function buildWcuSection(b = {}) {
  return {
    is_active: resolveSectionFlag(b, 'wcu_is_active', ['wcu_title_id', 'wcu_title_en']),
    eyebrow_id: cleanOptStr(b.wcu_eyebrow_id, 100),
    eyebrow_en: cleanOptStr(b.wcu_eyebrow_en, 100),
    title_id: cleanOptStr(b.wcu_title_id, 255),
    title_en: cleanOptStr(b.wcu_title_en, 255),
    chip_label_id: cleanOptStr(b.wcu_chip_label_id, 100),
    chip_label_en: cleanOptStr(b.wcu_chip_label_en, 100),
    chip_icon: resolveChipIcon(b.wcu_chip_icon),
    headline_id: cleanOptStr(b.wcu_headline_id, 255),
    headline_en: cleanOptStr(b.wcu_headline_en, 255),
    desc_id: cleanOptStr(b.wcu_desc_id, 2000),
    desc_en: cleanOptStr(b.wcu_desc_en, 2000),
    callout_lead_id: cleanOptStr(b.wcu_callout_lead_id, 255),
    callout_lead_en: cleanOptStr(b.wcu_callout_lead_en, 255),
    callout_body_id: cleanOptStr(b.wcu_callout_body_id, 1000),
    callout_body_en: cleanOptStr(b.wcu_callout_body_en, 1000),
    note_id: cleanOptStr(b.wcu_note_id, 500),
    note_en: cleanOptStr(b.wcu_note_en, 500),
    art_label_id: cleanOptStr(b.wcu_art_label_id, 100),
    art_label_en: cleanOptStr(b.wcu_art_label_en, 100),
    float_eyebrow_id: cleanOptStr(b.wcu_float_eyebrow_id, 100),
    float_eyebrow_en: cleanOptStr(b.wcu_float_eyebrow_en, 100),
    float_title_id: cleanOptStr(b.wcu_float_title_id, 100),
    float_title_en: cleanOptStr(b.wcu_float_title_en, 100),
    float_desc_id: cleanOptStr(b.wcu_float_desc_id, 255),
    float_desc_en: cleanOptStr(b.wcu_float_desc_en, 255),
    image_url: cleanOptPath(b.wcu_image_url)
  };
}

export function buildCategoriesSection(b = {}) {
  return {
    title_id: cleanOptStr(b.cat_title_id, 255),
    title_en: cleanOptStr(b.cat_title_en, 255),
    subtitle_id: cleanOptStr(b.cat_subtitle_id, 1000),
    subtitle_en: cleanOptStr(b.cat_subtitle_en, 1000)
  };
}

export function buildHomepageCategories(b = {}) {
  if (!hasAnyKey(b, ['home_cat_0_id', 'home_cat_1_id', 'home_cat_2_id', 'home_cat_3_id'])) {
    return undefined;
  }
  return [0, 1, 2, 3]
    .map((idx) => {
      const catId = Number(b[`home_cat_${idx}_id`]);
      return {
        category_id: !Number.isNaN(catId) && catId > 0 ? catId : 0,
        image_url: sanitizeSafePath(String(b[`home_cat_${idx}_image_url`] ?? ''), ''),
        sort_order: idx + 1
      };
    })
    .filter((c) => c.category_id > 0);
}

function buildCertificationItems(b) {
  if (!hasAnyKey(b, ['cert_0_name', 'cert_1_name', 'cert_2_name', 'cert_3_name'])) {
    return undefined;
  }
  return [0, 1, 2, 3]
    .map((idx) => ({
      name: cleanOptStr(b[`cert_${idx}_name`], 255) || '',
      desc_id: cleanOptStr(b[`cert_${idx}_desc_id`], 500) || '',
      desc_en: cleanOptStr(b[`cert_${idx}_desc_en`], 500) || '',
      logo_url: sanitizeSafePath(String(b[`cert_${idx}_logo_url`] ?? ''), ''),
      sort_order: Number(b[`cert_${idx}_sort_order`]) || idx + 1,
      is_active: isChecked(b[`cert_${idx}_is_active`])
    }))
    .filter((c) => Boolean(c.name));
}

export function buildCertificationsSection(b = {}) {
  const anchors = ['cert_title_id', 'cert_title_en'];
  return {
    title_id: cleanOptStr(b.cert_title_id, 255),
    title_en: cleanOptStr(b.cert_title_en, 255),
    body_id: cleanOptStr(b.cert_body_id, 1000),
    body_en: cleanOptStr(b.cert_body_en, 1000),
    btn_text_id: cleanOptStr(b.cert_btn_text_id, 100),
    btn_text_en: cleanOptStr(b.cert_btn_text_en, 100),
    btn_url: cleanOptHref(b.cert_btn_url, '/about#sertifikasi'),
    show_btn: resolveSectionFlag(b, 'cert_show_btn', anchors),
    is_active: resolveSectionFlag(b, 'cert_is_active', anchors),
    items: buildCertificationItems(b)
  };
}

function buildCtaPages(b = {}) {
  if (!hasAnyKey(b, ['cta_title_id', 'cta_title_en'])) return undefined;
  const pages = {};
  for (const key of CTA_PAGE_KEYS) {
    pages[key] = isChecked(b[`cta_page_${key}`]);
  }
  return pages;
}

export function buildCtaSection(b = {}) {
  const anchors = ['cta_title_id', 'cta_title_en'];
  return {
    title_id: cleanOptStr(b.cta_title_id, 255),
    title_en: cleanOptStr(b.cta_title_en, 255),
    subtitle_id: cleanOptStr(b.cta_subtitle_id, 1000),
    subtitle_en: cleanOptStr(b.cta_subtitle_en, 1000),
    btn1_title_id: cleanOptStr(b.cta_btn1_title_id, 100),
    btn1_title_en: cleanOptStr(b.cta_btn1_title_en, 100),
    btn1_sub_id: cleanOptStr(b.cta_btn1_sub_id, 100),
    btn1_sub_en: cleanOptStr(b.cta_btn1_sub_en, 100),
    btn1_url: cleanOptHref(b.cta_btn1_url, '/contact'),
    btn2_title_id: cleanOptStr(b.cta_btn2_title_id, 100),
    btn2_title_en: cleanOptStr(b.cta_btn2_title_en, 100),
    btn2_sub_id: cleanOptStr(b.cta_btn2_sub_id, 100),
    btn2_sub_en: cleanOptStr(b.cta_btn2_sub_en, 100),
    btn2_url: cleanOptHref(b.cta_btn2_url, ''),
    pages: buildCtaPages(b),
    is_active: resolveSectionFlag(b, 'cta_is_active', anchors)
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
