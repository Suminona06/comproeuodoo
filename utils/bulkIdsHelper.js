export const MAX_BULK_DELETE_IDS = 100;

function parsePositiveIntId(value) {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^[1-9]\d*$/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function collectUniquePositiveIds(rawIds) {
  const unique = new Set();
  for (const item of rawIds) {
    const id = parsePositiveIntId(item);
    if (id === null) return null;
    unique.add(id);
  }
  return [...unique];
}

export function parseBulkIds(rawBody, { max = MAX_BULK_DELETE_IDS } = {}) {
  const rawIds = rawBody?.ids ?? rawBody?.['ids[]'];
  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    return { status: 'validation_error', error: 'Pilih minimal 1 item untuk dihapus.' };
  }

  const ids = collectUniquePositiveIds(rawIds);
  if (!ids) {
    return { status: 'validation_error', error: 'Daftar ID tidak valid.' };
  }
  if (ids.length > max) {
    return { status: 'validation_error', error: `Maksimal ${max} item dapat dihapus sekaligus.` };
  }

  return { status: 'ok', ids };
}

export default {
  MAX_BULK_DELETE_IDS,
  parseBulkIds
};
