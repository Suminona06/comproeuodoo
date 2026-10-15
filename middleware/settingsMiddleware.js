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

  // Normalize social media keys and visibility (Opsi 4B)
  const linkedinUrl = settings.social_linkedin_url || settings.linkedin_url || settings.social_linkedin || '';
  const instagramUrl = settings.social_instagram_url || settings.instagram_url || settings.social_instagram || '';
  const facebookUrl = settings.social_facebook_url || settings.facebook_url || settings.social_facebook || '';
  const youtubeUrl = settings.social_youtube_url || settings.youtube_url || settings.social_youtube || '';

  settings.social_linkedin_url = linkedinUrl;
  settings.social_instagram_url = instagramUrl;
  settings.social_facebook_url = facebookUrl;
  settings.social_youtube_url = youtubeUrl;

  // Backward-compatibility aliases
  settings.linkedin_url = linkedinUrl;
  settings.instagram_url = instagramUrl;
  settings.facebook_url = facebookUrl;
  settings.youtube_url = youtubeUrl;
  settings.social_linkedin = linkedinUrl;
  settings.social_instagram = instagramUrl;
  settings.social_facebook = facebookUrl;
  settings.social_youtube = youtubeUrl;

  // Social media visibility toggles (default to '1' if unset)
  settings.social_linkedin_visible = settings.social_linkedin_visible !== undefined ? String(settings.social_linkedin_visible) : '1';
  settings.social_instagram_visible = settings.social_instagram_visible !== undefined ? String(settings.social_instagram_visible) : '1';
  settings.social_facebook_visible = settings.social_facebook_visible !== undefined ? String(settings.social_facebook_visible) : '1';
  settings.social_youtube_visible = settings.social_youtube_visible !== undefined ? String(settings.social_youtube_visible) : '1';

  // Default corporate identity, dual location and contact fallbacks
  settings.company_name = settings.company_name || 'PT. EUODOO';
  settings.office_name_id = settings.office_name_id || 'Kantor Pusat (Jakarta)';
  settings.office_name_en = settings.office_name_en || 'Head Office (Jakarta)';
  settings.office_address = settings.office_address || settings.about_office_address || 'Karindra Building Jl. Palmerah Selatan 30 A Suite 02 - 07, Jakarta Pusat 10270';
  settings.office_phone = settings.office_phone || settings.company_phone || settings.about_office_phone || '(021) 53668626';
  settings.company_phone = settings.office_phone;
  settings.office_fax = settings.office_fax || '+6221-53668648';
  settings.company_email = settings.company_email || 'info@euodoo.com';

  settings.factory_name_id = settings.factory_name_id || 'Pabrik Manufaktur (Bandung)';
  settings.factory_name_en = settings.factory_name_en || 'Manufacturing Plant (Bandung)';
  settings.factory_address = settings.factory_address || settings.about_factory_address || 'Kawasan Industri Cigondewah, Jl. Cigondewah Kaler No. 88, Kota Bandung, Jawa Barat 40214';
  settings.factory_phone = settings.factory_phone || '(022) 6012519';
  settings.factory_working_hours_id = settings.factory_working_hours_id || settings.contact_working_hours_id || 'Senin - Jumat: 08.00 - 17.00 WIB | Sabtu: 08.00 - 13.00 WIB';
  settings.factory_working_hours_en = settings.factory_working_hours_en || settings.contact_working_hours_en || 'Monday - Friday: 08:00 - 17:00 WIB | Saturday: 08:00 - 13:00 WIB';

  // Aliases for contact page and legacy compatibility
  settings.contact_phone = settings.factory_phone || settings.company_phone;
  settings.contact_email = settings.company_email;
  settings.contact_address_id = settings.contact_address_id || settings.factory_address;
  settings.contact_address_en = settings.contact_address_en || settings.factory_address;
  settings.contact_working_hours_id = settings.factory_working_hours_id;
  settings.contact_working_hours_en = settings.factory_working_hours_en;

  // Google Maps embed normalization
  settings.google_maps_embed = settings.google_maps_embed || settings.contact_maps_embed_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126748.56347862248!2d107.5731168!3d-6.9034443!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6398252477f%3A0x146a1f93d3e215ac!2sBandung%2C%20Bandung%20City%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid';
  settings.contact_maps_embed_url = settings.google_maps_embed;

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
