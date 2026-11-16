import { isValidTicketIconKey } from '../utils/ticketIcons.js';

const TRIMMED_ABOUT_FIELDS = [
  'founded_year',
  'former_names',
  'history_title_id',
  'history_title_en',
  'history_id',
  'history_en',
  'vision_id',
  'vision_en',
  'mission_id',
  'mission_en',
  'motto_id',
  'motto_en',
  'slogan_id',
  'slogan_en',
  'goal_id',
  'goal_en',
  'eco_statement_id',
  'eco_statement_en'
];

const OPTIONAL_ABOUT_FIELDS = [
  'vision_image_url',
  'mission_image_url',
  'about_gallery_kicker_id',
  'about_gallery_kicker_en',
  'about_gallery_title_id',
  'about_gallery_title_en',
  'about_gallery_body_id',
  'about_gallery_body_en',
  'about_story_kicker_id',
  'about_story_kicker_en'
];

const TICKET_LETTERS = ['T', 'I', 'C', 'K', 'E', 'T'];

const readRawField = (body, primaryKey, aliasKey) =>
  (body[primaryKey] !== undefined ? body[primaryKey] : body[aliasKey]);

const optTrim = (val) => (val !== undefined ? String(val).trim() : undefined);
const trimOrNull = (val) => (val ? String(val).trim() : undefined);
const parseActiveFlag = (val) => (val === '1' || val === 1 || val === true ? 1 : 0);

export function sanitizeSafePath(val, fallback = '') {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  const valid = /^(\/uploads\/|\/images\/)[a-zA-Z0-9_.\-/]+$/.test(trimmed) && trimmed.length <= 500;
  return valid ? trimmed : fallback;
}

function sanitizeOptionalBgImage(rawBg) {
  if (rawBg === undefined) return undefined;
  const trimmed = String(rawBg || '').trim();
  return trimmed === '' ? '' : sanitizeSafePath(trimmed, '');
}

function getIndexedField(body, formKey, idx, prefix, defVal = '') {
  const val = body[`${prefix}_${formKey}`] ?? body[`${prefix}_${idx}`];
  return val !== undefined && val !== null && String(val).trim() !== ''
    ? String(val).trim()
    : defVal;
}

function trimSliceOptional(val, maxLen, emptyFallback = '') {
  if (val === undefined) return undefined;
  return String(val || emptyFallback).trim().slice(0, maxLen);
}

function parseSingleTicketValue(body, defLetter, idx, defaultValues) {
  const formKey = idx === 5 ? 'T_2' : defLetter;
  const def = defaultValues[idx] || defaultValues[0];
  const letter = getIndexedField(body, formKey, idx, 'val_letter', defLetter).charAt(0).toUpperCase();
  const rawIcon = getIndexedField(body, formKey, idx, 'val_icon_key', def.icon_key);
  const rawImg = getIndexedField(body, formKey, idx, 'val_image_url', def.image_url);

  return {
    letter: letter || defLetter,
    title_id: getIndexedField(body, formKey, idx, 'val_title_id', def.title_id).slice(0, 50),
    title_en: getIndexedField(body, formKey, idx, 'val_title_en', def.title_en).slice(0, 50),
    desc_id: getIndexedField(body, formKey, idx, 'val_desc_id', def.desc_id).slice(0, 250),
    desc_en: getIndexedField(body, formKey, idx, 'val_desc_en', def.desc_en).slice(0, 250),
    image_url: sanitizeSafePath(rawImg, def.image_url),
    icon_key: isValidTicketIconKey(rawIcon) ? rawIcon : def.icon_key,
    sort_order: idx + 1
  };
}

export function parseTicketValues(body, defaultValues) {
  const hasAnyValKey = Object.keys(body || {}).some((k) => k.startsWith('val_'));
  if (!hasAnyValKey) return undefined;
  return TICKET_LETTERS.map((defLetter, idx) => parseSingleTicketValue(body, defLetter, idx, defaultValues));
}

export function parseTicketHeader(body = {}) {
  const rawBg = readRawField(body, 'about_values_bg_image', 'values_bg_image');
  return {
    about_values_bg_image: sanitizeOptionalBgImage(rawBg),
    about_values_pill_id: trimSliceOptional(readRawField(body, 'about_values_pill_id', 'values_pill_id'), 50, 'Budaya Kerja'),
    about_values_pill_en: trimSliceOptional(readRawField(body, 'about_values_pill_en', 'values_pill_en'), 50, 'Corporate Culture'),
    about_values_subtitle_id: trimSliceOptional(readRawField(body, 'about_values_subtitle_id', 'values_subtitle_id'), 150),
    about_values_subtitle_en: trimSliceOptional(readRawField(body, 'about_values_subtitle_en', 'values_subtitle_en'), 150)
  };
}

export function parseTimelineHeader(body = {}) {
  return {
    about_timeline_tagline_id: trimSliceOptional(body.about_timeline_tagline_id, 50),
    about_timeline_tagline_en: trimSliceOptional(body.about_timeline_tagline_en, 50),
    about_timeline_title_id: trimSliceOptional(body.about_timeline_title_id, 120),
    about_timeline_title_en: trimSliceOptional(body.about_timeline_title_en, 120),
    about_timeline_desc_id: trimSliceOptional(body.about_timeline_desc_id, 300),
    about_timeline_desc_en: trimSliceOptional(body.about_timeline_desc_en, 300)
  };
}

