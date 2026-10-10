import bannerModel from '../../models/bannerModel.js';
import { processAndSaveWebP, saveVideoFile } from '../../middleware/uploadMiddleware.js';
import storage from '../../config/storage.js';
import logger from '../../utils/logger.js';

function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
}

export const bannerController = {
  async index(req, res) {
    try {
      const banners = await bannerModel.findAll(false);
      res.render('admin/banners/index', {
        title: 'Manajemen Banner Hero',
        pageTitle: 'Banner Hero Beranda',
        activeNav: 'banners',
        banners,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Banner index error:', { message: err.message });
      res.status(500).render('admin/banners/index', {
        title: 'Manajemen Banner Hero',
        pageTitle: 'Banner Hero',
        activeNav: 'banners',
        banners: [],
        error: 'Gagal mengambil data banner.',
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  createView(req, res) {
    res.render('admin/banners/create', {
      title: 'Tambah Banner Hero',
      pageTitle: 'Tambah Banner Hero',
      activeNav: 'banners',
      error: null
    });
  },

  async store(req, res) {
    try {
      const {
        title_id, title_en, caption_id, caption_en,
        cta_text_id, cta_text_en, cta_url, sort_order, media_type, is_active,
        file_url, youtube_url, poster_url
      } = req.body;

      if (!title_id || (!req.file && !file_url && !youtube_url)) {
        return res.status(400).render('admin/banners/create', {
          title: 'Tambah Banner Hero',
          pageTitle: 'Tambah Banner Hero',
          activeNav: 'banners',
          error: 'Judul banner dan sumber media wajib diisi.',
          formData: req.body
        });
      }

      let finalMediaUrl = file_url ? file_url.trim() : null;
      let finalPosterUrl = poster_url ? poster_url.trim() : null;
      let type = media_type || 'image';

      if (type === 'youtube') {
        const ytId = extractYouTubeId(youtube_url || file_url);
        if (!ytId) {
          return res.status(400).render('admin/banners/create', {
            title: 'Tambah Banner Hero',
            pageTitle: 'Tambah Banner Hero',
            activeNav: 'banners',
            error: 'Tautan YouTube tidak valid. Harap masukkan format link video YouTube resmi.',
            formData: req.body
          });
        }
        finalMediaUrl = ytId;
      } else if (req.file) {
        if (req.file.mimetype.startsWith('video/')) {
          finalMediaUrl = await saveVideoFile(req.file.buffer, req.file.originalname, 'banners');
          type = 'video';
        } else {
          finalMediaUrl = await processAndSaveWebP(req.file.buffer, 'banners', { maxWidth: 1920, maxHeight: 1080, quality: 80 });
          type = 'image';
        }
      }

      await bannerModel.create({
        title_id: title_id.trim(),
        title_en: title_en ? title_en.trim() : title_id.trim(),
        caption_id: caption_id ? caption_id.trim() : null,
        caption_en: caption_en ? caption_en.trim() : null,
        media_type: type,
        file_url: finalMediaUrl,
        poster_url: finalPosterUrl,
        cta_text_id: cta_text_id ? cta_text_id.trim() : null,
        cta_text_en: cta_text_en ? cta_text_en.trim() : null,
        cta_url: cta_url ? cta_url.trim() : null,
        sort_order: parseInt(sort_order || '0', 10),
        is_active: is_active === 'on' || is_active === '1' || is_active === true
      });

      res.redirect('/admin/banners?success=' + encodeURIComponent('Banner baru berhasil ditambahkan.'));
    } catch (err) {
      logger.error('Banner store error:', { message: err.message });
      res.redirect('/admin/banners?error=' + encodeURIComponent('Gagal menyimpan banner: ' + err.message));
    }
  },

  async editView(req, res) {
    try {
      const banner = await bannerModel.findById(req.params.id);
      if (!banner) {
        return res.redirect('/admin/banners?error=' + encodeURIComponent('Banner tidak ditemukan.'));
      }

      res.render('admin/banners/edit', {
        title: 'Edit Banner - ' + banner.title_id,
        pageTitle: 'Edit Banner Hero',
        activeNav: 'banners',
        banner,
        error: null
      });
    } catch (err) {
      logger.error('Banner editView error:', err);
      res.redirect('/admin/banners?error=' + encodeURIComponent('Gagal membuka halaman edit banner.'));
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        title_id, title_en, caption_id, caption_en,
        cta_text_id, cta_text_en, cta_url, sort_order, is_active,
        media_type, file_url, youtube_url, poster_url
      } = req.body;

      const banner = await bannerModel.findById(id);
      if (!banner) {
        return res.redirect('/admin/banners?error=' + encodeURIComponent('Banner tidak ditemukan.'));
      }

      let type = media_type || banner.media_type;
      let finalMediaUrl = file_url !== undefined && file_url.trim() !== '' ? file_url.trim() : (banner.file_url || banner.image_url);
      let finalPosterUrl = poster_url !== undefined ? poster_url.trim() : banner.poster_url;

      if (type === 'youtube' && (youtube_url || file_url)) {
        const ytId = extractYouTubeId(youtube_url || file_url);
        if (ytId) {
          finalMediaUrl = ytId;
        }
      } else if (req.file) {
        if (req.file.mimetype.startsWith('video/')) {
          if (banner.video_url) await storage.delete(banner.video_url);
          finalMediaUrl = await saveVideoFile(req.file.buffer, req.file.originalname, 'banners');
          type = 'video';
        } else {
          if (banner.image_url) await storage.delete(banner.image_url);
          finalMediaUrl = await processAndSaveWebP(req.file.buffer, 'banners', { maxWidth: 1920, maxHeight: 1080, quality: 80 });
          type = 'image';
        }
      }

      const updateData = {
        title_id: title_id ? title_id.trim() : banner.title_id,
        title_en: title_en ? title_en.trim() : banner.title_en,
        caption_id: caption_id !== undefined ? caption_id.trim() : banner.caption_id,
        caption_en: caption_en !== undefined ? caption_en.trim() : banner.caption_en,
        media_type: type,
        file_url: finalMediaUrl,
        poster_url: finalPosterUrl,
        cta_text_id: cta_text_id !== undefined ? cta_text_id.trim() : banner.cta_text_id,
        cta_text_en: cta_text_en !== undefined ? cta_text_en.trim() : banner.cta_text_en,
        cta_url: cta_url !== undefined ? cta_url.trim() : banner.cta_url,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : banner.sort_order,
        is_active: is_active === 'on' || is_active === '1' || is_active === true
      };

      await bannerModel.update(id, updateData);
      res.redirect('/admin/banners?success=' + encodeURIComponent('Banner berhasil diperbarui.'));
    } catch (err) {
      logger.error('Banner update error:', err);
      res.redirect('/admin/banners?error=' + encodeURIComponent('Gagal memperbarui banner: ' + err.message));
    }
  },

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const result = await bannerModel.toggleActive(id);

      if (!result.success) {
        return res.redirect('/admin/banners?error=' + encodeURIComponent(result.message));
      }

      res.redirect('/admin/banners?success=' + encodeURIComponent('Status banner berhasil diperbarui.'));
    } catch (err) {
      logger.error('Banner toggleStatus error:', { message: err.message });
      res.redirect('/admin/banners?error=' + encodeURIComponent('Gagal mengubah status banner.'));
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const banner = await bannerModel.findById(id);

      if (!banner) {
        return res.redirect('/admin/banners?error=' + encodeURIComponent('Banner tidak ditemukan.'));
      }

      if (banner.is_active === 1) {
        const activeCount = await bannerModel.countActive();
        if (activeCount <= 1) {
          return res.redirect('/admin/banners?error=' + encodeURIComponent('Minimal harus ada 1 banner aktif di sistem.'));
        }
      }

      if (banner.image_url) await storage.delete(banner.image_url);
      if (banner.video_url) await storage.delete(banner.video_url);

      await bannerModel.delete(id);
      res.redirect('/admin/banners?success=' + encodeURIComponent('Banner berhasil dihapus.'));
    } catch (err) {
      logger.error('Banner destroy error:', { message: err.message });
      res.redirect('/admin/banners?error=' + encodeURIComponent('Gagal menghapus banner.'));
    }
  }
};

export default bannerController;
