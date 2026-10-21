import { query, execute } from '../config/database.js';

export const productCategoryModel = {
  async findAll(options = {}) {
    let sql = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON c.id = p.category_id
    `;
    const params = [];
    if (options && options.activeOnly) {
      sql += ' WHERE (c.is_active = 1 OR c.is_active IS NULL) ';
    }
    sql += `
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name_id ASC
    `;
    return await query(sql, params);
  },

  async getHomepageCategories() {
    const defaultImages = {
      'hdpe-bags': '/images/segment-retail.jpg',
      'lldpe-packaging': '/images/segment-industrial.jpg',
      'pp-woven-bags': '/images/segment-traditional.jpg',
      'biodegradable-oxium': '/images/segment-sustainability.jpg'
    };
    const segmentKeys = ['retail', 'industrial', 'traditional', 'sustainability'];

    try {
      const settingRows = await query("SELECT setting_value FROM settings WHERE setting_key = 'home_categories_json' LIMIT 1");
      if (settingRows.length > 0 && settingRows[0].setting_value) {
        const customCats = JSON.parse(settingRows[0].setting_value);
        if (Array.isArray(customCats) && customCats.length > 0) {
          const ids = customCats.map(c => c.category_id).filter(Boolean);
          if (ids.length > 0) {
            const [catRows, countRows] = await Promise.all([
              query(`SELECT id, name_id, name_en, slug, image_url, is_active FROM product_categories WHERE id IN (${ids.map(() => '?').join(',')})`, ids),
              query(`
                SELECT category_id, COUNT(id) as count 
                FROM products 
                WHERE category_id IN (${ids.map(() => '?').join(',')}) 
                  AND status = 'published' 
                  AND (is_active = 1 OR is_active IS NULL)
                GROUP BY category_id
              `, ids)
            ]);
            const catMap = {};
            catRows.forEach(r => { catMap[r.id] = r; });
            const countMap = {};
            countRows.forEach(r => { countMap[r.category_id] = r.count; });

            const activeCustomCats = customCats.filter(c => {
              const catRow = catMap[c.category_id];
              return catRow && (catRow.is_active === 1 || catRow.is_active === true || catRow.is_active === '1');
            });

            if (activeCustomCats.length >= 4) {
              return activeCustomCats.slice(0, 4).map((c, idx) => {
                const catRow = catMap[c.category_id] || {};
                const slug = catRow.slug || c.slug || '';
                return {
                  id: c.category_id,
                  name_id: catRow.name_id || c.name_id || '',
                  name_en: catRow.name_en || c.name_en || catRow.name_id || c.name_id || '',
                  slug,
                  image_url: c.image_url || catRow.image_url || defaultImages[slug] || `/images/segment-${segmentKeys[idx % 4]}.jpg`,
                  published_product_count: countMap[c.category_id] || 0
                };
              });
            } else if (activeCustomCats.length > 0) {
              const selectedIds = activeCustomCats.map(c => c.category_id);
              const fallbackRows = await query(`
                SELECT c.id, c.name_id, c.name_en, c.slug, c.image_url, COUNT(p.id) AS published_product_count
                FROM product_categories c
                LEFT JOIN products p 
                  ON c.id = p.category_id 
                  AND p.status = 'published' 
                  AND (p.is_active = 1 OR p.is_active IS NULL)
                WHERE (c.is_active = 1 OR c.is_active IS NULL)
                  AND c.id NOT IN (${selectedIds.map(() => '?').join(',')})
                GROUP BY c.id
                ORDER BY c.sort_order ASC, c.name_id ASC
                LIMIT ?
              `, [...selectedIds, 4 - activeCustomCats.length]);

              const mappedActive = activeCustomCats.map((c, idx) => {
                const catRow = catMap[c.category_id] || {};
                const slug = catRow.slug || c.slug || '';
                return {
                  id: c.category_id,
                  name_id: catRow.name_id || c.name_id || '',
                  name_en: catRow.name_en || c.name_en || catRow.name_id || c.name_id || '',
                  slug,
                  image_url: c.image_url || catRow.image_url || defaultImages[slug] || `/images/segment-${segmentKeys[idx % 4]}.jpg`,
                  published_product_count: countMap[c.category_id] || 0
                };
              });

              const mappedFallback = fallbackRows.map((cat, fIdx) => {
                const idx = mappedActive.length + fIdx;
                return {
                  ...cat,
                  image_url: cat.image_url || defaultImages[cat.slug] || `/images/segment-${segmentKeys[idx % 4]}.jpg`
                };
              });

              return [...mappedActive, ...mappedFallback];
            }
          }
        }
      }
    } catch {
      // Fallback to active categories query if settings read fails
    }

    const sql = `
      SELECT 
        c.id,
        c.name_id,
        c.name_en,
        c.slug,
        c.description_id,
        c.description_en,
        c.sort_order,
        c.image_url,
        COUNT(p.id) AS published_product_count
      FROM product_categories c
      LEFT JOIN products p 
        ON c.id = p.category_id 
        AND p.status = 'published' 
        AND (p.is_active = 1 OR p.is_active IS NULL)
      WHERE (c.is_active = 1 OR c.is_active IS NULL)
      GROUP BY c.id
      ORDER BY 
        c.sort_order ASC, 
        c.name_id ASC
      LIMIT 4
    `;
    const rows = await query(sql);

    return rows.map((cat, idx) => {
      return {
        ...cat,
        image_url: cat.image_url || defaultImages[cat.slug] || `/images/segment-${segmentKeys[idx % 4]}.jpg`
      };
    });
  },

  async findById(id) {
    const rows = await query('SELECT * FROM product_categories WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async findBySlug(slug) {
    const rows = await query('SELECT * FROM product_categories WHERE slug = ? LIMIT 1', [slug]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create(data) {
    const sql = `
      INSERT INTO product_categories (name_id, name_en, slug, description_id, description_en, sort_order, is_active, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const isActive = data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1;
    const params = [
      data.name_id,
      data.name_en || data.name_id,
      data.slug,
      data.description_id || null,
      data.description_en || null,
      data.sort_order || 0,
      isActive,
      data.image_url || null
    ];
    const result = await execute(sql, params);
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['name_id', 'name_en', 'slug', 'description_id', 'description_en', 'sort_order', 'is_active', 'image_url'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(key === 'is_active' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length === 0) return false;

    params.push(id);
    const sql = `UPDATE product_categories SET ${fields.join(', ')} WHERE id = ?`;
    const result = await execute(sql, params);
    return result.affectedRows > 0;
  },

  async toggleActive(id) {
    const category = await this.findById(id);
    if (!category) return null;
    const newStatus = category.is_active ? 0 : 1;
    await execute('UPDATE product_categories SET is_active = ? WHERE id = ?', [newStatus, id]);
    return { ...category, is_active: newStatus };
  },

  async delete(id) {
    await execute('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
    const result = await execute('DELETE FROM product_categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

export default productCategoryModel;
