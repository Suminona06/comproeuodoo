import productModel, { normalizeSizeTable } from '../../models/productModel.js';
import productCategoryModel from '../../models/productCategoryModel.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import storage from '../../config/storage.js';
import { sendCsvResponse } from '../../utils/csvExporter.js';
import { invalidateSitemapCache } from '../../utils/sitemapGenerator.js';
import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

function parseVariants(body) {
  const variants = [];
  if (body.var_size || body.var_thickness || body.var_color) {
    const sizes = Array.isArray(body.var_size) ? body.var_size : [body.var_size];
    const thicknesses = Array.isArray(body.var_thickness) ? body.var_thickness : [body.var_thickness];
    const colors = Array.isArray(body.var_color) ? body.var_color : [body.var_color];
    const materials = Array.isArray(body.var_material) ? body.var_material : [body.var_material];

    const len = Math.max(sizes.length, thicknesses.length, colors.length);
    for (let i = 0; i < len; i++) {
      const s = sizes[i]?.trim() || '';
      const t = thicknesses[i]?.trim() || '';
      const c = colors[i]?.trim() || '';
      const m = materials[i]?.trim() || '';
      if (s || t || c || m) {
        variants.push({
          size_label: s,
          thickness: t,
          color: c,
          material_type: m,
          sort_order: i,
          is_active: 1
        });
      }
    }
  }
  return variants;
}

function parseGalleryImages(body) {
  const raw = body.gallery_images || body.gallery;
  if (!raw) return [];
  let list = [];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        list = Array.isArray(parsed) ? parsed : [];
      } catch {
        list = [];
      }
    } else if (trimmed.includes(',')) {
      list = trimmed.split(',').map(s => s.trim());
    } else if (trimmed) {
      list = [trimmed];
    }
  } else if (Array.isArray(raw)) {
    list = raw;
  }
  return list
    .map(item => {
      if (typeof item === 'number' && Number.isInteger(item)) return item;
      if (typeof item === 'string') {
        const str = item.trim();
        if (/^\d+$/.test(str)) return parseInt(str, 10);
        if (/^(https?:\/\/|\/)/i.test(str)) return str;
      }
      if (typeof item === 'object' && item !== null) {
        if (item.id && (typeof item.id === 'number' || /^\d+$/.test(item.id))) return parseInt(item.id, 10);
        if (item.url && typeof item.url === 'string') return item.url.trim();
        if (item.file_url && typeof item.file_url === 'string') return item.file_url.trim();
      }
      return null;
    })
    .filter(item => item !== null);
}

function parseVariantLabels(body) {
  if (body.variant_labels !== undefined) {
    const raw = Array.isArray(body.variant_labels) ? body.variant_labels : [body.variant_labels];
    return raw
      .map(v => (typeof v === 'string' ? v.trim() : ''))
      .filter(v => v.length > 0);
  }
  if (body.variants !== undefined) {
    if (typeof body.variants === 'string') {
      try {
        const parsed = JSON.parse(body.variants);
        if (Array.isArray(parsed)) {
          return parsed.map(v => typeof v === 'string' ? v.trim() : (v.size_label || v.name_id || '')).filter(Boolean);
        }
      } catch {
        if (body.variants.trim()) return [body.variants.trim()];
      }
    } else if (Array.isArray(body.variants)) {
      return body.variants.map(v => typeof v === 'string' ? v.trim() : (v.size_label || v.name_id || '')).filter(Boolean);
    }
  }
  const legacy = parseVariants(body);
  if (legacy.length > 0) {
    return legacy.map(v => {
      const label = v.size_label || '';
      const extra = v.thickness ? ` (${v.thickness})` : '';
      return label ? `${label}${extra}` : '';
    }).filter(Boolean);
  }
  return [];
}

