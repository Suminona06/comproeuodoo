import {
  getCatalogPageData,
  buildCatalogFallbackPayload,
  getProductDetailData,
  buildProductErrorData
} from '../../services/publicProductService.js';
import { resolveBaseUrl } from '../../middleware/seoMiddleware.js';
import logger from '../../utils/logger.js';

function buildContext(req, res) {
  return {
    currentLang: res.locals?.currentLang,
    settings: res.locals?.settings,
    t: res.locals?.t,
    baseUrl: resolveBaseUrl(req)
  };
}

function isFragmentRequest(req) {
  return Boolean(
    req.query?.format === 'fragment' ||
    req.xhr ||
    req.headers?.['x-requested-with'] === 'XMLHttpRequest'
  );
}

function applyCatalogNoIndex(res, noindex) {
  if (noindex && res.locals?.seo) {
    res.locals.seo.robots = 'noindex, follow';
  }
}

function applyDetailSeo(res, cleanMetaDesc) {
  if (cleanMetaDesc && res.locals?.seo) {
    res.locals.seo.description = cleanMetaDesc;
    res.locals.seo.ogDescription = cleanMetaDesc;
  }
}

function sendFragmentResponse(req, res, payload) {
  for (const [header, value] of Object.entries(payload.fragmentHeaders)) {
    res.set(header, value);
  }
  const wantsJson = Boolean(req.headers?.accept?.includes('application/json'));
  if (!wantsJson) {
    return res.render('public/partials/product-card-fragment', payload.fragmentData);
  }
  return res.app.render('public/partials/product-card-fragment', payload.fragmentData, (err, html) => {
    if (err) {
      logger.error('Error rendering product card fragment JSON:', err);
      return res.status(500).json({ error: 'Failed to render fragment' });
    }
    return res.json({ html, ...payload.jsonMeta });
  });
}

export const productController = {
  async index(req, res) {
    const context = buildContext(req, res);
    const isFragment = isFragmentRequest(req);
    try {
      const payload = await getCatalogPageData(req.query, context);
      applyCatalogNoIndex(res, payload.noindex);
      if (isFragment) return sendFragmentResponse(req, res, payload);
      return res.render('public/products', payload.viewData);
    } catch (err) {
      logger.error('Public productController.index error:', { message: err.message, stack: err.stack });
      if (isFragment) return res.status(500).send('');
      return res.status(500).render('public/products', buildCatalogFallbackPayload(context));
    }
  },

  async detail(req, res) {
    const context = buildContext(req, res);
    try {
      const result = await getProductDetailData(req.params.slug, context);
      if (result.status === 'not_found') {
        return res.status(404).render('public/404', result.notFoundData);
      }
      applyDetailSeo(res, result.cleanMetaDesc);
      return res.render('public/product-detail', result.viewData);
    } catch (err) {
      logger.error('Public productController.detail error:', { message: err.message, stack: err.stack });
      return res.status(500).render('public/404', buildProductErrorData(context));
    }
  }
};

export default productController;
