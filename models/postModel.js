import { query, execute } from '../config/database.js';

export const postModel = {
  async findAll(options = {}) {
    const { status, limit, offset } = options;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let sql = `SELECT * FROM posts ${whereClause} ORDER BY published_at DESC, id DESC`;

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(offset, 10));
      }
    }

    return await query(sql, params);
  },

  async countAll(options = {}) {
    const { status } = options;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`SELECT COUNT(*) as total FROM posts ${whereClause}`, params);
    return rows[0]?.total || 0;
  },

  async findById(id) {
    const rows = await query('SELECT * FROM posts WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async findBySlug(slug) {
    const rows = await query('SELECT * FROM posts WHERE slug = ? LIMIT 1', [slug]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const result = await execute(
      `INSERT INTO posts (title_id, title_en, slug, content_id, content_en, excerpt_id, excerpt_en, cover_image, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title_id,
        data.title_en || data.title_id,
        data.slug,
        data.content_id || null,
        data.content_en || null,
        data.excerpt_id || null,
        data.excerpt_en || null,
        data.cover_image || null,
        data.status || 'draft',
        data.status === 'published' ? (data.published_at || new Date()) : null
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.title_id !== undefined) { fields.push('title_id = ?'); values.push(data.title_id); }
    if (data.title_en !== undefined) { fields.push('title_en = ?'); values.push(data.title_en); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.content_id !== undefined) { fields.push('content_id = ?'); values.push(data.content_id); }
    if (data.content_en !== undefined) { fields.push('content_en = ?'); values.push(data.content_en); }
    if (data.excerpt_id !== undefined) { fields.push('excerpt_id = ?'); values.push(data.excerpt_id); }
    if (data.excerpt_en !== undefined) { fields.push('excerpt_en = ?'); values.push(data.excerpt_en); }
    if (data.cover_image !== undefined) { fields.push('cover_image = ?'); values.push(data.cover_image); }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
      if (data.status === 'published' && !data.published_at) {
        fields.push('published_at = IFNULL(published_at, NOW())');
      }
    }
    if (data.published_at !== undefined) {
      fields.push('published_at = ?');
      values.push(data.published_at);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, values);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const result = await execute('DELETE FROM posts WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

export default postModel;
