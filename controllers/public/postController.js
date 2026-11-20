import {
  getNewsListData,
  buildNewsFallbackPayload,
  getPostDetailData,
  buildPostErrorData
} from '../../services/publicPostService.js';
import logger from '../../utils/logger.js';

function buildContext(res) {
  return {
    currentLang: res.locals?.currentLang,
    settings: res.locals?.settings,
    t: res.locals?.t
  };
}

function isAjaxRequest(req) {
  return Boolean(req.xhr || req.headers?.accept?.includes('application/json') || req.query?.ajax === '1');
}

export const postController = {
  async index(req, res) {
    const context = buildContext(res);
    const isAjax = isAjaxRequest(req);
    try {
      const { ajaxPayload, viewData } = await getNewsListData(req.query, context);
      if (isAjax) return res.json(ajaxPayload);
      return res.render('public/news', viewData);
    } catch (err) {
      logger.error('Public postController.index error:', { message: err.message, stack: err.stack });
      if (isAjax) return res.status(500).json({ success: false, message: 'Server error' });
      return res.status(500).render('public/news', buildNewsFallbackPayload(context));
    }
  },

  async detail(req, res) {
    const context = buildContext(res);
    try {
      const result = await getPostDetailData(req.params.slug, context);
      if (result.status === 'redirect') {
        logger.info(`Redirecting 301 from /news/${result.slug} to ${result.redirectUrl}`);
        return res.redirect(301, result.redirectUrl);
      }
      if (result.status === 'not_found') {
        return res.status(404).render('public/404', result.notFoundData);
      }
      return res.render('public/news-detail', result.viewData);
    } catch (err) {
      logger.error('Public postController.detail error:', { message: err.message, stack: err.stack });
      return res.status(500).render('public/404', buildPostErrorData(context));
    }
  }
};

export default postController;
