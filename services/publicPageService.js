import aboutModel from '../models/aboutModel.js';
import aboutGalleryModel from '../models/aboutGalleryModel.js';
import aboutStatsModel from '../models/aboutStatsModel.js';
import aboutTimelineModel from '../models/aboutTimelineModel.js';
import pageHeroBannerModel from '../models/pageHeroBannerModel.js';
import { listActiveCapabilities } from './capabilityService.js';

const DEFAULT_COMPANY_NAME = 'PT Euodoo Plastic';
const DEFAULT_TICKET_ACRONYM = 'T - I - C - K - E - T';

function translate(t, key) {
  return typeof t === 'function' ? t(key) : key;
}

function resolveCompanyName(settings) {
  return settings?.company_name || DEFAULT_COMPANY_NAME;
}

export function buildTicketAcronym(about) {
  const letters = (about?.values || []).map((v) => v.letter).filter(Boolean);
  return letters.length > 0 ? letters.join(' - ') : DEFAULT_TICKET_ACRONYM;
}

async function fetchAboutBundle(deps) {
  const abtModel = deps.aboutModel || aboutModel;
  const heroModel = deps.pageHeroBannerModel || pageHeroBannerModel;
  const galleryModel = deps.aboutGalleryModel || aboutGalleryModel;
  const statsModel = deps.aboutStatsModel || aboutStatsModel;
  const timelineModel = deps.aboutTimelineModel || aboutTimelineModel;

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
    abtModel.getAboutData(),
    heroModel.getByPageKey('about'),
    galleryModel.findAll({ activeOnly: true }),
    statsModel.findAll({ activeOnly: true }),
    timelineModel.findAll({ activeOnly: true }),
    abtModel.getGalleryHeader(),
    abtModel.getStoryHeader(),
    abtModel.getTimelineHeader(),
    abtModel.getVisionMissionImages()
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

export async function getAboutPageData(context = {}, deps = {}) {
  const bundle = await fetchAboutBundle(deps);
  const title = `${translate(context.t, 'about.meta_title')} | ${resolveCompanyName(context.settings)}`;
  return {
    title,
    path: '/about',
    ticketAcronym: buildTicketAcronym(bundle.about),
    ...bundle
  };
}

function buildFallbackHeaders(t) {
  return {
    galleryHeader: {
      kicker_id: translate(t, 'about.gallery_default_kicker'),
      kicker_en: translate(t, 'about.gallery_default_kicker'),
      title_id: translate(t, 'about.gallery_default_title'),
      title_en: translate(t, 'about.gallery_default_title'),
      body_id: '',
      body_en: ''
    },
    storyHeader: {
      kicker_id: translate(t, 'about.story_default_kicker'),
      kicker_en: translate(t, 'about.story_default_kicker')
    },
    timelineHeader: {
      tagline_id: translate(t, 'about.timeline_default_tagline'),
      tagline_en: translate(t, 'about.timeline_default_tagline'),
      title_id: translate(t, 'about.timeline_default_title'),
      title_en: translate(t, 'about.timeline_default_title'),
      desc_id: translate(t, 'about.timeline_default_desc'),
      desc_en: translate(t, 'about.timeline_default_desc')
    },
    visionMissionImages: {
      vision_image_url: '',
      mission_image_url: ''
    }
  };
}

export function buildAboutFallbackPayload(context = {}, deps = {}) {
  const abtModel = deps.aboutModel || aboutModel;
  const fallbackAbout = abtModel.getDefaults();
  return {
    title: `${translate(context.t, 'about.meta_title')} | ${resolveCompanyName(context.settings)}`,
    path: '/about',
    about: fallbackAbout,
    ticketAcronym: buildTicketAcronym(fallbackAbout),
    heroBanner: null,
    gallerySlides: [],
    stats: [],
    timeline: [],
    ...buildFallbackHeaders(context.t)
  };
}

export async function getCapabilitiesPageData(context = {}, deps = {}) {
  const fetchActive = deps.listActiveCapabilities || listActiveCapabilities;
  const capabilities = await fetchActive(deps);
  return {
    title: `${translate(context.t, 'capabilities.page_title')} | ${resolveCompanyName(context.settings)}`,
    path: '/capabilities',
    capabilities
  };
}

export function buildCapabilitiesFallbackPayload(context = {}) {
  return {
    title: `${translate(context.t, 'capabilities.page_title')} | ${resolveCompanyName(context.settings)}`,
    path: '/capabilities',
    capabilities: []
  };
}

export default {
  buildTicketAcronym,
  getAboutPageData,
  buildAboutFallbackPayload,
  getCapabilitiesPageData,
  buildCapabilitiesFallbackPayload
};
