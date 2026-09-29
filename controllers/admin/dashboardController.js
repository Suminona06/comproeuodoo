import leadModel from '../../models/leadModel.js';
import productModel from '../../models/productModel.js';
import postModel from '../../models/postModel.js';
import bannerModel from '../../models/bannerModel.js';
import logger from '../../utils/logger.js';

export const dashboardController = {
  async index(req, res) {
    try {
      const [
        pendingLeadsCount,
        activeProductsCount,
        publishedPostsCount,
        activeBannersCount,
        recentLeads
      ] = await Promise.all([
        leadModel.countAll({ status: 'baru' }),
        productModel.countAll({ isActive: true }),
        postModel.countAll({ status: 'published' }),
        bannerModel.countActive(),
        leadModel.findAll({ limit: 5 })
      ]);

      res.render('admin/dashboard', {
        title: 'Dashboard Administrasi - PT Euodoo CMS',
        activeNav: 'dashboard',
        stats: {
          pendingLeads: pendingLeadsCount,
          activeProducts: activeProductsCount,
          publishedPosts: publishedPostsCount,
          activeBanners: activeBannersCount
        },
        recentLeads
      });
    } catch (err) {
      logger.error('Dashboard index error:', { message: err.message });
      res.status(500).render('admin/dashboard', {
        title: 'Dashboard Administrasi - PT Euodoo CMS',
        activeNav: 'dashboard',
        stats: { pendingLeads: 0, activeProducts: 0, publishedPosts: 0, activeBanners: 0 },
        recentLeads: [],
        error: 'Gagal memuat beberapa data dashboard.'
      });
    }
  }
};

export default dashboardController;
