import { query, execute } from '../config/database.js';

export const mediaModel = {
  async findAll({ mediaType = null, search = '', limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT m.*,
        CASE
          WHEN m.mime_type = 'video/youtube' THEN 'youtube'
          WHEN m.mime_type LIKE 'image/%' THEN 'image'
          WHEN m.mime_type LIKE 'video/%' THEN 'video'
          ELSE 'document'
        END as media_type,
        CASE
          WHEN m.mime_type = 'video/youtube' THEN m.alt_text
          ELSE NULL
        END as youtube_id
      FROM media m
      WHERE 1=1
    `;
    const params = [];

    if (mediaType && mediaType !== 'all') {
      if (mediaType === 'youtube') {
        sql += " AND m.mime_type = 'video/youtube'";
      } else if (mediaType === 'image') {
        sql += " AND m.mime_type LIKE 'image/%'";
      } else if (mediaType === 'video') {
        sql += " AND m.mime_type LIKE 'video/%' AND m.mime_type != 'video/youtube'";
      } else if (mediaType === 'document') {
        sql += " AND (m.mime_type LIKE 'application/%' OR (m.mime_type NOT LIKE 'image/%' AND m.mime_type NOT LIKE 'video/%'))";
      }
    }

    if (search) {
      sql += ' AND (m.filename LIKE ? OR m.original_name LIKE ? OR m.file_url LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    return await query(sql, params);
  },

  async count({ mediaType = null, search = '' } = {}) {
    let sql = 'SELECT COUNT(*) as total FROM media m WHERE 1=1';
    const params = [];

    if (mediaType && mediaType !== 'all') {
      if (mediaType === 'youtube') {
        sql += " AND m.mime_type = 'video/youtube'";
      } else if (mediaType === 'image') {
        sql += " AND m.mime_type LIKE 'image/%'";
      } else if (mediaType === 'video') {
        sql += " AND m.mime_type LIKE 'video/%' AND m.mime_type != 'video/youtube'";
      } else if (mediaType === 'document') {
        sql += " AND (m.mime_type LIKE 'application/%' OR (m.mime_type NOT LIKE 'image/%' AND m.mime_type NOT LIKE 'video/%'))";
      }
    }

    if (search) {
      sql += ' AND (m.filename LIKE ? OR m.original_name LIKE ? OR m.file_url LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const rows = await query(sql, params);
    return rows[0]?.total || 0;
  },

  async findById(id) {
    const sql = `
      SELECT m.*,
        CASE
          WHEN m.mime_type = 'video/youtube' THEN 'youtube'
          WHEN m.mime_type LIKE 'image/%' THEN 'image'
          WHEN m.mime_type LIKE 'video/%' THEN 'video'
          ELSE 'document'
        END as media_type,
        CASE
          WHEN m.mime_type = 'video/youtube' THEN m.alt_text
          ELSE NULL
        END as youtube_id
      FROM media m
      WHERE m.id = ? LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const mimeType = data.mime_type || (data.media_type === 'youtube' ? 'video/youtube' : 'application/octet-stream');
    const altText = data.alt_text || data.youtube_id || data.filename || null;
    const originalName = data.original_name || data.filename || 'media';
    const storageDriver = data.storage_driver || 'local';

    const sql = `
      INSERT INTO media (filename, original_name, file_url, mime_type, file_size, storage_driver, alt_text)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.filename,
      originalName,
      data.file_url,
      mimeType,
      data.file_size || 0,
      storageDriver,
      altText
    ];
    const result = await execute(sql, params);
    return result.insertId;
  },

  async delete(id) {
    const result = await execute('DELETE FROM media WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async countByType() {
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN mime_type LIKE 'image/%' THEN 1 ELSE 0 END), 0) as image_count,
        COALESCE(SUM(CASE WHEN mime_type LIKE 'video/%' AND mime_type != 'video/youtube' THEN 1 ELSE 0 END), 0) as video_count,
        COALESCE(SUM(CASE WHEN mime_type = 'video/youtube' THEN 1 ELSE 0 END), 0) as youtube_count,
        COALESCE(SUM(CASE WHEN mime_type LIKE 'application/%' OR (mime_type NOT LIKE 'image/%' AND mime_type NOT LIKE 'video/%') THEN 1 ELSE 0 END), 0) as doc_count,
        COUNT(*) as total_count
      FROM media
    `;
    const rows = await query(sql);
    const row = rows[0] || {};
    return {
      all: parseInt(row.total_count || 0, 10),
      image: parseInt(row.image_count || 0, 10),
      video: parseInt(row.video_count || 0, 10),
      document: parseInt(row.doc_count || 0, 10),
      youtube: parseInt(row.youtube_count || 0, 10)
    };
  },

  async checkUsage(fileUrl) {
    if (!fileUrl) return [];
    try {
      const sql = `
        SELECT 'Banner' as source, title_id as label FROM banners WHERE file_url = ? OR poster_url = ?
        UNION ALL
        SELECT 'Hero Banner' as source, page_key as label FROM page_hero_banners WHERE image_url = ?
        UNION ALL
        SELECT 'Katalog Produk' as source, name_id as label FROM products WHERE image_url = ?
        UNION ALL
        SELECT 'Artikel Berita' as source, title_id as label FROM posts WHERE cover_image = ?
        UNION ALL
        SELECT 'Merek' as source, name as label FROM brands WHERE logo_url = ?
        UNION ALL
        SELECT 'Kapabilitas' as source, title_id as label FROM capabilities WHERE image_url = ?
        UNION ALL
        SELECT 'Pengaturan' as source, 'Logo / Favicon / Dokumentasi' as label FROM settings
        WHERE site_logo_header = ? OR site_logo_footer = ? OR site_favicon = ? OR about_image_url = ?
      `;
      const params = [
        fileUrl, fileUrl,
        fileUrl,
        fileUrl,
        fileUrl,
        fileUrl,
        fileUrl,
        fileUrl, fileUrl, fileUrl, fileUrl
      ];
      return await query(sql, params);
    } catch (err) {
      return [];
    }
  }
};

export default mediaModel;

