import productModel from '../../models/productModel.js';
import productCategoryModel from '../../models/productCategoryModel.js';
import pageHeroBannerModel from '../../models/pageHeroBannerModel.js';
import logger from '../../utils/logger.js';

export const productController = {
  /**
   * Display product catalog with category filter, search, sorting, and SSR/AJAX pagination
   */
  async index(req, res) {
    try {
      const { category, search, sort: rawSort, page: rawPage, format } = req.query;
      const page = Math.max(1, parseInt(rawPage || '1', 10) || 1);
      const limit = 9;
      const offset = (page - 1) * limit;

      const ALLOWED_SORTS = ['newest', 'alpha-asc', 'alpha-desc', 'catalog'];
      const sort = ALLOWED_SORTS.includes(rawSort) ? rawSort : 'newest';

      const sanitizedSearch = typeof search === 'string' ? search.trim().slice(0, 100) : '';

      const categories = await productCategoryModel.findAll({ activeOnly: true });

      let selectedCategory = null;
      let categoryId = undefined;

      if (category) {
        if (/^\d+$/.test(category)) {
          selectedCategory = await productCategoryModel.findById(parseInt(category, 10));
        } else {
          selectedCategory = await productCategoryModel.findBySlug(category);
        }
        if (selectedCategory && (selectedCategory.is_active === 1 || selectedCategory.is_active === null)) {
          categoryId = selectedCategory.id;
        } else {
          selectedCategory = null;
          categoryId = -1;
        }
      }

      const filterOptions = {
        categoryId,
        status: 'published',
        search: sanitizedSearch || undefined,
        sort,
        limit,
        offset
      };

      const [products, totalCount, heroBanner] = await Promise.all([
        productModel.findAll(filterOptions),
        productModel.countAll(filterOptions),
        pageHeroBannerModel.getByPageKey('products')
      ]);

      const totalPages = Math.ceil(totalCount / limit) || 1;
      const hasMore = page < totalPages;

      const lang = res.locals.currentLang || 'id';

      if (res.locals?.seo) {
        if (page > 1 || sanitizedSearch || (rawSort && rawSort !== 'newest') || (category && !selectedCategory)) {
          res.locals.seo.robots = 'noindex, follow';
        }
      }

      const isFragment = format === 'fragment' || req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest';

      if (isFragment) {
        res.set('X-Has-More', String(hasMore));
        res.set('X-Total-Count', String(totalCount));
        res.set('X-Current-Page', String(page));
        res.set('X-Total-Pages', String(totalPages));

        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          return res.app.render('public/partials/product-card-fragment', {
            products: products || [],
            currentLang: lang,
            page,
            hasMore,
            totalProducts: totalCount
          }, (err, html) => {
            if (err) {
              logger.error('Error rendering product card fragment JSON:', err);
              return res.status(500).json({ error: 'Failed to render fragment' });
            }
            return res.json({
              html,
              hasMore,
              page,
              totalPages,
              totalProducts: totalCount
            });
          });
        }

        return res.render('public/partials/product-card-fragment', {
          products: products || [],
          currentLang: lang,
          page,
          hasMore,
          totalProducts: totalCount
        });
      }

      const pageTitle = (lang === 'en' ? 'Product Catalog' : 'Katalog Produk') + ' | ' + (res.locals.settings?.company_name || 'PT. EUODOO');

      res.render('public/products', {
        title: pageTitle,
        path: '/products',
        categories: categories || [],
        selectedCategory,
        products: products || [],
        search: sanitizedSearch,
        sort,
        page,
        totalPages,
        totalProducts: totalCount,
        hasMore,
        heroBanner
      });
    } catch (err) {
      logger.error('Public productController.index error:', { message: err.message, stack: err.stack });
      if (req.query.format === 'fragment' || req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(500).send('');
      }
      res.status(500).render('public/products', {
        title: 'Katalog Produk | PT. EUODOO',
        path: '/products',
        categories: [],
        selectedCategory: null,
        products: [],
        search: '',
        sort: 'newest',
        page: 1,
        totalPages: 1,
        totalProducts: 0,
        hasMore: false
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
