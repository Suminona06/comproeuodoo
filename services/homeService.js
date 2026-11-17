import bannerModel from '../models/bannerModel.js';
import productCategoryModel from '../models/productCategoryModel.js';
import brandModel from '../models/brandModel.js';
import postModel from '../models/postModel.js';
import homeContentModel from '../models/homeContentModel.js';
import { formatInlineText } from '../utils/textFormatter.js';

const DEFAULT_COMPANY_NAME = 'PT. EUODOO';
const DEFAULT_HERO_IMAGE = '/images/hero-factory.jpg';
const DEFAULT_NEWS_YEAR = '2026';
const MIN_MARQUEE_BRANDS = 8;
const MAX_HOME_CATEGORIES = 4;
const MAX_HOME_POSTS = 2;
const SEGMENT_KEYS = ['retail', 'industrial', 'traditional', 'sustainability'];

function isActiveFlag(val) {
  return val === 1 || val === '1' || val === true;
}

function pickStrictLang(obj, baseKey, lang) {
  if (!obj) return '';
  return obj[lang === 'en' ? `${baseKey}_en` : `${baseKey}_id`] || '';
}

function pickBilingual(obj, baseKey, lang, crossFallback = false) {
  if (!obj) return '';
  const primary = obj[`${baseKey}_${lang}`];
  if (primary) return primary;
  if (lang === 'en') return obj[`${baseKey}_id`] || '';
  return crossFallback ? (obj[`${baseKey}_en`] || '') : '';
}

