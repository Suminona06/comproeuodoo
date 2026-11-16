import aboutModel from '../../models/aboutModel.js';
import aboutGalleryModel from '../../models/aboutGalleryModel.js';
import aboutStatsModel from '../../models/aboutStatsModel.js';
import aboutTimelineModel from '../../models/aboutTimelineModel.js';
import {
  buildAboutUpdatePayload,
  parseGallerySlideCreate,
  parseGallerySlideUpdate,
  parseStatCreate,
  parseStatUpdate,
  parseTimelineCreate,
  parseTimelineUpdate
} from '../../services/aboutService.js';
import logger from '../../utils/logger.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import { TICKET_ICONS, TICKET_ICON_KEYS } from '../../utils/ticketIcons.js';

const wantsJson = (req) => Boolean(req.xhr || req.headers?.accept?.includes('application/json'));

function sendTabSuccess(req, res, { tab, message, id }) {
  if (wantsJson(req)) {
    const body = { success: true, message };
    if (id !== undefined) body.id = id;
    return res.json(body);
  }
  return res.redirect(`/admin/about?tab=${tab}&success=${encodeURIComponent(message)}`);
}

function sendTabError(req, res, { tab, statusCode = 500, message }) {
  if (wantsJson(req)) return res.status(statusCode).json({ success: false, message });
  return res.redirect(`/admin/about?tab=${tab}&error=${encodeURIComponent(message)}`);
}

