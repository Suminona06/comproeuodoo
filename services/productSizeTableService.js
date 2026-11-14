import { normalizeSizeTable } from '../models/productModel.js';
import { query } from '../config/database.js';

const LEGACY_COLUMNS = [
  { id: 'col_1', label: 'Kode Produk' },
  { id: 'col_2', label: 'Lebar' },
  { id: 'col_3', label: 'Panjang' },
  { id: 'col_4', label: 'Tebal (Micron)' },
  { id: 'col_5', label: 'Kapasitas' },
  { id: 'col_6', label: 'Bahan' }
];

const toArray = (val) => (Array.isArray(val) ? val : [val || '']);

function buildLegacyRow(fields, idx) {
  const vals = fields.map((arr) => String(arr[idx] || '').trim());
  if (!vals.some(Boolean)) return null;
  return { col_1: vals[0], col_2: vals[1], col_3: vals[2], col_4: vals[3], col_5: vals[4], col_6: vals[5] };
}

function buildLegacyFormRows(body) {
  const fields = [
    toArray(body.kode_produk || body.size_code),
    toArray(body.lebar || body.size_width),
    toArray(body.panjang || body.size_length),
    toArray(body.tebal_micron || body.size_thickness),
    toArray(body.kapasitas || body.size_capacity),
    toArray(body.bahan || body.size_material)
  ];
  const maxLen = Math.max(...fields.map((arr) => arr.length));
  const legacyRows = [];

  for (let i = 0; i < maxLen; i++) {
    const row = buildLegacyRow(fields, i);
    if (row) legacyRows.push(row);
  }
  return legacyRows;
}

function hasLegacySizeFields(body) {
  const keys = ['kode_produk', 'size_code', 'lebar', 'size_width', 'panjang', 'size_length', 'tebal_micron', 'size_thickness', 'kapasitas', 'size_capacity', 'bahan', 'size_material'];
  return keys.some((k) => body[k] !== undefined);
}

function parseJsonSizeTableString(rawStr) {
  const trimmed = rawStr.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error('Format data tabel ukuran tidak valid (JSON malformed).');
  }
}

function resolveRawSizeTable(body) {
  if (body.size_table !== undefined && body.size_table !== null) {
    if (typeof body.size_table === 'string') return parseJsonSizeTableString(body.size_table);
    return typeof body.size_table === 'object' ? body.size_table : null;
  }
  if (!hasLegacySizeFields(body)) return null;
  const legacyRows = buildLegacyFormRows(body);
  return legacyRows.length > 0 ? { columns: LEGACY_COLUMNS, rows: legacyRows } : null;
}

function sanitizeColumns(rawColumns) {
  const cleanColumns = [];
  const incomingMap = {};

  for (let i = 0; i < rawColumns.length; i++) {
    const col = rawColumns[i];
    if (!col || typeof col !== 'object') throw new Error(`Definisi kolom ke-${i + 1} tidak valid.`);
    const cleanLabel = String(col.label ?? '').replace(/<[^>]*>/g, '').trim();
    if (!cleanLabel) throw new Error('Label kolom tabel ukuran tidak boleh kosong.');
    if (cleanLabel.length > 40) throw new Error(`Label kolom "${cleanLabel.slice(0, 20)}..." melebihi batas maksimal 40 karakter.`);

    const canonicalId = `col_${i + 1}`;
    cleanColumns.push({ id: canonicalId, label: cleanLabel });
    if (col.id) incomingMap[String(col.id).trim()] = canonicalId;
    incomingMap[canonicalId] = canonicalId;
    incomingMap[cleanLabel] = canonicalId;
  }

  return { cleanColumns, incomingMap };
}

function readRowCell(row, canonicalId, incomingMap) {
  if (row[canonicalId] !== undefined) return row[canonicalId];
  for (const [incId, targetId] of Object.entries(incomingMap)) {
    if (targetId === canonicalId && row[incId] !== undefined) return row[incId];
  }
  return '';
}

function sanitizeCellValue(row, col, incomingMap, rIdx) {
  const val = readRowCell(row, col.id, incomingMap);
  const cleanCell = String(val ?? '').replace(/<[^>]*>/g, '').trim();
  if (cleanCell.length > 80) {
    throw new Error(`Isi sel pada kolom "${col.label}" baris ${rIdx + 1} melebihi batas maksimal 80 karakter.`);
  }
  return cleanCell;
}

function buildSanitizedRow(row, cleanColumns, incomingMap, rIdx) {
  const cleanRow = {};
  for (const col of cleanColumns) {
    cleanRow[col.id] = sanitizeCellValue(row, col, incomingMap, rIdx);
  }
  return cleanRow;
}

function sanitizeRows(rawRows, cleanColumns, incomingMap) {
  const cleanRows = [];
  for (let rIdx = 0; rIdx < rawRows.length; rIdx++) {
    const row = rawRows[rIdx];
    if (row && typeof row === 'object') {
      cleanRows.push(buildSanitizedRow(row, cleanColumns, incomingMap, rIdx));
    }
  }
  return cleanRows;
}