export function buildAboutUpdatePayload(body = {}, defaultValues = [], defaultCerts = []) {
  const payload = {};
  for (const key of TRIMMED_ABOUT_FIELDS) payload[key] = trimOrNull(body[key]);
  for (const key of OPTIONAL_ABOUT_FIELDS) payload[key] = optTrim(body[key]);

  return {
    ...payload,
    ...parseTimelineHeader(body),
    ...parseTicketHeader(body),
    values: parseTicketValues(body, defaultValues),
    certifications: defaultCerts.map((cert, idx) => ({
      name: body[`cert_name_${idx}`] || cert.name,
      issuer: body[`cert_issuer_${idx}`] || cert.issuer,
      badge: body[`cert_badge_${idx}`] || cert.badge,
      desc_id: body[`cert_desc_id_${idx}`] || cert.desc_id,
      desc_en: body[`cert_desc_en_${idx}`] || cert.desc_en
    }))
  };
}

const trimOrEmpty = (val) => trimOrNull(val) || '';
const parseSortOrder = (val, fallback = '0') => parseInt(val || fallback, 10);
const resolveCreateActive = (val) => (val === undefined ? 1 : parseActiveFlag(val));

export function parseGallerySlideCreate(body = {}) {
  const imageUrl = trimOrNull(body.image_url);
  if (!imageUrl) return { error: 'Gambar slide galeri wajib diisi.' };
  return {
    data: {
      image_url: imageUrl,
      category_id: trimOrEmpty(body.category_id),
      category_en: trimOrEmpty(body.category_en),
      title_id: trimOrEmpty(body.title_id),
      title_en: trimOrEmpty(body.title_en),
      subtitle_id: trimOrEmpty(body.subtitle_id),
      subtitle_en: trimOrEmpty(body.subtitle_en),
      sort_order: parseSortOrder(body.sort_order),
      is_active: resolveCreateActive(body.is_active)
    }
  };
}

export function parseGallerySlideUpdate(body = {}) {
  if (body.image_url !== undefined && !String(body.image_url).trim()) {
    return { error: 'Gambar slide galeri wajib diisi.' };
  }
  return {
    data: {
      image_url: optTrim(body.image_url),
      category_id: optTrim(body.category_id),
      category_en: optTrim(body.category_en),
      title_id: optTrim(body.title_id),
      title_en: optTrim(body.title_en),
      subtitle_id: optTrim(body.subtitle_id),
      subtitle_en: optTrim(body.subtitle_en),
      sort_order: body.sort_order !== undefined ? parseInt(body.sort_order, 10) : undefined,
      is_active: body.is_active !== undefined ? parseActiveFlag(body.is_active) : undefined
    }
  };
}

export function parseStatCreate(body = {}, existingCount = 0) {
  const statVal = trimOrNull(body.stat_value);
  const labelId = trimOrNull(body.label_id);
  if (!statVal || !labelId) return { error: 'Nilai statistik dan label wajib diisi.' };
  if (existingCount >= 8) return { error: 'Batas maksimal 8 item statistik telah tercapai.' };
  return {
    data: {
      stat_value: statVal,
      label_id: labelId,
      label_en: trimOrEmpty(body.label_en),
      sort_order: parseSortOrder(body.sort_order),
      is_active: resolveCreateActive(body.is_active)
    }
  };
}

export function parseStatUpdate(body = {}) {
  return {
    stat_value: optTrim(body.stat_value),
    label_id: optTrim(body.label_id),
    label_en: optTrim(body.label_en),
    sort_order: body.sort_order !== undefined ? parseInt(body.sort_order, 10) : undefined,
    is_active: body.is_active !== undefined ? parseActiveFlag(body.is_active) : undefined
  };
}

export function parseTimelineCreate(body = {}) {
  const yearLabelId = trimOrNull(body.year_label_id);
  const titleId = trimOrNull(body.title_id);
  if (!yearLabelId || !titleId) return { error: 'Label tahun dan judul item timeline wajib diisi.' };
  return {
    data: {
      year_label_id: yearLabelId,
      year_label_en: trimOrEmpty(body.year_label_en),
      title_id: titleId,
      title_en: trimOrEmpty(body.title_en),
      description_id: trimOrEmpty(body.description_id),
      description_en: trimOrEmpty(body.description_en),
      sort_order: parseSortOrder(body.sort_order),
      is_active: resolveCreateActive(body.is_active)
    }
  };
}

export function parseTimelineUpdate(body = {}) {
  return {
    year_label_id: optTrim(body.year_label_id),
    year_label_en: optTrim(body.year_label_en),
    title_id: optTrim(body.title_id),
    title_en: optTrim(body.title_en),
    description_id: optTrim(body.description_id),
    description_en: optTrim(body.description_en),
    sort_order: body.sort_order !== undefined ? parseInt(body.sort_order, 10) : undefined,
    is_active: body.is_active !== undefined ? parseActiveFlag(body.is_active) : undefined
  };
}
