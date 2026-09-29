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
   * Find user by ID (excludes password_hash for security)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const rows = await query(
      'SELECT id, email, full_name, role, failed_attempts, locked_until, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
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
  }
};

export default userModel;
