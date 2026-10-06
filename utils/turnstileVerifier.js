import logger from './logger.js';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DUMMY_TEST_SECRET = '1x0000000000000000000000000000000AA';

/**
 * Memverifikasi respon token Cloudflare Turnstile
 * @param {string} token - Token dari field `cf-turnstile-response`
 * @param {string} [remoteIp] - IP address pengguna (opsional)
 * @returns {Promise<{ success: boolean, errorCodes: string[] }>}
 */
export async function verifyTurnstileToken(token, remoteIp = null) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Jika Turnstile secret tidak dikonfigurasi di environment
  if (!secretKey) {
    logger.warn('[Turnstile] TURNSTILE_SECRET_KEY belum disetel. Meloloskan verifikasi.');
    return { success: true, errorCodes: [] };
  }

  // Jika token kosong
  if (!token || typeof token !== 'string' || token.trim() === '') {
    logger.warn('[Turnstile] Token respon Turnstile kosong atau tidak disertakan.');
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  // Bypass langsung untuk pengujian lokal / CI tanpa koneksi keluar jika memakai dummy key
  if (secretKey === DUMMY_TEST_SECRET && (token.startsWith('XXXX.') || token.startsWith('dummy-') || token === 'test-token' || token === '1x00000000000000000000AA')) {
    logger.info('[Turnstile] Dummy testing token terdeteksi dengan testing secret, lolos verifikasi.');
    return { success: true, errorCodes: [] };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await res.json();

    if (data.success) {
      logger.info(`[Turnstile] Verifikasi berhasil untuk hostname: ${data.hostname || 'unknown'}`);
      return { success: true, errorCodes: [] };
    } else {
      logger.warn(`[Turnstile] Verifikasi gagal: ${(data['error-codes'] || []).join(', ')}`);
      return { success: false, errorCodes: data['error-codes'] || ['invalid-input-response'] };
    }
  } catch (err) {
    logger.error('[Turnstile] Kesalahan jaringan saat menghubungi Cloudflare verify endpoint:', err);

    // Jika dalam mode development / testing dengan dummy key dan koneksi offline
    if (secretKey === DUMMY_TEST_SECRET || process.env.NODE_ENV === 'test') {
      logger.warn('[Turnstile] Menggunakan dummy key di lingkungan development/test, meloloskan fallback.');
      return { success: true, errorCodes: [] };
    }

    return { success: false, errorCodes: ['network-error'] };
  }
}

export default {
  verifyTurnstileToken
};
