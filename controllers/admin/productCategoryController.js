import productCategoryModel from '../../models/productCategoryModel.js';
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

export const productCategoryController = {
  async index(req, res) {
    try {
      const categories = await productCategoryModel.findAll();
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
    res.render('admin/product-categories/create', {
      title: 'Tambah Kategori Produk',
      pageTitle: 'Tambah Kategori Produk',
      activeNav: 'product-categories',
      error: null,
      csrfToken: res.locals.csrfToken || ''
    });
  },

  async store(req, res) {
    try {
      const { name_id, name_en, description_id, description_en, sort_order, is_active } = req.body;

      if (!name_id || name_id.trim() === '') {
        return res.status(400).render('admin/product-categories/create', {
          title: 'Tambah Kategori Produk',
          pageTitle: 'Tambah Kategori',
          activeNav: 'product-categories',
          error: 'Nama kategori wajib diisi.',
          formData: req.body,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      const isActive = (is_active === '1' || is_active === 'on' || is_active === 1 || is_active === true) ? 1 : 0;
      const slug = slugify(name_id);
      await productCategoryModel.create({
        name_id: name_id.trim(),
        name_en: name_en ? name_en.trim() : name_id.trim(),
        slug,
        description_id: description_id ? description_id.trim() : null,
        description_en: description_en ? description_en.trim() : null,
        sort_order: parseInt(sort_order || '0', 10),
        is_active: isActive
      });

      res.redirect('/admin/product-categories?success=' + encodeURIComponent('Kategori berhasil ditambahkan.'));
    } catch (err) {
      logger.error('Product category store error:', err);
      res.status(500).render('admin/product-categories/create', {
        title: 'Tambah Kategori Produk',
        pageTitle: 'Tambah Kategori',
        activeNav: 'product-categories',
        error: 'Gagal menyimpan kategori: ' + err.message,
        formData: req.body,
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  async editView(req, res) {
    try {
      const category = await productCategoryModel.findById(req.params.id);
      if (!category) {
        return res.redirect('/admin/product-categories?error=' + encodeURIComponent('Kategori tidak ditemukan.'));
      }

      res.render('admin/product-categories/edit', {
        title: 'Edit Kategori - ' + category.name_id,
        pageTitle: 'Edit Kategori Produk',
        activeNav: 'product-categories',
        category,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product category editView error:', err);
      res.redirect('/admin/product-categories?error=' + encodeURIComponent('Gagal membuka halaman edit kategori.'));
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name_id, name_en, description_id, description_en, sort_order, is_active } = req.body;

      const category = await productCategoryModel.findById(id);
      if (!category) {
        return res.redirect('/admin/product-categories?error=' + encodeURIComponent('Kategori tidak ditemukan.'));
      }

      const isActive = (is_active === '1' || is_active === 'on' || is_active === 1 || is_active === true) ? 1 : 0;

      await productCategoryModel.update(id, {
        name_id: name_id ? name_id.trim() : category.name_id,
        name_en: name_en ? name_en.trim() : category.name_en,
        slug: name_id ? slugify(name_id) : category.slug,
        description_id: description_id !== undefined ? description_id.trim() : category.description_id,
        description_en: description_en !== undefined ? description_en.trim() : category.description_en,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : category.sort_order,
        is_active: isActive
      });

      res.redirect('/admin/product-categories?success=' + encodeURIComponent('Kategori berhasil diperbarui.'));
    } catch (err) {
      logger.error('Product category update error:', err);
      res.redirect('/admin/product-categories?error=' + encodeURIComponent('Gagal memperbarui kategori.'));
    }
  },

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const result = await productCategoryModel.toggleActive(id);
      if (!result) {
        return res.redirect('/admin/product-categories?error=' + encodeURIComponent('Kategori tidak ditemukan.'));
      }
      const statusText = result.is_active ? 'diaktifkan' : 'dinonaktifkan';
      res.redirect('/admin/product-categories?success=' + encodeURIComponent(`Kategori "${result.name_id}" berhasil ${statusText}.`));
    } catch (err) {
      logger.error('Product category toggleStatus error:', err);
      res.redirect('/admin/product-categories?error=' + encodeURIComponent('Gagal mengubah status kategori.'));
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await productCategoryModel.delete(id);
      res.redirect('/admin/product-categories?success=' + encodeURIComponent('Kategori berhasil dihapus.'));
    } catch (err) {
      logger.error('Product category destroy error:', err);
      res.redirect('/admin/product-categories?error=' + encodeURIComponent('Gagal menghapus kategori.'));
    }
  }
};

export default productCategoryController;
