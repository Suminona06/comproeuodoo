import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import { APP_CONFIG } from '../config/constants.js';
import { getJwtSecret } from '../config/secrets.js';

export const MAX_FAILED_ATTEMPTS = 5;
export const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;
const SESSION_MAX_AGE_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const asString = (val) => (typeof val === 'string' ? val : '');

export function getRemainingLockMinutes(lockedUntil, nowMs = Date.now()) {
  const diffMs = new Date(lockedUntil).getTime() - nowMs;
  return Math.max(1, Math.ceil(diffMs / MINUTE_MS));
}

export function hasExpiredBruteForceLock(user, model = userModel) {
  if (!user || model.isAccountLocked(user)) return false;
  return Boolean(user.locked_until) || (user.failed_attempts || 0) >= MAX_FAILED_ATTEMPTS;
}

export function buildSessionCookieOptions(env = process.env) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS
  };
}

export function signAdminSessionToken(user, deps = {}) {
  const jwtLib = deps.jwt || jwt;
  const secretResolver = deps.getJwtSecret || getJwtSecret;
  const env = deps.env || process.env;
  const payload = {
    id: user.id,
    email: user.email,
    name: user.full_name || user.name,
    role: user.role
  };
  return jwtLib.sign(payload, secretResolver(), {
    expiresIn: env.JWT_EXPIRES_IN || '1h'
  });
}

export function validateLoginInput(rawBody) {
  const body = rawBody || {};
  const email = asString(body.email).trim().toLowerCase();
  const password = asString(body.password);
  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi.' };
  }
  return { email, password };
}

function hasBlankPassword(currentPassword, newPassword, confirmPassword) {
  return !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim();
}

function isTooShortPassword(value) {
  return value.length < MIN_PASSWORD_LENGTH || value.trim().length < MIN_PASSWORD_LENGTH;
}

export function validatePasswordChangeInput(rawBody) {
  const body = rawBody || {};
  const currentPassword = asString(body.current_password);
  const newPassword = asString(body.new_password);
  const confirmPassword = asString(body.confirm_password);

  if (hasBlankPassword(currentPassword, newPassword, confirmPassword)) {
    return { error: 'Semua kolom kata sandi wajib diisi.' };
  }
  if (isTooShortPassword(newPassword)) {
    return { error: 'Kata sandi baru minimal harus 8 karakter.' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Konfirmasi kata sandi baru tidak sesuai.' };
  }
  if (newPassword === currentPassword) {
    return { error: 'Kata sandi baru tidak boleh sama dengan kata sandi lama.' };
  }
  return { currentPassword, newPassword };
}

async function resolveActiveFailedAttempts(model, user) {
  if (!hasExpiredBruteForceLock(user, model)) {
    return user.failed_attempts || 0;
  }
  await model.resetFailedAttempts(user.id);
  return 0;
}

async function handleFailedLoginAttempt(model, user, currentAttempts) {
  const attemptResult = await model.recordFailedAttempt(user.id, currentAttempts);
  if (attemptResult.isLocked) {
    return {
      status: 'locked',
      statusCode: 403,
      justLocked: true,
      email: user.email,
      error: 'Akun terkunci selama 15 menit karena 5 kali kesalahan kata sandi berturut-turut.'
    };
  }
  return {
    status: 'unauthorized',
    statusCode: 401,
    attemptsLeft: attemptResult.attemptsLeft,
    error: `Kombinasi email atau kata sandi tidak valid. Sisa kesempatan: ${attemptResult.attemptsLeft} kali.`
  };
}

async function findUserByEmail(model, userEmail) {
  const normalizedEmail = asString(userEmail).trim().toLowerCase();
  if (!normalizedEmail) return null;
  return await model.findByEmail(normalizedEmail);
}

export async function authenticateAdmin(rawBody, deps = {}) {
  const model = deps.userModel || userModel;
  const hasher = deps.bcrypt || bcrypt;
  const input = validateLoginInput(rawBody);
  if (input.error) {
    return { status: 'validation_error', statusCode: 400, error: input.error };
  }

  const user = await model.findByEmail(input.email);
  if (!user) {
    return { status: 'unauthorized', statusCode: 401, error: 'Kombinasi email atau kata sandi tidak valid.' };
  }

  if (model.isAccountLocked(user)) {
    const remainingMinutes = getRemainingLockMinutes(user.locked_until, deps.nowMs);
    return {
      status: 'locked',
      statusCode: 403,
      justLocked: false,
      email: user.email,
      remainingMinutes,
      error: `Akun terkunci sementara karena 5 kali percobaan gagal berturut-turut. Silakan coba kembali dalam ${remainingMinutes} menit.`
    };
  }

  const currentAttempts = await resolveActiveFailedAttempts(model, user);
  const isMatch = await hasher.compare(input.password, user.password_hash);
  if (!isMatch) {
    return await handleFailedLoginAttempt(model, user, currentAttempts);
  }

  await model.resetFailedAttempts(user.id);
  const token = signAdminSessionToken(user, deps);
  return {
    status: 'ok',
    user,
    token,
    cookieName: APP_CONFIG.SESSION_COOKIE_NAME,
    cookieOptions: buildSessionCookieOptions(deps.env)
  };
}

export async function changeAdminPassword(userEmail, rawBody, deps = {}) {
  const model = deps.userModel || userModel;
  const hasher = deps.bcrypt || bcrypt;
  const input = validatePasswordChangeInput(rawBody);
  if (input.error) {
    return { status: 'validation_error', statusCode: 400, error: input.error };
  }

  const user = await findUserByEmail(model, userEmail);
  if (!user) {
    return { status: 'not_found', statusCode: 404, error: 'Pengguna tidak ditemukan dalam sistem.' };
  }

  const isCurrentMatch = await hasher.compare(input.currentPassword, user.password_hash);
  if (!isCurrentMatch) {
    return { status: 'validation_error', statusCode: 400, error: 'Kata sandi lama yang Anda masukkan tidak sesuai.' };
  }

  const isSameAsOldHash = await hasher.compare(input.newPassword, user.password_hash);
  if (isSameAsOldHash) {
    return { status: 'validation_error', statusCode: 400, error: 'Kata sandi baru tidak boleh sama dengan kata sandi lama.' };
  }

  const newHash = await hasher.hash(input.newPassword, BCRYPT_SALT_ROUNDS);
  await model.updatePassword(user.id, newHash);
  return {
    status: 'ok',
    email: user.email,
    message: 'Kata sandi berhasil diperbarui dengan aman.'
  };
}

export default {
  MAX_FAILED_ATTEMPTS,
  MIN_PASSWORD_LENGTH,
  getRemainingLockMinutes,
  hasExpiredBruteForceLock,
  buildSessionCookieOptions,
  signAdminSessionToken,
  validateLoginInput,
  validatePasswordChangeInput,
  authenticateAdmin,
  changeAdminPassword
};
