import postModel from '../models/postModel.js';
import postCategoryModel from '../models/postCategoryModel.js';
import slugRedirectModel from '../models/slugRedirectModel.js';
import { processAndSaveWebP } from '../middleware/uploadMiddleware.js';
import storage from '../config/storage.js';
import { invalidateSitemapCache } from '../utils/sitemapGenerator.js';
import { sanitizeArticleHtml } from '../utils/sanitizer.js';

export const ALLOWED_EDITOR_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEADLINE_VALUES = new Set(['on', '1', true]);
const CREATE_INVALID_SLUG_MSG = 'Format slug URL tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (-) tanpa spasi.';
const UPDATE_INVALID_SLUG_MSG = 'Format slug URL tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (-).';

const DEFAULT_DEPS = {
  postModel,
  postCategoryModel,
  slugRedirectModel,
  processAndSaveWebP,
  storage,
  invalidateSitemapCache,
  sanitizeArticleHtml
};

const useDeps = (deps) => (deps ? { ...DEFAULT_DEPS, ...deps } : DEFAULT_DEPS);
const trimOrNull = (val) => (val ? String(val).trim() : null);
const parseHeadlineFlag = (val) => HEADLINE_VALUES.has(val);

export function formatSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

export function isValidPostSlug(slug) {
  return Boolean(slug && SLUG_REGEX.test(slug));
}

