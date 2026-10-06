import productModel from '../../models/productModel.js';
import productCategoryModel from '../../models/productCategoryModel.js';
import pageHeroBannerModel from '../../models/pageHeroBannerModel.js';
import logger from '../../utils/logger.js';

export const productController = {
  /**
   * Display product catalog with category filter, search, and SSR pagination
   */
  async index(req, res) {
    try {
      const { category, search, page: rawPage } = req.query;
      const page = Math.max(1, parseInt(rawPage || '1', 10));
      const limit = 12;
      const offset = (page - 1) * limit;

      const categories = await productCategoryModel.findAll();

      let selectedCategory = null;
      let categoryId = undefined;

      if (category) {
        if (/^\d+$/.test(category)) {
          selectedCategory = await productCategoryModel.findById(parseInt(category, 10));
        } else {
          selectedCategory = await productCategoryModel.findBySlug(category);
        }
        if (selectedCategory) {
          categoryId = selectedCategory.id;
        }
      }

      const filterOptions = {
        categoryId,
        status: 'published',
        search: search ? search.trim() : undefined,
        limit,
        offset
      };

      const [products, totalCount, heroBanner] = await Promise.all([
        productModel.findAll(filterOptions),
        productModel.countAll(filterOptions),
        pageHeroBannerModel.getByPageKey('products')
      ]);

      const totalPages = Math.ceil(totalCount / limit) || 1;

      const lang = res.locals.currentLang || 'id';
      const pageTitle = (lang === 'en' ? 'Product Catalog' : 'Katalog Produk') + ' | ' + (res.locals.settings?.company_name || 'PT. EUODOO');

      res.render('public/products', {
        title: pageTitle,
        path: '/products',
        categories: categories || [],
        selectedCategory,
        products: products || [],
        search: search ? search.trim() : '',
        page,
        totalPages,
        totalProducts: totalCount,
        heroBanner
      });
    } catch (err) {
      logger.error('Public productController.index error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/products', {
        title: 'Katalog Produk | PT. EUODOO',
        path: '/products',
        categories: [],
        selectedCategory: null,
        products: [],
        search: '',
        page: 1,
        totalPages: 1,
        totalProducts: 0
      });
    }
  },

  /**
   * Display single product detail
   */
  async detail(req, res) {
    try {
      const { slug } = req.params;
      let product = null;

      if (/^\d+$/.test(slug)) {
        product = await productModel.findById(parseInt(slug, 10));
      } else {
        product = await productModel.findBySlug(slug);
      }

      if (!product || product.status !== 'published') {
        return res.status(404).render('public/404', {
          title: 'Produk Tidak Ditemukan | PT. EUODOO',
          path: '/products',
          message: 'Produk yang Anda cari tidak tersedia atau sedang diperbarui.'
        });
      }

      // Fetch related products in the same category
      const relatedProducts = await productModel.findAll({
        categoryId: product.category_id,
        status: 'published',
        limit: 4
      });

      const lang = res.locals.currentLang || 'id';
      const prodName = lang === 'en' ? (product.name_en || product.name_id) : product.name_id;
      const title = prodName + ' | ' + (res.locals.settings?.company_name || 'PT. EUODOO');

      res.render('public/product-detail', {
        title,
        path: '/products',
        product,
        relatedProducts: (relatedProducts || []).filter(p => p.id !== product.id).slice(0, 3)
      });
    } catch (err) {
      logger.error('Public productController.detail error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/404', {
        title: 'Error | PT. EUODOO',
        path: '/products',
        message: 'Gagal memuat rincian produk.'
      });
    }
  }
};

export default productController;
