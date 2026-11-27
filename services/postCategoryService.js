import postCategoryModel from '../models/postCategoryModel.js';
import { slugify } from '../utils/slugHelper.js';
import { invalidateSitemapCache } from '../utils/sitemapGenerator.js';
import { parseBulkIds } from '../utils/bulkIdsHelper.js';

export const POST_CATEGORY_TYPES = ['berita', 'blog'];

const trimOrNull = (val) => (val ? String(val).trim() : null);
const DEFAULT_DEPS = {
  postCategoryModel,
  invalidateSitemapCache
};
const useDeps = (deps) => (deps ? { ...DEFAULT_DEPS, ...deps } : DEFAULT_DEPS);
const useModel = (deps) => useDeps(deps).postCategoryModel;

function parseSortOrder(val, fallback = 0) {
  if (val == null) return fallback;
  const parsed = parseInt(String(val).trim(), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function normalizePostCategoryFilterType(rawType) {
  const trimmed = trimOrNull(rawType);
  return trimmed && POST_CATEGORY_TYPES.includes(trimmed) ? trimmed : null;
}

export function resolveCategoryType(rawType, fallback) {
  const trimmed = trimOrNull(rawType);
  if (!trimmed) return { value: fallback };
  if (!POST_CATEGORY_TYPES.includes(trimmed)) return { error: 'Tipe kategori tidak valid.' };
  return { value: trimmed };
}

export async function listPostCategories(rawQuery, deps = {}) {
  const type = normalizePostCategoryFilterType(rawQuery?.type);
  const categories = await useModel(deps).findAll({ type });
  return { categories, currentType: type };
}

export async function createPostCategory(rawBody, deps = {}) {
  const body = rawBody || {};
  const nameId = trimOrNull(body.name_id);
  if (!nameId) return { status: 'validation_error', error: 'Nama kategori wajib diisi.' };

  const typeCheck = resolveCategoryType(body.type, 'berita');
  if (typeCheck.error) return { status: 'validation_error', error: typeCheck.error };

  const id = await useModel(deps).create({
    name_id: nameId,
    name_en: trimOrNull(body.name_en) || nameId,
    slug: slugify(nameId),
    type: typeCheck.value,
    sort_order: parseSortOrder(body.sort_order, 0)
  });

  return { status: 'ok', id, message: 'Kategori berita berhasil ditambahkan.' };
}

export async function getPostCategoryById(id, deps = {}) {
  const category = await useModel(deps).findById(id);
  if (!category) return { status: 'not_found', error: 'Kategori tidak ditemukan.' };
  return { status: 'ok', category };
}

function buildCategoryUpdateData(body, category, validType) {
  const nextNameId = trimOrNull(body.name_id);
  const nextNameEn = trimOrNull(body.name_en);
  return {
    name_id: nextNameId || category.name_id,
    name_en: nextNameEn || category.name_en,
    slug: nextNameId ? slugify(nextNameId) : category.slug,
    type: validType,
    sort_order: body.sort_order !== undefined
      ? parseSortOrder(body.sort_order, category.sort_order)
      : category.sort_order
  };
}

export async function updatePostCategory(id, rawBody, deps = {}) {
  const model = useModel(deps);
  const category = await model.findById(id);
  if (!category) return { status: 'not_found', error: 'Kategori tidak ditemukan.' };

  const body = rawBody || {};
  const typeCheck = resolveCategoryType(body.type, category.type);
  if (typeCheck.error) return { status: 'validation_error', error: typeCheck.error };

  await model.update(id, buildCategoryUpdateData(body, category, typeCheck.value));
  return { status: 'ok', message: 'Kategori berita berhasil diperbarui.' };
}

export async function deletePostCategory(id, deps = {}) {
  const model = useModel(deps);
  const category = await model.findById(id);
  if (!category) return { status: 'not_found', error: 'Kategori tidak ditemukan.' };

  await model.delete(id);
  return { status: 'ok', message: 'Kategori berita berhasil dihapus.' };
}

export async function bulkDeletePostCategories(rawBody, deps = {}) {
  const d = useDeps(deps);
  const parsed = parseBulkIds(rawBody);
  if (parsed.status !== 'ok') {
    return { status: 'validation_error', error: parsed.error, message: parsed.error };
  }

  const ids = parsed.ids;
  const existing = await d.postCategoryModel.findByIdsWithPostCount(ids);
  if (!Array.isArray(existing) || existing.length === 0) {
    const msg = 'Kategori berita yang dipilih tidak ditemukan.';
    return { status: 'not_found', error: msg, message: msg };
  }

  const foundSet = new Set(existing.map((item) => item.id));
  const targetIds = existing.map((item) => item.id);
  const skippedIds = ids.filter((id) => !foundSet.has(id));
  const affectedItemsCount = existing.reduce((sum, item) => sum + (Number(item.post_count) || 0), 0);
  const deletedCount = await d.postCategoryModel.deleteMany(targetIds);

  d.invalidateSitemapCache();

  return {
    status: 'ok',
    deletedCount,
    requestedCount: ids.length,
    skippedIds,
    affectedItemsCount,
    message: `${deletedCount} kategori berita berhasil dihapus.`
  };
}

export default {
  POST_CATEGORY_TYPES,
  normalizePostCategoryFilterType,
  resolveCategoryType,
  listPostCategories,
  createPostCategory,
  getPostCategoryById,
  updatePostCategory,
  deletePostCategory,
  bulkDeletePostCategories
};
