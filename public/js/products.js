/**
 * Product Catalog Dynamic Filtering, Search & URL Synchronization
 * Coordinates debounced search, sorting, category selection, and browser history.
 */
(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('plp-products-grid');
    const sidebarList = document.getElementById('plp-sidebar-list');
    const searchForm = document.getElementById('plp-search-form');
    const searchInput = document.getElementById('plp-search-input');
    const searchClear = document.getElementById('plp-search-clear');
    const sortSelect = document.getElementById('plp-sort-select');
    const moreWrap = document.getElementById('plp-more-wrap') || document.querySelector('.plp-more-wrap');
    const moreBtn = document.getElementById('plp-load-more-btn');
    const liveRegion = document.getElementById('plp-live-region');
    const pagination = document.querySelector('.plp-pagination');
    const sidebarEl = document.getElementById('plp-sidebar');
    const drawerOpenBtn = document.getElementById('plp-filter-drawer-open');
    const drawerCloseBtn = document.getElementById('plp-filter-drawer-close');
    const drawerBackdrop = document.getElementById('plp-filter-drawer-backdrop');
    const lang = document.documentElement.lang === 'en' ? 'en' : 'id';

    if (!grid) return;

    if (pagination) {
      pagination.style.display = 'none';
    }

    let searchTimer = null;
    let abortController = null;
    let currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10) || 1;
    if (moreBtn && moreBtn.dataset.currentPage) {
      const parsedPage = parseInt(moreBtn.dataset.currentPage, 10);
      if (!isNaN(parsedPage)) currentPage = parsedPage;
    }
    let isLoadingMore = false;

    function openDrawer() {
      if (!sidebarEl || !drawerBackdrop) return;
      sidebarEl.classList.add('is-open');
      drawerBackdrop.classList.add('is-open');
      document.body.classList.add('plp-drawer-locked');
      if (drawerOpenBtn) drawerOpenBtn.setAttribute('aria-expanded', 'true');

      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animeLib = typeof anime !== 'undefined' ? anime : (typeof window !== 'undefined' ? window.anime : null);

      if (animeLib && !prefersReducedMotion) {
        animeLib.remove([sidebarEl, drawerBackdrop]);
        const items = sidebarEl.querySelectorAll('.plp-sidebar-item');
        if (items.length > 0) animeLib.remove(items);

        // Backdrop fade in
        animeLib({
          targets: drawerBackdrop,
          opacity: [0, 1],
          duration: 320,
          easing: 'easeOutQuad'
        });

        // Sidebar slide-in with natural smooth deceleration curve
        animeLib({
          targets: sidebarEl,
          translateX: ['-100%', '0%'],
          duration: 380,
          easing: 'easeOutQuart',
          complete: () => {
            if (drawerCloseBtn) drawerCloseBtn.focus();
          }
        });

        // Stagger category items for an ultra-delightful entrance cascade
        if (items.length > 0) {
          animeLib({
            targets: items,
            translateX: [-18, 0],
            opacity: [0, 1],
            delay: animeLib.stagger(30, { start: 100 }),
            duration: 320,
            easing: 'easeOutQuad'
          });
        }
      } else {
        if (drawerCloseBtn) drawerCloseBtn.focus();
      }
    }

    function closeDrawer() {
      if (!sidebarEl || !drawerBackdrop) return;
      document.body.classList.remove('plp-drawer-locked');
      if (drawerOpenBtn) {
        drawerOpenBtn.setAttribute('aria-expanded', 'false');
        drawerOpenBtn.focus();
      }

      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animeLib = typeof anime !== 'undefined' ? anime : (typeof window !== 'undefined' ? window.anime : null);

      if (animeLib && !prefersReducedMotion && sidebarEl.classList.contains('is-open')) {
        animeLib.remove([sidebarEl, drawerBackdrop]);
        const items = sidebarEl.querySelectorAll('.plp-sidebar-item');
        if (items.length > 0) animeLib.remove(items);

        animeLib({
          targets: drawerBackdrop,
          opacity: [1, 0],
          duration: 250,
          easing: 'easeInQuad'
        });

        animeLib({
          targets: sidebarEl,
          translateX: ['0%', '-100%'],
          duration: 280,
          easing: 'easeInCubic',
          complete: () => {
            sidebarEl.classList.remove('is-open');
            drawerBackdrop.classList.remove('is-open');
            sidebarEl.style.transform = '';
            drawerBackdrop.style.opacity = '';
            items.forEach((item) => {
              item.style.transform = '';
              item.style.opacity = '';
            });
          }
        });
      } else {
        sidebarEl.classList.remove('is-open');
        drawerBackdrop.classList.remove('is-open');
        sidebarEl.style.transform = '';
        drawerBackdrop.style.opacity = '';
      }
    }

    function getActiveCategory() {
      return new URLSearchParams(window.location.search).get('category') || '';
    }

    function getActiveSearch() {
      return new URLSearchParams(window.location.search).get('search') || '';
    }

    function getActiveSort() {
      return new URLSearchParams(window.location.search).get('sort') || 'newest';
    }

    function announceResults(count, categoryName, searchVal) {
      if (!liveRegion) return;
      let msg = '';
      if (searchVal && categoryName) {
        msg = lang === 'en'
          ? `Showing ${count} products for "${searchVal}" in category ${categoryName}.`
          : `Menampilkan ${count} produk untuk "${searchVal}" pada kategori ${categoryName}.`;
      } else if (searchVal) {
        msg = lang === 'en'
          ? `Showing ${count} products for "${searchVal}".`
          : `Menampilkan ${count} produk untuk pencarian "${searchVal}".`;
      } else if (categoryName) {
        msg = lang === 'en'
          ? `Showing ${count} products for category ${categoryName}.`
          : `Menampilkan ${count} produk untuk kategori ${categoryName}.`;
      } else {
        msg = lang === 'en'
          ? `Showing ${count} products.`
          : `Menampilkan ${count} produk.`;
      }
      liveRegion.textContent = msg;
    }

    function updateActiveSidebar(targetSlug) {
      if (!sidebarList) return;
      const links = sidebarList.querySelectorAll('.plp-sidebar-link');
      links.forEach((link) => {
        const slug = link.dataset.category || '';
        const isMatch = slug === targetSlug;
        link.classList.toggle('active', isMatch);
        link.setAttribute('aria-current', isMatch ? 'page' : 'false');
      });
    }

    function renderEmptyState() {
      const title = lang === 'en' ? 'No Products Found' : 'Produk Tidak Ditemukan';
      const desc = lang === 'en'
        ? 'No products match your search query or selected category.'
        : 'Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih.';
      const resetBtn = lang === 'en' ? 'SHOW ALL PRODUCTS' : 'TAMPILKAN SEMUA PRODUK';

      grid.innerHTML = `
        <div class="plp-empty-state" style="grid-column: 1 / -1; background: #ffffff; border: 1px solid var(--color-border, #e2e8f0); padding: 56px 24px; text-align: center; max-width: 480px; margin: 40px auto; width: 100%;">
          <h3 style="font-size: 1rem; color: var(--color-text-main, #0f172a); margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
            ${title}
          </h3>
          <p style="font-size: 12px; color: var(--color-text-variant, #64748b); line-height: 1.6; margin-bottom: 20px;">
            ${desc}
          </p>
          <button type="button" class="plp-more-btn" id="plp-empty-reset-btn" style="display: inline-flex;">
            ${resetBtn}
          </button>
        </div>
      `;

      const resetEl = document.getElementById('plp-empty-reset-btn');
      if (resetEl) {
        resetEl.addEventListener('click', (e) => {
          e.preventDefault();
          if (searchInput) searchInput.value = '';
          if (searchClear) searchClear.classList.remove('visible');
          if (sortSelect) sortSelect.value = 'newest';
          applyFilters({ category: '', search: '', sort: 'newest' }, true);
        });
      }
    }

    function updateLoadMoreState(data, targetSlug, targetSearch, targetSort) {
      if (!moreWrap || !moreBtn) return;

      const shouldShow = Boolean(data && data.hasMore && (data.totalProducts > 9));
      if (shouldShow) {
        moreWrap.style.display = 'flex';
        const nextUrl = new URL(window.location.origin + '/products');
        const nextP = (data.page || currentPage) + 1;
        nextUrl.searchParams.set('page', String(nextP));
        if (targetSlug) nextUrl.searchParams.set('category', targetSlug);
        if (targetSearch) nextUrl.searchParams.set('search', targetSearch);
        if (targetSort && targetSort !== 'newest') nextUrl.searchParams.set('sort', targetSort);
        moreBtn.href = nextUrl.pathname + nextUrl.search;
        moreBtn.dataset.currentPage = String(data.page || currentPage);
        moreBtn.dataset.totalPages = String(data.totalPages || 1);
      } else {
        moreWrap.style.display = 'none';
      }

      if (pagination) {
        pagination.style.display = 'none';
      }
    }

    async function loadMoreProducts() {
      if (isLoadingMore || !moreBtn) return;

      const targetCategory = getActiveCategory();
      const targetSearch = getActiveSearch();
      const targetSort = getActiveSort();
      const nextPage = currentPage + 1;

      const fetchUrl = new URL(window.location.origin + '/products');
      fetchUrl.searchParams.set('page', String(nextPage));
      if (targetCategory) fetchUrl.searchParams.set('category', targetCategory);
      if (targetSearch) fetchUrl.searchParams.set('search', targetSearch);
      if (targetSort && targetSort !== 'newest') fetchUrl.searchParams.set('sort', targetSort);
      fetchUrl.searchParams.set('format', 'fragment');

      isLoadingMore = true;
      moreBtn.classList.add('is-loading');
      moreBtn.setAttribute('aria-busy', 'true');
      const btnTextEl = moreBtn.querySelector('.plp-more-btn-text');
      const originalText = btnTextEl ? btnTextEl.textContent : moreBtn.textContent;
      if (btnTextEl) {
        btnTextEl.textContent = lang === 'en' ? 'LOADING...' : 'MEMUAT...';
      }

      try {
        const response = await fetch(fetchUrl.toString(), {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.html && data.html.trim().length > 0) {
          const temp = document.createElement('div');
          temp.innerHTML = data.html;
          const incomingCards = Array.from(temp.querySelectorAll('.plp-card'));

          if (incomingCards.length > 0) {
            incomingCards.forEach((card) => {
              card.classList.add('plp-card-entering');
              grid.appendChild(card);
            });

            currentPage = nextPage;

            const firstNewCard = incomingCards[0];
            if (firstNewCard) {
              const focusTarget = firstNewCard.querySelector('.plp-card-media') || firstNewCard.querySelector('.plp-card-btn') || firstNewCard;
              focusTarget.setAttribute('tabindex', '-1');
              focusTarget.focus({ preventScroll: false });
            }

            if (liveRegion) {
              const loadedCount = incomingCards.length;
              const totalDisplayed = grid.querySelectorAll('.plp-card').length;
              const announceMsg = lang === 'en'
                ? `${loadedCount} more products loaded. Total ${totalDisplayed} of ${data.totalProducts} products displayed.`
                : `${loadedCount} produk tambahan berhasil dimuat. Total ${totalDisplayed} dari ${data.totalProducts} produk ditampilkan.`;
              liveRegion.textContent = announceMsg;
            }
          }
        }

        updateLoadMoreState(data, targetCategory, targetSearch, targetSort);
      } catch (err) {
        if (moreBtn && moreBtn.href) {
          window.location.href = moreBtn.href;
        }
      } finally {
        isLoadingMore = false;
        if (moreBtn) {
          moreBtn.classList.remove('is-loading');
          moreBtn.setAttribute('aria-busy', 'false');
          if (btnTextEl) {
            btnTextEl.textContent = originalText;
          }
        }
      }
    }

    async function applyFilters(changes = {}, shouldPushState = true) {
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();

      const nextUrl = new URL(window.location.href);

      currentPage = 1;
      const targetCategory = changes.category !== undefined ? changes.category : getActiveCategory();
      const targetSearch = changes.search !== undefined ? changes.search.trim() : getActiveSearch();
      const targetSort = changes.sort !== undefined ? changes.sort : getActiveSort();

      if (targetCategory) {
        nextUrl.searchParams.set('category', targetCategory);
      } else {
        nextUrl.searchParams.delete('category');
      }

      if (targetSearch) {
        nextUrl.searchParams.set('search', targetSearch);
      } else {
        nextUrl.searchParams.delete('search');
      }

      if (targetSort && targetSort !== 'newest') {
        nextUrl.searchParams.set('sort', targetSort);
      } else {
        nextUrl.searchParams.delete('sort');
      }

      nextUrl.searchParams.delete('page');

      updateActiveSidebar(targetCategory);
      if (drawerOpenBtn) {
        const existingBadge = drawerOpenBtn.querySelector('.plp-drawer-trigger-badge');
        if (targetCategory) {
          if (!existingBadge) {
            const badge = document.createElement('span');
            badge.className = 'plp-drawer-trigger-badge';
            badge.setAttribute('aria-hidden', 'true');
            badge.textContent = '1';
            drawerOpenBtn.appendChild(badge);
          }
        } else if (existingBadge) {
          existingBadge.remove();
        }
      }
      if (sortSelect && sortSelect.value !== targetSort) {
        sortSelect.value = targetSort;
      }
      if (searchInput && changes.search !== undefined && searchInput.value !== targetSearch) {
        searchInput.value = targetSearch;
      }
      if (searchClear && searchInput) {
        searchClear.classList.toggle('visible', searchInput.value.length > 0);
      }

      grid.classList.add('is-loading');

      const fetchUrl = new URL(nextUrl.toString());
      fetchUrl.searchParams.set('format', 'fragment');

      try {
        const response = await fetch(fetchUrl.toString(), {
          signal: abortController.signal,
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (shouldPushState) {
          window.history.pushState(
            { category: targetCategory, search: targetSearch, sort: targetSort },
            '',
            nextUrl.toString()
          );
        }

        if (data.html && data.html.trim().length > 0) {
          grid.innerHTML = data.html;
        } else {
          renderEmptyState();
        }

        updateLoadMoreState(data, targetCategory, targetSearch, targetSort);

        const activeLink = sidebarList ? sidebarList.querySelector(`.plp-sidebar-link[data-category="${targetCategory}"]`) : null;
        const catName = activeLink ? activeLink.querySelector('.plp-sidebar-name')?.textContent?.trim() : '';
        announceResults(data.totalProducts || 0, catName, targetSearch);

      } catch (err) {
        if (err.name === 'AbortError') return;
        window.location.href = nextUrl.toString();
      } finally {
        grid.classList.remove('is-loading');
      }
    }

    function filterByCategory(targetSlug, shouldPushState = true) {
      return applyFilters({ category: targetSlug }, shouldPushState);
    }

    // Sidebar Category clicks
    if (sidebarList) {
      sidebarList.addEventListener('click', (e) => {
        const link = e.target.closest('.plp-sidebar-link');
        if (!link) return;

        e.preventDefault();
        const targetSlug = link.dataset.category || '';
        if (window.innerWidth < 768) {
          closeDrawer();
        }
        if (targetSlug === getActiveCategory() && !e.altKey) return;

        filterByCategory(targetSlug, true);
      });
    }

    // Mobile filter drawer event bindings
    if (drawerOpenBtn) {
      drawerOpenBtn.addEventListener('click', openDrawer);
    }
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', closeDrawer);
    }
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', closeDrawer);
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebarEl && sidebarEl.classList.contains('is-open')) {
        closeDrawer();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && sidebarEl && sidebarEl.classList.contains('is-open')) {
        closeDrawer();
      }
    });

    // Debounced search input (350ms)
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const val = searchInput.value;
        if (searchClear) {
          searchClear.classList.toggle('visible', val.length > 0);
        }

        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          applyFilters({ search: val }, true);
        }, 350);
      });
    }

    // Search clear button
    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        clearTimeout(searchTimer);
        applyFilters({ search: '' }, true);
        searchInput.focus();
      });
    }

    // Form submit interception
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearTimeout(searchTimer);
        const val = searchInput ? searchInput.value : '';
        applyFilters({ search: val }, true);
      });
    }

    // Sort select change
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        applyFilters({ sort: sortSelect.value }, true);
      });
    }

    // Load More button click
    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadMoreProducts();
      });
    }

    // Browser back/forward navigation sync
    window.addEventListener('popstate', () => {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category') || '';
      const q = params.get('search') || '';
      const s = params.get('sort') || 'newest';

      applyFilters({ category: cat, search: q, sort: s }, false);
    });
  });
})();
