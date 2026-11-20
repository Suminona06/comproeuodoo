import leadModel from '../models/leadModel.js';

export const LEAD_STATUSES = ['baru', 'diproses', 'selesai', 'ditolak'];
export const LEAD_TYPES = ['inquiry', 'partnership', 'general'];

export function formatLeadCsvDate(rawDate) {
  if (!rawDate) return '';
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().replace('T', ' ').substring(0, 19);
}

export const LEAD_CSV_COLUMNS = [
  { label: 'ID', key: 'id' },
  { label: 'Tanggal Masuk', key: (r) => formatLeadCsvDate(r.tanggal) },
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

const asString = (val) => (typeof val === 'string' ? val.trim() : '');
const useModel = (deps) => deps?.leadModel || leadModel;

export function isValidLeadStatus(status) {
  return LEAD_STATUSES.includes(asString(status));
}

export function normalizeLeadFilterStatus(rawStatus) {
  const trimmed = asString(rawStatus);
  return LEAD_STATUSES.includes(trimmed) ? trimmed : null;
}

export function normalizeLeadFilterType(rawType) {
  const trimmed = asString(rawType);
  return LEAD_TYPES.includes(trimmed) ? trimmed : null;
}

export function buildLeadCsvFilename(date = new Date()) {
  return `leads-pt-euodoo-${date.toISOString().substring(0, 10)}.csv`;
}

export async function getLeadListData(rawQuery, deps = {}) {
  const query = rawQuery || {};
  const status = normalizeLeadFilterStatus(query.status);
  const type = normalizeLeadFilterType(query.type);
  const leads = await useModel(deps).findAll({ status, type });

  return {
    leads,
    selectedStatus: status,
    selectedType: type
  };
}

export async function updateLeadStatus(id, rawBody, deps = {}) {
  const body = rawBody || {};
  const status = asString(body.status);
  if (!isValidLeadStatus(status)) {
    return { status: 'validation_error', error: 'Status tidak valid.' };
  }

  await useModel(deps).updateStatus(id, status, body.admin_notes || null);
  return {
    status: 'ok',
    newStatus: status,
    message: 'Status lead berhasil diperbarui.'
  };
}

export async function getLeadCsvExportPayload(deps = {}) {
  const leads = await useModel(deps).exportAll();
  return {
    filename: buildLeadCsvFilename(deps?.date),
    columns: LEAD_CSV_COLUMNS,
    leads
  };
}

export default {
  LEAD_STATUSES,
  LEAD_TYPES,
  LEAD_CSV_COLUMNS,
  formatLeadCsvDate,
  isValidLeadStatus,
  normalizeLeadFilterStatus,
  normalizeLeadFilterType,
  buildLeadCsvFilename,
  getLeadListData,
  updateLeadStatus,
  getLeadCsvExportPayload
};
