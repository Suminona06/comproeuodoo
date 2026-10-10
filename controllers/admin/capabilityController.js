import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import capabilityModel from '../../models/capabilityModel.js';
import { processAndSaveWebP } from '../../middleware/uploadMiddleware.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export const capabilityController = {
  async index(req, res) {
    try {
      const capabilities = await capabilityModel.findAll(false);
      res.render('admin/capabilities/index', {
        title: 'Manajemen Kapabilitas Mesin - PT Euodoo CMS',
        activeNav: 'capabilities',
        capabilities,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Capability index error:', { message: err.message });
      res.redirect('/admin/dashboard?error=Gagal+memuat+data+kapabilitas.');
    }
  },

  async store(req, res) {
    try {
      const { title_id, title_en, machine_type, capacity, description_id, description_en, sort_order, is_active } = req.body;

      if (!title_id || !machine_type) {
        return res.redirect('/admin/capabilities?error=Judul+dan+tipe+mesin+wajib+diisi.');
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = await processAndSaveWebP(req.file.buffer, 'products', { maxWidth: 1200, maxHeight: 800, quality: 80 });
      } else if (req.body.image_url) {
        imageUrl = req.body.image_url.trim();
      }

      await capabilityModel.create({
        title_id,
        title_en: title_en || title_id,
        machine_type,
        capacity,
        description_id,
        description_en,
        image_url: imageUrl,
        sort_order: parseInt(sort_order || '0', 10),
        is_active: is_active === '0' ? 0 : 1
      });

      return res.redirect('/admin/capabilities?success=Kapabilitas+mesin+berhasil+ditambahkan.');
    } catch (err) {
      logger.error('Capability store error:', { message: err.message });
      return res.redirect(`/admin/capabilities?error=${encodeURIComponent(err.message)}`);
    }
  },

  async update(req, res) {
    const { id } = req.params;
    try {
      const { title_id, title_en, machine_type, capacity, description_id, description_en, sort_order, is_active } = req.body;

      const updateData = {
        title_id,
        title_en: title_en || title_id,
        machine_type,
        capacity,
        description_id,
        description_en,
        sort_order: parseInt(sort_order || '0', 10),
        is_active: is_active === '0' ? 0 : 1
      };

      if (req.file) {
        updateData.image_url = await processAndSaveWebP(req.file.buffer, 'products', { maxWidth: 1200, maxHeight: 800, quality: 80 });
      } else if (req.body.image_url !== undefined) {
        updateData.image_url = req.body.image_url ? req.body.image_url.trim() : null;
      }

      await capabilityModel.update(id, updateData);

      return res.redirect('/admin/capabilities?success=Data+kapabilitas+berhasil+diperbarui.');
    } catch (err) {
      logger.error('Capability update error:', { message: err.message });
      return res.redirect(`/admin/capabilities?error=${encodeURIComponent(err.message)}`);
    }
  },

  async destroy(req, res) {
    const { id } = req.params;
    try {
      await capabilityModel.delete(id);
      return res.redirect('/admin/capabilities?success=Data+kapabilitas+berhasil+dihapus.');
    } catch (err) {
      logger.error('Capability destroy error:', { message: err.message });
      return res.redirect(`/admin/capabilities?error=${encodeURIComponent(err.message)}`);
    }
  }
};

export default capabilityController;