export const aboutController = {
  async index(req, res) {
    try {
      const [about, gallerySlides, stats, timeline, galleryHeader, storyHeader, timelineHeader, visionMissionImages] = await Promise.all([
        aboutModel.getAboutData(),
        aboutGalleryModel.findAll(),
        aboutStatsModel.findAll(),
        aboutTimelineModel.findAll(),
        aboutModel.getGalleryHeader(),
        aboutModel.getStoryHeader(),
        aboutModel.getTimelineHeader(),
        aboutModel.getVisionMissionImages()
      ]);

      res.render('admin/about/index', {
        title: 'Manajemen Halaman Tentang Kami - PT Euodoo CMS',
        activeNav: 'about',
        about,
        ticketIcons: TICKET_ICONS,
        ticketIconKeys: TICKET_ICON_KEYS,
        gallerySlides,
        stats,
        timeline,
        galleryHeader,
        storyHeader,
        timelineHeader,
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
      const currentAbout = await aboutModel.getAboutData();
      const defaults = aboutModel.getDefaults();
      const updatePayload = buildAboutUpdatePayload(req.body, currentAbout?.values || defaults.values, defaults.certifications);

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
      const parsed = parseGallerySlideCreate(req.body);
      if (parsed.error) return sendTabError(req, res, { tab: 'tab-gallery', statusCode: 400, message: parsed.error });
      const id = await aboutGalleryModel.create(parsed.data);
      return sendTabSuccess(req, res, { tab: 'tab-gallery', message: 'Slide galeri berhasil ditambahkan.', id });
    } catch (err) {
      logger.error('aboutController.storeGallerySlide error:', { message: err.message });
      return sendTabError(req, res, { tab: 'tab-gallery', message: err.message });
    }
  },

  async updateGallerySlide(req, res) {
    try {
      const slide = await aboutGalleryModel.findById(req.params.id);
      if (!slide) return sendTabError(req, res, { tab: 'tab-gallery', statusCode: 404, message: 'Slide tidak ditemukan.' });
      const parsed = parseGallerySlideUpdate(req.body);
      if (parsed.error) return sendTabError(req, res, { tab: 'tab-gallery', statusCode: 400, message: parsed.error });
      await aboutGalleryModel.update(req.params.id, parsed.data);
      return sendTabSuccess(req, res, { tab: 'tab-gallery', message: 'Slide galeri berhasil diperbarui.' });
    } catch (err) {
      logger.error('aboutController.updateGallerySlide error:', { message: err.message });
      return sendTabError(req, res, { tab: 'tab-gallery', message: err.message });
    }
  },

  async deleteGallerySlide(req, res) {
    try {
      const slide = await aboutGalleryModel.findById(req.params.id);
      if (!slide) return sendTabError(req, res, { tab: 'tab-gallery', statusCode: 404, message: 'Slide tidak ditemukan.' });
      await aboutGalleryModel.delete(req.params.id);
      return sendTabSuccess(req, res, { tab: 'tab-gallery', message: 'Slide galeri berhasil dihapus.' });
    } catch (err) {
      logger.error('aboutController.deleteGallerySlide error:', { message: err.message });
      return sendTabError(req, res, { tab: 'tab-gallery', message: err.message });
    }
  },

  async storeStats(req, res) {
    try {
      const existing = await aboutStatsModel.findAll();
      const parsed = parseStatCreate(req.body, existing.length);
      if (parsed.error) return sendTabError(req, res, { tab: 'tab-sejarah', statusCode: 400, message: parsed.error });
      const id = await aboutStatsModel.create(parsed.data);
      return sendTabSuccess(req, res, { tab: 'tab-sejarah', message: 'Statistik berhasil ditambahkan.', id });
    } catch (err) {
      logger.error('aboutController.storeStats error:', { message: err.message });
      return sendTabError(req, res, { tab: 'tab-sejarah', message: err.message });
    }
  },

  async updateStats(req, res) {
    try {
      const stat = await aboutStatsModel.findById(req.params.id);
      if (!stat) return sendTabError(req, res, { tab: 'tab-sejarah', statusCode: 404, message: 'Statistik tidak ditemukan.' });
      await aboutStatsModel.update(req.params.id, parseStatUpdate(req.body));
      return sendTabSuccess(req, res, { tab: 'tab-sejarah', message: 'Statistik berhasil diperbarui.' });
    } catch (err) {
      logger.error('aboutController.updateStats error:', { message: err.message });
      return sendTabError(req, res, { tab: 'tab-sejarah', message: err.message });
    }
  },

  async deleteStats(req, res) {
    try {
      const stat = await aboutStatsModel.findById(req.params.id);
      if (!stat) return sendTabError(req, res, { tab: 'tab-sejarah', statusCode: 404, message: 'Statistik tidak ditemukan.' });
      await aboutStatsModel.delete(req.params.id);
      return sendTabSuccess(req, res, { tab: 'tab-sejarah', message: 'Statistik berhasil dihapus.' });
    } catch (err) {
      logger.error('aboutController.deleteStats error:', { message: err.message });
      return sendTabError(req, res, { tab: 'tab-sejarah', message: err.message });
    }
  },

  async storeTimeline(req, res) {
    try {
      const parsed = parseTimelineCreate(req.body);
      if (parsed.error) return sendTabError(req, res, { tab: 'tab-sejarah', statusCode: 400, message: parsed.error });
      const id = await aboutTimelineModel.create(parsed.data);
      return sendTabSuccess(req, res, { tab: 'tab-sejarah', message: 'Item timeline berhasil ditambahkan.', id });
    } catch (err) {
      logger.error('aboutController.storeTimeline error:', { message: err.message });
      return sendTabError(req, res, { tab: 'tab-sejarah', message: err.message });
    }
  },

  async updateTimeline(req, res) {
    try {
      const item = await aboutTimelineModel.findById(req.params.id);
      if (!item) return sendTabError(req, res, { tab: 'tab-sejarah', statusCode: 404, message: 'Timeline tidak ditemukan.' });
      await aboutTimelineModel.update(req.params.id, parseTimelineUpdate(req.body));
      return sendTabSuccess(req, res, { tab: 'tab-sejarah', message: 'Item timeline berhasil diperbarui.' });
    } catch (err) {
      logger.error('aboutController.updateTimeline error:', { message: err.message });
      return sendTabError(req, res, { tab: 'tab-sejarah', message: err.message });
    }
  },

  async deleteTimeline(req, res) {
    try {
      const item = await aboutTimelineModel.findById(req.params.id);
      if (!item) return sendTabError(req, res, { tab: 'tab-sejarah', statusCode: 404, message: 'Timeline tidak ditemukan.' });
      await aboutTimelineModel.delete(req.params.id);
      return sendTabSuccess(req, res, { tab: 'tab-sejarah', message: 'Item timeline berhasil dihapus.' });
    } catch (err) {
      logger.error('aboutController.deleteTimeline error:', { message: err.message });
      return sendTabError(req, res, { tab: 'tab-sejarah', message: err.message });
    }
  }
};

export default aboutController;
