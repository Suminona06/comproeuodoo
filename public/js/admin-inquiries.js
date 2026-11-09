/**
 * Interaktivitas Halaman Pesan Masuk & RFQ (Inquiries)
 * Paginasi tanpa reload, sinkronisasi filter/search, dan modal detail.
 */

let inquiriesData = [];
let currentStatus = 'all';
let searchQuery = '';

if (typeof window.initEuDropdowns !== 'function') {
  window.initEuDropdowns = function (root) {
    if (window.EuDropdown && typeof window.EuDropdown.init === 'function') {
      window.EuDropdown.init(root);
    }
  };
}

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

function getCurrentPerPage() {
  const bar = document.getElementById('inquiryPaginationBar') || document.querySelector('.pgn-bar');
  if (bar) {
    const pp = parseInt(bar.getAttribute('data-per-page'), 10);
    if (pp) return pp;
  }
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get('per_page'), 10) || 10;
}

const paginationOptions = {
  containerSelector: '#inquiryPaginationBar',
  scrollToSelector: '.table-card',
  getQueryParams: () => ({
    status: currentStatus,
    search: searchQuery
  }),
  onPageChange: ({ url, isPopState }) => {
    loadInquiries(url, { isPopState });
  }
};

function loadInquiries(url, opts = {}) {
  const tbody = document.getElementById('inquiryTableBody');
  if (tbody) {
    tbody.style.opacity = '0.5';
  }

  window.EuPagination.fetchPageData(
    url,
    (data) => {
      if (tbody) {
        tbody.innerHTML = data.rowsHtml;
        tbody.style.opacity = '1';
      }

      const pgnWrap = document.getElementById('inquiryPaginationWrap');
      if (pgnWrap && data.paginationHtml) {
        pgnWrap.innerHTML = data.paginationHtml;
      }

      inquiriesData = data.inquiries || [];
      const dataScript = document.getElementById('inquiriesDataJson');
      if (dataScript) {
        dataScript.textContent = JSON.stringify(inquiriesData);
      }

      if (tbody) {
        if (window.EuDropdown && typeof window.EuDropdown.init === 'function') {
          window.EuDropdown.init(tbody);
        }
        if (typeof window.initEuDropdowns === 'function') {
          window.initEuDropdowns(tbody);
        }
      }

      const newBar = document.getElementById('inquiryPaginationBar') || document.querySelector('.pgn-bar');
      if (newBar && window.EuPagination) {
        window.EuPagination.bind(newBar, paginationOptions);
      }

      // Mundur otomatis jika halaman terakhir kosong setelah aksi
      if (inquiriesData.length === 0 && data.currentPage > 1) {
        const prevPage = Math.max(1, data.currentPage - 1);
        const newUrl = window.EuPagination.createPaginationUrl(
          '/admin/inquiries',
          { status: currentStatus, search: searchQuery },
          prevPage,
          data.perPage
        );
        window.EuPagination.updateUrlState(newUrl, true);
        loadInquiries(newUrl, { isPopState: false });
      }
    },
    () => {
      if (tbody) tbody.style.opacity = '1';
      if (typeof window.showToast === 'function') {
        window.showToast('Gagal memuat data inquiry.');
      }
    }
  );
}

function syncFilterAndSearchUI() {
  const tabsWrap = document.querySelector('.filter-tabs-wrap');
  if (tabsWrap) {
    tabsWrap.querySelectorAll('.tab-btn').forEach((btn) => {
      const href = btn.getAttribute('href') || '';
      try {
        const u = new URL(href, window.location.origin);
        const s = u.searchParams.get('status') || 'all';
        btn.classList.toggle('active', s === currentStatus);
      } catch {
        // fallback ignore
      }
    });
  }

  const searchInput = document.querySelector('.search-input-wrap input[name="search"]');
  if (searchInput) {
    searchInput.value = searchQuery;
  }

  const exportBtn = document.querySelector('a[href*="/admin/inquiries/export"]');
  if (exportBtn) {
    exportBtn.setAttribute('href', `/admin/inquiries/export?status=${encodeURIComponent(currentStatus)}`);
  }
}

function initInquiriesEvents() {
  const urlParams = new URLSearchParams(window.location.search);
  currentStatus = urlParams.get('status') || 'all';
  searchQuery = urlParams.get('search') || '';

  const dataScript = document.getElementById('inquiriesDataJson');
  if (dataScript && dataScript.textContent) {
    try {
      inquiriesData = JSON.parse(dataScript.textContent);
    } catch {
      inquiriesData = [];
    }
  }

  if (window.EuPagination) {
    window.EuPagination.init(paginationOptions);
  }

  // Delegasi klik tombol tinjau cepat
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-inquiry-id]');
    if (btn && btn.classList.contains('btn-action-view')) {
      const id = btn.getAttribute('data-inquiry-id');
      openInquiryById(id);
    }
  });

  // Delegasi perubahan status inline
  document.addEventListener('change', (e) => {
    const sel = e.target.closest('.inquiry-status-select');
    if (!sel) return;
    const id = sel.getAttribute('data-id');
    if (id) quickChangeInquiryStatus(id, sel.value);
  });

  // Filter tabs tanpa reload
  const tabsWrap = document.querySelector('.filter-tabs-wrap');
  if (tabsWrap) {
    tabsWrap.addEventListener('click', (e) => {
      const link = e.target.closest('a.tab-btn');
      if (!link) return;
      e.preventDefault();

      const href = link.getAttribute('href') || '';
      try {
        const u = new URL(href, window.location.origin);
        const newStatus = u.searchParams.get('status') || 'all';
        if (newStatus === currentStatus) return;

        currentStatus = newStatus;
        syncFilterAndSearchUI();

        const perPage = getCurrentPerPage();
        const nextUrl = window.EuPagination.createPaginationUrl(
          '/admin/inquiries',
          { status: currentStatus, search: searchQuery },
          1,
          perPage
        );
        window.EuPagination.updateUrlState(nextUrl);
        loadInquiries(nextUrl);
      } catch {
        window.location.href = href;
      }
    });
  }

  // Form pencarian tanpa reload
  const searchForm = document.querySelector('.search-input-wrap');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = searchForm.querySelector('input[name="search"]');
      searchQuery = input ? input.value.trim() : '';

      const perPage = getCurrentPerPage();
      const nextUrl = window.EuPagination.createPaginationUrl(
        '/admin/inquiries',
        { status: currentStatus, search: searchQuery },
        1,
        perPage
      );
      window.EuPagination.updateUrlState(nextUrl);
      loadInquiries(nextUrl);
    });
  }

  // Sinkronisasi saat user navigasi back/forward
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    currentStatus = params.get('status') || 'all';
    searchQuery = params.get('search') || '';
    syncFilterAndSearchUI();
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
