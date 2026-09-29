import settingModel from '../../models/settingModel.js';
import logger from '../../utils/logger.js';

export const settingController = {
  /**
   * Render Settings Form
   */
  async index(req, res) {
    try {
      const settings = await settingModel.getAll();
      res.render('admin/settings/index', {
        title: 'Pengaturan Profil Perusahaan & Kontak - PT Euodoo CMS',
        activeNav: 'settings',
        settings,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Setting index error:', { message: err.message });
      res.redirect('/admin/dashboard?error=Gagal+memuat+halaman+pengaturan.');
    }
  },

  /**
   * Save Settings
   */
  async update(req, res) {
    try {
      const {
        company_name,
        company_tagline_id,
        company_tagline_en,
        company_phone,
        company_email,
        company_address,
        whatsapp_number,
        whatsapp_default_message,
        meta_description_id,
        meta_description_en
      } = req.body;

      await settingModel.updateMany({
        company_name: company_name ? company_name.trim() : undefined,
        company_tagline_id: company_tagline_id ? company_tagline_id.trim() : undefined,
        company_tagline_en: company_tagline_en ? company_tagline_en.trim() : undefined,
        company_phone: company_phone ? company_phone.trim() : undefined,
        company_email: company_email ? company_email.trim() : undefined,
        company_address: company_address ? company_address.trim() : undefined,
        whatsapp_number: whatsapp_number ? whatsapp_number.replace(/[^0-9]/g, '') : undefined,
        whatsapp_default_message: whatsapp_default_message ? whatsapp_default_message.trim() : undefined,
        meta_description_id: meta_description_id ? meta_description_id.trim() : undefined,
        meta_description_en: meta_description_en ? meta_description_en.trim() : undefined
      });

      logger.info('Company profile settings updated successfully.');
      return res.redirect('/admin/settings?success=Pengaturan+profil+perusahaan+berhasil+disimpan.');
    } catch (err) {
      logger.error('Setting update error:', { message: err.message });
      return res.redirect(`/admin/settings?error=${encodeURIComponent(err.message)}`);
    }
  }
};

export default settingController;
