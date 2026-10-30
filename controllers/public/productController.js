import productModel, { normalizeSizeTable } from '../../models/productModel.js';
import productCategoryModel from '../../models/productCategoryModel.js';
import pageHeroBannerModel from '../../models/pageHeroBannerModel.js';
import { query } from '../../config/database.js';
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

      const [products, totalCount, totalAllProducts, heroBanner] = await Promise.all([
        productModel.findAll(filterOptions),
        productModel.countAll(filterOptions),
        productModel.countAll({ status: 'published' }),
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
        res.set('X-Total-All-Count', String(totalAllProducts));
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
              totalProducts: totalCount,
              totalAllProducts
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
        totalAllProducts,
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
        totalAllProducts: 0,
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

      if (!product || product.status !== 'published' || product.is_active === 0) {
        return res.status(404).render('public/404', {
          title: 'Produk Tidak Ditemukan | PT. EUODOO',
          path: '/products',
          message: 'Produk yang Anda cari tidak tersedia atau sedang diperbarui.'
        });
      }

      product.short_description_id = product.short_description_id || null;
      product.short_description_en = product.short_description_en || null;
      product.variants = Array.isArray(product.variants) ? product.variants : [];
      product.size_table = normalizeSizeTable(product.size_table);

      const mainImage = product.main_image || product.image_url || null;
      let gallery = [];
      if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
        gallery = product.gallery_images;
      } else if (Array.isArray(product.gallery) && product.gallery.length > 0) {
        gallery = product.gallery;
      } else if (mainImage) {
        gallery = [mainImage];
      }

      const idList = gallery.filter(item => typeof item === 'number' || (typeof item === 'string' && /^\d+$/.test(item.trim())));
      if (idList.length > 0) {
        const ids = idList.map(x => parseInt(x, 10));
        const placeholders = ids.map(() => '?').join(',');
        const mediaRows = await query(`SELECT id, file_url FROM media WHERE id IN (${placeholders})`, ids);
        const mediaMap = {};
        mediaRows.forEach(m => { mediaMap[m.id] = m.file_url; });
        gallery = gallery.map(item => {
          if (typeof item === 'number' || (typeof item === 'string' && /^\d+$/.test(item.trim()))) {
            return mediaMap[parseInt(item, 10)] || null;
          }
          return item;
        }).filter(Boolean);
        if (gallery.length === 0 && mainImage) {
          gallery = [mainImage];
        }
      }

      product.gallery_images = gallery;
      product.gallery = gallery;
      product.images = gallery;

      const lang = res.locals.currentLang || 'id';
      const prodName = lang === 'en' ? (product.name_en || product.name_id) : product.name_id;
      const title = prodName + ' | ' + (res.locals.settings?.company_name || 'PT. EUODOO');

      const settings = res.locals.settings || {};
      const waNumber = settings.whatsapp_formatted_number
        || (settings.whatsapp_number ? String(settings.whatsapp_number).replace(/[^0-9]/g, '') : '6281234567890');
      const canonicalUrl = product.canonical_url || `${req.protocol}://${req.get('host')}/products/${product.slug || product.id}`;
      const waMessage = `Halo, saya tertarik dengan produk ${prodName}. Boleh saya minta informasi lebih lanjut?`;
      const whatsappQuoteUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
      product.whatsapp_quote_url = whatsappQuoteUrl;

      const relatedProducts = await productModel.findAll({
        categoryId: product.category_id,
        status: 'published',
        activeOnly: true,
        limit: 5
      });

      res.render('public/product-detail', {
        title,
        path: '/products',
        headerSolid: true,
        product,
        canonicalUrl,
        whatsappQuoteUrl,
        relatedProducts: (relatedProducts || []).filter(p => p.id !== product.id && p.is_active !== 0).slice(0, 4)
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
