import {
  getAdminAboutPageData,
  updateAdminAboutContent
} from '../../services/aboutService.js';
import {
  createGallerySlide,
  updateGallerySlide,
  deleteGallerySlide,
  createStat,
  updateStat,
  deleteStat,
  createTimeline,
  updateTimeline,
  deleteTimeline
} from '../../services/aboutCrudService.js';
import logger from '../../utils/logger.js';

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

async function handleTabMutation(req, res, { tab, action, successMessage, logLabel }) {
  try {
    const result = await action();
    if (result.status === 'not_found') {
      return sendTabError(req, res, { tab, statusCode: 404, message: result.error });
    }
    if (result.status === 'validation_error') {
      return sendTabError(req, res, { tab, statusCode: 400, message: result.error });
    }
    return sendTabSuccess(req, res, { tab, message: successMessage, id: result.id });
  } catch (err) {
    logger.error(`aboutController.${logLabel} error:`, { message: err.message });
    return sendTabError(req, res, { tab, message: err.message });
  }
}

export const aboutController = {
  async index(req, res) {
    try {
      const pageData = await getAdminAboutPageData();
      res.render('admin/about/index', {
        title: 'Manajemen Halaman Tentang Kami - PT Euodoo CMS',
        activeNav: 'about',
        ...pageData,
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
      await updateAdminAboutContent(req.body, req.file);
      logger.info('aboutController: About content successfully updated by admin');
      return res.redirect('/admin/about?success=Konten+halaman+tentang+kami+berhasil+diperbarui.');
    } catch (err) {
      logger.error('aboutController.update error:', { message: err.message, stack: err.stack });
      return res.redirect(`/admin/about?error=${encodeURIComponent('Gagal memperbarui konten: ' + err.message)}`);
    }
  },

  storeGallerySlide(req, res) {
    return handleTabMutation(req, res, {
      tab: 'tab-gallery',
      action: () => createGallerySlide(req.body),
      successMessage: 'Slide galeri berhasil ditambahkan.',
      logLabel: 'storeGallerySlide'
    });
  },

  updateGallerySlide(req, res) {
    return handleTabMutation(req, res, {
      tab: 'tab-gallery',
      action: () => updateGallerySlide(req.params.id, req.body),
      successMessage: 'Slide galeri berhasil diperbarui.',
      logLabel: 'updateGallerySlide'
    });
  },

  deleteGallerySlide(req, res) {
    return handleTabMutation(req, res, {
      tab: 'tab-gallery',
      action: () => deleteGallerySlide(req.params.id),
      successMessage: 'Slide galeri berhasil dihapus.',
      logLabel: 'deleteGallerySlide'
    });
  },

  storeStats(req, res) {
    return handleTabMutation(req, res, {
      tab: 'tab-sejarah',
      action: () => createStat(req.body),
      successMessage: 'Statistik berhasil ditambahkan.',
      logLabel: 'storeStats'
    });
  },

  updateStats(req, res) {
    return handleTabMutation(req, res, {
      tab: 'tab-sejarah',
      action: () => updateStat(req.params.id, req.body),
      successMessage: 'Statistik berhasil diperbarui.',
      logLabel: 'updateStats'
    });
  },

  deleteStats(req, res) {
    return handleTabMutation(req, res, {
      tab: 'tab-sejarah',
      action: () => deleteStat(req.params.id),
      successMessage: 'Statistik berhasil dihapus.',
      logLabel: 'deleteStats'
    });
  },

  storeTimeline(req, res) {
    return handleTabMutation(req, res, {
      tab: 'tab-sejarah',
      action: () => createTimeline(req.body),
      successMessage: 'Item timeline berhasil ditambahkan.',
      logLabel: 'storeTimeline'
    });
  },

  updateTimeline(req, res) {
    return handleTabMutation(req, res, {
      tab: 'tab-sejarah',
      action: () => updateTimeline(req.params.id, req.body),
      successMessage: 'Item timeline berhasil diperbarui.',
      logLabel: 'updateTimeline'
    });
  },

  deleteTimeline(req, res) {
    return handleTabMutation(req, res, {
      tab: 'tab-sejarah',
      action: () => deleteTimeline(req.params.id),
      successMessage: 'Item timeline berhasil dihapus.',
      logLabel: 'deleteTimeline'
    });
  }
};

export default aboutController;
