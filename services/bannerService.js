import bannerModel from '../models/bannerModel.js';
import mediaModel from '../models/mediaModel.js';
import { processAndSaveWebP, saveVideoFile } from '../middleware/uploadMiddleware.js';
import storage from '../config/storage.js';
import { extractYouTubeId } from '../utils/youtube.js';
import { sanitizeSafePath } from '../utils/sanitizer.js';

const MAX_CTA_URL_LENGTH = 500;
const MAX_CTA_TEXT_LENGTH = 100;
const DANGEROUS_URL_RE = /^(javascript:|data:|vbscript:|\/\/)/i;
const INTERNAL_PATH_RE = /^\/(?!\/)[a-zA-Z0-9\-_./?#=&%~]*$/;
const FRAGMENT_RE = /^#[a-zA-Z0-9\-_]+$/;
const MAILTO_TEL_RE = /^(mailto:[^\s]+|tel:[0-9+()\-.\s]+)$/i;

const trimOrNull = (val) => (typeof val === 'string' && val.trim() ? val.trim() : null);

function pickNonEmptyTrimmed(incoming, existing) {
  const trimmed = trimOrNull(incoming);
  return trimmed || existing;
}

function pickDefinedTrimmed(incoming, existing) {
  if (incoming === undefined) return existing;
  return typeof incoming === 'string' ? incoming.trim() : '';
}

export function parseSortOrder(val, fallback = 0) {
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function parseActiveFlag(val) {
  return val === 'on' || val === '1' || val === 1 || val === true;
}

function hasControlChars(value) {
  return [...value].some((ch) => ch.charCodeAt(0) <= 31 || ch.charCodeAt(0) === 127);
}

function isHttpOrHttpsUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAllowedCtaTarget(trimmed) {
  if (INTERNAL_PATH_RE.test(trimmed) || FRAGMENT_RE.test(trimmed)) return true;
  if (MAILTO_TEL_RE.test(trimmed)) return true;
  return isHttpOrHttpsUrl(trimmed);
}

export function isValidCtaUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.length > MAX_CTA_URL_LENGTH || hasControlChars(trimmed)) return false;
  if (DANGEROUS_URL_RE.test(trimmed)) return false;
  return isAllowedCtaTarget(trimmed);
}

export function isValidCtaText(text) {
  if (!text || typeof text !== 'string') return true;
  return text.trim().length <= MAX_CTA_TEXT_LENGTH;
}

export function sanitizeOptionalLocalPath(rawUrl, fallback = null) {
  const trimmed = trimOrNull(rawUrl);
  if (!trimmed) return fallback;
  const safe = sanitizeSafePath(trimmed, '');
  return safe || fallback;
}

export function isLocalUploadPath(fileUrl) {
  return typeof fileUrl === 'string' && fileUrl.startsWith('/uploads/') && !fileUrl.includes('..');
}

export async function deleteOrphanUploadFile(fileUrl, deps = {}) {
  if (!isLocalUploadPath(fileUrl)) return false;
  const media = deps.mediaModel || mediaModel;
  const store = deps.storage || storage;

  if (await media.isRegisteredByUrl(fileUrl)) return false;
  const usages = await media.checkUsage(fileUrl);
  if (usages.length > 0) return false;

  await store.delete(fileUrl);
  return true;
}

export function validateBannerCtaFields(rawBody) {
  const body = rawBody || {};
  if (!isValidCtaUrl(body.cta_url)) {
    return 'Format URL Tombol Utama tidak valid. Gunakan path internal (diawali / atau #), URL eksternal (http/https), mailto:, atau tel:.';
  }
  if (!isValidCtaUrl(body.cta_secondary_url)) {
    return 'Format URL Tombol Kedua tidak valid. Gunakan path internal (diawali / atau #), URL eksternal (http/https), mailto:, atau tel:.';
  }
  const texts = [body.cta_text_id, body.cta_text_en, body.cta_secondary_text_id, body.cta_secondary_text_en];
  if (!texts.every(isValidCtaText)) {
    return 'Teks tombol CTA tidak boleh melebihi 100 karakter.';
  }
  return null;
}

async function resolveUploadedBannerMedia(file, deps = {}) {
  const saveVideo = deps.saveVideoFile || saveVideoFile;
  const saveWebP = deps.processAndSaveWebP || processAndSaveWebP;
  const mediaSource = file.path || file.buffer;

  if (String(file.mimetype || '').startsWith('video/')) {
    const fileUrl = await saveVideo(mediaSource, file.originalname, 'banners', file.mimetype);
    return { mediaType: 'video', fileUrl };
  }
  const fileUrl = await saveWebP(mediaSource, 'banners', { maxWidth: 1920, maxHeight: 1080, quality: 80 });
  return { mediaType: 'image', fileUrl };
}

