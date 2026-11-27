import productModel, { normalizeSizeTable } from '../models/productModel.js';
import productCategoryModel from '../models/productCategoryModel.js';
import { processAndSaveWebP } from '../middleware/uploadMiddleware.js';
import storage from '../config/storage.js';
import { invalidateSitemapCache } from '../utils/sitemapGenerator.js';
import { parseBulkIds } from '../utils/bulkIdsHelper.js';
import {
  parseDynamicSizeTable,
  getProductsWithSizeTable,
  buildProductCsvExport
} from './productSizeTableService.js';
import {
  validateProductFields,
  parseProductListFilters,
  resolveGalleryItems,
  buildProductCreateData,
  buildProductUpdateData
} from './productService.js';

const DEFAULT_DEPS = {
  productModel,
  productCategoryModel,
  processAndSaveWebP,
  storage,
  invalidateSitemapCache,
  getProductsWithSizeTable,
  resolveGalleryItems
};

const useDeps = (deps) => (deps ? { ...DEFAULT_DEPS, ...deps } : DEFAULT_DEPS);

export function buildEmptyProductListData(error = 'Gagal memuat katalog produk.') {
  return {
    products: [],
    categories: [],
    selectedCategory: null,
    selectedStatus: null,
    searchQuery: null,
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalCount: 0,
    error
  };
}

export async function getAdminProductList(rawQuery, deps = {}) {
  const d = useDeps(deps);
  const filters = parseProductListFilters(rawQuery);
  const [totalCount, categories] = await Promise.all([
    d.productModel.countAll({
      categoryId: filters.categoryId,
      status: filters.status,
      search: filters.search
    }),
    d.productCategoryModel.findAll({ activeOnly: false })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.perPage));
  const currentPage = Math.min(filters.parsedPage, totalPages);
  const products = await d.productModel.findAll({
    categoryId: filters.categoryId,
    status: filters.status,
    search: filters.search,
    limit: filters.perPage,
    offset: (currentPage - 1) * filters.perPage
  });

  return {
    filters,
    categories,
    products,
    selectedCategory: filters.categoryId,
    selectedStatus: filters.status,
    searchQuery: filters.search || '',
    currentPage,
    perPage: filters.perPage,
    totalPages,
    totalCount
  };
}

export async function getProductCsvExportPayload(deps = {}) {
  const d = useDeps(deps);
  const date = d.date || new Date();
  const products = await d.productModel.findAll();
  const { columns, rows } = buildProductCsvExport(products);
  const filename = `katalog-produk-euodoo-${date.toISOString().slice(0, 10)}.csv`;
  return { filename, columns, rows };
}

export async function getProductCreateFormData(deps = {}) {
  const d = useDeps(deps);
  const [categories, productsList] = await Promise.all([
    d.productCategoryModel.findAll({ activeOnly: true }),
    d.getProductsWithSizeTable()
  ]);
  return { categories, productsList: productsList || [] };
}

export async function getProductSizeTableColumns(id, deps = {}) {
  const d = useDeps(deps);
  const product = await d.productModel.findById(id);
  if (!product) return { status: 'not_found', error: 'Produk tidak ditemukan' };

  const sizeTable = normalizeSizeTable(product.size_table);
  const columns = (sizeTable.columns || []).map((c, idx) => ({
    id: `col_${idx + 1}`,
    label: c.label || ''
  }));
  return { status: 'ok', columns };
}

function tryParseSizeTable(body) {
  try {
    return { value: parseDynamicSizeTable(body) };
  } catch (err) {
    return { error: err.message };
  }
}

async function resolveCreateImageUrl(body, file, d) {
  if (file) return d.processAndSaveWebP(file.buffer, 'products');
  return body.image_url ? String(body.image_url).trim() : null;
}

export async function createAdminProduct(rawBody, file, deps = {}) {
  const d = useDeps(deps);
  const body = rawBody || {};
  const validation = validateProductFields(body, { requireNameId: true });
  if (validation.error) return { status: 'validation_error', error: validation.error };

  const sizeTableResult = tryParseSizeTable(body);
  if (sizeTableResult.error) return { status: 'validation_error', error: sizeTableResult.error };

  const imageUrl = await resolveCreateImageUrl(body, file, d);
  const id = await d.productModel.create(
    buildProductCreateData(body, { ...validation, imageUrl, sizeTable: sizeTableResult.value })
  );
  d.invalidateSitemapCache();
  return { status: 'ok', id, message: 'Produk baru berhasil ditambahkan.' };
}

