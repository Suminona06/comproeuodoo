(function() {
  'use strict';

  var gridWrapper = document.getElementById('newsGridWrapper');
  if (!gridWrapper) return;

  var currentLang = gridWrapper.getAttribute('data-lang') || 'id';
  var newsGrid = document.getElementById('newsGrid');
  var newsPagination = document.getElementById('newsPagination');
  var newsEmptyState = document.getElementById('newsEmptyState');
  var catPillsContainer = document.getElementById('nwlCatPills');
  var searchForm = document.getElementById('newsSearchForm');
  var searchInput = document.getElementById('newsSearchInput');
  var searchReset = document.getElementById('newsSearchReset');
  var emptyResetBtn = document.getElementById('nwlEmptyResetBtn');
  var headlineSec = document.getElementById('nwlHeadlineSec');

  var currentType = 'all';
  var currentCategory = null;
  var currentSearch = null;
  var currentPage = 1;

  function syncStateFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var t = params.get('type');
    currentType = ['berita', 'pers', 'blog'].indexOf(t) !== -1 ? t : 'all';
    currentCategory = params.get('category') || null;
    currentSearch = params.get('search') || null;
    currentPage = Math.max(1, parseInt(params.get('page'), 10) || 1);
  }

  syncStateFromUrl();

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildUrl(type, category, search, page) {
    var params = new URLSearchParams();
    if (type && type !== 'all') params.set('type', type);
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (page && page > 1) params.set('page', page);
    var qs = params.toString();
    return qs ? '/news?' + qs : '/news';
  }

  function renderCard(post, lang) {
    var title = (lang === 'en' && post.title_en) ? post.title_en : post.title_id;
    var safeTitle = escapeHtml(title || '');
    var dateStr = '';
    if (post.published_at) {
      var d = new Date(post.published_at);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
    var isPlaceholder = !(post.cover_image && post.cover_image.trim());
    var img = isPlaceholder ? '/uploads/media/media-1792035656935-732682512.webp' : post.cover_image.trim();
    var mediaClass = 'news-card-v2-img nwl-card-media' + (isPlaceholder ? ' nwl-card-media-placeholder' : '');
    var imgClass = isPlaceholder ? ' class="nwl-img-placeholder"' : '';
    var dateHtml = dateStr ? '<time datetime="' + escapeHtml(post.published_at) + '" class="nwl-card-date">' + escapeHtml(dateStr) + '</time>' : '';
    var readMoreText = lang === 'en' ? 'Read More' : 'Baca Selengkapnya';

    return '<article class="news-card-v2 nwl-card">' +
      '<div class="' + mediaClass + '">' +
        '<img src="' + escapeHtml(img) + '" alt="' + safeTitle + '" loading="lazy"' + imgClass + ' onerror="this.onerror=null;this.src=\'/uploads/media/media-1792035656935-732682512.webp\';this.classList.add(\'nwl-img-placeholder\');this.parentElement.classList.add(\'nwl-card-media-placeholder\');">' +
      '</div>' +
      '<div class="news-card-v2-body nwl-card-body">' +
        dateHtml +
        '<h3 class="news-card-v2-title nwl-card-title">' +
          '<a href="/news/' + encodeURIComponent(post.slug) + '" class="nwl-card-title-link">' + safeTitle + '</a>' +
        '</h3>' +
        '<div class="nwl-card-action">' +
          '<span class="nwl-card-link" aria-hidden="true">' +
            '<span>' + readMoreText + '</span>' +
            '<span aria-hidden="true">&rarr;</span>' +
          '</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderPagination(page, totalPages, lang) {
    if (!newsPagination) return;
    if (totalPages <= 1) {
      newsPagination.innerHTML = '';
      newsPagination.setAttribute('hidden', '');
      return;
    }
    newsPagination.removeAttribute('hidden');
    var prevLabel = lang === 'en' ? 'Previous' : 'Sebelumnya';
    var nextLabel = lang === 'en' ? 'Next' : 'Berikutnya';

    var html = '';
    if (page > 1) {
      html += '<a href="' + buildUrl(currentType, currentCategory, currentSearch, page - 1) + '" class="pagination-item" data-page="' + (page - 1) + '" aria-label="Halaman Sebelumnya">&larr; ' + prevLabel + '</a>';
    } else {
      html += '<span class="pagination-item disabled" aria-disabled="true">&larr; ' + prevLabel + '</span>';
    }

    for (var p = 1; p <= totalPages; p++) {
      if (p === page) {
        html += '<span class="pagination-item active" aria-current="page">' + p + '</span>';
      } else if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
        html += '<a href="' + buildUrl(currentType, currentCategory, currentSearch, p) + '" class="pagination-item" data-page="' + p + '">' + p + '</a>';
      } else if (p === page - 3 || p === page + 3) {
        html += '<span class="pagination-item disabled">...</span>';
      }
    }

    if (page < totalPages) {
      html += '<a href="' + buildUrl(currentType, currentCategory, currentSearch, page + 1) + '" class="pagination-item" data-page="' + (page + 1) + '" aria-label="Halaman Berikutnya">' + nextLabel + ' &rarr;</a>';
    } else {
      html += '<span class="pagination-item disabled" aria-disabled="true">' + nextLabel + ' &rarr;</span>';
    }

    newsPagination.innerHTML = html;
  }

  function renderCategories(categories, activeCat, lang) {
    if (!catPillsContainer) return;
    var allLabel = lang === 'en' ? 'All' : 'Semua';
    var html = '<a href="' + buildUrl(currentType, null, currentSearch, 1) + '" class="nwl-cat-pill ' + (!activeCat ? 'active' : '') + '" data-category="">' + allLabel + '</a>';

    if (categories && categories.length > 0) {
      for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        var catName = (lang === 'en' && cat.name_en) ? cat.name_en : cat.name_id;
        var isActive = activeCat === cat.slug;
        html += '<a href="' + buildUrl(currentType, cat.slug, currentSearch, 1) + '" class="nwl-cat-pill ' + (isActive ? 'active' : '') + '" data-category="' + escapeHtml(cat.slug) + '">' + escapeHtml(catName) + '</a>';
      }
    }
    catPillsContainer.innerHTML = html;
  }

  function updateControlsUI(data) {
    var tabs = document.querySelectorAll('.nwl-tab-item');
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var isTabActive = tab.getAttribute('data-type') === data.activeType;
      if (isTabActive) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    }

    renderCategories(data.categories, data.activeCategory, currentLang);

    if (searchInput) {
      searchInput.value = data.search || '';
    }
    if (searchReset) {
      if (data.search) {
        searchReset.removeAttribute('hidden');
        searchReset.setAttribute('href', buildUrl(data.activeType, data.activeCategory, null, 1));
      } else {
        searchReset.setAttribute('hidden', '');
      }
    }

    var hiddenType = document.getElementById('newsSearchType');
    if (hiddenType) hiddenType.value = data.activeType;
    var hiddenCat = document.getElementById('newsSearchCategory');
    if (hiddenCat) hiddenCat.value = data.activeCategory || '';

    if (headlineSec) {
      if (data.currentPage === 1 && !data.search) {
        headlineSec.style.display = '';
      } else {
        headlineSec.style.display = 'none';
      }
    }
  }

  function fetchNews(url, pushState) {
    gridWrapper.classList.add('nwl-grid-loading');

    fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (!data.success) throw new Error('Response unsuccessful');

      currentType = data.activeType;
      currentCategory = data.activeCategory;
      currentSearch = data.search;
      currentPage = data.currentPage;

      if (pushState) {
        window.history.pushState({
          type: currentType,
          category: currentCategory,
          search: currentSearch,
          page: currentPage
        }, '', url);
      }

      updateControlsUI(data);

      if (data.posts && data.posts.length > 0) {
        var cardsHtml = '';
        for (var j = 0; j < data.posts.length; j++) {
          cardsHtml += renderCard(data.posts[j], currentLang);
        }
        newsGrid.innerHTML = cardsHtml;
        newsGrid.removeAttribute('hidden');
        if (newsEmptyState) newsEmptyState.setAttribute('hidden', '');
        renderPagination(data.currentPage, data.totalPages, currentLang);
      } else {
        newsGrid.innerHTML = '';
        newsGrid.setAttribute('hidden', '');
        if (newsPagination) {
          newsPagination.innerHTML = '';
          newsPagination.setAttribute('hidden', '');
        }
        if (newsEmptyState) newsEmptyState.removeAttribute('hidden');
      }

      gridWrapper.classList.remove('nwl-grid-loading');
    })
    .catch(function() {
      gridWrapper.classList.remove('nwl-grid-loading');
      window.location.href = url;
    });
  }

  document.addEventListener('click', function(e) {
    var tab = e.target.closest('.nwl-tab-item');
    if (tab) {
      e.preventDefault();
      var targetType = tab.getAttribute('data-type') || 'all';
      if (targetType === currentType && currentPage === 1 && !currentCategory && !currentSearch) {
        return;
      }
      currentType = targetType;
      currentCategory = null;
      currentPage = 1;
      var targetUrl = buildUrl(currentType, null, currentSearch, 1);
      fetchNews(targetUrl, true);
      return;
    }

    var catPill = e.target.closest('.nwl-cat-pill');
    if (catPill) {
      e.preventDefault();
      var targetCat = catPill.getAttribute('data-category') || null;
      if (targetCat === currentCategory && currentPage === 1) {
        return;
      }
      currentCategory = targetCat;
      currentPage = 1;
      var catUrl = buildUrl(currentType, currentCategory, currentSearch, 1);
      fetchNews(catUrl, true);
      return;
    }

    var pageItem = e.target.closest('#newsPagination a.pagination-item');
    if (pageItem) {
      e.preventDefault();
      var targetPage = parseInt(pageItem.getAttribute('data-page'), 10);
      if (targetPage && targetPage !== currentPage) {
        currentPage = targetPage;
        var pageUrl = buildUrl(currentType, currentCategory, currentSearch, currentPage);
        fetchNews(pageUrl, true);
        var targetScroll = catPillsContainer || gridWrapper;
        if (targetScroll && targetScroll.scrollIntoView) {
          targetScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      return;
    }

    var resetBtn = e.target.closest('#newsSearchReset');
    if (resetBtn) {
      e.preventDefault();
      currentSearch = null;
      if (searchInput) searchInput.value = '';
      currentPage = 1;
      var resetUrl = buildUrl(currentType, currentCategory, null, 1);
      fetchNews(resetUrl, true);
      return;
    }

    var emptyReset = e.target.closest('#nwlEmptyResetBtn');
    if (emptyReset) {
      e.preventDefault();
      currentType = 'all';
      currentCategory = null;
      currentSearch = null;
      currentPage = 1;
      if (searchInput) searchInput.value = '';
      fetchNews('/news', true);
      return;
    }
  });

  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var q = searchInput ? searchInput.value.trim() : '';
      currentSearch = q || null;
      currentPage = 1;
      var searchUrl = buildUrl(currentType, currentCategory, currentSearch, 1);
      fetchNews(searchUrl, true);
    });
  }

  window.addEventListener('popstate', function() {
    syncStateFromUrl();
    var currentUrl = buildUrl(currentType, currentCategory, currentSearch, currentPage);
    fetchNews(currentUrl, false);
  });
})();
