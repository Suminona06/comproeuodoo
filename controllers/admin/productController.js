import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import productModel from '../../models/productModel.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const productController = {
  /**
   * List all products with filtering
   */
  async index(req, res) {
    try {
      const categoryId = req.query.category ? parseInt(req.query.category, 10) : null;
      const search = req.query.search || null;

      const [products, categories] = await Promise.all([
        productModel.findAll({ categoryId, search }),
        productModel.findAllCategories()
      ]);

      res.render('admin/products/index', {
        title: 'Manajemen Produk - PT Euodoo CMS',
        activeNav: 'products',
        products,
        categories,
        selectedCategory: categoryId,
        searchQuery: search,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product index error:', { message: err.message });
      res.status(500).render('admin/products/index', {
        title: 'Manajemen Produk - PT Euodoo CMS',
        activeNav: 'products',
        products: [],
        categories: [],
        selectedCategory: null,
        searchQuery: null,
        error: 'Gagal memuat katalog produk.',
        csrfToken: res.locals.csrfToken || ''
      });
    }
  },

  /**
   * Render Create Product Form
   */
  async createView(req, res) {
    try {
      const categories = await productModel.findAllCategories();
      res.render('admin/products/create', {
        title: 'Tambah Produk Baru - PT Euodoo CMS',
        activeNav: 'products',
        categories,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product createView error:', { message: err.message });
      res.redirect('/admin/products?error=Gagal+membuka+form+tambah+produk.');
    }
  },

  /**
   * Store new product
   */
  async store(req, res) {
    try {
      const {
        category_id,
        name_id,
        name_en,
        description_id,
        description_en,
        material_specs,
        technical_specs,
        is_featured,
        is_active,
        sort_order
      } = req.body;

      if (!name_id || !category_id) {
        return res.redirect('/admin/products/create?error=Nama+produk+dan+kategori+wajib+diisi.');
      }

      let mainImage = null;
      if (req.file) {
        mainImage = await processAndSaveWebP(req.file.buffer, 'products', { maxWidth: 1200, maxHeight: 1200, quality: 82 });
      }

      const baseSlug = createSlug(name_id);
      const uniqueSuffix = Math.floor(Math.random() * 899 + 100);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      await productModel.create({
        category_id: parseInt(category_id, 10),
        name_id,
        name_en: name_en || name_id,
        slug,
        description_id,
        description_en,
        material_specs: material_specs ? { raw: material_specs } : null,
        technical_specs: technical_specs ? { raw: technical_specs } : null,
        main_image: mainImage,
        is_featured: is_featured === '1' || is_featured === 'on',
        is_active: is_active === '0' ? 0 : 1,
        sort_order: parseInt(sort_order || '0', 10)
      });

      logger.info(`Product created: ${name_id} (${slug})`);
      return res.redirect('/admin/products?success=Produk+berhasil+ditambahkan.');
    } catch (err) {
      logger.error('Product store error:', { message: err.message });
      return res.redirect(`/admin/products/create?error=${encodeURIComponent(err.message)}`);
    }
  },

  /**
   * Render Edit Product Form
   */
  async editView(req, res) {
    const { id } = req.params;

    try {
      const [product, categories] = await Promise.all([
        productModel.findById(id),
        productModel.findAllCategories()
      ]);

      if (!product) {
        return res.redirect('/admin/products?error=Produk+tidak+ditemukan.');
      }

      res.render('admin/products/edit', {
        title: `Edit Produk #${product.id} - PT Euodoo CMS`,
        activeNav: 'products',
        product,
        categories,
        error: null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Product editView error:', { message: err.message });
      res.redirect('/admin/products?error=Gagal+membuka+form+edit+produk.');
    }
  },

  /**
   * Update existing product
   */
  async update(req, res) {
    const { id } = req.params;

    try {
      const existingProduct = await productModel.findById(id);
      if (!existingProduct) {
        return res.redirect('/admin/products?error=Produk+tidak+ditemukan.');
      }

      const {
        category_id,
        name_id,
        name_en,
        description_id,
        description_en,
        material_specs,
        technical_specs,
        is_featured,
        is_active,
        sort_order
      } = req.body;

      let mainImage = existingProduct.main_image;
      if (req.file) {
        // Save new WebP image
        mainImage = await processAndSaveWebP(req.file.buffer, 'products', { maxWidth: 1200, maxHeight: 1200, quality: 82 });

        // Remove old image if stored locally
        if (existingProduct.main_image && existingProduct.main_image.startsWith('/uploads/')) {
          const oldPath = path.join(rootDir, 'public', existingProduct.main_image);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      }

      await productModel.update(id, {
        category_id: parseInt(category_id, 10),
        name_id,
        name_en: name_en || name_id,
        description_id,
        description_en,
        material_specs: material_specs ? { raw: material_specs } : null,
        technical_specs: technical_specs ? { raw: technical_specs } : null,
        main_image: mainImage,
        is_featured: is_featured === '1' || is_featured === 'on',
        is_active: is_active === '0' ? 0 : 1,
        sort_order: parseInt(sort_order || '0', 10)
      });

      logger.info(`Product #${id} updated.`);
      return res.redirect('/admin/products?success=Produk+berhasil+diperbarui.');
    } catch (err) {
      logger.error('Product update error:', { message: err.message });
      return res.redirect(`/admin/products/${id}/edit?error=${encodeURIComponent(err.message)}`);
    }
  },

  /**
   * Delete product
   */
  async destroy(req, res) {
    const { id } = req.params;

    try {
      const product = await productModel.findById(id);
      if (!product) {
        return res.redirect('/admin/products?error=Produk+tidak+ditemukan.');
      }

      await productModel.delete(id);

      if (product.main_image && product.main_image.startsWith('/uploads/')) {
        const filePath = path.join(rootDir, 'public', product.main_image);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      logger.info(`Product #${id} deleted.`);
      return res.redirect('/admin/products?success=Produk+berhasil+dihapus.');
    } catch (err) {
      logger.error('Product destroy error:', { message: err.message });
      return res.redirect(`/admin/products?error=${encodeURIComponent(err.message)}`);
    }
  }
};

export default productController;
