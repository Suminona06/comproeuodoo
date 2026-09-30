import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.euodoo.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

export const mailer = {
  transporter,

  /**
   * Send B2B RFQ Lead notification to sales team
   */
  async sendLeadNotification(lead) {
    try {
      const recipient = process.env.SALES_NOTIFICATION_EMAIL || 'sales@euodoo.com';
      const mailFrom = process.env.MAIL_FROM || '"PT Euodoo Web" <notification@euodoo.com>';

      const subject = `[Permintaan Penawaran B2B] ${lead.company_name ? lead.company_name + ' - ' : ''}${lead.name}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0a192f; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">PT Euodoo Presisi Indonesia</h2>
            <p style="margin: 5px 0 0 0; color: #0d9488; font-size: 14px;">Notifikasi Permintaan Penawaran Harga (RFQ)</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="font-size: 15px; color: #334155; margin-top: 0;">
              Terdapat prospek / lead penawaran harga baru yang masuk melalui formulir situs web:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; width: 35%; font-weight: bold;">Nama Lengkap:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${lead.name || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Perusahaan:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${lead.company_name || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Email:</td>
                  <td style="padding: 10px 0; color: #0f172a;"><a href="mailto:${lead.email}">${lead.email || '-'}</a></td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Telepon / WA:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${lead.phone || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Produk:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${lead.product_name || 'Kebutuhan Custom / Umum'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold;">Estimasi Kuantitas:</td>
                  <td style="padding: 10px 0; color: #0f172a;">${lead.estimated_quantity || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-weight: bold; vertical-align: top;">Pesan / Kebutuhan:</td>
                  <td style="padding: 10px 0; color: #0f172a; white-space: pre-line;">${lead.message || '-'}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top: 24px; text-align: center;">
              <a href="mailto:${lead.email}?subject=Tanggapan%20Penawaran%20PT%20Euodoo"
                 style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; display: inline-block;">
                Balas Email Prospek
              </a>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 14px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Email ini dikirim otomatis oleh sistem CMS PT Euodoo Presisi Indonesia.
          </div>
        </div>
      `;

      const info = await transporter.sendMail({
        from: mailFrom,
        to: recipient,
        subject,
        html: htmlContent
      });

      logger.info('Lead notification email sent successfully:', { messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.warn('Failed to send lead email notification (non-fatal):', { message: err.message });
      return { success: false, error: err.message };
    }
  }
};

export default mailer;
