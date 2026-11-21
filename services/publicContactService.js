import inquiryModel from '../models/inquiryModel.js';
import productModel from '../models/productModel.js';
import pageHeroBannerModel from '../models/pageHeroBannerModel.js';
import mailer from '../config/mailer.js';
import logger from '../utils/logger.js';
import {
  normalizeVariantGroups,
  matchSelectedVariantsWhitelist,
  formatSelectedVariantsText
} from './productVariantService.js';

export const MAX_TEXT_LENGTH = 100;
export const MIN_MESSAGE_LENGTH = 10;
export const MAX_MESSAGE_LENGTH = 3000;
export const DEFAULT_COMPANY_NAME = 'PT Euodoo Plastic';
export const DEFAULT_TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
export const VALID_INQUIRY_TYPES = ['inquiry', 'partnership', 'general'];
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[0-9\s+\-()]{7,30}$/;

const ERROR_QUERY_KEYS = {
  rate_limited: 'contact.err_rate_limited',
  validation: 'contact.err_validation',
  turnstile: 'contact.err_turnstile_query',
  '1': 'contact.error_alert'
};

function translate(t, key) {
  return typeof t === 'function' ? t(key) : key;
}

function resolveCompanyName(settings) {
  return settings?.company_name || DEFAULT_COMPANY_NAME;
}

function resolveTurnstileSiteKey(siteKey) {
  return siteKey || process.env.TURNSTILE_SITE_KEY || DEFAULT_TURNSTILE_SITE_KEY;
}

function trimNullable(value) {
  const str = value ? String(value).trim() : '';
  return str || null;
}

export function findSelectedProduct(products, productParam) {
  if (!productParam) return null;
  const target = String(productParam);
  return products.find((p) => String(p.id) === target || p.slug === target) || null;
}

function buildProductVariantsMap(products = []) {
  const map = {};
  for (const prod of products) {
    const groups = normalizeVariantGroups(prod.variants);
    prod.variant_groups = groups;
    if (groups.length > 0) map[prod.id] = groups;
  }
  return map;
}

function resolveInitialSelectedVariants(selectedProduct, rawVariants) {
  if (!selectedProduct) return [];
  return matchSelectedVariantsWhitelist(rawVariants, selectedProduct.variant_groups);
}

export async function getContactPageData(rawQuery = {}, context = {}, deps = {}) {
  const pModel = deps.productModel || productModel;
  const heroModel = deps.pageHeroBannerModel || pageHeroBannerModel;
  const { product, variants, success, error } = rawQuery;

  const [products, heroBanner] = await Promise.all([
    pModel.findAll({ isActive: true }),
    heroModel.getByPageKey('contact')
  ]);

  const productVariantsMap = buildProductVariantsMap(products);
  const selectedProduct = findSelectedProduct(products, product);
  const selectedVariants = resolveInitialSelectedVariants(selectedProduct, variants);

  const errorKey = ERROR_QUERY_KEYS[error] || null;
  const errorMsg = errorKey ? translate(context.t, errorKey) : null;

  return {
    title: `${translate(context.t, 'contact.page_title')} | ${resolveCompanyName(context.settings)}`,
    path: '/contact',
    products,
    selectedProduct,
    selectedVariants,
    productVariantsMap,
    success: success === '1',
    error: Boolean(errorMsg),
    errorMsg,
    heroBanner,
    turnstileSiteKey: resolveTurnstileSiteKey(context.turnstileSiteKey)
  };
}

export function buildContactFallbackPayload(context = {}) {
  return {
    title: `${translate(context.t, 'contact.page_title')} | ${resolveCompanyName(context.settings)}`,
    path: '/contact',
    products: [],
    selectedProduct: null,
    selectedVariants: [],
    productVariantsMap: {},
    success: false,
    error: true,
    errorMsg: translate(context.t, 'contact.err_system_load'),
    heroBanner: null,
    turnstileSiteKey: resolveTurnstileSiteKey(context.turnstileSiteKey)
  };
}

