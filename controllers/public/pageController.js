import aboutModel from '../../models/aboutModel.js';
import aboutGalleryModel from '../../models/aboutGalleryModel.js';
import aboutStatsModel from '../../models/aboutStatsModel.js';
import aboutTimelineModel from '../../models/aboutTimelineModel.js';
import capabilityModel from '../../models/capabilityModel.js';
import pageHeroBannerModel from '../../models/pageHeroBannerModel.js';
import logger from '../../utils/logger.js';

const DEFAULT_COMPANY_NAME = 'PT Euodoo Plastic';
const DEFAULT_TICKET_ACRONYM = 'T - I - C - K - E - T';

function translate(res, key) {
  return typeof res.locals?.t === 'function' ? res.locals.t(key) : key;
}

function buildTicketAcronym(about) {
  const letters = (about?.values || []).map((v) => v.letter).filter(Boolean);
  return letters.length > 0 ? letters.join(' - ') : DEFAULT_TICKET_ACRONYM;
}

async function fetchAboutPageData() {
  const [
    about,
    heroBanner,
    gallerySlides,
    stats,
    timeline,
    galleryHeader,
    storyHeader,
    timelineHeader,
    visionMissionImages
  ] = await Promise.all([
    aboutModel.getAboutData(),
    pageHeroBannerModel.getByPageKey('about'),
    aboutGalleryModel.findAll({ activeOnly: true }),
    aboutStatsModel.findAll({ activeOnly: true }),
    aboutTimelineModel.findAll({ activeOnly: true }),
    aboutModel.getGalleryHeader(),
    aboutModel.getStoryHeader(),
    aboutModel.getTimelineHeader(),
    aboutModel.getVisionMissionImages()
  ]);

  return {
    about,
    heroBanner,
    gallerySlides,
    stats,
    timeline,
    galleryHeader,
    storyHeader,
    timelineHeader,
    visionMissionImages
  };
}

function buildAboutFallbackPayload(res) {
  const fallbackAbout = aboutModel.getDefaults();
  const companyName = res.locals.settings?.company_name || DEFAULT_COMPANY_NAME;
  return {
    title: `${translate(res, 'about.meta_title')} | ${companyName}`,
    path: '/about',
    about: fallbackAbout,
    ticketAcronym: buildTicketAcronym(fallbackAbout),
    heroBanner: null,
    gallerySlides: [],
    stats: [],
    timeline: [],
    galleryHeader: {
      kicker_id: translate(res, 'about.gallery_default_kicker'),
      kicker_en: translate(res, 'about.gallery_default_kicker'),
      title_id: translate(res, 'about.gallery_default_title'),
      title_en: translate(res, 'about.gallery_default_title'),
      body_id: '',
      body_en: ''
    },
    storyHeader: {
      kicker_id: translate(res, 'about.story_default_kicker'),
      kicker_en: translate(res, 'about.story_default_kicker')
    },
    timelineHeader: {
      tagline_id: translate(res, 'about.timeline_default_tagline'),
      tagline_en: translate(res, 'about.timeline_default_tagline'),
      title_id: translate(res, 'about.timeline_default_title'),
      title_en: translate(res, 'about.timeline_default_title'),
      desc_id: translate(res, 'about.timeline_default_desc'),
      desc_en: translate(res, 'about.timeline_default_desc')
    },
    visionMissionImages: {
      vision_image_url: '',
      mission_image_url: ''
    }
  };
}

export const pageController = {
  async about(req, res) {
    try {
      const payload = await fetchAboutPageData();
      const companyName = res.locals.settings?.company_name || DEFAULT_COMPANY_NAME;
      res.render('public/about', {
        title: `${translate(res, 'about.meta_title')} | ${companyName}`,
        path: '/about',
        ticketAcronym: buildTicketAcronym(payload.about),
        ...payload
      });
    } catch (err) {
      logger.error('Public pageController.about error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/about', buildAboutFallbackPayload(res));
    }
  },

  async capabilities(req, res) {
    const companyName = res.locals.settings?.company_name || DEFAULT_COMPANY_NAME;
    const title = `${translate(res, 'capabilities.page_title')} | ${companyName}`;
    try {
      const capabilities = await capabilityModel.findAll(true);
      res.render('public/capabilities', {
        title,
        path: '/capabilities',
        capabilities
      });
    } catch (err) {
      logger.error('Public pageController.capabilities error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/capabilities', {
        title,
        path: '/capabilities',
        capabilities: []
      });
    }
  }
};

export default pageController;
