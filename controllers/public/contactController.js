import inquiryModel from '../../models/inquiryModel.js';
import leadModel from '../../models/leadModel.js';
import productModel from '../../models/productModel.js';
import pageHeroBannerModel from '../../models/pageHeroBannerModel.js';
import { verifyTurnstileToken } from '../../utils/turnstileVerifier.js';
import mailer from '../../config/mailer.js';
import logger from '../../utils/logger.js';

export const contactController = {
  async index(req, res) {
    try {
      const { product, success, error } = req.query;
      const [products, heroBanner] = await Promise.all([
        productModel.findAll({ isActive: true }),
        pageHeroBannerModel.getByPageKey('contact')
      ]);

      let selectedProduct = null;
      if (product) {
        selectedProduct = products.find(p => String(p.id) === String(product) || p.slug === product);
      }

      let errorMsg = null;
      const currentLang = res.locals.currentLang || 'id';
      const isEn = currentLang === 'en';
      if (error === 'rate_limited') {
        errorMsg = isEn
          ? 'Too many requests. Please wait 10 minutes before trying again.'
          : 'Terlalu banyak permintaan terkirim. Mohon tunggu 10 menit sebelum mencoba lagi.';
      } else if (error === 'validation') {
        errorMsg = isEn
          ? 'Please complete all required fields with valid formats.'
          : 'Mohon lengkapi seluruh field bertanda wajib dengan format yang valid.';
      } else if (error === 'turnstile') {
        errorMsg = isEn
          ? 'Cloudflare Turnstile verification failed or expired. Please check the verification box again.'
          : 'Verifikasi keamanan Cloudflare Turnstile gagal atau kedaluwarsa. Silakan centang kembali kotak verifikasi.';
      } else if (error === '1') {
        errorMsg = res.locals.t('contact.error_alert');
      }

      const title = res.locals.t('contact.page_title') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');
      const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

      res.render('public/contact', {
        title,
        path: '/contact',
        products,
        selectedProduct,
        success: success === '1',
        error: Boolean(errorMsg),
        errorMsg,
        heroBanner,
        turnstileSiteKey
      });
    } catch (err) {
      logger.error('Public contactController.index error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/contact', {
        title: 'Kontak & Permintaan Penawaran | PT Euodoo',
        path: '/contact',
        products: [],
        selectedProduct: null,
        success: false,
        error: true,
        errorMsg: 'Terjadi kesalahan sistem saat memuat formulir.'
      });
    }
  },

  async submit(req, res) {
    const isAjax = req.xhr || req.headers.accept?.includes('application/json');
    const currentLang = res.locals.currentLang || (req.session && req.session.lang) || 'id';
    const isEn = currentLang === 'en';

    try {
      const { name, company, email, phone, product_id, quantity, message, hp_website, type } = req.body;

      if (hp_website) {
        logger.warn('Spam submission detected and dropped via honeypot.');
        if (isAjax) {
          return res.json({ success: true, message: isEn ? 'Inquiry submitted successfully.' : 'Permintaan berhasil dikirim.' });
        }
        return res.redirect('/contact?success=1#form-status');
      }

      const cleanName = (name || '').trim();
      const cleanCompany = company ? String(company).trim() : null;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPhone = (phone || '').trim();
      const cleanQuantity = quantity ? String(quantity).trim() : null;
      const cleanMessage = (message || '').trim();

      if (!cleanName || !cleanEmail || !cleanPhone || !cleanMessage) {
        if (isAjax) {
          return res.status(400).json({
            success: false,
            message: isEn ? 'Please fill in all required fields.' : 'Mohon lengkapi seluruh field wajib.'
          });
        }
        return res.redirect('/contact?error=validation#form-status');
      }

      if (cleanName.length > 100) {
        if (isAjax) {
          return res.status(400).json({
            success: false,
            message: isEn ? 'Name exceeds maximum length of 100 characters.' : 'Nama melebihi batas maksimal 100 karakter.'
          });
        }
        return res.redirect('/contact?error=validation#form-status');
      }

      if (cleanCompany && cleanCompany.length > 150) {
        if (isAjax) {
          return res.status(400).json({
            success: false,
            message: isEn ? 'Company name exceeds maximum length of 150 characters.' : 'Nama perusahaan melebihi batas maksimal 150 karakter.'
          });
        }
        return res.redirect('/contact?error=validation#form-status');
      }

      if (cleanEmail.length > 100) {
        if (isAjax) {
          return res.status(400).json({
            success: false,
            message: isEn ? 'Email exceeds maximum length of 100 characters.' : 'Email melebihi batas maksimal 100 karakter.'
          });
        }
        return res.redirect('/contact?error=validation#form-status');
      }

      if (cleanQuantity && cleanQuantity.length > 100) {
        if (isAjax) {
          return res.status(400).json({
            success: false,
            message: isEn ? 'Quantity exceeds maximum length of 100 characters.' : 'Kuantitas melebihi batas maksimal 100 karakter.'
          });
        }
        return res.redirect('/contact?error=validation#form-status');
      }

      if (cleanMessage.length < 10 || cleanMessage.length > 3000) {
        if (isAjax) {
          return res.status(400).json({
            success: false,
            message: isEn
              ? 'Message must be between 10 and 3,000 characters.'
              : 'Pesan rincian kebutuhan harus antara 10 hingga 3.000 karakter.'
          });
        }
        return res.redirect('/contact?error=validation#form-status');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        if (isAjax) {
          return res.status(400).json({
            success: false,
            message: isEn ? 'Invalid email address format.' : 'Format alamat email tidak valid.'
          });
        }
        return res.redirect('/contact?error=validation#form-status');
      }

      const phoneRegex = /^[0-9\s+\-()]{7,30}$/;
      if (!phoneRegex.test(cleanPhone)) {
        if (isAjax) {
          return res.status(400).json({
            success: false,
            message: isEn
              ? 'Invalid phone number format. Only numbers, spaces, +, -, and () are allowed (min 7 characters).'
              : 'Format nomor telepon tidak valid. Hanya angka, spasi, +, -, dan () yang diperbolehkan (min 7 karakter).'
          });
        }
        return res.redirect('/contact?error=validation#form-status');
      }

      let productName = isEn ? 'Custom / General Inquiries' : 'Kebutuhan Custom / Umum';
      let parsedProductId = null;
      if (product_id !== undefined && product_id !== null && String(product_id).trim() !== '') {
        const rawProductId = String(product_id).trim();
        if (!/^\d+$/.test(rawProductId) || parseInt(rawProductId, 10) <= 0) {
          if (isAjax) {
            return res.status(400).json({
              success: false,
              message: isEn ? 'Invalid product selection.' : 'Pilihan produk tidak valid.'
            });
          }
          return res.redirect('/contact?error=validation#form-status');
        }
        parsedProductId = parseInt(rawProductId, 10);
        const prod = await productModel.findById(parsedProductId);
        if (prod) {
          productName = isEn ? (prod.name_en || prod.name_id) : prod.name_id;
        }
      }

      const validTypes = ['inquiry', 'partnership', 'general'];
      const leadType = validTypes.includes(type) ? type : 'inquiry';

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

      // Verifikasi Cloudflare Turnstile CAPTCHA (Item 7 / T-68)
      const turnstileToken = req.body['cf-turnstile-response'];
      const turnstileResult = await verifyTurnstileToken(turnstileToken, ipAddress);

      if (!turnstileResult.success) {
        logger.warn(`[Turnstile] Submission blocked for IP ${ipAddress}. Errors: ${(turnstileResult.errorCodes || []).join(', ')}`);
        if (isAjax) {
          return res.status(400).json({
            success: false,
            message: isEn
              ? 'Security verification (Cloudflare Turnstile) failed or expired. Please verify again.'
              : 'Verifikasi keamanan Cloudflare Turnstile gagal atau tidak valid. Silakan coba lagi.'
          });
        }
        return res.redirect('/contact?error=turnstile#form-status');
      }

      const inquiryId = await inquiryModel.create({
        type: leadType,
        name: cleanName,
        company: cleanCompany,
        email: cleanEmail,
        phone: cleanPhone,
        product_id: parsedProductId,
        quantity: cleanQuantity,
        message: cleanMessage,
        source: 'contact_form',
        status: 'baru',
        ip_address: ipAddress
      });

      leadModel.create({
        type: leadType,
        name: cleanName,
        company: cleanCompany,
        email: cleanEmail,
        phone: cleanPhone,
        product_id: parsedProductId,
        quantity: cleanQuantity,
        message: cleanMessage,
        status: 'baru',
        ip_address: ipAddress
      }).catch(err => {
        logger.warn('Mirror to leadModel error:', { message: err.message });
      });

      logger.info('New B2B Inquiry recorded:', { id: inquiryId, company: cleanCompany, email: cleanEmail });

      mailer.sendLeadNotification({
        name: cleanName,
        company_name: cleanCompany,
        email: cleanEmail,
        phone: cleanPhone,
        product_name: productName,
        estimated_quantity: cleanQuantity,
        message: cleanMessage
      }).catch(err => {
        logger.warn('Background mailer error:', { message: err.message });
      });

      if (isAjax) {
        return res.json({
          success: true,
          message: isEn
            ? 'Thank you. Your RFQ has been successfully submitted. Our sales team will contact you shortly.'
            : 'Terima kasih. Permintaan penawaran Anda telah berhasil dikirim. Tim penjualan kami akan segera menghubungi Anda.'
        });
      }

      return res.redirect('/contact?success=1#form-status');
    } catch (err) {
      logger.error('Public contactController.submit error:', { message: err.message, stack: err.stack });
      const currentLang = res.locals.currentLang || (req.session && req.session.lang) || 'id';
      const isEn = currentLang === 'en';
      if (isAjax) {
        return res.status(500).json({
          success: false,
          message: isEn
            ? 'A system error occurred while processing your request. Please try again or contact us directly.'
            : 'Terjadi kesalahan sistem saat mengirimkan data. Silakan coba kembali atau hubungi kami langsung.'
        });
      }
      return res.redirect('/contact?error=1#form-status');
    }
  }
};

export default contactController;
