import bcrypt from 'bcryptjs';
import userModel from '../models/userModel.js';

export const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;
const ALLOWED_ROLES = new Set(['superadmin', 'admin', 'editor']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const useModel = (deps) => deps?.userModel || userModel;
const useHasher = (deps) => deps?.bcrypt || bcrypt;
const asTrimmed = (val) => (typeof val === 'string' ? val.trim() : '');

export function parsePositiveIntId(rawId) {
  const num = Number(rawId);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function isPasswordValidLength(password) {
  return password.length >= MIN_PASSWORD_LENGTH && password.trim().length >= MIN_PASSWORD_LENGTH;
}

function validateUserIdentity(email, role) {
  if (!EMAIL_REGEX.test(email)) return 'Format alamat email tidak valid.';
  if (!ALLOWED_ROLES.has(role)) {
    return 'Role tidak valid. Pilihan role: Superadmin, Admin, atau Editor.';
  }
  return null;
}

function hasAllRequiredStoreFields(name, email, password, role) {
  return Boolean(name && email && password.trim() && role);
}

function validateStoreInput(rawBody) {
  const body = rawBody || {};
  const name = asTrimmed(body.name);
  const email = asTrimmed(body.email).toLowerCase();
  const role = asTrimmed(body.role);
  const password = typeof body.password === 'string' ? body.password : '';

  if (!hasAllRequiredStoreFields(name, email, password, role)) {
    return { error: 'Seluruh kolom (Nama, Email, Sandi, Role) wajib diisi.' };
  }
  const identityError = validateUserIdentity(email, role);
  if (identityError) return { error: identityError };
  if (!isPasswordValidLength(password)) {
    return { error: `Kata sandi minimal harus ${MIN_PASSWORD_LENGTH} karakter.` };
  }
  return { name, email, password, role };
}

async function resolveUpdatePassword(newPassword, hasher) {
  const raw = typeof newPassword === 'string' ? newPassword : '';
  if (!raw) return { hash: null, error: null };
  if (!isPasswordValidLength(raw)) {
    return { hash: null, error: `Kata sandi baru minimal harus ${MIN_PASSWORD_LENGTH} karakter.` };
  }
  return { hash: await hasher.hash(raw, BCRYPT_SALT_ROUNDS), error: null };
}

function resolveUpdateFields(rawBody, user) {
  const body = rawBody || {};
  const name = body.name !== undefined ? asTrimmed(body.name) : user.name;
  const email = body.email !== undefined ? asTrimmed(body.email).toLowerCase() : user.email;
  const role = asTrimmed(body.role) || user.role;

  if (!name) return { error: 'Nama pengguna wajib diisi.' };
  const identityError = validateUserIdentity(email, role);
  if (identityError) return { error: identityError };
  return { name, email, role };
}

export async function listUsers(deps = {}) {
  return useModel(deps).findAll();
}

export async function createUser(rawBody, deps = {}) {
  const input = validateStoreInput(rawBody);
  if (input.error) return { status: 'validation_error', error: input.error };

  const model = useModel(deps);
  const existing = await model.findByEmail(input.email);
  if (existing) {
    return { status: 'validation_error', error: 'Alamat email sudah terdaftar dalam sistem.' };
  }

  const hashedPassword = await useHasher(deps).hash(input.password, BCRYPT_SALT_ROUNDS);
  const id = await model.create({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    role: input.role
  });
  return { status: 'ok', id, message: 'Pengguna baru berhasil ditambahkan.' };
}

export async function getUserById(rawId, deps = {}) {
  const id = parsePositiveIntId(rawId);
  if (!id) return { status: 'not_found', error: 'Pengguna tidak ditemukan.' };

  const user = await useModel(deps).findById(id);
  if (!user) return { status: 'not_found', error: 'Pengguna tidak ditemukan.' };
  return { status: 'ok', user };
}

async function checkRoleAndEmail(model, user, fields) {
  if (fields.role !== user.role) {
    const check = await model.canDemoteUser(user.id, fields.role);
    if (!check.canDemote) return check.message;
  }
  if (fields.email !== user.email) {
    const existing = await model.findByEmail(fields.email);
    if (existing && Number(existing.id) !== Number(user.id)) {
      return 'Alamat email sudah terdaftar dalam sistem.';
    }
  }
  return null;
}

async function buildValidatedUpdate(model, user, rawBody, deps) {
  const fields = resolveUpdateFields(rawBody, user);
  if (fields.error) return { error: fields.error };

  const guardError = await checkRoleAndEmail(model, user, fields);
  if (guardError) return { error: guardError };

  const pwResult = await resolveUpdatePassword(rawBody?.new_password, useHasher(deps));
  if (pwResult.error) return { error: pwResult.error };

  return {
    data: {
      ...fields,
      ...(pwResult.hash ? { password: pwResult.hash } : {})
    }
  };
}

export async function updateUser(rawId, rawBody, deps = {}) {
  const id = parsePositiveIntId(rawId);
  if (!id) return { status: 'not_found', error: 'Pengguna tidak ditemukan.' };

  const model = useModel(deps);
  const user = await model.findById(id);
  if (!user) return { status: 'not_found', error: 'Pengguna tidak ditemukan.' };

  const validated = await buildValidatedUpdate(model, user, rawBody, deps);
  if (validated.error) return { status: 'validation_error', user, error: validated.error };

  await model.update(id, validated.data);
  return { status: 'ok', message: 'Data pengguna berhasil diperbarui.' };
}

export async function deleteUser(rawId, currentUserId, deps = {}) {
  const id = parsePositiveIntId(rawId);
  if (!id) return { status: 'not_found', error: 'Pengguna tidak ditemukan.' };

  if (currentUserId !== undefined && Number(currentUserId) === id) {
    return { status: 'forbidden', error: 'Anda tidak dapat menghapus akun Anda sendiri.' };
  }

  const model = useModel(deps);
  const check = await model.canDeleteUser(id);
  if (!check.canDelete) return { status: 'forbidden', error: check.message };

  await model.delete(id);
  return { status: 'ok', message: 'Pengguna berhasil dihapus.' };
}

export default {
  MIN_PASSWORD_LENGTH,
  parsePositiveIntId,
  listUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser
};
