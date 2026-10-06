import aboutModel from '../../models/aboutModel.js';
import capabilityModel from '../../models/capabilityModel.js';
import pageHeroBannerModel from '../../models/pageHeroBannerModel.js';
import logger from '../../utils/logger.js';

export const pageController = {
  /**
   * Display About Us / Company Profile
   */
  async about(req, res) {
    try {
      const [about, heroBanner] = await Promise.all([
        aboutModel.getAboutData(),
        pageHeroBannerModel.getByPageKey('about')
      ]);
      const lang = res.locals.currentLang || 'id';
      const title = (lang === 'en' ? 'About Us' : 'Tentang Kami') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');
      res.render('public/about', {
        title,
        path: '/about',
        about,
        heroBanner
      });
    } catch (err) {
      logger.error('Public pageController.about error:', { message: err.message, stack: err.stack });
      const fallbackAbout = aboutModel.getDefaults();
      res.status(500).render('public/about', {
        title: 'Tentang Kami | PT Euodoo',
        path: '/about',
        about: fallbackAbout
      });
    }
  },

  /**
   * Display Machine Capabilities & Plant Facilities
   */
  async capabilities(req, res) {
    try {
      const capabilities = await capabilityModel.findAll(true);
      const title = res.locals.t('capabilities.page_title') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');
      
      res.render('public/capabilities', {
        title,
        path: '/capabilities',
        capabilities
      });
    } catch (err) {
      logger.error('Public pageController.capabilities error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/capabilities', {
        title: 'Kapabilitas Mesin | PT Euodoo',
        path: '/capabilities',
        capabilities: []
      });
    }
  }
};

export default pageController;
