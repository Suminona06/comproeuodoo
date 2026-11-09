import inquiryModel from '../../models/inquiryModel.js';
import { sendCsvResponse } from '../../utils/csvExporter.js';
import logger from '../../utils/logger.js';

export const inquiryController = {
  async index(req, res) {
    try {
      const { status = 'all', search = '' } = req.query;

      const allowedPerPage = [10, 25, 50, 100];
      const parsedPerPage = parseInt(req.query.per_page, 10);
      const perPage = allowedPerPage.includes(parsedPerPage) ? parsedPerPage : 10;

      const [totalCount, stats] = await Promise.all([
        inquiryModel.countAll({ status, search }),
        inquiryModel.getStats()
      ]);

      const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

      const parsedPage = parseInt(req.query.page, 10);
      let currentPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      const offset = (currentPage - 1) * perPage;

      const inquiries = await inquiryModel.findAll({ status, search, limit: perPage, offset });

      const isAjax = Boolean(
        req.xhr ||
        req.headers.accept?.includes('application/json') ||
        req.headers['x-requested-with'] === 'fetch' ||
        req.query.format === 'json'
      );

      if (isAjax) {
        const renderLocals = {
          ...res.locals,
          inquiries,
          currentPage,
          perPage,
          totalPages,
          totalCount,
          currentStatus: status,
          searchQuery: search,
          pagination: {
            page: currentPage,
            perPage,
            totalRows: totalCount,
            totalPages,
            baseUrl: '/admin/inquiries',
            queryParams: { status, search }
          }
        };

        return req.app.render('admin/inquiries/partials/table-rows', renderLocals, (err, rowsHtml) => {
          if (err) {
            logger.error('Inquiry index ajax render rows error:', err);
            return res.status(500).json({ success: false, message: 'Gagal merender data tabel.' });
          }

          return req.app.render('partials/pagination', renderLocals, (pErr, paginationHtml) => {
            if (pErr) {
              logger.error('Inquiry index ajax render pagination error:', pErr);
              return res.status(500).json({ success: false, message: 'Gagal merender bar paginasi.' });
            }

            return res.json({
              success: true,
              inquiries,
              totalCount,
              totalPages,
              currentPage,
              perPage,
              currentStatus: status,
              searchQuery: search,
              rowsHtml,
              paginationHtml
            });
          });
        });
      }

      res.render('admin/inquiries/index', {
        title: 'Manajemen Permintaan Penawaran (RFQ)',
        pageTitle: 'Inquiry & RFQ Leads',
        activeNav: 'inquiries',
        inquiries,
        totalCount,
        stats,
        currentStatus: status,
        searchQuery: search,
        currentPage,
        perPage,
        totalPages,
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('Inquiry controller index error:', err);
      const isAjax = Boolean(
        req.xhr ||
        req.headers.accept?.includes('application/json') ||
        req.headers['x-requested-with'] === 'fetch' ||
        req.query.format === 'json'
      );
      if (isAjax) {
        return res.status(500).json({ success: false, message: 'Gagal memuat data inquiry.' });
      }
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
        perPage: 10,
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
