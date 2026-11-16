import nodemailer from 'nodemailer';
import escapeHtml from 'escape-html';
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
    rejectUnauthorized: process.env.NODE_ENV === 'production' || process.env.SMTP_ALLOW_INSECURE_TLS !== 'true'
  }
});

function stripCrLf(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function escapeField(value, fallback = '-') {
  return escapeHtml(value ? String(value) : fallback);
}

function sanitizeMailtoAddress(rawEmail) {
  return escapeHtml(String(rawEmail || '').replace(/[\r\n"'<>?\s&]/g, ''));
}

function renderLeadRows(lead) {
  const safeEmailText = escapeField(lead.email);
  const safeMailto = sanitizeMailtoAddress(lead.email);
  const rows = [
    ['Nama Lengkap:', escapeField(lead.name)],
    ['Perusahaan:', escapeField(lead.company_name)],
    ['Email:', `<a href="mailto:${safeMailto}">${safeEmailText}</a>`],
    ['Telepon / WA:', escapeField(lead.phone)],
    ['Produk:', escapeField(lead.product_name, 'Kebutuhan Custom / Umum')],
    ['Estimasi Kuantitas:', escapeField(lead.estimated_quantity)],
    ['Pesan / Kebutuhan:', escapeField(lead.message), true]
  ];
  return rows
    .map(([label, val, multiline], idx) => {
      const rowBorder = idx < rows.length - 1 ? 'border-bottom: 1px solid #f1f5f9;' : '';
      const tdLabel = multiline ? 'vertical-align: top;' : '';
      const tdVal = multiline ? 'white-space: pre-line;' : '';
      return `<tr style="${rowBorder}"><td style="padding: 10px 0; color: #64748b; width: 35%; font-weight: bold; ${tdLabel}">${label}</td><td style="padding: 10px 0; color: #0f172a; ${tdVal}">${val}</td></tr>`;
    })
    .join('\n');
}

function buildLeadEmailHtml(lead) {
  const safeMailto = sanitizeMailtoAddress(lead.email);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #00573F; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">PT Euodoo Presisi Indonesia</h2>
        <p style="margin: 5px 0 0 0; color: #a3e0d0; font-size: 14px;">Notifikasi Permintaan Penawaran Harga (RFQ)</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 15px; color: #334155; margin-top: 0;">
          Terdapat prospek / lead penawaran harga baru yang masuk melalui formulir situs web:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
          <tbody>${renderLeadRows(lead)}</tbody>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="mailto:${safeMailto}?subject=Tanggapan%20Penawaran%20PT%20Euodoo"
             style="background-color: #00755A; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Balas Email Prospek
          </a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 14px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        Email ini dikirim otomatis oleh sistem CMS PT Euodoo Presisi Indonesia.
      </div>
    </div>
  `;
}

export const mailer = {
  transporter,

  /**
   * Send B2B RFQ Lead notification to sales team
   */
  async sendLeadNotification(lead) {
    try {
      const recipient = process.env.SALES_NOTIFICATION_EMAIL || 'sales@euodoo.com';
      const mailFrom = process.env.MAIL_FROM || '"PT Euodoo Web" <notification@euodoo.com>';
      const companyPart = lead.company_name ? `${stripCrLf(lead.company_name)} - ` : '';
      const subject = `[Permintaan Penawaran B2B] ${companyPart}${stripCrLf(lead.name)}`;
      const htmlContent = buildLeadEmailHtml(lead);

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
