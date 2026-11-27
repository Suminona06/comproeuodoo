/**
 * admin-bulk-delete.js - Shared Bulk Select & Delete Controller
 * Event delegation on [data-bulk-table], CSP-safe, accessible, zero inline handlers.
 */
(function (window, document) {
  'use strict';

  const ROW_CHECKBOX_SEL = '[data-bulk-id]';
  const SELECT_ALL_SEL = '[data-bulk-select-all]';
  const DELETE_BTN_SEL = '[data-bulk-delete-btn]';
  const BTN_LABEL_SEL = '[data-bulk-btn-label]';

  function isRowVisible(row) {
    if (!row || row.hidden || row.style.display === 'none') return false;
    return !row.querySelector('td[colspan]');
  }

  function getVisibleCheckboxes(container) {
    const checkboxes = Array.from(container.querySelectorAll(ROW_CHECKBOX_SEL));
    return checkboxes.filter((cb) => isRowVisible(cb.closest('tr')));
  }

  function getSelectedItems(container) {
    return getVisibleCheckboxes(container).filter((cb) => cb.checked);
  }

  function formatCountText(template, count) {
    return String(template || '').replace(/\{count\}/g, String(count));
  }

  function updateRowClasses(container) {
    container.querySelectorAll(ROW_CHECKBOX_SEL).forEach((cb) => {
      const row = cb.closest('tr');
      if (!row) return;
      const visible = isRowVisible(row);
      row.classList.toggle('is-bulk-selected', Boolean(visible && cb.checked));
    });
  }

  function updateHeaderCheckbox(container, visibleCheckboxes, selectedCount) {
    const selectAll = container.querySelector(SELECT_ALL_SEL);
    if (!selectAll) return;

    const totalVisible = visibleCheckboxes.length;
    selectAll.disabled = totalVisible === 0;
    selectAll.checked = totalVisible > 0 && selectedCount === totalVisible;
    selectAll.indeterminate = selectedCount > 0 && selectedCount < totalVisible;
  }

  function updateDeleteButton(container, selectedCount) {
    const btn = container.querySelector(DELETE_BTN_SEL);
    if (!btn) return;

    btn.classList.toggle('adm-bulk-hidden', selectedCount === 0);
    const template = btn.getAttribute('data-bulk-label-template') || '';
    const labelTarget = btn.querySelector(BTN_LABEL_SEL) || btn;
    if (template) {
      labelTarget.textContent = formatCountText(template, selectedCount);
    }
  }

  function sync(container) {
    if (!container) return;
    const visibleCheckboxes = getVisibleCheckboxes(container);
    const selectedCount = visibleCheckboxes.filter((cb) => cb.checked).length;

    updateRowClasses(container);
    updateHeaderCheckbox(container, visibleCheckboxes, selectedCount);
    updateDeleteButton(container, selectedCount);
  }

  function reset(container) {
    if (!container) return;
    container.querySelectorAll(ROW_CHECKBOX_SEL).forEach((cb) => {
      cb.checked = false;
    });
    const selectAll = container.querySelector(SELECT_ALL_SEL);
    if (selectAll) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    }
    sync(container);
  }

  function resetAllContainers() {
    document.querySelectorAll('[data-bulk-table]').forEach((container) => {
      reset(container);
    });
  }

  function buildConfirmOptions(container, btn, selected) {
    const count = selected.length;
    const relatedCount = selected.reduce((sum, cb) => {
      const val = parseInt(cb.getAttribute('data-bulk-related-count') || '0', 10);
      return sum + (Number.isFinite(val) && val > 0 ? val : 0);
    }, 0);

    const title = btn.getAttribute('data-bulk-confirm-title')
      || container.getAttribute('data-bulk-confirm-title')
      || 'Hapus Data Terpilih?';
    const baseText = formatCountText(
      btn.getAttribute('data-bulk-confirm-text') || `Anda akan menghapus ${count} data terpilih.`,
      count
    );
    const relatedTemplate = btn.getAttribute('data-bulk-related-text') || '';
    const relatedText = relatedCount > 0 && relatedTemplate
      ? `\n${formatCountText(relatedTemplate, relatedCount)}`
      : '';

    return { title, text: `${baseText}${relatedText}`, isDanger: true };
  }

  function setButtonLoading(btn, loading) {
    btn.classList.toggle('is-loading', loading);
    btn.disabled = loading;
  }

  function refreshAfterDelete(container) {
    const mode = container.getAttribute('data-bulk-mode') || 'reload';
    if (mode === 'fetch' && typeof window.reloadAdminProductsAfterBulkDelete === 'function') {
      window.reloadAdminProductsAfterBulkDelete();
      return;
    }
    window.location.reload();
  }

  function notifyToast(type, message) {
    if (typeof window.adminToast === 'function') {
      window.adminToast(type, message);
    }
  }

  function extractSelectedIds(selected) {
    return selected
      .map((cb) => parseInt(cb.getAttribute('data-bulk-id') || '', 10))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  async function postBulkDeleteIds(endpoint, ids, failedMsg) {
    const res = await window.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || failedMsg);
    }
    return data;
  }

  function getSuccessMessage(btn, data, count) {
    if (data && data.message) return data.message;
    const tpl = btn.getAttribute('data-bulk-success-text');
    return tpl ? formatCountText(tpl, count) : `${count} data berhasil dihapus.`;
  }

  async function executeBulkDelete(container, btn, selected) {
    const endpoint = container.getAttribute('data-bulk-endpoint');
    const ids = extractSelectedIds(selected);
    if (!endpoint || ids.length === 0) return;

    const failedMsg = btn.getAttribute('data-bulk-error-failed') || 'Gagal menghapus data terpilih.';
    setButtonLoading(btn, true);

    try {
      const data = await postBulkDeleteIds(endpoint, ids, failedMsg);
      notifyToast('success', getSuccessMessage(btn, data, ids.length));
      reset(container);
      refreshAfterDelete(container);
    } catch (err) {
      notifyToast('error', (err && err.message) || failedMsg);
      setButtonLoading(btn, false);
    }
  }

  async function handleBulkDeleteClick(btn) {
    if (btn.disabled || btn.classList.contains('is-loading')) return;
    const container = btn.closest('[data-bulk-table]');
    if (!container) return;

    const selected = getSelectedItems(container);
    if (selected.length === 0) {
      notifyToast('error', btn.getAttribute('data-bulk-error-empty') || 'Pilih minimal 1 data.');
      return;
    }

    const confirmOpts = buildConfirmOptions(container, btn, selected);
    const confirmed = typeof window.showAdminConfirm === 'function'
      ? await window.showAdminConfirm(confirmOpts)
      : false;

    if (confirmed) {
      await executeBulkDelete(container, btn, selected);
    }
  }

  function handleSelectAllChange(selectAll) {
    const container = selectAll.closest('[data-bulk-table]');
    if (!container) return;

    const checked = Boolean(selectAll.checked);
    getVisibleCheckboxes(container).forEach((cb) => {
      cb.checked = checked;
    });
    sync(container);
  }

  function init() {
    document.querySelectorAll('[data-bulk-table]').forEach(sync);

    document.addEventListener('change', (e) => {
      const target = e.target;
      if (!target || !target.matches) return;
      if (target.matches(SELECT_ALL_SEL)) {
        handleSelectAllChange(target);
        return;
      }
      if (target.matches(ROW_CHECKBOX_SEL)) {
        sync(target.closest('[data-bulk-table]'));
      }
    });

    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(DELETE_BTN_SEL) : null;
      if (btn) handleBulkDeleteClick(btn);
    });

    document.addEventListener('admin:table-filtered', resetAllContainers);
    document.addEventListener('admin:products-loaded', resetAllContainers);
  }

  window.AdminBulkSelect = { reset, sync };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(window, document));
