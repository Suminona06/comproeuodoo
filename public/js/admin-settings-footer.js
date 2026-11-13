const SVG_NS = 'http://www.w3.org/2000/svg';
const FOOTER_DESC_MAX = 350;
const FOOTER_DESC_WARN = 315;
const FOOTER_NAV_MAX = 4;
const FOOTER_LABEL_MAX = 80;
const FOOTER_URL_MAX = 255;

export const ICON_PATHS = {
  check: 'M20 6L9 17l-5-5',
  alert: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 8v4m0 4h.01',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6'
};

const FOOTER_FIELDS = [
  { key: 'labelId', cls: 'stg-fn-label-id', wrapCls: '', label: 'Label (ID) *', placeholder: 'Produk Retail & Industri', maxLen: FOOTER_LABEL_MAX },
  { key: 'labelEn', cls: 'stg-fn-label-en', wrapCls: '', label: 'Label (EN) *', placeholder: 'Retail & Industrial Products', maxLen: FOOTER_LABEL_MAX },
  { key: 'url', cls: 'stg-fn-url', wrapCls: 'stg-footer-field--url', label: 'URL Tujuan *', placeholder: '/products atau https://...', maxLen: FOOTER_URL_MAX }
];

export const inputVal = (el) => (el ? String(el.value || '').trim() : '');

export function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function createSvgIcon(pathD, className, size = '14') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  if (className) svg.setAttribute('class', className);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

