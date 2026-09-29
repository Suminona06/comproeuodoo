import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bannerModel from '../../models/bannerModel.js';
import { processAndSaveWebP, saveVideoFile } from '../../middleware/uploadMiddleware.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export const bannerController = {
  /**
   * List all banners
   */
  async index(req, res) {
    try {
      const banners = await bannerModel.findAll(false);
      res.render('admin/banners/index', {
        title: 'Kelola Banner Hero - PT Euodoo CMS',
        activeNav: 'banners',
        banners,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Banner index error:', { message: err.message });
      res.status(500).render('admin/banners/index', {
        title: 'Kelola Banner Hero - PT Euodoo CMS',
        activeNav: 'banners',
        banners: [],
        error: 'Gagal mengambil data banner.',
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  /**
   * Create new banner
   */
  async store(req, res) {
    try {
      const { title_id, title_en, subtitle_id, subtitle_en, link_url, sort_order, media_type } = req.body;

      if (!title_id || !req.file) {
        return res.redirect('/admin/banners?error=Judul+dan+berkas+media+wajib+diisi.');
      }

      let fileUrl = '';
      if (req.file.mimetype.startsWith('image/')) {
        fileUrl = await processAndSaveWebP(req.file.buffer, 'banners', { maxWidth: 1920, maxHeight: 1080, quality: 85 });
      } else if (req.file.mimetype.startsWith('video/')) {
        fileUrl = await saveVideoFile(req.file.buffer, req.file.originalname);
      } else {
        return res.redirect('/admin/banners?error=Format+media+tidak+didukung.');
      }

      await bannerModel.create({
        title_id,
        title_en: title_en || title_id,
        subtitle_id,
        subtitle_en,
        link_url,
        sort_order: parseInt(sort_order || '0', 10),
        media_type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
        file_url: fileUrl,
        is_active: 1
      });

      logger.info(`Banner created successfully: ${title_id}`);
      return res.redirect('/admin/banners?success=Banner+berhasil+ditambahkan.');
    } catch (err) {
      logger.error('Banner store error:', { message: err.message });
      return res.redirect(`/admin/banners?error=${encodeURIComponent(err.message)}`);
    }
  },

  /**
   * Update banner info
   */
  async update(req, res) {
    const { id } = req.params;
    const { title_id, title_en, subtitle_id, subtitle_en, link_url, sort_order } = req.body;

    try {
      await bannerModel.update(id, {
        title_id,
        title_en,
        subtitle_id,
        subtitle_en,
        link_url,
        sort_order: parseInt(sort_order || '0', 10)
      });

      logger.info(`Banner #${id} updated.`);
      return res.redirect('/admin/banners?success=Perubahan+banner+berhasil+disimpan.');
    } catch (err) {
      logger.error('Banner update error:', { message: err.message });
      return res.redirect(`/admin/banners?error=${encodeURIComponent(err.message)}`);
    }
  },

  /**
   * Toggle banner status
   */
  async toggleStatus(req, res) {
    const { id } = req.params;

    try {
      await bannerModel.toggleStatus(id);
      logger.info(`Banner #${id} status toggled.`);
      return res.redirect('/admin/banners?success=Status+banner+berhasil+diperbarui.');
    } catch (err) {
      logger.warn(`Banner toggle error: ${err.message}`);
      return res.redirect(`/admin/banners?error=${encodeURIComponent(err.message)}`);
    }
  },

  /**
   * Delete banner
   */
  async destroy(req, res) {
    const { id } = req.params;

    try {
      const banner = await bannerModel.findById(id);
      if (!banner) {
        return res.redirect('/admin/banners?error=Banner+tidak+ditemukan.');
      }

      await bannerModel.delete(id);

      // Unlink media file from disk
      if (banner.file_url && banner.file_url.startsWith('/uploads/')) {
        const filePath = path.join(rootDir, 'public', banner.file_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      logger.info(`Banner #${id} deleted.`);
      return res.redirect('/admin/banners?success=Banner+berhasil+dihapus.');
    } catch (err) {
      logger.error('Banner delete error:', { message: err.message });
      return res.redirect(`/admin/banners?error=${encodeURIComponent(err.message)}`);
    }
  }
};

export default bannerController;
