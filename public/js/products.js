/**
 * Product Catalog Dynamic Category Filter & URL Deep Link Sync
 * Handles client-side category filtering, browser history (pushState/popstate),
 * and accessible announcements without page reload.
 */
(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('plp-products-grid');
    const sidebarList = document.getElementById('plp-sidebar-list');
    const toolbarCount = document.querySelector('.plp-toolbar-count');
    const moreWrap = document.querySelector('.plp-more-wrap');
    const moreBtn = document.getElementById('plp-load-more-btn');
    const liveRegion = document.getElementById('plp-live-region');
    const lang = document.documentElement.lang === 'en' ? 'en' : 'id';

    if (!grid || !sidebarList) return;

    let activeCategory = new URLSearchParams(window.location.search).get('category') || '';

    function announceResults(categoryName, count) {
      if (!liveRegion) return;
      const text = lang === 'en'
        ? `Showing ${count} products for category ${categoryName || 'All Products'}.`
        : `Menampilkan ${count} produk untuk kategori ${categoryName || 'Semua Produk'}.`;
      liveRegion.textContent = text;
    }

    function updateActiveSidebar(targetSlug) {
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
        ? 'No active products found in this category.'
        : 'Belum ada produk aktif pada kategori ini.';
      const resetBtn = lang === 'en' ? 'SHOW ALL PRODUCTS' : 'TAMPILKAN SEMUA PRODUK';

      grid.innerHTML = `
        <div class="plp-empty-state" style="grid-column: 1 / -1; background: #ffffff; border: 1px solid var(--color-border, #e2e8f0); padding: 56px 24px; text-align: center; max-width: 480px; margin: 40px auto; width: 100%;">
          <h3 style="font-size: 1rem; color: var(--color-text-main, #0f172a); margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
            ${title}
          </h3>
          <p style="font-size: 12px; color: var(--color-text-variant, #64748b); line-height: 1.6; margin-bottom: 20px;">
            ${desc}
          </p>
          <a href="/products" class="plp-more-btn" id="plp-empty-reset-btn" style="display: inline-flex;">
            ${resetBtn}
          </a>
        </div>
      `;

      const resetEl = document.getElementById('plp-empty-reset-btn');
      if (resetEl) {
        resetEl.addEventListener('click', (e) => {
          e.preventDefault();
          filterByCategory('', true);
        });
      }
    }

    function updateLoadMoreState(data, targetSlug) {
      if (!moreWrap || !moreBtn) return;

      if (data.hasMore) {
        moreWrap.style.display = 'flex';
        const nextUrl = new URL(window.location.origin + '/products');
        nextUrl.searchParams.set('page', '2');
        if (targetSlug) nextUrl.searchParams.set('category', targetSlug);
        const curSearch = new URLSearchParams(window.location.search).get('search');
        if (curSearch) nextUrl.searchParams.set('search', curSearch);
        const curSort = new URLSearchParams(window.location.search).get('sort');
        if (curSort && curSort !== 'newest') nextUrl.searchParams.set('sort', curSort);
        moreBtn.href = nextUrl.pathname + nextUrl.search;
      } else {
        moreWrap.style.display = 'none';
      }

      // Hide server pagination links on client category switch to avoid stale page numbers
      const pagination = document.querySelector('.plp-pagination');
      if (pagination) {
        pagination.style.display = 'none';
      }
    }

    async function filterByCategory(targetSlug, shouldPushState = true) {
      updateActiveSidebar(targetSlug);
      grid.classList.add('is-loading');

      const nextUrl = new URL(window.location.href);
      if (targetSlug) {
        nextUrl.searchParams.set('category', targetSlug);
      } else {
        nextUrl.searchParams.delete('category');
      }
      nextUrl.searchParams.delete('page');

      const fetchUrl = new URL(nextUrl.toString());
      fetchUrl.searchParams.set('format', 'fragment');

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
        activeCategory = targetSlug;

        if (shouldPushState) {
          window.history.pushState({ category: targetSlug }, '', nextUrl.toString());
        }

        if (data.html && data.html.trim().length > 0) {
          grid.innerHTML = data.html;
        } else {
          renderEmptyState();
        }

        if (toolbarCount) {
          toolbarCount.textContent = `SHOWING ${data.totalProducts || 0} PRODUCTS`;
        }

        updateLoadMoreState(data, targetSlug);

        const activeLink = sidebarList.querySelector(`.plp-sidebar-link[data-category="${targetSlug}"]`);
        const catName = activeLink ? activeLink.querySelector('.plp-sidebar-name')?.textContent?.trim() : '';
        announceResults(catName, data.totalProducts || 0);

      } catch (err) {
        // Fallback to standard full navigation if network or server fails
        window.location.href = nextUrl.toString();
      } finally {
        grid.classList.remove('is-loading');
      }
    }

    // Intercept clicks on sidebar category links (both desktop and mobile pills)
    sidebarList.addEventListener('click', (e) => {
      const link = e.target.closest('.plp-sidebar-link');
      if (!link) return;

      e.preventDefault();
      const targetSlug = link.dataset.category || '';
      if (targetSlug === activeCategory && !e.altKey) return;

      filterByCategory(targetSlug, true);
    });

    // Synchronize browser history back and forward buttons
    window.addEventListener('popstate', () => {
      const params = new URLSearchParams(window.location.search);
      const catSlug = params.get('category') || '';
      filterByCategory(catSlug, false);
    });
  });
})();
