import productModel, { normalizeSizeTable } from '../models/productModel.js';
import productCategoryModel from '../models/productCategoryModel.js';
import pageHeroBannerModel from '../models/pageHeroBannerModel.js';
import mediaModel from '../models/mediaModel.js';
import { resolveProductGallery, buildProductSpecPayload } from './publicProductDetailHelper.js';

export { resolveProductGallery, buildProductSpecPayload };

export const PAGE_SIZE = 9;
export const ALLOWED_SORTS = ['newest', 'alpha-asc', 'alpha-desc', 'catalog'];
export const MAX_SEARCH_LENGTH = 100;
export const MAX_META_DESC_LENGTH = 160;
export const RELATED_LIMIT = 4;
export const RELATED_FETCH_LIMIT = 5;
export const INVALID_CATEGORY_ID = -1;
export const DEFAULT_WHATSAPP_NUMBER = '6281234567890';
const DEFAULT_COMPANY_NAME = 'PT Euodoo Plastic';

function translate(t, key, fallback, params) {
  if (typeof t === 'function') return t(key, params);
  return fallback || key;
}

function resolveCompanyName(settings) {
  return settings?.company_name || DEFAULT_COMPANY_NAME;
}

export function parseCatalogQuery(rawQuery = {}) {
  const page = Math.max(1, parseInt(rawQuery.page || '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const rawSort = rawQuery.sort;
  const sort = ALLOWED_SORTS.includes(rawSort) ? rawSort : 'newest';
  const search = typeof rawQuery.search === 'string'
    ? rawQuery.search.trim().slice(0, MAX_SEARCH_LENGTH)
    : '';
  return { page, offset, rawSort, sort, search, category: rawQuery.category };
}

export async function resolveCatalogCategory(categoryParam, categoryModel) {
  if (!categoryParam) return { selectedCategory: null, categoryId: undefined };
  if (typeof categoryParam !== 'string') return { selectedCategory: null, categoryId: INVALID_CATEGORY_ID };

  const found = /^\d+$/.test(categoryParam)
    ? await categoryModel.findById(parseInt(categoryParam, 10))
    : await categoryModel.findBySlug(categoryParam);

  if (found && (found.is_active === 1 || found.is_active === null)) {
    return { selectedCategory: found, categoryId: found.id };
  }
  return { selectedCategory: null, categoryId: INVALID_CATEGORY_ID };
}

export function shouldNoIndexCatalog(parsed, selectedCategory) {
  const hasNonDefaultSort = Boolean(parsed.rawSort && parsed.rawSort !== 'newest');
  const hasInvalidCategory = Boolean(parsed.category && !selectedCategory);
  return Boolean(parsed.page > 1 || parsed.search || hasNonDefaultSort || hasInvalidCategory);
}

function buildFragmentMeta(page, totalPages, totalCount, totalAllProducts) {
  const hasMore = page < totalPages;
  return {
    hasMore,
    fragmentHeaders: {
      'X-Has-More': String(hasMore),
      'X-Total-Count': String(totalCount),
      'X-Total-All-Count': String(totalAllProducts),
      'X-Current-Page': String(page),
      'X-Total-Pages': String(totalPages)
    },
    jsonMeta: { hasMore, page, totalPages, totalProducts: totalCount, totalAllProducts }
  };
}

function buildCatalogPayload(bundle, parsed, categories, selectedCategory, context) {
  const totalPages = Math.ceil(bundle.totalCount / PAGE_SIZE) || 1;
  const meta = buildFragmentMeta(parsed.page, totalPages, bundle.totalCount, bundle.totalAllProducts);
  const lang = context.currentLang || 'id';
  const fallbackTitle = lang === 'en' ? 'Product Catalog' : 'Katalog Produk';
  const catalogLabel = translate(context.t, 'products.catalog_title', fallbackTitle);

  return {
    noindex: shouldNoIndexCatalog(parsed, selectedCategory),
    fragmentHeaders: meta.fragmentHeaders,
    fragmentData: {
      products: bundle.products,
      currentLang: lang,
      page: parsed.page,
      hasMore: meta.hasMore,
      totalProducts: bundle.totalCount
    },
    jsonMeta: meta.jsonMeta,
    viewData: {
      title: `${catalogLabel} | ${resolveCompanyName(context.settings)}`,
      path: '/products',
      categories,
      selectedCategory,
      products: bundle.products,
      search: parsed.search,
      sort: parsed.sort,
      page: parsed.page,
      totalPages,
      totalProducts: bundle.totalCount,
      totalAllProducts: bundle.totalAllProducts,
      hasMore: meta.hasMore,
      heroBanner: bundle.heroBanner
    }
  };
}

async function fetchCatalogBundle(parsed, categoryId, deps) {
  const pModel = deps.productModel || productModel;
  const heroModel = deps.pageHeroBannerModel || pageHeroBannerModel;
  const filterOptions = {
    categoryId,
    status: 'published',
    search: parsed.search || undefined,
    sort: parsed.sort,
    limit: PAGE_SIZE,
    offset: parsed.offset
  };

  const [products, totalCount, totalAllProducts, heroBanner] = await Promise.all([
    pModel.findAll(filterOptions),
    pModel.countAll(filterOptions),
    pModel.countAll({ status: 'published' }),
    heroModel.getByPageKey('products')
  ]);
  return { products: products || [], totalCount, totalAllProducts, heroBanner };
}

export async function getCatalogPageData(rawQuery = {}, context = {}, deps = {}) {
  const catModel = deps.productCategoryModel || productCategoryModel;
  const parsed = parseCatalogQuery(rawQuery);
  const categories = (await catModel.findAll({ activeOnly: true })) || [];
  const { selectedCategory, categoryId } = await resolveCatalogCategory(parsed.category, catModel);
  const bundle = await fetchCatalogBundle(parsed, categoryId, deps);
  return buildCatalogPayload(bundle, parsed, categories, selectedCategory, context);
}

export function buildCatalogFallbackPayload(context = {}) {
  const lang = context.currentLang || 'id';
  const catalogLabel = translate(context.t, 'products.catalog_title', lang === 'en' ? 'Product Catalog' : 'Katalog Produk');
  return {
    title: `${catalogLabel} | ${resolveCompanyName(context.settings)}`,
    path: '/products',
    categories: [],
    selectedCategory: null,
    products: [],
    search: '',
    sort: 'newest',
    page: 1,
    totalPages: 1,
    totalProducts: 0,
    totalAllProducts: 0,
    hasMore: false,
    heroBanner: null
  };
}

async function findPublishedProduct(slug, pModel) {
  const product = /^\d+$/.test(slug)
    ? await pModel.findById(parseInt(slug, 10))
    : await pModel.findBySlug(slug);
  if (!product || product.status !== 'published' || product.is_active === 0) return null;
  return product;
}

const META_DESC_KEYS_EN = [
  'meta_description_en', 'meta_description_id',
  'short_description_en', 'short_description_id',
  'description_en', 'description_id'
];
const META_DESC_KEYS_ID = ['meta_description_id', 'short_description_id', 'description_id'];

export function buildMetaDescription(product, lang) {
  const keys = lang === 'en' ? META_DESC_KEYS_EN : META_DESC_KEYS_ID;
  const foundKey = keys.find((key) => Boolean(product[key]));
  const raw = foundKey ? product[foundKey] : '';
  return String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_META_DESC_LENGTH);
}

function resolveWhatsappNumber(settings) {
  const safeSettings = settings || {};
  if (safeSettings.whatsapp_formatted_number) return safeSettings.whatsapp_formatted_number;
  if (safeSettings.whatsapp_number) return String(safeSettings.whatsapp_number).replace(/[^0-9]/g, '');
  return DEFAULT_WHATSAPP_NUMBER;
}

export function buildWhatsappQuoteUrl(prodName, settings, t) {
  const waNumber = resolveWhatsappNumber(settings);
  const fallbackMsg = `Halo, saya tertarik dengan produk ${prodName}. Boleh saya minta informasi lebih lanjut?`;
  const waMessage = translate(t, 'product_detail.whatsapp_quote_message', fallbackMsg, { name: prodName });
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
}

function applyNormalizedFields(product, gallery, waUrl) {
  product.short_description_id = product.short_description_id || null;
  product.short_description_en = product.short_description_en || null;
  product.variants = Array.isArray(product.variants) ? product.variants : [];
  product.size_table = normalizeSizeTable(product.size_table);
  product.gallery_images = gallery;
  product.gallery = gallery;
  product.images = gallery;
  product.whatsapp_quote_url = waUrl;
}

function pickLocalizedProductName(product, lang) {
  if (lang === 'en') return product.name_en || product.name_id;
  return product.name_id;
}

function buildDetailResult(product, gallery, relatedRaw, context) {
  const lang = context.currentLang || 'id';
  const prodName = pickLocalizedProductName(product, lang);
  const whatsappQuoteUrl = buildWhatsappQuoteUrl(prodName, context.settings, context.t);
  applyNormalizedFields(product, gallery, whatsappQuoteUrl);

  const specPayload = buildProductSpecPayload(product, lang);
  const cleanMetaDesc = buildMetaDescription(product, lang);
  const canonicalUrl = product.canonical_url || `${context.baseUrl}/products/${product.slug || product.id}`;
  const relatedProducts = (relatedRaw || [])
    .filter((p) => p.id !== product.id && p.is_active !== 0)
    .slice(0, RELATED_LIMIT);

  return {
    status: 'ok',
    cleanMetaDesc,
    viewData: {
      title: `${prodName} | ${resolveCompanyName(context.settings)}`,
      metaDescription: cleanMetaDesc || undefined,
      path: '/products',
      headerSolid: true,
      product,
      sanitizedDescription: specPayload.sanitizedDescription,
      specDisplayMode: specPayload.specDisplayMode,
      canonicalUrl,
      whatsappQuoteUrl,
      relatedProducts
    }
  };
}

export async function getProductDetailData(slug, context = {}, deps = {}) {
  const pModel = deps.productModel || productModel;
  const medModel = deps.mediaModel || mediaModel;

  const product = await findPublishedProduct(slug, pModel);
  if (!product) return { status: 'not_found', notFoundData: buildProductNotFoundData(context) };

  const [gallery, relatedRaw] = await Promise.all([
    resolveProductGallery(product, medModel),
    pModel.findAll({ categoryId: product.category_id, status: 'published', activeOnly: true, limit: RELATED_FETCH_LIMIT })
  ]);

  return buildDetailResult(product, gallery, relatedRaw, context);
}

export function buildProductNotFoundData(context = {}) {
  const title = translate(context.t, 'product_detail.not_found_title', 'Produk Tidak Ditemukan');
  const message = translate(context.t, 'product_detail.not_found_message', 'Produk yang Anda cari tidak tersedia atau sedang diperbarui.');
  return {
    title: `${title} | ${resolveCompanyName(context.settings)}`,
    path: '/products',
    message
  };
}

export function buildProductErrorData(context = {}) {
  const title = translate(context.t, 'common.error_title', 'Error');
  const message = translate(context.t, 'product_detail.load_error_message', 'Gagal memuat rincian produk.');
  return {
    title: `${title} | ${resolveCompanyName(context.settings)}`,
    path: '/products',
    message
  };
}

export default {
  PAGE_SIZE,
  ALLOWED_SORTS,
  MAX_SEARCH_LENGTH,
  MAX_META_DESC_LENGTH,
  RELATED_LIMIT,
  RELATED_FETCH_LIMIT,
  INVALID_CATEGORY_ID,
  DEFAULT_WHATSAPP_NUMBER,
  parseCatalogQuery,
  resolveCatalogCategory,
  shouldNoIndexCatalog,
  getCatalogPageData,
  buildCatalogFallbackPayload,
  resolveProductGallery,
  buildMetaDescription,
  buildWhatsappQuoteUrl,
  getProductDetailData,
  buildProductNotFoundData,
  buildProductErrorData
};
