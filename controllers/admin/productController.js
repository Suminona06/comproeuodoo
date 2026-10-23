import productModel from '../../models/productModel.js';
import productCategoryModel from '../../models/productCategoryModel.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import storage from '../../config/storage.js';
import { sendCsvResponse } from '../../utils/csvExporter.js';
import { invalidateSitemapCache } from '../../utils/sitemapGenerator.js';
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

function parseTechnicalSpecs(body) {
  const specs = {};
  if (body.spec_key && body.spec_val) {
    const keys = Array.isArray(body.spec_key) ? body.spec_key : [body.spec_key];
    const vals = Array.isArray(body.spec_val) ? body.spec_val : [body.spec_val];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]?.trim();
      const v = vals[i]?.trim();
      if (k && v) {
        specs[k] = v;
      }
    }
  }
  return specs;
}

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
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(item => item.length > 0 && /^(https?:\/\/|\/)/i.test(item));
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

function parseSizeTable(body) {
  const ALLOWED_KEYS = ['product_code', 'width', 'length', 'thickness', 'capacity', 'material'];
  const rows = [];

  const hasFormInputs = body.size_code !== undefined
    || body.size_width !== undefined
    || body.size_length !== undefined
    || body.size_thickness !== undefined
    || body.size_capacity !== undefined
    || body.size_material !== undefined;

  if (hasFormInputs) {
    const codes = Array.isArray(body.size_code) ? body.size_code : [body.size_code || ''];
    const widths = Array.isArray(body.size_width) ? body.size_width : [body.size_width || ''];
    const lengths = Array.isArray(body.size_length) ? body.size_length : [body.size_length || ''];
    const thicknesses = Array.isArray(body.size_thickness) ? body.size_thickness : [body.size_thickness || ''];
    const capacities = Array.isArray(body.size_capacity) ? body.size_capacity : [body.size_capacity || ''];
    const materials = Array.isArray(body.size_material) ? body.size_material : [body.size_material || ''];

    const maxLen = Math.max(codes.length, widths.length, lengths.length, thicknesses.length, capacities.length, materials.length);
    for (let i = 0; i < maxLen; i++) {
      const code = (codes[i] || '').trim();
      const width = (widths[i] || '').trim();
      const length = (lengths[i] || '').trim();
      const thickness = (thicknesses[i] || '').trim();
      const capacity = (capacities[i] || '').trim();
      const material = (materials[i] || '').trim();

      if (code || width || length || thickness || capacity || material) {
        rows.push({
          product_code: code,
          width,
          length,
          thickness,
          capacity,
          material
        });
      }
    }
  } else if (body.size_table !== undefined) {
    let rawList = [];
    if (typeof body.size_table === 'string') {
      try {
        const parsed = JSON.parse(body.size_table);
        rawList = Array.isArray(parsed) ? parsed : [];
      } catch {
        rawList = [];
      }
    } else if (Array.isArray(body.size_table)) {
      rawList = body.size_table;
    }

    for (const item of rawList) {
      if (typeof item !== 'object' || item === null) continue;
      const cleaned = {};
      let hasValue = false;
      for (const key of ALLOWED_KEYS) {
        const val = item[key] !== undefined
          ? item[key]
          : (key === 'product_code' ? (item.code || item.size_code) : item[`size_${key}`]);
        const str = typeof val === 'string' ? val.trim() : (val !== undefined && val !== null ? String(val).trim() : '');
        cleaned[key] = str;
        if (str) hasValue = true;
      }
      if (hasValue) {
        rows.push(cleaned);
      }
    }
  }

  return rows;
}

