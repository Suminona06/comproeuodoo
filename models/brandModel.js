import { query, execute } from '../config/database.js';

export const brandModel = {
  async findAll({ activeOnly = false } = {}) {
    let sql = 'SELECT * FROM brands';
    const params = [];
    if (activeOnly) {
      sql += ' WHERE is_active = 1';
    }
    sql += ' ORDER BY sort_order ASC, name ASC';
    return await query(sql, params);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM brands WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const sql = `
      INSERT INTO brands (name, logo_url, description_id, description_en, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.name,
      data.logo_url || null,
      data.description_id || null,
      data.description_en || null,
      data.sort_order || 0,
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    ];
    const result = await execute(sql, params);
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];

    const allowed = ['name', 'logo_url', 'description_id', 'description_en', 'sort_order', 'is_active'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'is_active' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE brands SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, params);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const result = await execute('DELETE FROM brands WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async toggleActive(id) {
    const brand = await this.findById(id);
    if (!brand) return null;
    const newStatus = brand.is_active ? 0 : 1;
    await execute('UPDATE brands SET is_active = ? WHERE id = ?', [newStatus, id]);
    return newStatus === 1;
  },

  async updateSortOrder(items) {
    for (const item of items) {
      if (item.id && typeof item.sort_order === 'number') {
        await execute('UPDATE brands SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
      }
    }
    return true;
  }
};

export default brandModel;
