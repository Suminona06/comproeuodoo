import productModel from '../../models/productModel.js';
import logger from '../../utils/logger.js';

export const productController = {
  /**
   * Display product catalog with category filter and search
   */
  async index(req, res) {
    try {
      const { category, search } = req.query;
      const categories = await productModel.findAllCategories();

      let selectedCategory = null;
      let categoryId = undefined;

      if (category) {
        if (/^\d+$/.test(category)) {
          selectedCategory = await productModel.findCategoryById(parseInt(category, 10));
        } else {
          selectedCategory = await productModel.findCategoryBySlug(category);
        }
        if (selectedCategory) {
          categoryId = selectedCategory.id;
        }
      }

      const products = await productModel.findAll({
        isActive: true,
        categoryId,
        search: search ? search.trim() : undefined
      });

      const title = res.locals.t('products.page_title') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');

      res.render('public/products', {
        title,
        path: '/products',
        categories,
        selectedCategory,
        products,
        search: search ? search.trim() : ''
      });
    } catch (err) {
      logger.error('Public productController.index error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/products', {
        title: 'Katalog Produk | PT Euodoo',
        path: '/products',
        categories: [],
        selectedCategory: null,
        products: [],
        search: ''
      });
    }
  },

  /**
   * Display single product detail by slug
   */
  async detail(req, res) {
    try {
      const { slug } = req.params;
      const product = await productModel.findBySlug(slug);

      if (!product || !product.is_active) {
        return res.status(404).render('public/404', {
          title: 'Produk Tidak Ditemukan | PT Euodoo',
          path: '/products'
        });
      }

      // Safe JSON parse for specs and galleries
      let materialSpecs = null;
      if (product.material_specs) {
        try {
          materialSpecs = typeof product.material_specs === 'string'
            ? JSON.parse(product.material_specs)
            : product.material_specs;
        } catch {
          materialSpecs = { info: product.material_specs };
        }
      }

      let technicalSpecs = null;
      if (product.technical_specs) {
        try {
          technicalSpecs = typeof product.technical_specs === 'string'
            ? JSON.parse(product.technical_specs)
            : product.technical_specs;
        } catch {
          technicalSpecs = { info: product.technical_specs };
        }
      }

      let galleryImages = [];
      if (product.gallery_images) {
        try {
          galleryImages = typeof product.gallery_images === 'string'
            ? JSON.parse(product.gallery_images)
            : product.gallery_images;
          if (!Array.isArray(galleryImages)) galleryImages = [];
        } catch {
          galleryImages = [];
        }
      }

      // Fetch related products in the same category
      let relatedProducts = [];
      if (product.category_id) {
        const related = await productModel.findAll({
          categoryId: product.category_id,
          isActive: true,
          limit: 4
        });
        relatedProducts = related.filter(p => p.id !== product.id).slice(0, 3);
      }

      const currentLang = res.locals.currentLang || 'id';
      const productName = currentLang === 'en' ? (product.name_en || product.name_id) : product.name_id;
      const title = productName + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');

      res.render('public/product-detail', {
        title,
        path: '/products',
        product,
        materialSpecs,
        technicalSpecs,
        galleryImages,
        relatedProducts
      });
    } catch (err) {
      logger.error('Public productController.detail error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/404', {
        title: 'Error | PT Euodoo',
        path: '/products'
      });
    }
  }
};

export default productController;
