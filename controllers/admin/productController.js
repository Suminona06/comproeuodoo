import productModel, { normalizeSizeTable } from '../../models/productModel.js';
import productCategoryModel from '../../models/productCategoryModel.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import storage from '../../config/storage.js';
import { sendCsvResponse } from '../../utils/csvExporter.js';
import { invalidateSitemapCache } from '../../utils/sitemapGenerator.js';
import logger from '../../utils/logger.js';
import {
  parseDynamicSizeTable,
  parseSizeTable,
  getProductsWithSizeTable,
  buildProductCsvExport
} from '../../services/productSizeTableService.js';
import {
  validateProductFields,
  parseProductListFilters,
  resolveGalleryItems,
  buildProductCreateData,
  buildProductUpdateData
} from '../../services/productService.js';

export { parseDynamicSizeTable, parseSizeTable, getProductsWithSizeTable };

const wantsJson = (req) => Boolean(
  req.xhr || req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'fetch' || req.query.format === 'json'
);

function renderAsyncAppView(app, view, locals) {
  return new Promise((resolve, reject) => {
    app.render(view, locals, (err, html) => (err ? reject(err) : resolve(html)));
  });
}

async function renderCreateFormError(req, res, errorMsg) {
  const [categories, productsList] = await Promise.all([
    productCategoryModel.findAll({ activeOnly: true }),
    getProductsWithSizeTable()
  ]);
  return res.status(400).render('admin/products/create', {
    title: 'Tambah Produk Baru',
    pageTitle: 'Tambah Produk',
    activeNav: 'products',
    categories,
    productsList: productsList || [],
    error: errorMsg,
    formData: req.body,
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
  if (wantsJson(req)) return res.status(500).json({ success: false, message: 'Gagal memuat katalog produk.' });
  return res.status(500).render('admin/products/index', {
    title: 'Manajemen Produk', pageTitle: 'Katalog Produk', activeNav: 'products',
    products: [], categories: [], selectedCategory: null, selectedStatus: null, searchQuery: null,
    currentPage: 1, perPage: 10, totalPages: 1, totalCount: 0,
    error: 'Gagal memuat katalog produk.', csrfToken: res.locals.csrfToken || ''
  });
}

async function resolveUpdatedImageUrl(req, product) {
  if (!req.file) {
    if (req.body.image_url === undefined) return undefined;
    return req.body.image_url ? req.body.image_url.trim() : null;
  }
  if (product.image_url) await storage.delete(product.image_url);
  return processAndSaveWebP(req.file.buffer, 'products');
}

export const productController = {
  getProductsWithSizeTable,

  async index(req, res) {
    try {
      const filters = parseProductListFilters(req.query);
      const [totalCount, categories] = await Promise.all([
        productModel.countAll({ categoryId: filters.categoryId, status: filters.status, search: filters.search }),
        productCategoryModel.findAll({ activeOnly: false })
      ]);

      const totalPages = Math.max(1, Math.ceil(totalCount / filters.perPage));
      const currentPage = Math.min(filters.parsedPage, totalPages);
      const products = await productModel.findAll({
        categoryId: filters.categoryId,
        status: filters.status,
        search: filters.search,
        limit: filters.perPage,
        offset: (currentPage - 1) * filters.perPage
      });

      const sharedViewState = {
        products,
        selectedCategory: filters.categoryId,
        selectedStatus: filters.status,
        searchQuery: filters.search || '',
        currentPage,
        perPage: filters.perPage,
        totalPages,
        totalCount,
        csrfToken: res.locals.csrfToken || ''
      };

      if (wantsJson(req)) return renderIndexJsonResponse(req, res, sharedViewState, filters);

      return res.render('admin/products/index', {
        title: 'Manajemen Katalog Produk',
        pageTitle: 'Katalog Produk Manufaktur',
        activeNav: 'products',
        categories,
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
      const products = await productModel.findAll();
      const { columns, rows } = buildProductCsvExport(products);
      const filename = `katalog-produk-euodoo-${new Date().toISOString().slice(0, 10)}.csv`;
      sendCsvResponse(res, filename, columns, rows);
    } catch (err) {
      logger.error('Product export CSV error:', err);
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal mengekspor data produk ke CSV.'));
    }
  },

  async createView(req, res) {
    try {
      const [categories, productsList] = await Promise.all([
        productCategoryModel.findAll({ activeOnly: true }),
        getProductsWithSizeTable()
      ]);
      res.render('admin/products/create', {
        title: 'Tambah Produk Baru',
        pageTitle: 'Tambah Produk Manufaktur',
        activeNav: 'products',
        categories,
        productsList: productsList || [],
        error: null,
        csrfToken: res.locals?.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product createView error:', { message: err.message });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal membuka form tambah produk.'));
    }
  },

  async getSizeTableColumns(req, res) {
    try {
      const product = await productModel.findById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      const sizeTable = normalizeSizeTable(product.size_table);
      const columns = (sizeTable.columns || []).map((c, idx) => ({ id: `col_${idx + 1}`, label: c.label || '' }));
      return res.json({ success: true, columns });
    } catch (err) {
      logger.error('getSizeTableColumns error:', { message: err.message });
      return res.status(500).json({ success: false, message: 'Gagal mengambil struktur kolom produk.' });
    }
  },

  async store(req, res) {
    try {
      const validation = validateProductFields(req.body, { requireNameId: true });
      if (validation.error) return renderCreateFormError(req, res, validation.error);

      let sizeTable = null;
      try {
        sizeTable = parseDynamicSizeTable(req.body);
      } catch (valErr) {
        return renderCreateFormError(req, res, valErr.message);
      }

      let imageUrl = req.body.image_url ? req.body.image_url.trim() : null;
      if (req.file) imageUrl = await processAndSaveWebP(req.file.buffer, 'products');

      await productModel.create(buildProductCreateData(req.body, { ...validation, imageUrl, sizeTable }));
      invalidateSitemapCache();
      res.redirect('/admin/products?success=' + encodeURIComponent('Produk baru berhasil ditambahkan.'));
    } catch (err) {
      logger.error('Product store error:', { message: err.message });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal menyimpan produk: ' + err.message));
    }
  },

  async editView(req, res) {
    try {
      const [product, categories] = await Promise.all([
        productModel.findById(req.params.id),
        productCategoryModel.findAll({ activeOnly: false })
      ]);
      if (!product) return res.redirect('/admin/products?error=' + encodeURIComponent('Produk tidak ditemukan.'));

      product.gallery_items = await resolveGalleryItems(product.gallery_images);
      const productsList = await getProductsWithSizeTable(product.id);

      res.render('admin/products/edit', {
        title: 'Edit Produk - ' + product.name_id,
        pageTitle: 'Edit Produk Manufaktur',
        activeNav: 'products',
        product,
        categories,
        productsList: productsList || [],
        error: null,
        csrfToken: res.locals?.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product editView error:', { message: err.message });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal membuka form edit produk.'));
    }
  },

  async update(req, res) {
    const { id } = req.params;
    try {
      const product = await productModel.findById(id);
      if (!product) return res.redirect('/admin/products?error=' + encodeURIComponent('Produk tidak ditemukan.'));

      const validation = validateProductFields(req.body);
      if (validation.error) return res.redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent(validation.error));

      const updateData = buildProductUpdateData(req.body, product, validation);
      const nextImageUrl = await resolveUpdatedImageUrl(req, product);
      if (nextImageUrl !== undefined) updateData.image_url = nextImageUrl;

      await productModel.update(id, updateData);
      invalidateSitemapCache();
      res.redirect('/admin/products?success=' + encodeURIComponent('Produk berhasil diperbarui.'));
    } catch (err) {
      logger.error('Product update error:', { message: err.message });
      res.redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent(err.message));
    }
  },

  async destroy(req, res) {
    try {
      const product = await productModel.findById(req.params.id);
      if (product?.image_url) await storage.delete(product.image_url);
      await productModel.delete(req.params.id);
      invalidateSitemapCache();

      if (wantsJson(req)) return res.json({ success: true, message: 'Produk berhasil dihapus.' });
      res.redirect('/admin/products?success=' + encodeURIComponent('Produk berhasil dihapus.'));
    } catch (err) {
      logger.error('Product destroy error:', { message: err.message });
      if (wantsJson(req)) return res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal menghapus produk.'));
    }
  }
};

export default productController;
