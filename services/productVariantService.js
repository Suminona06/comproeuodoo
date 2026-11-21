export const MAX_VARIANT_GROUPS = 5;
export const MAX_OPTIONS_PER_GROUP = 20;
export const MAX_GROUP_NAME_LENGTH = 40;
export const MAX_OPTION_LABEL_LENGTH = 50;

export const VARIANT_PRESETS = {
  warna: { name_id: 'Warna', name_en: 'Color' },
  ukuran: { name_id: 'Ukuran', name_en: 'Size' },
  tipe: { name_id: 'Tipe', name_en: 'Type' },
  jenis: { name_id: 'Jenis', name_en: 'Kind' }
};

export function stripHtml(val) {
  return String(val ?? '').replace(/<[^>]*>/g, '').trim();
}

export function sanitizeVariantId(rawId, prefix, idx) {
  const cleaned = String(rawId ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
  return cleaned || `${prefix}_${idx + 1}`;
}

export function isVariantGroupObject(item) {
  return Boolean(item && typeof item === 'object' && Array.isArray(item.options));
}

function extractLegacyLabel(item) {
  if (typeof item === 'string') return stripHtml(item);
  if (!item || typeof item !== 'object') return '';
  const base = stripHtml(item.size_label || item.name_id || item.label_id || item.name_en || '');
  const thick = stripHtml(item.thickness || '');
  if (!base) return '';
  return thick && !base.includes(thick) ? `${base} (${thick})` : base;
}

export function normalizeLegacyVariantArray(rawList) {
  if (!Array.isArray(rawList) || rawList.length === 0) return [];
  const seen = new Set();
  const options = [];

  for (const item of rawList) {
    const label = extractLegacyLabel(item).slice(0, MAX_OPTION_LABEL_LENGTH);
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    options.push({
      id: `opt_${options.length + 1}`,
      label_id: label,
      label_en: label
    });
    if (options.length >= MAX_OPTIONS_PER_GROUP) break;
  }

  if (options.length === 0) return [];
  return [{ id: 'grp_ukuran', name_id: 'Ukuran', name_en: 'Size', options }];
}

function normalizeOptionItem(rawOpt, idx) {
  if (typeof rawOpt === 'string') {
    const lbl = stripHtml(rawOpt).slice(0, MAX_OPTION_LABEL_LENGTH);
    return lbl ? { id: `opt_${idx + 1}`, label_id: lbl, label_en: lbl } : null;
  }
  if (!rawOpt || typeof rawOpt !== 'object') return null;
  const rawId = stripHtml(rawOpt.label_id).slice(0, MAX_OPTION_LABEL_LENGTH);
  const rawEn = stripHtml(rawOpt.label_en).slice(0, MAX_OPTION_LABEL_LENGTH);
  const labelId = rawId || rawEn;
  const labelEn = rawEn || rawId;
  if (!labelId) return null;
  return {
    id: sanitizeVariantId(rawOpt.id, 'opt', idx),
    label_id: labelId,
    label_en: labelEn
  };
}

function deduplicateOptionIds(options) {
  const used = new Set();
  return options.map((opt, idx) => {
    let nextId = opt.id;
    if (used.has(nextId)) nextId = `opt_${idx + 1}`;
    used.add(nextId);
    return { ...opt, id: nextId };
  });
}

function normalizeGroupItem(rawGrp, idx) {
  if (!isVariantGroupObject(rawGrp)) return null;
  const rawNameId = stripHtml(rawGrp.name_id).slice(0, MAX_GROUP_NAME_LENGTH);
  const rawNameEn = stripHtml(rawGrp.name_en).slice(0, MAX_GROUP_NAME_LENGTH);
  const nameId = rawNameId || rawNameEn;
  const nameEn = rawNameEn || rawNameId;
  const options = deduplicateOptionIds(
    rawGrp.options
      .map((o, oIdx) => normalizeOptionItem(o, oIdx))
      .filter(Boolean)
      .slice(0, MAX_OPTIONS_PER_GROUP)
  );
  if (!nameId || options.length === 0) return null;
  return {
    id: sanitizeVariantId(rawGrp.id, 'grp', idx),
    name_id: nameId,
    name_en: nameEn,
    options
  };
}

function deduplicateGroupIds(groups) {
  const used = new Set();
  return groups.map((grp, idx) => {
    let nextId = grp.id;
    if (used.has(nextId)) nextId = `grp_${idx + 1}`;
    used.add(nextId);
    return { ...grp, id: nextId };
  });
}

function parseJsonIfNeeded(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function normalizeVariantGroups(rawVariants) {
  const list = parseJsonIfNeeded(rawVariants);
  if (list.length === 0) return [];
  if (list.some(isVariantGroupObject)) {
    const groups = list
      .map((g, idx) => normalizeGroupItem(g, idx))
      .filter(Boolean)
      .slice(0, MAX_VARIANT_GROUPS);
    return deduplicateGroupIds(groups);
  }
  return normalizeLegacyVariantArray(list);
}

function checkSingleOptionLimits(opt) {
  if (!opt || typeof opt !== 'object') return null;
  const lId = stripHtml(opt.label_id);
  const lEn = stripHtml(opt.label_en);
  if (lId.length > MAX_OPTION_LABEL_LENGTH || lEn.length > MAX_OPTION_LABEL_LENGTH) {
    return `Label opsi varian maksimal ${MAX_OPTION_LABEL_LENGTH} karakter.`;
  }
  return null;
}

function checkSingleGroupLimits(grp) {
  if (!grp || typeof grp !== 'object') return 'Format grup varian tidak valid.';
  const nId = stripHtml(grp.name_id);
  const nEn = stripHtml(grp.name_en);
  if (nId.length > MAX_GROUP_NAME_LENGTH || nEn.length > MAX_GROUP_NAME_LENGTH) {
    return `Nama grup varian maksimal ${MAX_GROUP_NAME_LENGTH} karakter.`;
  }
  const opts = Array.isArray(grp.options) ? grp.options : [];
  if (opts.length > MAX_OPTIONS_PER_GROUP) {
    return `Maksimal ${MAX_OPTIONS_PER_GROUP} opsi per grup varian.`;
  }
  for (const opt of opts) {
    const optErr = checkSingleOptionLimits(opt);
    if (optErr) return optErr;
  }
  return null;
}

export function validateRawVariantGroups(rawInput) {
  let parsed = rawInput;
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) return { groups: [] };
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { error: 'Format JSON grup varian tidak valid.' };
    }
  }
  if (!Array.isArray(parsed)) return { error: 'Format grup varian harus berupa array.' };
  if (parsed.length > MAX_VARIANT_GROUPS) {
    return { error: `Maksimal ${MAX_VARIANT_GROUPS} grup varian per produk.` };
  }
  for (const grp of parsed) {
    const err = checkSingleGroupLimits(grp);
    if (err) return { error: err };
  }
  return { groups: normalizeVariantGroups(parsed) };
}

