import { query, execute } from '../config/database.js';

export const userModel = {
  async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  async findAll() {
    return await query(
      'SELECT id, email, full_name, full_name as name, role, failed_attempts, locked_until, created_at, updated_at FROM users ORDER BY id ASC'
    );
  },

  async create({ email, password_hash, password, full_name, name, role = 'admin' }) {
    const hash = password_hash || password;
    const fullName = full_name || name;
    const sql = 'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)';
    const result = await execute(sql, [email, hash, fullName, role]);
    return result.insertId;
  },

  async update(id, { email, full_name, name, role, password_hash, password }) {
    const fields = [];
    const params = [];
    if (email !== undefined) { fields.push('email = ?'); params.push(email); }
    if (full_name !== undefined || name !== undefined) { fields.push('full_name = ?'); params.push(full_name || name); }
    if (role !== undefined) { fields.push('role = ?'); params.push(role); }
    const hash = password_hash || password;
    if (hash !== undefined && hash) { fields.push('password_hash = ?'); params.push(hash); }
    if (fields.length === 0) return false;
    params.push(id);
    const result = await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const result = await execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async findById(id) {
    const rows = await query(
      'SELECT id, email, full_name, full_name as name, role, failed_attempts, locked_until, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  isAccountLocked(user) {
    if (!user || !user.locked_until) return false;
    return new Date(user.locked_until) > new Date();
  },

  async recordFailedAttempt(userId, currentAttempts) {
    const nextAttempts = currentAttempts + 1;

    if (nextAttempts >= 5) {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await execute(
        'UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?',
        [nextAttempts, lockedUntil, userId]
      );
      return { isLocked: true, lockedUntil, attemptsLeft: 0 };
    }

    await execute(
      'UPDATE users SET failed_attempts = ? WHERE id = ?',
      [nextAttempts, userId]
    );
    return { isLocked: false, lockedUntil: null, attemptsLeft: 5 - nextAttempts };
  },

  async resetFailedAttempts(userId) {
    await execute(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?',
      [userId]
    );
  },

  async updatePassword(userId, newPasswordHash) {
    await execute(
      'UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?',
      [newPasswordHash, userId]
    );
  },

  async countSuperAdmins() {
    const rows = await query("SELECT COUNT(*) as total FROM users WHERE role = 'superadmin'");
    return rows[0] ? parseInt(rows[0].total, 10) : 0;
  },

  async canDeleteUser(userId) {
    const user = await this.findById(userId);
    if (!user) {
      return { canDelete: false, message: 'Pengguna tidak ditemukan.' };
    }
    if (user.role === 'superadmin') {
      const superadminCount = await this.countSuperAdmins();
      if (superadminCount <= 1) {
        return {
          canDelete: false,
          message: 'Tidak dapat menghapus Superadmin terakhir dalam sistem.'
        };
      }
    }
    return { canDelete: true };
  },

  async canDemoteUser(userId, targetRole) {
    const user = await this.findById(userId);
    if (!user) {
      return { canDemote: false, message: 'Pengguna tidak ditemukan.' };
    }
    if (user.role === 'superadmin' && targetRole !== 'superadmin') {
      const superadminCount = await this.countSuperAdmins();
      if (superadminCount <= 1) {
        return {
          canDemote: false,
          message: 'Tidak dapat menurunkan role Superadmin terakhir dalam sistem.'
        };
      }
    }
    return { canDemote: true };
  }
};

export default userModel;
