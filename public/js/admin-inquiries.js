/**
 * Pengelolaan Interaktivitas Halaman Pesan Masuk & RFQ (Inquiries)
 */

let inquiriesData = [];

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function populateModalFields(item) {
  setElText('mClientCompany', item.company || 'Retail / Personal');
  setElText('mClientName', item.name);
  setElText('mClientPhone', item.phone);
  setElText('mClientEmail', item.email);
  setElText('mClientProduct', item.product_name_id || 'Umum (Katalog)');
  setElText('mClientMessage', item.message || 'Tidak ada catatan tertulis.');

  const notesEl = document.getElementById('mAdminNotes');
  if (notesEl) notesEl.value = item.admin_notes || '';
}

function openInquiryModal(item) {
  const idEl = document.getElementById('mInquiryId');
  if (idEl) idEl.value = item.id;
  populateModalFields(item);

  if (typeof window.openAdminModal === 'function') {
    window.openAdminModal('inquiryDetailModal');
  }
}

function openInquiryById(id) {
  const item = inquiriesData.find((i) => String(i.id) === String(id));
  if (item) {
    openInquiryModal(item);
  }
}
window.openInquiryById = openInquiryById;

function updateRowStatusVisual(id, newStatus) {
  const row = document.getElementById(`inq-row-${id}`);
  if (!row) return;

  row.setAttribute('data-status', newStatus);
  const sel = row.querySelector('.status-select');
  if (!sel) return;

  const statusMap = {
    ditindaklanjuti: 'selesai',
    dibaca: 'diproses'
  };
  const statusClass = statusMap[newStatus] || newStatus;

  sel.classList.remove('st-baru', 'st-diproses', 'st-selesai', 'st-ditolak');
  sel.classList.add(`st-${statusClass}`, 'eu-dd-native', 'sr-only');

  const dd = sel.closest('.eu-dd');
  if (dd) {
    dd.classList.remove('st-baru', 'st-diproses', 'st-selesai', 'st-ditolak');
    dd.classList.add(`st-${statusClass}`);
  }
}

function notifyStatusError(msg) {
  if (typeof window.showAdminAlert === 'function') {
    window.showAdminAlert('Gagal', msg || 'Gagal mengubah status.', 'error');
  }
}

async function quickChangeInquiryStatus(id, newStatus) {
  try {
    const res = await fetch(`/admin/inquiries/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (!data.success) {
      notifyStatusError(data.message);
      return;
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`Status inquiry #${id} berhasil diubah ke: ${newStatus}`);
    }
    updateRowStatusVisual(id, newStatus);
  } catch {
    notifyStatusError('Gagal mengubah status.');
  }
}

async function saveAdminNotes(id, notes) {
  try {
    const res = await fetch(`/admin/inquiries/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ admin_notes: notes })
    });
    const data = await res.json();
    if (!data.success) {
      notifyStatusError(data.message || 'Gagal menyimpan catatan.');
      return;
    }

    if (typeof window.showToast === 'function') {
      window.showToast('Catatan berhasil diperbarui!');
    }
    if (typeof window.closeAdminModal === 'function') {
      window.closeAdminModal('inquiryDetailModal');
    }
  } catch {
    notifyStatusError('Gagal menyimpan catatan.');
  }
}

function initInquiriesEvents() {
  const dataScript = document.getElementById('inquiriesDataJson');
  if (dataScript && dataScript.textContent) {
    try {
      inquiriesData = JSON.parse(dataScript.textContent);
    } catch {
      inquiriesData = [];
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-inquiry-id]');
    if (btn && btn.classList.contains('btn-action-view')) {
      const id = btn.getAttribute('data-inquiry-id');
      openInquiryById(id);
    }
  });

  document.addEventListener('change', (e) => {
    const sel = e.target.closest('.inquiry-status-select');
    if (!sel) return;
    const id = sel.getAttribute('data-id');
    if (id) quickChangeInquiryStatus(id, sel.value);
  });

  const notesForm = document.getElementById('mNotesForm');
  if (notesForm) {
    notesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('mInquiryId')?.value;
      const notes = document.getElementById('mAdminNotes')?.value;
      if (id) saveAdminNotes(id, notes);
    });
  }
}

document.addEventListener('DOMContentLoaded', initInquiriesEvents);