function hasAnyMediaInput(body, file) {
  return Boolean(file || trimOrNull(body.file_url) || trimOrNull(body.youtube_url));
}

function resolveYoutubeMedia(rawInput, replacedOldUrl = null) {
  const ytId = extractYouTubeId(rawInput);
  if (!ytId) {
    return { error: 'Tautan YouTube tidak valid. Harap masukkan format link video YouTube resmi.' };
  }
  return { mediaType: 'youtube', fileUrl: ytId, replacedOldUrl };
}

const normalizeMediaType = (type) => (type === 'video' ? 'video' : 'image');
const getBannerCurrentUrl = (banner) => banner.file_url || banner.image_url;
const resolveRequestedUpdateType = (banner, body) => body.media_type || banner.media_type || 'image';

async function resolveBannerMediaForCreate(body, file, deps = {}) {
  if (body.media_type === 'youtube') {
    return resolveYoutubeMedia(body.youtube_url || body.file_url);
  }
  if (file) {
    return await resolveUploadedBannerMedia(file, deps);
  }
  const safeUrl = sanitizeOptionalLocalPath(body.file_url, null);
  if (!safeUrl) {
    return { error: 'Path berkas media banner tidak valid.' };
  }
  return { mediaType: normalizeMediaType(body.media_type), fileUrl: safeUrl };
}

function resolveYoutubeCandidateForUpdate(banner, body) {
  if (body.youtube_url !== undefined || body.file_url !== undefined) {
    return trimOrNull(body.youtube_url) || trimOrNull(body.file_url) || '';
  }
  return banner.media_type === 'youtube' ? banner.file_url : '';
}

async function resolveBannerMediaForUpdate(banner, body, file, deps = {}) {
  const requestedType = resolveRequestedUpdateType(banner, body);
  const currentUrl = getBannerCurrentUrl(banner);

  if (requestedType === 'youtube') {
    return resolveYoutubeMedia(resolveYoutubeCandidateForUpdate(banner, body), currentUrl);
  }
  if (file) {
    const uploaded = await resolveUploadedBannerMedia(file, deps);
    return { ...uploaded, replacedOldUrl: currentUrl };
  }
  const incomingFileUrl = trimOrNull(body.file_url);
  if (!incomingFileUrl) {
    return { mediaType: requestedType, fileUrl: currentUrl, replacedOldUrl: null };
  }
  const safeUrl = sanitizeOptionalLocalPath(incomingFileUrl, null);
  if (!safeUrl) return { error: 'Path berkas media banner tidak valid.' };
  return { mediaType: requestedType, fileUrl: safeUrl, replacedOldUrl: currentUrl };
}

function resolvePosterForCreate(body) {
  return sanitizeOptionalLocalPath(body.poster_url, null);
}

function resolvePosterForUpdate(banner, body) {
  if (body.poster_url === undefined) return banner.poster_url;
  const trimmed = trimOrNull(body.poster_url);
  if (!trimmed) return null;
  return sanitizeOptionalLocalPath(trimmed, banner.poster_url);
}

function buildBannerCreateRecord(body, media) {
  const titleId = trimOrNull(body.title_id);
  return {
    title_id: titleId,
    title_en: trimOrNull(body.title_en) || titleId,
    caption_id: trimOrNull(body.caption_id),
    caption_en: trimOrNull(body.caption_en),
    media_type: media.mediaType,
    file_url: media.fileUrl,
    poster_url: resolvePosterForCreate(body),
    cta_text_id: trimOrNull(body.cta_text_id),
    cta_text_en: trimOrNull(body.cta_text_en),
    cta_url: trimOrNull(body.cta_url),
    cta_secondary_text_id: trimOrNull(body.cta_secondary_text_id),
    cta_secondary_text_en: trimOrNull(body.cta_secondary_text_en),
    cta_secondary_url: trimOrNull(body.cta_secondary_url),
    sort_order: parseSortOrder(body.sort_order, 0),
    is_active: parseActiveFlag(body.is_active)
  };
}

