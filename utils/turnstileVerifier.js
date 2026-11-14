import logger from './logger.js';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DUMMY_TEST_SECRET = '1x0000000000000000000000000000000AA';

const DUMMY_TEST_TOKENS = new Set(['test-token', '1x00000000000000000000AA']);

function isDummyBypassAllowed(secretKey, token) {
  if (process.env.NODE_ENV === 'production' || secretKey !== DUMMY_TEST_SECRET) return false;
  return token.startsWith('XXXX.') || token.startsWith('dummy-') || DUMMY_TEST_TOKENS.has(token);
}

function handleTurnstileNetworkError(err, secretKey) {
  logger.error('[Turnstile] Kesalahan jaringan saat menghubungi Cloudflare verify endpoint:', err);
  if (process.env.NODE_ENV === 'test' && secretKey === DUMMY_TEST_SECRET) {
    logger.warn('[Turnstile] Fallback dummy key aktif hanya pada NODE_ENV=test.');
    return { success: true, errorCodes: [] };
  }
  return { success: false, errorCodes: ['network-error'] };
}

async function verifyRemoteTurnstile(secretKey, token, remoteIp) {
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) formData.append('remoteip', remoteIp);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = await res.json();

    if (data.success) {
      logger.info(`[Turnstile] Verifikasi berhasil untuk hostname: ${data.hostname || 'unknown'}`);
      return { success: true, errorCodes: [] };
    }
    const codes = data['error-codes'] || ['invalid-input-response'];
    logger.warn(`[Turnstile] Verifikasi gagal: ${codes.join(', ')}`);
    return { success: false, errorCodes: codes };
  } catch (err) {
    return handleTurnstileNetworkError(err, secretKey);
  }
}

function getTurnstileRejectReason(secretKey, token) {
  if (!secretKey) return { msg: '[Turnstile] TURNSTILE_SECRET_KEY belum disetel; menolak verifikasi.', code: 'missing-input-secret', isErr: true };
  if (process.env.NODE_ENV === 'production' && secretKey === DUMMY_TEST_SECRET) {
    return { msg: '[Turnstile] Dummy Turnstile secret tidak valid untuk production; menolak verifikasi.', code: 'invalid-input-secret', isErr: true };
  }
  if (typeof token !== 'string' || token.trim() === '') {
    return { msg: '[Turnstile] Token respon Turnstile kosong atau tidak disertakan.', code: 'missing-input-response', isErr: false };
  }
  return null;
}

/**
 * Memverifikasi respon token Cloudflare Turnstile
 * @param {string} token - Token dari field `cf-turnstile-response`
 * @param {string} [remoteIp] - IP address pengguna (opsional)
 * @returns {Promise<{ success: boolean, errorCodes: string[] }>}
 */
export async function verifyTurnstileToken(token, remoteIp = null) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const reject = getTurnstileRejectReason(secretKey, token);
  if (reject) {
    if (reject.isErr) logger.error(reject.msg);
    else logger.warn(reject.msg);
    return { success: false, errorCodes: [reject.code] };
  }
  if (isDummyBypassAllowed(secretKey, token)) {
    logger.info('[Turnstile] Dummy testing token terdeteksi dengan testing secret, lolos verifikasi.');
    return { success: true, errorCodes: [] };
  }
  return verifyRemoteTurnstile(secretKey, token, remoteIp);
}

export default {
  verifyTurnstileToken
};