export function parseDynamicSizeTable(body) {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const rawCodes = body.kode_produk || body.size_code;
  const rawWidths = body.lebar || body.size_width;
  const rawLengths = body.panjang || body.size_length;
  const rawThicknesses = body.tebal_micron || body.size_thickness;
  const rawCapacities = body.kapasitas || body.size_capacity;
  const rawMaterials = body.bahan || body.size_material;

  const hasFormInputs = rawCodes !== undefined
    || rawWidths !== undefined
    || rawLengths !== undefined
    || rawThicknesses !== undefined
    || rawCapacities !== undefined
    || rawMaterials !== undefined;

  let raw = null;

  if (body.size_table !== undefined && body.size_table !== null) {
    if (typeof body.size_table === 'string') {
      const trimmed = body.size_table.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
        return null;
      }
      try {
        raw = JSON.parse(trimmed);
      } catch {
        throw new Error('Format data tabel ukuran tidak valid (JSON malformed).');
      }
    } else if (typeof body.size_table === 'object') {
      raw = body.size_table;
    }
  } else if (hasFormInputs) {
    const codes = Array.isArray(rawCodes) ? rawCodes : [rawCodes || ''];
    const widths = Array.isArray(rawWidths) ? rawWidths : [rawWidths || ''];
    const lengths = Array.isArray(rawLengths) ? rawLengths : [rawLengths || ''];
    const thicknesses = Array.isArray(rawThicknesses) ? rawThicknesses : [rawThicknesses || ''];
    const capacities = Array.isArray(rawCapacities) ? rawCapacities : [rawCapacities || ''];
    const materials = Array.isArray(rawMaterials) ? rawMaterials : [rawMaterials || ''];

    const legacyRows = [];
    const maxLen = Math.max(codes.length, widths.length, lengths.length, thicknesses.length, capacities.length, materials.length);
    for (let i = 0; i < maxLen; i++) {
      const code = (codes[i] || '').trim();
      const width = (widths[i] || '').trim();
      const length = (lengths[i] || '').trim();
      const thickness = (thicknesses[i] || '').trim();
      const capacity = (capacities[i] || '').trim();
      const material = (materials[i] || '').trim();

      if (code || width || length || thickness || capacity || material) {
        legacyRows.push({
          col_1: code,
          col_2: width,
          col_3: length,
          col_4: thickness,
          col_5: capacity,
          col_6: material
        });
      }
    }

    if (legacyRows.length === 0) {
      return null;
    }

    raw = {
      columns: [
        { id: 'col_1', label: 'Kode Produk' },
        { id: 'col_2', label: 'Lebar' },
        { id: 'col_3', label: 'Panjang' },
        { id: 'col_4', label: 'Tebal (Micron)' },
        { id: 'col_5', label: 'Kapasitas' },
        { id: 'col_6', label: 'Bahan' }
      ],
      rows: legacyRows
    };
  }

  if (!raw) {
    return null;
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    raw = {
      columns: [
        { id: 'col_1', label: 'Kode Produk' },
        { id: 'col_2', label: 'Lebar' },
        { id: 'col_3', label: 'Panjang' },
        { id: 'col_4', label: 'Tebal (Micron)' },
        { id: 'col_5', label: 'Kapasitas' },
        { id: 'col_6', label: 'Bahan' }
      ],
      rows: raw
    };
  }

  const rawColumns = Array.isArray(raw.columns) ? raw.columns : [];
  const rawRows = Array.isArray(raw.rows) ? raw.rows : [];

  if (rawColumns.length === 0 && rawRows.length === 0) {
    return null;
  }

  if (rawColumns.length === 0 && rawRows.length > 0) {
    throw new Error('Tabel ukuran minimal memiliki 1 kolom.');
  }

  if (rawColumns.length < 1) {
    throw new Error('Tabel ukuran minimal memiliki 1 kolom.');
  }

  if (rawColumns.length > 8) {
    throw new Error('Tabel ukuran maksimal memiliki 8 kolom.');
  }

  if (rawRows.length > 30) {
    throw new Error('Tabel ukuran maksimal memiliki 30 baris.');
  }

  const cleanColumns = [];
  const incomingIdToCanonicalId = {};

  for (let i = 0; i < rawColumns.length; i++) {
    const col = rawColumns[i];
    if (!col || typeof col !== 'object') {
      throw new Error(`Definisi kolom ke-${i + 1} tidak valid.`);
    }

    const rawLabel = col.label !== undefined ? String(col.label) : '';
    const cleanLabel = rawLabel.replace(/<[^>]*>/g, '').trim();

    if (cleanLabel.length === 0) {
      throw new Error('Label kolom tabel ukuran tidak boleh kosong.');
    }

    if (cleanLabel.length > 40) {
      throw new Error(`Label kolom "${cleanLabel.slice(0, 20)}..." melebihi batas maksimal 40 karakter.`);
    }

    const canonicalId = `col_${i + 1}`;
    cleanColumns.push({
      id: canonicalId,
      label: cleanLabel
    });

    if (col.id) {
      incomingIdToCanonicalId[String(col.id).trim()] = canonicalId;
    }
    incomingIdToCanonicalId[canonicalId] = canonicalId;
    incomingIdToCanonicalId[cleanLabel] = canonicalId;
  }

  const cleanRows = [];
  for (let rIdx = 0; rIdx < rawRows.length; rIdx++) {
    const row = rawRows[rIdx];
    if (!row || typeof row !== 'object') continue;

    const cleanRow = {};
    for (const col of cleanColumns) {
      const canonicalId = col.id;
      let val = '';

      if (row[canonicalId] !== undefined) {
        val = row[canonicalId];
      } else {
        for (const [incId, targetCanonId] of Object.entries(incomingIdToCanonicalId)) {
          if (targetCanonId === canonicalId && row[incId] !== undefined) {
            val = row[incId];
            break;
          }
        }
      }

      const cleanCell = String(val !== null && val !== undefined ? val : '')
        .replace(/<[^>]*>/g, '')
        .trim();

      if (cleanCell.length > 80) {
        throw new Error(`Isi sel pada kolom "${col.label}" baris ${rIdx + 1} melebihi batas maksimal 80 karakter.`);
      }

      cleanRow[canonicalId] = cleanCell;
    }

    cleanRows.push(cleanRow);
  }

  return {
    columns: cleanColumns,
    rows: cleanRows
  };
}

