import brandModel from '../models/brandModel.js';
import settingModel from '../models/settingModel.js';
import { clearSettingsCache } from '../middleware/settingsMiddleware.js';
import { processAndSaveWebP } from '../middleware/uploadMiddleware.js';
import { sanitizeSafePath } from '../utils/sanitizer.js';
import {
  parseSortOrder,
  parseActiveFlag,
  deleteOrphanUploadFile
} from './bannerService.js';

export const MAX_SECTION_TITLE_LENGTH = 150;

const asString = (val) => (typeof val === 'string' ? val : '');
const trimOrNull = (val) => {
  const trimmed = asString(val).trim();
  return trimmed || null;
};

function pickNonEmptyTrimmed(incoming, existing) {
  const trimmed = trimOrNull(incoming);
  return trimmed || existing;
}

function pickDefinedTrimmed(incoming, existing) {
  if (incoming === undefined) return existing;
  return asString(incoming).trim();
}

export function sanitizeBrandLogoUrl(rawUrl) {
  if (rawUrl === undefined) return { value: undefined };
  const trimmed = asString(rawUrl).trim();
  if (!trimmed) return { value: null };
  const safe = sanitizeSafePath(trimmed, '');
  if (!safe) {
    return { error: 'Path logo merek tidak valid.' };
  }
  return { value: safe };
}

export function validateSectionTitleInput(rawBody) {
  const body = rawBody || {};
  const titleId = asString(body.home_brand_title_id).trim();
  const titleEn = asString(body.home_brand_title_en).trim();
  if (titleId.length > MAX_SECTION_TITLE_LENGTH || titleEn.length > MAX_SECTION_TITLE_LENGTH) {
    return { error: 'Judul section tidak boleh melebihi 150 karakter.' };
  }
  return { titleId, titleEn };
}

export async function listBrands(deps = {}) {
  const model = deps.brandModel || brandModel;
  return await model.findAll();
}

export async function getBrandById(id, deps = {}) {
  const model = deps.brandModel || brandModel;
  return await model.findById(id);
}

export async function updateBrandSectionTitle(rawBody, deps = {}) {
  const settings = deps.settingModel || settingModel;
  const clearCache = deps.clearSettingsCache || clearSettingsCache;
  const parsed = validateSectionTitleInput(rawBody);
  if (parsed.error) {
    return { status: 'validation_error', error: parsed.error };
  }

  await settings.updateMany({
    home_brand_title_id: parsed.titleId,
    home_brand_title_en: parsed.titleEn
  });
  clearCache();
  return { status: 'ok', message: 'Judul section merek beranda berhasil diperbarui.' };
}

async function resolveBrandLogoForCreate(body, file, deps = {}) {
  const saveWebP = deps.processAndSaveWebP || processAndSaveWebP;
  if (file) {
    const logoUrl = await saveWebP(file.buffer, 'brands');
    return { logoUrl };
  }
  const check = sanitizeBrandLogoUrl(body.logo_url);
  if (check.error) return { error: check.error };
  return { logoUrl: check.value ?? null };
}

async function resolveBrandLogoForUpdate(brand, body, file, deps = {}) {
  const saveWebP = deps.processAndSaveWebP || processAndSaveWebP;
  if (file) {
    const logoUrl = await saveWebP(file.buffer, 'brands');
    return { logoUrl, replacedOldUrl: brand.logo_url };
  }
  if (body.logo_url !== undefined) {
    const check = sanitizeBrandLogoUrl(body.logo_url);
    if (check.error) return { error: check.error };
    const replacedOldUrl = check.value !== brand.logo_url ? brand.logo_url : null;
    return { logoUrl: check.value, replacedOldUrl };
  }
  return { logoUrl: brand.logo_url, replacedOldUrl: null };
}

function buildBrandUpdateRecord(brand, body, logoUrl) {
  return {
    name: pickNonEmptyTrimmed(body.name, brand.name),
    logo_url: logoUrl,
    description_id: pickDefinedTrimmed(body.description_id, brand.description_id),
    description_en: pickDefinedTrimmed(body.description_en, brand.description_en),
    sort_order: parseSortOrder(body.sort_order, brand.sort_order ?? 0),
    is_active: parseActiveFlag(body.is_active)
  };
}

export async function createBrand(rawBody, file, deps = {}) {
  const model = deps.brandModel || brandModel;
  const body = rawBody || {};
  const name = trimOrNull(body.name);
  if (!name) {
    return { status: 'validation_error', error: 'Nama merek wajib diisi.' };
  }

  const logoRes = await resolveBrandLogoForCreate(body, file, deps);
  if (logoRes.error) {
    return { status: 'validation_error', error: logoRes.error };
  }

  const id = await model.create({
    name,
    logo_url: logoRes.logoUrl,
    description_id: trimOrNull(body.description_id),
    description_en: trimOrNull(body.description_en),
    sort_order: parseSortOrder(body.sort_order, 0),
    is_active: parseActiveFlag(body.is_active)
  });
  return { status: 'ok', id };
}

export async function updateBrand(id, rawBody, file, deps = {}) {
  const model = deps.brandModel || brandModel;
  const body = rawBody || {};
  const brand = await model.findById(id);
  if (!brand) {
    return { status: 'not_found', error: 'Merek tidak ditemukan.' };
  }

  const logoRes = await resolveBrandLogoForUpdate(brand, body, file, deps);
  if (logoRes.error) {
    return { status: 'validation_error', error: logoRes.error };
  }

  await model.update(id, buildBrandUpdateRecord(brand, body, logoRes.logoUrl));
  if (logoRes.replacedOldUrl && logoRes.replacedOldUrl !== logoRes.logoUrl) {
    await deleteOrphanUploadFile(logoRes.replacedOldUrl, deps);
  }
  return { status: 'ok', brand };
}

export async function deleteBrand(id, deps = {}) {
  const model = deps.brandModel || brandModel;
  const brand = await model.findById(id);
  if (!brand) {
    return { status: 'not_found', error: 'Merek tidak ditemukan.' };
  }

  const oldLogoUrl = brand.logo_url;
  await model.delete(id);
  await deleteOrphanUploadFile(oldLogoUrl, deps);
  return { status: 'ok' };
}

export async function toggleBrandStatus(id, deps = {}) {
  const model = deps.brandModel || brandModel;
  const result = await model.toggleActive(id);
  if (result === null) {
    return { status: 'not_found', error: 'Merek tidak ditemukan.' };
  }
  return { status: 'ok', isActive: result };
}

export default {
  MAX_SECTION_TITLE_LENGTH,
  parseSortOrder,
  parseActiveFlag,
  sanitizeBrandLogoUrl,
  validateSectionTitleInput,
  listBrands,
  getBrandById,
  updateBrandSectionTitle,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus
};
