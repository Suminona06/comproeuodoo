import { query, execute } from '../config/database.js';

export const productModel = {
  /**
   * Find products with v2 filters (category, status, featured, search, sort)
   */
  async findAll(options = {}) {
    const { categoryId, status, isFeatured, limit, offset, search, sort } = options;
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
    if (search) {
      conditions.push('(p.name_id LIKE ? OR p.name_en LIKE ? OR p.slug LIKE ? OR p.description_id LIKE ? OR p.description_en LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    let orderByClause = 'ORDER BY p.sort_order ASC, p.id DESC';
    if (sort === 'newest') {
      orderByClause = 'ORDER BY p.id DESC';
    } else if (sort === 'alpha-asc') {
      orderByClause = 'ORDER BY p.name_id ASC';
    } else if (sort === 'alpha-desc') {
      orderByClause = 'ORDER BY p.name_id DESC';
    } else if (sort === 'catalog') {
      orderByClause = 'ORDER BY p.sort_order ASC, p.id DESC';
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
      ${orderByClause}
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
    if (search) {
      conditions.push('(name_id LIKE ? OR name_en LIKE ? OR slug LIKE ? OR description_id LIKE ? OR description_en LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
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
    const legacyVariants = await this.getVariants(product.id);
    product.legacy_variants = legacyVariants;
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      if (legacyVariants && legacyVariants.length > 0) {
        product.variants = legacyVariants;
      } else {
        product.variants = [];
      }
    }
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
    const legacyVariants = await this.getVariants(product.id);
    product.legacy_variants = legacyVariants;
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      if (legacyVariants && legacyVariants.length > 0) {
        product.variants = legacyVariants;
      } else {
        product.variants = [];
      }
    }
    return product;
  },

  /**
   * Create product and optional variants
   */
  async create(data) {
    let categoryId = data.category_id;
    if (!categoryId) {
      const cats = await query('SELECT id FROM product_categories ORDER BY id ASC LIMIT 1');
      categoryId = cats[0]?.id || 1;
    }

    const sql = `
      INSERT INTO products (
        category_id, name_id, name_en, slug,
        short_description_id, short_description_en,
        description_id, description_en,
        cta_text_id, cta_text_en,
        main_image, gallery_images,
        variants, size_table,
        status,
        meta_title_id, meta_title_en, meta_description_id, meta_description_en,
        og_image, canonical_url, robots, jsonld,
        is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const ctaTextId = data.cta_text_id ? String(data.cta_text_id).trim().slice(0, 50) : null;
    const ctaTextEn = data.cta_text_en ? String(data.cta_text_en).trim().slice(0, 50) : null;

    const galleryRaw = data.gallery_images || data.gallery;
    let galleryJson = null;
    if (galleryRaw) {
      if (typeof galleryRaw === 'string') {
        try {
          const parsed = JSON.parse(galleryRaw);
          galleryJson = JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]);
        } catch {
          galleryJson = JSON.stringify([galleryRaw]);
        }
      } else if (Array.isArray(galleryRaw)) {
        galleryJson = JSON.stringify(galleryRaw);
      }
    }

    let variantsJson = null;
    if (data.variants) {
      if (typeof data.variants === 'string') {
        try {
          const parsed = JSON.parse(data.variants);
          variantsJson = JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]);
        } catch {
          variantsJson = JSON.stringify([data.variants]);
        }
      } else if (Array.isArray(data.variants)) {
        const strVariants = data.variants.map(v => typeof v === 'string' ? v : (v.size_label || v.name_id || ''));
        variantsJson = JSON.stringify(strVariants);
      }
    }

    let sizeTableJson = null;
    if (data.size_table) {
      if (typeof data.size_table === 'string') {
        try {
          const parsed = JSON.parse(data.size_table);
          sizeTableJson = JSON.stringify(Array.isArray(parsed) ? parsed : []);
        } catch {
          sizeTableJson = null;
        }
      } else if (Array.isArray(data.size_table)) {
        sizeTableJson = JSON.stringify(data.size_table);
      }
    }

    const shortDescId = data.short_description_id ? String(data.short_description_id).trim().slice(0, 500) : null;
    const shortDescEn = data.short_description_en ? String(data.short_description_en).trim().slice(0, 500) : null;
    const mainImage = data.main_image || data.image_url || null;
    const isActive = data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1;

    const params = [
      categoryId,
      data.name_id,
      data.name_en || data.name_id,
      data.slug,
      shortDescId,
      shortDescEn,
      data.description_id || null,
      data.description_en || null,
      ctaTextId,
      ctaTextEn,
      mainImage,
      galleryJson,
      variantsJson,
      sizeTableJson,
      data.status || 'published',
      data.meta_title_id || null,
      data.meta_title_en || null,
      data.meta_description_id || data.meta_desc_id || null,
      data.meta_description_en || data.meta_desc_en || null,
      data.og_image || null,
      data.canonical_url || null,
      data.robots || 'index',
      data.jsonld ? (typeof data.jsonld === 'object' ? JSON.stringify(data.jsonld) : data.jsonld) : null,
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
      short_description_id: (v) => (v ? String(v).trim().slice(0, 500) : null),
      short_description_en: (v) => (v ? String(v).trim().slice(0, 500) : null),
      description_id: (v) => v || null,
      description_en: (v) => v || null,
      cta_text_id: (v) => (v ? String(v).trim().slice(0, 50) : null),
      cta_text_en: (v) => (v ? String(v).trim().slice(0, 50) : null),
      main_image: (v) => v || null,
      gallery_images: (v) => {
        if (!v) return null;
        if (typeof v === 'string') {
          try {
            const parsed = JSON.parse(v);
            return JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]);
          } catch {
            return JSON.stringify([v]);
          }
        }
        return JSON.stringify(Array.isArray(v) ? v : [v]);
      },
      variants: (v) => {
        if (!v) return null;
        if (typeof v === 'string') {
          try {
            const parsed = JSON.parse(v);
            return JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]);
          } catch {
            return JSON.stringify([v]);
          }
        }
        if (Array.isArray(v)) {
          const strVariants = v.map(item => typeof item === 'string' ? item : (item.size_label || item.name_id || ''));
          return JSON.stringify(strVariants);
        }
        return null;
      },
      size_table: (v) => {
        if (!v) return null;
        if (typeof v === 'string') {
          try {
            const parsed = JSON.parse(v);
            return JSON.stringify(Array.isArray(parsed) ? parsed : []);
          } catch {
            return JSON.stringify([]);
          }
        }
        if (Array.isArray(v)) {
          return JSON.stringify(v);
        }
        return null;
      },
      status: (v) => v || 'published',
      meta_title_id: (v) => v || null,
      meta_title_en: (v) => v || null,
      meta_description_id: (v) => v || null,
      meta_description_en: (v) => v || null,
      og_image: (v) => v || null,
      canonical_url: (v) => v || null,
      robots: (v) => v || 'index',
      jsonld: (v) => (typeof v === 'object' ? JSON.stringify(v) : v || null),
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
      if (!v) continue;
      const nameId = typeof v === 'string' ? v : (v.name_id || v.size_label || `Varian ${i + 1}`);
      const nameEn = typeof v === 'string' ? v : (v.name_en || nameId);
      const sku = (typeof v === 'object' && v?.sku) ? v.sku : null;
      const specsObj = typeof v === 'object' ? {
        size_label: v.size_label || '',
        thickness: v.thickness || '',
        color: v.color || '',
        material_type: v.material_type || '',
        ...(typeof v.specs === 'object' ? v.specs : {})
      } : { size_label: v };

      await execute(
        `INSERT INTO product_variants (product_id, name_id, name_en, sku, specs, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          productId,
          nameId,
          nameEn,
          sku,
          JSON.stringify(specsObj),
          (typeof v === 'object' && v.sort_order !== undefined) ? parseInt(v.sort_order, 10) : i
        ]
      );
    }
  },

  _parseJsonFields(product) {
    if (!product) return null;
    const copy = { ...product };
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

    if (copy.variants && typeof copy.variants === 'string') {
      try {
        const parsedVariants = JSON.parse(copy.variants);
        copy.variants = Array.isArray(parsedVariants) ? parsedVariants : [];
      } catch {
        copy.variants = [];
      }
    } else if (Array.isArray(copy.variants)) {
      // keep array
    } else {
      copy.variants = [];
    }

    if (copy.size_table && typeof copy.size_table === 'string') {
      try {
        const parsedSize = JSON.parse(copy.size_table);
        copy.size_table = Array.isArray(parsedSize) ? parsedSize : [];
      } catch {
        copy.size_table = [];
      }
    } else if (Array.isArray(copy.size_table)) {
      // keep array
    } else {
      copy.size_table = [];
    }

    copy.short_description_id = copy.short_description_id ? String(copy.short_description_id) : null;
    copy.short_description_en = copy.short_description_en ? String(copy.short_description_en) : null;

    copy.image_url = copy.main_image || null;
    copy.gallery = copy.gallery_images;
    copy.images = copy.gallery_images;

    return copy;
  }
};

export default productModel;