export const parseSizeTable = parseDynamicSizeTable;

export async function getProductsWithSizeTable(excludeId = null) {
  const sql = `
    SELECT id, name_id, name_en FROM products
    WHERE status = "published"
      ${excludeId ? 'AND id != ?' : ''}
      AND size_table IS NOT NULL
      AND JSON_VALID(size_table) = 1
      AND (
        JSON_EXTRACT(size_table, '$.columns[0]') IS NOT NULL
        OR JSON_EXTRACT(size_table, '$[0]') IS NOT NULL
      )
    ORDER BY name_id ASC
  `;
  return excludeId ? query(sql, [excludeId]) : query(sql);
}

export const productController = {
  getProductsWithSizeTable,
  async index(req, res) {
    try {
      const categoryId = req.query.category ? parseInt(req.query.category, 10) : null;
      const status = req.query.status || null;
      const search = req.query.search || null;

      const [products, categories] = await Promise.all([
        productModel.findAll({ categoryId, status, search }),
        productCategoryModel.findAll({ activeOnly: false })
      ]);

      res.render('admin/products/index', {
        title: 'Manajemen Katalog Produk',
        pageTitle: 'Katalog Produk Manufaktur',
        activeNav: 'products',
        products,
        categories,
        selectedCategory: categoryId,
        selectedStatus: status,
        searchQuery: search,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product index error:', { message: err.message });
      res.status(500).render('admin/products/index', {
        title: 'Manajemen Produk',
        pageTitle: 'Katalog Produk',
        activeNav: 'products',
        products: [],
        categories: [],
        selectedCategory: null,
        selectedStatus: null,
        searchQuery: null,
        error: 'Gagal memuat katalog produk.',
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  async exportCsv(req, res) {
    try {
      const products = await productModel.findAll();

      const dynamicColumnsMap = new Map();
      for (const p of products) {
        const st = normalizeSizeTable(p.size_table);
        if (st && Array.isArray(st.columns)) {
          for (const col of st.columns) {
            const rawLabel = String(col.label || '').trim();
            if (!rawLabel) continue;
            const normKey = rawLabel.toLowerCase();
            if (!dynamicColumnsMap.has(normKey)) {
              dynamicColumnsMap.set(normKey, {
                normKey,
                label: rawLabel
              });
            }
          }
        }
      }

      const columns = [
        { label: 'ID', key: 'id' },
        { label: 'Slug', key: 'slug' },
        { label: 'Nama Produk (ID)', key: 'name_id' },
        { label: 'Nama Produk (EN)', key: 'name_en' },
        { label: 'Kategori', key: r => r.category_name_id || 'Tidak Berkategori' },
        { label: 'Teks CTA (ID)', key: r => r.cta_text_id || '' },
        { label: 'Teks CTA (EN)', key: r => r.cta_text_en || '' },
        { label: 'Status', key: 'status' },
        { label: 'URL Gambar', key: r => r.image_url || '' },
        { label: 'Dibuat Pada', key: r => r.created_at ? (r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)) : '' }
      ];

      for (const dynCol of dynamicColumnsMap.values()) {
        columns.push({
          label: dynCol.label,
          key: '__dyn_' + dynCol.normKey
        });
      }

      const exportRows = [];
      for (const product of products) {
        const st = normalizeSizeTable(product.size_table);
        const baseRow = {
          id: product.id,
          slug: product.slug,
          name_id: product.name_id,
          name_en: product.name_en,
          category_name_id: product.category_name_id || 'Tidak Berkategori',
          cta_text_id: product.cta_text_id || '',
          cta_text_en: product.cta_text_en || '',
          status: product.status || '',
          image_url: product.image_url || '',
          created_at: product.created_at || ''
        };

        const normKeyToColId = {};
        if (st && Array.isArray(st.columns)) {
          for (const c of st.columns) {
            const k = String(c.label || '').trim().toLowerCase();
            if (k) {
              normKeyToColId[k] = c.id;
            }
          }
        }

        const sizeRows = (st && Array.isArray(st.rows)) ? st.rows : [];

        if (sizeRows.length === 0) {
          const row = { ...baseRow };
          for (const dynCol of dynamicColumnsMap.values()) {
            row['__dyn_' + dynCol.normKey] = '';
          }
          exportRows.push(row);
        } else {
          for (const sRow of sizeRows) {
            const row = { ...baseRow };
            for (const dynCol of dynamicColumnsMap.values()) {
              const colId = normKeyToColId[dynCol.normKey];
              let cellVal = '';
              if (colId && sRow[colId] !== undefined && sRow[colId] !== null) {
                cellVal = String(sRow[colId]);
              }
              row['__dyn_' + dynCol.normKey] = cellVal;
            }
            exportRows.push(row);
          }
        }
      }

      const filename = `katalog-produk-euodoo-${new Date().toISOString().slice(0, 10)}.csv`;
      sendCsvResponse(res, filename, columns, exportRows);
    } catch (err) {
      logger.error('Product export CSV error:', err);
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal mengekspor data produk ke CSV.'));
    }
  },

  async createView(req, res) {
    try {
      const categories = await productCategoryModel.findAll({ activeOnly: true });
      const productsList = await getProductsWithSizeTable();
      res.render('admin/products/create', {
        title: 'Tambah Produk Baru',
        pageTitle: 'Tambah Produk Manufaktur',
        activeNav: 'products',
        categories,
        productsList: productsList || [],
        error: null,
        csrfToken: res.locals?.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product createView error:', { message: err.message });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal membuka form tambah produk.'));
    }
  },

  async getSizeTableColumns(req, res) {
    try {
      const { id } = req.params;
      const product = await productModel.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
      }
      const sizeTable = normalizeSizeTable(product.size_table);
      const columns = (sizeTable.columns || []).map((c, idx) => ({
        id: `col_${idx + 1}`,
        label: c.label || ''
      }));
      return res.json({
        success: true,
        columns
      });
    } catch (err) {
      logger.error('getSizeTableColumns error:', { message: err.message });
      return res.status(500).json({ success: false, message: 'Gagal mengambil struktur kolom produk.' });
    }
  },

  async store(req, res) {
    try {
      const {
        name_id, name_en, category_id,
        short_description_id, short_description_en,
        description_id, description_en,
        cta_text_id, cta_text_en,
        status, sort_order,
        meta_title_id, meta_title_en, meta_desc_id, meta_desc_en
      } = req.body;

      if (!name_id || name_id.trim() === '') {
        const categories = await productCategoryModel.findAll({ activeOnly: true });
        return res.status(400).render('admin/products/create', {
          title: 'Tambah Produk Baru',
          pageTitle: 'Tambah Produk',
          activeNav: 'products',
          categories,
          error: 'Nama produk (Bahasa Indonesia) wajib diisi.',
          formData: req.body,
          csrfToken: res.locals?.csrfToken || ''
        });
      }

      if (short_description_id && short_description_id.trim().length > 200) {
        const categories = await productCategoryModel.findAll({ activeOnly: true });
        return res.status(400).render('admin/products/create', {
          title: 'Tambah Produk Baru',
          pageTitle: 'Tambah Produk',
          activeNav: 'products',
          categories,
          error: 'Deskripsi singkat (ID) maksimal 200 karakter.',
          formData: req.body,
          csrfToken: res.locals?.csrfToken || ''
        });
      }

      if (short_description_en && short_description_en.trim().length > 200) {
        const categories = await productCategoryModel.findAll({ activeOnly: true });
        return res.status(400).render('admin/products/create', {
          title: 'Tambah Produk Baru',
          pageTitle: 'Tambah Produk',
          activeNav: 'products',
          categories,
          error: 'Deskripsi singkat (EN) maksimal 200 karakter.',
          formData: req.body,
          csrfToken: res.locals?.csrfToken || ''
        });
      }

      const cleanCtaId = cta_text_id ? cta_text_id.replace(/<[^>]*>/g, '').trim() : '';
      const cleanCtaEn = cta_text_en ? cta_text_en.replace(/<[^>]*>/g, '').trim() : '';

      if (cleanCtaId.length > 50) {
        const categories = await productCategoryModel.findAll({ activeOnly: true });
        return res.status(400).render('admin/products/create', {
          title: 'Tambah Produk Baru',
          pageTitle: 'Tambah Produk',
          activeNav: 'products',
          categories,
          error: 'Teks tombol CTA (ID) maksimal 50 karakter.',
          formData: req.body,
          csrfToken: res.locals?.csrfToken || ''
        });
      }

      if (cleanCtaEn.length > 50) {
        const categories = await productCategoryModel.findAll({ activeOnly: true });
        return res.status(400).render('admin/products/create', {
          title: 'Tambah Produk Baru',
          pageTitle: 'Tambah Produk',
          activeNav: 'products',
          categories,
          error: 'Teks tombol CTA (EN) maksimal 50 karakter.',
          formData: req.body,
          csrfToken: res.locals?.csrfToken || ''
        });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = await processAndSaveWebP(req.file.buffer, 'products');
      } else if (req.body.image_url) {
        imageUrl = req.body.image_url.trim();
      }

      const galleryImages = parseGalleryImages(req.body);
      const variantLabels = parseVariantLabels(req.body);
      let sizeTable = null;
      try {
        sizeTable = parseDynamicSizeTable(req.body);
      } catch (valErr) {
        const categories = await productCategoryModel.findAll({ activeOnly: true });
        const productsList = await getProductsWithSizeTable();
        return res.status(400).render('admin/products/create', {
          title: 'Tambah Produk Baru',
          pageTitle: 'Tambah Produk',
          activeNav: 'products',
          categories,
          productsList: productsList || [],
          error: valErr.message,
          formData: req.body,
          csrfToken: res.locals?.csrfToken || ''
        });
      }
      const legacyVariants = parseVariants(req.body);
      const slug = createSlug(name_id);

      await productModel.create({
        name_id: name_id.trim(),
        name_en: name_en ? name_en.trim() : name_id.trim(),
        slug,
        category_id: category_id ? parseInt(category_id, 10) : null,
        short_description_id: short_description_id ? short_description_id.trim() : null,
        short_description_en: short_description_en ? short_description_en.trim() : null,
        description_id: description_id ? description_id.trim() : null,
        description_en: description_en ? description_en.trim() : null,
        cta_text_id: cleanCtaId.length > 0 ? cleanCtaId : null,
        cta_text_en: cleanCtaEn.length > 0 ? cleanCtaEn : null,
        variants: variantLabels.length > 0 ? variantLabels : (legacyVariants.length > 0 ? legacyVariants : []),
        size_table: sizeTable,
        main_image: imageUrl,
        gallery_images: galleryImages,
        status: status || 'published',
        sort_order: parseInt(sort_order || '0', 10),
        meta_title_id: meta_title_id || null,
        meta_title_en: meta_title_en || null,
        meta_desc_id: meta_desc_id || null,
        meta_desc_en: meta_desc_en || null
      });

      invalidateSitemapCache();
      res.redirect('/admin/products?success=' + encodeURIComponent('Produk baru berhasil ditambahkan.'));
    } catch (err) {
      logger.error('Product store error:', { message: err.message });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal menyimpan produk: ' + err.message));
    }
  },

  async editView(req, res) {
    try {
      const [product, categories] = await Promise.all([
        productModel.findById(req.params.id),
        productCategoryModel.findAll({ activeOnly: false })
      ]);

      if (!product) {
        return res.redirect('/admin/products?error=' + encodeURIComponent('Produk tidak ditemukan.'));
      }

      let galleryItems = [];
      if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
        const ids = product.gallery_images
          .filter(x => typeof x === 'number' || (typeof x === 'string' && /^\d+$/.test(x.trim())))
          .map(x => parseInt(x, 10));
        let mediaMap = {};
        if (ids.length > 0) {
          const placeholders = ids.map(() => '?').join(',');
          const mediaRows = await query(`SELECT id, file_url, filename FROM media WHERE id IN (${placeholders})`, ids);
          mediaRows.forEach(m => { mediaMap[m.id] = m; });
        }
        galleryItems = product.gallery_images.map(item => {
          if (typeof item === 'number' || (typeof item === 'string' && /^\d+$/.test(item.trim()))) {
            const id = parseInt(item, 10);
            const m = mediaMap[id];
            return { id, url: m ? m.file_url : '', name: m ? m.filename : `Media #${id}` };
          }
          if (typeof item === 'string') {
            return { id: null, url: item, name: item.split('/').pop() || 'Foto Galeri' };
          }
          if (typeof item === 'object' && item !== null) {
            return { id: item.id || null, url: item.url || item.file_url || '', name: item.name || item.filename || 'Foto' };
          }
          return null;
        }).filter(Boolean);
      }
      product.gallery_items = galleryItems;

      const productsList = await getProductsWithSizeTable(product.id);

      res.render('admin/products/edit', {
        title: 'Edit Produk - ' + product.name_id,
        pageTitle: 'Edit Produk Manufaktur',
        activeNav: 'products',
        product,
        categories,
        productsList: productsList || [],
        error: null,
        csrfToken: res.locals?.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product editView error:', { message: err.message });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal membuka form edit produk.'));
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name_id, name_en, category_id,
        short_description_id, short_description_en,
        description_id, description_en,
        cta_text_id, cta_text_en,
        status, sort_order,
        meta_title_id, meta_title_en, meta_desc_id, meta_desc_en
      } = req.body;

      const product = await productModel.findById(id);
      if (!product) {
        return res.redirect('/admin/products?error=' + encodeURIComponent('Produk tidak ditemukan.'));
      }

      if (short_description_id && short_description_id.trim().length > 200) {
        return res.redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent('Deskripsi singkat (ID) maksimal 200 karakter.'));
      }
      if (short_description_en && short_description_en.trim().length > 200) {
        return res.redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent('Deskripsi singkat (EN) maksimal 200 karakter.'));
      }

      const cleanCtaId = cta_text_id !== undefined ? (cta_text_id ? cta_text_id.replace(/<[^>]*>/g, '').trim() : '') : null;
      const cleanCtaEn = cta_text_en !== undefined ? (cta_text_en ? cta_text_en.replace(/<[^>]*>/g, '').trim() : '') : null;

      if (cleanCtaId !== null && cleanCtaId.length > 50) {
        return res.redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent('Teks tombol CTA (ID) maksimal 50 karakter.'));
      }
      if (cleanCtaEn !== null && cleanCtaEn.length > 50) {
        return res.redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent('Teks tombol CTA (EN) maksimal 50 karakter.'));
      }

      const galleryImages = parseGalleryImages(req.body);
      const variantLabels = parseVariantLabels(req.body);
      const legacyVariants = parseVariants(req.body);

      const hasVariantInput = req.body.variant_labels !== undefined
        || req.body.variants !== undefined
        || req.body.var_size !== undefined;
      const hasSizeTableInput = req.body.kode_produk !== undefined
        || req.body.size_code !== undefined
        || req.body.lebar !== undefined
        || req.body.size_width !== undefined
        || req.body.panjang !== undefined
        || req.body.size_length !== undefined
        || req.body.tebal_micron !== undefined
        || req.body.size_thickness !== undefined
        || req.body.kapasitas !== undefined
        || req.body.size_capacity !== undefined
        || req.body.bahan !== undefined
        || req.body.size_material !== undefined
        || req.body.size_table !== undefined;
      const hasGalleryInput = req.body.gallery_images !== undefined || req.body.gallery !== undefined;

      let sizeTable = undefined;
      if (hasSizeTableInput) {
        try {
          sizeTable = parseDynamicSizeTable(req.body);
        } catch (valErr) {
          return res.redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent(valErr.message));
        }
      }

      const updateData = {
        name_id: name_id ? name_id.trim() : product.name_id,
        name_en: name_en ? name_en.trim() : product.name_en,
        slug: name_id ? createSlug(name_id) : product.slug,
        category_id: category_id ? parseInt(category_id, 10) : null,
        short_description_id: short_description_id !== undefined ? (short_description_id ? short_description_id.trim() : null) : product.short_description_id,
        short_description_en: short_description_en !== undefined ? (short_description_en ? short_description_en.trim() : null) : product.short_description_en,
        description_id: description_id !== undefined ? description_id.trim() : product.description_id,
        description_en: description_en !== undefined ? description_en.trim() : product.description_en,
        cta_text_id: cta_text_id !== undefined ? (cleanCtaId && cleanCtaId.length > 0 ? cleanCtaId : null) : product.cta_text_id,
        cta_text_en: cta_text_en !== undefined ? (cleanCtaEn && cleanCtaEn.length > 0 ? cleanCtaEn : null) : product.cta_text_en,
        status: status || product.status,
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : product.sort_order,
        meta_title_id: meta_title_id || null,
        meta_title_en: meta_title_en || null,
        meta_desc_id: meta_desc_id || null,
        meta_desc_en: meta_desc_en || null
      };

      if (hasVariantInput) {
        updateData.variants = variantLabels.length > 0 ? variantLabels : (legacyVariants.length > 0 ? legacyVariants : []);
      }
      if (hasSizeTableInput) {
        updateData.size_table = sizeTable;
      }
      if (hasGalleryInput) {
        updateData.gallery_images = galleryImages;
      }

      if (req.file) {
        if (product.image_url) {
          await storage.delete(product.image_url);
        }
        updateData.image_url = await processAndSaveWebP(req.file.buffer, 'products');
      } else if (req.body.image_url !== undefined) {
        updateData.image_url = req.body.image_url ? req.body.image_url.trim() : null;
      }

      await productModel.update(id, updateData);
      invalidateSitemapCache();
      res.redirect('/admin/products?success=' + encodeURIComponent('Produk berhasil diperbarui.'));
    } catch (err) {
      logger.error('Product update error:', { message: err.message });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal memperbarui produk: ' + err.message));
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const product = await productModel.findById(id);
      if (product && product.image_url) {
        await storage.delete(product.image_url);
      }
      await productModel.delete(id);
      invalidateSitemapCache();
      res.redirect('/admin/products?success=' + encodeURIComponent('Produk berhasil dihapus.'));
    } catch (err) {
      logger.error('Product destroy error:', { message: err.message });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal menghapus produk.'));
    }
  }
};

export default productController;
