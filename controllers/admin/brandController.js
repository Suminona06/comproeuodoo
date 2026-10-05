import brandModel from '../../models/brandModel.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import storage from '../../config/storage.js';
import logger from '../../utils/logger.js';

export const brandController = {
  async index(req, res) {
    try {
      const brands = await brandModel.findAll();
      res.render('admin/brands/index', {
        title: 'Manajemen Merek Terdaftar',
        pageTitle: 'Merek Terdaftar (Our Brands)',
        activeNav: 'brands',
        brands,
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('Brand controller index error:', err);
      res.status(500).render('admin/brands/index', {
        title: 'Manajemen Merek',
        pageTitle: 'Merek Terdaftar',
        activeNav: 'brands',
        brands: [],
        error: 'Gagal memuat daftar merek perusahaan.'
      });
    }
  },

  createView(req, res) {
    res.render('admin/brands/create', {
      title: 'Tambah Merek Baru',
      pageTitle: 'Tambah Merek',
      activeNav: 'brands',
      error: null
    });
  },

  async store(req, res) {
    try {
      const { name, description_id, description_en, sort_order, is_active } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).render('admin/brands/create', {
          title: 'Tambah Merek Baru',
          pageTitle: 'Tambah Merek',
          activeNav: 'brands',
          error: 'Nama merek wajib diisi.',
          formData: req.body
        });
      }

      let logoUrl = null;
      if (req.file) {
        logoUrl = await processAndSaveWebP(req.file.buffer, 'brands');
      }

      await brandModel.create({
        name: name.trim(),
        logo_url: logoUrl,
        description_id: description_id ? description_id.trim() : null,
        description_en: description_en ? description_en.trim() : null,
        sort_order: parseInt(sort_order || '0', 10),
        is_active: is_active === 'on' || is_active === '1' || is_active === true
      });

      res.redirect('/admin/brands?success=' + encodeURIComponent('Merek baru berhasil ditambahkan.'));
    } catch (err) {
      logger.error('Brand controller store error:', err);
      res.status(500).render('admin/brands/create', {
        title: 'Tambah Merek Baru',
        pageTitle: 'Tambah Merek',
        activeNav: 'brands',
        error: 'Gagal menyimpan merek: ' + err.message,
        formData: req.body
      });
    }
  },

  async editView(req, res) {
    try {
      const brand = await brandModel.findById(req.params.id);
      if (!brand) {
        return res.redirect('/admin/brands?error=' + encodeURIComponent('Merek tidak ditemukan.'));
      }

      res.render('admin/brands/edit', {
        title: 'Edit Merek - ' + brand.name,
        pageTitle: 'Edit Merek',
        activeNav: 'brands',
        brand,
        error: null
      });
    } catch (err) {
      logger.error('Brand controller editView error:', err);
      res.redirect('/admin/brands?error=' + encodeURIComponent('Gagal membuka form edit merek.'));
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description_id, description_en, sort_order, is_active } = req.body;

      const brand = await brandModel.findById(id);
      if (!brand) {
        return res.redirect('/admin/brands?error=' + encodeURIComponent('Merek tidak ditemukan.'));
      }

      const updateData = {
        name: name ? name.trim() : brand.name,
        description_id: description_id !== undefined ? description_id.trim() : brand.description_id,
        description_en: description_en !== undefined ? description_en.trim() : brand.description_en,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : brand.sort_order,
        is_active: is_active === 'on' || is_active === '1' || is_active === true
      };

      if (req.file) {
        if (brand.logo_url) {
          await storage.delete(brand.logo_url);
        }
        updateData.logo_url = await processAndSaveWebP(req.file.buffer, 'brands');
      }

      await brandModel.update(id, updateData);
      res.redirect('/admin/brands?success=' + encodeURIComponent('Data merek berhasil diperbarui.'));
    } catch (err) {
      logger.error('Brand controller update error:', err);
      res.redirect('/admin/brands?error=' + encodeURIComponent('Gagal memperbarui merek.'));
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const brand = await brandModel.findById(id);
      if (brand && brand.logo_url) {
        await storage.delete(brand.logo_url);
      }
      await brandModel.delete(id);
      res.redirect('/admin/brands?success=' + encodeURIComponent('Merek berhasil dihapus.'));
    } catch (err) {
      logger.error('Brand controller destroy error:', err);
      res.redirect('/admin/brands?error=' + encodeURIComponent('Gagal menghapus merek.'));
    }
  },

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const result = await brandModel.toggleActive(id);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, is_active: result });
      }
      res.redirect('/admin/brands?success=' + encodeURIComponent('Status merek berhasil diperbarui.'));
    } catch (err) {
      logger.error('Brand controller toggleStatus error:', err);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.redirect('/admin/brands?error=' + encodeURIComponent('Gagal mengubah status merek.'));
    }
  }
};

export default brandController;
