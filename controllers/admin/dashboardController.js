import inquiryModel from '../../models/inquiryModel.js';
import productModel from '../../models/productModel.js';
import postModel from '../../models/postModel.js';
import bannerModel from '../../models/bannerModel.js';
import brandModel from '../../models/brandModel.js';
import logger from '../../utils/logger.js';

export const dashboardController = {
  async index(req, res) {
    try {
      const [
        pendingInquiriesCount,
        activeProductsCount,
        publishedPostsCount,
        activeBannersCount,
        activeBrands,
        recentInquiries
      ] = await Promise.all([
        inquiryModel.countAll({ status: 'baru' }),
        productModel.countAll({ status: 'published' }),
        postModel.countAll({ status: 'published' }),
        bannerModel.countActive(),
        brandModel.findAll({ activeOnly: true }),
        inquiryModel.findAll({ limit: 15 })
      ]);

      res.render('admin/dashboard', {
        title: 'Ringkasan Operasional CMS',
        pageTitle: 'Ringkasan Dashboard',
        activeNav: 'dashboard',
        pendingInquiriesCount,
        stats: {
          pendingLeads: pendingInquiriesCount,
          activeProducts: activeProductsCount,
          publishedPosts: publishedPostsCount,
          activeBanners: activeBannersCount,
          activeBrandsCount: activeBrands.length
        },
        recentInquiries,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Dashboard index error:', { message: err.message });
      res.status(500).render('admin/dashboard', {
        title: 'Dashboard Administrasi',
        pageTitle: 'Dashboard',
        activeNav: 'dashboard',
        pendingInquiriesCount: 0,
        stats: { pendingLeads: 0, activeProducts: 0, publishedPosts: 0, activeBanners: 0, activeBrandsCount: 0 },
        recentInquiries: [],
        error: 'Gagal memuat beberapa data dashboard.'
      });
    }
  }
};

export default dashboardController;
