import { query, execute } from '../config/database.js';

export const capabilityModel = {
  async findAll(onlyActive = false) {
    const sql = onlyActive
      ? 'SELECT * FROM capabilities WHERE is_active = 1 ORDER BY sort_order ASC, id DESC'
      : 'SELECT * FROM capabilities ORDER BY sort_order ASC, id DESC';
    return await query(sql);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM capabilities WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const result = await execute(
      `INSERT INTO capabilities (title_id, title_en, machine_type, capacity, description_id, description_en, image_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title_id,
        data.title_en || data.title_id,
        data.machine_type,
        data.capacity || null,
        data.description_id || null,
        data.description_en || null,
        data.image_url || null,
        parseInt(data.sort_order || '0', 10),
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.title_id !== undefined) { fields.push('title_id = ?'); values.push(data.title_id); }
    if (data.title_en !== undefined) { fields.push('title_en = ?'); values.push(data.title_en); }
    if (data.machine_type !== undefined) { fields.push('machine_type = ?'); values.push(data.machine_type); }
    if (data.capacity !== undefined) { fields.push('capacity = ?'); values.push(data.capacity); }
    if (data.description_id !== undefined) { fields.push('description_id = ?'); values.push(data.description_id); }
    if (data.description_en !== undefined) { fields.push('description_en = ?'); values.push(data.description_en); }
    if (data.image_url !== undefined) { fields.push('image_url = ?'); values.push(data.image_url); }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(parseInt(data.sort_order, 10)); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE capabilities SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, values);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const result = await execute('DELETE FROM capabilities WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

export default capabilityModel;
