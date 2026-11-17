import {
  resolveHomePageTitle,
  getHomePageData,
  buildHomeFallbackData
} from '../../services/homeService.js';
import { formatInlineText } from '../../utils/textFormatter.js';
import logger from '../../utils/logger.js';

function buildHomeRenderPayload(data, title) {
  // shortcut: keep legacy raw keys until T-337 migrates views/public/index.ejs to homeView
  return {
    title,
    path: '/',
    homeView: data.homeView,
    ...data.raw,
    formatInlineText
  };
}

export const homeController = {
  async index(req, res) {
    const context = {
      currentLang: res.locals.currentLang,
      settings: res.locals.settings,
      t: res.locals.t
    };

    try {
      const data = await getHomePageData(context);
      const title = resolveHomePageTitle(context.settings, context.t);
      res.render('public/index', buildHomeRenderPayload(data, title));
    } catch (err) {
      logger.error('Public homeController error:', { message: err.message, stack: err.stack });
      const fallbackData = buildHomeFallbackData(context);
      const fallbackTitle = resolveHomePageTitle(context.settings, context.t, true);
      res.status(500).render('public/index', buildHomeRenderPayload(fallbackData, fallbackTitle));
    }
  }
};

export default homeController;
