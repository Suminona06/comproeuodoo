import {
  listProductCategories,
  createProductCategory,
  getProductCategoryById,
  updateProductCategory,
  toggleProductCategoryStatus,
  deleteProductCategory
} from '../../services/productCategoryService.js';
import logger from '../../utils/logger.js';

const categoryRedirect = (res, type, message) =>
  res.redirect(`/admin/product-categories?${type}=${encodeURIComponent(message)}`);

function renderCreateView(req, res, statusCode, { pageTitle, error = null, formData } = {}) {
  return res.status(statusCode).render('admin/product-categories/create', {
    title: 'Tambah Kategori Produk',
    pageTitle: pageTitle || 'Tambah Kategori Produk',
    activeNav: 'product-categories',
    error,
    ...(formData !== undefined ? { formData } : {}),
    csrfToken: res.locals.csrfToken || ''
  });
}

export const productCategoryController = {
  async index(req, res) {
    try {
      const categories = await listProductCategories();
      res.render('admin/product-categories/index', {
        title: 'Kategori Produk',
        pageTitle: 'Kategori Produk',
        activeNav: 'product-categories',
        categories,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product category index error:', err);
      res.status(500).render('admin/product-categories/index', {
        title: 'Kategori Produk',
        pageTitle: 'Kategori Produk',
        activeNav: 'product-categories',
        categories: [],
        error: 'Gagal memuat kategori produk.',
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  createView(req, res) {
    renderCreateView(req, res, 200);
  },

  async store(req, res) {
    try {
      const result = await createProductCategory(req.body);
      if (result.status === 'validation_error') {
        return renderCreateView(req, res, 400, {
          pageTitle: 'Tambah Kategori',
          error: result.error,
          formData: req.body
        });
      }
      return categoryRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Product category store error:', err);
      return renderCreateView(req, res, 500, {
        pageTitle: 'Tambah Kategori',
        error: 'Gagal menyimpan kategori: ' + err.message,
        formData: req.body
      });
    }
  },

  async editView(req, res) {
    try {
      const result = await getProductCategoryById(req.params.id);
      if (result.status === 'not_found') return categoryRedirect(res, 'error', result.error);

      return res.render('admin/product-categories/edit', {
        title: 'Edit Kategori - ' + result.category.name_id,
        pageTitle: 'Edit Kategori Produk',
        activeNav: 'product-categories',
        category: result.category,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product category editView error:', err);
      return categoryRedirect(res, 'error', 'Gagal membuka halaman edit kategori.');
    }
  },

  async update(req, res) {
    try {
      const result = await updateProductCategory(req.params.id, req.body);
      if (result.status === 'not_found') return categoryRedirect(res, 'error', result.error);
      return categoryRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Product category update error:', err);
      return categoryRedirect(res, 'error', 'Gagal memperbarui kategori.');
    }
  },

  async toggleStatus(req, res) {
    try {
      const result = await toggleProductCategoryStatus(req.params.id);
      if (result.status === 'not_found') return categoryRedirect(res, 'error', result.error);
      return categoryRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Product category toggleStatus error:', err);
      return categoryRedirect(res, 'error', 'Gagal mengubah status kategori.');
    }
  },

  async destroy(req, res) {
    try {
      const result = await deleteProductCategory(req.params.id);
      if (result.status === 'not_found') return categoryRedirect(res, 'error', result.error);
      return categoryRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Product category destroy error:', err);
      return categoryRedirect(res, 'error', 'Gagal menghapus kategori.');
    }
  }
};

export default productCategoryController;
