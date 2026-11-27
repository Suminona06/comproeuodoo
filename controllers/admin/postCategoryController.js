import {
  listPostCategories,
  createPostCategory,
  getPostCategoryById,
  updatePostCategory,
  deletePostCategory,
  bulkDeletePostCategories
} from '../../services/postCategoryService.js';
import logger from '../../utils/logger.js';

const postCategoryRedirect = (res, type, message) =>
  res.redirect(`/admin/post-categories?${type}=${encodeURIComponent(message)}`);

function renderCreateView(req, res, statusCode, { pageTitle, error = null, formData } = {}) {
  return res.status(statusCode).render('admin/post-categories/create', {
    title: 'Tambah Kategori Berita',
    pageTitle: pageTitle || 'Tambah Kategori Berita',
    activeNav: 'post-categories',
    error,
    ...(formData !== undefined ? { formData } : {}),
    csrfToken: res.locals.csrfToken || ''
  });
}

export const postCategoryController = {
  async index(req, res) {
    try {
      const data = await listPostCategories(req.query);
      return res.render('admin/post-categories/index', {
        title: 'Kategori Berita & Artikel',
        pageTitle: 'Kategori Publikasi',
        activeNav: 'post-categories',
        ...data,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Post category index error:', err);
      return res.status(500).render('admin/post-categories/index', {
        title: 'Kategori Berita',
        pageTitle: 'Kategori Publikasi',
        activeNav: 'post-categories',
        categories: [],
        currentType: null,
        error: 'Gagal memuat kategori artikel.',
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  createView(req, res) {
    renderCreateView(req, res, 200);
  },

  async store(req, res) {
    try {
      const result = await createPostCategory(req.body);
      if (result.status === 'validation_error') {
        return renderCreateView(req, res, 400, {
          pageTitle: 'Tambah Kategori',
          error: result.error,
          formData: req.body
        });
      }
      return postCategoryRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Post category store error:', err);
      return renderCreateView(req, res, 500, {
        pageTitle: 'Tambah Kategori',
        error: 'Gagal menyimpan kategori: ' + err.message,
        formData: req.body
      });
    }
  },

  async editView(req, res) {
    try {
      const result = await getPostCategoryById(req.params.id);
      if (result.status === 'not_found') return postCategoryRedirect(res, 'error', result.error);

      return res.render('admin/post-categories/edit', {
        title: 'Edit Kategori - ' + result.category.name_id,
        pageTitle: 'Edit Kategori Berita',
        activeNav: 'post-categories',
        category: result.category,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Post category editView error:', err);
      return postCategoryRedirect(res, 'error', 'Gagal membuka halaman edit.');
    }
  },

  async update(req, res) {
    try {
      const result = await updatePostCategory(req.params.id, req.body);
      if (result.status !== 'ok') return postCategoryRedirect(res, 'error', result.error);
      return postCategoryRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Post category update error:', err);
      return postCategoryRedirect(res, 'error', 'Gagal memperbarui kategori.');
    }
  },

  async destroy(req, res) {
    try {
      const result = await deletePostCategory(req.params.id);
      if (result.status === 'not_found') return postCategoryRedirect(res, 'error', result.error);
      return postCategoryRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Post category destroy error:', err);
      return postCategoryRedirect(res, 'error', 'Gagal menghapus kategori.');
    }
  },

  async bulkDestroy(req, res) {
    try {
      const result = await bulkDeletePostCategories(req.body);
      if (result.status === 'validation_error') {
        return res.status(400).json({ success: false, message: result.message });
      }
      if (result.status === 'not_found') {
        return res.status(404).json({ success: false, message: result.message });
      }
      return res.json({
        success: true,
        deletedCount: result.deletedCount,
        requestedCount: result.requestedCount,
        skippedIds: result.skippedIds,
        affectedItemsCount: result.affectedItemsCount,
        message: result.message
      });
    } catch (err) {
      logger.error('Post category bulkDestroy error:', { message: err.message });
      return res.status(500).json({ success: false, message: 'Gagal menghapus kategori berita terpilih.' });
    }
  }
};

export default postCategoryController;
