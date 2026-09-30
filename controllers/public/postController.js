import postModel from '../../models/postModel.js';
import logger from '../../utils/logger.js';

export const postController = {
  /**
   * Display published news & articles list
   */
  async index(req, res) {
    try {
      const posts = await postModel.findAll({ status: 'published' });
      const title = res.locals.t('news.page_title') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');

      res.render('public/news', {
        title,
        path: '/news',
        posts
      });
    } catch (err) {
      logger.error('Public postController.index error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/news', {
        title: 'Publikasi & Berita | PT Euodoo',
        path: '/news',
        posts: []
      });
    }
  },

  /**
   * Display single news article by slug
   */
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

      const allRecent = await postModel.findAll({ status: 'published', limit: 4 });
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
