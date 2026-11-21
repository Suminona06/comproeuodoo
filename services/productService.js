import { query } from '../config/database.js';
import { parseDynamicSizeTable } from './productSizeTableService.js';
import {
  isVariantGroupObject,
  normalizeVariantGroups,
  validateRawVariantGroups
} from './productVariantService.js';

const ALLOWED_STATUSES = new Set(['published', 'draft', 'archived']);
const ALLOWED_PER_PAGE = new Set([10, 25, 50, 100]);

export function createSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

const trimOpt = (val) => (val ? String(val).trim() : null);
const trimEmpty = (val) => (val ? String(val).trim() : '');

function buildVariantEntry(fields, idx) {
  const entry = {
    size_label: trimEmpty(fields.sizes[idx]),
    thickness: trimEmpty(fields.thicknesses[idx]),
    color: trimEmpty(fields.colors[idx]),
    material_type: trimEmpty(fields.materials[idx])
  };
  return Object.values(entry).some(Boolean) ? { ...entry, sort_order: idx, is_active: 1 } : null;
}

export function parseVariants(body) {
  if (!body.var_size && !body.var_thickness && !body.var_color) return [];
  const toArr = (v) => (Array.isArray(v) ? v : [v]);
  const fields = {
    sizes: toArr(body.var_size),
    thicknesses: toArr(body.var_thickness),
    colors: toArr(body.var_color),
    materials: toArr(body.var_material)
  };
  const len = Math.max(fields.sizes.length, fields.thicknesses.length, fields.colors.length);
  const variants = [];
  for (let i = 0; i < len; i++) {
    const entry = buildVariantEntry(fields, i);
    if (entry) variants.push(entry);
  }
  return variants;
}

