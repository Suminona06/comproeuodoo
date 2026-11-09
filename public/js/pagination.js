/**
 * pagination.js - Unified Pagination Controller (.pgn-*)
 * Mendukung navigasi tanpa reload, AbortController, history.pushState, dan responsif mobile.
 * PT Euodoo Industrial - Vanilla JS, CSP-compliant.
 */

(function (window, document) {
  'use strict';

  let activeAbortController = null;

  function announceToScreenReader(container, text) {
    const liveEl = container.querySelector('.pgn-live-region');
    if (liveEl) {
      liveEl.textContent = text;
    }
  }

  function normalizePageInput(input) {
    const total = parseInt(input.getAttribute('data-total-pages'), 10) || 1;
    const current = parseInt(input.getAttribute('data-current-page'), 10) || 1;
    const parsed = parseInt(input.value.trim(), 10);

    if (isNaN(parsed) || parsed < 1) {
      input.value = current;
      return current;
    }
    if (parsed > total) {
      input.value = total;
      return total;
    }
    input.value = parsed;
    return parsed;
  }

  function updateUrlState(url, replace) {
    if (!window.history) return;
    if (replace) {
      window.history.replaceState({ url }, '', url);
    } else {
      window.history.pushState({ url }, '', url);
    }
  }

  function createPaginationUrl(baseUrl, currentParams, newPage, newPerPage) {
    const origin = window.location.origin;
    const resolvedBase = baseUrl || window.location.pathname;
    const url = new URL(resolvedBase, origin);
    const params = new URLSearchParams(window.location.search);

    if (currentParams) {
      for (const [k, v] of Object.entries(currentParams)) {
        if (v !== null && v !== undefined && v !== '') {
          params.set(k, v);
        } else {
          params.delete(k);
        }
      }
    }
    if (newPage) params.set('page', newPage);
    if (newPerPage) params.set('per_page', newPerPage);

    const qs = params.toString();
    return qs ? `${url.pathname}?${qs}` : url.pathname;
  }

  function fetchPageData(url, onData, onError) {
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();
    const { signal } = activeAbortController;

    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'fetch'
      },
      signal
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (typeof onData === 'function') onData(data);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (typeof onError === 'function') onError(err);
      });
  }

  function triggerPageChange(bar, targetPage, targetPerPage, options) {
    const curPage = parseInt(bar.getAttribute('data-current-page'), 10) || 1;
    const curPerPage = parseInt(bar.getAttribute('data-per-page'), 10) || 10;
    const page = targetPage || curPage;
    const perPage = targetPerPage || curPerPage;
    const baseUrl = bar.getAttribute('data-base-url') || window.location.pathname;

    const nextUrl = createPaginationUrl(baseUrl, options.queryParams, page, perPage);
    updateUrlState(nextUrl);

    announceToScreenReader(bar, `Halaman ${page}`);

    if (options.scrollToSelector) {
      const targetEl = document.querySelector(options.scrollToSelector);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (typeof options.onPageChange === 'function') {
      options.onPageChange({
        page,
        perPage,
        url: nextUrl,
        signal: activeAbortController?.signal
      });
    }
  }

  function bindBarEvents(bar, options) {
    bar.addEventListener('click', (e) => {
      const link = e.target.closest('a.pgn-btn, a.pgn-num');
      if (!link) return;

      e.preventDefault();
      const page = parseInt(link.getAttribute('data-page'), 10);
      if (page) triggerPageChange(bar, page, null, options);
    });

    const perPageSelect = bar.querySelector('.pgn-per-page-select');
    if (perPageSelect) {
      perPageSelect.addEventListener('change', () => {
        const newPerPage = parseInt(perPageSelect.value, 10) || 10;
        triggerPageChange(bar, 1, newPerPage, options);
      });
    }

    const pageInput = bar.querySelector('.pgn-page-input');
    if (pageInput) {
      pageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const validPage = normalizePageInput(pageInput);
          triggerPageChange(bar, validPage, null, options);
        }
      });
      pageInput.addEventListener('change', () => {
        const validPage = normalizePageInput(pageInput);
        triggerPageChange(bar, validPage, null, options);
      });
    }
  }

  function initPagination(options = {}) {
    const selector = options.containerSelector || '.pgn-bar';
    const bar = document.querySelector(selector);
    if (!bar) return;

    bindBarEvents(bar, options);

    window.addEventListener('popstate', () => {
      const params = new URLSearchParams(window.location.search);
      const popPage = parseInt(params.get('page'), 10) || 1;
      const popPerPage = parseInt(params.get('per_page'), 10) || 10;
      if (typeof options.onPageChange === 'function') {
        options.onPageChange({
          page: popPage,
          perPage: popPerPage,
          url: window.location.href,
          isPopState: true
        });
      }
    });
  }

  window.EuPagination = {
    init: initPagination,
    fetchPageData,
    createPaginationUrl
  };

})(window, document);

