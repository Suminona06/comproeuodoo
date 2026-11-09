/**
 * Interaktivitas Katalog Produk Admin (/admin/products)
 * Paginasi tanpa reload, sinkronisasi filter kategori & status, serta pencarian instan.
 */

let selectedCategory = null;
let selectedStatus = null;
let searchQuery = '';
let searchDebounceTimer = null;

function getCurrentPerPage() {
  const bar = document.getElementById('productPaginationBar') || document.querySelector('.pgn-bar');
  if (bar) {
    const pp = parseInt(bar.getAttribute('data-per-page'), 10);
    if (pp) return pp;
  }
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get('per_page'), 10) || 10;
}

const paginationOptions = {
  containerSelector: '#productPaginationBar',
  scrollToSelector: '.table-card',
  getQueryParams: () => ({
    category: selectedCategory,
    status: selectedStatus,
    q: searchQuery
  }),
  onPageChange: ({ url, isPopState }) => {
    loadProducts(url, { isPopState });
  }
};

function loadProducts(url, opts = {}) {
  const tbody = document.getElementById('productTableBody');
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

      const pgnWrap = document.getElementById('productPaginationWrap');
      if (pgnWrap && data.paginationHtml) {
        pgnWrap.innerHTML = data.paginationHtml;
      }

      const newBar = document.getElementById('productPaginationBar') || document.querySelector('.pgn-bar');
      if (newBar && window.EuPagination) {
        window.EuPagination.bind(newBar, paginationOptions);
      }

      // Perbarui tautan ekspor CSV sesuai filter aktif
      const exportLink = document.querySelector('a[href*="/admin/products/export"]');
      if (exportLink) {
        const expParams = new URLSearchParams();
        if (selectedCategory) expParams.set('category', selectedCategory);
        if (selectedStatus) expParams.set('status', selectedStatus);
        const qs = expParams.toString();
        exportLink.setAttribute('href', qs ? `/admin/products/export?${qs}` : '/admin/products/export');
      }

      // Mundur otomatis jika halaman aktif menjadi kosong (mis. setelah penghapusan produk terakhir)
      if (data.products && data.products.length === 0 && data.currentPage > 1) {
        const prevPage = Math.max(1, data.currentPage - 1);
        const newUrl = window.EuPagination.createPaginationUrl(
          '/admin/products',
          { category: selectedCategory, status: selectedStatus, q: searchQuery },
          prevPage,
          data.perPage
        );
        window.EuPagination.updateUrlState(newUrl, true);
        loadProducts(newUrl, { isPopState: false });
      }
    },
    () => {
      if (tbody) tbody.style.opacity = '1';
      if (typeof window.showToast === 'function') {
        window.showToast('Gagal memuat katalog produk.');
      }
    }
  );
}

function syncFilterAndSearchUI() {
  const tabs = document.querySelectorAll('#prodFilterTabs .tab-btn');
  tabs.forEach((tab) => {
    const tabStatus = tab.getAttribute('data-status') || '';
    const isActive = selectedStatus ? tabStatus === selectedStatus : tabStatus === '';
    tab.classList.toggle('active', isActive);
  });

  const catSelect = document.getElementById('prodCategorySelect');
  if (catSelect) {
    catSelect.value = selectedCategory || '';
    const ddWrapper = catSelect.closest('.eu-dd');
    if (ddWrapper) {
      const selectedOption = catSelect.options[catSelect.selectedIndex];
      const valEl = ddWrapper.querySelector('.eu-dd-value');
      if (valEl && selectedOption) {
        valEl.textContent = selectedOption.textContent.trim();
      }
    }
  }

  const searchInput = document.getElementById('prodSearchInput');
  if (searchInput) {
    searchInput.value = searchQuery || '';
  }
}

function initProductsEvents() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawCat = urlParams.get('category') || urlParams.get('category_id');
  selectedCategory = rawCat ? parseInt(rawCat, 10) : null;
  selectedStatus = urlParams.get('status') || null;
  searchQuery = urlParams.get('q') || urlParams.get('search') || '';

  if (window.EuPagination) {
    window.EuPagination.init(paginationOptions);
  }

  // Filter tabs tanpa reload
  const tabsWrap = document.getElementById('prodFilterTabs');
  if (tabsWrap) {
    tabsWrap.addEventListener('click', (e) => {
      const link = e.target.closest('a.tab-btn');
      if (!link) return;
      e.preventDefault();

      const newStatus = link.getAttribute('data-status') || null;
      if (newStatus === selectedStatus) return;

      selectedStatus = newStatus;
      syncFilterAndSearchUI();

      const curPerPage = getCurrentPerPage();
      const nextUrl = window.EuPagination.createPaginationUrl(
        '/admin/products',
        { category: selectedCategory, status: selectedStatus, q: searchQuery },
        1,
        curPerPage
      );
      window.EuPagination.updateUrlState(nextUrl);
      loadProducts(nextUrl);
    });
  }

  // Filter kategori tanpa reload
  const catSelect = document.getElementById('prodCategorySelect');
  if (catSelect) {
    catSelect.addEventListener('change', () => {
      const val = catSelect.value;
      selectedCategory = val ? parseInt(val, 10) : null;
      syncFilterAndSearchUI();

      const curPerPage = getCurrentPerPage();
      const nextUrl = window.EuPagination.createPaginationUrl(
        '/admin/products',
        { category: selectedCategory, status: selectedStatus, q: searchQuery },
        1,
        curPerPage
      );
      window.EuPagination.updateUrlState(nextUrl);
      loadProducts(nextUrl);
    });
  }

  // Form pencarian tanpa reload
  const searchForm = document.getElementById('prodSearchForm');
  const searchInput = document.getElementById('prodSearchInput');

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      searchQuery = searchInput ? searchInput.value.trim() : '';

      const curPerPage = getCurrentPerPage();
      const nextUrl = window.EuPagination.createPaginationUrl(
        '/admin/products',
        { category: selectedCategory, status: selectedStatus, q: searchQuery },
        1,
        curPerPage
      );
      window.EuPagination.updateUrlState(nextUrl);
      loadProducts(nextUrl);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim();
        const curPerPage = getCurrentPerPage();
        const nextUrl = window.EuPagination.createPaginationUrl(
          '/admin/products',
          { category: selectedCategory, status: selectedStatus, q: searchQuery },
          1,
          curPerPage
        );
        window.EuPagination.updateUrlState(nextUrl);
        loadProducts(nextUrl);
      }, 350);
    });
  }

  // Sinkronisasi saat user navigasi back/forward
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const pCat = params.get('category') || params.get('category_id');
    selectedCategory = pCat ? parseInt(pCat, 10) : null;
    selectedStatus = params.get('status') || null;
    searchQuery = params.get('q') || params.get('search') || '';
    syncFilterAndSearchUI();
  });
}

document.addEventListener('DOMContentLoaded', initProductsEvents);
