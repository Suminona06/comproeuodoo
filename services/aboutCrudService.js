import aboutGalleryModel from '../models/aboutGalleryModel.js';
import aboutStatsModel from '../models/aboutStatsModel.js';
import aboutTimelineModel from '../models/aboutTimelineModel.js';
import { sanitizeSafePath } from '../utils/sanitizer.js';

const trimOrNull = (val) => (val ? String(val).trim() : undefined);
const trimOrEmpty = (val) => trimOrNull(val) || '';
const optTrim = (val) => (val !== undefined ? String(val).trim() : undefined);
const parseActiveFlag = (val) => (val === '1' || val === 1 || val === true ? 1 : 0);
const resolveCreateActive = (val) => (val === undefined ? 1 : parseActiveFlag(val));
const optActiveFlag = (val) => (val !== undefined ? parseActiveFlag(val) : undefined);

function parseSortOrder(val, fallback = 0) {
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function optSortOrder(val) {
  if (val === undefined || val === null) return undefined;
  const trimmed = String(val).trim();
  if (trimmed === '') return undefined;
  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function validateOptionalImagePath(rawVal) {
  if (rawVal === undefined) return { value: undefined };
  const trimmed = String(rawVal).trim();
  if (!trimmed) return { error: 'Gambar slide galeri wajib diisi.' };
  const safe = sanitizeSafePath(trimmed, '');
  if (!safe) return { error: 'URL gambar slide galeri tidak valid.' };
  return { value: safe };
}

export function parseGallerySlideCreate(rawBody) {
  const body = rawBody || {};
  const rawImageUrl = trimOrNull(body.image_url);
  if (!rawImageUrl) return { error: 'Gambar slide galeri wajib diisi.' };
  const imageUrl = sanitizeSafePath(rawImageUrl, '');
  if (!imageUrl) return { error: 'URL gambar slide galeri tidak valid.' };
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

export function parseGallerySlideUpdate(rawBody) {
  const body = rawBody || {};
  const imgCheck = validateOptionalImagePath(body.image_url);
  if (imgCheck.error) return { error: imgCheck.error };
  return {
    data: {
      image_url: imgCheck.value,
      category_id: optTrim(body.category_id),
      category_en: optTrim(body.category_en),
      title_id: optTrim(body.title_id),
      title_en: optTrim(body.title_en),
      subtitle_id: optTrim(body.subtitle_id),
      subtitle_en: optTrim(body.subtitle_en),
      sort_order: optSortOrder(body.sort_order),
      is_active: optActiveFlag(body.is_active)
    }
  };
}

export function parseStatCreate(rawBody, existingCount) {
  const body = rawBody || {};
  const count = existingCount || 0;
  const statVal = trimOrNull(body.stat_value);
  const labelId = trimOrNull(body.label_id);
  if (!statVal || !labelId) return { error: 'Nilai statistik dan label wajib diisi.' };
  if (count >= 8) return { error: 'Batas maksimal 8 item statistik telah tercapai.' };
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

export function parseStatUpdate(rawBody) {
  const body = rawBody || {};
  return {
    stat_value: optTrim(body.stat_value),
    label_id: optTrim(body.label_id),
    label_en: optTrim(body.label_en),
    sort_order: optSortOrder(body.sort_order),
    is_active: optActiveFlag(body.is_active)
  };
}

export function parseTimelineCreate(rawBody) {
  const body = rawBody || {};
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

export function parseTimelineUpdate(rawBody) {
  const body = rawBody || {};
  return {
    year_label_id: optTrim(body.year_label_id),
    year_label_en: optTrim(body.year_label_en),
    title_id: optTrim(body.title_id),
    title_en: optTrim(body.title_en),
    description_id: optTrim(body.description_id),
    description_en: optTrim(body.description_en),
    sort_order: optSortOrder(body.sort_order),
    is_active: optActiveFlag(body.is_active)
  };
}

async function deleteById(model, id, notFoundError) {
  const existing = await model.findById(id);
  if (!existing) return { status: 'not_found', error: notFoundError };
  await model.delete(id);
  return { status: 'ok' };
}

export async function createGallerySlide(body) {
  const parsed = parseGallerySlideCreate(body);
  if (parsed.error) return { status: 'validation_error', error: parsed.error };
  const id = await aboutGalleryModel.create(parsed.data);
  return { status: 'ok', id };
}

export async function updateGallerySlide(id, body) {
  const slide = await aboutGalleryModel.findById(id);
  if (!slide) return { status: 'not_found', error: 'Slide tidak ditemukan.' };
  const parsed = parseGallerySlideUpdate(body);
  if (parsed.error) return { status: 'validation_error', error: parsed.error };
  await aboutGalleryModel.update(id, parsed.data);
  return { status: 'ok' };
}

export const deleteGallerySlide = (id) => deleteById(aboutGalleryModel, id, 'Slide tidak ditemukan.');

export async function createStat(body) {
  const existing = await aboutStatsModel.findAll();
  const parsed = parseStatCreate(body, existing.length);
  if (parsed.error) return { status: 'validation_error', error: parsed.error };
  const id = await aboutStatsModel.create(parsed.data);
  return { status: 'ok', id };
}

export async function updateStat(id, body) {
  const stat = await aboutStatsModel.findById(id);
  if (!stat) return { status: 'not_found', error: 'Statistik tidak ditemukan.' };
  await aboutStatsModel.update(id, parseStatUpdate(body));
  return { status: 'ok' };
}

export const deleteStat = (id) => deleteById(aboutStatsModel, id, 'Statistik tidak ditemukan.');

export async function createTimeline(body) {
  const parsed = parseTimelineCreate(body);
  if (parsed.error) return { status: 'validation_error', error: parsed.error };
  const id = await aboutTimelineModel.create(parsed.data);
  return { status: 'ok', id };
}

export async function updateTimeline(id, body) {
  const item = await aboutTimelineModel.findById(id);
  if (!item) return { status: 'not_found', error: 'Timeline tidak ditemukan.' };
  await aboutTimelineModel.update(id, parseTimelineUpdate(body));
  return { status: 'ok' };
}

export const deleteTimeline = (id) => deleteById(aboutTimelineModel, id, 'Timeline tidak ditemukan.');

export default {
  parseGallerySlideCreate,
  parseGallerySlideUpdate,
  parseStatCreate,
  parseStatUpdate,
  parseTimelineCreate,
  parseTimelineUpdate,
  createGallerySlide,
  updateGallerySlide,
  deleteGallerySlide,
  createStat,
  updateStat,
  deleteStat,
  createTimeline,
  updateTimeline,
  deleteTimeline
};
