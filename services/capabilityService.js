import capabilityModel from '../models/capabilityModel.js';
import { processAndSaveWebP } from '../middleware/uploadMiddleware.js';

const WEBP_OPTIONS = { maxWidth: 1200, maxHeight: 800, quality: 80 };
const asTrimmed = (val) => (typeof val === 'string' ? val.trim() : '');
const hasControlChars = (val) => [...val].some((ch) => ch.charCodeAt(0) <= 31 || ch.charCodeAt(0) === 127);

const useModel = (deps) => deps?.capabilityModel || capabilityModel;
const useSaveWebP = (deps) => deps?.processAndSaveWebP || processAndSaveWebP;

export function parsePositiveIntId(rawId) {
  const num = Number(rawId);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export function parseSortOrder(val, fallback = 0) {
  if (val === undefined || val === null) return fallback;
  const parsed = parseInt(String(val).trim(), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function isValidHttpUrl(trimmed) {
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function isSafeImageUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || hasControlChars(trimmed) || trimmed.includes('..')) return false;
  if (trimmed.startsWith('/')) return !trimmed.startsWith('//') && !trimmed.startsWith('/\\');
  return isValidHttpUrl(trimmed);
}

function validateRequiredFields(body) {
  const titleId = asTrimmed(body.title_id);
  const machineType = asTrimmed(body.machine_type);
  if (!titleId || !machineType) {
    return { error: 'Judul dan tipe mesin wajib diisi.' };
  }
  return { titleId, machineType };
}

async function resolveImageUrl(body, file, deps) {
  if (file) {
    return { imageUrl: await useSaveWebP(deps)(file.buffer, 'products', WEBP_OPTIONS) };
  }
  if (body.image_url === undefined) return { imageUrl: undefined };

  const trimmed = asTrimmed(body.image_url);
  if (!trimmed) return { imageUrl: null };
  if (!isSafeImageUrl(trimmed)) {
    return { error: 'URL gambar tidak valid. Gunakan path / atau http(s):// yang aman.' };
  }
  return { imageUrl: trimmed };
}

function buildCapabilityPayload(body, reqFields, sortFallback) {
  return {
    title_id: reqFields.titleId,
    title_en: asTrimmed(body.title_en) || reqFields.titleId,
    machine_type: reqFields.machineType,
    capacity: asTrimmed(body.capacity) || null,
    description_id: asTrimmed(body.description_id) || null,
    description_en: asTrimmed(body.description_en) || null,
    sort_order: parseSortOrder(body.sort_order, sortFallback),
    is_active: body.is_active === '0' ? 0 : 1
  };
}

export async function listCapabilities(deps = {}) {
  return useModel(deps).findAll(false);
}

export async function listActiveCapabilities(deps = {}) {
  return useModel(deps).findAll(true);
}

export async function createCapability(rawBody, file, deps = {}) {
  const body = rawBody || {};
  const reqFields = validateRequiredFields(body);
  if (reqFields.error) return { status: 'validation_error', error: reqFields.error };

  const imgResult = await resolveImageUrl(body, file, deps);
  if (imgResult.error) return { status: 'validation_error', error: imgResult.error };

  const payload = buildCapabilityPayload(body, reqFields, 0);
  payload.image_url = imgResult.imageUrl ?? null;

  const id = await useModel(deps).create(payload);
  return { status: 'ok', id, message: 'Kapabilitas mesin berhasil ditambahkan.' };
}

async function prepareCapabilityPayload(body, file, deps, sortFallback) {
  const reqFields = validateRequiredFields(body);
  if (reqFields.error) return { error: reqFields.error };

  const imgResult = await resolveImageUrl(body, file, deps);
  if (imgResult.error) return { error: imgResult.error };

  const payload = buildCapabilityPayload(body, reqFields, sortFallback);
  if (imgResult.imageUrl !== undefined) payload.image_url = imgResult.imageUrl;
  return { payload };
}

export async function updateCapability(rawId, rawBody, file, deps = {}) {
  const id = parsePositiveIntId(rawId);
  if (!id) return { status: 'not_found', error: 'Data kapabilitas tidak ditemukan.' };

  const model = useModel(deps);
  const existing = await model.findById(id);
  if (!existing) return { status: 'not_found', error: 'Data kapabilitas tidak ditemukan.' };

  const prep = await prepareCapabilityPayload(rawBody || {}, file, deps, existing.sort_order ?? 0);
  if (prep.error) return { status: 'validation_error', error: prep.error };

  await model.update(id, prep.payload);
  return { status: 'ok', message: 'Data kapabilitas berhasil diperbarui.' };
}

export async function deleteCapability(rawId, deps = {}) {
  const id = parsePositiveIntId(rawId);
  if (!id) return { status: 'not_found', error: 'Data kapabilitas tidak ditemukan.' };

  const model = useModel(deps);
  const existing = await model.findById(id);
  if (!existing) return { status: 'not_found', error: 'Data kapabilitas tidak ditemukan.' };

  await model.delete(id);
  return { status: 'ok', message: 'Data kapabilitas berhasil dihapus.' };
}

export default {
  parsePositiveIntId,
  parseSortOrder,
  isSafeImageUrl,
  listCapabilities,
  listActiveCapabilities,
  createCapability,
  updateCapability,
  deleteCapability
};
