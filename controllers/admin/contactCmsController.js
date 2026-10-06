import settingModel from '../../models/settingModel.js';
import { clearSettingsCache } from '../../middleware/settingsMiddleware.js';
import logger from '../../utils/logger.js';

export const contactCmsController = {
  async index(req, res) {
    try {
      const settings = await settingModel.getAllAsMap();
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
      const allowedKeys = [
        'contact_address_id',
        'contact_address_en',
        'contact_email',
        'contact_phone',
        'contact_working_hours_id',
        'contact_working_hours_en',
        'contact_maps_embed_url',
        'contact_form_title_id',
        'contact_form_title_en',
        'contact_form_subtitle_id',
        'contact_form_subtitle_en'
      ];

      const updates = {};
      for (const key of allowedKeys) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key].trim();
        }
      }

      await settingModel.updateMany(updates);
      clearSettingsCache();

      logger.info('Contact page settings updated by ' + (req.user?.email || 'admin'));
      res.redirect('/admin/contact?success=' + encodeURIComponent('Pengaturan halaman kontak berhasil diperbarui.'));
    } catch (err) {
      logger.error('Contact CMS update error:', err);
      res.redirect('/admin/contact?error=' + encodeURIComponent('Gagal memperbarui pengaturan: ' + err.message));
    }
  }
};

export default contactCmsController;
