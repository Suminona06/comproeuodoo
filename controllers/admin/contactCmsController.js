import {
  getSettingsMap,
  updateContactSettings,
  SettingValidationError
} from '../../services/settingService.js';
import logger from '../../utils/logger.js';

function formatContactErrorMessage(err) {
  if (err instanceof SettingValidationError || err?.isValidationError) {
    return 'Gagal memperbarui pengaturan: ' + err.message;
  }
  return 'Gagal memperbarui pengaturan halaman kontak.';
}

export const contactCmsController = {
  async index(req, res) {
    try {
      const settings = await getSettingsMap();
      res.render('admin/contact/index', {
        title: 'Manajemen Konten Halaman Kontak',
        pageTitle: 'CMS Halaman Kontak & Inquiry',
        activeNav: 'contact-cms',
        settings,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Contact CMS controller index error:', err);
      res.redirect('/admin/dashboard?error=' + encodeURIComponent('Gagal memuat pengaturan halaman kontak.'));
    }
  },

  async update(req, res) {
    try {
      await updateContactSettings(req.body);
      logger.info('Contact page settings updated by ' + (req.user?.email || 'admin'));
      res.redirect('/admin/contact?success=' + encodeURIComponent('Pengaturan halaman kontak berhasil diperbarui.'));
    } catch (err) {
      logger.error('Contact CMS update error:', err);
      res.redirect('/admin/contact?error=' + encodeURIComponent(formatContactErrorMessage(err)));
    }
  }
};

export default contactCmsController;
