import { pool, query, execute } from '../config/database.js';

export const userModel = {
  /**
   * Find user by email (includes password_hash for authentication)
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Find all users (excluding password_hash)
   */
  async findAll() {
    return await query(
      'SELECT id, email, full_name, full_name as name, role, failed_attempts, locked_until, created_at, updated_at FROM users ORDER BY id ASC'
    );
  },

  /**
   * Create new user
   */
  async create({ email, password_hash, password, full_name, name, role = 'admin' }) {
    const hash = password_hash || password;
    const fullName = full_name || name;
    const sql = 'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)';
    const result = await execute(sql, [email, hash, fullName, role]);
    return result.insertId;
  },

  /**
   * Update existing user
   */
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

  /**
   * Delete user by ID
   */
  async delete(id) {
    const result = await execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Find user by ID (excludes password_hash for security)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const rows = await query(
      'SELECT id, email, full_name, full_name as name, role, failed_attempts, locked_until, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Check if account is currently locked due to failed attempts
   * @param {Object} user
   * @returns {boolean}
   */
  isAccountLocked(user) {
    if (!user || !user.locked_until) return false;
    return new Date(user.locked_until) > new Date();
  },

  /**
   * Register failed login attempt and lock for 15 minutes if attempts >= 5
   * @param {number} userId
   * @param {number} currentAttempts
   * @returns {Promise<Object>} updated status
   */
  async recordFailedAttempt(userId, currentAttempts) {
    const nextAttempts = currentAttempts + 1;
    let lockedUntil = null;

    if (nextAttempts >= 5) {
      // Lock account for 15 minutes
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
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

  /**
   * Reset failed attempts upon successful login
   * @param {number} userId
   * @returns {Promise<void>}
   */
  async resetFailedAttempts(userId) {
    await execute(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?',
      [userId]
    );
  },

  /**
   * Update user password hash
   * @param {number} userId
   * @param {string} newPasswordHash
   * @returns {Promise<void>}
   */
  async updatePassword(userId, newPasswordHash) {
    await execute(
      'UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?',
      [newPasswordHash, userId]
    );
  },

  /**
   * Count total active superadmin accounts
   * @returns {Promise<number>}
   */
  async countSuperAdmins() {
    const rows = await query("SELECT COUNT(*) as total FROM users WHERE role = 'superadmin'");
    return rows[0] ? parseInt(rows[0].total, 10) : 0;
  },

  /**
   * Check if a user can be safely deleted without removing the last superadmin
   * @param {number} userId
   * @returns {Promise<{ canDelete: boolean, message?: string }>}
   */
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

  /**
   * Check if a user can be demoted from superadmin
   * @param {number} userId
   * @param {string} targetRole
   * @returns {Promise<{ canDemote: boolean, message?: string }>}
   */
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
