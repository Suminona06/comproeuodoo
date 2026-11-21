import 'dotenv/config';
import nodemailer from 'nodemailer';
import escapeHtml from 'escape-html';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.euodoo.co.id',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
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
    ['Produk:', escapeField(lead.product_name, 'Kebutuhan Custom / Umum')]
  ];
  if (lead.selected_variants_text) {
    rows.push(['Varian Produk:', escapeField(lead.selected_variants_text)]);
  }
  rows.push(
    ['Estimasi Kuantitas:', escapeField(lead.estimated_quantity)],
    ['Pesan / Kebutuhan:', escapeField(lead.message), true]
  );
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
        <h2 style="margin: 0; font-size: 20px;">PT Euodoo Plastic</h2>
        <p style="margin: 5px 0 0 0; color: #a3e0d0; font-size: 14px;">Permintaan Penawaran Harga (RFQ)</p>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p style="font-size: 15px; color: #334155; margin-top: 0;">
          Terdapat prospek / lead penawaran harga baru yang masuk melalui website:
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
        Email ini dikirim otomatis oleh sistem CMS PT Euodoo.
      </div>
    </div>
  `;
}

function hasDeliveryRejection(info) {
  const rejected = Array.isArray(info?.rejected) ? info.rejected : [];
  const emptyAccepted = Array.isArray(info?.accepted) && info.accepted.length === 0;
  return rejected.length > 0 || emptyAccepted;
}

function buildLeadMailOptions(lead) {
  const recipient = process.env.SALES_NOTIFICATION_EMAIL || 'sales@euodoo.com';
  const mailFrom = process.env.MAIL_FROM || '"PT Euodoo Web" <notification@euodoo.com>';
  const companyPart = lead.company_name ? `${stripCrLf(lead.company_name)} - ` : '';
  return {
    from: mailFrom,
    to: recipient,
    subject: `[Permintaan Penawaran B2B] ${companyPart}${stripCrLf(lead.name)}`,
    html: buildLeadEmailHtml(lead)
  };
}

function handleRejectedDelivery(info) {
  const { messageId, accepted, rejected = [] } = info || {};
  logger.warn('Lead notification email rejected by SMTP server:', { messageId, accepted, rejected });
  return { success: false, messageId, rejected };
}

export const mailer = {
  transporter,

  /**
   * Send B2B RFQ Lead notification to sales team
   */
  async sendLeadNotification(lead) {
    try {
      const info = await transporter.sendMail(buildLeadMailOptions(lead));
      if (hasDeliveryRejection(info)) {
        return handleRejectedDelivery(info);
      }
      logger.info('Lead notification email sent successfully:', {
        messageId: info.messageId,
        accepted: info.accepted
      });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.warn('Failed to send lead email notification (non-fatal):', {
        code: err.code,
        responseCode: err.responseCode,
        message: err.message
      });
      return { success: false, error: err.message, code: err.code };
    }
  }
};

export default mailer;