function parseNullableInt(val) {
  if (!val) return null;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseScheduledAt(status, rawScheduledAt) {
  return status === 'scheduled' && rawScheduledAt ? new Date(rawScheduledAt) : null;
}

function buildPostSeoFields(body) {
  return {
    meta_title_id: body.meta_title_id || null,
    meta_title_en: body.meta_title_en || null,
    meta_desc_id: body.meta_desc_id || null,
    meta_desc_en: body.meta_desc_en || null
  };
}

function resolveOptionalHtml(rawVal, fallback, sanitizeFn) {
  if (rawVal === undefined) return fallback;
  return rawVal ? sanitizeFn(rawVal) : null;
}

async function validationFail(categoryModel, error, extra = {}) {
  const categories = await categoryModel.findAll();
  return { status: 'validation_error', error, categories, ...extra };
}

async function validateSlugAvailability(cleanSlug, invalidMsg, takenMsg, excludeId, d) {
  if (!isValidPostSlug(cleanSlug)) return { error: invalidMsg };
  const slugTaken = await d.postModel.isSlugTaken(cleanSlug, excludeId);
  if (slugTaken) return { error: takenMsg(cleanSlug) };
  return { slug: cleanSlug };
}

async function resolveCoverForCreate(body, file, d) {
  if (file) {
    return d.processAndSaveWebP(file.buffer, 'posts', { maxWidth: 1200, maxHeight: 800, quality: 80 });
  }
  return body.image_url ? String(body.image_url).trim() : null;
}

async function resolveCoverForUpdate(body, file, d) {
  if (file) {
    return d.processAndSaveWebP(file.buffer, 'posts', { maxWidth: 1200, maxHeight: 800, quality: 80 });
  }
  if (body.image_url === undefined) return undefined;
  return body.image_url ? String(body.image_url).trim() : null;
}

function buildCreatePostPayload(body, titleId, cleanSlug, imageUrl, sanitizeFn) {
  const postStatus = body.status || 'draft';
  return {
    title_id: titleId,
    title_en: trimOrNull(body.title_en) || titleId,
    slug: cleanSlug,
    type: body.type || 'berita',
    category_id: parseNullableInt(body.category_id),
    content_id: body.content_id ? sanitizeFn(body.content_id) : null,
    content_en: body.content_en ? sanitizeFn(body.content_en) : null,
    image_url: imageUrl,
    status: postStatus,
    scheduled_at: parseScheduledAt(postStatus, body.scheduled_at),
    is_headline: parseHeadlineFlag(body.is_headline),
    ...buildPostSeoFields(body)
  };
}

function buildUpdatePostPayload(body, post, sanitizeFn) {
  const postStatus = body.status || post.status;
  return {
    title_id: trimOrNull(body.title_id) || post.title_id,
    title_en: trimOrNull(body.title_en) || post.title_en,
    type: body.type || post.type,
    category_id: parseNullableInt(body.category_id),
    content_id: resolveOptionalHtml(body.content_id, post.content_id, sanitizeFn),
    content_en: resolveOptionalHtml(body.content_en, post.content_en, sanitizeFn),
    status: postStatus,
    scheduled_at: parseScheduledAt(body.status, body.scheduled_at),
    is_headline: parseHeadlineFlag(body.is_headline),
    ...buildPostSeoFields(body)
  };
}

async function preparePostUpdateData(body, post, cleanSlug, file, d) {
  const updateData = buildUpdatePostPayload(body, post, d.sanitizeArticleHtml);
  if (cleanSlug !== post.slug) updateData.slug = cleanSlug;
  const imageUrl = await resolveCoverForUpdate(body, file, d);
  if (imageUrl !== undefined) updateData.image_url = imageUrl;
  return updateData;
}

async function finalizePostUpdate(post, cleanSlug, file, d) {
  if (cleanSlug !== post.slug) {
    await d.slugRedirectModel.createRedirect('post', post.id, post.slug, cleanSlug);
  }
  if (file && post.display_image) await d.storage.delete(post.display_image);
  d.invalidateSitemapCache();
}

export async function getAdminPostList(rawQuery, deps = {}) {
  const d = useDeps(deps);
  const query = rawQuery || {};
  const type = query.type || null;
  const status = query.status || null;
  const search = query.search || null;

  const [posts, categories] = await Promise.all([
    d.postModel.findAll({ type, status, search }),
    d.postCategoryModel.findAll()
  ]);

  return { posts, categories, currentType: type, currentStatus: status, searchQuery: search };
}

export async function getPostFormCategories(deps = {}) {
  return useDeps(deps).postCategoryModel.findAll();
}

export async function getPostEditData(id, deps = {}) {
  const d = useDeps(deps);
  const [post, categories] = await Promise.all([
    d.postModel.findById(id),
    d.postCategoryModel.findAll()
  ]);
  if (!post) return { status: 'not_found', error: 'Artikel tidak ditemukan.' };
  return { status: 'ok', post, categories };
}

export async function createAdminPost(rawBody, file, deps = {}) {
  const d = useDeps(deps);
  const body = rawBody || {};
  const titleId = trimOrNull(body.title_id);
  if (!titleId) {
    return validationFail(d.postCategoryModel, 'Judul artikel (Bahasa Indonesia) wajib diisi.');
  }

  const candidateSlug = trimOrNull(body.slug) ? formatSlug(body.slug) : formatSlug(titleId);
  const slugCheck = await validateSlugAvailability(
    candidateSlug,
    CREATE_INVALID_SLUG_MSG,
    (s) => `Slug URL "${s}" sudah digunakan oleh artikel lain. Silakan ubah slug artikel.`,
    null,
    d
  );
  if (slugCheck.error) return validationFail(d.postCategoryModel, slugCheck.error);

  const imageUrl = await resolveCoverForCreate(body, file, d);
  const id = await d.postModel.create(
    buildCreatePostPayload(body, titleId, slugCheck.slug, imageUrl, d.sanitizeArticleHtml)
  );
  d.invalidateSitemapCache();
  return { status: 'ok', id, message: 'Artikel berhasil disimpan.' };
}

export async function updateAdminPost(id, rawBody, file, deps = {}) {
  const d = useDeps(deps);
  const body = rawBody || {};
  const post = await d.postModel.findById(id);
  if (!post) return { status: 'not_found', error: 'Artikel tidak ditemukan.' };

  const candidateSlug = trimOrNull(body.slug) ? formatSlug(body.slug) : post.slug;
  const slugCheck = await validateSlugAvailability(
    candidateSlug,
    UPDATE_INVALID_SLUG_MSG,
    (s) => `Slug URL "${s}" sudah digunakan oleh artikel lain. Silakan gunakan slug yang berbeda.`,
    id,
    d
  );
  if (slugCheck.error) return validationFail(d.postCategoryModel, slugCheck.error, { post });

  const updateData = await preparePostUpdateData(body, post, slugCheck.slug, file, d);
  await d.postModel.update(id, updateData);
  await finalizePostUpdate(post, slugCheck.slug, file, d);
  return { status: 'ok', message: 'Artikel berhasil diperbarui.' };
}

export async function deleteAdminPost(id, deps = {}) {
  const d = useDeps(deps);
  const post = await d.postModel.findById(id);
  if (!post) return { status: 'not_found', error: 'Artikel tidak ditemukan.' };

  await Promise.all([
    d.postModel.delete(id),
    d.slugRedirectModel.deleteByEntity('post', id)
  ]);
  if (post.display_image) await d.storage.delete(post.display_image);
  d.invalidateSitemapCache();
  return { status: 'ok', message: 'Artikel berhasil dihapus.' };
}

export async function uploadPostEditorImage(file, deps = {}) {
  if (!file || !file.buffer) {
    return { status: 'validation_error', error: 'Tidak ada berkas gambar yang diunggah.' };
  }
  if (!ALLOWED_EDITOR_MIMES.includes(file.mimetype)) {
    return {
      status: 'validation_error',
      error: 'Format berkas tidak didukung. Harap unggah gambar JPG, PNG, WebP, atau GIF.'
    };
  }

  const d = useDeps(deps);
  const location = await d.processAndSaveWebP(file.buffer, 'posts', {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 82
  });
  return { status: 'ok', location };
}

export default {
  ALLOWED_EDITOR_MIMES,
  formatSlug,
  isValidPostSlug,
  getAdminPostList,
  getPostFormCategories,
  getPostEditData,
  createAdminPost,
  updateAdminPost,
  deleteAdminPost,
  uploadPostEditorImage
};
