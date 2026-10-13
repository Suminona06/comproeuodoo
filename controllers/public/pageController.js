import aboutModel from '../../models/aboutModel.js';
import aboutGalleryModel from '../../models/aboutGalleryModel.js';
import aboutStatsModel from '../../models/aboutStatsModel.js';
import aboutTimelineModel from '../../models/aboutTimelineModel.js';
import capabilityModel from '../../models/capabilityModel.js';
import pageHeroBannerModel from '../../models/pageHeroBannerModel.js';
import logger from '../../utils/logger.js';

export const pageController = {
  async about(req, res) {
    try {
      const [
        about,
        heroBanner,
        gallerySlides,
        stats,
        timeline,
        galleryHeader,
        storyHeader,
        visionMissionImages
      ] = await Promise.all([
        aboutModel.getAboutData(),
        pageHeroBannerModel.getByPageKey('about'),
        aboutGalleryModel.findAll({ activeOnly: true }),
        aboutStatsModel.findAll({ activeOnly: true }),
        aboutTimelineModel.findAll({ activeOnly: true }),
        aboutModel.getGalleryHeader(),
        aboutModel.getStoryHeader(),
        aboutModel.getVisionMissionImages()
      ]);

      const lang = res.locals.currentLang || 'id';
      const title = (lang === 'en' ? 'About Us' : 'Tentang Kami') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');

      res.render('public/about', {
        title,
        path: '/about',
        about,
        heroBanner,
        gallerySlides,
        stats,
        timeline,
        galleryHeader,
        storyHeader,
        visionMissionImages
      });
    } catch (err) {
      logger.error('Public pageController.about error:', { message: err.message, stack: err.stack });
      const fallbackAbout = aboutModel.getDefaults();
      res.status(500).render('public/about', {
        title: 'Tentang Kami | PT Euodoo',
        path: '/about',
        about: fallbackAbout,
        heroBanner: null,
        gallerySlides: [],
        stats: [],
        timeline: [],
        galleryHeader: {
          kicker_id: 'Galeri Kami',
          kicker_en: 'Our Gallery',
          title_id: 'Di Dalam Operasional Kami',
          title_en: 'Inside Our Operations',
          body_id: '',
          body_en: ''
        },
        storyHeader: {
          kicker_id: 'Kisah Kami',
          kicker_en: 'Our Story'
        },
        visionMissionImages: {
          vision_image_url: '',
          mission_image_url: ''
        }
      });
    }
  },

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
