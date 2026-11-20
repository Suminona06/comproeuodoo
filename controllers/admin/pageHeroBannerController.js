import {
  listPageHeroBanners,
  updatePageHeroBanner
} from '../../services/pageHeroBannerService.js';
import logger from '../../utils/logger.js';

const heroRedirect = (res, type, message) =>
  res.redirect(`/admin/hero-banners?${type}=${encodeURIComponent(message)}`);

export const pageHeroBannerController = {
  async index(req, res) {
    try {
      const banners = await listPageHeroBanners();
      res.render('admin/hero-banners/index', {
        title: 'Hero Banner Per Halaman - PT Euodoo CMS',
        pageTitle: 'Hero Banner Per Halaman Publik',
        activeNav: 'hero-banners',
        banners,
        csrfToken: res.locals.csrfToken || '',
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('pageHeroBannerController.index error:', err);
      res.redirect('/admin/dashboard?error=' + encodeURIComponent('Gagal memuat hero banner per halaman.'));
    }
  },

  async update(req, res) {
    try {
      const { pageKey } = req.params;
      const result = await updatePageHeroBanner(pageKey, req.body, req.file);
      if (result.status === 'validation_error') {
        return heroRedirect(res, 'error', result.error);
      }

      logger.info(`Hero banner for page '${pageKey}' updated successfully by ${req.user?.email || 'admin'}`);
      return heroRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('pageHeroBannerController.update error:', err);
      return heroRedirect(res, 'error', 'Gagal memperbarui hero banner.');
    }
  }
};

export default pageHeroBannerController;
