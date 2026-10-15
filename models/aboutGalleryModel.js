import { query, execute } from '../config/database.js';

export const aboutGalleryModel = {
  async findAll({ activeOnly = false } = {}) {
    let sql = 'SELECT * FROM about_gallery_slides';
    const params = [];
    if (activeOnly) {
      sql += ' WHERE is_active = 1';
    }
    sql += ' ORDER BY sort_order ASC, id ASC';
    return await query(sql, params);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM about_gallery_slides WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const sql = `
      INSERT INTO about_gallery_slides 
        (image_url, category_id, category_en, title_id, title_en, subtitle_id, subtitle_en, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.image_url,
      data.category_id || '',
      data.category_en || '',
      data.title_id || '',
      data.title_en || '',
      data.subtitle_id || '',
      data.subtitle_en || '',
      data.sort_order || 0,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    ];
    const result = await execute(sql, params);
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];

    const allowed = [
      'image_url',
      'category_id',
      'category_en',
      'title_id',
      'title_en',
      'subtitle_id',
      'subtitle_en',
      'sort_order',
      'is_active'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'is_active' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE about_gallery_slides SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, params);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const result = await execute('DELETE FROM about_gallery_slides WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async updateSortOrder(items) {
    for (const item of items) {
      if (item.id && typeof item.sort_order === 'number') {
        await execute('UPDATE about_gallery_slides SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
      }
    }
    return true;
  }
};

export default aboutGalleryModel;
