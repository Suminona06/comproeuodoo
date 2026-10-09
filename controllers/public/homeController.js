import bannerModel from '../../models/bannerModel.js';
import productModel from '../../models/productModel.js';
import brandModel from '../../models/brandModel.js';
import postModel from '../../models/postModel.js';
import logger from '../../utils/logger.js';

export const homeController = {
  async index(req, res) {
    try {
      const [banners, featuredProducts, brands, latestPosts] = await Promise.all([
        bannerModel.findAll(true),
        productModel.findAll({ isFeatured: true, status: 'published', limit: 4 }),
        brandModel.findAll({ activeOnly: true }),
        postModel.findAll({ status: 'published', limit: 2 })
      ]);

      // Fallback if featured products are less than 4
      let products = featuredProducts;
      if (!products || products.length < 4) {
        const published = await productModel.findAll({ status: 'published', limit: 4 });
        products = published;
      }

      const title = (res.locals.settings?.company_name || 'PT. EUODOO') + ' | ' +
        (res.locals.currentLang === 'en'
          ? 'Eco-Friendly HDPE & LLDPE Plastic Bag Manufacturer Bandung'
          : 'Produsen Kantong Plastik HDPE & LLDPE Bandung');

      res.render('public/index', {
        title,
        path: '/',
        banners: banners || [],
        featuredProducts: products || [],
        brands: brands || [],
        latestPosts: latestPosts || []
      });
    } catch (err) {
      logger.error('Public homeController error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/index', {
        title: 'PT. EUODOO | Produsen Kantong Plastik Bandung',
        path: '/',
        banners: [],
        featuredProducts: [],
        brands: [],
        latestPosts: []
      });
    }
  }
};

export default homeController;