export async function getProductEditFormData(id, deps = {}) {
  const d = useDeps(deps);
  const [product, categories] = await Promise.all([
    d.productModel.findById(id),
    d.productCategoryModel.findAll({ activeOnly: false })
  ]);
  if (!product) return { status: 'not_found', error: 'Produk tidak ditemukan.' };

  product.gallery_items = await d.resolveGalleryItems(product.gallery_images);
  const productsList = await d.getProductsWithSizeTable(product.id);
  return { status: 'ok', product, categories, productsList: productsList || [] };
}

async function resolveUpdatedImageUrl(body, file, d) {
  if (file) return d.processAndSaveWebP(file.buffer, 'products');
  if (body.image_url === undefined) return undefined;
  return body.image_url ? String(body.image_url).trim() : null;
}

async function cleanupReplacedImage(file, oldUrl, storageDriver) {
  if (file && oldUrl) await storageDriver.delete(oldUrl);
}

function tryBuildProductUpdate(body, product, validation) {
  try {
    return { data: buildProductUpdateData(body, product, validation) };
  } catch (err) {
    return { error: err.message };
  }
}

export async function updateAdminProduct(id, rawBody, file, deps = {}) {
  const d = useDeps(deps);
  const body = rawBody || {};
  const product = await d.productModel.findById(id);
  if (!product) return { status: 'not_found', error: 'Produk tidak ditemukan.' };

  const validation = validateProductFields(body);
  if (validation.error) return { status: 'validation_error', error: validation.error };

  const built = tryBuildProductUpdate(body, product, validation);
  if (built.error) return { status: 'validation_error', error: built.error };

  const nextImageUrl = await resolveUpdatedImageUrl(body, file, d);
  if (nextImageUrl !== undefined) built.data.image_url = nextImageUrl;

  await d.productModel.update(id, built.data);
  await cleanupReplacedImage(file, product.image_url, d.storage);
  d.invalidateSitemapCache();
  return { status: 'ok', message: 'Produk berhasil diperbarui.' };
}

export async function deleteAdminProduct(id, deps = {}) {
  const d = useDeps(deps);
  const product = await d.productModel.findById(id);
  if (!product) return { status: 'not_found', error: 'Produk tidak ditemukan.' };

  await d.productModel.delete(id);
  if (product.image_url) await d.storage.delete(product.image_url);
  d.invalidateSitemapCache();
  return { status: 'ok', message: 'Produk berhasil dihapus.' };
}

export async function bulkDeleteAdminProducts(rawBody, deps = {}) {
  const d = useDeps(deps);
  const parsed = parseBulkIds(rawBody);
  if (parsed.status !== 'ok') {
    return { status: 'validation_error', error: parsed.error, message: parsed.error };
  }

  const ids = parsed.ids;
  const existing = await d.productModel.findByIds(ids);
  if (!Array.isArray(existing) || existing.length === 0) {
    return { status: 'not_found', error: 'Produk yang dipilih tidak ditemukan.', message: 'Produk yang dipilih tidak ditemukan.' };
  }

  const foundSet = new Set(existing.map((item) => item.id));
  const targetIds = existing.map((item) => item.id);
  const skippedIds = ids.filter((id) => !foundSet.has(id));
  const deletedCount = await d.productModel.deleteMany(targetIds);

  const uniqueImages = [...new Set(existing.map((item) => item.image_url || item.main_image).filter(Boolean))];
  await Promise.all(uniqueImages.map((imgUrl) => d.storage.delete(imgUrl)));
  d.invalidateSitemapCache();

  return {
    status: 'ok',
    deletedCount,
    requestedCount: ids.length,
    skippedIds,
    message: `${deletedCount} produk berhasil dihapus.`
  };
}

export default {
  buildEmptyProductListData,
  getAdminProductList,
  getProductCsvExportPayload,
  getProductCreateFormData,
  getProductSizeTableColumns,
  createAdminProduct,
  getProductEditFormData,
  updateAdminProduct,
  deleteAdminProduct,
  bulkDeleteAdminProducts
};
