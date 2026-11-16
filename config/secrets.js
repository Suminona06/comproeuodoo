import crypto from 'node:crypto';

const MIN_SECRET_LENGTH = 32;
const DISALLOWED_SECRETS = new Set([
  'euodoo_jwt_secret_dev',
  'euodoo_cookie_secret_dev',
  'super_secret_jwt_key_change_in_production_min_32_chars',
  'super_secret_cookie_key_change_in_production',
  'euodoo_default_fallback_secret_change_in_prod'
]);

// Ephemeral per-process secrets for non-production runs that omit .env keys.
const EPHEMERAL_JWT_SECRET = crypto.randomBytes(32).toString('hex');
const EPHEMERAL_COOKIE_SECRET = crypto.randomBytes(32).toString('hex');

function assertStrongProdSecret(name, value) {
  const isInvalid = !value || value.length < MIN_SECRET_LENGTH || DISALLOWED_SECRETS.has(value);
  if (isInvalid) {
    throw new Error(`[Security] ${name} wajib disetel (minimal ${MIN_SECRET_LENGTH} karakter unik) saat NODE_ENV=production.`);
  }
}

/**
 * Validate required signing secrets when running in production.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function validateProductionSecrets(env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  assertStrongProdSecret('JWT_SECRET', env.JWT_SECRET);
  assertStrongProdSecret('COOKIE_SECRET', env.COOKIE_SECRET);
}

/**
 * Resolve JWT signing secret (enforces strong secret in production).
 * @returns {string}
 */
export function getJwtSecret() {
  validateProductionSecrets();
  return process.env.JWT_SECRET || EPHEMERAL_JWT_SECRET;
}

/**
 * Resolve signed cookie secret (enforces strong secret in production).
 * @returns {string}
 */
export function getCookieSecret() {
  validateProductionSecrets();
  return process.env.COOKIE_SECRET || EPHEMERAL_COOKIE_SECRET;
}
