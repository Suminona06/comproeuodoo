import { query, execute, pool } from '../config/database.js';

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

  async findByIdsWithPostCount(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await query(
      `SELECT c.id, c.name_id, COUNT(p.id) AS post_count
       FROM post_categories c
       LEFT JOIN posts p ON c.id = p.category_id
       WHERE c.id IN (${placeholders})
       GROUP BY c.id`,
      ids
    );
    return rows.map((row) => ({
      ...row,
      post_count: Number(row.post_count) || 0
    }));
  },

  async delete(id) {
    await execute('UPDATE posts SET category_id = NULL WHERE category_id = ?', [id]);
    const result = await execute('DELETE FROM post_categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async deleteMany(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(', ');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`UPDATE posts SET category_id = NULL WHERE category_id IN (${placeholders})`, ids);
      const [result] = await connection.execute(`DELETE FROM post_categories WHERE id IN (${placeholders})`, ids);
      await connection.commit();
      return result.affectedRows || 0;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

export default postCategoryModel;
