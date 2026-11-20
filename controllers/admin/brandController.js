import {
  listBrands,
  getBrandById,
  updateBrandSectionTitle,
  createBrand,
  updateBrand,
  deleteBrand,
  toggleBrandStatus
} from '../../services/brandService.js';
import logger from '../../utils/logger.js';

const wantsJson = (req) => Boolean(req.xhr || req.headers?.accept?.includes('application/json'));

const brandRedirect = (res, type, message) =>
  res.redirect(`/admin/brands?${type}=${encodeURIComponent(message)}`);

function renderCreateBrandView(res, { statusCode, error = null, formData } = {}) {
  const target = statusCode ? res.status(statusCode) : res;
  return target.render('admin/brands/create', {
    title: 'Tambah Merek Baru',
    pageTitle: 'Tambah Merek',
    activeNav: 'brands',
    error,
    formData
  });
}

export const brandController = {
  async index(req, res) {
    try {
      const brands = await listBrands();
      return res.render('admin/brands/index', {
        title: 'Manajemen Merek Terdaftar',
        pageTitle: 'Merek Terdaftar (Our Brands)',
        activeNav: 'brands',
        brands,
        settings: res.locals.settings || {},
        csrfToken: res.locals.csrfToken || '',
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('Brand controller index error:', err);
      return res.status(500).render('admin/brands/index', {
        title: 'Manajemen Merek',
        pageTitle: 'Merek Terdaftar',
        activeNav: 'brands',
        brands: [],
        settings: res.locals.settings || {},
        csrfToken: res.locals.csrfToken || '',
        error: 'Gagal memuat daftar merek perusahaan.'
      });
    }
  },

  async updateSectionTitle(req, res) {
    try {
      const result = await updateBrandSectionTitle(req.body);
      if (result.status !== 'ok') {
        return brandRedirect(res, 'error', result.error);
      }
      return brandRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Brand updateSectionTitle error:', err);
      return brandRedirect(res, 'error', 'Gagal memperbarui judul section merek: ' + err.message);
    }
  },

  createView(req, res) {
    return renderCreateBrandView(res);
  },

  async store(req, res) {
    try {
      const result = await createBrand(req.body, req.file);
      if (result.status === 'validation_error') {
        return renderCreateBrandView(res, {
          statusCode: 400,
          error: result.error,
          formData: req.body
        });
      }
      return brandRedirect(res, 'success', 'Merek baru berhasil ditambahkan.');
    } catch (err) {
      logger.error('Brand controller store error:', err);
      return renderCreateBrandView(res, {
        statusCode: 500,
        error: 'Gagal menyimpan merek: ' + err.message,
        formData: req.body
      });
    }
  },

  async editView(req, res) {
    try {
      const brand = await getBrandById(req.params.id);
      if (!brand) {
        return brandRedirect(res, 'error', 'Merek tidak ditemukan.');
      }
      return res.render('admin/brands/edit', {
        title: 'Edit Merek - ' + brand.name,
        pageTitle: 'Edit Merek',
        activeNav: 'brands',
        brand,
        error: null
      });
    } catch (err) {
      logger.error('Brand controller editView error:', err);
      return brandRedirect(res, 'error', 'Gagal membuka form edit merek.');
    }
  },

  async update(req, res) {
    try {
      const result = await updateBrand(req.params.id, req.body, req.file);
      if (result.status !== 'ok') {
        return brandRedirect(res, 'error', result.error);
      }
      return brandRedirect(res, 'success', 'Data merek berhasil diperbarui.');
    } catch (err) {
      logger.error('Brand controller update error:', err);
      return brandRedirect(res, 'error', 'Gagal memperbarui merek.');
    }
  },

  async destroy(req, res) {
    try {
      const result = await deleteBrand(req.params.id);
      if (result.status !== 'ok') {
        return brandRedirect(res, 'error', result.error);
      }
      return brandRedirect(res, 'success', 'Merek berhasil dihapus.');
    } catch (err) {
      logger.error('Brand controller destroy error:', err);
      return brandRedirect(res, 'error', 'Gagal menghapus merek.');
    }
  },

  async toggleStatus(req, res) {
    const isJson = wantsJson(req);
    try {
      const result = await toggleBrandStatus(req.params.id);
      if (result.status === 'not_found') {
        return isJson
          ? res.status(404).json({ success: false, message: result.error })
          : brandRedirect(res, 'error', result.error);
      }
      return isJson
        ? res.json({ success: true, is_active: result.isActive })
        : brandRedirect(res, 'success', 'Status merek berhasil diperbarui.');
    } catch (err) {
      logger.error('Brand controller toggleStatus error:', err);
      return isJson
        ? res.status(500).json({ success: false, message: err.message })
        : brandRedirect(res, 'error', 'Gagal mengubah status merek.');
    }
  }
};

export default brandController;
