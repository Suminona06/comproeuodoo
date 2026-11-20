import inquiryModel, { INQUIRY_STATUSES } from '../models/inquiryModel.js';

export { INQUIRY_STATUSES };
export const ALLOWED_PER_PAGE = [10, 25, 50, 100];
export const DEFAULT_PER_PAGE = 10;

export const EMPTY_INQUIRY_STATS = {
  total: 0,
  baru: 0,
  dibaca: 0,
  ditindaklanjuti: 0,
  ditolak: 0
};

export const INQUIRY_CSV_COLUMNS = [
  { label: 'ID Inquiry', key: 'id' },
  { label: 'Waktu Masuk', key: (r) => new Date(r.created_at).toLocaleString('id-ID') },
  { label: 'Nama Klien (PIC)', key: 'name' },
  { label: 'Perusahaan', key: (r) => r.company || '-' },
  { label: 'Alamat Email', key: 'email' },
  { label: 'Nomor Telepon / WhatsApp', key: 'phone' },
  { label: 'Produk Terkait', key: (r) => r.product_name_id || 'Umum' },
  { label: 'Pesan / Rincian Kebutuhan', key: 'message' },
  { label: 'Status', key: 'status' },
  { label: 'Catatan Internal Admin', key: (r) => r.admin_notes || '-' },
  { label: 'Alamat IP Pengirim', key: 'ip_address' }
];

const asString = (val) => (typeof val === 'string' ? val : '');

export function isValidInquiryStatus(status) {
  const trimmed = asString(status).trim();
  return INQUIRY_STATUSES.includes(trimmed);
}

export function normalizeInquiryFilterStatus(rawStatus) {
  const trimmed = asString(rawStatus).trim();
  return INQUIRY_STATUSES.includes(trimmed) ? trimmed : 'all';
}

export function normalizeExportStatus(rawStatus) {
  const trimmed = asString(rawStatus).trim();
  return INQUIRY_STATUSES.includes(trimmed) ? trimmed : null;
}

export function normalizePerPage(rawPerPage) {
  const parsed = parseInt(rawPerPage, 10);
  return ALLOWED_PER_PAGE.includes(parsed) ? parsed : DEFAULT_PER_PAGE;
}

export function clampPageNumber(rawPage, totalPages) {
  const parsed = parseInt(rawPage, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, Math.max(1, totalPages));
}

export function normalizeInquiryQuery(rawQuery) {
  const query = rawQuery || {};
  return {
    status: normalizeInquiryFilterStatus(query.status),
    search: asString(query.search),
    perPage: normalizePerPage(query.per_page),
    rawPage: query.page
  };
}

export function buildEmptyInquiryListData(error = 'Gagal memuat data inquiry.') {
  return {
    inquiries: [],
    totalCount: 0,
    stats: { ...EMPTY_INQUIRY_STATS },
    currentStatus: 'all',
    searchQuery: '',
    currentPage: 1,
    perPage: DEFAULT_PER_PAGE,
    totalPages: 1,
    error
  };
}

export async function getInquiryListData(rawQuery, deps = {}) {
  const model = deps.inquiryModel || inquiryModel;
  const { status, search, perPage, rawPage } = normalizeInquiryQuery(rawQuery);

  const [totalCount, stats] = await Promise.all([
    model.countAll({ status, search }),
    model.getStats()
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const currentPage = clampPageNumber(rawPage, totalPages);
  const offset = (currentPage - 1) * perPage;
  const inquiries = await model.findAll({ status, search, limit: perPage, offset });

  return {
    inquiries,
    totalCount,
    stats,
    currentStatus: status,
    searchQuery: search,
    currentPage,
    perPage,
    totalPages
  };
}

export async function getInquiryDetailAndMarkRead(id, deps = {}) {
  const model = deps.inquiryModel || inquiryModel;
  const inquiry = await model.findById(id);
  if (!inquiry) {
    return { status: 'not_found', error: 'Inquiry tidak ditemukan.' };
  }

  if (inquiry.status === 'baru') {
    await model.updateStatus(inquiry.id, 'dibaca');
    inquiry.status = 'dibaca';
  }
  return { status: 'ok', inquiry };
}

function resolveTargetStatus(rawStatus, currentStatus) {
  const trimmed = asString(rawStatus).trim();
  return trimmed || currentStatus;
}

export async function updateInquiryStatus(id, rawBody, deps = {}) {
  const model = deps.inquiryModel || inquiryModel;
  const body = rawBody || {};
  const inquiry = await model.findById(id);
  if (!inquiry) {
    return { status: 'not_found', error: 'Inquiry tidak ditemukan.' };
  }

  const targetStatus = resolveTargetStatus(body.status, inquiry.status);
  if (!isValidInquiryStatus(targetStatus)) {
    return { status: 'validation_error', error: 'Status inquiry tidak valid.' };
  }

  await model.updateStatus(id, targetStatus, body.admin_notes);
  return {
    status: 'ok',
    newStatus: targetStatus,
    message: 'Status berhasil diperbarui.'
  };
}

export async function deleteInquiry(id, deps = {}) {
  const model = deps.inquiryModel || inquiryModel;
  const inquiry = await model.findById(id);
  if (!inquiry) {
    return { status: 'not_found', error: 'Inquiry tidak ditemukan.' };
  }

  await model.delete(id);
  return { status: 'ok', message: 'Inquiry berhasil dihapus.' };
}

export function buildInquiryCsvFilename(date = new Date()) {
  return `inquiries-rfq-euodoo-${date.toISOString().slice(0, 10)}.csv`;
}

export async function getInquiryCsvExportPayload(rawQuery, deps = {}) {
  const model = deps.inquiryModel || inquiryModel;
  const status = normalizeExportStatus(rawQuery?.status);
  const inquiries = await model.findAll({ status });
  return {
    filename: buildInquiryCsvFilename(deps.date),
    columns: INQUIRY_CSV_COLUMNS,
    inquiries
  };
}

export default {
  INQUIRY_STATUSES,
  ALLOWED_PER_PAGE,
  DEFAULT_PER_PAGE,
  EMPTY_INQUIRY_STATS,
  INQUIRY_CSV_COLUMNS,
  isValidInquiryStatus,
  normalizeInquiryFilterStatus,
  normalizeExportStatus,
  normalizePerPage,
  clampPageNumber,
  normalizeInquiryQuery,
  buildEmptyInquiryListData,
  getInquiryListData,
  getInquiryDetailAndMarkRead,
  updateInquiryStatus,
  deleteInquiry,
  buildInquiryCsvFilename,
  getInquiryCsvExportPayload
};