function resolveSafeHref(rawUrl, fallback) {
  const trimmed = rawUrl ? String(rawUrl).trim() : '';
  if (!trimmed) return fallback;
  return /^(?:\/(?!\/)|https?:\/\/|mailto:|tel:|#)/i.test(trimmed) ? trimmed : fallback;
}

function extractYoutubeId(rawUrl) {
  const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (!url) return '';
  const match = url.match(/(?:embed\/|shorts\/|youtu\.be\/|[?&]v=)([^"&?/\s#]+)/);
  if (match) return match[1];
  return !url.includes('/') && /^[a-zA-Z0-9_-]+$/.test(url) ? url : '';
}

function resolveBannerCta(banner, isSecondary, lang) {
  const textKey = isSecondary ? 'cta_secondary_text' : 'cta_text';
  const text = pickBilingual(banner, textKey, lang, true).trim();
  if (!text) return null;
  const rawUrl = isSecondary ? banner.cta_secondary_url : (banner.cta_url || banner.link_url);
  const url = resolveSafeHref(rawUrl, isSecondary ? '/about' : '/contact');
  return { text, url, isExternal: /^https?:\/\//i.test(url) };
}

function buildFallbackBanner(t) {
  return [{
    title_id: t('home.fallback_banner_title'),
    title_en: t('home.fallback_banner_title'),
    caption_id: t('home.fallback_banner_caption'),
    caption_en: t('home.fallback_banner_caption'),
    cta_text_id: t('home.fallback_banner_cta_primary'),
    cta_text_en: t('home.fallback_banner_cta_primary'),
    cta_url: '/contact',
    cta_secondary_text_id: t('home.fallback_banner_cta_secondary'),
    cta_secondary_text_en: t('home.fallback_banner_cta_secondary'),
    cta_secondary_url: '/about',
    file_url: DEFAULT_HERO_IMAGE,
    media_type: 'image'
  }];
}

function mapHeroSlide(banner, index, total, lang, t) {
  const isYoutube = banner.media_type === 'youtube';
  const mediaType = (banner.media_type === 'video' || isYoutube) ? banner.media_type : 'image';
  return {
    title: pickBilingual(banner, 'title', lang),
    caption: pickBilingual(banner, 'caption', lang),
    mediaType,
    mediaUrl: banner.file_url || banner.image_url || DEFAULT_HERO_IMAGE,
    posterUrl: banner.poster_url || '',
    videoPosterUrl: banner.poster_url || DEFAULT_HERO_IMAGE,
    youtubeId: isYoutube ? extractYoutubeId(banner.file_url) : '',
    isActiveSlide: index === 0,
    slideAria: t('home.hero_slide_aria', { current: index + 1, total }),
    primaryCta: resolveBannerCta(banner, false, lang),
    secondaryCta: resolveBannerCta(banner, true, lang)
  };
}

export function buildHeroViewModel(banners, lang, t) {
  const active = Array.isArray(banners) ? banners.filter((b) => isActiveFlag(b?.is_active)) : [];
  const source = active.length > 0 ? active : buildFallbackBanner(t);
  const slides = source.map((banner, idx) => mapHeroSlide(banner, idx, source.length, lang, t));
  return { slides, hasControls: slides.length > 1, totalLabel: String(slides.length).padStart(2, '0') };
}

export function buildIntroViewModel(introData, lang) {
  const intro = introData || {};
  const eyebrow = pickStrictLang(intro, 'eyebrow', lang);
  const title = pickStrictLang(intro, 'title', lang);
  const paragraph1 = pickStrictLang(intro, 'paragraph_1', lang);
  const paragraph2 = pickStrictLang(intro, 'paragraph_2', lang);
  const imageUrl = intro.image_url || '';
  const hasContent = Boolean(title || paragraph1 || paragraph2 || imageUrl);
  return { isActive: isActiveFlag(intro.is_active) && hasContent, eyebrow, title, paragraph1, paragraph2, imageUrl };
}

function parseProductCount(rawCount) {
  const parsed = rawCount !== undefined ? parseInt(rawCount, 10) : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function mapCategoryPanel(cat, idx, lang, t) {
  const name = pickBilingual(cat, 'name', lang);
  const count = parseProductCount(cat?.published_product_count);
  const countLabel = t(count === 1 ? 'home.category_count_one' : 'home.category_count_other', { count });
  const segmentKey = SEGMENT_KEYS[idx % SEGMENT_KEYS.length];
  return {
    slug: cat?.slug || '',
    name,
    countLabel,
    imageUrl: cat?.image_url || `/images/segment-${segmentKey}.jpg`,
    ariaLabel: `${name} (${countLabel})`
  };
}

export function buildCategoriesViewModel(catHeader, rawCategories, lang, t) {
  const title = pickStrictLang(catHeader, 'title', lang);
  const subtitle = pickStrictLang(catHeader, 'subtitle', lang);
  const list = Array.isArray(rawCategories) ? rawCategories.slice(0, MAX_HOME_CATEGORIES) : [];
  const items = list.map((cat, idx) => mapCategoryPanel(cat, idx, lang, t));
  const colsCount = Math.min(MAX_HOME_CATEGORIES, Math.max(1, items.length || MAX_HOME_CATEGORIES));
  return {
    isVisible: Boolean(items.length > 0 || title || subtitle),
    title,
    subtitle,
    items,
    colsClass: `hcat-grid--${colsCount}`
  };
}

export function buildWcuViewModel(wcuData, lang) {
  const wcu = wcuData || {};
  const title = pickStrictLang(wcu, 'title', lang);
  const headline = pickStrictLang(wcu, 'headline', lang);
  const desc = pickStrictLang(wcu, 'desc', lang);
  if (!isActiveFlag(wcu.is_active) || !(title || headline || desc)) return { isActive: false };
  return {
    isActive: true,
    eyebrow: pickStrictLang(wcu, 'eyebrow', lang),
    titleHtml: formatInlineText(title),
    chipLabel: pickStrictLang(wcu, 'chip_label', lang),
    chipIcon: wcu.chip_icon || 'asterisk',
    headlineHtml: formatInlineText(headline),
    descHtml: formatInlineText(desc),
    artLabel: pickStrictLang(wcu, 'art_label', lang),
    floatEyebrow: pickStrictLang(wcu, 'float_eyebrow', lang),
    floatTitle: pickStrictLang(wcu, 'float_title', lang),
    floatDesc: pickStrictLang(wcu, 'float_desc', lang)
  };
}

function mapCertificationItem(item, lang) {
  return { name: item.name || '', logoUrl: item.logo_url || '', desc: pickStrictLang(item, 'desc', lang) };
}

export function buildCertificationsViewModel(certData, lang) {
  const cert = certData || {};
  const title = pickStrictLang(cert, 'title', lang);
  const body = pickStrictLang(cert, 'body', lang);
  const rawItems = Array.isArray(cert.items) ? cert.items : [];
  const items = rawItems
    .filter((item) => isActiveFlag(item?.is_active))
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
    .map((item) => mapCertificationItem(item, lang));
  const btnText = pickStrictLang(cert, 'btn_text', lang);
  return {
    isActive: isActiveFlag(cert.is_active) && Boolean(title || body || items.length > 0),
    title,
    body,
    showBtn: isActiveFlag(cert.show_btn) && Boolean(btnText),
    btnText,
    btnUrl: resolveSafeHref(cert.btn_url, '/about#sertifikasi'),
    items
  };
}

function duplicateBrandsForMarquee(list) {
  if (list.length === 0 || list.length >= MIN_MARQUEE_BRANDS) return [...list];
  const result = [...list];
  while (result.length < MIN_MARQUEE_BRANDS) result.push(...list);
  return result;
}

export function buildBrandsViewModel(rawBrands, settings, lang) {
  const active = Array.isArray(rawBrands)
    ? rawBrands.filter((b) => b && b.is_active !== 0 && b.is_active !== false)
    : [];
  const normalized = active.map((b) => ({
    name: b.name || '',
    logoUrl: b.logo_url || '',
    initials: String(b.name || '').substring(0, 2).toUpperCase()
  }));
  const marqueeBrands = duplicateBrandsForMarquee(normalized);
  const sectionTitle = (lang === 'en' ? settings?.home_brand_title_en : settings?.home_brand_title_id) || '';
  return { isVisible: marqueeBrands.length > 0, sectionTitle, marqueeBrands };
}

function formatNewsDate(rawDate, lang) {
  if (!rawDate) return DEFAULT_NEWS_YEAR;
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return DEFAULT_NEWS_YEAR;
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { month: 'short' }).toUpperCase();
  return `${day} ${month} ${d.getFullYear()}`;
}

function resolveNewsImage(post, fallbackImage) {
  const rawImg = (post && (post.display_image || post.cover_image)) || '';
  return rawImg && !rawImg.includes('hero-factory-precision') ? rawImg : fallbackImage;
}

function mapNewsItem(post, index, lang) {
  const fallbackImage = index === 0 ? '/images/post-eco-community.jpg' : '/images/post-school-recycling.jpg';
  const slugOrId = (post && (post.slug || post.id)) || '';
  return {
    href: `/news/${slugOrId}`,
    title: pickBilingual(post, 'title', lang),
    imageUrl: resolveNewsImage(post, fallbackImage),
    fallbackImage,
    formattedDate: formatNewsDate(post?.published_at, lang)
  };
}

export function buildNewsViewModel(rawPosts, lang) {
  const list = Array.isArray(rawPosts) ? rawPosts.slice(0, MAX_HOME_POSTS) : [];
  return { items: list.map((post, idx) => mapNewsItem(post, idx, lang)) };
}

export function buildHomeViewModel(rawData = {}, context = {}) {
  const lang = context.currentLang === 'en' ? 'en' : 'id';
  const translate = typeof context.t === 'function' ? context.t : (key) => key;
  const content = rawData.homeContent || homeContentModel.getDefaults();
  return {
    hero: buildHeroViewModel(rawData.banners, lang, translate),
    intro: buildIntroViewModel(content.intro, lang),
    categories: buildCategoriesViewModel(content.categories, rawData.homepageCategories, lang, translate),
    whyChooseUs: buildWcuViewModel(content.why_choose_us, lang),
    certifications: buildCertificationsViewModel(content.certifications, lang),
    brands: buildBrandsViewModel(rawData.brands, context.settings, lang),
    news: buildNewsViewModel(rawData.latestPosts, lang)
  };
}

export function resolveHomePageTitle(settings, t, isError = false) {
  const translate = typeof t === 'function' ? t : (key) => key;
  if (isError) return translate('home.meta_title_fallback');
  const companyName = settings?.company_name || DEFAULT_COMPANY_NAME;
  return `${companyName} | ${translate('home.meta_title_suffix')}`;
}

export async function getHomePageData(context = {}) {
  const [banners, brands, latestPosts, homeContent, homepageCategories] = await Promise.all([
    bannerModel.findAll(true),
    brandModel.findAll({ activeOnly: true }),
    postModel.findAll({ status: 'published', limit: MAX_HOME_POSTS }),
    homeContentModel.getHomeContentData(),
    productCategoryModel.getHomepageCategories()
  ]);
  const raw = {
    banners: banners || [],
    homepageCategories: homepageCategories || [],
    brands: brands || [],
    latestPosts: latestPosts || [],
    homeContent: homeContent || homeContentModel.getDefaults()
  };
  return buildHomeViewModel(raw, context);
}

export function buildHomeFallbackData(context = {}) {
  const raw = {
    banners: [],
    homepageCategories: [],
    brands: [],
    latestPosts: [],
    homeContent: homeContentModel.getDefaults()
  };
  return buildHomeViewModel(raw, context);
}

export default {
  buildHeroViewModel, buildIntroViewModel, buildCategoriesViewModel,
  buildWcuViewModel, buildCertificationsViewModel, buildBrandsViewModel,
  buildNewsViewModel, buildHomeViewModel, resolveHomePageTitle,
  getHomePageData, buildHomeFallbackData
};
