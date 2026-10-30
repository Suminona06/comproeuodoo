(function() {
  const container = document.getElementById('dynamicSizeEditor');
  const hiddenInput = document.getElementById('inputSizeTable');
  const btnAddCol = document.getElementById('btnAddSizeColumn');
  const btnAddRow = document.getElementById('btnAddSizeRow');
  const btnOpenCopyModal = document.getElementById('btnCopySizeColumns');
  const modalCopy = document.getElementById('modalCopySizeColumns');
  const selectCopy = document.getElementById('selectCopyProduct');
  const previewWrap = document.getElementById('copyColumnsPreview');
  const previewBadgeList = document.getElementById('copyColumnsBadgeList');
  const btnConfirmCopy = document.getElementById('btnConfirmCopyColumns');
  const btnCloseCopyModal = document.getElementById('btnCloseCopyModal');
  const btnCancelCopyModal = document.getElementById('btnCancelCopyModal');

  if (!container || !hiddenInput) return;

  const DEFAULT_COLUMNS = [
    { id: 'col_1', label: 'Kode Produk' },
    { id: 'col_2', label: 'Lebar' },
    { id: 'col_3', label: 'Panjang' },
    { id: 'col_4', label: 'Tebal (Micron)' },
    { id: 'col_5', label: 'Kapasitas' },
    { id: 'col_6', label: 'Bahan' }
  ];

  let rawInitial = null;
  const attrInitial = container.getAttribute('data-initial');
  if (attrInitial) {
    try {
      rawInitial = JSON.parse(attrInitial);
    } catch {
      rawInitial = null;
    }
  }

  let columns = [];
  let rows = [];

  if (rawInitial && typeof rawInitial === 'object') {
    if (Array.isArray(rawInitial.columns) && rawInitial.columns.length > 0) {
      columns = rawInitial.columns.map((c, i) => ({
        id: `col_${i + 1}`,
        label: c && c.label ? String(c.label).trim() : `Kolom ${i + 1}`
      }));
    }
    if (Array.isArray(rawInitial.rows)) {
      rows = rawInitial.rows.map(r => {
        const rowObj = {};
        columns.forEach((c, idx) => {
          const originalId = rawInitial.columns[idx] ? rawInitial.columns[idx].id : c.id;
          const val = r[originalId] !== undefined ? r[originalId] : (r[c.id] !== undefined ? r[c.id] : '');
          rowObj[c.id] = val !== null && val !== undefined ? String(val) : '';
        });
        return rowObj;
      });
    }
  }

  if (columns.length === 0) {
    columns = DEFAULT_COLUMNS.map(c => ({ ...c }));
  }
  if (rows.length === 0) {
    const blankRow = {};
    columns.forEach(c => { blankRow[c.id] = ''; });
    rows.push(blankRow);
  }

  function serializeAndSync() {
    const cleanCols = columns.slice(0, 8).map((c, i) => ({
      id: `col_${i + 1}`,
      label: (c.label || '').trim().slice(0, 40)
    }));

    const cleanRows = rows.slice(0, 30).map(r => {
      const rowObj = {};
      cleanCols.forEach((col, idx) => {
        const currentCol = columns[idx];
        const val = currentCol && r[currentCol.id] !== undefined ? r[currentCol.id] : (r[col.id] !== undefined ? r[col.id] : '');
        rowObj[col.id] = String(val !== null && val !== undefined ? val : '').trim().slice(0, 80);
      });
      return rowObj;
    });

    const payload = {
      columns: cleanCols,
      rows: cleanRows
    };

    hiddenInput.value = JSON.stringify(payload);
  }

  function render() {
    container.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'data-table prod-size-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    columns.forEach((col, colIdx) => {
      const th = document.createElement('th');
      th.className = 'prod-size-th';

      const thWrap = document.createElement('div');
      thWrap.className = 'prod-size-th-wrap';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input prod-size-col-label';
      input.value = col.label;
      input.maxLength = 40;
      input.placeholder = `Kolom ${colIdx + 1}`;
      input.setAttribute('aria-label', `Nama kolom ${colIdx + 1}`);
      input.addEventListener('input', (e) => {
        col.label = e.target.value;
        serializeAndSync();
      });

      const thActions = document.createElement('div');
      thActions.className = 'prod-size-th-actions';

      const btnLeft = document.createElement('button');
      btnLeft.type = 'button';
      btnLeft.className = 'btn-col-action btn-col-move';
      btnLeft.title = 'Geser kolom ke kiri';
      btnLeft.setAttribute('aria-label', 'Geser kolom ke kiri');
      btnLeft.disabled = colIdx === 0;
      btnLeft.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
      btnLeft.addEventListener('click', () => moveColumn(colIdx, -1));

      const btnRight = document.createElement('button');
      btnRight.type = 'button';
      btnRight.className = 'btn-col-action btn-col-move';
      btnRight.title = 'Geser kolom ke kanan';
      btnRight.setAttribute('aria-label', 'Geser kolom ke kanan');
      btnRight.disabled = colIdx === columns.length - 1;
      btnRight.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';
      btnRight.addEventListener('click', () => moveColumn(colIdx, 1));

      const btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'btn-col-action btn-col-delete';
      btnDelete.title = 'Hapus kolom';
      btnDelete.setAttribute('aria-label', `Hapus kolom ${col.label || colIdx + 1}`);
      btnDelete.disabled = columns.length <= 1;
      btnDelete.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      btnDelete.addEventListener('click', () => confirmDeleteColumn(colIdx));

      thActions.appendChild(btnLeft);
      thActions.appendChild(btnRight);
      thActions.appendChild(btnDelete);

      thWrap.appendChild(input);
      thWrap.appendChild(thActions);
      th.appendChild(thWrap);
      headerRow.appendChild(th);
    });

    const thAction = document.createElement('th');
    thAction.className = 'table-col-action prod-size-col-action';
    thAction.textContent = 'Aksi';
    headerRow.appendChild(thAction);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    rows.forEach((row, rowIdx) => {
      const tr = document.createElement('tr');

      columns.forEach((col, colIdx) => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input prod-size-cell';
        input.value = row[col.id] || '';
        input.maxLength = 80;
        input.placeholder = 'Nilai...';
        input.dataset.rowIdx = String(rowIdx);
        input.dataset.colIdx = String(colIdx);
        input.setAttribute('aria-label', `${col.label || 'Kolom'} baris ${rowIdx + 1}`);
        input.addEventListener('input', (e) => {
          row[col.id] = e.target.value;
          serializeAndSync();
        });
        td.appendChild(input);
        tr.appendChild(td);
      });

      const tdAction = document.createElement('td');
      tdAction.className = 'table-col-action prod-size-col-action';

      const rowActions = document.createElement('div');
      rowActions.className = 'prod-size-row-actions';

      const btnUp = document.createElement('button');
      btnUp.type = 'button';
      btnUp.className = 'btn-row-action btn-row-move';
      btnUp.title = 'Geser baris ke atas';
      btnUp.setAttribute('aria-label', 'Geser baris ke atas');
      btnUp.disabled = rowIdx === 0;
      btnUp.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="18 15 12 9 6 15"></polyline></svg>';
      btnUp.addEventListener('click', () => moveRow(rowIdx, -1));

      const btnDown = document.createElement('button');
      btnDown.type = 'button';
      btnDown.className = 'btn-row-action btn-row-move';
      btnDown.title = 'Geser baris ke bawah';
      btnDown.setAttribute('aria-label', 'Geser baris ke bawah');
      btnDown.disabled = rowIdx === rows.length - 1;
      btnDown.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
      btnDown.addEventListener('click', () => moveRow(rowIdx, 1));

      const btnDeleteRow = document.createElement('button');
      btnDeleteRow.type = 'button';
      btnDeleteRow.className = 'btn-row-action btn-row-delete';
      btnDeleteRow.title = 'Hapus baris';
      btnDeleteRow.setAttribute('aria-label', `Hapus baris ${rowIdx + 1}`);
      btnDeleteRow.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
      btnDeleteRow.addEventListener('click', () => confirmDeleteRow(rowIdx));

      rowActions.appendChild(btnUp);
      rowActions.appendChild(btnDown);
      rowActions.appendChild(btnDeleteRow);
      tdAction.appendChild(rowActions);
      tr.appendChild(tdAction);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    if (btnAddCol) btnAddCol.disabled = columns.length >= 8;
    if (btnAddRow) btnAddRow.disabled = rows.length >= 30;

    serializeAndSync();
  }

  function moveColumn(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= columns.length) return;
    const temp = columns[index];
    columns[index] = columns[target];
    columns[target] = temp;
    render();
  }

  function moveRow(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const temp = rows[index];
    rows[index] = rows[target];
    rows[target] = temp;
    render();
  }

  function confirmDeleteColumn(index) {
    if (columns.length <= 1) return;
    const col = columns[index];
    const hasData = rows.some(r => r[col.id] && String(r[col.id]).trim().length > 0);

    if (!hasData) {
      deleteColumn(index);
      return;
    }

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Hapus Kolom?',
        text: 'Kolom ini memiliki data teks yang akan ikut terhapus. Lanjutkan?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        customClass: {
          popup: 'swal2-custom-popup',
          title: 'swal2-custom-title',
          confirmButton: 'swal2-custom-confirm-btn',
          cancelButton: 'swal2-custom-cancel-btn'
        }
      }).then(result => {
        if (result.isConfirmed) {
          deleteColumn(index);
        }
      });
    } else if (confirm('Kolom ini memiliki data teks yang akan ikut terhapus. Lanjutkan?')) {
      deleteColumn(index);
    }
  }

  function deleteColumn(index) {
    const removedCol = columns.splice(index, 1)[0];
    rows.forEach(r => {
      delete r[removedCol.id];
    });
    render();
  }

  function confirmDeleteRow(index) {
    const row = rows[index];
    const hasData = Object.values(row).some(v => v && String(v).trim().length > 0);

    if (rows.length <= 1) {
      columns.forEach(c => { row[c.id] = ''; });
      render();
      return;
    }

    if (!hasData) {
      rows.splice(index, 1);
      render();
      return;
    }

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Hapus Baris?',
        text: 'Baris ini memiliki data teks yang akan ikut terhapus. Lanjutkan?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        customClass: {
          popup: 'swal2-custom-popup',
          title: 'swal2-custom-title',
          confirmButton: 'swal2-custom-confirm-btn',
          cancelButton: 'swal2-custom-cancel-btn'
        }
      }).then(result => {
        if (result.isConfirmed) {
          rows.splice(index, 1);
          render();
        }
      });
    } else if (confirm('Baris ini memiliki data teks yang akan ikut terhapus. Lanjutkan?')) {
      rows.splice(index, 1);
      render();
    }
  }

  if (btnAddCol) {
    btnAddCol.addEventListener('click', () => {
      if (columns.length >= 8) return;
      const nextIdx = columns.length + 1;
      const newId = `col_${Date.now()}_${nextIdx}`;
      const newCol = { id: newId, label: `Kolom ${nextIdx}` };
      columns.push(newCol);
      rows.forEach(r => { r[newId] = ''; });
      render();
      const inputs = container.querySelectorAll('.prod-size-col-label');
      if (inputs.length > 0) {
        inputs[inputs.length - 1].focus();
        inputs[inputs.length - 1].select();
      }
    });
  }

  if (btnAddRow) {
    btnAddRow.addEventListener('click', () => {
      if (rows.length >= 30) return;
      const newRow = {};
      columns.forEach(c => { newRow[c.id] = ''; });
      rows.push(newRow);
      render();
      const cells = container.querySelectorAll('.prod-size-cell');
      if (cells.length > 0) {
        cells[cells.length - columns.length].focus();
      }
    });
  }

  container.addEventListener('keydown', (e) => {
    const cell = e.target.closest('.prod-size-cell');
    if (!cell) return;

    const rowIdx = Number(cell.dataset.rowIdx);
    const colIdx = Number(cell.dataset.colIdx);
    if (Number.isNaN(rowIdx) || Number.isNaN(colIdx)) return;

    const focusCell = (r, c) => {
      const target = container.querySelector(`.prod-size-cell[data-row-idx="${r}"][data-col-idx="${c}"]`);
      if (target) {
        target.focus();
        target.select();
      }
    };

    if (e.key === 'ArrowLeft') {
      if (colIdx > 0) {
        e.preventDefault();
        focusCell(rowIdx, colIdx - 1);
      }
    } else if (e.key === 'ArrowRight') {
      if (colIdx < columns.length - 1) {
        e.preventDefault();
        focusCell(rowIdx, colIdx + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIdx > 0) {
        focusCell(rowIdx - 1, colIdx);
      } else {
        const headers = container.querySelectorAll('.prod-size-col-label');
        if (headers[colIdx]) {
          headers[colIdx].focus();
          headers[colIdx].select();
        }
      }
    } else if (e.key === 'ArrowDown') {
      if (rowIdx < rows.length - 1) {
        e.preventDefault();
        focusCell(rowIdx + 1, colIdx);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIdx < rows.length - 1) {
        focusCell(rowIdx + 1, colIdx);
      } else if (rows.length < 30) {
        const newRow = {};
        columns.forEach(c => { newRow[c.id] = ''; });
        rows.push(newRow);
        render();
        focusCell(rows.length - 1, 0);
      }
    }
  });

  let selectedSourceColumns = [];

  function openModal() {
    if (!modalCopy) return;
    modalCopy.classList.add('open');
    modalCopy.setAttribute('aria-hidden', 'false');
    if (selectCopy) {
      selectCopy.value = '';
      selectCopy.focus();
    }
    if (previewWrap) previewWrap.style.display = 'none';
    if (btnConfirmCopy) btnConfirmCopy.disabled = true;
    selectedSourceColumns = [];
  }

  function closeModal() {
    if (!modalCopy) return;
    modalCopy.classList.remove('open');
    modalCopy.setAttribute('aria-hidden', 'true');
  }

  if (btnOpenCopyModal) {
    btnOpenCopyModal.addEventListener('click', openModal);
  }
  if (btnCloseCopyModal) {
    btnCloseCopyModal.addEventListener('click', closeModal);
  }
  if (btnCancelCopyModal) {
    btnCancelCopyModal.addEventListener('click', closeModal);
  }

  if (modalCopy) {
    modalCopy.addEventListener('click', (e) => {
      if (e.target === modalCopy) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalCopy.classList.contains('open')) {
        closeModal();
      }
    });
  }

  if (selectCopy) {
    selectCopy.addEventListener('change', async () => {
      const prodId = selectCopy.value;
      if (!prodId) {
        if (previewWrap) previewWrap.style.display = 'none';
        if (btnConfirmCopy) btnConfirmCopy.disabled = true;
        selectedSourceColumns = [];
        return;
      }

      try {
        const res = await fetch(`/admin/products/${prodId}/size-table-columns`, {
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.columns) && data.columns.length > 0) {
          selectedSourceColumns = data.columns;
          if (previewBadgeList) {
            previewBadgeList.innerHTML = '';
            data.columns.forEach(c => {
              const badge = document.createElement('span');
              badge.className = 'admin-badge admin-badge-neutral';
              badge.textContent = c.label;
              previewBadgeList.appendChild(badge);
            });
          }
          if (previewWrap) previewWrap.style.display = 'block';
          if (btnConfirmCopy) btnConfirmCopy.disabled = false;
        } else {
          selectedSourceColumns = [];
          if (previewBadgeList) {
            previewBadgeList.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">Produk ini belum memiliki struktur kolom tabel ukuran.</span>';
          }
          if (previewWrap) previewWrap.style.display = 'block';
          if (btnConfirmCopy) btnConfirmCopy.disabled = true;
        }
      } catch {
        selectedSourceColumns = [];
        if (btnConfirmCopy) btnConfirmCopy.disabled = true;
      }
    });
  }

  if (btnConfirmCopy) {
    btnConfirmCopy.addEventListener('click', () => {
      if (selectedSourceColumns.length === 0) return;

      const hasExistingData = rows.some(r => Object.values(r).some(v => v && String(v).trim().length > 0));

      const executeCopy = () => {
        columns = selectedSourceColumns.map((c, i) => ({
          id: `col_${i + 1}`,
          label: c.label || `Kolom ${i + 1}`
        }));

        rows = [];
        const blankRow = {};
        columns.forEach(c => { blankRow[c.id] = ''; });
        rows.push(blankRow);

        closeModal();
        render();

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Struktur Kolom Disalin',
            text: 'Struktur kolom berhasil diterapkan dengan ID baru. Data sel siap diisi.',
            timer: 2000,
            showConfirmButton: false
          });
        }
      };

      if (hasExistingData) {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: 'Terapkan Struktur Baru?',
            text: 'Menyalin struktur kolom akan mereset data baris pada tabel saat ini. Lanjutkan?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00755a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Terapkan',
            cancelButtonText: 'Batal',
            customClass: {
              popup: 'swal2-custom-popup',
              title: 'swal2-custom-title',
              confirmButton: 'swal2-custom-confirm-btn',
              cancelButton: 'swal2-custom-cancel-btn'
            }
          }).then(result => {
            if (result.isConfirmed) executeCopy();
          });
        } else if (confirm('Menyalin struktur kolom akan mereset data baris pada tabel saat ini. Lanjutkan?')) {
          executeCopy();
        }
      } else {
        executeCopy();
      }
    });
  }

  const form = container.closest('form');
  if (form) {
    form.addEventListener('submit', () => {
      serializeAndSync();
    });
  }

  render();
})();
