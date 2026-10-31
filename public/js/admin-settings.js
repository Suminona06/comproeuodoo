/**
 * admin-settings.js - Pengaturan Admin Situs & WhatsApp Multi-Nomor Rolling (T-240)
 * Strictly vanilla JS, CSP-compliant (no inline event handlers)
 */
document.addEventListener('DOMContentLoaded', () => {
  const repeaterWrap = document.getElementById('waRepeaterContainer');
  if (!repeaterWrap) return;

  const hiddenInput = document.getElementById('whatsapp_numbers_json');
  const tbody = document.getElementById('waTableBody');
  const emptyHint = document.getElementById('waEmptyHint');
  const tableContainer = document.getElementById('waTableContainer');
  const btnAdd = document.getElementById('btnAddWaRow');
  const totalDisplay = document.getElementById('waTotalDisplay');
  const badge = document.getElementById('waTotalBadge');
  const form = repeaterWrap.closest('form');

  // Initial data parsing
  let waList = [];
  try {
    const raw = hiddenInput ? hiddenInput.value : '[]';
    waList = JSON.parse(raw);
    if (!Array.isArray(waList)) waList = [];
  } catch (err) {
    waList = [];
  }

  /**
   * Recalculate total percentage and update UI status badge
   */
  function updateTotal() {
    const rows = tbody.querySelectorAll('tr.wa-row');
    if (rows.length === 0) {
      if (emptyHint) emptyHint.style.display = 'block';
      if (tableContainer) tableContainer.style.display = 'none';
      if (badge) {
        badge.className = 'wa-repeater-badge-ok';
        badge.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg> Mode Fallback (1 Nomor Utama)';
      }
      return 0;
    }

    if (emptyHint) emptyHint.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    let sum = 0;
    rows.forEach(row => {
      const pctInput = row.querySelector('.wa-input-pct');
      const val = parseInt(pctInput?.value, 10);
      if (!isNaN(val)) sum += val;
    });

    if (totalDisplay) totalDisplay.textContent = sum;

    if (badge) {
      if (sum === 100) {
        badge.className = 'wa-repeater-badge-ok';
        badge.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg> Total: <span id="waTotalDisplay">${sum}</span>% (Seimbang)`;
      } else {
        badge.className = 'wa-repeater-badge-warn';
        badge.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> Total: <span id="waTotalDisplay">${sum}</span>% (Wajib 100%)`;
      }
    }

    return sum;
  }

  /**
   * Create a new row element in the repeater table
   */
  function createRowElement(data = {}) {
    const tr = document.createElement('tr');
    tr.className = 'wa-row';

    const numVal = data.number || data.formatted || '';
    const labelVal = data.label || '';
    const pctVal = data.percentage !== undefined ? data.percentage : 100;

    tr.innerHTML = `
      <td>
        <input type="text" class="form-input wa-input-num" placeholder="6281234567890" value="${escapeHtml(numVal)}" required>
      </td>
      <td>
        <input type="text" class="form-input wa-input-label" placeholder="Contoh: Sales Retail" value="${escapeHtml(labelVal)}" maxlength="50">
      </td>
      <td style="width: 140px;">
        <div class="wa-pct-wrap">
          <input type="number" class="form-input wa-input-pct" min="1" max="100" step="1" value="${pctVal}" required>
          <span class="wa-pct-suffix">%</span>
        </div>
      </td>
      <td style="width: 48px; text-align: center;">
        <button type="button" class="adm-btn adm-btn-danger adm-btn-sm wa-btn-del" title="Hapus nomor ini" aria-label="Hapus nomor ini">
          <svg class="adm-btn-icon adm-btn-icon-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;

    // Attach row events
    const btnDel = tr.querySelector('.wa-btn-del');
    btnDel.addEventListener('click', () => {
      tr.remove();
      updateTotal();
    });

    const inputs = tr.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        updateTotal();
      });
    });

    return tr;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Populate initial rows
  if (waList.length > 0) {
    waList.forEach(item => {
      tbody.appendChild(createRowElement(item));
    });
  }
  updateTotal();

  // Add new row button
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const currentRows = tbody.querySelectorAll('tr.wa-row');
      let defaultPct = 100;
      if (currentRows.length > 0) {
        let currentSum = 0;
        currentRows.forEach(r => {
          const v = parseInt(r.querySelector('.wa-input-pct')?.value, 10);
          if (!isNaN(v)) currentSum += v;
        });
        defaultPct = Math.max(1, 100 - currentSum);
      }

      const newRow = createRowElement({
        number: '',
        label: `Sales ${currentRows.length + 1}`,
        percentage: defaultPct
      });
      tbody.appendChild(newRow);
      updateTotal();

      const firstInput = newRow.querySelector('.wa-input-num');
      if (firstInput) firstInput.focus();
    });
  }

  // Intercept form submission to validate and serialize
  if (form) {
    form.addEventListener('submit', (e) => {
      const rows = tbody.querySelectorAll('tr.wa-row');
      if (rows.length === 0) {
        if (hiddenInput) hiddenInput.value = '[]';
        return true;
      }

      const total = updateTotal();
      if (total !== 100) {
        e.preventDefault();
        alert(`Total persentase alokasi WhatsApp harus tepat 100% (saat ini: ${total}%).\nMohon sesuaikan nilai persentase sebelum menyimpan.`);
        const firstPct = tbody.querySelector('.wa-input-pct');
        if (firstPct) firstPct.focus();
        return false;
      }

      const serialized = [];
      let hasError = false;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const numInput = row.querySelector('.wa-input-num');
        const labelInput = row.querySelector('.wa-input-label');
        const pctInput = row.querySelector('.wa-input-pct');

        const rawNum = String(numInput?.value || '').trim();
        const cleanNum = rawNum.replace(/[^0-9]/g, '');

        if (!cleanNum || cleanNum.length < 9 || cleanNum.length > 16) {
          e.preventDefault();
          alert(`Nomor WhatsApp pada baris ke-${i + 1} tidak valid.\nNomor wajib berisi 9–16 digit angka (contoh: 6281234567890).`);
          if (numInput) numInput.focus();
          hasError = true;
          break;
        }

        const pct = parseInt(pctInput?.value, 10);
        if (isNaN(pct) || pct < 1 || pct > 100) {
          e.preventDefault();
          alert(`Persentase pada baris ke-${i + 1} harus antara 1% dan 100%.`);
          if (pctInput) pctInput.focus();
          hasError = true;
          break;
        }

        serialized.push({
          number: cleanNum,
          formatted: cleanNum,
          label: String(labelInput?.value || '').trim().substring(0, 50) || `Sales ${i + 1}`,
          percentage: pct
        });
      }

      if (hasError) return false;

      if (hiddenInput) {
        hiddenInput.value = JSON.stringify(serialized);
      }
    });
  }
});

