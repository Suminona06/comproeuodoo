export const FOOTER_DESC_MAX_LEN = 350;
export const FOOTER_NAV_MAX_ITEMS = 4;
export const FOOTER_LABEL_MAX_LEN = 80;
export const FOOTER_URL_MAX_LEN = 255;

export class SettingValidationError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'SettingValidationError';
    this.isValidationError = true;
  }
}

const hasControlChars = (value) =>
  [...value].some((ch) => ch.charCodeAt(0) <= 31 || ch.charCodeAt(0) === 127);

export const stripHtmlTags = (value) =>
  (value ? String(value).replace(/<[^>]*>?/gm, '').trim() : '');

export const stripHtmlMax = (value, maxLen) => stripHtmlTags(value).slice(0, maxLen);

function parseRawJsonString(rawText, fieldLabel) {
  const trimmed = rawText.trim();
  if (!trimmed || trimmed === '[]') return [];
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    throw new SettingValidationError(`Format data ${fieldLabel} tidak valid: ${err.message}`, { cause: err });
  }
}

export function parseJsonArrayInput(rawInput, fieldLabel) {
  if (rawInput === undefined || rawInput === null) return [];
  const list = typeof rawInput === 'string' ? parseRawJsonString(rawInput, fieldLabel) : rawInput;
  if (!Array.isArray(list)) {
    throw new SettingValidationError(`Data ${fieldLabel} harus berupa array.`);
  }
  return list;
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
      throw new SettingValidationError(`Deskripsi footer bahasa ${langLabel} maksimal ${FOOTER_DESC_MAX_LEN} karakter.`);
    }
    result[key] = trimmed;
  }
  return result;
}

function assertMenuFieldBounds(value, fieldName, rowNum, maxLen) {
  if (!value) throw new SettingValidationError(`${fieldName} pada menu footer baris ke-${rowNum} wajib diisi.`);
  if (value.length > maxLen) {
    throw new SettingValidationError(`${fieldName} pada menu footer baris ke-${rowNum} maksimal ${maxLen} karakter.`);
  }
  return value;
}

function sanitizeFooterNavItem(item, index) {
  const rowNum = index + 1;
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new SettingValidationError(`Data tautan menu footer baris ke-${rowNum} tidak valid.`);
  }
  const label_id = assertMenuFieldBounds(stripHtmlTags(item.label_id), 'Label (ID)', rowNum, FOOTER_LABEL_MAX_LEN);
  const label_en = assertMenuFieldBounds(stripHtmlTags(item.label_en), 'Label (EN)', rowNum, FOOTER_LABEL_MAX_LEN);
  const url = assertMenuFieldBounds(String(item.url || '').trim(), 'URL tujuan', rowNum, FOOTER_URL_MAX_LEN);
  if (!isAllowedFooterUrl(url)) {
    throw new SettingValidationError(`URL tujuan pada menu footer baris ke-${rowNum} tidak valid. Hanya https://, http://, path /, atau # yang diizinkan.`);
  }
  return { label_id, label_en, url };
}

export function parseAndValidateFooterNavLinks(rawInput) {
  const list = parseJsonArrayInput(rawInput, 'tautan menu footer');
  if (list.length === 0) return '[]';
  if (list.length > FOOTER_NAV_MAX_ITEMS) {
    throw new SettingValidationError(`Maksimal ${FOOTER_NAV_MAX_ITEMS} tautan menu footer diperbolehkan.`);
  }
  return JSON.stringify(list.map(sanitizeFooterNavItem));
}

export function applyFooterUpdates(updates, body) {
  Object.assign(updates, validateFooterDescriptions(body));
  if (body && body.footer_nav_links_json !== undefined) {
    updates.footer_nav_links_json = parseAndValidateFooterNavLinks(body.footer_nav_links_json);
  }
}
