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

  res.locals.settings = settings;
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
