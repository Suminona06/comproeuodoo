import settingModel from '../models/settingModel.js';
import { saveSettingUpload, generateFaviconSet } from '../middleware/uploadMiddleware.js';
import logger from '../utils/logger.js';

export const FOOTER_DESC_MAX_LEN = 350;
export const FOOTER_NAV_MAX_ITEMS = 4;
export const FOOTER_LABEL_MAX_LEN = 80;
export const FOOTER_URL_MAX_LEN = 255;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9\s+\-()]*$/;
const SOCIAL_PLATFORMS = ['linkedin', 'instagram', 'facebook', 'youtube'];
const GOOGLE_MAPS_HOSTS = new Set(['www.google.com', 'google.com', 'maps.google.com']);

const EMAIL_FIELDS = [['company_email', 'perusahaan'], ['office_email', 'kantor Jakarta'], ['factory_email', 'pabrik Bandung']];
const PHONE_FIELDS = [['office_phone', 'telepon kantor Jakarta'], ['office_fax', 'fax kantor Jakarta'], ['factory_phone', 'telepon pabrik Bandung'], ['factory_fax', 'fax pabrik Bandung']];
const LOGO_FIELDS = [['site_logo_header', 'logo_header_file', 'logo-header'], ['site_logo_footer', 'logo_footer_file', 'logo-footer']];

const hasControlChars = (value) => [...value].some((ch) => ch.charCodeAt(0) <= 31 || ch.charCodeAt(0) === 127);
const getUploadedFile = (files, field) => (files && Array.isArray(files[field]) ? files[field][0] : null);
const stripHtmlTags = (value) => (value ? String(value).replace(/<[^>]*>?/gm, '').trim() : '');
export const stripHtmlMax = (value, maxLen) => stripHtmlTags(value).slice(0, maxLen);

function extractGoogleMapsUrl(trimmed) {
  if (!trimmed.startsWith('<iframe') && !trimmed.includes('<iframe')) return trimmed;
  const srcMatch = trimmed.match(/src=["'](https:\/\/[^"']+)["']/i);
  if (!srcMatch || !srcMatch[1]) {
    throw new Error('Kode embed iframe Google Maps tidak memiliki atribut src yang valid.');
  }
  return srcMatch[1];
}

function assertGoogleMapsParsedUrl(parsed) {
  if (parsed.protocol !== 'https:') {
    throw new Error('URL Google Maps wajib menggunakan protokol aman HTTPS.');
  }
  if (!GOOGLE_MAPS_HOSTS.has(parsed.hostname.toLowerCase()) || !parsed.pathname.startsWith('/maps')) {
    throw new Error('URL wajib berasal dari domain sematan resmi Google Maps (google.com/maps/embed).');
  }
}

export function parseAndValidateGoogleMapsUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return '';
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  const extractedUrl = extractGoogleMapsUrl(trimmed);
  try {
    assertGoogleMapsParsedUrl(new URL(extractedUrl));
    return extractedUrl;
  } catch (err) {
    throw new Error('Format URL Google Maps tidak valid: ' + err.message, { cause: err });
  }
}

function parseRawJsonString(rawText, fieldLabel) {
  const trimmed = rawText.trim();
  if (!trimmed || trimmed === '[]') return [];
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    throw new Error(`Format data ${fieldLabel} tidak valid: ${err.message}`, { cause: err });
  }
}

function parseJsonArrayInput(rawInput, fieldLabel) {
  if (rawInput === undefined || rawInput === null) return [];
  const list = typeof rawInput === 'string' ? parseRawJsonString(rawInput, fieldLabel) : rawInput;
  if (!Array.isArray(list)) {
    throw new Error(`Data ${fieldLabel} harus berupa array.`);
  }
  return list;
}

function extractWhatsAppPhone(rawItem, rowNum) {
  const candidate = rawItem.number || rawItem.formatted || '';
  const cleanNum = String(candidate).replace(/[^0-9]/g, '');
  if (!cleanNum || cleanNum.length < 9 || cleanNum.length > 16) {
    throw new Error(`Nomor WhatsApp pada baris ke-${rowNum} wajib berisi 9-16 digit angka yang valid.`);
  }
  return cleanNum;
}

function extractWhatsAppPct(rawPercentage, rowNum) {
  const pct = parseInt(rawPercentage, 10);
  if (isNaN(pct) || pct < 1 || pct > 100) {
    throw new Error(`Persentase bobot nomor pada baris ke-${rowNum} harus berupa angka bulat antara 1% dan 100%.`);
  }
  return pct;
}

