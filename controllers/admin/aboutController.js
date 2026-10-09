import aboutModel from '../../models/aboutModel.js';
import logger from '../../utils/logger.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';

export const aboutController = {
  /**
   * Render About Us CMS Admin Form
   */
  async index(req, res) {
    try {
      const about = await aboutModel.getAboutData();
      res.render('admin/about/index', {
        title: 'Manajemen Halaman Tentang Kami - PT Euodoo CMS',
        activeNav: 'about',
        about,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('aboutController.index error:', { message: err.message, stack: err.stack });
      res.redirect('/admin/dashboard?error=Gagal+memuat+halaman+tentang+kami.');
    }
  },

  /**
   * Save / Update About Us CMS Content
   */
  async update(req, res) {
    try {
      const {
        founded_year,
        former_names,
        history_title_id,
        history_title_en,
        history_id,
        history_en,
        vision_id,
        vision_en,
        mission_id,
        mission_en,
        motto_id,
        motto_en,
        slogan_id,
        slogan_en,
        goal_id,
        goal_en,
        eco_statement_id,
        eco_statement_en,
        office_address,
        office_phone,
        office_fax,
        factory_address,
        factory_phone,
        factory_fax
      } = req.body;

      // Extract T-I-C-K-E-T values from form
      const letters = ['T', 'I', 'C', 'K', 'E', 'T_2'];
      const actualLetters = ['T', 'I', 'C', 'K', 'E', 'T'];
      const defaultValues = aboutModel.getDefaults().values;

      const values = actualLetters.map((letter, idx) => {
        const formKey = idx === 5 ? 'T_2' : letter;
        return {
          letter: letter,
          title_id: req.body[`val_title_id_${formKey}`] || defaultValues[idx].title_id,
          title_en: req.body[`val_title_en_${formKey}`] || defaultValues[idx].title_en,
          desc_id: req.body[`val_desc_id_${formKey}`] || defaultValues[idx].desc_id,
          desc_en: req.body[`val_desc_en_${formKey}`] || defaultValues[idx].desc_en
        };
      });

      // Extract certifications
      const defaultCerts = aboutModel.getDefaults().certifications;
      const certifications = defaultCerts.map((cert, idx) => {
        return {
          name: req.body[`cert_name_${idx}`] || cert.name,
          issuer: req.body[`cert_issuer_${idx}`] || cert.issuer,
          badge: req.body[`cert_badge_${idx}`] || cert.badge,
          desc_id: req.body[`cert_desc_id_${idx}`] || cert.desc_id,
          desc_en: req.body[`cert_desc_en_${idx}`] || cert.desc_en
        };
      });

      const updatePayload = {
        founded_year: founded_year ? founded_year.trim() : undefined,
        former_names: former_names ? former_names.trim() : undefined,
        history_title_id: history_title_id ? history_title_id.trim() : undefined,
        history_title_en: history_title_en ? history_title_en.trim() : undefined,
        history_id: history_id ? history_id.trim() : undefined,
        history_en: history_en ? history_en.trim() : undefined,
        vision_id: vision_id ? vision_id.trim() : undefined,
        vision_en: vision_en ? vision_en.trim() : undefined,
        mission_id: mission_id ? mission_id.trim() : undefined,
        mission_en: mission_en ? mission_en.trim() : undefined,
        motto_id: motto_id ? motto_id.trim() : undefined,
        motto_en: motto_en ? motto_en.trim() : undefined,
        slogan_id: slogan_id ? slogan_id.trim() : undefined,
        slogan_en: slogan_en ? slogan_en.trim() : undefined,
        goal_id: goal_id ? goal_id.trim() : undefined,
        goal_en: goal_en ? goal_en.trim() : undefined,
        eco_statement_id: eco_statement_id ? eco_statement_id.trim() : undefined,
        eco_statement_en: eco_statement_en ? eco_statement_en.trim() : undefined,
        office_address: office_address ? office_address.trim() : undefined,
        office_phone: office_phone ? office_phone.trim() : undefined,
        office_fax: office_fax ? office_fax.trim() : undefined,
        factory_address: factory_address ? factory_address.trim() : undefined,
        factory_phone: factory_phone ? factory_phone.trim() : undefined,
        factory_fax: factory_fax ? factory_fax.trim() : undefined,
        values,
        certifications
      };

      if (req.file) {
        updatePayload.image_url = await processAndSaveWebP(req.file.buffer, 'pages', { maxWidth: 1920, maxHeight: 1080 });
      } else if (req.body.image_url !== undefined) {
        updatePayload.image_url = req.body.image_url ? req.body.image_url.trim() : null;
      }

      await aboutModel.updateAboutData(updatePayload);

      logger.info('aboutController: About content successfully updated by admin');
      return res.redirect('/admin/about?success=Konten+halaman+tentang+kami+berhasil+diperbarui.');
    } catch (err) {
      logger.error('aboutController.update error:', { message: err.message, stack: err.stack });
      return res.redirect(`/admin/about?error=${encodeURIComponent('Gagal memperbarui konten: ' + err.message)}`);
    }
  }
};

export default aboutController;
