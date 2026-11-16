import settingModel from '../models/settingModel.js';
import {
  FOOTER_DESC_MAX_LEN,
  FOOTER_LABEL_MAX_LEN,
  FOOTER_NAV_MAX_ITEMS,
  isAllowedFooterUrl,
  isExternalFooterUrl,
  stripHtmlMax
} from '../services/settingService.js';
import logger from '../utils/logger.js';

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30 * 1000;

const DEFAULT_WA_MESSAGE = 'Halo PT Euodoo, saya ingin berkonsultasi mengenai pemesanan kantong plastik ramah lingkungan (100% degradable).';
const DEFAULT_MAPS_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126748.56347862248!2d107.5731168!3d-6.9034443!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6398252477f%3A0x146a1f93d3e215ac!2sBandung%2C%20Bandung%20City%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid';
const DEFAULT_CTA_PAGES = {
  home: 1, about: 1, products: 1, product_detail: 1,
  capabilities: 1, news: 1, news_detail: 1, contact: 0, 404: 0
};

const SOCIAL_PLATFORMS = ['linkedin', 'instagram', 'facebook', 'youtube'];

const OFFICE_DEFAULTS = [
  ['company_name', ['company_name'], 'PT. EUODOO'],
  ['office_name_id', ['office_name_id'], 'Kantor Pusat (Jakarta)'],
  ['office_name_en', ['office_name_en'], 'Head Office (Jakarta)'],
  ['office_address', ['office_address', 'about_office_address'], 'Karindra Building Jl. Palmerah Selatan 30 A Suite 02 - 07, Jakarta Pusat 10270'],
  ['office_phone', ['office_phone', 'company_phone', 'about_office_phone'], '(021) 53668626'],
  ['company_phone', ['office_phone'], '(021) 53668626'],
  ['company_email', ['company_email'], 'info@euodoo.com'],
  ['office_email', ['office_email', 'company_email'], 'info@euodoo.com']
];

const FACTORY_DEFAULTS = [
  ['factory_name_id', ['factory_name_id'], 'Pabrik Manufaktur (Bandung)'],
  ['factory_name_en', ['factory_name_en'], 'Manufacturing Plant (Bandung)'],
  ['factory_address', ['factory_address', 'about_factory_address'], 'Kawasan Industri Cigondewah, Jl. Cigondewah Kaler No. 88, Kota Bandung, Jawa Barat 40214'],
  ['factory_phone', ['factory_phone'], '(022) 6012519'],
  ['factory_fax', ['factory_fax'], ''],
  ['factory_email', ['factory_email'], ''],
  ['factory_working_hours_id', ['factory_working_hours_id', 'contact_working_hours_id'], 'Senin - Jumat: 08.00 - 17.00 WIB | Sabtu: 08.00 - 13.00 WIB'],
  ['factory_working_hours_en', ['factory_working_hours_en', 'contact_working_hours_en'], 'Monday - Friday: 08:00 - 17:00 WIB | Saturday: 08:00 - 13:00 WIB']
];

const toToggleFlag = (value) => (value !== undefined ? String(value) : '1');

function extractNormalizedLabels(item) {
  const labelId = stripHtmlMax(item.label_id, FOOTER_LABEL_MAX_LEN);
  const labelEn = stripHtmlMax(item.label_en, FOOTER_LABEL_MAX_LEN);
  if (!labelId && !labelEn) return null;
  return { label_id: labelId || labelEn, label_en: labelEn || labelId };
}

function buildNormalizedFooterItem(item) {
  if (!item || typeof item !== 'object' || typeof item.url !== 'string') return null;
  const url = item.url.trim();
  if (!isAllowedFooterUrl(url)) return null;
  const labels = extractNormalizedLabels(item);
  if (!labels) return null;
  return { ...labels, url, isExternal: isExternalFooterUrl(url) };
}

export function normalizeFooterNavLinks(rawInput) {
  let parsed = rawInput;
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed || trimmed === '[]') return [];
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map(buildNormalizedFooterItem).filter(Boolean).slice(0, FOOTER_NAV_MAX_ITEMS);
}

export function normalizeFooterSettings(settings) {
  const rawDescId = typeof settings.footer_desc_id === 'string' ? settings.footer_desc_id.trim() : '';
  const rawDescEn = typeof settings.footer_desc_en === 'string' ? settings.footer_desc_en.trim() : '';
  settings.footer_desc_id = rawDescId.slice(0, FOOTER_DESC_MAX_LEN);
  settings.footer_desc_en = rawDescEn.slice(0, FOOTER_DESC_MAX_LEN);

  const footerNavLinks = normalizeFooterNavLinks(settings.footer_nav_links_json);
  settings.footer_nav_links = footerNavLinks;
  return footerNavLinks;
}

