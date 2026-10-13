import { query, execute } from '../config/database.js';

export const aboutStatsModel = {
  async findAll({ activeOnly = false } = {}) {
    let sql = 'SELECT * FROM about_stats';
    const params = [];
    if (activeOnly) {
      sql += ' WHERE is_active = 1';
    }
    sql += ' ORDER BY sort_order ASC, id ASC';
    return await query(sql, params);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM about_stats WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const sql = `
      INSERT INTO about_stats (stat_value, label_id, label_en, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.stat_value,
      data.label_id,
      data.label_en || '',
      data.sort_order || 0,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    ];
    const result = await execute(sql, params);
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];

    const allowed = ['stat_value', 'label_id', 'label_en', 'sort_order', 'is_active'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'is_active' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE about_stats SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, params);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const result = await execute('DELETE FROM about_stats WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async updateSortOrder(items) {
    for (const item of items) {
      if (item.id && typeof item.sort_order === 'number') {
        await execute('UPDATE about_stats SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
      }
    }
    return true;
  }
};

export default aboutStatsModel;
