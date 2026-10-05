import mediaModel from '../../models/mediaModel.js';
import { processAndSaveImage, processAndSaveVideo, processAndSaveDocument } from '../../middleware/uploadMiddleware.js';
import storage from '../../config/storage.js';
import logger from '../../utils/logger.js';

function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export const mediaController = {
  async index(req, res) {
    try {
      const { type = 'all', search = '', page = 1 } = req.query;
      const limit = 40;
      const offset = (parseInt(page, 10) - 1) * limit;

      const [mediaList, totalCount, countsByType] = await Promise.all([
        mediaModel.findAll({ mediaType: type, search, limit, offset }),
        mediaModel.count({ mediaType: type, search }),
        mediaModel.countByType()
      ]);

      res.render('admin/media/index', {
        title: 'Media Library Terpadu',
        pageTitle: 'Media Library',
        activeNav: 'media',
        mediaList,
        totalCount,
        countsByType,
        currentType: type,
        searchQuery: search,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalCount / limit) || 1,
        user: req.user,
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('Media controller index error:', err);
      res.status(500).render('admin/media/index', {
        title: 'Media Library Terpadu',
        pageTitle: 'Media Library',
        activeNav: 'media',
        mediaList: [],
        totalCount: 0,
        countsByType: { all: 0, image: 0, video: 0, document: 0, youtube: 0 },
        currentType: 'all',
        searchQuery: '',
        currentPage: 1,
        totalPages: 1,
        user: req.user,
        error: 'Gagal memuat media library.'
      });
    }
  },

  async upload(req, res) {
    try {
      if (!req.file) {
        return res.redirect('/admin/media?error=' + encodeURIComponent('Pilih berkas file yang ingin diunggah.'));
      }

      const file = req.file;
      let mediaType = 'image';
      let fileUrl = null;

      if (file.mimetype.startsWith('image/')) {
        mediaType = 'image';
        const result = await processAndSaveImage(file.buffer, 'media', file.originalname, file.mimetype);
        fileUrl = result.url;
      } else if (file.mimetype.startsWith('video/')) {
        mediaType = 'video';
        const result = await processAndSaveVideo(file.buffer, file.originalname, file.mimetype, 'media');
        fileUrl = result.url;
      } else if (file.mimetype === 'application/pdf') {
        mediaType = 'document';
        const result = await processAndSaveDocument(file.buffer, file.originalname, file.mimetype, 'media');
        fileUrl = result.url;
      } else {
        return res.redirect('/admin/media?error=' + encodeURIComponent('Tipe file tidak didukung.'));
      }

      await mediaModel.create({
        filename: file.originalname,
        file_url: fileUrl,
        mime_type: file.mimetype,
        file_size: file.size,
        media_type: mediaType,
        created_by: req.user?.id || null
      });

      res.redirect('/admin/media?success=' + encodeURIComponent('Berkas media berhasil diunggah.'));
    } catch (err) {
      logger.error('Media controller upload error:', err);
      res.redirect('/admin/media?error=' + encodeURIComponent('Gagal mengunggah media: ' + err.message));
    }
  },

  async addYoutube(req, res) {
    try {
      const { youtube_url, title } = req.body;
      const youtubeId = extractYouTubeId(youtube_url);

      if (!youtubeId) {
        return res.redirect('/admin/media?error=' + encodeURIComponent('Tautan YouTube tidak valid. Harap gunakan URL video YouTube resmi.'));
      }

      const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
      const defaultTitle = title && title.trim() ? title.trim() : `YouTube Video (${youtubeId})`;

      await mediaModel.create({
        filename: defaultTitle,
        file_url: embedUrl,
        mime_type: 'video/youtube',
        file_size: 0,
        media_type: 'youtube',
        youtube_id: youtubeId,
        created_by: req.user?.id || null
      });

      res.redirect('/admin/media?success=' + encodeURIComponent('Tautan video YouTube berhasil didaftarkan.'));
    } catch (err) {
      logger.error('Media controller addYoutube error:', err);
      res.redirect('/admin/media?error=' + encodeURIComponent('Gagal menambahkan video YouTube.'));
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const media = await mediaModel.findById(id);
      if (!media) {
        return res.redirect('/admin/media?error=' + encodeURIComponent('Media tidak ditemukan.'));
      }

      if (media.media_type !== 'youtube' && media.file_url) {
        await storage.delete(media.file_url);
      }

      await mediaModel.delete(id);
      res.redirect('/admin/media?success=' + encodeURIComponent('Media berhasil dihapus.'));
    } catch (err) {
      logger.error('Media controller destroy error:', err);
      res.redirect('/admin/media?error=' + encodeURIComponent('Gagal menghapus media.'));
    }
  },

  async apiList(req, res) {
    try {
      const { type = 'image', limit = 30 } = req.query;
      const list = await mediaModel.findAll({ mediaType: type, limit: parseInt(limit, 10) });
      res.json({ success: true, data: list });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

export default mediaController;
