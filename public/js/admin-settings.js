import {
  ICON_PATHS,
  inputVal,
  createEl,
  createSvgIcon,
  parseStoredList,
  failValidation,
  initFooterDescCounters,
  validateFooterDescs,
  initFooterNavRepeater,
  validateFooterNavContext
} from './admin-settings-footer.js';

function renderWaBadge(badge, total, rowCount) {
  if (!badge) return;
  badge.replaceChildren();
  if (rowCount === 0) {
    badge.className = 'wa-repeater-badge-ok';
    badge.append(createSvgIcon(ICON_PATHS.check), document.createTextNode(' Mode Fallback (1 Nomor Utama)'));
    return;
  }
  const isOk = total === 100;
  badge.className = isOk ? 'wa-repeater-badge-ok' : 'wa-repeater-badge-warn';
  const countSpan = createEl('span', '', String(total));
  countSpan.id = 'waTotalDisplay';
  badge.append(
    createSvgIcon(isOk ? ICON_PATHS.check : ICON_PATHS.alert),
    document.createTextNode(' Total: '),
    countSpan,
    document.createTextNode(isOk ? '% (Seimbang)' : '% (Wajib 100%)')
  );
}

function updateWaTotal(ctx) {
  const rows = ctx.tbody.querySelectorAll('tr.wa-row');
  const isEmpty = rows.length === 0;
  if (ctx.emptyHint) ctx.emptyHint.classList.toggle('stg-d-none', !isEmpty);
  if (ctx.tableContainer) ctx.tableContainer.classList.toggle('stg-d-none', isEmpty);

  let sum = 0;
  rows.forEach((row) => {
    const val = parseInt(row.querySelector('.wa-input-pct')?.value, 10);
    if (!isNaN(val)) sum += val;
  });
  if (ctx.totalDisplay) ctx.totalDisplay.textContent = String(sum);
  renderWaBadge(ctx.badge, sum, rows.length);
  return sum;
}

function buildWaInput(type, className, placeholder, value) {
  const input = createEl('input', `form-input ${className}`);
  input.type = type;
  input.placeholder = placeholder;
  input.value = value;
  input.required = true;
  return input;
}

function createWaRowElement(ctx, data = {}) {
  const tr = createEl('tr', 'wa-row');
  const numInput = buildWaInput('text', 'wa-input-num', '6281234567890', data.number || data.formatted || '');
  const labelInput = buildWaInput('text', 'wa-input-label', 'Contoh: Sales Retail', data.label || '');
  labelInput.required = false;
  labelInput.maxLength = 50;

  const pctVal = data.percentage !== undefined ? String(data.percentage) : '100';
  const pctInput = buildWaInput('number', 'wa-input-pct', '100', pctVal);
  pctInput.min = '1';
  pctInput.max = '100';
  pctInput.step = '1';

  const pctWrap = createEl('div', 'wa-pct-wrap');
  pctWrap.append(pctInput, createEl('span', 'wa-pct-suffix', '%'));

  const delBtn = createEl('button', 'adm-btn adm-btn-danger adm-btn-sm wa-btn-del');
  delBtn.type = 'button';
  delBtn.title = 'Hapus nomor ini';
  delBtn.setAttribute('aria-label', 'Hapus nomor ini');
  delBtn.appendChild(createSvgIcon(ICON_PATHS.trash, 'adm-btn-icon adm-btn-icon-trash', '12'));

  const cells = [numInput, labelInput, pctWrap, delBtn].map((child, idx) => {
    const td = document.createElement('td');
    if (idx === 2) td.className = 'stg-col-wa-pct-cell';
    if (idx === 3) td.className = 'stg-col-wa-act-cell';
    td.appendChild(child);
    return td;
  });
  tr.append(...cells);

  delBtn.addEventListener('click', () => {
    tr.remove();
    updateWaTotal(ctx);
  });
  [numInput, labelInput, pctInput].forEach((el) => el.addEventListener('input', () => updateWaTotal(ctx)));
  return tr;
}