function parseJsonArrayString(trimmed) {
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseRawGalleryList(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return parseJsonArrayString(trimmed);
  return trimmed.includes(',') ? trimmed.split(',').map((s) => s.trim()) : [trimmed];
}

function normalizeGalleryObject(item) {
  if (item.id && (typeof item.id === 'number' || /^\d+$/.test(item.id))) return parseInt(item.id, 10);
  if (typeof item.url === 'string') return item.url.trim();
  return typeof item.file_url === 'string' ? item.file_url.trim() : null;
}

function normalizeStringGalleryEntry(item) {
  const str = item.trim();
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  return /^(https?:\/\/|\/)/i.test(str) ? str : null;
}

function normalizeGalleryEntry(item) {
  if (typeof item === 'number' && Number.isInteger(item)) return item;
  if (typeof item === 'string') return normalizeStringGalleryEntry(item);
  return item && typeof item === 'object' ? normalizeGalleryObject(item) : null;
}

export function parseShowDescriptionTab(val) {
  const raw = Array.isArray(val) ? val[val.length - 1] : val;
  return raw === 1 || raw === '1' || raw === true || raw === 'true' || raw === 'on' ? 1 : 0;
}

export function parseSortOrder(val, fallback = 0) {
  if (val == null) return fallback;
  const parsed = parseInt(String(val).trim(), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function parseGalleryImages(body) {
  const raw = body.gallery_images || body.gallery;
  return raw ? parseRawGalleryList(raw).map(normalizeGalleryEntry).filter((x) => x !== null) : [];
}

function mapVariantEntry(v) {
  return typeof v === 'string' ? v.trim() : (v?.size_label || v?.name_id || '');
}

function parseRawVariantArray(rawVariants) {
  if (Array.isArray(rawVariants)) return rawVariants.map(mapVariantEntry).filter(Boolean);
  if (typeof rawVariants !== 'string') return [];
  try {
    const parsed = JSON.parse(rawVariants);
    if (Array.isArray(parsed)) return parsed.map(mapVariantEntry).filter(Boolean);
  } catch {
    return rawVariants.trim() ? [rawVariants.trim()] : [];
  }
  return [];
}

export function parseVariantLabels(body) {
  if (body.variant_labels !== undefined) {
    const raw = Array.isArray(body.variant_labels) ? body.variant_labels : [body.variant_labels];
    return raw.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
  }
  if (body.variants !== undefined) return parseRawVariantArray(body.variants);

  return parseVariants(body)
    .map((v) => (v.size_label ? `${v.size_label}${v.thickness ? ` (${v.thickness})` : ''}` : ''))
    .filter(Boolean);
}

const stripTags = (val) => String(val).replace(/<[^>]*>/g, '').trim();

function findFirstLengthError(checks) {
  for (const [val, maxLen, message] of checks) {
    if (val && val.length > maxLen) return message;
  }
  return null;
}

const cleanOptionalCta = (raw) => {
  if (raw === undefined) return null;
  return raw ? stripTags(raw) : '';
};

function checkVariantsJsonError(variantsJson) {
  if (variantsJson === undefined) return null;
  return validateRawVariantGroups(variantsJson).error || null;
}

export function validateProductFields(body = {}, { requireNameId = false } = {}) {
  const { name_id, short_description_id, short_description_en, cta_text_id, cta_text_en, variants_json } = body;
  if (requireNameId && !trimOpt(name_id)) {
    return { error: 'Nama produk (Bahasa Indonesia) wajib diisi.' };
  }
  const varErr = checkVariantsJsonError(variants_json);
  if (varErr) return { error: varErr };

  const cleanCtaId = cleanOptionalCta(cta_text_id);
  const cleanCtaEn = cleanOptionalCta(cta_text_en);

  const lengthError = findFirstLengthError([
    [trimOpt(short_description_id), 200, 'Deskripsi singkat (ID) maksimal 200 karakter.'],
    [trimOpt(short_description_en), 200, 'Deskripsi singkat (EN) maksimal 200 karakter.'],
    [cleanCtaId, 50, 'Teks tombol CTA (ID) maksimal 50 karakter.'],
    [cleanCtaEn, 50, 'Teks tombol CTA (EN) maksimal 50 karakter.']
  ]);
  if (lengthError) return { error: lengthError };

  return { cleanCtaId, cleanCtaEn };
}

function parseNullableInt(val) {
  const parsed = val ? parseInt(val, 10) : NaN;
  return Number.isNaN(parsed) ? null : parsed;
}

function parsePositivePage(val) {
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function parseProductListFilters(queryParams = {}) {
  const rawCategory = queryParams.category_id || queryParams.category;
  const rawStatus = trimOpt(queryParams.status);
  const rawSearch = queryParams.q || queryParams.search;
  const parsedPerPage = parseInt(queryParams.per_page, 10);

  return {
    categoryId: parseNullableInt(rawCategory),
    status: ALLOWED_STATUSES.has(rawStatus) ? rawStatus : null,
    search: typeof rawSearch === 'string' ? rawSearch.trim().slice(0, 100) : null,
    perPage: ALLOWED_PER_PAGE.has(parsedPerPage) ? parsedPerPage : 10,
    parsedPage: parsePositivePage(queryParams.page)
  };
}

const isNumericMediaRef = (x) => typeof x === 'number' || (typeof x === 'string' && /^\d+$/.test(x.trim()));

function formatNumericGalleryItem(item, mediaMap) {
  const id = parseInt(item, 10);
  const m = mediaMap[id];
  return { id, url: m?.file_url || '', name: m?.filename || `Media #${id}` };
}

function formatObjectGalleryItem(item) {
  return {
    id: item.id || null,
    url: item.url || item.file_url || '',
    name: item.name || item.filename || 'Foto'
  };
}

function formatResolvedGalleryItem(item, mediaMap) {
  if (isNumericMediaRef(item)) return formatNumericGalleryItem(item, mediaMap);
  if (typeof item === 'string') return { id: null, url: item, name: item.split('/').pop() || 'Foto Galeri' };
  return item && typeof item === 'object' ? formatObjectGalleryItem(item) : null;
}

export async function resolveGalleryItems(galleryImages) {
  if (!Array.isArray(galleryImages) || galleryImages.length === 0) return [];
  const ids = galleryImages.filter(isNumericMediaRef).map((x) => parseInt(x, 10));

  const mediaMap = {};
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    const mediaRows = await query(`SELECT id, file_url, filename FROM media WHERE id IN (${placeholders})`, ids);
    mediaRows.forEach((m) => { mediaMap[m.id] = m; });
  }

  return galleryImages.map((item) => formatResolvedGalleryItem(item, mediaMap)).filter(Boolean);
}

const buildProductSeoFields = (body) => ({
  meta_title_id: body.meta_title_id || null,
  meta_title_en: body.meta_title_en || null,
  meta_desc_id: body.meta_desc_id || null,
  meta_desc_en: body.meta_desc_en || null
});

const pickProductVariants = (body) => {
  if (body.variants_json !== undefined) {
    return validateRawVariantGroups(body.variants_json).groups || [];
  }
  if (Array.isArray(body.variants) && body.variants.some(isVariantGroupObject)) {
    return normalizeVariantGroups(body.variants);
  }
  const variantLabels = parseVariantLabels(body);
  return variantLabels.length > 0 ? variantLabels : parseVariants(body);
};

export function buildProductCreateData(body, { cleanCtaId, cleanCtaEn, imageUrl, sizeTable }) {
  const nameId = body.name_id.trim();

  return {
    name_id: nameId,
    name_en: trimOpt(body.name_en) || nameId,
    slug: createSlug(nameId),
    category_id: parseNullableInt(body.category_id),
    short_description_id: trimOpt(body.short_description_id),
    short_description_en: trimOpt(body.short_description_en),
    description_id: trimOpt(body.description_id),
    description_en: trimOpt(body.description_en),
    cta_text_id: cleanCtaId || null,
    cta_text_en: cleanCtaEn || null,
    show_description_tab: parseShowDescriptionTab(body.show_description_tab),
    variants: pickProductVariants(body),
    size_table: sizeTable,
    main_image: imageUrl,
    gallery_images: parseGalleryImages(body),
    status: body.status || 'published',
    sort_order: parseSortOrder(body.sort_order, 0),
    ...buildProductSeoFields(body)
  };
}

const SIZE_TABLE_BODY_KEYS = [
  'kode_produk', 'size_code', 'lebar', 'size_width', 'panjang', 'size_length',
  'tebal_micron', 'size_thickness', 'kapasitas', 'size_capacity', 'bahan', 'size_material', 'size_table'
];

const resolveOptionalTrim = (newVal, existingVal) => (newVal !== undefined ? trimOpt(newVal) : existingVal);
const resolveOptionalCta = (rawVal, cleanVal, existingVal) => (rawVal !== undefined ? (cleanVal || null) : existingVal);

function applyOptionalStructuredUpdates(updateData, body) {
  if (
    body.variants_json !== undefined ||
    body.variant_labels !== undefined ||
    body.variants !== undefined ||
    body.var_size !== undefined
  ) {
    updateData.variants = pickProductVariants(body);
  }
  if (SIZE_TABLE_BODY_KEYS.some((k) => body[k] !== undefined)) {
    updateData.size_table = parseDynamicSizeTable(body);
  }
  if (body.gallery_images !== undefined || body.gallery !== undefined) {
    updateData.gallery_images = parseGalleryImages(body);
  }
}

export function buildProductUpdateData(body, product, { cleanCtaId, cleanCtaEn }) {
  const updateData = {
    name_id: trimOpt(body.name_id) || product.name_id,
    name_en: trimOpt(body.name_en) || product.name_en,
    slug: body.name_id ? createSlug(body.name_id) : product.slug,
    category_id: parseNullableInt(body.category_id),
    short_description_id: resolveOptionalTrim(body.short_description_id, product.short_description_id),
    short_description_en: resolveOptionalTrim(body.short_description_en, product.short_description_en),
    description_id: resolveOptionalTrim(body.description_id, product.description_id),
    description_en: resolveOptionalTrim(body.description_en, product.description_en),
    cta_text_id: resolveOptionalCta(body.cta_text_id, cleanCtaId, product.cta_text_id),
    cta_text_en: resolveOptionalCta(body.cta_text_en, cleanCtaEn, product.cta_text_en),
    show_description_tab: parseShowDescriptionTab(body.show_description_tab),
    status: body.status || product.status,
    sort_order: body.sort_order !== undefined ? parseSortOrder(body.sort_order, product.sort_order) : product.sort_order,
    ...buildProductSeoFields(body)
  };
  applyOptionalStructuredUpdates(updateData, body);
  return updateData;
}
