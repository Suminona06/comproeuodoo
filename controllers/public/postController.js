import postModel from '../../models/postModel.js';
import postCategoryModel from '../../models/postCategoryModel.js';
import logger from '../../utils/logger.js';

export const postController = {
  async index(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = 9;
      const offset = (page - 1) * limit;
      const type = ['berita', 'pers', 'blog'].includes(req.query.type) ? req.query.type : 'all';
      const categorySlug = req.query.category ? String(req.query.category).trim() : null;
      const search = req.query.search ? String(req.query.search).trim() : null;

      let categoryId = null;
      if (categorySlug) {
        const activeCategoryObj = await postCategoryModel.findBySlug(categorySlug);
        if (activeCategoryObj) {
          categoryId = activeCategoryObj.id;
        }
      }

      const queryOptions = {
        status: 'published',
        type: type !== 'all' ? type : null,
        categoryId: categoryId || undefined,
        search: search || undefined
      };

      const [posts, totalPosts, categories, headlinePosts] = await Promise.all([
        postModel.findAll({
          ...queryOptions,
          limit,
          offset
        }),
        postModel.countAll(queryOptions),
        postCategoryModel.findAll({ type: type !== 'all' ? type : null }),
        (page === 1 && !search && !categorySlug)
          ? postModel.findAll({ status: 'published', isHeadline: true, type: type !== 'all' ? type : null, limit: 1 })
          : Promise.resolve([])
      ]);

      const headlinePost = headlinePosts.length > 0 ? headlinePosts[0] : null;
      const totalPages = Math.ceil(totalPosts / limit) || 1;

      const title = res.locals.t('news.page_title') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');

      res.render('public/news', {
        title,
        path: '/news',
        posts,
        headlinePost,
        categories,
        activeType: type,
        activeCategory: categorySlug,
        search,
        currentPage: page,
        totalPages,
        totalPosts
      });
    } catch (err) {
      logger.error('Public postController.index error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/news', {
        title: 'Publikasi & Berita | PT Euodoo',
        path: '/news',
        posts: [],
        headlinePost: null,
        categories: [],
        activeType: 'all',
        activeCategory: null,
        search: null,
        currentPage: 1,
        totalPages: 1,
        totalPosts: 0
      });
    }
  },

  async detail(req, res) {
    try {
      const { slug } = req.params;
      const post = await postModel.findBySlug(slug);

      if (!post || post.status !== 'published') {
        return res.status(404).render('public/404', {
          title: 'Artikel Tidak Ditemukan | PT Euodoo',
          path: '/news'
        });
      }

      const allRecent = await postModel.findAll({ status: 'published', type: post.type, limit: 4 });
      const recentPosts = allRecent.filter(p => p.id !== post.id).slice(0, 3);

      const currentLang = res.locals.currentLang || 'id';
      const postTitle = currentLang === 'en' ? (post.title_en || post.title_id) : post.title_id;
      const title = postTitle + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');

      res.render('public/news-detail', {
        title,
        path: '/news',
        post,
        recentPosts
      });
    } catch (err) {
      logger.error('Public postController.detail error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/404', {
        title: 'Error | PT Euodoo',
        path: '/news'
      });
    }
  }
};

export default postController;
