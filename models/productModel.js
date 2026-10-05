import { query, execute } from '../config/database.js';

export const productModel = {
  /**
   * Find products with v2 filters (category, status, featured, search)
   */
  async findAll(options = {}) {
    const { categoryId, status, isFeatured, limit, offset, search } = options;
    const conditions = [];
    const params = [];

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
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
      SELECT p.*,
             c.name_id as category_name_id,
             c.name_en as category_name_en,
             c.slug as category_slug
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
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

    const rows = await query(sql, params);
    return rows.map(r => this._parseJsonFields(r));
  },

  /**
   * Count total products with filters
   */
  async countAll(options = {}) {
    const { categoryId, status, isFeatured, search } = options;
    const conditions = [];
    const params = [];

    if (categoryId) {
      conditions.push('category_id = ?');
      params.push(categoryId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
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
   * Find product by ID with category and variants
   */
  async findById(id) {
    const rows = await query(
      `SELECT p.*,
              c.name_id as category_name_id,
              c.name_en as category_name_en,
              c.slug as category_slug
       FROM products p
       LEFT JOIN product_categories c ON p.category_id = c.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    const product = this._parseJsonFields(rows[0]);
    product.variants = await this.getVariants(product.id);
    return product;
  },

  /**
   * Find product by slug
   */
  async findBySlug(slug) {
    const rows = await query(
      `SELECT p.*,
              c.name_id as category_name_id,
              c.name_en as category_name_en,
              c.slug as category_slug
       FROM products p
       LEFT JOIN product_categories c ON p.category_id = c.id
       WHERE p.slug = ? LIMIT 1`,
      [slug]
    );
    if (rows.length === 0) return null;
    const product = this._parseJsonFields(rows[0]);
    product.variants = await this.getVariants(product.id);
    return product;
  },

  /**
   * Create product and optional variants
   */
  async create(data) {
    // If no category_id passed, fallback to first available category
    let categoryId = data.category_id;
    if (!categoryId) {
      const cats = await query('SELECT id FROM product_categories ORDER BY id ASC LIMIT 1');
      categoryId = cats[0]?.id || 1;
    }

    const sql = `
      INSERT INTO products (
        category_id, name_id, name_en, slug,
        description_id, description_en,
        material_specs, technical_specs,
        main_image, gallery_images, status,
        meta_title_id, meta_title_en, meta_description_id, meta_description_en,
        og_image, canonical_url, robots, jsonld,
        is_featured, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const materialSpecsJson = data.material_specs
      ? (typeof data.material_specs === 'object' ? JSON.stringify(data.material_specs) : JSON.stringify({ note: String(data.material_specs) }))
      : null;

    const technicalSpecsJson = data.technical_specs
      ? (typeof data.technical_specs === 'object' ? JSON.stringify(data.technical_specs) : JSON.stringify({ note: String(data.technical_specs) }))
      : null;

    const galleryRaw = data.gallery_images || data.gallery;
    const galleryJson = galleryRaw
      ? (Array.isArray(galleryRaw) || typeof galleryRaw === 'object' ? JSON.stringify(galleryRaw) : JSON.stringify([galleryRaw]))
      : null;

    const mainImage = data.main_image || data.image_url || null;
    const isFeatured = data.is_featured !== undefined ? (data.is_featured ? 1 : 0) : (data.featured ? 1 : 0);
    const isActive = data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1;

    const params = [
      categoryId,
      data.name_id,
      data.name_en || data.name_id,
      data.slug,
      data.description_id || null,
      data.description_en || null,
      materialSpecsJson,
      technicalSpecsJson,
      mainImage,
      galleryJson,
      data.status || 'published',
      data.meta_title_id || null,
      data.meta_title_en || null,
      data.meta_description_id || data.meta_desc_id || null,
      data.meta_description_en || data.meta_desc_en || null,
      data.og_image || null,
      data.canonical_url || null,
      data.robots || 'index',
      data.jsonld ? (typeof data.jsonld === 'object' ? JSON.stringify(data.jsonld) : data.jsonld) : null,
      isFeatured,
      isActive,
      data.sort_order || 0
    ];

    const result = await execute(sql, params);
    const productId = result.insertId;

    if (Array.isArray(data.variants) && data.variants.length > 0) {
      await this.saveVariants(productId, data.variants);
    }

    return productId;
  },

  /**
   * Update product
   */
  async update(id, data) {
    const fields = [];
    const params = [];

    const fieldMap = {
      category_id: (v) => v || 1,
      name_id: (v) => v,
      name_en: (v) => v,
      slug: (v) => v,
      description_id: (v) => v || null,
      description_en: (v) => v || null,
      material_specs: (v) => v ? (typeof v === 'object' ? JSON.stringify(v) : JSON.stringify({ note: String(v) })) : null,
      technical_specs: (v) => v ? (typeof v === 'object' ? JSON.stringify(v) : JSON.stringify({ note: String(v) })) : null,
      main_image: (v) => v || null,
      gallery_images: (v) => v ? (Array.isArray(v) || typeof v === 'object' ? JSON.stringify(v) : JSON.stringify([v])) : null,
      status: (v) => v || 'published',
      meta_title_id: (v) => v || null,
      meta_title_en: (v) => v || null,
      meta_description_id: (v) => v || null,
      meta_description_en: (v) => v || null,
      og_image: (v) => v || null,
      canonical_url: (v) => v || null,
      robots: (v) => v || 'index',
      jsonld: (v) => (typeof v === 'object' ? JSON.stringify(v) : v || null),
      is_featured: (v) => (v ? 1 : 0),
      is_active: (v) => (v ? 1 : 0),
      sort_order: (v) => parseInt(v || 0, 10)
    };

    // Normalize incoming legacy keys
    if (data.image_url !== undefined && data.main_image === undefined) {
      data.main_image = data.image_url;
    }
    if (data.gallery !== undefined && data.gallery_images === undefined) {
      data.gallery_images = data.gallery;
    }
    if (data.featured !== undefined && data.is_featured === undefined) {
      data.is_featured = data.featured;
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
        params.push(transform(data[key]));
      }
    }

    if (fields.length > 0) {
      params.push(id);
      const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
      await execute(sql, params);
    }

    if (Array.isArray(data.variants)) {
      await this.saveVariants(id, data.variants);
    }

    return true;
  },

  /**
   * Delete product
   */
  async delete(id) {
    await execute('DELETE FROM product_variants WHERE product_id = ?', [id]);
    const result = await execute('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Variants handling
   */
  async getVariants(productId) {
    const rows = await query(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
      [productId]
    );
    return rows.map(r => {
      let parsedSpecs = {};
      if (r.specs && typeof r.specs === 'string') {
        try { parsedSpecs = JSON.parse(r.specs); } catch { parsedSpecs = {}; }
      } else if (r.specs && typeof r.specs === 'object') {
        parsedSpecs = r.specs;
      }
      return {
        ...r,
        size_label: parsedSpecs.size_label || r.name_id,
        thickness: parsedSpecs.thickness || '',
        color: parsedSpecs.color || '',
        material_type: parsedSpecs.material_type || '',
        specs: parsedSpecs
      };
    });
  },

  async saveVariants(productId, variants) {
    await execute('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const nameId = v.name_id || v.size_label || `Varian ${i + 1}`;
      const nameEn = v.name_en || nameId;
      const sku = v.sku || null;
      const specsObj = {
        size_label: v.size_label || '',
        thickness: v.thickness || '',
        color: v.color || '',
        material_type: v.material_type || '',
        ...(typeof v.specs === 'object' ? v.specs : {})
      };

      await execute(
        `INSERT INTO product_variants (product_id, name_id, name_en, sku, specs, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          productId,
          nameId,
          nameEn,
          sku,
          JSON.stringify(specsObj),
          v.sort_order !== undefined ? parseInt(v.sort_order, 10) : i
        ]
      );
    }
  },

  _parseJsonFields(product) {
    if (!product) return null;
    const copy = { ...product };
    if (copy.material_specs && typeof copy.material_specs === 'string') {
      try {
        copy.material_specs = JSON.parse(copy.material_specs);
      } catch {
        copy.material_specs = { note: copy.material_specs };
      }
    }
    if (copy.technical_specs && typeof copy.technical_specs === 'string') {
      try {
        copy.technical_specs = JSON.parse(copy.technical_specs);
      } catch {
        copy.technical_specs = {};
      }
    }
    const galleryRaw = copy.gallery_images || copy.gallery;
    if (galleryRaw && typeof galleryRaw === 'string') {
      try {
        copy.gallery_images = JSON.parse(galleryRaw);
      } catch {
        copy.gallery_images = [];
      }
    } else if (Array.isArray(galleryRaw)) {
      copy.gallery_images = galleryRaw;
    } else {
      copy.gallery_images = [];
    }

    // Friendly aliases
    copy.image_url = copy.main_image || null;
    copy.gallery = copy.gallery_images;
    copy.featured = !!copy.is_featured;

    return copy;
  }
};

export default productModel;