function buildBannerUpdateRecord(banner, body, media) {
  return {
    title_id: pickNonEmptyTrimmed(body.title_id, banner.title_id),
    title_en: pickNonEmptyTrimmed(body.title_en, banner.title_en),
    caption_id: pickDefinedTrimmed(body.caption_id, banner.caption_id),
    caption_en: pickDefinedTrimmed(body.caption_en, banner.caption_en),
    media_type: media.mediaType,
    file_url: media.fileUrl,
    poster_url: resolvePosterForUpdate(banner, body),
    cta_text_id: pickDefinedTrimmed(body.cta_text_id, banner.cta_text_id),
    cta_text_en: pickDefinedTrimmed(body.cta_text_en, banner.cta_text_en),
    cta_url: pickDefinedTrimmed(body.cta_url, banner.cta_url),
    cta_secondary_text_id: pickDefinedTrimmed(body.cta_secondary_text_id, banner.cta_secondary_text_id),
    cta_secondary_text_en: pickDefinedTrimmed(body.cta_secondary_text_en, banner.cta_secondary_text_en),
    cta_secondary_url: pickDefinedTrimmed(body.cta_secondary_url, banner.cta_secondary_url),
    sort_order: parseSortOrder(body.sort_order, banner.sort_order || 0),
    is_active: parseActiveFlag(body.is_active)
  };
}

export async function listBanners(deps = {}) {
  const model = deps.bannerModel || bannerModel;
  return await model.findAll(false);
}

export async function getBannerById(id, deps = {}) {
  const model = deps.bannerModel || bannerModel;
  return await model.findById(id);
}

export async function createBanner(rawBody, file, deps = {}) {
  const model = deps.bannerModel || bannerModel;
  const body = rawBody || {};
  if (!trimOrNull(body.title_id) || !hasAnyMediaInput(body, file)) {
    return { status: 'validation_error', error: 'Judul banner dan sumber media wajib diisi.' };
  }

  const ctaError = validateBannerCtaFields(body);
  if (ctaError) {
    return { status: 'validation_error', error: ctaError };
  }

  const media = await resolveBannerMediaForCreate(body, file, deps);
  if (media.error) {
    return { status: 'validation_error', error: media.error };
  }

  const id = await model.create(buildBannerCreateRecord(body, media));
  return { status: 'ok', id };
}

async function cleanupReplacedMedia(media, deps) {
  if (media.replacedOldUrl && media.replacedOldUrl !== media.fileUrl) {
    await deleteOrphanUploadFile(media.replacedOldUrl, deps);
  }
}

export async function updateBanner(id, rawBody, file, deps = {}) {
  const model = deps.bannerModel || bannerModel;
  const body = rawBody || {};
  const banner = await model.findById(id);
  if (!banner) {
    return { status: 'not_found', error: 'Banner tidak ditemukan.' };
  }

  const ctaError = validateBannerCtaFields(body);
  if (ctaError) {
    return { status: 'validation_error', banner, error: ctaError };
  }

  const media = await resolveBannerMediaForUpdate(banner, body, file, deps);
  if (media.error) {
    return { status: 'validation_error', banner, error: media.error };
  }

  await model.update(id, buildBannerUpdateRecord(banner, body, media));
  await cleanupReplacedMedia(media, deps);
  return { status: 'ok', banner };
}

export async function toggleBannerStatus(id, deps = {}) {
  const model = deps.bannerModel || bannerModel;
  const result = await model.toggleActive(id);
  if (!result) {
    return { status: 'not_found', error: 'Banner tidak ditemukan.' };
  }
  if (!result.success) {
    return { status: 'conflict', error: result.message };
  }
  return { status: 'ok', isActive: result.newStatus };
}

export async function deleteBanner(id, deps = {}) {
  const model = deps.bannerModel || bannerModel;
  const banner = await model.findById(id);
  if (!banner) {
    return { status: 'not_found', error: 'Banner tidak ditemukan.' };
  }

  if (banner.is_active === 1 || banner.is_active === true) {
    const activeCount = await model.countActive();
    if (activeCount <= 1) {
      return { status: 'conflict', error: 'Minimal harus ada 1 banner aktif di sistem.' };
    }
  }

  const oldMediaUrl = banner.file_url || banner.image_url;
  await model.delete(id);
  await deleteOrphanUploadFile(oldMediaUrl, deps);
  return { status: 'ok' };
}

export default {
  parseSortOrder,
  parseActiveFlag,
  isValidCtaUrl,
  isValidCtaText,
  sanitizeOptionalLocalPath,
  isLocalUploadPath,
  deleteOrphanUploadFile,
  validateBannerCtaFields,
  listBanners,
  getBannerById,
  createBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner
};
