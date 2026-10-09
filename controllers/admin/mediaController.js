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
      const isForce = req.query.force === 'true' || req.body.force === 'true';
      const isJson = req.xhr || req.headers.accept?.includes('application/json') || req.query.format === 'json';

      const media = await mediaModel.findById(id);
      if (!media) {
        if (isJson) return res.status(404).json({ success: false, message: 'Media tidak ditemukan.' });
        return res.redirect('/admin/media?error=' + encodeURIComponent('Media tidak ditemukan.'));
      }

      if (!isForce && media.file_url) {
        const usages = await mediaModel.checkUsage(media.file_url);
        if (usages.length > 0) {
          if (isJson) {
            return res.status(409).json({ success: false, inUse: true, usages });
          }
          const usageList = usages.map(u => `${u.source}: ${u.label}`).join(', ');
          return res.redirect('/admin/media?error=' + encodeURIComponent(`Media sedang aktif digunakan pada: ${usageList}. Gunakan force delete jika ingin tetap menghapus.`));
        }
      }

      if (media.media_type !== 'youtube' && media.file_url) {
        await storage.delete(media.file_url);
      }

      await mediaModel.delete(id);

      if (isJson) {
        return res.json({ success: true, message: 'Media berhasil dihapus.' });
      }
      res.redirect('/admin/media?success=' + encodeURIComponent('Media berhasil dihapus.'));
    } catch (err) {
      logger.error('Media controller destroy error:', err);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.redirect('/admin/media?error=' + encodeURIComponent('Gagal menghapus media.'));
    }
  },

  async apiList(req, res) {
    try {
      const { type = 'all', search = '', page = 1, limit = 24 } = req.query;
      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100);
      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const offset = (parsedPage - 1) * parsedLimit;

      const [list, total] = await Promise.all([
        mediaModel.findAll({ mediaType: type, search, limit: parsedLimit, offset }),
        mediaModel.count({ mediaType: type, search })
      ]);

      res.json({
        success: true,
        data: list,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages: Math.ceil(total / parsedLimit) || 1
        }
      });
    } catch (err) {
      logger.error('mediaController.apiList error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async apiUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Pilih berkas file yang ingin diunggah.' });
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
        return res.status(400).json({ success: false, message: 'Tipe file tidak didukung.' });
      }

      const newId = await mediaModel.create({
        filename: file.originalname,
        file_url: fileUrl,
        mime_type: file.mimetype,
        file_size: file.size,
        media_type: mediaType,
        created_by: req.user?.id || null
      });

      const newMedia = await mediaModel.findById(newId);
      res.json({ success: true, data: newMedia });
    } catch (err) {
      logger.error('mediaController.apiUpload error:', err);
      res.status(500).json({ success: false, message: 'Gagal mengunggah media: ' + err.message });
    }
  },

  async apiCheckUsage(req, res) {
    try {
      const fileUrl = req.body?.file_url || req.query?.file_url;
      if (!fileUrl) {
        return res.json({ inUse: false, usages: [] });
      }
      const usages = await mediaModel.checkUsage(fileUrl);
      res.json({ inUse: usages.length > 0, usages });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

export default mediaController;

