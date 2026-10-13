import aboutModel from '../../models/aboutModel.js';
import aboutGalleryModel from '../../models/aboutGalleryModel.js';
import aboutStatsModel from '../../models/aboutStatsModel.js';
import aboutTimelineModel from '../../models/aboutTimelineModel.js';
import logger from '../../utils/logger.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';

export const aboutController = {
  async index(req, res) {
    try {
      const [about, gallerySlides, stats, timeline, galleryHeader, storyHeader, visionMissionImages] = await Promise.all([
        aboutModel.getAboutData(),
        aboutGalleryModel.findAll(),
        aboutStatsModel.findAll(),
        aboutTimelineModel.findAll(),
        aboutModel.getGalleryHeader(),
        aboutModel.getStoryHeader(),
        aboutModel.getVisionMissionImages()
      ]);

      res.render('admin/about/index', {
        title: 'Manajemen Halaman Tentang Kami - PT Euodoo CMS',
        activeNav: 'about',
        about,
        gallerySlides,
        stats,
        timeline,
        galleryHeader,
        storyHeader,
        visionMissionImages,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('aboutController.index error:', { message: err.message, stack: err.stack });
      res.redirect('/admin/dashboard?error=Gagal+memuat+halaman+tentang+kami.');
    }
  },

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
        vision_image_url,
        mission_image_url,
        about_gallery_kicker_id,
        about_gallery_kicker_en,
        about_gallery_title_id,
        about_gallery_title_en,
        about_gallery_body_id,
        about_gallery_body_en,
        about_story_kicker_id,
        about_story_kicker_en
      } = req.body;

      const actualLetters = ['T', 'I', 'C', 'K', 'E', 'T'];
      const defaultValues = aboutModel.getDefaults().values;

      const values = actualLetters.map((letter, idx) => {
        const formKey = idx === 5 ? 'T_2' : letter;
        return {
          letter,
          title_id: req.body[`val_title_id_${formKey}`] || defaultValues[idx].title_id,
          title_en: req.body[`val_title_en_${formKey}`] || defaultValues[idx].title_en,
          desc_id: req.body[`val_desc_id_${formKey}`] || defaultValues[idx].desc_id,
          desc_en: req.body[`val_desc_en_${formKey}`] || defaultValues[idx].desc_en
        };
      });

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
        vision_image_url: vision_image_url !== undefined ? vision_image_url.trim() : undefined,
        mission_image_url: mission_image_url !== undefined ? mission_image_url.trim() : undefined,
        about_gallery_kicker_id: about_gallery_kicker_id !== undefined ? about_gallery_kicker_id.trim() : undefined,
        about_gallery_kicker_en: about_gallery_kicker_en !== undefined ? about_gallery_kicker_en.trim() : undefined,
        about_gallery_title_id: about_gallery_title_id !== undefined ? about_gallery_title_id.trim() : undefined,
        about_gallery_title_en: about_gallery_title_en !== undefined ? about_gallery_title_en.trim() : undefined,
        about_gallery_body_id: about_gallery_body_id !== undefined ? about_gallery_body_id.trim() : undefined,
        about_gallery_body_en: about_gallery_body_en !== undefined ? about_gallery_body_en.trim() : undefined,
        about_story_kicker_id: about_story_kicker_id !== undefined ? about_story_kicker_id.trim() : undefined,
        about_story_kicker_en: about_story_kicker_en !== undefined ? about_story_kicker_en.trim() : undefined,
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
  },

  async storeGallerySlide(req, res) {
    try {
      const { image_url, category_id, category_en, title_id, title_en, subtitle_id, subtitle_en, sort_order, is_active } = req.body;

      if (!title_id || !title_id.trim() || !image_url || !image_url.trim()) {
        const errorMsg = 'Judul slide dan gambar wajib diisi.';
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(400).json({ success: false, message: errorMsg });
        }
        return res.redirect(`/admin/about?tab=tab-gallery&error=${encodeURIComponent(errorMsg)}`);
      }

      const id = await aboutGalleryModel.create({
        image_url: image_url.trim(),
        category_id: category_id ? category_id.trim() : '',
        category_en: category_en ? category_en.trim() : '',
        title_id: title_id.trim(),
        title_en: title_en ? title_en.trim() : '',
        subtitle_id: subtitle_id ? subtitle_id.trim() : '',
        subtitle_en: subtitle_en ? subtitle_en.trim() : '',
        sort_order: parseInt(sort_order || '0', 10),
        is_active: is_active === undefined ? 1 : (is_active === '1' || is_active === 1 || is_active === true ? 1 : 0)
      });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Slide galeri berhasil ditambahkan.', id });
      }
      return res.redirect('/admin/about?tab=tab-gallery&success=Slide+galeri+berhasil+ditambahkan.');
    } catch (err) {
      logger.error('aboutController.storeGallerySlide error:', { message: err.message });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/about?tab=tab-gallery&error=${encodeURIComponent(err.message)}`);
    }
  },

  async updateGallerySlide(req, res) {
    try {
      const { id } = req.params;
      const slide = await aboutGalleryModel.findById(id);
      if (!slide) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(404).json({ success: false, message: 'Slide tidak ditemukan.' });
        }
        return res.redirect('/admin/about?tab=tab-gallery&error=Slide+tidak+ditemukan.');
      }

      const { image_url, category_id, category_en, title_id, title_en, subtitle_id, subtitle_en, sort_order, is_active } = req.body;

      await aboutGalleryModel.update(id, {
        image_url: image_url !== undefined ? image_url.trim() : undefined,
        category_id: category_id !== undefined ? category_id.trim() : undefined,
        category_en: category_en !== undefined ? category_en.trim() : undefined,
        title_id: title_id !== undefined ? title_id.trim() : undefined,
        title_en: title_en !== undefined ? title_en.trim() : undefined,
        subtitle_id: subtitle_id !== undefined ? subtitle_id.trim() : undefined,
        subtitle_en: subtitle_en !== undefined ? subtitle_en.trim() : undefined,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : undefined,
        is_active: is_active !== undefined ? (is_active === '1' || is_active === 1 || is_active === true ? 1 : 0) : undefined
      });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Slide galeri berhasil diperbarui.' });
      }
      return res.redirect('/admin/about?tab=tab-gallery&success=Slide+galeri+berhasil+diperbarui.');
    } catch (err) {
      logger.error('aboutController.updateGallerySlide error:', { message: err.message });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/about?tab=tab-gallery&error=${encodeURIComponent(err.message)}`);
    }
  },

  async deleteGallerySlide(req, res) {
    try {
      const { id } = req.params;
      const slide = await aboutGalleryModel.findById(id);
      if (!slide) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(404).json({ success: false, message: 'Slide tidak ditemukan.' });
        }
        return res.redirect('/admin/about?tab=tab-gallery&error=Slide+tidak+ditemukan.');
      }

      await aboutGalleryModel.delete(id);

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Slide galeri berhasil dihapus.' });
      }
      return res.redirect('/admin/about?tab=tab-gallery&success=Slide+galeri+berhasil+dihapus.');
    } catch (err) {
      logger.error('aboutController.deleteGallerySlide error:', { message: err.message });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/about?tab=tab-gallery&error=${encodeURIComponent(err.message)}`);
    }
  },

  async storeStats(req, res) {
    try {
      const { stat_value, label_id, label_en, sort_order, is_active } = req.body;

      if (!stat_value || !stat_value.trim() || !label_id || !label_id.trim()) {
        const errorMsg = 'Nilai statistik dan label wajib diisi.';
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(400).json({ success: false, message: errorMsg });
        }
        return res.redirect(`/admin/about?tab=tab-sejarah&error=${encodeURIComponent(errorMsg)}`);
      }

      const currentStats = await aboutStatsModel.findAll();
      if (currentStats.length >= 8) {
        const limitMsg = 'Batas maksimal 8 item statistik telah tercapai.';
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(400).json({ success: false, message: limitMsg });
        }
        return res.redirect(`/admin/about?tab=tab-sejarah&error=${encodeURIComponent(limitMsg)}`);
      }

      const id = await aboutStatsModel.create({
        stat_value: stat_value.trim(),
        label_id: label_id.trim(),
        label_en: label_en ? label_en.trim() : '',
        sort_order: parseInt(sort_order || '0', 10),
        is_active: is_active === undefined ? 1 : (is_active === '1' || is_active === 1 || is_active === true ? 1 : 0)
      });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Statistik berhasil ditambahkan.', id });
      }
      return res.redirect('/admin/about?tab=tab-sejarah&success=Statistik+berhasil+ditambahkan.');
    } catch (err) {
      logger.error('aboutController.storeStats error:', { message: err.message });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/about?tab=tab-sejarah&error=${encodeURIComponent(err.message)}`);
    }
  },

  async updateStats(req, res) {
    try {
      const { id } = req.params;
      const stat = await aboutStatsModel.findById(id);
      if (!stat) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(404).json({ success: false, message: 'Statistik tidak ditemukan.' });
        }
        return res.redirect('/admin/about?tab=tab-sejarah&error=Statistik+tidak+ditemukan.');
      }

      const { stat_value, label_id, label_en, sort_order, is_active } = req.body;

      await aboutStatsModel.update(id, {
        stat_value: stat_value !== undefined ? stat_value.trim() : undefined,
        label_id: label_id !== undefined ? label_id.trim() : undefined,
        label_en: label_en !== undefined ? label_en.trim() : undefined,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : undefined,
        is_active: is_active !== undefined ? (is_active === '1' || is_active === 1 || is_active === true ? 1 : 0) : undefined
      });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Statistik berhasil diperbarui.' });
      }
      return res.redirect('/admin/about?tab=tab-sejarah&success=Statistik+berhasil+diperbarui.');
    } catch (err) {
      logger.error('aboutController.updateStats error:', { message: err.message });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/about?tab=tab-sejarah&error=${encodeURIComponent(err.message)}`);
    }
  },

  async deleteStats(req, res) {
    try {
      const { id } = req.params;
      const stat = await aboutStatsModel.findById(id);
      if (!stat) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(404).json({ success: false, message: 'Statistik tidak ditemukan.' });
        }
        return res.redirect('/admin/about?tab=tab-sejarah&error=Statistik+tidak+ditemukan.');
      }

      await aboutStatsModel.delete(id);

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Statistik berhasil dihapus.' });
      }
      return res.redirect('/admin/about?tab=tab-sejarah&success=Statistik+berhasil+dihapus.');
    } catch (err) {
      logger.error('aboutController.deleteStats error:', { message: err.message });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/about?tab=tab-sejarah&error=${encodeURIComponent(err.message)}`);
    }
  },

  async storeTimeline(req, res) {
    try {
      const { year_label_id, year_label_en, title_id, title_en, description_id, description_en, sort_order, is_active } = req.body;

      if (!year_label_id || !year_label_id.trim() || !title_id || !title_id.trim()) {
        const errorMsg = 'Label tahun dan judul item timeline wajib diisi.';
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(400).json({ success: false, message: errorMsg });
        }
        return res.redirect(`/admin/about?tab=tab-sejarah&error=${encodeURIComponent(errorMsg)}`);
      }

      const id = await aboutTimelineModel.create({
        year_label_id: year_label_id.trim(),
        year_label_en: year_label_en ? year_label_en.trim() : '',
        title_id: title_id.trim(),
        title_en: title_en ? title_en.trim() : '',
        description_id: description_id ? description_id.trim() : '',
        description_en: description_en ? description_en.trim() : '',
        sort_order: parseInt(sort_order || '0', 10),
        is_active: is_active === undefined ? 1 : (is_active === '1' || is_active === 1 || is_active === true ? 1 : 0)
      });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Item timeline berhasil ditambahkan.', id });
      }
      return res.redirect('/admin/about?tab=tab-sejarah&success=Item+timeline+berhasil+ditambahkan.');
    } catch (err) {
      logger.error('aboutController.storeTimeline error:', { message: err.message });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/about?tab=tab-sejarah&error=${encodeURIComponent(err.message)}`);
    }
  },

  async updateTimeline(req, res) {
    try {
      const { id } = req.params;
      const item = await aboutTimelineModel.findById(id);
      if (!item) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(404).json({ success: false, message: 'Timeline tidak ditemukan.' });
        }
        return res.redirect('/admin/about?tab=tab-sejarah&error=Timeline+tidak+ditemukan.');
      }

      const { year_label_id, year_label_en, title_id, title_en, description_id, description_en, sort_order, is_active } = req.body;

      await aboutTimelineModel.update(id, {
        year_label_id: year_label_id !== undefined ? year_label_id.trim() : undefined,
        year_label_en: year_label_en !== undefined ? year_label_en.trim() : undefined,
        title_id: title_id !== undefined ? title_id.trim() : undefined,
        title_en: title_en !== undefined ? title_en.trim() : undefined,
        description_id: description_id !== undefined ? description_id.trim() : undefined,
        description_en: description_en !== undefined ? description_en.trim() : undefined,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : undefined,
        is_active: is_active !== undefined ? (is_active === '1' || is_active === 1 || is_active === true ? 1 : 0) : undefined
      });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Item timeline berhasil diperbarui.' });
      }
      return res.redirect('/admin/about?tab=tab-sejarah&success=Item+timeline+berhasil+diperbarui.');
    } catch (err) {
      logger.error('aboutController.updateTimeline error:', { message: err.message });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/about?tab=tab-sejarah&error=${encodeURIComponent(err.message)}`);
    }
  },

  async deleteTimeline(req, res) {
    try {
      const { id } = req.params;
      const item = await aboutTimelineModel.findById(id);
      if (!item) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(404).json({ success: false, message: 'Timeline tidak ditemukan.' });
        }
        return res.redirect('/admin/about?tab=tab-sejarah&error=Timeline+tidak+ditemukan.');
      }

      await aboutTimelineModel.delete(id);

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, message: 'Item timeline berhasil dihapus.' });
      }
      return res.redirect('/admin/about?tab=tab-sejarah&success=Item+timeline+berhasil+dihapus.');
    } catch (err) {
      logger.error('aboutController.deleteTimeline error:', { message: err.message });
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/about?tab=tab-sejarah&error=${encodeURIComponent(err.message)}`);
    }
  }
};

export default aboutController;