function sanitizeWhatsAppItem(item, index) {
  const rowNum = index + 1;
  if (!item || typeof item !== 'object') {
    throw new Error(`Data nomor WhatsApp baris ke-${rowNum} tidak valid.`);
  }
  const cleanNum = extractWhatsAppPhone(item, rowNum);
  const cleanLabel = stripHtmlMax(item.label, 50) || `Sales ${rowNum}`;
  const pct = extractWhatsAppPct(item.percentage, rowNum);
  return { number: cleanNum, formatted: cleanNum, label: cleanLabel, percentage: pct };
}

export function parseAndValidateWhatsAppNumbers(rawInput) {
  const list = parseJsonArrayInput(rawInput, 'nomor WhatsApp');
  if (list.length === 0) return '[]';

  let totalPercentage = 0;
  const sanitizedList = list.map((item, idx) => {
    const cleanItem = sanitizeWhatsAppItem(item, idx);
    totalPercentage += cleanItem.percentage;
    return cleanItem;
  });

  if (totalPercentage !== 100) {
    throw new Error(`Total alokasi persentase seluruh nomor WhatsApp wajib tepat 100% (saat ini: ${totalPercentage}%).`);
  }
  return JSON.stringify(sanitizedList);
}

export function isExternalFooterUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false;
  return /^https?:\/\//i.test(rawUrl.trim());
}

function isValidHttpUrl(rawUrl) {
  if (!isExternalFooterUrl(rawUrl)) return false;
  try {
    const parsed = new URL(rawUrl);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isSafeInternalOrAnchor(trimmed) {
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return false;
  return trimmed.startsWith('/');
}

export function isAllowedFooterUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > FOOTER_URL_MAX_LEN || hasControlChars(trimmed)) {
    return false;
  }
  return isSafeInternalOrAnchor(trimmed) || isValidHttpUrl(trimmed);
}

export function validateFooterDescriptions(body) {
  const safeBody = body || {};
  const result = {};
  const fields = [['footer_desc_id', 'Indonesia'], ['footer_desc_en', 'Inggris']];

  for (const [key, langLabel] of fields) {
    if (safeBody[key] === undefined || safeBody[key] === null) continue;
    const trimmed = String(safeBody[key]).trim();
    if (trimmed.length > FOOTER_DESC_MAX_LEN) {
      throw new Error(`Deskripsi footer bahasa ${langLabel} maksimal ${FOOTER_DESC_MAX_LEN} karakter.`);
    }
    result[key] = trimmed;
  }
  return result;
}

function assertMenuFieldBounds(value, fieldName, rowNum, maxLen) {
  if (!value) throw new Error(`${fieldName} pada menu footer baris ke-${rowNum} wajib diisi.`);
  if (value.length > maxLen) {
    throw new Error(`${fieldName} pada menu footer baris ke-${rowNum} maksimal ${maxLen} karakter.`);
  }
  return value;
}

function sanitizeFooterNavItem(item, index) {
  const rowNum = index + 1;
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`Data tautan menu footer baris ke-${rowNum} tidak valid.`);
  }
  const label_id = assertMenuFieldBounds(stripHtmlTags(item.label_id), 'Label (ID)', rowNum, FOOTER_LABEL_MAX_LEN);
  const label_en = assertMenuFieldBounds(stripHtmlTags(item.label_en), 'Label (EN)', rowNum, FOOTER_LABEL_MAX_LEN);
  const url = assertMenuFieldBounds(String(item.url || '').trim(), 'URL tujuan', rowNum, FOOTER_URL_MAX_LEN);
  if (!isAllowedFooterUrl(url)) {
    throw new Error(`URL tujuan pada menu footer baris ke-${rowNum} tidak valid. Hanya https://, http://, path /, atau # yang diizinkan.`);
  }
  return { label_id, label_en, url };
}

export function parseAndValidateFooterNavLinks(rawInput) {
  const list = parseJsonArrayInput(rawInput, 'tautan menu footer');
  if (list.length === 0) return '[]';
  if (list.length > FOOTER_NAV_MAX_ITEMS) {
    throw new Error(`Maksimal ${FOOTER_NAV_MAX_ITEMS} tautan menu footer diperbolehkan.`);
  }
  return JSON.stringify(list.map(sanitizeFooterNavItem));
}

function validatePatternFields(updates, rules, regex, makeMessage) {
  for (const [key, label] of rules) {
    if (updates[key] && !regex.test(updates[key])) {
      throw new Error(makeMessage(label));
    }
  }
}

function applyTextAndContactUpdates(updates, body, textKeys) {
  if (!body) return;
  for (const key of textKeys) {
    if (body[key] !== undefined) updates[key] = String(body[key]).trim();
  }
  validatePatternFields(updates, EMAIL_FIELDS, EMAIL_REGEX, (l) => `Format alamat email ${l} tidak valid.`);
  validatePatternFields(updates, PHONE_FIELDS, PHONE_REGEX, (l) => `Nomor ${l} hanya boleh berisi angka, spasi, tanda plus, tanda hubung, dan kurung.`);

  if (updates.office_phone && !updates.company_phone) {
    updates.company_phone = updates.office_phone;
  } else if (updates.company_phone && !updates.office_phone) {
    updates.office_phone = updates.company_phone;
  }
}