function validateSingleWaRow(row, index) {
  const numInput = row.querySelector('.wa-input-num');
  const cleanNum = inputVal(numInput).replace(/[^0-9]/g, '');
  if (cleanNum.length < 9 || cleanNum.length > 16) {
    failValidation(numInput, 'Validasi WhatsApp', `Nomor WhatsApp pada baris ke-${index + 1} wajib berisi 9-16 digit angka (contoh: 6281234567890).`);
    return null;
  }
  const pctInput = row.querySelector('.wa-input-pct');
  const pct = parseInt(inputVal(pctInput), 10);
  if (isNaN(pct) || pct < 1 || pct > 100) {
    failValidation(pctInput, 'Validasi WhatsApp', `Persentase pada baris ke-${index + 1} harus antara 1% dan 100%.`);
    return null;
  }
  const labelText = inputVal(row.querySelector('.wa-input-label')).substring(0, 50);
  return { number: cleanNum, formatted: cleanNum, label: labelText || `Sales ${index + 1}`, percentage: pct };
}

function validateWaContext(ctx) {
  if (!ctx) return true;
  const rows = ctx.tbody.querySelectorAll('tr.wa-row');
  if (rows.length === 0) {
    if (ctx.hiddenInput) ctx.hiddenInput.value = '[]';
    return true;
  }
  const total = updateWaTotal(ctx);
  if (total !== 100) {
    return failValidation(ctx.tbody.querySelector('.wa-input-pct'), 'Validasi WhatsApp', `Total persentase alokasi WhatsApp harus tepat 100% (saat ini: ${total}%).\nMohon sesuaikan nilai persentase sebelum menyimpan.`);
  }
  const serialized = [];
  for (let i = 0; i < rows.length; i++) {
    const entry = validateSingleWaRow(rows[i], i);
    if (!entry) return false;
    serialized.push(entry);
  }
  if (ctx.hiddenInput) ctx.hiddenInput.value = JSON.stringify(serialized);
  return true;
}

function initWhatsAppRepeater() {
  const wrap = document.getElementById('waRepeaterContainer');
  if (!wrap) return null;

  const ctx = {
    wrap,
    hiddenInput: document.getElementById('whatsapp_numbers_json'),
    tbody: document.getElementById('waTableBody'),
    emptyHint: document.getElementById('waEmptyHint'),
    tableContainer: document.getElementById('waTableContainer'),
    btnAdd: document.getElementById('btnAddWaRow'),
    totalDisplay: document.getElementById('waTotalDisplay'),
    badge: document.getElementById('waTotalBadge')
  };

  parseStoredList(ctx.hiddenInput).forEach((item) => ctx.tbody.appendChild(createWaRowElement(ctx, item)));
  updateWaTotal(ctx);

  if (ctx.btnAdd) {
    ctx.btnAdd.addEventListener('click', () => {
      const currentRows = ctx.tbody.querySelectorAll('tr.wa-row');
      const currentSum = updateWaTotal(ctx);
      const defaultPct = currentRows.length > 0 ? Math.max(1, 100 - currentSum) : 100;
      const newRow = createWaRowElement(ctx, { number: '', label: `Sales ${currentRows.length + 1}`, percentage: defaultPct });
      ctx.tbody.appendChild(newRow);
      updateWaTotal(ctx);
      newRow.querySelector('.wa-input-num')?.focus();
    });
  }
  return ctx;
}

function bootAdminSettings() {
  const waCtx = initWhatsAppRepeater();
  const descInputs = initFooterDescCounters();
  const footerCtx = initFooterNavRepeater();
  const form = (waCtx?.wrap || footerCtx?.wrap)?.closest('form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    const isOk = validateFooterDescs(descInputs) && validateWaContext(waCtx) && validateFooterNavContext(footerCtx);
    if (!isOk) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAdminSettings);
} else {
  bootAdminSettings();
}
