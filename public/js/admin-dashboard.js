/**
 * Pengelolaan Interaktivitas Halaman Dashboard Admin
 */

let dashboardInquiries = [];

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function populateModalFields(item) {
  setElText('modalClientCompany', item.company || 'Pribadi / Retail');
  setElText('modalClientName', item.name);
  setElText('modalClientPhone', item.phone);
  setElText('modalClientEmail', item.email);
  setElText('modalClientProduct', item.product_name_id || 'Umum (Katalog)');
  setElText('modalClientMessage', item.message || 'Tidak ada pesan tertulis.');

  const notesEl = document.getElementById('modalAdminNotes');
  if (notesEl) notesEl.value = item.admin_notes || '';
}

function viewInquiryDetail(itemOrId) {
  let item = itemOrId;
  if (typeof itemOrId === 'number' || typeof itemOrId === 'string') {
    item = dashboardInquiries.find((i) => String(i.id) === String(itemOrId));
  }
  if (!item) return;

  const idEl = document.getElementById('modalInquiryId');
  if (idEl) idEl.value = item.id;
  populateModalFields(item);

  if (typeof window.openAdminModal === 'function') {
    window.openAdminModal('inquiryDetailModal');
  }
}
window.viewInquiryDetail = viewInquiryDetail;

function updateRowStatusVisual(id, newStatus) {
  const row = document.getElementById(`row-${id}`);
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

async function updateInquiryStatus(id, newStatus) {
  try {
    const res = await fetch(`/admin/inquiries/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (!data.success) {
      notifyStatusError(data.message);
      return;
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`Status inquiry #${id} berhasil diperbarui ke: ${newStatus}`);
    }
    updateRowStatusVisual(id, newStatus);
  } catch {
    notifyStatusError('Terjadi kesalahan jaringan.');
  }
}

async function saveModalNotes(id, notes) {
  try {
    const res = await fetch(`/admin/inquiries/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ admin_notes: notes })
    });
    const data = await res.json();
    if (!data.success) {
      notifyStatusError(data.message || 'Gagal menyimpan catatan.');
      return;
    }

    if (typeof window.showToast === 'function') {
      window.showToast('Catatan admin berhasil disimpan!');
    }
    if (typeof window.closeAdminModal === 'function') {
      window.closeAdminModal('inquiryDetailModal');
    }
  } catch {
    notifyStatusError('Gagal menyimpan catatan.');
  }
}

function initDashboardEvents() {
  const dataScript = document.getElementById('dashboardInquiriesJson');
  if (dataScript && dataScript.textContent) {
    try {
      dashboardInquiries = JSON.parse(dataScript.textContent);
    } catch {
      dashboardInquiries = [];
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-inquiry-id]');
    if (btn && btn.classList.contains('btn-action-view')) {
      const id = btn.getAttribute('data-inquiry-id');
      viewInquiryDetail(id);
    }
  });

  document.addEventListener('change', (e) => {
    const sel = e.target.closest('.inquiry-status-select');
    if (!sel) return;
    const id = sel.getAttribute('data-id');
    if (id) updateInquiryStatus(id, sel.value);
  });

  const modalNotesForm = document.getElementById('modalNotesForm');
  if (modalNotesForm) {
    modalNotesForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('modalInquiryId')?.value;
      const notes = document.getElementById('modalAdminNotes')?.value;
      if (id) saveModalNotes(id, notes);
    });
  }
}

document.addEventListener('DOMContentLoaded', initDashboardEvents);

