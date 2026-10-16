import settingModel from '../../models/settingModel.js';
import { clearSettingsCache } from '../../middleware/settingsMiddleware.js';
import { saveSettingUpload } from '../../middleware/uploadMiddleware.js';
import logger from '../../utils/logger.js';

/**
 * Extract clean src URL from raw input or iframe HTML and validate Google Maps domain
 * @param {string} rawInput
 * @returns {string}
 */
export function parseAndValidateGoogleMapsUrl(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return '';
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  let extractedUrl = trimmed;

  if (trimmed.startsWith('<iframe') || trimmed.includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["'](https:\/\/[^"']+)["']/i);
    if (!srcMatch || !srcMatch[1]) {
      throw new Error('Kode embed iframe Google Maps tidak memiliki atribut src yang valid.');
    }
    extractedUrl = srcMatch[1];
  }

  try {
    const parsed = new URL(extractedUrl);
    if (parsed.protocol !== 'https:') {
      throw new Error('URL Google Maps wajib menggunakan protokol aman HTTPS.');
    }

    const hostname = parsed.hostname.toLowerCase();
    const isGoogleDomain = (
      hostname === 'www.google.com' ||
      hostname === 'google.com' ||
      hostname === 'maps.google.com'
    );

    const isMapsPath = parsed.pathname.startsWith('/maps/embed') || parsed.pathname.startsWith('/maps');

    if (!isGoogleDomain || !isMapsPath) {
      throw new Error('URL wajib berasal dari domain sematan resmi Google Maps (google.com/maps/embed).');
    }

    return extractedUrl;
  } catch (err) {
    throw new Error('Format URL Google Maps tidak valid: ' + err.message);
  }
}

