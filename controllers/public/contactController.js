import inquiryModel from '../../models/inquiryModel.js';
import productModel from '../../models/productModel.js';
import pageHeroBannerModel from '../../models/pageHeroBannerModel.js';
import { verifyTurnstileToken } from '../../utils/turnstileVerifier.js';
import mailer from '../../config/mailer.js';
import logger from '../../utils/logger.js';

const MAX_TEXT_LENGTH = 100;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 3000;
const DEFAULT_COMPANY_NAME = 'PT Euodoo';
const DEFAULT_TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
const VALID_INQUIRY_TYPES = ['inquiry', 'partnership', 'general'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9\s+\-()]{7,30}$/;

const ERROR_QUERY_KEYS = {
  rate_limited: 'contact.err_rate_limited',
  validation: 'contact.err_validation',
  turnstile: 'contact.err_turnstile_query',
  '1': 'contact.error_alert'
};

function translate(res, key) {
  return typeof res.locals?.t === 'function' ? res.locals.t(key) : key;
}

function isAjaxRequest(req) {
  return Boolean(req.xhr || req.headers.accept?.includes('application/json'));
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

function trimNullable(value) {
  const str = value ? String(value).trim() : '';
  return str || null;
}

function normalizeRfqPayload(body = {}) {
  return {
    hpWebsite: body.hp_website,
    name: trimNullable(body.name) || '',
    company: trimNullable(body.company),
    email: (trimNullable(body.email) || '').toLowerCase(),
    phone: trimNullable(body.phone) || '',
    productId: body.product_id,
    quantity: trimNullable(body.quantity),
    message: trimNullable(body.message) || '',
    type: VALID_INQUIRY_TYPES.includes(body.type) ? body.type : 'inquiry',
    turnstileToken: body['cf-turnstile-response']
  };
}

function validateRfqPayload(payload) {
  const required = ['name', 'email', 'phone', 'message'];
  if (required.some((field) => !payload[field])) {
    return 'contact.err_required_fields';
  }
  const lengthChecks = [
    { value: payload.name, key: 'contact.err_name_max' },
    { value: payload.company, key: 'contact.err_company_max' },
    { value: payload.email, key: 'contact.err_email_max' },
    { value: payload.quantity, key: 'contact.err_quantity_max' }
  ];
  const exceeded = lengthChecks.find((item) => item.value && item.value.length > MAX_TEXT_LENGTH);
  if (exceeded) return exceeded.key;

  if (payload.message.length < MIN_MESSAGE_LENGTH || payload.message.length > MAX_MESSAGE_LENGTH) {
    return 'contact.err_message_length';
  }
  if (!EMAIL_REGEX.test(payload.email)) return 'contact.err_email_format';
  if (!PHONE_REGEX.test(payload.phone)) return 'contact.err_phone_format';
  return null;
}

function getLocalizedProductName(product, currentLang, defaultName) {
  if (!product) return defaultName;
  if (currentLang === 'en') {
    return product.name_en || product.name_id;
  }
  return product.name_id;
}

async function resolveProductSelection(rawProductId, res) {
  const defaultName = translate(res, 'contact.default_product_name');
  const trimmed = trimNullable(rawProductId);
  if (!trimmed) {
    return { valid: true, productId: null, productName: defaultName };
  }
  if (!/^\d+$/.test(trimmed) || parseInt(trimmed, 10) <= 0) {
    return { valid: false, errorKey: 'contact.err_product_invalid' };
  }
  const parsedId = parseInt(trimmed, 10);
  const product = await productModel.findById(parsedId);
  const productName = getLocalizedProductName(product, res.locals.currentLang, defaultName);
  return { valid: true, productId: parsedId, productName };
}

async function persistAndNotifyInquiry(payload, productInfo, ipAddress) {
  const inquiryId = await inquiryModel.create({
    type: payload.type,
    name: payload.name,
    company: payload.company,
    email: payload.email,
    phone: payload.phone,
    product_id: productInfo.productId,
    quantity: payload.quantity,
    message: payload.message,
    source: 'contact_form',
    status: 'baru',
    ip_address: ipAddress
  });

  logger.info('New B2B Inquiry recorded:', { id: inquiryId, company: payload.company, email: payload.email });

  mailer.sendLeadNotification({
    name: payload.name,
    company_name: payload.company,
    email: payload.email,
    phone: payload.phone,
    product_name: productInfo.productName,
    estimated_quantity: payload.quantity,
    message: payload.message
  }).catch((err) => {
    logger.warn('Background mailer error:', { message: err.message });
  });
}

function findSelectedProduct(products, productParam) {
  if (!productParam) return null;
  const target = String(productParam);
  return products.find((p) => String(p.id) === target || p.slug === target) || null;
}

function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
}

export const contactController = {
  async index(req, res) {
    const companyName = res.locals.settings?.company_name || DEFAULT_COMPANY_NAME;
    const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY || DEFAULT_TURNSTILE_SITE_KEY;
    try {
      const { product, success, error } = req.query;
      const [products, heroBanner] = await Promise.all([
        productModel.findAll({ isActive: true }),
        pageHeroBannerModel.getByPageKey('contact')
      ]);
      const errorKey = ERROR_QUERY_KEYS[error] || null;
      const errorMsg = errorKey ? translate(res, errorKey) : null;

      res.render('public/contact', {
        title: `${translate(res, 'contact.page_title')} | ${companyName}`,
        path: '/contact',
        products,
        selectedProduct: findSelectedProduct(products, product),
        success: success === '1',
        error: Boolean(errorMsg),
        errorMsg,
        heroBanner,
        turnstileSiteKey
      });
    } catch (err) {
      logger.error('Public contactController.index error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/contact', {
        title: `${translate(res, 'contact.page_title')} | ${companyName}`,
        path: '/contact',
        products: [],
        selectedProduct: null,
        success: false,
        error: true,
        errorMsg: translate(res, 'contact.err_system_load'),
        heroBanner: null,
        turnstileSiteKey
      });
    }
  },

  async submit(req, res) {
    const isAjax = isAjaxRequest(req);
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

      const productInfo = await resolveProductSelection(payload.productId, res);
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