function parseCompactVariantString(rawStr) {
  const map = new Map();
  const segments = rawStr.split(';').map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const [gId, optPart] = seg.split(':');
    if (!gId || !optPart) continue;
    const ids = optPart.split(',').map((x) => x.trim()).filter(Boolean);
    if (ids.length > 0) map.set(gId.trim(), new Set(ids));
  }
  return map;
}

function parseArrayVariantSelection(list) {
  const map = new Map();
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const gId = String(item.group_id || item.id || '').trim();
    if (!gId) continue;
    const rawOpts = Array.isArray(item.option_ids) ? item.option_ids : (Array.isArray(item.options) ? item.options : []);
    const ids = rawOpts.map((o) => String(typeof o === 'object' ? o?.id : o || '').trim()).filter(Boolean);
    if (ids.length > 0) map.set(gId, new Set(ids));
  }
  return map;
}

function buildSelectionMap(rawSelection) {
  if (!rawSelection) return new Map();
  if (Array.isArray(rawSelection)) return parseArrayVariantSelection(rawSelection);
  if (typeof rawSelection !== 'string') return new Map();
  const trimmed = rawSelection.trim();
  if (!trimmed) return new Map();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parseArrayVariantSelection(parsed) : new Map();
    } catch {
      return new Map();
    }
  }
  return parseCompactVariantString(trimmed);
}

export function matchSelectedVariantsWhitelist(rawSelection, productVariants) {
  const groups = normalizeVariantGroups(productVariants);
  if (groups.length === 0) return [];
  const selectionMap = buildSelectionMap(rawSelection);
  if (selectionMap.size === 0) return [];

  const matched = [];
  for (const grp of groups) {
    const pickedIds = selectionMap.get(grp.id);
    if (!pickedIds) continue;
    const matchedOpts = grp.options
      .filter((opt) => pickedIds.has(opt.id))
      .map((opt) => ({ id: opt.id, label_id: opt.label_id, label_en: opt.label_en }));
    if (matchedOpts.length > 0) {
      matched.push({
        group_id: grp.id,
        group_name_id: grp.name_id,
        group_name_en: grp.name_en,
        options: matchedOpts
      });
    }
  }
  return matched;
}

export function formatSelectedVariantsText(selectedVariants, lang = 'id') {
  const list = parseJsonIfNeeded(selectedVariants);
  if (list.length === 0) return '';
  const isEn = String(lang).toLowerCase() === 'en';
  const parts = [];

  for (const grp of list) {
    if (!grp || typeof grp !== 'object' || !Array.isArray(grp.options)) continue;
    const gName = isEn ? (grp.group_name_en || grp.group_name_id || grp.name_en || grp.name_id) : (grp.group_name_id || grp.name_id);
    const labels = grp.options
      .map((o) => (isEn ? (o?.label_en || o?.label_id) : (o?.label_id || o?.label_en)))
      .filter(Boolean);
    if (gName && labels.length > 0) {
      parts.push(`${gName}: ${labels.join(', ')}`);
    }
  }
  return parts.join('; ');
}

export default {
  MAX_VARIANT_GROUPS,
  MAX_OPTIONS_PER_GROUP,
  MAX_GROUP_NAME_LENGTH,
  MAX_OPTION_LABEL_LENGTH,
  VARIANT_PRESETS,
  stripHtml,
  sanitizeVariantId,
  isVariantGroupObject,
  normalizeLegacyVariantArray,
  normalizeVariantGroups,
  validateRawVariantGroups,
  matchSelectedVariantsWhitelist,
  formatSelectedVariantsText
};