export function normalizeRfqPayload(body = {}) {
  return {
    hpWebsite: body.hp_website,
    name: trimNullable(body.name) || '',
    company: trimNullable(body.company),
    email: (trimNullable(body.email) || '').toLowerCase(),
    phone: trimNullable(body.phone) || '',
    productId: body.product_id,
    selectedVariantsRaw: body.selected_variants || '',
    quantity: trimNullable(body.quantity),
    message: trimNullable(body.message) || '',
    type: VALID_INQUIRY_TYPES.includes(body.type) ? body.type : 'inquiry',
    turnstileToken: body['cf-turnstile-response']
  };
}

export function validateRfqPayload(payload) {
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
  return currentLang === 'en' ? (product.name_en || product.name_id) : product.name_id;
}

function buildValidProductSelection(parsedId, product, context, defaultName) {
  const productName = getLocalizedProductName(product, context.currentLang, defaultName);
  const selection = { valid: true, productId: parsedId, productName };
  if (product.variants !== undefined) selection.productVariants = product.variants;
  return selection;
}

export async function resolveProductSelection(rawProductId, context = {}, deps = {}) {
  const pModel = deps.productModel || productModel;
  const defaultName = translate(context.t, 'contact.default_product_name');
  const trimmed = trimNullable(rawProductId);
  if (!trimmed) {
    return { valid: true, productId: null, productName: defaultName };
  }
  if (!/^\d+$/.test(trimmed) || parseInt(trimmed, 10) <= 0) {
    return { valid: false, errorKey: 'contact.err_product_invalid' };
  }
  const parsedId = parseInt(trimmed, 10);
  const product = await pModel.findById(parsedId);
  if (!product) {
    return { valid: false, errorKey: 'contact.err_product_invalid' };
  }
  return buildValidProductSelection(parsedId, product, context, defaultName);
}

export async function persistAndNotifyInquiry(payload, productInfo, ipAddress, deps = {}) {
  const inqModel = deps.inquiryModel || inquiryModel;
  const mailClient = deps.mailer || mailer;
  const log = deps.logger || logger;
  const validatedVariants = productInfo.productId
    ? matchSelectedVariantsWhitelist(payload.selectedVariantsRaw, productInfo.productVariants)
    : [];
  const variantsText = formatSelectedVariantsText(validatedVariants, 'id');

  const inquiryId = await inqModel.create({
    type: payload.type,
    name: payload.name,
    company: payload.company,
    email: payload.email,
    phone: payload.phone,
    product_id: productInfo.productId,
    selected_variants: validatedVariants.length > 0 ? validatedVariants : null,
    quantity: payload.quantity,
    message: payload.message,
    source: 'contact_form',
    status: 'baru',
    ip_address: ipAddress
  });

  log.info('New B2B Inquiry recorded:', { id: inquiryId, company: payload.company, email: payload.email });

  // Fire-and-forget notification so SMTP latency never blocks the HTTP response.
  mailClient.sendLeadNotification({
    name: payload.name,
    company_name: payload.company,
    email: payload.email,
    phone: payload.phone,
    product_name: productInfo.productName,
    selected_variants_text: variantsText || null,
    estimated_quantity: payload.quantity,
    message: payload.message
  }).catch((err) => {
    log.warn('Background mailer error:', { message: err.message });
  });

  return inquiryId;
}

export default {
  MAX_TEXT_LENGTH,
  MIN_MESSAGE_LENGTH,
  MAX_MESSAGE_LENGTH,
  DEFAULT_COMPANY_NAME,
  DEFAULT_TURNSTILE_SITE_KEY,
  VALID_INQUIRY_TYPES,
  EMAIL_REGEX,
  PHONE_REGEX,
  findSelectedProduct,
  getContactPageData,
  buildContactFallbackPayload,
  normalizeRfqPayload,
  validateRfqPayload,
  resolveProductSelection,
  persistAndNotifyInquiry
};
