/**
 * Admin Panel Client Script - PT Euodoo CMS v2.0
 * Acuan: public/prototype-admin.html
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile drawer controls
  const sidebar = document.querySelector('.app-sidebar');
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const backdrop = document.querySelector('.admin-backdrop');

  function openSidebar() {
    document.body.classList.add('sidebar-open');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.body.classList.contains('sidebar-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.body.classList.contains('sidebar-open')) closeSidebar();
      closeAllModals();
    }
  });

  // Table status tabs and live search
  const tabButtons = document.querySelectorAll('.filter-tabs-wrap .tab-btn');
  const liveSearch = document.getElementById('liveSearchInput');
  const tableRows = document.querySelectorAll('.data-table tbody tr[data-status], .admin-table tbody tr[data-status]');

  let currentFilter = 'all';
  let searchQuery = '';

  function filterRows() {
    tableRows.forEach(row => {
      const rowStatus = row.getAttribute('data-status') || '';
      const text = row.textContent.toLowerCase();
      const matchFilter = (currentFilter === 'all' || rowStatus === currentFilter);
      const matchSearch = (!searchQuery || text.includes(searchQuery));

      if (matchFilter && matchSearch) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  if (tabButtons.length > 0) {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        filterRows();
      });
    });
  }

  if (liveSearch) {
    liveSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterRows();
    });
  }

  // Modal backdrop click close
  document.querySelectorAll('.admin-modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });
});

// Toast notification helper
export function showAdminToast(message, duration = 3000) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${message}</span>
  `;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Modal open/close helpers
window.openAdminModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
};

window.closeAdminModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
};

window.closeAllModals = function() {
  document.querySelectorAll('.admin-modal-backdrop').forEach(m => m.classList.remove('open'));
  document.querySelectorAll('.slide-drawer').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.drawer-backdrop').forEach(b => b.classList.remove('open'));
};

window.showToast = showAdminToast;

// Copy text helper
window.copyToClipboard = function(text, successMsg = 'Tautan berhasil disalin ke clipboard!') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showAdminToast(successMsg);
    });
  } else {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showAdminToast(successMsg);
  }
};
