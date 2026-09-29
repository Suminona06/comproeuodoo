import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for Login Endpoint (FR-02)
 * Max 5 attempts per 15 minutes window
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('admin/login', {
      title: 'Login Terkunci - PT Euodoo CMS',
      error: 'Terlalu banyak percobaan login dari IP ini. Silakan coba kembali setelah 15 menit.',
      csrfToken: res.locals.csrfToken || ''
    });
  }
});

/**
 * Rate Limiter for Lead & RFQ Submissions
 * Max 5 requests per 10 minutes window
 */
export const leadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Terlalu banyak permintaan terkirim. Mohon tunggu beberapa saat sebelum mengirim kembali.'
  }
});

/**
 * General Public API / Page Rate Limiter
 * Max 120 requests per minute
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

export default { loginLimiter, leadLimiter, generalLimiter };
