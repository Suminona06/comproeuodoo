import { query, execute } from '../config/database.js';

export const productModel = {
  /**
   * Find products with optional filters, joined with category name
   */
  async findAll(options = {}) {
    const { categoryId, isActive, isFeatured, limit, offset, search } = options;
    const conditions = [];
    const params = [];

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (isActive !== undefined) {
      conditions.push('p.is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    if (isFeatured !== undefined) {
      conditions.push('p.is_featured = ?');
      params.push(isFeatured ? 1 : 0);
    }
    if (search) {
      conditions.push('(p.name_id LIKE ? OR p.name_en LIKE ? OR p.slug LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let sql = `
      SELECT p.*, c.name_id as category_name_id, c.name_en as category_name_en, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.sort_order ASC, p.id DESC
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

  /**
   * Count total products with filters
   */
  async countAll(options = {}) {
    const { categoryId, isActive, isFeatured, search } = options;
    const conditions = [];
    const params = [];

    if (categoryId) {
      conditions.push('category_id = ?');
      params.push(categoryId);
    }
    if (isActive !== undefined) {
      conditions.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    if (isFeatured !== undefined) {
      conditions.push('is_featured = ?');
      params.push(isFeatured ? 1 : 0);
    }
    if (search) {
      conditions.push('(name_id LIKE ? OR name_en LIKE ? OR slug LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`SELECT COUNT(*) as total FROM products ${whereClause}`, params);
    return rows[0]?.total || 0;
  },

  /**
   * Find product by ID
   */
  async findById(id) {
    const rows = await query(
      `SELECT p.*, c.name_id as category_name_id, c.name_en as category_name_en
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Find product by slug
   */
  async findBySlug(slug) {
    const rows = await query(
      `SELECT p.*, c.name_id as category_name_id, c.name_en as category_name_en
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? LIMIT 1`,
      [slug]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Create a new product
   */
  async create(data) {
    const result = await execute(
      `INSERT INTO products (
        category_id, name_id, name_en, slug, description_id, description_en,
        material_specs, technical_specs, main_image, gallery_images,
        is_featured, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.category_id,
        data.name_id,
        data.name_en,
        data.slug,
        data.description_id || null,
        data.description_en || null,
        typeof data.material_specs === 'object' ? JSON.stringify(data.material_specs) : data.material_specs || null,
        typeof data.technical_specs === 'object' ? JSON.stringify(data.technical_specs) : data.technical_specs || null,
        data.main_image || null,
        typeof data.gallery_images === 'object' ? JSON.stringify(data.gallery_images) : data.gallery_images || null,
        data.is_featured ? 1 : 0,
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
        parseInt(data.sort_order || '0', 10)
      ]
    );
    return result.insertId;
  },

  /**
   * Update product
   */
  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
    if (data.name_id !== undefined) { fields.push('name_id = ?'); values.push(data.name_id); }
    if (data.name_en !== undefined) { fields.push('name_en = ?'); values.push(data.name_en); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.description_id !== undefined) { fields.push('description_id = ?'); values.push(data.description_id); }
    if (data.description_en !== undefined) { fields.push('description_en = ?'); values.push(data.description_en); }
    if (data.material_specs !== undefined) {
      fields.push('material_specs = ?');
      values.push(typeof data.material_specs === 'object' ? JSON.stringify(data.material_specs) : data.material_specs);
    }
    if (data.technical_specs !== undefined) {
      fields.push('technical_specs = ?');
      values.push(typeof data.technical_specs === 'object' ? JSON.stringify(data.technical_specs) : data.technical_specs);
    }
    if (data.main_image !== undefined) { fields.push('main_image = ?'); values.push(data.main_image); }
    if (data.gallery_images !== undefined) {
      fields.push('gallery_images = ?');
      values.push(typeof data.gallery_images === 'object' ? JSON.stringify(data.gallery_images) : data.gallery_images);
    }
    if (data.is_featured !== undefined) { fields.push('is_featured = ?'); values.push(data.is_featured ? 1 : 0); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(parseInt(data.sort_order, 10)); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, values);
    return result.affectedRows > 0;
  },

  /**
   * Delete product
   */
  async delete(id) {
    const result = await execute('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Categories Helpers
   */
  async findAllCategories() {
    return await query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
  },

  async findCategoryById(id) {
    const rows = await query('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  }
};

export default productModel;
