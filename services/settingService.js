import settingModel from '../models/settingModel.js';
import { clearSettingsCache } from '../middleware/settingsMiddleware.js';
import { applyLogoUpdates, applyFaviconUpdates } from './settingMediaService.js';
import {
  FOOTER_DESC_MAX_LEN,
  FOOTER_NAV_MAX_ITEMS,
  FOOTER_LABEL_MAX_LEN,
  FOOTER_URL_MAX_LEN,
  SettingValidationError,
  stripHtmlMax,
  parseJsonArrayInput,
  isExternalFooterUrl,
  isAllowedFooterUrl,
  validateFooterDescriptions,
  parseAndValidateFooterNavLinks,
  applyFooterUpdates
} from './settingFooterService.js';

export {
  FOOTER_DESC_MAX_LEN,
  FOOTER_NAV_MAX_ITEMS,
  FOOTER_LABEL_MAX_LEN,
  FOOTER_URL_MAX_LEN,
  SettingValidationError,
  stripHtmlMax,
  isExternalFooterUrl,
  isAllowedFooterUrl,
  validateFooterDescriptions,
  parseAndValidateFooterNavLinks
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9\s+\-()]*$/;
const SOCIAL_PLATFORMS = ['linkedin', 'instagram', 'facebook', 'youtube'];
const GOOGLE_MAPS_HOSTS = new Set(['www.google.com', 'google.com', 'maps.google.com']);

const EMAIL_FIELDS = [['company_email', 'perusahaan'], ['office_email', 'kantor Jakarta'], ['factory_email', 'pabrik Bandung']];
const PHONE_FIELDS = [['office_phone', 'telepon kantor Jakarta'], ['office_fax', 'fax kantor Jakarta'], ['factory_phone', 'telepon pabrik Bandung'], ['factory_fax', 'fax pabrik Bandung']];

function extractGoogleMapsUrl(trimmed) {
  if (!trimmed.startsWith('<iframe') && !trimmed.includes('<iframe')) return trimmed;
  const srcMatch = trimmed.match(/src=["'](https:\/\/[^"']+)["']/i);
  if (!srcMatch || !srcMatch[1]) {
    throw new SettingValidationError('Kode embed iframe Google Maps tidak memiliki atribut src yang valid.');
  }
  return srcMatch[1];
}

function assertGoogleMapsParsedUrl(parsed) {
  if (parsed.protocol !== 'https:') {
    throw new SettingValidationError('URL Google Maps wajib menggunakan protokol aman HTTPS.');
  }
  if (!GOOGLE_MAPS_HOSTS.has(parsed.hostname.toLowerCase()) || !parsed.pathname.startsWith('/maps')) {
    throw new SettingValidationError('URL wajib berasal dari domain sematan resmi Google Maps (google.com/maps/embed).');
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
    throw new SettingValidationError('Format URL Google Maps tidak valid: ' + err.message, { cause: err });
  }
}

function extractWhatsAppPhone(rawItem, rowNum) {
  const candidate = rawItem.number || rawItem.formatted || '';
  const cleanNum = String(candidate).replace(/[^0-9]/g, '');
  if (!cleanNum || cleanNum.length < 9 || cleanNum.length > 16) {
    throw new SettingValidationError(`Nomor WhatsApp pada baris ke-${rowNum} wajib berisi 9-16 digit angka yang valid.`);
  }
  return cleanNum;
}

function extractWhatsAppPct(rawPercentage, rowNum) {
  const pct = parseInt(rawPercentage, 10);
  if (isNaN(pct) || pct < 1 || pct > 100) {
    throw new SettingValidationError(`Persentase bobot nomor pada baris ke-${rowNum} harus berupa angka bulat antara 1% dan 100%.`);
  }
  return pct;
}

function sanitizeWhatsAppItem(item, index) {
  const rowNum = index + 1;
  if (!item || typeof item !== 'object') {
    throw new SettingValidationError(`Data nomor WhatsApp baris ke-${rowNum} tidak valid.`);
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
    throw new SettingValidationError(`Total alokasi persentase seluruh nomor WhatsApp wajib tepat 100% (saat ini: ${totalPercentage}%).`);
  }
  return JSON.stringify(sanitizedList);
}

function validatePatternFields(updates, rules, regex, makeMessage) {
  for (const [key, label] of rules) {
    if (updates[key] && !regex.test(updates[key])) {
      throw new SettingValidationError(makeMessage(label));
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
    throw new SettingValidationError(`URL ${platform} wajib menggunakan protokol aman https://`);
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

export async function buildSettingUpdates(req, textKeys, deps = {}) {
  const updates = {};
  const { body, files } = req;
  applyTextAndContactUpdates(updates, body, textKeys);
  applyWhatsAppAndToggleUpdates(updates, body);
  applyFooterUpdates(updates, body);
  applySocialUpdates(updates, body);
  await applyLogoUpdates(updates, body, files, deps);
  await applyFaviconUpdates(updates, body, files, deps);
  return updates;
}

export async function getSettingsMap(deps = {}) {
  const model = deps.settingModel || settingModel;
  return model.getAllAsMap();
}

export async function updateSettings(req, textKeys, deps = {}) {
  const model = deps.settingModel || settingModel;
  const invalidateCache = deps.clearSettingsCache || clearSettingsCache;
  const updates = await buildSettingUpdates(req, textKeys, deps);
  if (Object.keys(updates).length > 0) {
    await model.updateMany(updates);
    invalidateCache();
  }
  return updates;
}
