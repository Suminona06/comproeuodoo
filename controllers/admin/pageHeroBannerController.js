import pageHeroBannerModel from '../../models/pageHeroBannerModel.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import logger from '../../utils/logger.js';

const ALLOWED_PAGE_KEYS = ['about', 'products', 'news', 'contact'];

export const pageHeroBannerController = {
  /**
   * Menampilkan daftar konfigurasi Hero Banner untuk 4 halaman
   */
  async index(req, res) {
    try {
      const banners = await pageHeroBannerModel.getAll();
      res.render('admin/hero-banners/index', {
        title: 'Hero Banner Per Halaman - PT Euodoo CMS',
        pageTitle: 'Hero Banner Per Halaman Publik',
        activeNav: 'hero-banners',
        banners,
        csrfToken: res.locals.csrfToken || '',
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('pageHeroBannerController.index error:', err);
      res.redirect('/admin/dashboard?error=' + encodeURIComponent('Gagal memuat hero banner per halaman.'));
    }
  },

  /**
   * Memperbarui hero banner halaman tertentu
   */
  async update(req, res) {
    try {
      const { pageKey } = req.params;
      if (!ALLOWED_PAGE_KEYS.includes(pageKey)) {
        return res.redirect('/admin/hero-banners?error=' + encodeURIComponent('Halaman tidak valid.'));
      }

      const {
        title_id,
        title_en,
        subtitle_id,
        subtitle_en,
        overlay_opacity,
        cta_text_id,
        cta_text_en,
        cta_url,
        is_active
      } = req.body;

      const updateData = {
        title_id: title_id ? title_id.trim() : '',
        title_en: title_en ? title_en.trim() : '',
        subtitle_id: subtitle_id ? subtitle_id.trim() : '',
        subtitle_en: subtitle_en ? subtitle_en.trim() : '',
        overlay_opacity: overlay_opacity !== undefined ? parseFloat(overlay_opacity) : 0.60,
        cta_text_id: cta_text_id ? cta_text_id.trim() : '',
        cta_text_en: cta_text_en ? cta_text_en.trim() : '',
        cta_url: cta_url ? cta_url.trim() : '',
        is_active: is_active === '1' || is_active === 1 || is_active === true || is_active === 'on' ? 1 : 0
      };

      if (req.file) {
        const imageUrl = await processAndSaveWebP(req.file.buffer, 'pages', { maxWidth: 1920, maxHeight: 1080 });
        if (imageUrl) {
          updateData.image_url = imageUrl;
        }
      } else if (req.body.image_url !== undefined && req.body.image_url.trim() !== '') {
        updateData.image_url = req.body.image_url.trim();
      }

      await pageHeroBannerModel.updateByPageKey(pageKey, updateData);
      logger.info(`Hero banner for page '${pageKey}' updated successfully by ${req.user?.email || 'admin'}`);

      const pageLabelMap = {
        about: 'Tentang Kami',
        products: 'Produk',
        news: 'Berita & Artikel',
        contact: 'Kontak'
      };

      res.redirect(
        '/admin/hero-banners?success=' +
          encodeURIComponent(`Hero banner untuk halaman ${pageLabelMap[pageKey] || pageKey} berhasil diperbarui.`)
      );
    } catch (err) {
      logger.error('pageHeroBannerController.update error:', err);
      res.redirect(
        '/admin/hero-banners?error=' +
          encodeURIComponent('Gagal memperbarui hero banner: ' + err.message)
      );
    }
  }
};

export default pageHeroBannerController;
