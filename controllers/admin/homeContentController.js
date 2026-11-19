import {
  getAdminHomeContentData,
  updateAdminHomeContent
} from '../../services/homeContentService.js';
import logger from '../../utils/logger.js';

export const homeContentController = {
  async index(req, res) {
    try {
      const { homeContent, allCategories, allowedKickerIcons } = await getAdminHomeContentData();
      res.render('admin/home-content/index', {
        title: 'Manajemen Konten Homepage - PT Euodoo CMS',
        activeNav: 'home-content',
        homeContent,
        allCategories,
        allowedKickerIcons,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('homeContentController.index error:', { message: err.message, stack: err.stack });
      res.redirect('/admin/dashboard?error=Gagal+memuat+halaman+konten+homepage.');
    }
  },

  async update(req, res) {
    try {
      await updateAdminHomeContent(req.body);
      logger.info('homeContentController: Home content successfully updated');
      return res.redirect('/admin/home-content?success=Konten+homepage+berhasil+diperbarui.');
    } catch (err) {
      logger.error('homeContentController.update error:', { message: err.message, stack: err.stack });
      return res.redirect(`/admin/home-content?error=${encodeURIComponent('Gagal memperbarui konten: ' + err.message)}`);
    }
  }
};

export default homeContentController;
