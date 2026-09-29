import { query, execute } from '../config/database.js';

export const bannerModel = {
  /**
   * Get all banners ordered by sort_order
   * @param {boolean} onlyActive
   * @returns {Promise<Array>}
   */
  async findAll(onlyActive = false) {
    const sql = onlyActive
      ? 'SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id DESC'
      : 'SELECT * FROM banners ORDER BY sort_order ASC, id DESC';
    return await query(sql);
  },

  /**
   * Find banner by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const rows = await query('SELECT * FROM banners WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Count active banners
   * @returns {Promise<number>}
   */
  async countActive() {
    const rows = await query('SELECT COUNT(*) as total FROM banners WHERE is_active = 1');
    return rows[0]?.total || 0;
  },

  /**
   * Create a new banner
   * @param {Object} data
   * @returns {Promise<number>} insertId
   */
  async create(data) {
    const result = await execute(
      `INSERT INTO banners (title_id, title_en, subtitle_id, subtitle_en, media_type, file_url, poster_url, link_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title_id,
        data.title_en || null,
        data.subtitle_id || null,
        data.subtitle_en || null,
        data.media_type || 'image',
        data.file_url,
        data.poster_url || null,
        data.link_url || null,
        parseInt(data.sort_order || '0', 10),
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
      ]
    );
    return result.insertId;
  },

  /**
   * Update banner details
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.title_id !== undefined) { fields.push('title_id = ?'); values.push(data.title_id); }
    if (data.title_en !== undefined) { fields.push('title_en = ?'); values.push(data.title_en); }
    if (data.subtitle_id !== undefined) { fields.push('subtitle_id = ?'); values.push(data.subtitle_id); }
    if (data.subtitle_en !== undefined) { fields.push('subtitle_en = ?'); values.push(data.subtitle_en); }
    if (data.media_type !== undefined) { fields.push('media_type = ?'); values.push(data.media_type); }
    if (data.file_url !== undefined) { fields.push('file_url = ?'); values.push(data.file_url); }
    if (data.poster_url !== undefined) { fields.push('poster_url = ?'); values.push(data.poster_url); }
    if (data.link_url !== undefined) { fields.push('link_url = ?'); values.push(data.link_url); }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(parseInt(data.sort_order, 10)); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE banners SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, values);
    return result.affectedRows > 0;
  },

  /**
   * Toggle active status of banner
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async toggleStatus(id) {
    const banner = await this.findById(id);
    if (!banner) return false;

    // Check if trying to deactivate the last active banner
    if (banner.is_active === 1) {
      const activeCount = await this.countActive();
      if (activeCount <= 1) {
        throw new Error('Minimal harus ada satu banner hero yang aktif.');
      }
    }

    const newStatus = banner.is_active === 1 ? 0 : 1;
    await execute('UPDATE banners SET is_active = ? WHERE id = ?', [newStatus, id]);
    return true;
  },

  /**
   * Delete banner
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const banner = await this.findById(id);
    if (!banner) return false;

    if (banner.is_active === 1) {
      const activeCount = await this.countActive();
      if (activeCount <= 1) {
        throw new Error('Tidak dapat menghapus satu-satunya banner hero yang aktif.');
      }
    }

    const result = await execute('DELETE FROM banners WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

export default bannerModel;
