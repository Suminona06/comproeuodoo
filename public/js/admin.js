/**
 * Admin Panel Client Script
 * PT Euodoo CMS
 * Interactivity: Sidebar Drawer, Live Filters & Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sidebar Toggle & Mobile Drawer Control
  const sidebar = document.getElementById('adminSidebar');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const backdrop = document.getElementById('adminBackdrop');

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

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Keyboard accessibility: Escape closes mobile drawer (R-32)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
      closeSidebar();
    }
  });

  // 2. Interactive Real-time Table Filtering & Search
  const tableRows = document.querySelectorAll('.interactive-table tbody tr[data-status]');
  const filterPills = document.querySelectorAll('.filter-pill[data-filter]');
  const searchInput = document.getElementById('tableLiveSearchInput');
  const emptyFilterRow = document.getElementById('tableFilterEmptyRow');

  let activeStatus = 'all';
  let searchQuery = '';

  function applyTableFilters() {
    let visibleCount = 0;

    tableRows.forEach((row) => {
      const rowStatus = row.getAttribute('data-status') || '';
      const rowText = row.textContent.toLowerCase();

      const matchesStatus = (activeStatus === 'all' || rowStatus === activeStatus);
      const matchesSearch = (!searchQuery || rowText.includes(searchQuery));

      if (matchesStatus && matchesSearch) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    if (emptyFilterRow) {
      emptyFilterRow.style.display = visibleCount === 0 ? '' : 'none';
    }
  }

  if (filterPills.length > 0) {
    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        filterPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        activeStatus = pill.getAttribute('data-filter') || 'all';
        applyTableFilters();
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      applyTableFilters();
    });
  }

  // 3. Confirmation on Delete Actions
  document.querySelectorAll('form.form-delete').forEach((form) => {
    form.addEventListener('submit', (e) => {
      const confirmMsg = form.getAttribute('data-confirm') || 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.';
      if (!window.confirm(confirmMsg)) {
        e.preventDefault();
      }
    });
  });

  // 4. Image Preview Before Upload
  document.querySelectorAll('input[type="file"][data-preview]').forEach((input) => {
    input.addEventListener('change', () => {
      const previewId = input.getAttribute('data-preview');
      const previewImg = document.getElementById(previewId);
      if (previewImg && input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          previewImg.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
      }
    });
  });
});

