import aboutModel from '../models/aboutModel.js';
import aboutGalleryModel from '../models/aboutGalleryModel.js';
import aboutStatsModel from '../models/aboutStatsModel.js';
import aboutTimelineModel from '../models/aboutTimelineModel.js';
import { processAndSaveWebP } from '../middleware/uploadMiddleware.js';
import { isValidTicketIconKey, TICKET_ICONS, TICKET_ICON_KEYS } from '../utils/ticketIcons.js';
import { sanitizeSafePath } from '../utils/sanitizer.js';

export { sanitizeSafePath };

export {
  parseGallerySlideCreate,
  parseGallerySlideUpdate,
  parseStatCreate,
  parseStatUpdate,
  parseTimelineCreate,
  parseTimelineUpdate
} from './aboutCrudService.js';

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

function sanitizeOptionalImagePath(rawImg) {
  if (rawImg === undefined) return undefined;
  const trimmed = String(rawImg || '').trim();
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

export function parseTicketHeader(rawBody) {
  const body = rawBody || {};
  const rawBg = readRawField(body, 'about_values_bg_image', 'values_bg_image');
  return {
    about_values_bg_image: sanitizeOptionalImagePath(rawBg),
    about_values_pill_id: trimSliceOptional(readRawField(body, 'about_values_pill_id', 'values_pill_id'), 50, 'Budaya Kerja'),
    about_values_pill_en: trimSliceOptional(readRawField(body, 'about_values_pill_en', 'values_pill_en'), 50, 'Corporate Culture'),
    about_values_subtitle_id: trimSliceOptional(readRawField(body, 'about_values_subtitle_id', 'values_subtitle_id'), 150),
    about_values_subtitle_en: trimSliceOptional(readRawField(body, 'about_values_subtitle_en', 'values_subtitle_en'), 150)
  };
}

export function parseTimelineHeader(rawBody) {
  const body = rawBody || {};
  return {
    about_timeline_tagline_id: trimSliceOptional(body.about_timeline_tagline_id, 50),
    about_timeline_tagline_en: trimSliceOptional(body.about_timeline_tagline_en, 50),
    about_timeline_title_id: trimSliceOptional(body.about_timeline_title_id, 120),
    about_timeline_title_en: trimSliceOptional(body.about_timeline_title_en, 120),
    about_timeline_desc_id: trimSliceOptional(body.about_timeline_desc_id, 300),
    about_timeline_desc_en: trimSliceOptional(body.about_timeline_desc_en, 300)
  };
}

function mapCertifications(body, defaultCerts) {
  return defaultCerts.map((cert, idx) => ({
    name: body[`cert_name_${idx}`] || cert.name,
    issuer: body[`cert_issuer_${idx}`] || cert.issuer,
    badge: body[`cert_badge_${idx}`] || cert.badge,
    desc_id: body[`cert_desc_id_${idx}`] || cert.desc_id,
    desc_en: body[`cert_desc_en_${idx}`] || cert.desc_en
  }));
}

export function buildAboutUpdatePayload(rawBody, defaultValues, defaultCerts) {
  const body = rawBody || {};
  const payload = {};
  for (const key of TRIMMED_ABOUT_FIELDS) payload[key] = trimOrNull(body[key]);
  for (const key of OPTIONAL_ABOUT_FIELDS) payload[key] = optTrim(body[key]);

  return {
    ...payload,
    vision_image_url: sanitizeOptionalImagePath(body.vision_image_url),
    mission_image_url: sanitizeOptionalImagePath(body.mission_image_url),
    ...parseTimelineHeader(body),
    ...parseTicketHeader(body),
    values: parseTicketValues(body, defaultValues || []),
    certifications: mapCertifications(body, defaultCerts || [])
  };
}

export async function getAdminAboutPageData() {
  const [
    about, gallerySlides, stats, timeline,
    galleryHeader, storyHeader, timelineHeader, visionMissionImages
  ] = await Promise.all([
    aboutModel.getAboutData(),
    aboutGalleryModel.findAll(),
    aboutStatsModel.findAll(),
    aboutTimelineModel.findAll(),
    aboutModel.getGalleryHeader(),
    aboutModel.getStoryHeader(),
    aboutModel.getTimelineHeader(),
    aboutModel.getVisionMissionImages()
  ]);

  return {
    about,
    ticketIcons: TICKET_ICONS,
    ticketIconKeys: TICKET_ICON_KEYS,
    gallerySlides,
    stats,
    timeline,
    galleryHeader,
    storyHeader,
    timelineHeader,
    visionMissionImages
  };
}

async function resolveAboutImageUrl(body, file) {
  if (file) {
    return await processAndSaveWebP(file.buffer, 'pages', { maxWidth: 1920, maxHeight: 1080 });
  }
  if (body.image_url !== undefined) {
    return sanitizeOptionalImagePath(body.image_url);
  }
  return undefined;
}

export async function updateAdminAboutContent(rawBody, file) {
  const body = rawBody || {};
  const currentAbout = await aboutModel.getAboutData();
  const defaults = aboutModel.getDefaults();
  const updatePayload = buildAboutUpdatePayload(
    body,
    currentAbout?.values || defaults.values,
    defaults.certifications
  );

  const resolvedImageUrl = await resolveAboutImageUrl(body, file);
  if (resolvedImageUrl !== undefined) {
    updatePayload.image_url = resolvedImageUrl;
  }

  await aboutModel.updateAboutData(updatePayload);
  return updatePayload;
}