function applyWhatsAppAndToggleUpdates(updates, body) {
  if (!body) return;
  if (body.whatsapp_number !== undefined) {
    updates.whatsapp_number = String(body.whatsapp_number).replace(/[^0-9]/g, '');
    updates.whatsapp_formatted_number = updates.whatsapp_number;
  }
  if (body.whatsapp_numbers_json !== undefined) {
    updates.whatsapp_numbers_json = parseAndValidateWhatsAppNumbers(body.whatsapp_numbers_json);
  }
  updates.office_card_visible = body.office_card_visible === '1' ? '1' : '0';
  updates.factory_card_visible = body.factory_card_visible === '1' ? '1' : '0';
  if (body.google_maps_embed !== undefined) {
    updates.google_maps_embed = parseAndValidateGoogleMapsUrl(body.google_maps_embed);
    updates.contact_maps_embed_url = updates.google_maps_embed;
  }
}

function applySocialPlatformUpdate(updates, safeBody, platform) {
  const toggleKey = `social_${platform}_visible`;
  updates[toggleKey] = safeBody[toggleKey] === '1' ? '1' : '0';
  const urlKey = `social_${platform}_url`;
  const legacyUrlKey = `${platform}_url`;
  const rawUrl = safeBody[urlKey] !== undefined ? safeBody[urlKey] : safeBody[legacyUrlKey];
  const trimmedUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';

  if (trimmedUrl && !trimmedUrl.startsWith('https://')) {
    throw new Error(`URL ${platform} wajib menggunakan protokol aman https://`);
  }
  updates[urlKey] = trimmedUrl;
  updates[legacyUrlKey] = trimmedUrl;
}

function applySocialUpdates(updates, body) {
  const safeBody = body || {};
  for (const platform of SOCIAL_PLATFORMS) {
    applySocialPlatformUpdate(updates, safeBody, platform);
  }
}

async function applyLogoUpdates(updates, body, files) {
  const safeBody = body || {};
  for (const [settingKey, fileField, uploadPrefix] of LOGO_FIELDS) {
    if (safeBody[settingKey] !== undefined) {
      updates[settingKey] = String(safeBody[settingKey]).trim();
    }
    const uploadedFile = getUploadedFile(files, fileField);
    if (!uploadedFile) continue;
    const savedUrl = await saveSettingUpload(uploadedFile, uploadPrefix);
    if (savedUrl) updates[settingKey] = savedUrl;
  }
}

async function resolveFallbackFaviconSource(updates) {
  const fallback = updates.site_logo_header || (await settingModel.get('site_logo_header')) || '';
  if (fallback) updates.site_favicon_source = '';
  return fallback || null;
}

async function resolveFaviconInput(updates, body, files) {
  const uploadedFavicon = getUploadedFile(files, 'favicon_file');
  if (uploadedFavicon) return { source: uploadedFavicon.buffer, isExplicit: true };
  if (!body || body.site_favicon === undefined) return { source: null, isExplicit: false };

  const rawFavicon = String(body.site_favicon).trim();
  if (rawFavicon) return { source: rawFavicon, isExplicit: true };
  return { source: await resolveFallbackFaviconSource(updates), isExplicit: false };
}

async function applyFaviconUpdates(updates, body, files) {
  const { source, isExplicit } = await resolveFaviconInput(updates, body, files);
  if (!source) return;

  try {
    const faviconSet = await generateFaviconSet(source);
    updates.site_favicon = faviconSet.favicon;
    for (const size of [16, 32, 180, 192, 512]) {
      updates[`site_favicon_${size}`] = faviconSet.sizes[size];
    }
    if (isExplicit && typeof source === 'string') updates.site_favicon_source = source;
  } catch (faviconErr) {
    logger.warn(`Favicon generation error: ${faviconErr.message}`);
    if (typeof source === 'string') updates.site_favicon = source;
  }
}

function applyFooterUpdates(updates, body) {
  Object.assign(updates, validateFooterDescriptions(body));
  if (body && body.footer_nav_links_json !== undefined) {
    updates.footer_nav_links_json = parseAndValidateFooterNavLinks(body.footer_nav_links_json);
  }
}

export async function buildSettingUpdates(req, textKeys) {
  const updates = {};
  const { body, files } = req;
  applyTextAndContactUpdates(updates, body, textKeys);
  applyWhatsAppAndToggleUpdates(updates, body);
  applyFooterUpdates(updates, body);
  applySocialUpdates(updates, body);
  await applyLogoUpdates(updates, body, files);
  await applyFaviconUpdates(updates, body, files);
  return updates;
}
