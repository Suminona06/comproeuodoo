import pool from '../config/database.js';
import logger from '../utils/logger.js';

export const pageHeroBannerModel = {
  /**
   * Mengambil semua hero banner per halaman
   */
  async getAll() {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM page_hero_banners ORDER BY FIELD(page_key, 'about', 'products', 'news', 'contact'), id ASC"
      );
      return rows;
    } catch (err) {
      logger.error('pageHeroBannerModel.getAll error:', err);
      return [];
    }
  },

  /**
   * Mengambil hero banner berdasarkan page_key
   * @param {string} pageKey 
   */
  async getByPageKey(pageKey) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM page_hero_banners WHERE page_key = ? LIMIT 1',
        [pageKey]
      );
      return rows[0] || null;
    } catch (err) {
      logger.error(`pageHeroBannerModel.getByPageKey(${pageKey}) error:`, err);
      return null;
    }
  },

  /**
   * Memperbarui hero banner untuk halaman tertentu
   * @param {string} pageKey 
   * @param {object} data 
   */
  async updateByPageKey(pageKey, data) {
    try {
      const fields = [
        'title_id = ?',
        'title_en = ?',
        'subtitle_id = ?',
        'subtitle_en = ?',
        'overlay_opacity = ?',
        'cta_text_id = ?',
        'cta_text_en = ?',
        'cta_url = ?',
        'is_active = ?'
      ];
      const values = [
        data.title_id || '',
        data.title_en || '',
        data.subtitle_id || '',
        data.subtitle_en || '',
        parseFloat(data.overlay_opacity) || 0.60,
        data.cta_text_id || '',
        data.cta_text_en || '',
        data.cta_url || '',
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
      ];

      if (data.image_url) {
        fields.push('image_url = ?');
        values.push(data.image_url);
      }

      values.push(pageKey);

      const sql = `UPDATE page_hero_banners SET ${fields.join(', ')} WHERE page_key = ?`;
      const [result] = await pool.query(sql, values);
      return result.affectedRows > 0;
    } catch (err) {
      logger.error(`pageHeroBannerModel.updateByPageKey(${pageKey}) error:`, err);
      throw err;
    }
  }
};

export default pageHeroBannerModel;