export const productController = {
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
      const columns = [
        { label: 'ID', key: 'id' },
        { label: 'Slug', key: 'slug' },
        { label: 'Nama Produk (ID)', key: 'name_id' },
        { label: 'Nama Produk (EN)', key: 'name_en' },
        { label: 'Kategori', key: r => r.category_name_id || 'Tidak Berkategori' },
        { label: 'Spesifikasi Material', key: 'material_specs' },
        { label: 'Status', key: 'status' },
        { label: 'URL Gambar', key: 'image_url' },
        { label: 'Dibuat Pada', key: 'created_at' }
      ];

      const filename = `katalog-produk-euodoo-${new Date().toISOString().slice(0, 10)}.csv`;
      sendCsvResponse(res, filename, columns, products);
    } catch (err) {
      logger.error('Product export CSV error:', err);
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal mengekspor data produk ke CSV.'));
    }
  },

  async createView(req, res) {
    try {
      const categories = await productCategoryModel.findAll({ activeOnly: true });
      res.render('admin/products/create', {
        title: 'Tambah Produk Baru',
        pageTitle: 'Tambah Produk Manufaktur',
        activeNav: 'products',
        categories,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product createView error:', { message: err.message });
      res.redirect('/admin/products?error=' + encodeURIComponent('Gagal membuka form tambah produk.'));
    }
  },

  async store(req, res) {
    try {
      const {
        name_id, name_en, category_id,
        short_description_id, short_description_en,
        description_id, description_en,
        material_specs, status, sort_order,
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
          csrfToken: res.locals.csrfToken || ''
        });
      }

      if (short_description_id && short_description_id.trim().length > 500) {
        const categories = await productCategoryModel.findAll({ activeOnly: true });
        return res.status(400).render('admin/products/create', {
          title: 'Tambah Produk Baru',
          pageTitle: 'Tambah Produk',
          activeNav: 'products',
          categories,
          error: 'Deskripsi singkat (ID) maksimal 500 karakter.',
          formData: req.body,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      if (short_description_en && short_description_en.trim().length > 500) {
        const categories = await productCategoryModel.findAll({ activeOnly: true });
        return res.status(400).render('admin/products/create', {
          title: 'Tambah Produk Baru',
          pageTitle: 'Tambah Produk',
          activeNav: 'products',
          categories,
          error: 'Deskripsi singkat (EN) maksimal 500 karakter.',
          formData: req.body,
          csrfToken: res.locals.csrfToken || ''
        });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = await processAndSaveWebP(req.file.buffer, 'products');
      } else if (req.body.image_url) {
        imageUrl = req.body.image_url.trim();
      }

      const technicalSpecs = parseTechnicalSpecs(req.body);
      const galleryImages = parseGalleryImages(req.body);
      const variantLabels = parseVariantLabels(req.body);
      const sizeTable = parseSizeTable(req.body);
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
        material_specs: material_specs ? material_specs.trim() : null,
        technical_specs: technicalSpecs,
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

      res.render('admin/products/edit', {
        title: 'Edit Produk - ' + product.name_id,
        pageTitle: 'Edit Produk Manufaktur',
        activeNav: 'products',
        product,
        categories,
        error: null,
        csrfToken: res.locals.csrfToken || ''
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
        material_specs, status, sort_order,
        meta_title_id, meta_title_en, meta_desc_id, meta_desc_en
      } = req.body;

      const product = await productModel.findById(id);
      if (!product) {
        return res.redirect('/admin/products?error=' + encodeURIComponent('Produk tidak ditemukan.'));
      }

      if (short_description_id && short_description_id.trim().length > 500) {
        return res.redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent('Deskripsi singkat (ID) maksimal 500 karakter.'));
      }
      if (short_description_en && short_description_en.trim().length > 500) {
        return res.redirect(`/admin/products/${id}/edit?error=` + encodeURIComponent('Deskripsi singkat (EN) maksimal 500 karakter.'));
      }

      const technicalSpecs = parseTechnicalSpecs(req.body);
      const galleryImages = parseGalleryImages(req.body);
      const variantLabels = parseVariantLabels(req.body);
      const sizeTable = parseSizeTable(req.body);
      const legacyVariants = parseVariants(req.body);

      const hasVariantInput = req.body.variant_labels !== undefined
        || req.body.variants !== undefined
        || req.body.var_size !== undefined;
      const hasSizeTableInput = req.body.size_code !== undefined
        || req.body.size_width !== undefined
        || req.body.size_length !== undefined
        || req.body.size_thickness !== undefined
        || req.body.size_capacity !== undefined
        || req.body.size_material !== undefined
        || req.body.size_table !== undefined;
      const hasGalleryInput = req.body.gallery_images !== undefined || req.body.gallery !== undefined;

      const updateData = {
        name_id: name_id ? name_id.trim() : product.name_id,
        name_en: name_en ? name_en.trim() : product.name_en,
        slug: name_id ? createSlug(name_id) : product.slug,
        category_id: category_id ? parseInt(category_id, 10) : null,
        short_description_id: short_description_id !== undefined ? (short_description_id ? short_description_id.trim() : null) : product.short_description_id,
        short_description_en: short_description_en !== undefined ? (short_description_en ? short_description_en.trim() : null) : product.short_description_en,
        description_id: description_id !== undefined ? description_id.trim() : product.description_id,
        description_en: description_en !== undefined ? description_en.trim() : product.description_en,
        material_specs: material_specs !== undefined ? material_specs.trim() : product.material_specs,
        technical_specs: technicalSpecs,
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
