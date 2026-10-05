import inquiryModel from '../../models/inquiryModel.js';
import leadModel from '../../models/leadModel.js';
import productModel from '../../models/productModel.js';
import mailer from '../../config/mailer.js';
import logger from '../../utils/logger.js';

export const contactController = {
  async index(req, res) {
    try {
      const { product, success, error } = req.query;
      const products = await productModel.findAll({ isActive: true });

      let selectedProduct = null;
      if (product) {
        selectedProduct = products.find(p => String(p.id) === String(product) || p.slug === product);
      }

      let errorMsg = null;
      if (error === 'rate_limited') {
        errorMsg = 'Terlalu banyak permintaan terkirim. Mohon tunggu 10 menit sebelum mencoba lagi.';
      } else if (error === 'validation') {
        errorMsg = 'Mohon lengkapi seluruh field bertanda wajib dengan format yang valid.';
      } else if (error === '1') {
        errorMsg = res.locals.t('contact.error_alert');
      }

      const title = res.locals.t('contact.page_title') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');

      res.render('public/contact', {
        title,
        path: '/contact',
        products,
        selectedProduct,
        success: success === '1',
        error: Boolean(errorMsg),
        errorMsg
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

    try {
      const { name, company, email, phone, product_id, quantity, message, hp_website, type } = req.body;

      if (hp_website) {
        logger.warn('Spam submission detected and dropped via honeypot.');
        if (isAjax) {
          return res.json({ success: true, message: 'Permintaan berhasil dikirim.' });
        }
        return res.redirect('/contact?success=1');
      }

      if (!name || !email || !phone || !message) {
        if (isAjax) {
          return res.status(400).json({ success: false, message: 'Mohon lengkapi seluruh field wajib.' });
        }
        return res.redirect('/contact?error=validation');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (isAjax) {
          return res.status(400).json({ success: false, message: 'Format alamat email tidak valid.' });
        }
        return res.redirect('/contact?error=validation');
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

      let productName = 'Kebutuhan Custom / Umum';
      let parsedProductId = null;
      if (product_id) {
        parsedProductId = parseInt(product_id, 10);
        const prod = await productModel.findById(parsedProductId);
        if (prod) {
          productName = prod.name_id;
        }
      }

      const validTypes = ['inquiry', 'partnership', 'general'];
      const leadType = validTypes.includes(type) ? type : 'inquiry';

      const inquiryId = await inquiryModel.create({
        type: leadType,
        name: name.trim(),
        company: company ? company.trim() : null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        product_id: parsedProductId,
        quantity: quantity ? quantity.trim() : null,
        message: message.trim(),
        source: 'contact_form',
        status: 'baru',
        ip_address: ipAddress
      });

      leadModel.create({
        type: leadType,
        name: name.trim(),
        company: company ? company.trim() : null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        product_id: parsedProductId,
        quantity: quantity ? quantity.trim() : null,
        message: message.trim(),
        status: 'baru',
        ip_address: ipAddress
      }).catch(err => {
        logger.warn('Mirror to leadModel error:', { message: err.message });
      });

      logger.info('New B2B Inquiry recorded:', { id: inquiryId, company, email });

      mailer.sendLeadNotification({
        name: name.trim(),
        company_name: company ? company.trim() : null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        product_name: productName,
        estimated_quantity: quantity ? quantity.trim() : null,
        message: message.trim()
      }).catch(err => {
        logger.warn('Background mailer error:', { message: err.message });
      });

      if (isAjax) {
        return res.json({
          success: true,
          message: 'Terima kasih. Permintaan penawaran Anda telah berhasil dikirim. Tim penjualan kami akan segera menghubungi Anda.'
        });
      }

      return res.redirect('/contact?success=1#form-status');
    } catch (err) {
      logger.error('Public contactController.submit error:', { message: err.message, stack: err.stack });
      if (isAjax) {
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mengirimkan data.' });
      }
      return res.redirect('/contact?error=1#form-status');
    }
  }
};

export default contactController;
