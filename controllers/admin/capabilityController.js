import {
  listCapabilities,
  createCapability,
  updateCapability,
  deleteCapability
} from '../../services/capabilityService.js';
import logger from '../../utils/logger.js';

const capabilityRedirect = (res, type, message) =>
  res.redirect(`/admin/capabilities?${type}=${encodeURIComponent(message)}`);

export const capabilityController = {
  async index(req, res) {
    try {
      const capabilities = await listCapabilities();
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
      res.redirect('/admin/dashboard?error=' + encodeURIComponent('Gagal memuat data kapabilitas.'));
    }
  },

  async store(req, res) {
    try {
      const result = await createCapability(req.body, req.file);
      if (result.status !== 'ok') return capabilityRedirect(res, 'error', result.error);
      return capabilityRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Capability store error:', { message: err.message });
      return capabilityRedirect(res, 'error', 'Gagal menyimpan data kapabilitas.');
    }
  },

  async update(req, res) {
    try {
      const result = await updateCapability(req.params.id, req.body, req.file);
      if (result.status !== 'ok') return capabilityRedirect(res, 'error', result.error);
      return capabilityRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Capability update error:', { message: err.message });
      return capabilityRedirect(res, 'error', 'Gagal memperbarui data kapabilitas.');
    }
  },

  async destroy(req, res) {
    try {
      const result = await deleteCapability(req.params.id);
      if (result.status !== 'ok') return capabilityRedirect(res, 'error', result.error);
      return capabilityRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Capability destroy error:', { message: err.message });
      return capabilityRedirect(res, 'error', 'Gagal menghapus data kapabilitas.');
    }
  }
};

export default capabilityController;
