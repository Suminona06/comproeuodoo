import { query, execute } from '../config/database.js';

export const bannerModel = {
  async findAll(onlyActive = false) {
    const sql = onlyActive
      ? 'SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id DESC'
      : 'SELECT * FROM banners ORDER BY sort_order ASC, id DESC';
    const rows = await query(sql);
    return rows.map(r => this._normalizeFields(r));
  },

  async findById(id) {
    const rows = await query('SELECT * FROM banners WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? this._normalizeFields(rows[0]) : null;
  },

  async countActive() {
    const rows = await query('SELECT COUNT(*) as total FROM banners WHERE is_active = 1');
    return rows[0]?.total || 0;
  },

  async create(data) {
    const imgUrl = data.image_url || data.file_url || null;
    const ctaUrl = data.cta_url || data.link_url || null;
    const captionId = data.caption_id || data.subtitle_id || null;
    const captionEn = data.caption_en || data.subtitle_en || null;

    const sql = `
      INSERT INTO banners (
        title_id, title_en, caption_id, caption_en, image_url,
        media_type, video_url, poster_url, cta_text_id, cta_text_en,
        cta_url, sort_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.title_id,
      data.title_en || data.title_id,
      captionId,
      captionEn,
      imgUrl,
      data.media_type || 'image',
      data.video_url || null,
      data.poster_url || null,
      data.cta_text_id || null,
      data.cta_text_en || null,
      ctaUrl,
      parseInt(data.sort_order || '0', 10),
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    ];

    const result = await execute(sql, params);
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    const fieldMap = {
      title_id: data.title_id,
      title_en: data.title_en,
      caption_id: data.caption_id !== undefined ? data.caption_id : data.subtitle_id,
      caption_en: data.caption_en !== undefined ? data.caption_en : data.subtitle_en,
      image_url: data.image_url !== undefined ? data.image_url : data.file_url,
      media_type: data.media_type,
      video_url: data.video_url,
      poster_url: data.poster_url,
      cta_text_id: data.cta_text_id,
      cta_text_en: data.cta_text_en,
      cta_url: data.cta_url !== undefined ? data.cta_url : data.link_url,
      sort_order: data.sort_order !== undefined ? parseInt(data.sort_order, 10) : undefined,
      is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : undefined
    };

    for (const [key, val] of Object.entries(fieldMap)) {
      if (val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE banners SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, values);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const result = await execute('DELETE FROM banners WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async toggleActive(id) {
    const banner = await this.findById(id);
    if (!banner) return null;

    if (banner.is_active === 1) {
      const activeCount = await this.countActive();
      if (activeCount <= 1) {
        return { success: false, message: 'Minimal harus ada 1 banner yang aktif.' };
      }
    }

    const newStatus = banner.is_active ? 0 : 1;
    await execute('UPDATE banners SET is_active = ? WHERE id = ?', [newStatus, id]);
    return { success: true, newStatus: newStatus === 1 };
  },

  _normalizeFields(banner) {
    if (!banner) return null;
    return {
      ...banner,
      caption_id: banner.caption_id || banner.subtitle_id || '',
      caption_en: banner.caption_en || banner.subtitle_en || '',
      image_url: banner.image_url || banner.file_url || '',
      cta_url: banner.cta_url || banner.link_url || ''
    };
  }
};

export default bannerModel;
