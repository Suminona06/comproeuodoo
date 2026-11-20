import postModel from '../models/postModel.js';
import postCategoryModel from '../models/postCategoryModel.js';
import pageHeroBannerModel from '../models/pageHeroBannerModel.js';
import slugRedirectModel from '../models/slugRedirectModel.js';

export const PAGE_SIZE = 9;
export const HEADLINE_LIMIT = 5;
export const RELATED_LIMIT = 3;
export const RELATED_FETCH_LIMIT = 10;
export const ALLOWED_POST_TYPES = ['berita', 'pers', 'blog'];
const DEFAULT_COMPANY_NAME = 'PT Euodoo Plastic';

function translate(t, key, fallback) {
  return typeof t === 'function' ? t(key) : (fallback || key);
}

function resolveCompanyName(settings) {
  return settings?.company_name || DEFAULT_COMPANY_NAME;
}

export function parseNewsQuery(rawQuery = {}) {
  const page = Math.max(1, parseInt(rawQuery.page, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const type = ALLOWED_POST_TYPES.includes(rawQuery.type) ? rawQuery.type : 'all';
  const categorySlug = rawQuery.category ? String(rawQuery.category).trim() : null;
  const search = rawQuery.search ? String(rawQuery.search).trim() : null;
  return { page, offset, type, categorySlug, search };
}

async function resolveCategoryId(categorySlug, categoryModel) {
  if (!categorySlug) return null;
  const category = await categoryModel.findBySlug(categorySlug);
  return category ? category.id : null;
}

async function fetchNewsBundle(queryOptions, offset, page, search, deps) {
  const pModel = deps.postModel || postModel;
  const catModel = deps.postCategoryModel || postCategoryModel;
  const heroModel = deps.pageHeroBannerModel || pageHeroBannerModel;
  const shouldLoadHeadline = page === 1 && !search;

  const [posts, totalPosts, categories, headlinePosts, heroBanner] = await Promise.all([
    pModel.findAll({ ...queryOptions, limit: PAGE_SIZE, offset }),
    pModel.countAll(queryOptions),
    catModel.findAll({ type: queryOptions.type }),
    shouldLoadHeadline
      ? pModel.findAll({ status: 'published', isHeadline: true, limit: HEADLINE_LIMIT })
      : Promise.resolve([]),
    heroModel.getByPageKey('news')
  ]);

  return { posts, totalPosts, categories, headlinePosts, heroBanner };
}

function buildNewsResponses(bundle, parsed, context, totalPages) {
  const pageTitle = translate(context.t, 'news.page_title', 'Publikasi & Berita');
  const headlinePost = bundle.headlinePosts.length > 0 ? bundle.headlinePosts[0] : null;
  return {
    ajaxPayload: {
      success: true,
      posts: bundle.posts,
      categories: bundle.categories,
      currentPage: parsed.page,
      totalPages,
      totalPosts: bundle.totalPosts,
      activeType: parsed.type,
      activeCategory: parsed.categorySlug,
      search: parsed.search
    },
    viewData: {
      title: `${pageTitle} | ${resolveCompanyName(context.settings)}`,
      path: '/news',
      posts: bundle.posts,
      headlinePosts: bundle.headlinePosts,
      headlinePost,
      categories: bundle.categories,
      activeType: parsed.type,
      activeCategory: parsed.categorySlug,
      search: parsed.search,
      currentPage: parsed.page,
      totalPages,
      totalPosts: bundle.totalPosts,
      heroBanner: bundle.heroBanner
    }
  };
}

function buildNewsQueryOptions(parsed, categoryId) {
  return {
    status: 'published',
    type: parsed.type === 'all' ? null : parsed.type,
    categoryId: categoryId || undefined,
    search: parsed.search || undefined
  };
}

export async function getNewsListData(rawQuery = {}, context = {}, deps = {}) {
  const parsed = parseNewsQuery(rawQuery);
  const catModel = deps.postCategoryModel || postCategoryModel;
  const categoryId = await resolveCategoryId(parsed.categorySlug, catModel);
  const queryOptions = buildNewsQueryOptions(parsed, categoryId);

  const bundle = await fetchNewsBundle(queryOptions, parsed.offset, parsed.page, parsed.search, deps);
  const totalPages = Math.ceil(bundle.totalPosts / PAGE_SIZE) || 1;
  return buildNewsResponses(bundle, parsed, context, totalPages);
}

export function buildNewsFallbackPayload(context = {}) {
  const pageTitle = translate(context.t, 'news.page_title', 'Publikasi & Berita');
  return {
    title: `${pageTitle} | ${resolveCompanyName(context.settings)}`,
    path: '/news',
    posts: [],
    headlinePosts: [],
    headlinePost: null,
    categories: [],
    activeType: 'all',
    activeCategory: null,
    search: null,
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    heroBanner: null
  };
}

export async function fetchRelatedPosts(post, deps = {}) {
  const pModel = deps.postModel || postModel;
  const sameType = await pModel.findAll({ status: 'published', type: post.type, limit: RELATED_FETCH_LIMIT });
  const related = sameType.filter((p) => p.id !== post.id).slice(0, RELATED_LIMIT);
  if (related.length >= RELATED_LIMIT) return related;

  const otherRecent = await pModel.findAll({ status: 'published', limit: RELATED_FETCH_LIMIT });
  const existingIds = new Set([post.id, ...related.map((p) => p.id)]);
  const fillers = otherRecent.filter((p) => !existingIds.has(p.id));
  return related.concat(fillers).slice(0, RELATED_LIMIT);
}

function resolveDetailTitle(post, context = {}) {
  const lang = context.currentLang || 'id';
  const postTitle = lang === 'en' ? (post.title_en || post.title_id) : post.title_id;
  return `${postTitle} | ${resolveCompanyName(context.settings)}`;
}

async function resolveMissingPostResult(slug, context, deps) {
  const redirectModel = deps.slugRedirectModel || slugRedirectModel;
  const redirect = await redirectModel.findRedirect('post', slug);
  if (redirect && redirect.new_slug) {
    return { status: 'redirect', redirectUrl: `/news/${redirect.new_slug}`, slug };
  }
  const notFoundTitle = translate(context.t, 'news.not_found_title', 'Artikel Tidak Ditemukan');
  return {
    status: 'not_found',
    notFoundData: {
      title: `${notFoundTitle} | ${resolveCompanyName(context.settings)}`,
      path: '/news'
    }
  };
}

export async function getPostDetailData(slug, context = {}, deps = {}) {
  const pModel = deps.postModel || postModel;
  const post = await pModel.findBySlug(slug);
  if (!post || post.status !== 'published') {
    return await resolveMissingPostResult(slug, context, deps);
  }

  const recentPosts = await fetchRelatedPosts(post, deps);
  return {
    status: 'ok',
    viewData: {
      title: resolveDetailTitle(post, context),
      path: '/news',
      headerSolid: true,
      useSweetAlert: true,
      post,
      recentPosts
    }
  };
}

export function buildPostErrorData(context = {}) {
  const errTitle = translate(context.t, 'common.error_title', 'Error');
  return {
    title: `${errTitle} | ${resolveCompanyName(context.settings)}`,
    path: '/news'
  };
}

export default {
  PAGE_SIZE,
  HEADLINE_LIMIT,
  RELATED_LIMIT,
  RELATED_FETCH_LIMIT,
  ALLOWED_POST_TYPES,
  parseNewsQuery,
  getNewsListData,
  buildNewsFallbackPayload,
  fetchRelatedPosts,
  getPostDetailData,
  buildPostErrorData
};
