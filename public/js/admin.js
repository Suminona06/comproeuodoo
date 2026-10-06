/**
 * Admin Panel Client Script - PT Euodoo CMS v2.0
 * Acuan: public/prototype-admin.html
 */

document.addEventListener('DOMContentLoaded', () => {
  // Desktop Collapsible Sidebar Controls
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');

  function toggleSidebarCollapse() {
    if (window.innerWidth <= 900) {
      // Di mobile berperilaku sebagai drawer
      if (document.body.classList.contains('sidebar-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
      return;
    }

    const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
    try {
      localStorage.setItem('admin_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    } catch (e) {}
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebarCollapse();
    });
  }

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      toggleSidebarCollapse();
    }
  });

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

  // CMS Tentang Kami Tabs Navigation
  const aboutTabButtons = document.querySelectorAll('.about-tabs-nav .about-tab-btn');
  const aboutTabPanes = document.querySelectorAll('.about-tab-pane');

  if (aboutTabButtons.length > 0 && aboutTabPanes.length > 0) {
    function switchAboutTab(targetId) {
      aboutTabButtons.forEach(btn => {
        const isMatch = btn.getAttribute('data-tab') === targetId;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      aboutTabPanes.forEach(pane => {
        const isMatch = pane.id === targetId;
        pane.classList.toggle('active', isMatch);
      });

      try {
        sessionStorage.setItem('active_about_tab', targetId);
      } catch (e) {}
    }

    aboutTabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-tab');
        if (targetId) switchAboutTab(targetId);
      });
    });

    // Restore last visited tab or hash
    let initialTab = window.location.hash ? window.location.hash.substring(1) : '';
    if (!initialTab) {
      try {
        initialTab = sessionStorage.getItem('active_about_tab') || '';
      } catch (e) {}
    }

    if (initialTab && document.getElementById(initialTab)) {
      switchAboutTab(initialTab);
    }
  }
});

// Toast notification helper
function showAdminToast(message, duration = 3000) {
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

// Global modal click delegation for close buttons & backdrops
document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('.admin-modal-close, .modal-close-btn, [data-modal-close]');
  if (closeBtn) {
    const targetModal = closeBtn.closest('.admin-modal-backdrop') || document.querySelector('.admin-modal-backdrop.open');
    if (targetModal) targetModal.classList.remove('open');
    return;
  }
  if (e.target.classList && e.target.classList.contains('admin-modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

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

// CSRF Protection Auto-Injector for All Forms (Multipart, Standard, Delete, & Ajax)
(function initCsrfAutoHandler() {
  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta && meta.content) return meta.content;
    const input = document.querySelector('input[name="_csrf"]');
    return input ? input.value : '';
  }

  function injectCsrfIntoForm(form) {
    if (!form || form.tagName !== 'FORM') return;
    const method = (form.getAttribute('method') || 'GET').toUpperCase();
    if (method === 'GET') return;

    const token = getCsrfToken();
    if (!token) return;

    // 1. Pastikan input hidden _csrf tersedia dan selalu tersinkronisasi
    let hiddenInput = form.querySelector('input[name="_csrf"]');
    if (!hiddenInput) {
      hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = '_csrf';
      hiddenInput.value = token;
      form.appendChild(hiddenInput);
    } else {
      hiddenInput.value = token;
    }

    // 2. Sinkronkan token ke action URL sebagai query param (?_csrf=...)
    // Ini mengamankan form multipart (multer parse sesudah middleware) dan form delete
    let action = form.getAttribute('action') || window.location.pathname;
    try {
      const url = new URL(action, window.location.origin);
      url.searchParams.set('_csrf', token);
      form.setAttribute('action', url.pathname + url.search);
    } catch (e) {
      if (!action.includes('_csrf=')) {
        const separator = action.includes('?') ? '&' : '?';
        form.setAttribute('action', `${action}${separator}_csrf=${encodeURIComponent(token)}`);
      }
    }
  }

  function syncAllForms() {
    document.querySelectorAll('form').forEach(injectCsrfIntoForm);
  }

  // Jalankan saat DOM siap dan saat form disubmit
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAllForms);
  } else {
    syncAllForms();
  }

  // Intercept form submission event
  document.addEventListener('submit', (e) => {
    const form = e.target;
    injectCsrfIntoForm(form);
  }, true);

  // Wrap window.fetch to automatically include X-CSRF-Token on mutative requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const token = getCsrfToken();
      if (token) {
        options.headers = options.headers || {};
        if (options.headers instanceof Headers) {
          if (!options.headers.has('X-CSRF-Token')) {
            options.headers.set('X-CSRF-Token', token);
          }
        } else if (Array.isArray(options.headers)) {
          if (!options.headers.some(([k]) => k.toLowerCase() === 'x-csrf-token')) {
            options.headers.push(['X-CSRF-Token', token]);
          }
        } else {
          if (!options.headers['X-CSRF-Token'] && !options.headers['x-csrf-token']) {
            options.headers['X-CSRF-Token'] = token;
          }
        }
      }
    }
    return originalFetch.call(this, url, options);
  };
})();
