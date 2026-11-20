import {
  getContactPageData,
  buildContactFallbackPayload,
  normalizeRfqPayload,
  validateRfqPayload,
  resolveProductSelection,
  persistAndNotifyInquiry
} from '../../services/publicContactService.js';
import { verifyTurnstileToken } from '../../utils/turnstileVerifier.js';
import logger from '../../utils/logger.js';

function buildContext(res) {
  return {
    currentLang: res.locals?.currentLang,
    settings: res.locals?.settings,
    t: res.locals?.t
  };
}

function translate(res, key) {
  return typeof res.locals?.t === 'function' ? res.locals.t(key) : key;
}

function isAjaxRequest(req) {
  return Boolean(req.xhr || req.headers?.accept?.includes('application/json'));
}

function sendSubmissionError(res, isAjax, statusCode, redirectCode, messageKey) {
  if (isAjax) {
    return res.status(statusCode).json({
      success: false,
      message: translate(res, messageKey)
    });
  }
  return res.redirect(`/contact?error=${redirectCode}#form-status`);
}

function sendSubmissionSuccess(res, isAjax, messageKey) {
  if (isAjax) {
    return res.json({
      success: true,
      message: translate(res, messageKey)
    });
  }
  return res.redirect('/contact?success=1#form-status');
}

function getClientIp(req) {
  return req.ip || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress;
}

export const contactController = {
  async index(req, res) {
    const context = buildContext(res);
    try {
      const viewData = await getContactPageData(req.query, context);
      return res.render('public/contact', viewData);
    } catch (err) {
      logger.error('Public contactController.index error:', { message: err.message, stack: err.stack });
      return res.status(500).render('public/contact', buildContactFallbackPayload(context));
    }
  },

  async submit(req, res) {
    const isAjax = isAjaxRequest(req);
    const context = buildContext(res);
    try {
      const payload = normalizeRfqPayload(req.body);
      if (payload.hpWebsite) {
        logger.warn('Spam submission detected and dropped via honeypot.');
        return sendSubmissionSuccess(res, isAjax, 'contact.honeypot_success');
      }

      const validationErrorKey = validateRfqPayload(payload);
      if (validationErrorKey) {
        return sendSubmissionError(res, isAjax, 400, 'validation', validationErrorKey);
      }

      const productInfo = await resolveProductSelection(payload.productId, context);
      if (!productInfo.valid) {
        return sendSubmissionError(res, isAjax, 400, 'validation', productInfo.errorKey);
      }

      const ipAddress = getClientIp(req);
      const turnstileResult = await verifyTurnstileToken(payload.turnstileToken, ipAddress);
      if (!turnstileResult.success) {
        logger.warn(`[Turnstile] Submission blocked for IP ${ipAddress}. Errors: ${(turnstileResult.errorCodes || []).join(', ')}`);
        return sendSubmissionError(res, isAjax, 400, 'turnstile', 'contact.err_turnstile_submit');
      }

      await persistAndNotifyInquiry(payload, productInfo, ipAddress);
      return sendSubmissionSuccess(res, isAjax, 'contact.success_alert');
    } catch (err) {
      logger.error('Public contactController.submit error:', { message: err.message, stack: err.stack });
      return sendSubmissionError(res, isAjax, 500, '1', 'contact.err_system_submit');
    }
  }
};

export default contactController;
