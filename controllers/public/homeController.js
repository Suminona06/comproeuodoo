import bannerModel from '../../models/bannerModel.js';
import productModel from '../../models/productModel.js';
import capabilityModel from '../../models/capabilityModel.js';
import postModel from '../../models/postModel.js';
import logger from '../../utils/logger.js';

export const homeController = {
  async index(req, res) {
    try {
      const [banners, featuredProducts, capabilities, latestPosts] = await Promise.all([
        bannerModel.findAll(true),
        productModel.findAll({ isFeatured: true, isActive: true, limit: 6 }),
        capabilityModel.findAll(true),
        postModel.findAll({ status: 'published', limit: 3 })
      ]);

      const title = res.locals.t('home.hero_title') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');

      res.render('public/index', {
        title,
        path: '/',
        banners,
        featuredProducts,
        capabilities: capabilities.slice(0, 3),
        latestPosts
      });
    } catch (err) {
      logger.error('Public homeController error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/index', {
        title: 'PT Euodoo Presisi Indonesia',
        path: '/',
        banners: [],
        featuredProducts: [],
        capabilities: [],
        latestPosts: []
      });
    }
  }
};

export default homeController;
