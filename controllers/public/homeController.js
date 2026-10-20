import bannerModel from '../../models/bannerModel.js';
import productModel from '../../models/productModel.js';
import productCategoryModel from '../../models/productCategoryModel.js';
import brandModel from '../../models/brandModel.js';
import postModel from '../../models/postModel.js';
import homeContentModel from '../../models/homeContentModel.js';
import { formatInlineText } from '../../utils/textFormatter.js';
import logger from '../../utils/logger.js';

export const homeController = {
  async index(req, res) {
    try {
      const [banners, brands, latestPosts, homeContent, homepageCategories] = await Promise.all([
        bannerModel.findAll(true),
        brandModel.findAll({ activeOnly: true }),
        postModel.findAll({ status: 'published', limit: 2 }),
        homeContentModel.getHomeContentData(),
        productCategoryModel.getHomepageCategories()
      ]);

      const title = (res.locals.settings?.company_name || 'PT. EUODOO') + ' | ' +
        (res.locals.currentLang === 'en'
          ? 'Eco-Friendly HDPE & LLDPE Plastic Bag Manufacturer Bandung'
          : 'Produsen Kantong Plastik HDPE & LLDPE Bandung');

      res.render('public/index', {
        title,
        path: '/',
        banners: banners || [],
        featuredProducts: [],
        homepageCategories: homepageCategories || [],
        brands: brands || [],
        latestPosts: latestPosts || [],
        homeContent: homeContent || homeContentModel.getDefaults(),
        formatInlineText
      });
    } catch (err) {
      logger.error('Public homeController error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/index', {
        title: 'PT. EUODOO | Produsen Kantong Plastik Bandung',
        path: '/',
        banners: [],
        featuredProducts: [],
        homepageCategories: [],
        brands: [],
        latestPosts: [],
        homeContent: homeContentModel.getDefaults(),
        formatInlineText
      });
    }
  }
};

export default homeController;
