import { query, execute } from '../config/database.js';

export const postModel = {
  /**
   * Find posts with filters: type ('berita'|'pers'|'blog'), categoryId, status, headline, search
   */
  async findAll(options = {}) {
    await this.checkScheduledPublish();

    const { type, categoryId, status, isHeadline, limit, offset, search } = options;
    const conditions = [];
    const params = [];

    if (type && type !== 'all') {
      conditions.push('p.type = ?');
      params.push(type);
    }
    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (status && status !== 'all') {
      conditions.push('p.status = ?');
      params.push(status);
    }
    if (isHeadline !== undefined) {
      conditions.push('p.is_headline = ?');
      params.push(isHeadline ? 1 : 0);
    }
    if (search) {
      conditions.push('(p.title_id LIKE ? OR p.title_en LIKE ? OR p.slug LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let sql = `
      SELECT p.*,
             p.cover_image as display_image,
             p.cover_image as image_url,
             c.name_id as category_name_id,
             c.name_en as category_name_en,
             c.slug as category_slug
      FROM posts p
      LEFT JOIN post_categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.is_headline DESC, p.created_at DESC
    `;

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
    const { type, categoryId, status, isHeadline, search } = options;
    const conditions = [];
    const params = [];

    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }
    if (categoryId) {
      conditions.push('category_id = ?');
      params.push(categoryId);
    }
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    if (isHeadline !== undefined) {
      conditions.push('is_headline = ?');
      params.push(isHeadline ? 1 : 0);
    }
    if (search) {
      conditions.push('(title_id LIKE ? OR title_en LIKE ? OR slug LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`SELECT COUNT(*) as total FROM posts ${whereClause}`, params);
    return rows[0]?.total || 0;
  },

  async findById(id) {
    const rows = await query(
      `SELECT p.*,
              p.cover_image as display_image,
              p.cover_image as image_url,
              c.name_id as category_name_id,
              c.name_en as category_name_en,
              c.slug as category_slug
       FROM posts p
       LEFT JOIN post_categories c ON p.category_id = c.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findBySlug(slug) {
    await this.checkScheduledPublish();
    const rows = await query(
      `SELECT p.*,
              p.cover_image as display_image,
              p.cover_image as image_url,
              c.name_id as category_name_id,
              c.name_en as category_name_en,
              c.slug as category_slug
       FROM posts p
       LEFT JOIN post_categories c ON p.category_id = c.id
       WHERE p.slug = ? LIMIT 1`,
      [slug]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async isSlugTaken(slug, excludeId = null) {
    let sql = 'SELECT id FROM posts WHERE slug = ?';
    const params = [slug];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    const rows = await query(sql, params);
    return rows.length > 0;
  },

  async create(data) {
    const coverImage = data.cover_image || data.image_url || null;
    const isHeadline = data.is_headline ? 1 : 0;
    const publishedAt = data.status === 'published' ? new Date() : null;

    const sql = `
      INSERT INTO posts (
        category_id, type, title_id, title_en, slug,
        content_id, content_en, excerpt_id, excerpt_en,
        cover_image, is_headline, status, published_at, scheduled_at,
        meta_title_id, meta_title_en, meta_description_id, meta_description_en,
        og_image, canonical_url, robots, jsonld
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.category_id || null,
      data.type || 'berita',
      data.title_id,
      data.title_en || data.title_id,
      data.slug,
      data.content_id || null,
      data.content_en || null,
      data.excerpt_id || null,
      data.excerpt_en || null,
      coverImage,
      isHeadline,
      data.status || 'draft',
      publishedAt,
      data.scheduled_at || null,
      data.meta_title_id || null,
      data.meta_title_en || null,
      data.meta_description_id || data.meta_desc_id || null,
      data.meta_description_en || data.meta_desc_en || null,
      data.og_image || null,
      data.canonical_url || null,
      data.robots || 'index',
      data.jsonld ? (typeof data.jsonld === 'object' ? JSON.stringify(data.jsonld) : data.jsonld) : null
    ];

    const result = await execute(sql, params);
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    const fieldMap = {
      category_id: (v) => v || null,
      type: (v) => v || 'berita',
      title_id: (v) => v,
      title_en: (v) => v,
      slug: (v) => v,
      content_id: (v) => v || null,
      content_en: (v) => v || null,
      excerpt_id: (v) => v || null,
      excerpt_en: (v) => v || null,
      cover_image: (v) => v || null,
      is_headline: (v) => (v ? 1 : 0),
      status: (v) => v || 'draft',
      published_at: (v) => v || null,
      scheduled_at: (v) => v || null,
      meta_title_id: (v) => v || null,
      meta_title_en: (v) => v || null,
      meta_description_id: (v) => v || null,
      meta_description_en: (v) => v || null,
      og_image: (v) => v || null,
      canonical_url: (v) => v || null,
      robots: (v) => v || 'index',
      jsonld: (v) => (typeof v === 'object' ? JSON.stringify(v) : v || null)
    };

    if (data.image_url !== undefined && data.cover_image === undefined) {
      data.cover_image = data.image_url;
    }
    if (data.meta_desc_id !== undefined && data.meta_description_id === undefined) {
      data.meta_description_id = data.meta_desc_id;
    }
    if (data.meta_desc_en !== undefined && data.meta_description_en === undefined) {
      data.meta_description_en = data.meta_desc_en;
    }

    for (const [key, transform] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(transform(data[key]));
      }
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
  },

  async incrementViews(id) {
    // Graceful no-op if views_count is not present
    return true;
  },

  /**
   * Auto-publish scheduled posts that have reached their scheduled_at time
   */
  async checkScheduledPublish() {
    try {
      await execute(
        "UPDATE posts SET status = 'published', published_at = NOW() WHERE status = 'scheduled' AND scheduled_at <= NOW()"
      );
    } catch {
      // Non-blocking
    }
  }
};

export default postModel;