export const settingController = {
  async index(req, res) {
    try {
      const settings = await settingModel.getAllAsMap();
      res.render('admin/settings/index', {
        title: 'Pengaturan Situs & Kontak',
        pageTitle: 'Pengaturan Situs & Kontak',
        activeNav: 'settings',
        settings,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Setting index error:', err);
      res.redirect('/admin/dashboard?error=' + encodeURIComponent('Gagal memuat pengaturan.'));
    }
  },

  async update(req, res) {
    try {
      const textKeys = [
        'company_name', 'company_tagline_id', 'company_tagline_en',
        'company_phone', 'company_email',
        'office_name_id', 'office_name_en', 'office_address', 'office_city', 'office_phone', 'office_fax', 'office_email',
        'factory_name_id', 'factory_name_en', 'factory_address', 'factory_city', 'factory_phone', 'factory_fax', 'factory_email',
        'factory_working_hours_id', 'factory_working_hours_en',
        'whatsapp_default_message', 'whatsapp_button_theme', 'whatsapp_floating_enabled'
      ];

      const updates = {};

      for (const key of textKeys) {
        if (req.body && req.body[key] !== undefined) {
          updates[key] = req.body[key].trim();
        }
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (updates.company_email && !emailRegex.test(updates.company_email)) {
        throw new Error('Format alamat email perusahaan tidak valid.');
      }
      if (updates.office_email && !emailRegex.test(updates.office_email)) {
        throw new Error('Format alamat email kantor Jakarta tidak valid.');
      }
      if (updates.factory_email && !emailRegex.test(updates.factory_email)) {
        throw new Error('Format alamat email pabrik Bandung tidak valid.');
      }

      // Validasi karakter aman telepon dan fax (angka, spasi, +, -, kurung)
      const phoneSanitizeRegex = /^[0-9\s+\-()]*$/;
      if (updates.office_phone && !phoneSanitizeRegex.test(updates.office_phone)) {
        throw new Error('Nomor telepon kantor Jakarta hanya boleh berisi angka, spasi, tanda plus, tanda hubung, dan kurung.');
      }
      if (updates.office_fax && !phoneSanitizeRegex.test(updates.office_fax)) {
        throw new Error('Nomor fax kantor Jakarta hanya boleh berisi angka, spasi, tanda plus, tanda hubung, dan kurung.');
      }
      if (updates.factory_phone && !phoneSanitizeRegex.test(updates.factory_phone)) {
        throw new Error('Nomor telepon pabrik Bandung hanya boleh berisi angka, spasi, tanda plus, tanda hubung, dan kurung.');
      }
      if (updates.factory_fax && !phoneSanitizeRegex.test(updates.factory_fax)) {
        throw new Error('Nomor fax pabrik Bandung hanya boleh berisi angka, spasi, tanda plus, tanda hubung, dan kurung.');
      }

      // Synchronize company_phone and office_phone
      if (updates.office_phone && !updates.company_phone) {
        updates.company_phone = updates.office_phone;
      } else if (updates.company_phone && !updates.office_phone) {
        updates.office_phone = updates.company_phone;
      }

      // Handle WhatsApp number normalization
      if (req.body && req.body.whatsapp_number !== undefined) {
        updates.whatsapp_number = req.body.whatsapp_number.replace(/[^0-9]/g, '');
      }

      // Handle Google Maps embed with validation and iframe parser
      if (req.body && req.body.google_maps_embed !== undefined) {
        updates.google_maps_embed = parseAndValidateGoogleMapsUrl(req.body.google_maps_embed);
        updates.contact_maps_embed_url = updates.google_maps_embed;
      }

      // Handle social media visibility toggles and URLs (Opsi 4B)
      const socialPlatforms = ['linkedin', 'instagram', 'facebook', 'youtube'];
      for (const platform of socialPlatforms) {
        const toggleKey = `social_${platform}_visible`;
        updates[toggleKey] = req.body && req.body[toggleKey] === '1' ? '1' : '0';

        const urlKey = `social_${platform}_url`;
        const legacyUrlKey = `${platform}_url`;
        const rawUrl = (req.body && (req.body[urlKey] !== undefined ? req.body[urlKey] : req.body[legacyUrlKey])) || '';
        const trimmedUrl = rawUrl.trim();

        if (trimmedUrl && !trimmedUrl.startsWith('https://')) {
          throw new Error(`URL ${platform} wajib menggunakan protokol aman https://`);
        }

        updates[urlKey] = trimmedUrl;
        updates[legacyUrlKey] = trimmedUrl;
      }

      // Handle upload favicon file (T-64)
      if (req.files && req.files.favicon_file && req.files.favicon_file[0]) {
        const faviconUrl = await saveSettingUpload(req.files.favicon_file[0], 'favicon');
        if (faviconUrl) {
          updates.site_favicon = faviconUrl;
        }
      }

      // Handle upload logo header file (T-65)
      if (req.files && req.files.logo_header_file && req.files.logo_header_file[0]) {
        const logoHeaderUrl = await saveSettingUpload(req.files.logo_header_file[0], 'logo-header');
        if (logoHeaderUrl) {
          updates.site_logo_header = logoHeaderUrl;
        }
      }

      // Handle upload logo footer file (T-65)
      if (req.files && req.files.logo_footer_file && req.files.logo_footer_file[0]) {
        const logoFooterUrl = await saveSettingUpload(req.files.logo_footer_file[0], 'logo-footer');
        if (logoFooterUrl) {
          updates.site_logo_footer = logoFooterUrl;
        }
      }

      if (Object.keys(updates).length > 0) {
        await settingModel.updateMany(updates);
        clearSettingsCache();
      }

      logger.info('Settings updated successfully by ' + (req.user?.email || 'admin'));
      res.redirect('/admin/settings?success=' + encodeURIComponent('Pengaturan situs berhasil diperbarui.'));
    } catch (err) {
      logger.error('Setting update error:', err);
      res.redirect('/admin/settings?error=' + encodeURIComponent('Gagal memperbarui pengaturan: ' + err.message));
    }
  }
};

export default settingController;
