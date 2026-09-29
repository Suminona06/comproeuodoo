import { query, execute } from '../config/database.js';

export const settingModel = {
  /**
   * Get all settings as a key-value dictionary
   * @returns {Promise<Object>} e.g. { company_name: 'PT Euodoo', whatsapp_number: '628...' }
   */
  async getAll() {
    const rows = await query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  },

  /**
   * Get single setting value by key
   * @param {string} key
   * @param {any} defaultValue
   * @returns {Promise<any>}
   */
  async get(key, defaultValue = null) {
    const rows = await query('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1', [key]);
    return rows.length > 0 ? rows[0].setting_value : defaultValue;
  },

  /**
   * Set single setting value
   * @param {string} key
   * @param {string} value
   */
  async set(key, value) {
    await execute(
      `INSERT INTO settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value]
    );
  },

  /**
   * Batch update settings dictionary
   * @param {Object} settingsObj
   */
  async updateMany(settingsObj = {}) {
    for (const [key, value] of Object.entries(settingsObj)) {
      if (value !== undefined) {
        await this.set(key, value);
      }
    }
  }
};

export default settingModel;
