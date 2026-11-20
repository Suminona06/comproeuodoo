import { sendCsvResponse } from '../../utils/csvExporter.js';
import logger from '../../utils/logger.js';
import {
  parseGalleryImages,
  resolveGalleryItems
} from '../../services/productService.js';
import {
  parseDynamicSizeTable,
  parseSizeTable,
  getProductsWithSizeTable
} from '../../services/productSizeTableService.js';
import {
  buildEmptyProductListData,
  getAdminProductList,
  getProductCsvExportPayload,
  getProductCreateFormData,
  getProductSizeTableColumns,
  createAdminProduct,
  getProductEditFormData,
  updateAdminProduct,
  deleteAdminProduct
} from '../../services/productCrudService.js';

export { parseDynamicSizeTable, parseSizeTable, getProductsWithSizeTable };

const productRedirect = (res, type, message, subPath = '') =>
  res.redirect(`/admin/products${subPath}?${type}=${encodeURIComponent(message)}`);

const wantsJson = (req) => Boolean(
  req.xhr
  || req.headers?.accept?.includes('application/json')
  || req.headers?.['x-requested-with'] === 'fetch'
  || req.query?.format === 'json'
);

function renderAsyncAppView(app, view, locals) {
  return new Promise((resolve, reject) => {
    app.render(view, locals, (err, html) => (err ? reject(err) : resolve(html)));
  });
}

function buildSharedListState(data, csrfToken) {
  return {
    products: data.products,
    selectedCategory: data.selectedCategory,
    selectedStatus: data.selectedStatus,
    searchQuery: data.searchQuery,
    currentPage: data.currentPage,
    perPage: data.perPage,
    totalPages: data.totalPages,
    totalCount: data.totalCount,
    csrfToken
  };
}

async function renderCreateFormError(req, res, errorMsg) {
  const body = req.body || {};
  const [{ categories, productsList }, galleryItems] = await Promise.all([
    getProductCreateFormData(),
    resolveGalleryItems(parseGalleryImages(body))
  ]);
  return res.status(400).render('admin/products/create', {
    title: 'Tambah Produk Baru',
    pageTitle: 'Tambah Produk',
    activeNav: 'products',
    categories,
    productsList,
    error: errorMsg,
    formData: { ...body, gallery_items: galleryItems },
    csrfToken: res.locals?.csrfToken || ''
  });
}

async function renderIndexJsonResponse(req, res, sharedViewState, filters) {
  const renderLocals = {
    ...res.locals,
    ...sharedViewState,
    pagination: {
      page: sharedViewState.currentPage,
      perPage: filters.perPage,
      totalRows: sharedViewState.totalCount,
      totalPages: sharedViewState.totalPages,
      baseUrl: '/admin/products',
      queryParams: { category: filters.categoryId, status: filters.status, q: filters.search }
    }
  };
  const [rowsHtml, paginationHtml] = await Promise.all([
    renderAsyncAppView(req.app, 'admin/products/partials/table-rows', renderLocals),
    renderAsyncAppView(req.app, 'partials/pagination', renderLocals)
  ]);
  return res.json({ success: true, ...sharedViewState, rowsHtml, paginationHtml });
}

function handleIndexError(req, res, err) {
  logger.error('Product index error:', { message: err.message });
  if (wantsJson(req)) {
    return res.status(500).json({ success: false, message: 'Gagal memuat katalog produk.' });
  }
  return res.status(500).render('admin/products/index', {
    title: 'Manajemen Produk',
    pageTitle: 'Katalog Produk',
    activeNav: 'products',
    ...buildEmptyProductListData(),
    csrfToken: res.locals.csrfToken || ''
  });
}

function respondDestroyResult(res, isJson, result) {
  if (result.status === 'not_found') {
    return isJson
      ? res.status(404).json({ success: false, message: result.error })
      : productRedirect(res, 'error', result.error);
  }
  return isJson
    ? res.json({ success: true, message: result.message })
    : productRedirect(res, 'success', result.message);
}

export const productController = {
  getProductsWithSizeTable,

  async index(req, res) {
    try {
      const data = await getAdminProductList(req.query);
      const sharedViewState = buildSharedListState(data, res.locals.csrfToken || '');
      if (wantsJson(req)) return renderIndexJsonResponse(req, res, sharedViewState, data.filters);

      return res.render('admin/products/index', {
        title: 'Manajemen Katalog Produk',
        pageTitle: 'Katalog Produk Manufaktur',
        activeNav: 'products',
        categories: data.categories,
        ...sharedViewState,
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      return handleIndexError(req, res, err);
    }
  },

  async exportCsv(req, res) {
    try {
      const { filename, columns, rows } = await getProductCsvExportPayload();
      sendCsvResponse(res, filename, columns, rows);
    } catch (err) {
      logger.error('Product export CSV error:', err);
      productRedirect(res, 'error', 'Gagal mengekspor data produk ke CSV.');
    }
  },

  async createView(req, res) {
    try {
      const { categories, productsList } = await getProductCreateFormData();
      res.render('admin/products/create', {
        title: 'Tambah Produk Baru',
        pageTitle: 'Tambah Produk Manufaktur',
        activeNav: 'products',
        categories,
        productsList,
        error: null,
        csrfToken: res.locals?.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product createView error:', { message: err.message });
      productRedirect(res, 'error', 'Gagal membuka form tambah produk.');
    }
  },

  async getSizeTableColumns(req, res) {
    try {
      const result = await getProductSizeTableColumns(req.params.id);
      if (result.status === 'not_found') {
        return res.status(404).json({ success: false, message: result.error });
      }
      return res.json({ success: true, columns: result.columns });
    } catch (err) {
      logger.error('getSizeTableColumns error:', { message: err.message });
      return res.status(500).json({ success: false, message: 'Gagal mengambil struktur kolom produk.' });
    }
  },

  async store(req, res) {
    try {
      const result = await createAdminProduct(req.body, req.file);
      if (result.status === 'validation_error') return renderCreateFormError(req, res, result.error);
      return productRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Product store error:', { message: err.message });
      return productRedirect(res, 'error', 'Gagal menyimpan produk: ' + err.message);
    }
  },

  async editView(req, res) {
    try {
      const result = await getProductEditFormData(req.params.id);
      if (result.status === 'not_found') return productRedirect(res, 'error', result.error);

      return res.render('admin/products/edit', {
        title: 'Edit Produk - ' + result.product.name_id,
        pageTitle: 'Edit Produk Manufaktur',
        activeNav: 'products',
        product: result.product,
        categories: result.categories,
        productsList: result.productsList,
        error: null,
        csrfToken: res.locals?.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product editView error:', { message: err.message });
      return productRedirect(res, 'error', 'Gagal membuka form edit produk.');
    }
  },

  async update(req, res) {
    const { id } = req.params;
    try {
      const result = await updateAdminProduct(id, req.body, req.file);
      if (result.status === 'not_found') return productRedirect(res, 'error', result.error);
      if (result.status === 'validation_error') return productRedirect(res, 'error', result.error, `/${id}/edit`);
      return productRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Product update error:', { message: err.message });
      return productRedirect(res, 'error', err.message, `/${id}/edit`);
    }
  },

  async destroy(req, res) {
    const isJson = wantsJson(req);
    try {
      const result = await deleteAdminProduct(req.params.id);
      return respondDestroyResult(res, isJson, result);
    } catch (err) {
      logger.error('Product destroy error:', { message: err.message });
      return isJson
        ? res.status(500).json({ success: false, message: 'Gagal menghapus produk.' })
        : productRedirect(res, 'error', 'Gagal menghapus produk.');
    }
  }
};

export default productController;
