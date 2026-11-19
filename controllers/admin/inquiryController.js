import {
  buildEmptyInquiryListData,
  getInquiryListData,
  getInquiryDetailAndMarkRead,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryCsvExportPayload
} from '../../services/inquiryService.js';
import { sendCsvResponse } from '../../utils/csvExporter.js';
import logger from '../../utils/logger.js';

const inquiryRedirect = (res, type, message, subPath = '') =>
  res.redirect(`/admin/inquiries${subPath}?${type}=${encodeURIComponent(message)}`);

const wantsJson = (req) => Boolean(req.xhr || req.headers?.accept?.includes('application/json'));

function isAjaxRequest(req) {
  if (wantsJson(req) || req.query?.format === 'json') return true;
  return req.headers?.['x-requested-with'] === 'fetch';
}

function renderPartialAsync(app, view, locals) {
  return new Promise((resolve, reject) => {
    app.render(view, locals, (err, html) => {
      if (err) return reject(err);
      resolve(html);
    });
  });
}

function buildAjaxRenderLocals(resLocals, data) {
  return {
    ...resLocals,
    ...data,
    pagination: {
      page: data.currentPage,
      perPage: data.perPage,
      totalRows: data.totalCount,
      totalPages: data.totalPages,
      baseUrl: '/admin/inquiries',
      queryParams: { status: data.currentStatus, search: data.searchQuery }
    }
  };
}

async function respondAjaxInquiryIndex(req, res, data) {
  const renderLocals = buildAjaxRenderLocals(res.locals, data);
  const [rowsHtml, paginationHtml] = await Promise.all([
    renderPartialAsync(req.app, 'admin/inquiries/partials/table-rows', renderLocals),
    renderPartialAsync(req.app, 'partials/pagination', renderLocals)
  ]);

  return res.json({
    success: true,
    ...data,
    rowsHtml,
    paginationHtml
  });
}

function respondUpdateStatusResult(res, isJson, id, result) {
  if (result.status === 'not_found') {
    return isJson
      ? res.status(404).json({ success: false, message: result.error })
      : inquiryRedirect(res, 'error', result.error);
  }
  if (result.status === 'validation_error') {
    return isJson
      ? res.status(400).json({ success: false, message: result.error })
      : inquiryRedirect(res, 'error', result.error, `/${id}`);
  }
  return isJson
    ? res.json({ success: true, status: result.newStatus, message: result.message })
    : inquiryRedirect(res, 'success', 'Status inquiry berhasil diperbarui.', `/${id}`);
}

export const inquiryController = {
  async index(req, res) {
    const isAjax = isAjaxRequest(req);
    try {
      const data = await getInquiryListData(req.query);
      if (isAjax) {
        return await respondAjaxInquiryIndex(req, res, data);
      }
      return res.render('admin/inquiries/index', {
        title: 'Manajemen Permintaan Penawaran (RFQ)',
        pageTitle: 'Inquiry & RFQ Leads',
        activeNav: 'inquiries',
        ...data,
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('Inquiry controller index error:', err);
      if (isAjax) {
        return res.status(500).json({ success: false, message: 'Gagal memuat data inquiry.' });
      }
      return res.status(500).render('admin/inquiries/index', {
        title: 'Inquiry Leads',
        pageTitle: 'Inquiry & RFQ',
        activeNav: 'inquiries',
        ...buildEmptyInquiryListData()
      });
    }
  },

  async detail(req, res) {
    try {
      const result = await getInquiryDetailAndMarkRead(req.params.id);
      if (result.status === 'not_found') {
        return inquiryRedirect(res, 'error', result.error);
      }
      return res.render('admin/inquiries/detail', {
        title: 'Detail RFQ - ' + result.inquiry.name,
        pageTitle: 'Detail Permintaan RFQ',
        activeNav: 'inquiries',
        inquiry: result.inquiry,
        error: null,
        success: req.query.success || null
      });
    } catch (err) {
      logger.error('Inquiry controller detail error:', err);
      return inquiryRedirect(res, 'error', 'Gagal membuka rincian inquiry.');
    }
  },

  async updateStatus(req, res) {
    const isJson = wantsJson(req);
    try {
      const { id } = req.params;
      const result = await updateInquiryStatus(id, req.body);
      return respondUpdateStatusResult(res, isJson, id, result);
    } catch (err) {
      logger.error('Inquiry updateStatus error:', err);
      return isJson
        ? res.status(500).json({ success: false, message: err.message })
        : inquiryRedirect(res, 'error', 'Gagal memperbarui status.');
    }
  },

  async destroy(req, res) {
    const isJson = wantsJson(req);
    try {
      const result = await deleteInquiry(req.params.id);
      if (result.status === 'not_found') {
        return isJson
          ? res.status(404).json({ success: false, message: result.error })
          : inquiryRedirect(res, 'error', result.error);
      }
      return isJson
        ? res.json({ success: true, message: result.message })
        : inquiryRedirect(res, 'success', result.message);
    } catch (err) {
      logger.error('Inquiry destroy error:', err);
      return isJson
        ? res.status(500).json({ success: false, message: err.message })
        : inquiryRedirect(res, 'error', 'Gagal menghapus inquiry.');
    }
  },

  async exportCsv(req, res) {
    try {
      const { filename, columns, inquiries } = await getInquiryCsvExportPayload(req.query);
      return sendCsvResponse(res, filename, columns, inquiries);
    } catch (err) {
      logger.error('Inquiry export CSV error:', err);
      return inquiryRedirect(res, 'error', 'Gagal mengekspor data inquiry ke CSV.');
    }
  }
};

export default inquiryController;
