import pool from '../config/database.js';
import logger from '../utils/logger.js';

export const slugRedirectModel = {
  /**
   * Cari tujuan redirect 301 berdasarkan tipe entitas dan slug lama
   * @param {string} entityType 
   * @param {string} oldSlug 
   * @returns {Promise<{ id: number, entity_type: string, entity_id: number, old_slug: string, new_slug: string } | null>}
   */
  async findRedirect(entityType, oldSlug) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM slug_redirects WHERE entity_type = ? AND old_slug = ? ORDER BY id DESC LIMIT 1',
        [entityType, oldSlug]
      );
      return rows[0] || null;
    } catch (err) {
      logger.error('slugRedirectModel.findRedirect error:', err);
      return null;
    }
  },

  /**
   * Catat riwayat perubahan slug dan perbarui rantai redirect lama
   * @param {string} entityType 
   * @param {number} entityId 
   * @param {string} oldSlug 
   * @param {string} newSlug 
   */
  async createRedirect(entityType, entityId, oldSlug, newSlug) {
    if (!oldSlug || !newSlug || oldSlug === newSlug) {
      return false;
    }

    try {
      // 1. Simpan baris redirect baru
      await pool.query(
        'INSERT INTO slug_redirects (entity_type, entity_id, old_slug, new_slug) VALUES (?, ?, ?, ?)',
        [entityType, entityId, oldSlug, newSlug]
      );

      // 2. Flatten redirect chains: jika ada entitas lama yang mengarah ke oldSlug, update ke newSlug
      await pool.query(
        'UPDATE slug_redirects SET new_slug = ? WHERE entity_type = ? AND new_slug = ? AND old_slug != ?',
        [newSlug, entityType, oldSlug, newSlug]
      );

      logger.info(`Recorded 301 slug redirect: [${entityType}] '${oldSlug}' -> '${newSlug}'`);
      return true;
    } catch (err) {
      logger.error('slugRedirectModel.createRedirect error:', err);
      return false;
    }
  },

  /**
   * Hapus riwayat redirect untuk entitas tertentu saat entitas dihapus
   */
  async deleteByEntity(entityType, entityId) {
    try {
      await pool.query(
        'DELETE FROM slug_redirects WHERE entity_type = ? AND entity_id = ?',
        [entityType, entityId]
      );
      return true;
    } catch (err) {
      logger.error('slugRedirectModel.deleteByEntity error:', err);
      return false;
    }
  }
};

export default slugRedirectModel;
