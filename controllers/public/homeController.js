import {
  resolveHomePageTitle,
  getHomePageData,
  buildHomeFallbackData
} from '../../services/homeService.js';
import logger from '../../utils/logger.js';

export const homeController = {
  async index(req, res) {
    const context = {
      currentLang: res.locals.currentLang,
      settings: res.locals.settings,
      t: res.locals.t
    };

    try {
      const homeView = await getHomePageData(context);
      const title = resolveHomePageTitle(context.settings, context.t);
      res.render('public/index', { title, path: '/', homeView });
    } catch (err) {
      logger.error('Public homeController error:', { message: err.message, stack: err.stack });
      const homeView = buildHomeFallbackData(context);
      const title = resolveHomePageTitle(context.settings, context.t, true);
      res.status(500).render('public/index', { title, path: '/', homeView });
    }
  }
};

export default homeController;