export const formatWhatsAppNumber = (rawNumber) => {
  if (!rawNumber) return '';
  let cleaned = String(rawNumber).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

async function getCachedSettings() {
  const now = Date.now();
  try {
    if (!cachedSettings || (now - lastFetchTime) > CACHE_TTL_MS) {
      cachedSettings = await settingModel.getAll();
      lastFetchTime = now;
    }
  } catch (err) {
    logger.warn(`Failed to fetch global settings: ${err.message}`);
    cachedSettings = cachedSettings || {};
  }
  return cachedSettings;
}

function applyFallbackMap(settings, entries) {
  for (const [targetKey, sourceKeys, defaultValue] of entries) {
    const found = sourceKeys.map((key) => settings[key]).find(Boolean);
    settings[targetKey] = found || defaultValue;
  }
}

function applyWhatsAppDefaults(settings) {
  const formattedWaNumber = formatWhatsAppNumber(settings.whatsapp_number || '');
  const waDefaultMessage = settings.whatsapp_default_message || settings.whatsapp_message || DEFAULT_WA_MESSAGE;
  const encodedMsg = encodeURIComponent(waDefaultMessage);

  settings.whatsapp_formatted_number = formattedWaNumber;
  settings.whatsapp_default_message = waDefaultMessage;
  settings.whatsapp_button_theme = settings.whatsapp_button_theme || 'corporate';
  settings.whatsapp_encoded_message = encodedMsg;
  settings.whatsapp_url = formattedWaNumber ? `https://wa.me/${formattedWaNumber}?text=${encodedMsg}` : '';
}

function applySocialDefaults(settings) {
  for (const platform of SOCIAL_PLATFORMS) {
    const url = settings[`social_${platform}_url`] || settings[`${platform}_url`] || settings[`social_${platform}`] || '';
    settings[`social_${platform}_url`] = url;
    settings[`${platform}_url`] = url;
    settings[`social_${platform}`] = url;
    const visKey = `social_${platform}_visible`;
    settings[visKey] = toToggleFlag(settings[visKey]);
  }
  settings.office_card_visible = toToggleFlag(settings.office_card_visible);
  settings.factory_card_visible = toToggleFlag(settings.factory_card_visible);
}

function applyIdentityAndContactDefaults(settings) {
  applyFallbackMap(settings, OFFICE_DEFAULTS);
  settings.office_fax = settings.office_fax !== undefined ? settings.office_fax : '+6221-53668648';
  applyFallbackMap(settings, FACTORY_DEFAULTS);

  settings.contact_phone = settings.factory_phone || settings.company_phone;
  settings.contact_email = settings.company_email;
  settings.contact_address_id = settings.contact_address_id || settings.factory_address;
  settings.contact_address_en = settings.contact_address_en || settings.factory_address;
  settings.contact_working_hours_id = settings.factory_working_hours_id;
  settings.contact_working_hours_en = settings.factory_working_hours_en;
  settings.google_maps_embed = settings.google_maps_embed || settings.contact_maps_embed_url || DEFAULT_MAPS_EMBED;
  settings.contact_maps_embed_url = settings.google_maps_embed;
}

function parseGlobalCtaPages(rawJson) {
  if (!rawJson) return { ...DEFAULT_CTA_PAGES };
  try {
    const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    return { ...DEFAULT_CTA_PAGES };
  }
  return { ...DEFAULT_CTA_PAGES };
}

function isGlobalCtaActive(rawValue) {
  if (rawValue === undefined) return true;
  return rawValue === '1' || rawValue === 1 || rawValue === true;
}

function buildGlobalCta(settings) {
  const str = (key) => settings[key] ?? '';
  return {
    title_id: str('global_cta_title_id'),
    title_en: str('global_cta_title_en'),
    subtitle_id: str('global_cta_subtitle_id'),
    subtitle_en: str('global_cta_subtitle_en'),
    btn1_title_id: str('global_cta_btn1_title_id'),
    btn1_title_en: str('global_cta_btn1_title_en'),
    btn1_sub_id: str('global_cta_btn1_sub_id'),
    btn1_sub_en: str('global_cta_btn1_sub_en'),
    btn1_url: settings.global_cta_btn1_url || '/contact',
    btn2_title_id: str('global_cta_btn2_title_id'),
    btn2_title_en: str('global_cta_btn2_title_en'),
    btn2_sub_id: str('global_cta_btn2_sub_id'),
    btn2_sub_en: str('global_cta_btn2_sub_en'),
    btn2_url: settings.global_cta_btn2_url || settings.whatsapp_url,
    pages: parseGlobalCtaPages(settings.global_cta_pages_json),
    is_active: isGlobalCtaActive(settings.global_cta_is_active)
  };
}

export const settingsMiddleware = async (req, res, next) => {
  const settings = { ...(await getCachedSettings()) };
  applyWhatsAppDefaults(settings);
  applySocialDefaults(settings);
  applyIdentityAndContactDefaults(settings);
  const footerNavLinks = normalizeFooterSettings(settings);
  settings.globalCta = buildGlobalCta(settings);

  res.locals.settings = settings;
  res.locals.globalCta = settings.globalCta;
  res.locals.footerNavLinks = footerNavLinks;
  next();
};

export const clearSettingsCache = () => {
  cachedSettings = null;
  lastFetchTime = 0;
};

export default settingsMiddleware;
