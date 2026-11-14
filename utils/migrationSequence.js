const LEGACY_FROZEN_011 = new Set([
  '011_drop_product_is_featured.sql',
  '011_revisi_footer_wa_filter_v1.sql'
]);

const MIGRATION_FILE_RE = /^(\d{3})_[a-zA-Z0-9_]+\.sql$/;

/**
 * Validates that database migration filenames keep strictly sequential 3-digit prefixes.
 * Preserves the already-applied legacy 011 pair while rejecting any new duplicates.
 * @param {string[]} files Sorted list of migration filenames
 */
export function validateMigrationSequence(files = []) {
  const seenPrefixes = new Map();

  for (const file of files) {
    const match = MIGRATION_FILE_RE.exec(file);
    if (!match) {
      throw new Error(`Format nama migrasi tidak valid: ${file}`);
    }

    const prefix = match[1];
    const prior = seenPrefixes.get(prefix);
    seenPrefixes.set(prefix, file);
    if (!prior) continue;

    const bothFrozen011 = prefix === '011' && LEGACY_FROZEN_011.has(prior) && LEGACY_FROZEN_011.has(file);
    if (!bothFrozen011) {
      throw new Error(`Duplikat prefix migrasi ${prefix}: ${prior} dan ${file}`);
    }
  }

  return true;
}

export default { validateMigrationSequence };