function normalizeRawSizeTableInput(raw) {
  if (!Array.isArray(raw)) return raw;
  return raw.length === 0 ? null : { columns: LEGACY_COLUMNS, rows: raw };
}

export function parseDynamicSizeTable(body) {
  if (!body || typeof body !== 'object') return null;
  const raw = normalizeRawSizeTableInput(resolveRawSizeTable(body));
  if (!raw) return null;

  const rawColumns = Array.isArray(raw.columns) ? raw.columns : [];
  const rawRows = Array.isArray(raw.rows) ? raw.rows : [];
  if (rawColumns.length === 0 && rawRows.length === 0) return null;
  if (rawColumns.length < 1) throw new Error('Tabel ukuran minimal memiliki 1 kolom.');
  if (rawColumns.length > 8) throw new Error('Tabel ukuran maksimal memiliki 8 kolom.');
  if (rawRows.length > 30) throw new Error('Tabel ukuran maksimal memiliki 30 baris.');

  const { cleanColumns, incomingMap } = sanitizeColumns(rawColumns);
  const cleanRows = sanitizeRows(rawRows, cleanColumns, incomingMap);
  return { columns: cleanColumns, rows: cleanRows };
}

export const parseSizeTable = parseDynamicSizeTable;

export async function getProductsWithSizeTable(excludeId = null) {
  const sql = `
    SELECT id, name_id, name_en FROM products
    WHERE status = "published"
      ${excludeId ? 'AND id != ?' : ''}
      AND size_table IS NOT NULL
      AND JSON_VALID(size_table) = 1
      AND (
        JSON_EXTRACT(size_table, '$.columns[0]') IS NOT NULL
        OR JSON_EXTRACT(size_table, '$[0]') IS NOT NULL
      )
    ORDER BY name_id ASC
  `;
  return excludeId ? query(sql, [excludeId]) : query(sql);
}

function registerProductDynamicColumns(map, product) {
  const st = normalizeSizeTable(product.size_table);
  for (const col of st?.columns || []) {
    const label = String(col.label || '').trim();
    const normKey = label.toLowerCase();
    if (label && !map.has(normKey)) map.set(normKey, { normKey, label });
  }
}

function collectDynamicColumns(products) {
  const map = new Map();
  for (const product of products) registerProductDynamicColumns(map, product);
  return map;
}

function buildExportBaseRow(product) {
  return {
    id: product.id,
    slug: product.slug,
    name_id: product.name_id,
    name_en: product.name_en,
    category_name_id: product.category_name_id || 'Tidak Berkategori',
    cta_text_id: product.cta_text_id || '',
    cta_text_en: product.cta_text_en || '',
    status: product.status || '',
    image_url: product.image_url || '',
    created_at: product.created_at || ''
  };
}

function buildKeyToColId(sizeTable) {
  const keyToColId = {};
  for (const col of sizeTable?.columns || []) {
    const key = String(col.label || '').trim().toLowerCase();
    if (key) keyToColId[key] = col.id;
  }
  return keyToColId;
}

function buildDynamicExportRow(baseRow, sRow, keyToColId, dynamicColumnsMap) {
  const row = { ...baseRow };
  for (const dyn of dynamicColumnsMap.values()) {
    const colId = keyToColId[dyn.normKey];
    const cellVal = colId && sRow ? sRow[colId] : null;
    row[`__dyn_${dyn.normKey}`] = cellVal != null ? String(cellVal) : '';
  }
  return row;
}

function mapProductSizeExportRows(product, dynamicColumnsMap) {
  const st = normalizeSizeTable(product.size_table);
  const baseRow = buildExportBaseRow(product);
  const sizeRows = Array.isArray(st?.rows) ? st.rows : [];
  if (sizeRows.length === 0) return [buildDynamicExportRow(baseRow, null, {}, dynamicColumnsMap)];

  const keyToColId = buildKeyToColId(st);
  return sizeRows.map((sRow) => buildDynamicExportRow(baseRow, sRow, keyToColId, dynamicColumnsMap));
}

export function buildProductCsvExport(products) {
  const dynamicColumnsMap = collectDynamicColumns(products);
  const columns = [
    { label: 'ID', key: 'id' },
    { label: 'Slug', key: 'slug' },
    { label: 'Nama Produk (ID)', key: 'name_id' },
    { label: 'Nama Produk (EN)', key: 'name_en' },
    { label: 'Kategori', key: (r) => r.category_name_id || 'Tidak Berkategori' },
    { label: 'Teks CTA (ID)', key: (r) => r.cta_text_id || '' },
    { label: 'Teks CTA (EN)', key: (r) => r.cta_text_en || '' },
    { label: 'Status', key: 'status' },
    { label: 'URL Gambar', key: (r) => r.image_url || '' },
    { label: 'Dibuat Pada', key: (r) => (r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || '')) }
  ];

  for (const dyn of dynamicColumnsMap.values()) {
    columns.push({ label: dyn.label, key: `__dyn_${dyn.normKey}` });
  }

  const rows = products.flatMap((p) => mapProductSizeExportRows(p, dynamicColumnsMap));
  return { columns, rows };
}
