import settingModel from '../../models/settingModel.js';
import { clearSettingsCache } from '../../middleware/settingsMiddleware.js';
import {
  buildSettingUpdates,
  parseAndValidateGoogleMapsUrl,
  parseAndValidateWhatsAppNumbers
} from '../../services/settingService.js';
import logger from '../../utils/logger.js';

export { parseAndValidateGoogleMapsUrl, parseAndValidateWhatsAppNumbers };

const TEXT_SETTING_KEYS = [
  'company_name', 'company_tagline_id', 'company_tagline_en',
  'company_phone', 'company_email',
  'office_name_id', 'office_name_en', 'office_address', 'office_city', 'office_phone', 'office_fax', 'office_email',
  'factory_name_id', 'factory_name_en', 'factory_address', 'factory_city', 'factory_phone', 'factory_fax', 'factory_email',
  'factory_working_hours_id', 'factory_working_hours_en',
  'whatsapp_default_message', 'whatsapp_button_theme', 'whatsapp_floating_enabled'
];

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
      const updates = await buildSettingUpdates(req, TEXT_SETTING_KEYS);
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
