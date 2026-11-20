import {
  getLeadListData,
  updateLeadStatus,
  getLeadCsvExportPayload
} from '../../services/leadService.js';
import { sendCsvResponse } from '../../utils/csvExporter.js';
import logger from '../../utils/logger.js';

const isAjaxRequest = (req) => Boolean(
  req.xhr || req.headers?.accept?.includes('application/json') || req.is?.('json')
);

function respondLeadStatusUpdate(res, isAjax, id, result) {
  if (result.status === 'validation_error') {
    return isAjax
      ? res.status(400).json({ success: false, message: result.error })
      : res.redirect('/admin/leads?error=Status+tidak+valid.');
  }
  return isAjax
    ? res.json({ success: true, message: result.message, status: result.newStatus, id })
    : res.redirect('/admin/leads?success=Status+lead+berhasil+diperbarui.');
}

export const leadController = {
  async index(req, res) {
    try {
      const data = await getLeadListData(req.query);
      return res.render('admin/leads/index', {
        title: 'Pemantauan Lead B2B & RFQ - PT Euodoo CMS',
        activeNav: 'leads',
        ...data,
        error: req.query.error || null,
        success: req.query.success || null,
        csrfToken: res.locals.csrfToken || ''
      });
    } catch (err) {
      logger.error('Lead index error:', { message: err.message });
      return res.redirect('/admin/dashboard?error=Gagal+memuat+data+leads.');
    }
  },

  async updateStatus(req, res) {
    const { id } = req.params;
    const isAjax = isAjaxRequest(req);
    try {
      const result = await updateLeadStatus(id, req.body);
      if (result.status === 'ok') logger.info(`Lead #${id} status updated to: ${result.newStatus}`);
      return respondLeadStatusUpdate(res, isAjax, id, result);
    } catch (err) {
      logger.error('Lead updateStatus error:', { message: err.message });
      return isAjax
        ? res.status(500).json({ success: false, message: err.message })
        : res.redirect(`/admin/leads?error=${encodeURIComponent(err.message)}`);
    }
  },

  async exportCsv(req, res) {
    try {
      const { filename, columns, leads } = await getLeadCsvExportPayload();
      return sendCsvResponse(res, filename, columns, leads);
    } catch (err) {
      logger.error('Lead exportCsv error:', { message: err.message });
      return res.redirect('/admin/leads?error=Gagal+mengunduh+berkas+CSV.');
    }
  }
};

export default leadController;
