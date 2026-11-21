import { normalizeSizeTable } from '../models/productModel.js';
import { sanitizeArticleHtml } from '../utils/sanitizer.js';

function isNumericToken(value) {
  return typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value.trim()));
}

function parseRawGallery(product) {
  let raw = product.gallery_images || product.gallery || null;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = null; }
  }
  return Array.isArray(raw) ? raw : [];
}

function mergeMainAndGallery(mainImage, urls) {
  const seen = new Set();
  const result = [];
  const candidates = mainImage ? [mainImage, ...urls] : urls;

  for (const raw of candidates) {
    const url = typeof raw === 'string' ? raw.trim() : '';
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  return result;
}

export async function resolveProductGallery(product, medModel) {
  const mainImage = product.main_image || product.image_url || null;
  const gallery = parseRawGallery(product);
  const ids = gallery.filter(isNumericToken).map((item) => parseInt(item, 10));

  let mediaMap = {};
  if (ids.length > 0) {
    const mediaRows = (await medModel.findUrlsByIds(ids)) || [];
    mediaMap = Object.fromEntries(mediaRows.map((row) => [row.id, row.file_url]));
  }

  const resolvedUrls = gallery
    .map((item) => (isNumericToken(item) ? (mediaMap[parseInt(item, 10)] || null) : item))
    .filter(Boolean);

  return mergeMainAndGallery(mainImage, resolvedUrls);
}

function resolveSpecDisplayMode(showDescriptionTab, hasDescription, hasSizeTable) {
  if (!showDescriptionTab) return hasSizeTable ? 'size-only' : 'none';
  if (hasDescription && hasSizeTable) return 'tabs';
  if (hasDescription) return 'description-only';
  return hasSizeTable ? 'size-only' : 'none';
}

export function buildProductSpecPayload(product, lang) {
  const rawDesc = lang === 'en'
    ? (product.description_en || product.description_id || '')
    : (product.description_id || '');
  const sanitizedDescription = sanitizeArticleHtml(rawDesc);
  const hasDescription = sanitizedDescription.replace(/<[^>]*>/g, '').trim().length > 0;
  const sizeTable = normalizeSizeTable(product.size_table);
  const hasSizeTable = (sizeTable.columns || []).length > 0 && (sizeTable.rows || []).length > 0;
  const showDescriptionTab = Boolean(product.show_description_tab);
  const specDisplayMode = resolveSpecDisplayMode(showDescriptionTab, hasDescription, hasSizeTable);
  return { sanitizedDescription, hasDescription, hasSizeTable, showDescriptionTab, specDisplayMode };
}
