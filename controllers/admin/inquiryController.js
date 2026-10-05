import inquiryModel from '../../models/inquiryModel.js';
import { sendCsvResponse } from '../../utils/csvExporter.js';
import logger from '../../utils/logger.js';

export const inquiryController = {
  async index(req, res) {
    try {
      const { status = 'all', search = '', page = 1 } = req.query;
      const limit = 30;
      const offset = (parseInt(page, 10) - 1) * limit;

      const [inquiries, totalCount, stats] = await Promise.all([
        inquiryModel.findAll({ status, search, limit, offset }),
        inquiryModel.countAll({ status, search }),
        inquiryModel.getStats()
      ]);

      res.render('admin/inquiries/index', {
        title: 'Manajemen Permintaan Penawaran (RFQ)',
        pageTitle: 'Inquiry & RFQ Leads',
        activeNav: 'inquiries',
        inquiries,
        totalCount,
        stats,
        currentStatus: status,
        searchQuery: search,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalCount / limit) || 1,
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('Inquiry controller index error:', err);
      res.status(500).render('admin/inquiries/index', {
        title: 'Inquiry Leads',
        pageTitle: 'Inquiry & RFQ',
        activeNav: 'inquiries',
        inquiries: [],
        totalCount: 0,
        stats: { total: 0, baru: 0, dibaca: 0, ditindaklanjuti: 0, ditolak: 0 },
        currentStatus: 'all',
        searchQuery: '',
        currentPage: 1,
        totalPages: 1,
        error: 'Gagal memuat data inquiry.'
      });
    }
  },

  async detail(req, res) {
    try {
      const inquiry = await inquiryModel.findById(req.params.id);
      if (!inquiry) {
        return res.redirect('/admin/inquiries?error=' + encodeURIComponent('Inquiry tidak ditemukan.'));
      }

      // Auto-mark as 'dibaca' if currently 'baru'
      if (inquiry.status === 'baru') {
        await inquiryModel.updateStatus(inquiry.id, 'dibaca');
        inquiry.status = 'dibaca';
      }

      res.render('admin/inquiries/detail', {
        title: 'Detail RFQ - ' + inquiry.name,
        pageTitle: 'Detail Permintaan RFQ',
        activeNav: 'inquiries',
        inquiry,
        error: null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('Inquiry controller detail error:', err);
      res.redirect('/admin/inquiries?error=' + encodeURIComponent('Gagal membuka rincian inquiry.'));
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;

      const inquiry = await inquiryModel.findById(id);
      if (!inquiry) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(404).json({ success: false, message: 'Inquiry tidak ditemukan.' });
        }
        return res.redirect('/admin/inquiries?error=' + encodeURIComponent('Inquiry tidak ditemukan.'));
      }

      const newStatus = status || inquiry.status;
      await inquiryModel.updateStatus(id, newStatus, admin_notes);

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true, status: newStatus, message: 'Status berhasil diperbarui.' });
      }

      res.redirect('/admin/inquiries/' + id + '?success=' + encodeURIComponent('Status inquiry berhasil diperbarui.'));
    } catch (err) {
      logger.error('Inquiry updateStatus error:', err);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.redirect('/admin/inquiries?error=' + encodeURIComponent('Gagal memperbarui status.'));
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await inquiryModel.delete(id);
      res.redirect('/admin/inquiries?success=' + encodeURIComponent('Inquiry berhasil dihapus.'));
    } catch (err) {
      logger.error('Inquiry destroy error:', err);
      res.redirect('/admin/inquiries?error=' + encodeURIComponent('Gagal menghapus inquiry.'));
    }
  },

  async exportCsv(req, res) {
    try {
      const { status } = req.query;
      const inquiries = await inquiryModel.findAll({ status: status && status !== 'all' ? status : null });

      const columns = [
        { label: 'ID Inquiry', key: 'id' },
        { label: 'Waktu Masuk', key: r => new Date(r.created_at).toLocaleString('id-ID') },
        { label: 'Nama Klien (PIC)', key: 'name' },
        { label: 'Perusahaan', key: r => r.company || '-' },
        { label: 'Alamat Email', key: 'email' },
        { label: 'Nomor Telepon / WhatsApp', key: 'phone' },
        { label: 'Produk Terkait', key: r => r.product_name_id || 'Umum' },
        { label: 'Pesan / Rincian Kebutuhan', key: 'message' },
        { label: 'Status', key: 'status' },
        { label: 'Catatan Internal Admin', key: r => r.admin_notes || '-' },
        { label: 'Alamat IP Pengirim', key: 'ip_address' }
      ];

      const filename = `inquiries-rfq-euodoo-${new Date().toISOString().slice(0, 10)}.csv`;
      sendCsvResponse(res, filename, columns, inquiries);
    } catch (err) {
      logger.error('Inquiry export CSV error:', err);
      res.redirect('/admin/inquiries?error=' + encodeURIComponent('Gagal mengekspor data inquiry ke CSV.'));
    }
  }
};

export default inquiryController;
