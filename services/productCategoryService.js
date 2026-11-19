import productCategoryModel from '../models/productCategoryModel.js';
import { slugify } from '../utils/slugHelper.js';

const ACTIVE_FLAG_VALUES = new Set(['1', 'on', 1, true]);
const parseActiveFlag = (val) => (ACTIVE_FLAG_VALUES.has(val) ? 1 : 0);
const trimOrNull = (val) => (val ? String(val).trim() : null);
const optTrimText = (incoming, fallback) => (incoming !== undefined ? String(incoming || '').trim() : fallback);

function parseSortOrder(val, fallback = 0) {
  if (val == null) return fallback;
  const parsed = parseInt(String(val).trim(), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const useModel = (deps) => deps?.productCategoryModel || productCategoryModel;

export async function listProductCategories(deps = {}) {
  const model = useModel(deps);
  return model.findAll();
}

export async function createProductCategory(rawBody, deps = {}) {
  const body = rawBody || {};
  const nameId = trimOrNull(body.name_id);
  if (!nameId) return { status: 'validation_error', error: 'Nama kategori wajib diisi.' };

  const model = useModel(deps);
  const id = await model.create({
    name_id: nameId,
    name_en: trimOrNull(body.name_en) || nameId,
    slug: slugify(nameId),
    description_id: trimOrNull(body.description_id),
    description_en: trimOrNull(body.description_en),
    sort_order: parseSortOrder(body.sort_order, 0),
    is_active: parseActiveFlag(body.is_active)
  });

  return { status: 'ok', id, message: 'Kategori berhasil ditambahkan.' };
}

export async function getProductCategoryById(id, deps = {}) {
  const model = useModel(deps);
  const category = await model.findById(id);
  if (!category) return { status: 'not_found', error: 'Kategori tidak ditemukan.' };
  return { status: 'ok', category };
}

function buildCategoryUpdatePayload(body, category) {
  const nextNameId = trimOrNull(body.name_id);
  const nextNameEn = trimOrNull(body.name_en);
  return {
    name_id: nextNameId || category.name_id,
    name_en: nextNameEn || category.name_en,
    slug: nextNameId ? slugify(nextNameId) : category.slug,
    description_id: optTrimText(body.description_id, category.description_id),
    description_en: optTrimText(body.description_en, category.description_en),
    sort_order: body.sort_order !== undefined ? parseSortOrder(body.sort_order, category.sort_order) : category.sort_order,
    is_active: parseActiveFlag(body.is_active)
  };
}

export async function updateProductCategory(id, rawBody, deps = {}) {
  const model = useModel(deps);
  const category = await model.findById(id);
  if (!category) return { status: 'not_found', error: 'Kategori tidak ditemukan.' };

  await model.update(id, buildCategoryUpdatePayload(rawBody || {}, category));
  return { status: 'ok', message: 'Kategori berhasil diperbarui.' };
}

export async function toggleProductCategoryStatus(id, deps = {}) {
  const model = useModel(deps);
  const result = await model.toggleActive(id);
  if (!result) return { status: 'not_found', error: 'Kategori tidak ditemukan.' };

  const statusText = result.is_active ? 'diaktifkan' : 'dinonaktifkan';
  return {
    status: 'ok',
    category: result,
    message: `Kategori "${result.name_id}" berhasil ${statusText}.`
  };
}

export async function deleteProductCategory(id, deps = {}) {
  const model = useModel(deps);
  const category = await model.findById(id);
  if (!category) return { status: 'not_found', error: 'Kategori tidak ditemukan.' };

  await model.delete(id);
  return { status: 'ok', message: 'Kategori berhasil dihapus.' };
}

export default {
  listProductCategories,
  createProductCategory,
  getProductCategoryById,
  updateProductCategory,
  toggleProductCategoryStatus,
  deleteProductCategory
};
