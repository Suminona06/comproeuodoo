import {
  listBanners,
  getBannerById,
  createBanner,
  updateBanner,
  toggleBannerStatus,
  deleteBanner
} from '../../services/bannerService.js';
import { cleanupTempFile } from '../../middleware/uploadMiddleware.js';
import logger from '../../utils/logger.js';

const bannerRedirect = (res, type, message) =>
  res.redirect(`/admin/banners?${type}=${encodeURIComponent(message)}`);

function renderCreateBannerView(res, { statusCode, error = null, formData = {} } = {}) {
  const target = statusCode ? res.status(statusCode) : res;
  return target.render('admin/banners/create', {
    title: 'Tambah Banner Hero',
    pageTitle: 'Tambah Banner Hero',
    activeNav: 'banners',
    error,
    formData,
    csrfToken: res.locals.csrfToken || ''
  });
}

function renderEditBannerView(res, banner, { statusCode, error = null } = {}) {
  const target = statusCode ? res.status(statusCode) : res;
  return target.render('admin/banners/edit', {
    title: 'Edit Banner - ' + banner.title_id,
    pageTitle: 'Edit Banner Hero',
    activeNav: 'banners',
    banner,
    error,
    csrfToken: res.locals.csrfToken || ''
  });
}

export const bannerController = {
  async index(req, res) {
    try {
      const banners = await listBanners();
      return res.render('admin/banners/index', {
        title: 'Manajemen Banner Hero',
        pageTitle: 'Banner Hero Beranda',
        activeNav: 'banners',
        banners,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Banner index error:', { message: err.message });
      return res.status(500).render('admin/banners/index', {
        title: 'Manajemen Banner Hero',
        pageTitle: 'Banner Hero',
        activeNav: 'banners',
        banners: [],
        error: 'Gagal mengambil data banner.',
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  createView(req, res) {
    return renderCreateBannerView(res);
  },

  async store(req, res) {
    try {
      const result = await createBanner(req.body, req.file);
      if (result.status === 'validation_error') {
        return renderCreateBannerView(res, {
          statusCode: 400,
          error: result.error,
          formData: req.body
        });
      }
      return bannerRedirect(res, 'success', 'Banner baru berhasil ditambahkan.');
    } catch (err) {
      logger.error('Banner store error:', { message: err.message });
      return bannerRedirect(res, 'error', 'Gagal menyimpan banner: ' + err.message);
    } finally {
      await cleanupTempFile(req.file);
    }
  },

  async editView(req, res) {
    try {
      const banner = await getBannerById(req.params.id);
      if (!banner) {
        return bannerRedirect(res, 'error', 'Banner tidak ditemukan.');
      }
      return renderEditBannerView(res, banner);
    } catch (err) {
      logger.error('Banner editView error:', err);
      return bannerRedirect(res, 'error', 'Gagal membuka halaman edit banner.');
    }
  },

  async update(req, res) {
    try {
      const result = await updateBanner(req.params.id, req.body, req.file);
      if (result.status === 'not_found') {
        return bannerRedirect(res, 'error', result.error);
      }
      if (result.status === 'validation_error') {
        return renderEditBannerView(
          res,
          { ...result.banner, ...req.body },
          { statusCode: 400, error: result.error }
        );
      }
      return bannerRedirect(res, 'success', 'Banner berhasil diperbarui.');
    } catch (err) {
      logger.error('Banner update error:', err);
      return bannerRedirect(res, 'error', 'Gagal memperbarui banner: ' + err.message);
    } finally {
      await cleanupTempFile(req.file);
    }
  },

  async toggleStatus(req, res) {
    try {
      const result = await toggleBannerStatus(req.params.id);
      if (result.status !== 'ok') {
        return bannerRedirect(res, 'error', result.error);
      }
      return bannerRedirect(res, 'success', 'Status banner berhasil diperbarui.');
    } catch (err) {
      logger.error('Banner toggleStatus error:', { message: err.message });
      return bannerRedirect(res, 'error', 'Gagal mengubah status banner.');
    }
  },

  async destroy(req, res) {
    try {
      const result = await deleteBanner(req.params.id);
      if (result.status !== 'ok') {
        return bannerRedirect(res, 'error', result.error);
      }
      return bannerRedirect(res, 'success', 'Banner berhasil dihapus.');
    } catch (err) {
      logger.error('Banner destroy error:', { message: err.message });
      return bannerRedirect(res, 'error', 'Gagal menghapus banner.');
    }
  }
};

export default bannerController;
