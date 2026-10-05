import { query, execute } from '../config/database.js';

export const postCategoryModel = {
  async findAll({ type = null } = {}) {
    let sql = `
      SELECT c.*, COUNT(p.id) as post_count
      FROM post_categories c
      LEFT JOIN posts p ON c.id = p.category_id
    `;
    const params = [];
    if (type) {
      sql += ' WHERE c.type = ?';
      params.push(type);
    }
    sql += ' GROUP BY c.id ORDER BY c.sort_order ASC, c.name_id ASC';
    return await query(sql, params);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM post_categories WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async findBySlug(slug) {
    const rows = await query('SELECT * FROM post_categories WHERE slug = ? LIMIT 1', [slug]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const sql = `
      INSERT INTO post_categories (name_id, name_en, slug, type, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      data.name_id,
      data.name_en || data.name_id,
      data.slug,
      data.type || 'berita',
      data.sort_order || 0
    ];
    const result = await execute(sql, params);
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['name_id', 'name_en', 'slug', 'type', 'sort_order'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE post_categories SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, params);
    return result.affectedRows > 0;
  },

  async delete(id) {
    await execute('UPDATE posts SET category_id = NULL WHERE category_id = ?', [id]);
    const result = await execute('DELETE FROM post_categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

export default postCategoryModel;
