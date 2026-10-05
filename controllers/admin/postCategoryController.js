import postCategoryModel from '../../models/postCategoryModel.js';
import logger from '../../utils/logger.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export const postCategoryController = {
  async index(req, res) {
    try {
      const type = req.query.type || null;
      const categories = await postCategoryModel.findAll({ type });
      res.render('admin/post-categories/index', {
        title: 'Kategori Berita & Artikel',
        pageTitle: 'Kategori Publikasi',
        activeNav: 'post-categories',
        categories,
        currentType: type,
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('Post category index error:', err);
      res.status(500).render('admin/post-categories/index', {
        title: 'Kategori Berita',
        pageTitle: 'Kategori Publikasi',
        activeNav: 'post-categories',
        categories: [],
        currentType: null,
        error: 'Gagal memuat kategori artikel.'
      });
    }
  },

  createView(req, res) {
    res.render('admin/post-categories/create', {
      title: 'Tambah Kategori Berita',
      pageTitle: 'Tambah Kategori Berita',
      activeNav: 'post-categories',
      error: null
    });
  },

  async store(req, res) {
    try {
      const { name_id, name_en, type, sort_order } = req.body;

      if (!name_id || name_id.trim() === '') {
        return res.status(400).render('admin/post-categories/create', {
          title: 'Tambah Kategori Berita',
          pageTitle: 'Tambah Kategori',
          activeNav: 'post-categories',
          error: 'Nama kategori wajib diisi.',
          formData: req.body
        });
      }

      const slug = slugify(name_id);
      await postCategoryModel.create({
        name_id: name_id.trim(),
        name_en: name_en ? name_en.trim() : name_id.trim(),
        slug,
        type: type || 'berita',
        sort_order: parseInt(sort_order || '0', 10)
      });

      res.redirect('/admin/post-categories?success=' + encodeURIComponent('Kategori berita berhasil ditambahkan.'));
    } catch (err) {
      logger.error('Post category store error:', err);
      res.status(500).render('admin/post-categories/create', {
        title: 'Tambah Kategori Berita',
        pageTitle: 'Tambah Kategori',
        activeNav: 'post-categories',
        error: 'Gagal menyimpan kategori: ' + err.message,
        formData: req.body
      });
    }
  },

  async editView(req, res) {
    try {
      const category = await postCategoryModel.findById(req.params.id);
      if (!category) {
        return res.redirect('/admin/post-categories?error=' + encodeURIComponent('Kategori tidak ditemukan.'));
      }

      res.render('admin/post-categories/edit', {
        title: 'Edit Kategori - ' + category.name_id,
        pageTitle: 'Edit Kategori Berita',
        activeNav: 'post-categories',
        category,
        error: null
      });
    } catch (err) {
      logger.error('Post category editView error:', err);
      res.redirect('/admin/post-categories?error=' + encodeURIComponent('Gagal membuka halaman edit.'));
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name_id, name_en, type, sort_order } = req.body;

      const category = await postCategoryModel.findById(id);
      if (!category) {
        return res.redirect('/admin/post-categories?error=' + encodeURIComponent('Kategori tidak ditemukan.'));
      }

      await postCategoryModel.update(id, {
        name_id: name_id ? name_id.trim() : category.name_id,
        name_en: name_en ? name_en.trim() : category.name_en,
        slug: name_id ? slugify(name_id) : category.slug,
        type: type || category.type,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : category.sort_order
      });

      res.redirect('/admin/post-categories?success=' + encodeURIComponent('Kategori berita berhasil diperbarui.'));
    } catch (err) {
      logger.error('Post category update error:', err);
      res.redirect('/admin/post-categories?error=' + encodeURIComponent('Gagal memperbarui kategori.'));
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await postCategoryModel.delete(id);
      res.redirect('/admin/post-categories?success=' + encodeURIComponent('Kategori berita berhasil dihapus.'));
    } catch (err) {
      logger.error('Post category destroy error:', err);
      res.redirect('/admin/post-categories?error=' + encodeURIComponent('Gagal menghapus kategori.'));
    }
  }
};

export default postCategoryController;
