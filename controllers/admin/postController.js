import {
  getAdminPostList,
  getPostFormCategories,
  getPostEditData,
  createAdminPost,
  updateAdminPost,
  deleteAdminPost,
  uploadPostEditorImage
} from '../../services/postService.js';
import logger from '../../utils/logger.js';

const postRedirect = (res, type, message) =>
  res.redirect(`/admin/posts?${type}=${encodeURIComponent(message)}`);

function renderCreateError(req, res, result) {
  return res.status(400).render('admin/posts/create', {
    title: 'Tulis Artikel Baru',
    pageTitle: 'Tulis Artikel',
    activeNav: 'posts',
    categories: result.categories,
    error: result.error,
    formData: req.body,
    csrfToken: res.locals.csrfToken || ''
  });
}

function renderEditError(req, res, result) {
  return res.status(400).render('admin/posts/edit', {
    title: 'Edit Artikel - ' + result.post.title_id,
    pageTitle: 'Edit Artikel',
    activeNav: 'posts',
    post: { ...result.post, ...req.body },
    categories: result.categories,
    error: result.error,
    csrfToken: res.locals.csrfToken || ''
  });
}

export const postController = {
  async index(req, res) {
    try {
      const data = await getAdminPostList(req.query);
      return res.render('admin/posts/index', {
        title: 'Manajemen Berita & Artikel',
        pageTitle: 'Berita & Artikel Publikasi',
        activeNav: 'posts',
        ...data,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Post index error:', { message: err.message });
      return res.status(500).render('admin/posts/index', {
        title: 'Berita & Artikel',
        pageTitle: 'Berita & Publikasi',
        activeNav: 'posts',
        posts: [],
        categories: [],
        currentType: null,
        currentStatus: null,
        searchQuery: null,
        error: 'Gagal memuat daftar artikel.',
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  async createView(req, res) {
    try {
      const categories = await getPostFormCategories();
      return res.render('admin/posts/create', {
        title: 'Tulis Artikel Baru',
        pageTitle: 'Tulis Artikel Baru',
        activeNav: 'posts',
        categories,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Post createView error:', err);
      return postRedirect(res, 'error', 'Gagal membuka form tulis artikel.');
    }
  },

  async store(req, res) {
    try {
      const result = await createAdminPost(req.body, req.file);
      if (result.status === 'validation_error') return renderCreateError(req, res, result);
      return postRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Post store error:', { message: err.message });
      return postRedirect(res, 'error', 'Gagal menyimpan artikel: ' + err.message);
    }
  },

  async editView(req, res) {
    try {
      const result = await getPostEditData(req.params.id);
      if (result.status === 'not_found') return postRedirect(res, 'error', result.error);

      return res.render('admin/posts/edit', {
        title: 'Edit Artikel - ' + result.post.title_id,
        pageTitle: 'Edit Artikel',
        activeNav: 'posts',
        post: result.post,
        categories: result.categories,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Post editView error:', err);
      return postRedirect(res, 'error', 'Gagal membuka halaman edit artikel.');
    }
  },

  async update(req, res) {
    try {
      const result = await updateAdminPost(req.params.id, req.body, req.file);
      if (result.status === 'not_found') return postRedirect(res, 'error', result.error);
      if (result.status === 'validation_error') return renderEditError(req, res, result);
      return postRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Post update error:', err);
      return postRedirect(res, 'error', 'Gagal memperbarui artikel: ' + err.message);
    }
  },

  async destroy(req, res) {
    try {
      const result = await deleteAdminPost(req.params.id);
      if (result.status === 'not_found') return postRedirect(res, 'error', result.error);
      return postRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Post destroy error:', err);
      return postRedirect(res, 'error', 'Gagal menghapus artikel.');
    }
  },

  async uploadEditorImage(req, res) {
    try {
      const result = await uploadPostEditorImage(req.file);
      if (result.status === 'validation_error') return res.status(400).json({ error: result.error });
      return res.status(200).json({ location: result.location });
    } catch (err) {
      logger.error('TinyMCE uploadEditorImage error:', { message: err.message });
      return res.status(500).json({ error: 'Gagal memproses gambar: ' + err.message });
    }
  }
};

export default postController;
