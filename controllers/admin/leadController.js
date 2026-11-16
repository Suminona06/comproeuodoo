import leadModel from '../../models/leadModel.js';
import { sendCsvResponse } from '../../utils/csvExporter.js';
import logger from '../../utils/logger.js';

export const leadController = {
  /**
   * List all leads with filter
   */
  async index(req, res) {
    try {
      const status = req.query.status || null;
      const type = req.query.type || null;

      const leads = await leadModel.findAll({ status, type });

      res.render('admin/leads/index', {
        title: 'Pemantauan Lead B2B & RFQ - PT Euodoo CMS',
        activeNav: 'leads',
        leads,
        selectedStatus: status,
        selectedType: type,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Lead index error:', { message: err.message });
      res.redirect('/admin/dashboard?error=Gagal+memuat+data+leads.');
    }
  },

  /**
   * Update lead status & admin notes
   */
  async updateStatus(req, res) {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const isAjax = req.xhr || req.headers.accept?.includes('application/json') || req.is('json');

    try {
      const validStatuses = ['baru', 'diproses', 'selesai', 'ditolak'];
      if (!validStatuses.includes(status)) {
        if (isAjax) {
          return res.status(400).json({ success: false, message: 'Status tidak valid.' });
        }
        return res.redirect('/admin/leads?error=Status+tidak+valid.');
      }

      await leadModel.updateStatus(id, status, admin_notes || null);
      logger.info(`Lead #${id} status updated to: ${status}`);

      if (isAjax) {
        return res.json({ success: true, message: 'Status lead berhasil diperbarui.', status, id });
      }

      return res.redirect('/admin/leads?success=Status+lead+berhasil+diperbarui.');
    } catch (err) {
      logger.error('Lead updateStatus error:', { message: err.message });
      if (isAjax) {
        return res.status(500).json({ success: false, message: err.message });
      }
      return res.redirect(`/admin/leads?error=${encodeURIComponent(err.message)}`);
    }
  },

  /**
   * Export all leads to CSV file with formula neutralization and UTF-8 BOM
   */
  async exportCsv(req, res) {
    try {
      const leads = await leadModel.exportAll();
      const columns = [
        { label: 'ID', key: 'id' },
        { label: 'Tanggal Masuk', key: (r) => new Date(r.tanggal).toISOString().replace('T', ' ').substring(0, 19) },
        { label: 'Jenis Inquiry', key: 'jenis_inquiry' },
        { label: 'Nama Lengkap', key: 'nama' },
        { label: 'Perusahaan', key: 'perusahaan' },
        { label: 'Email', key: 'email' },
        { label: 'Telepon', key: 'telepon' },
        { label: 'Produk Terkait', key: 'produk_terkait' },
        { label: 'Estimasi Kuantitas', key: 'estimasi_kuantitas' },
        { label: 'Pesan Kebutuhan', key: 'pesan' },
        { label: 'Status', key: 'status' },
        { label: 'Catatan Admin', key: 'catatan_admin' }
      ];
      const filename = `leads-pt-euodoo-${new Date().toISOString().substring(0, 10)}.csv`;
      return sendCsvResponse(res, filename, columns, leads);
    } catch (err) {
      logger.error('Lead exportCsv error:', { message: err.message });
      return res.redirect('/admin/leads?error=Gagal+mengunduh+berkas+CSV.');
    }
  }
};

export default leadController;
