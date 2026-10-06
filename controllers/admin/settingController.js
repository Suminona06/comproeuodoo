import settingModel from '../../models/settingModel.js';
import { clearSettingsCache } from '../../middleware/settingsMiddleware.js';
import { saveSettingUpload } from '../../middleware/uploadMiddleware.js';
import logger from '../../utils/logger.js';

export const settingController = {
  async index(req, res) {
    try {
      const settings = await settingModel.getAllAsMap();
      res.render('admin/settings/index', {
        title: 'Pengaturan Situs & Kontak',
        pageTitle: 'Pengaturan Situs & Kontak',
        activeNav: 'settings',
        settings,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Setting index error:', err);
      res.redirect('/admin/dashboard?error=' + encodeURIComponent('Gagal memuat pengaturan.'));
    }
  },

  async update(req, res) {
    try {
      const allowedKeys = [
        'company_name', 'company_tagline_id', 'company_tagline_en',
        'company_phone', 'company_email',
        'office_address', 'office_city',
        'factory_address', 'factory_city',
        'google_maps_embed',
        'whatsapp_number', 'whatsapp_default_message',
        'whatsapp_button_theme', 'whatsapp_floating_enabled',
        'facebook_url', 'instagram_url', 'linkedin_url', 'youtube_url',
        'site_favicon', 'site_logo_header', 'site_logo_footer'
      ];

      const updates = {};
      for (const key of allowedKeys) {
        if (req.body && req.body[key] !== undefined) {
          if (key === 'whatsapp_number') {
            updates[key] = req.body[key].replace(/[^0-9]/g, '');
          } else {
            updates[key] = req.body[key].trim();
          }
        }
      }

      // Handle upload favicon file (T-64)
      if (req.files && req.files.favicon_file && req.files.favicon_file[0]) {
        const faviconUrl = await saveSettingUpload(req.files.favicon_file[0], 'favicon');
        if (faviconUrl) {
          updates['site_favicon'] = faviconUrl;
        }
      }

      // Handle upload logo header file (T-65)
      if (req.files && req.files.logo_header_file && req.files.logo_header_file[0]) {
        const logoHeaderUrl = await saveSettingUpload(req.files.logo_header_file[0], 'logo-header');
        if (logoHeaderUrl) {
          updates['site_logo_header'] = logoHeaderUrl;
        }
      }

      // Handle upload logo footer file (T-65)
      if (req.files && req.files.logo_footer_file && req.files.logo_footer_file[0]) {
        const logoFooterUrl = await saveSettingUpload(req.files.logo_footer_file[0], 'logo-footer');
        if (logoFooterUrl) {
          updates['site_logo_footer'] = logoFooterUrl;
        }
      }

      if (Object.keys(updates).length > 0) {
        await settingModel.updateMany(updates);
        clearSettingsCache();
      }

      logger.info('Settings updated successfully by ' + (req.user?.email || 'admin'));
      res.redirect('/admin/settings?success=' + encodeURIComponent('Pengaturan situs berhasil diperbarui.'));
    } catch (err) {
      logger.error('Setting update error:', err);
      res.redirect('/admin/settings?error=' + encodeURIComponent('Gagal memperbarui pengaturan: ' + err.message));
    }
  }
};

export default settingController;