export function parseStoredList(inputEl) {
  if (!inputEl || !inputEl.value) return [];
  try {
    const parsed = JSON.parse(inputEl.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function failValidation(input, title, text) {
  if (input) {
    input.classList.add('is-invalid');
    input.focus();
  }
  if (window.showAdminAlert) {
    window.showAdminAlert({ title, text, icon: 'warning' });
  }
  return false;
}

function isValidHttpUrl(trimmed) {
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isInternalOrAnchor(trimmed) {
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return false;
  return trimmed.startsWith('/');
}

export function isAllowedClientFooterUrl(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed || trimmed.length > FOOTER_URL_MAX) return false;
  return isInternalOrAnchor(trimmed) || isValidHttpUrl(trimmed);
}

function updateDescCounter(textarea) {
  const targetId = textarea.getAttribute('data-counter-target');
  const badge = targetId ? document.getElementById(targetId) : null;
  if (!badge) return;
  const len = textarea.value.length;
  badge.textContent = `${len} / ${FOOTER_DESC_MAX}`;
  badge.classList.toggle('is-near-limit', len >= FOOTER_DESC_WARN && len < FOOTER_DESC_MAX);
  badge.classList.toggle('is-at-limit', len >= FOOTER_DESC_MAX);
}

export function initFooterDescCounters() {
  const textareas = ['footer_desc_id', 'footer_desc_en']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  textareas.forEach((textarea) => {
    updateDescCounter(textarea);
    textarea.addEventListener('input', () => {
      textarea.classList.remove('is-invalid');
      updateDescCounter(textarea);
    });
  });
  return textareas;
}

export function validateFooterDescs(textareas) {
  for (const textarea of textareas) {
    textarea.classList.remove('is-invalid');
    if (textarea.value.trim().length > FOOTER_DESC_MAX) {
      return failValidation(textarea, 'Validasi Deskripsi Footer', `Deskripsi footer maksimal ${FOOTER_DESC_MAX} karakter.`);
    }
  }
  return true;
}

function syncFooterRowIndexes(rows) {
  rows.forEach((row, index) => {
    const num = index + 1;
    const numEl = row.querySelector('.stg-footer-item-num');
    if (numEl) numEl.textContent = `Menu #${num}`;
    row.querySelectorAll('.stg-footer-field').forEach((fieldGroup, fIdx) => {
      const label = fieldGroup.querySelector('label');
      const input = fieldGroup.querySelector('input');
      const inputId = `footer_nav_${index}_${fIdx}`;
      if (label) label.setAttribute('for', inputId);
      if (input) input.id = inputId;
    });
    const upBtn = row.querySelector('[data-action="up"]');
    const downBtn = row.querySelector('[data-action="down"]');
    const delBtn = row.querySelector('[data-action="delete"]');
    if (upBtn) {
      upBtn.disabled = index === 0;
      upBtn.setAttribute('aria-label', `Naikkan menu ke-${num}`);
    }
    if (downBtn) {
      downBtn.disabled = index === rows.length - 1;
      downBtn.setAttribute('aria-label', `Turunkan menu ke-${num}`);
    }
    if (delBtn) delBtn.setAttribute('aria-label', `Hapus menu ke-${num}`);
  });
}

function syncFooterNavState(ctx) {
  const rows = [...ctx.list.querySelectorAll('.stg-footer-item')];
  const isEmpty = rows.length === 0;
  if (ctx.emptyHint) ctx.emptyHint.classList.toggle('stg-d-none', !isEmpty);
  ctx.list.classList.toggle('stg-d-none', isEmpty);

  if (ctx.badge) {
    ctx.badge.textContent = `${rows.length} / ${FOOTER_NAV_MAX} Menu`;
    ctx.badge.classList.toggle('is-full', rows.length >= FOOTER_NAV_MAX);
  }
  if (ctx.btnAdd) {
    const isFull = rows.length >= FOOTER_NAV_MAX;
    ctx.btnAdd.disabled = isFull;
    ctx.btnAdd.setAttribute('aria-disabled', String(isFull));
  }
  syncFooterRowIndexes(rows);
}

function focusRowControlAfterMove(row, dir) {
  const sameBtn = row.querySelector(`[data-action="${dir}"]`);
  const altDir = dir === 'up' ? 'down' : 'up';
  const target = sameBtn && !sameBtn.disabled ? sameBtn : row.querySelector(`[data-action="${altDir}"]`);
  if (target) target.focus();
}

function handleFooterRowMove(ctx, row, dir) {
  const target = dir === 'up' ? row.previousElementSibling : row.nextElementSibling;
  if (!target) return;
  const beforeNode = dir === 'up' ? target : row;
  const movingNode = dir === 'up' ? row : target;
  ctx.list.insertBefore(movingNode, beforeNode);
  syncFooterNavState(ctx);
  focusRowControlAfterMove(row, dir);
}

function createFooterControlBtn(action, label, variant, pathD, onClick) {
  const btn = createEl('button', `adm-btn ${variant} adm-btn-sm stg-footer-ctrl-btn`);
  btn.type = 'button';
  btn.dataset.action = action;
  btn.append(createSvgIcon(pathD, 'adm-btn-icon', '12'), createEl('span', '', label));
  btn.addEventListener('click', onClick);
  return btn;
}

function createFooterNavRow(ctx, data = {}) {
  const item = createEl('div', 'stg-footer-item');
  item.setAttribute('role', 'listitem');
  const head = createEl('div', 'stg-footer-item-head');
  const controls = createEl('div', 'stg-footer-item-controls');
  controls.append(
    createFooterControlBtn('up', 'Naik', 'adm-btn-neutral', ICON_PATHS.up, () => handleFooterRowMove(ctx, item, 'up')),
    createFooterControlBtn('down', 'Turun', 'adm-btn-neutral', ICON_PATHS.down, () => handleFooterRowMove(ctx, item, 'down')),
    createFooterControlBtn('delete', 'Hapus', 'adm-btn-danger', ICON_PATHS.trash, () => {
      const sibling = item.nextElementSibling || item.previousElementSibling;
      item.remove();
      syncFooterNavState(ctx);
      (sibling?.querySelector('[data-action="delete"]') || ctx.btnAdd)?.focus();
    })
  );
  head.append(createEl('span', 'stg-footer-item-num'), controls);
  const fields = createEl('div', 'stg-footer-fields');
  const values = { labelId: data.label_id || '', labelEn: data.label_en || '', url: data.url || '' };
  FOOTER_FIELDS.forEach((cfg) => {
    const group = createEl('div', `form-group stg-footer-field ${cfg.wrapCls}`.trim());
    const input = createEl('input', `form-input ${cfg.cls}`);
    input.type = 'text';
    input.placeholder = cfg.placeholder;
    input.maxLength = cfg.maxLen;
    input.value = values[cfg.key];
    input.required = true;
    input.addEventListener('input', () => input.classList.remove('is-invalid'));
    group.append(createEl('label', 'form-label', cfg.label), input);
    fields.appendChild(group);
  });
  item.append(head, fields);
  return item;
}

function validateFooterNavRow(row, index) {
  const num = index + 1;
  const labelIdInput = row.querySelector('.stg-fn-label-id');
  const labelEnInput = row.querySelector('.stg-fn-label-en');
  const urlInput = row.querySelector('.stg-fn-url');
  const labelId = inputVal(labelIdInput);
  const labelEn = inputVal(labelEnInput);
  const url = inputVal(urlInput);
  if (!labelId || labelId.length > FOOTER_LABEL_MAX) {
    failValidation(labelIdInput, 'Validasi Menu Footer', `Label (ID) menu ke-${num} wajib 1-${FOOTER_LABEL_MAX} karakter.`);
    return null;
  }
  if (!labelEn || labelEn.length > FOOTER_LABEL_MAX) {
    failValidation(labelEnInput, 'Validasi Menu Footer', `Label (EN) menu ke-${num} wajib 1-${FOOTER_LABEL_MAX} karakter.`);
    return null;
  }
  if (!isAllowedClientFooterUrl(url)) {
    failValidation(urlInput, 'Validasi Menu Footer', `URL menu ke-${num} tidak valid. Gunakan path /..., #..., atau https://...`);
    return null;
  }
  return { label_id: labelId, label_en: labelEn, url };
}

export function validateFooterNavContext(ctx) {
  if (!ctx) return true;
  const rows = [...ctx.list.querySelectorAll('.stg-footer-item')];
  if (rows.length > FOOTER_NAV_MAX) {
    return failValidation(ctx.btnAdd, 'Validasi Menu Footer', `Maksimal ${FOOTER_NAV_MAX} menu footer diperbolehkan.`);
  }
  const items = [];
  for (let i = 0; i < rows.length; i++) {
    rows[i].querySelectorAll('.form-input').forEach((el) => el.classList.remove('is-invalid'));
    const validItem = validateFooterNavRow(rows[i], i);
    if (!validItem) return false;
    items.push(validItem);
  }
  if (ctx.hiddenInput) ctx.hiddenInput.value = JSON.stringify(items);
  return true;
}

export function initFooterNavRepeater() {
  const wrap = document.getElementById('footerNavRepeaterContainer');
  if (!wrap) return null;
  const ctx = {
    wrap,
    hiddenInput: document.getElementById('footer_nav_links_json'),
    list: document.getElementById('footerNavList'),
    emptyHint: document.getElementById('footerNavEmptyHint'),
    badge: document.getElementById('footerNavCountBadge'),
    btnAdd: document.getElementById('btnAddFooterNav')
  };
  parseStoredList(ctx.hiddenInput).slice(0, FOOTER_NAV_MAX).forEach((item) => {
    ctx.list.appendChild(createFooterNavRow(ctx, item));
  });
  syncFooterNavState(ctx);
  if (ctx.btnAdd) {
    ctx.btnAdd.addEventListener('click', () => {
      if (ctx.list.querySelectorAll('.stg-footer-item').length >= FOOTER_NAV_MAX) return;
      const newRow = createFooterNavRow(ctx);
      ctx.list.appendChild(newRow);
      syncFooterNavState(ctx);
      newRow.querySelector('.stg-fn-label-id')?.focus();
    });
  }
  return ctx;
}

