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

function extractSortYear(label) {
  const match = /\b(\d{4})\b/.exec(String(label || ''));
  return match ? Number(match[1]) : Infinity;
}

function toYearKey(label) {
  const slug = String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'era';
}

function pickLocalizedField(item, enKey, idKey, lang) {
  if (lang === 'en') return String(item?.[enKey] || item?.[idKey] || '').trim();
  return String(item?.[idKey] || '').trim();
}

function buildMilestone(item, lang) {
  return {
    id: Number(item?.id) || 0,
    title: pickLocalizedField(item, 'title_en', 'title_id', lang),
    description: pickLocalizedField(item, 'description_en', 'description_id', lang),
    sortOrder: Number(item?.sort_order) || 0
  };
}

function compareMilestonesAsc(a, b) {
  return a.sortOrder - b.sortOrder || a.id - b.id;
}

function compareGroupsAsc(a, b) {
  if (a.sortYear !== b.sortYear) return a.sortYear - b.sortYear;
  return a.firstSortOrder - b.firstSortOrder || a.firstId - b.firstId;
}

export function groupTimelineByYear(timelineItems = [], lang = 'id', defaultDir = 'asc') {
  if (!Array.isArray(timelineItems) || timelineItems.length === 0) return [];
  const groupsMap = new Map();
  for (const item of timelineItems) {
    const yearLabel = pickLocalizedField(item, 'year_label_en', 'year_label_id', lang);
    const milestone = buildMilestone(item, lang);
    const existing = groupsMap.get(yearLabel);
    if (existing) {
      existing.milestones.push(milestone);
      existing.firstSortOrder = Math.min(existing.firstSortOrder, milestone.sortOrder);
      existing.firstId = Math.min(existing.firstId, milestone.id);
    } else {
      groupsMap.set(yearLabel, {
        yearKey: toYearKey(yearLabel),
        yearLabel,
        sortYear: extractSortYear(yearLabel),
        firstSortOrder: milestone.sortOrder,
        firstId: milestone.id,
        count: 0,
        milestones: [milestone]
      });
    }
  }
  const isDesc = defaultDir === 'desc';
  const groups = Array.from(groupsMap.values()).sort((a, b) => (
    isDesc ? compareGroupsAsc(b, a) : compareGroupsAsc(a, b)
  ));
  return groups.map(({ firstId: _firstId, ...group }) => {
    const sorted = group.milestones.slice().sort((a, b) => (
      isDesc ? compareMilestonesAsc(b, a) : compareMilestonesAsc(a, b)
    ));
    return { ...group, count: sorted.length, milestones: sorted };
  });
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
  const lang = context.currentLang || context.lang || 'id';
  return {
    title,
    path: '/about',
    ticketAcronym: buildTicketAcronym(bundle.about),
    timelineGroups: groupTimelineByYear(bundle.timeline, lang, 'asc'),
    groupTimelineByYear,
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
    timelineGroups: [],
    groupTimelineByYear,
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
  groupTimelineByYear,
  getAboutPageData,
  buildAboutFallbackPayload,
  getCapabilitiesPageData,
  buildCapabilitiesFallbackPayload
};
