import leadModel from '../../models/leadModel.js';
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
   * Export all leads to CSV file with UTF-8 BOM
   */
  async exportCsv(req, res) {
    try {
      const leads = await leadModel.exportAll();

      const headers = [
        'ID',
        'Tanggal Masuk',
        'Jenis Inquiry',
        'Nama Lengkap',
        'Perusahaan',
        'Email',
        'Telepon',
        'Produk Terkait',
        'Estimasi Kuantitas',
        'Pesan Kebutuhan',
        'Status',
        'Catatan Admin'
      ];

      const csvRows = [headers.join(',')];

      leads.forEach((row) => {
        const values = [
          row.id,
          `"${new Date(row.tanggal).toISOString().replace('T', ' ').substring(0, 19)}"`,
          `"${row.jenis_inquiry}"`,
          `"${(row.nama || '').replace(/"/g, '""')}"`,
          `"${(row.perusahaan || '').replace(/"/g, '""')}"`,
          `"${(row.email || '').replace(/"/g, '""')}"`,
          `"${(row.telepon || '').replace(/"/g, '""')}"`,
          `"${(row.produk_terkait || '').replace(/"/g, '""')}"`,
          `"${(row.estimasi_kuantitas || '').replace(/"/g, '""')}"`,
          `"${(row.pesan || '').replace(/"/g, '""')}"`,
          `"${row.status}"`,
          `"${(row.catatan_admin || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(values.join(','));
      });

      // UTF-8 BOM for Microsoft Excel compatibility
      const bom = '\uFEFF';
      const csvContent = bom + csvRows.join('\r\n');

      const timestamp = new Date().toISOString().substring(0, 10);
      const filename = `leads-pt-euodoo-${timestamp}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvContent);
    } catch (err) {
      logger.error('Lead exportCsv error:', { message: err.message });
      return res.redirect('/admin/leads?error=Gagal+mengunduh+berkas+CSV.');
    }
  }
};

export default leadController;
