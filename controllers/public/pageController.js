import {
  getAboutPageData,
  buildAboutFallbackPayload,
  getCapabilitiesPageData,
  buildCapabilitiesFallbackPayload
} from '../../services/publicPageService.js';
import logger from '../../utils/logger.js';

function buildContext(res) {
  return {
    settings: res.locals?.settings,
    t: res.locals?.t
  };
}

export const pageController = {
  async about(req, res) {
    const context = buildContext(res);
    try {
      const viewData = await getAboutPageData(context);
      return res.render('public/about', viewData);
    } catch (err) {
      logger.error('Public pageController.about error:', { message: err.message, stack: err.stack });
      return res.status(500).render('public/about', buildAboutFallbackPayload(context));
    }
  },

  async capabilities(req, res) {
    const context = buildContext(res);
    try {
      const viewData = await getCapabilitiesPageData(context);
      return res.render('public/capabilities', viewData);
    } catch (err) {
      logger.error('Public pageController.capabilities error:', { message: err.message, stack: err.stack });
      return res.status(500).render('public/capabilities', buildCapabilitiesFallbackPayload(context));
    }
  }
};

export default pageController;
