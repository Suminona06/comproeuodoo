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
        '<img src="' + escapeHtml(img) + '" alt="' + safeTitle + '" loading="lazy"' + imgClass + '>' +
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
    newsPagination.className = 'pgn-bar pgn-bar--public';
    newsPagination.removeAttribute('hidden');

    var isFirstDisabled = page <= 1;
    var isLastDisabled = page >= totalPages;

    var firstLabel = lang === 'en' ? 'First page' : 'Halaman pertama';
    var prevLabel = lang === 'en' ? 'Previous page' : 'Halaman sebelumnya';
    var nextLabel = lang === 'en' ? 'Next page' : 'Halaman berikutnya';
    var lastLabel = lang === 'en' ? 'Last page' : 'Halaman terakhir';
    var pageLabel = lang === 'en' ? 'Page' : 'Halaman';
    var navLabel = lang === 'en' ? 'Pagination Navigation' : 'Navigasi Halaman';

    newsPagination.setAttribute('aria-label', navLabel);

    var firstIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>';
    var prevIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    var nextIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    var lastIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>';

    var html = '<div class="pgn-nav" role="navigation" aria-label="' + navLabel + '">';

    if (isFirstDisabled) {
      html += '<span class="pgn-btn pgn-btn--first is-disabled" aria-disabled="true" aria-label="' + firstLabel + '" title="' + firstLabel + '">' + firstIcon + '</span>';
    } else {
      html += '<a href="' + buildUrl(currentType, currentCategory, currentSearch, 1) + '" class="pgn-btn pgn-btn--first" data-page="1" aria-label="' + firstLabel + '" title="' + firstLabel + '">' + firstIcon + '</a>';
    }

    if (isFirstDisabled) {
      html += '<span class="pgn-btn pgn-btn--prev is-disabled" aria-disabled="true" aria-label="' + prevLabel + '" title="' + prevLabel + '">' + prevIcon + '</span>';
    } else {
      html += '<a href="' + buildUrl(currentType, currentCategory, currentSearch, page - 1) + '" class="pgn-btn pgn-btn--prev" data-page="' + (page - 1) + '" aria-label="' + prevLabel + '" title="' + prevLabel + '">' + prevIcon + '</a>';
    }

    html += '<div class="pgn-pages">';
    var pageItems = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pageItems.push(i);
    } else if (page <= 3) {
      pageItems = [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
    } else if (page >= totalPages - 2) {
      pageItems = [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
    } else {
      pageItems = [1, '...', page - 1, page, page + 1, '...', totalPages];
    }

    for (var j = 0; j < pageItems.length; j++) {
      var item = pageItems[j];
      if (item === '...') {
        html += '<span class="pgn-ellipsis" aria-hidden="true">&hellip;</span>';
      } else if (item === page) {
        html += '<span class="pgn-num is-active" aria-current="page">' + item + '</span>';
      } else {
        html += '<a href="' + buildUrl(currentType, currentCategory, currentSearch, item) + '" class="pgn-num" data-page="' + item + '" aria-label="' + pageLabel + ' ' + item + '">' + item + '</a>';
      }
    }
    html += '</div>';

    html += '<div class="pgn-mobile-info" aria-hidden="true"><span>' + page + ' / ' + totalPages + '</span></div>';

    if (isLastDisabled) {
      html += '<span class="pgn-btn pgn-btn--next is-disabled" aria-disabled="true" aria-label="' + nextLabel + '" title="' + nextLabel + '">' + nextIcon + '</span>';
    } else {
      html += '<a href="' + buildUrl(currentType, currentCategory, currentSearch, page + 1) + '" class="pgn-btn pgn-btn--next" data-page="' + (page + 1) + '" aria-label="' + nextLabel + '" title="' + nextLabel + '">' + nextIcon + '</a>';
    }

    if (isLastDisabled) {
      html += '<span class="pgn-btn pgn-btn--last is-disabled" aria-disabled="true" aria-label="' + lastLabel + '" title="' + lastLabel + '">' + lastIcon + '</span>';
    } else {
      html += '<a href="' + buildUrl(currentType, currentCategory, currentSearch, totalPages) + '" class="pgn-btn pgn-btn--last" data-page="' + totalPages + '" aria-label="' + lastLabel + '" title="' + lastLabel + '">' + lastIcon + '</a>';
    }

    html += '</div>';
    newsPagination.innerHTML = html;
  }

  function updateScrollHints() {
    if (!catPillsContainer) return;
    var maxScroll = catPillsContainer.scrollWidth - catPillsContainer.clientWidth;
    if (maxScroll <= 2) {
      catPillsContainer.removeAttribute('data-scroll-left');
      catPillsContainer.removeAttribute('data-scroll-right');
      return;
    }
    var sl = catPillsContainer.scrollLeft;
    if (sl > 4) {
      catPillsContainer.setAttribute('data-scroll-left', 'true');
    } else {
      catPillsContainer.removeAttribute('data-scroll-left');
    }
    if (sl < maxScroll - 4) {
      catPillsContainer.setAttribute('data-scroll-right', 'true');
    } else {
      catPillsContainer.removeAttribute('data-scroll-right');
    }
  }

  function scrollActivePillIntoView() {
    if (!catPillsContainer) return;
    var activePill = catPillsContainer.querySelector('.nwl-cat-pill.active');
    if (!activePill) return;

    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var behavior = prefersReducedMotion ? 'auto' : 'smooth';

    if (activePill.scrollIntoView) {
      activePill.scrollIntoView({
        behavior: behavior,
        inline: 'center',
        block: 'nearest'
      });
    }
    updateScrollHints();
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
    scrollActivePillIntoView();
    updateScrollHints();
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
        headlineSec.removeAttribute('hidden');
      } else {
        headlineSec.setAttribute('hidden', '');
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

    var pageItem = e.target.closest('#newsPagination a.pgn-btn, #newsPagination a.pgn-num, #newsPagination a.pagination-item');
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

  function initHeadlineSlider() {
    var slider = document.getElementById('nwlHeadlineSlider');
    if (!slider) return;
    var slides = slider.querySelectorAll('.nwl-slide');
    var indicators = slider.querySelectorAll('.nwl-indicator-bar');
    var prevBtn = document.getElementById('nwlPrevBtn');
    var nextBtn = document.getElementById('nwlNextBtn');
    if (slides.length <= 1) return;

    var titleEl = document.querySelector('.nwl-headline-sec-title');
    var secHeadline = document.getElementById('nwlHeadlineSec');
    var titles = {
      berita: slider.getAttribute('data-title-berita') || 'Berita',
      pers: slider.getAttribute('data-title-pers') || 'Siaran Pers',
      blog: slider.getAttribute('data-title-blog') || 'Blog'
    };
    var ariaLabels = {
      berita: slider.getAttribute('data-aria-berita') || 'Berita Utama',
      pers: slider.getAttribute('data-aria-pers') || 'Siaran Pers Utama',
      blog: slider.getAttribute('data-aria-blog') || 'Blog Utama'
    };

    function updateHeadlineTitle(postType) {
      var key = titles[postType] ? postType : 'berita';
      if (titleEl && titles[key]) {
        titleEl.textContent = titles[key];
      }
      if (secHeadline && ariaLabels[key]) {
        secHeadline.setAttribute('aria-label', ariaLabels[key]);
      }
    }

    var currentIndex = 0;
    var totalSlides = slides.length;
    var isTransitioning = false;
    var isPaused = false;
    var timer = null;

    function goToSlide(targetIndex) {
      if (isTransitioning) return;
      var normalized = ((targetIndex % totalSlides) + totalSlides) % totalSlides;
      if (normalized === currentIndex) return;
      isTransitioning = true;

      slides[currentIndex].classList.remove('active');
      slides[currentIndex].setAttribute('aria-hidden', 'true');
      var prevLinks = slides[currentIndex].querySelectorAll('a, button');
      for (var i = 0; i < prevLinks.length; i++) {
        prevLinks[i].setAttribute('tabindex', '-1');
      }
      if (indicators[currentIndex]) {
        indicators[currentIndex].classList.remove('active');
        indicators[currentIndex].setAttribute('aria-selected', 'false');
      }

      currentIndex = normalized;

      var currentSlide = slides[currentIndex];
      var postType = (currentSlide && currentSlide.getAttribute('data-post-type')) || 'berita';
      updateHeadlineTitle(postType);

      slides[currentIndex].classList.add('active');
      slides[currentIndex].removeAttribute('aria-hidden');
      var nextLinks = slides[currentIndex].querySelectorAll('a, button');
      for (var j = 0; j < nextLinks.length; j++) {
        nextLinks[j].removeAttribute('tabindex');
      }
      if (indicators[currentIndex]) {
        indicators[currentIndex].classList.add('active');
        indicators[currentIndex].setAttribute('aria-selected', 'true');
      }

      setTimeout(function() {
        isTransitioning = false;
      }, 400);
    }

    function startTimer() {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      stopTimer();
      timer = setInterval(function() {
        if (!isPaused) {
          goToSlide(currentIndex + 1);
        }
      }, 6000);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function resetTimer() {
      stopTimer();
      startTimer();
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        goToSlide(currentIndex + 1);
        resetTimer();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        goToSlide(currentIndex - 1);
        resetTimer();
      });
    }

    for (var k = 0; k < indicators.length; k++) {
      (function(idx) {
        indicators[idx].addEventListener('click', function() {
          goToSlide(idx);
          resetTimer();
        });
      })(k);
    }

    slider.addEventListener('mouseenter', function() { isPaused = true; });
    slider.addEventListener('mouseleave', function() { isPaused = false; });
    slider.addEventListener('focusin', function() { isPaused = true; });
    slider.addEventListener('focusout', function() { isPaused = false; });

    slider.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToSlide(currentIndex - 1);
        resetTimer();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToSlide(currentIndex + 1);
        resetTimer();
      }
    });

    var touchStartX = 0;
    var touchStartY = 0;
    slider.addEventListener('touchstart', function(e) {
      if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    slider.addEventListener('touchend', function(e) {
      if (e.changedTouches && e.changedTouches.length > 0) {
        var deltaX = e.changedTouches[0].clientX - touchStartX;
        var deltaY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
            goToSlide(currentIndex + 1);
          } else {
            goToSlide(currentIndex - 1);
          }
          resetTimer();
        }
      }
    }, { passive: true });

    startTimer();
  }

  initHeadlineSlider();

  if (catPillsContainer) {
    catPillsContainer.addEventListener('scroll', updateScrollHints, { passive: true });
    window.addEventListener('resize', updateScrollHints);
    scrollActivePillIntoView();
    updateScrollHints();
  }
})();
