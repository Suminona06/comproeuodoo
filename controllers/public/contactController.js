import leadModel from '../../models/leadModel.js';
import productModel from '../../models/productModel.js';
import mailer from '../../config/mailer.js';
import logger from '../../utils/logger.js';

export const contactController = {
  /**
   * Display Contact Us & RFQ Form page
   */
  async index(req, res) {
    try {
      const { product, success, error } = req.query;
      const products = await productModel.findAll({ isActive: true });

      let selectedProduct = null;
      if (product) {
        selectedProduct = products.find(p => String(p.id) === String(product) || p.slug === product);
      }

      const title = res.locals.t('contact.page_title') + ' | ' + (res.locals.settings?.company_name || 'PT Euodoo');

      res.render('public/contact', {
        title,
        path: '/contact',
        products,
        selectedProduct,
        success: success === '1',
        error: error === '1'
      });
    } catch (err) {
      logger.error('Public contactController.index error:', { message: err.message, stack: err.stack });
      res.status(500).render('public/contact', {
        title: 'Kontak & Permintaan Penawaran | PT Euodoo',
        path: '/contact',
        products: [],
        selectedProduct: null,
        success: false,
        error: true
      });
    }
  },

  /**
   * Handle RFQ / Lead Submission
   */
  async submit(req, res) {
    try {
      const { name, company, email, phone, product_id, quantity, message, hp_website } = req.body;

      // Honeypot spam guard: bots automatically fill hidden fields
      if (hp_website) {
        logger.warn('Spam submission detected and dropped via honeypot.');
        return res.redirect('/contact?success=1');
      }

      // Basic Validation
      if (!name || !email || !phone || !message) {
        return res.redirect('/contact?error=1');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.redirect('/contact?error=1');
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

      let productName = 'Kebutuhan Custom / Umum';
      if (product_id) {
        const prod = await productModel.findById(product_id);
        if (prod) {
          productName = prod.name_id;
        }
      }

      // Save to database
      const validTypes = ['inquiry', 'partnership', 'general'];
      const leadType = validTypes.includes(req.body.type) ? req.body.type : 'inquiry';

      const leadId = await leadModel.create({
        type: leadType,
        name: name.trim(),
        company: company ? company.trim() : null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        product_id: product_id ? parseInt(product_id, 10) : null,
        quantity: quantity ? quantity.trim() : null,
        message: message.trim(),
        status: 'baru',
        ip_address: ipAddress
      });

      logger.info('New B2B Lead created:', { id: leadId, company, email });

      // Dispatch email notification asynchronously without blocking response
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

      return res.redirect('/contact?success=1');
    } catch (err) {
      logger.error('Public contactController.submit error:', { message: err.message, stack: err.stack });
      return res.redirect('/contact?error=1');
    }
  }
};

export default contactController;
