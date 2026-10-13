import settingModel from '../models/settingModel.js';
import logger from '../utils/logger.js';

// In-memory cache with 30s TTL for optimal production performance
let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30 * 1000;

/**
 * Format raw WhatsApp phone number to international wa.me standard format (e.g. 6281234567890)
 * @param {string} rawNumber
 * @returns {string}
 */
export const formatWhatsAppNumber = (rawNumber) => {
  if (!rawNumber) return '';
  let cleaned = String(rawNumber).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Global Settings Middleware
 * Injects structured settings into res.locals.settings with normalized WhatsApp configuration
 */
export const settingsMiddleware = async (req, res, next) => {
  const now = Date.now();

  try {
    if (!cachedSettings || (now - lastFetchTime) > CACHE_TTL_MS) {
      cachedSettings = await settingModel.getAll();
      lastFetchTime = now;
    }
  } catch (err) {
    logger.warn(`Failed to fetch global settings: ${err.message}`);
    cachedSettings = cachedSettings || {};
  }

  // Clone settings object to prevent mutations to cache
  const settings = { ...(cachedSettings || {}) };

  // Normalize WhatsApp configurations
  const rawWaNumber = settings.whatsapp_number || '';
  const formattedWaNumber = formatWhatsAppNumber(rawWaNumber);
  const waDefaultMessage = settings.whatsapp_default_message || settings.whatsapp_message || 'Halo PT Euodoo, saya ingin berkonsultasi mengenai pemesanan kantong plastik ramah lingkungan (100% degradable).';
  const waTheme = settings.whatsapp_button_theme || 'corporate'; // 'default' | 'corporate' | 'emerald' | 'minimal'

  settings.whatsapp_formatted_number = formattedWaNumber;
  settings.whatsapp_default_message = waDefaultMessage;
  settings.whatsapp_button_theme = waTheme;
  settings.whatsapp_encoded_message = encodeURIComponent(waDefaultMessage);
  settings.whatsapp_url = formattedWaNumber
    ? `https://wa.me/${formattedWaNumber}?text=${encodeURIComponent(waDefaultMessage)}`
    : '';

  // Default address and contact fallbacks if missing
  settings.company_name = settings.company_name || 'PT. EUODOO';
  settings.office_address = settings.office_address || settings.about_office_address || 'Karindra Building Jl. Palmerah Selatan 30 A Suite 02 - 07, Jakarta Pusat 10270';
  settings.factory_address = settings.factory_address || settings.about_factory_address || 'Jl. Paralon II No. 21 Cijerah Bandung 40214 - Indonesia';
  settings.company_phone = settings.company_phone || settings.about_office_phone || '+6221-53668626';
  settings.company_email = settings.company_email || 'info@euodoo.com';

  // Structured global pre-footer CTA
  let globalCtaPages = { home: 1, about: 1, products: 1, product_detail: 1, capabilities: 1, news: 1, news_detail: 1, contact: 0, 404: 0 };
  if (settings.global_cta_pages_json) {
    try {
      const parsedPages = typeof settings.global_cta_pages_json === 'string'
        ? JSON.parse(settings.global_cta_pages_json)
        : settings.global_cta_pages_json;
      if (parsedPages && typeof parsedPages === 'object') {
        globalCtaPages = parsedPages;
      }
    } catch {
      // Retain fallback defaults
    }
  }

  settings.globalCta = {
    title_id: settings.global_cta_title_id || 'Mulai Kemitraan Manufaktur Bersama PT. EUODOO',
    title_en: settings.global_cta_title_en || 'Start Your Manufacturing Partnership with PT. EUODOO',
    subtitle_id: settings.global_cta_subtitle_id || 'Konsultasikan kebutuhan spesifikasi kantong plastik, ukuran kustom, dan volume pesanan bisnis Anda bersama tim teknis dan pemasaran kami.',
    subtitle_en: settings.global_cta_subtitle_en || 'Consult with our experienced production and engineering team to develop custom plastic bag packaging tailored to your brand, strength parameters, and delivery schedules.',
    btn1_title_id: settings.global_cta_btn1_title_id || 'Hubungi Tim Pemasaran',
    btn1_title_en: settings.global_cta_btn1_title_en || 'Contact Sales & Engineering',
    btn1_sub_id: settings.global_cta_btn1_sub_id || 'Formulir penawaran harga dan konsultasi',
    btn1_sub_en: settings.global_cta_btn1_sub_en || 'Submit RFQ form and technical inquiries',
    btn1_url: settings.global_cta_btn1_url || '/contact',
    btn2_title_id: settings.global_cta_btn2_title_id || 'Kirim Pesan WhatsApp',
    btn2_title_en: settings.global_cta_btn2_title_en || 'Direct WhatsApp Consultation',
    btn2_sub_id: settings.global_cta_btn2_sub_id || 'Respon cepat dari tim sales kami',
    btn2_sub_en: settings.global_cta_btn2_sub_en || 'Fast response from our customer support',
    btn2_url: settings.global_cta_btn2_url || settings.whatsapp_url,
    pages: globalCtaPages,
    is_active: settings.global_cta_is_active !== undefined
      ? (settings.global_cta_is_active === '1' || settings.global_cta_is_active === 1 || settings.global_cta_is_active === true)
      : true
  };

  res.locals.settings = settings;
  res.locals.globalCta = settings.globalCta;
  next();
};

/**
 * Invalidate settings in-memory cache
 */
export const clearSettingsCache = () => {
  cachedSettings = null;
  lastFetchTime = 0;
};

export default settingsMiddleware;
