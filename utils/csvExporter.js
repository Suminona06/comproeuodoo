/**
 * Utility to export datasets to standard RFC 4180 CSV format
 * PT Euodoo CMS v2.0
 */

/**
 * Escape a single CSV cell value
 * @param {any} val
 * @returns {string}
 */
export function escapeCsvValue(val) {
  if (val === null || val === undefined) {
    return '""';
  }
  let str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return `"${str}"`;
}

/**
 * Convert array of objects to CSV string
 * @param {Array<{label: string, key: string|Function}>} columns
 * @param {Array<Object>} rows
 * @returns {string}
 */
export function generateCsv(columns, rows) {
  const headerLine = columns.map(col => escapeCsvValue(col.label)).join(',');
  const rowLines = rows.map(row => {
    return columns.map(col => {
      let val;
      if (typeof col.key === 'function') {
        val = col.key(row);
      } else {
        val = row[col.key];
      }
      return escapeCsvValue(val);
    }).join(',');
  });

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Stream CSV response to Express res
 * @param {import('express').Response} res
 * @param {string} filename
 * @param {Array<{label: string, key: string|Function}>} columns
 * @param {Array<Object>} rows
 */
export function sendCsvResponse(res, filename, columns, rows) {
  const csvContent = generateCsv(columns, rows);
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // UTF-8 BOM so Excel opens with proper UTF-8 encoding
  res.write('\uFEFF');
  res.end(csvContent);
}

export default {
  escapeCsvValue,
  generateCsv,
  sendCsvResponse
};
