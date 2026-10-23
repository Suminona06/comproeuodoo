(function () {
  'use strict';

  var currentTransitionId = 0;
  var isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var mainImg = gallery.querySelector('#pdMainImage');
    var thumbs = gallery.querySelector('.pd-thumbs');

    if (thumbs && mainImg) {
      thumbs.addEventListener('click', function (e) {
        var btn = e.target.closest('.pd-thumb-btn');
        if (!btn || btn.getAttribute('aria-pressed') === 'true') return;

        var newSrc = btn.getAttribute('data-full');
        var newAlt = btn.getAttribute('data-alt') || '';
        if (!newSrc) return;

        var allThumbs = thumbs.querySelectorAll('.pd-thumb-btn');
        allThumbs.forEach(function (t) {
          t.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');

        if (isReducedMotion) {
          mainImg.src = newSrc;
          mainImg.alt = newAlt;
          return;
        }

        var transitionId = ++currentTransitionId;
        mainImg.classList.add('pd-fade-out');

        var tempImg = new Image();
        tempImg.src = newSrc;

        var decodePromise = (typeof tempImg.decode === 'function')
          ? tempImg.decode().catch(function () {})
          : Promise.resolve();

        var fadeOutTimer = new Promise(function (resolve) {
          setTimeout(resolve, 150);
        });

        Promise.all([decodePromise, fadeOutTimer]).then(function () {
          if (transitionId !== currentTransitionId) return;
          mainImg.src = newSrc;
          mainImg.alt = newAlt;
          mainImg.classList.remove('pd-fade-out');
        });
      });
    }
  }

  var variantGroups = document.querySelectorAll('[data-variants]');
  variantGroups.forEach(function (group) {
    group.addEventListener('click', function (e) {
      var pill = e.target.closest('.pd-pill');
      if (!pill) return;
      var pills = group.querySelectorAll('.pd-pill');
      pills.forEach(function (p) {
        p.setAttribute('aria-pressed', 'false');
      });
      pill.setAttribute('aria-pressed', 'true');
    });
  });

  var tabBoxes = document.querySelectorAll('[data-tabs]');
  tabBoxes.forEach(function (box) {
    var tabbar = box.querySelector('.pd-tabbar');
    if (!tabbar) return;
    tabbar.addEventListener('click', function (e) {
      var tabBtn = e.target.closest('.pd-tab-btn');
      if (!tabBtn) return;
      var targetTab = tabBtn.getAttribute('data-tab');
      var allTabs = tabbar.querySelectorAll('.pd-tab-btn');
      var allPanels = box.querySelectorAll('.pd-panel');

      allTabs.forEach(function (t) {
        t.setAttribute('aria-selected', t === tabBtn ? 'true' : 'false');
      });

      allPanels.forEach(function (p) {
        if (p.getAttribute('data-panel') === targetTab) {
          p.removeAttribute('hidden');
        } else {
          p.setAttribute('hidden', '');
        }
      });
    });
  });

  var stickyBar = document.getElementById('pdStickyCta');
  var stickyClose = document.getElementById('pdStickyClose');
  var card = document.querySelector('.pd-card');

  if (stickyBar) {
    var isClosed = false;
    try {
      isClosed = sessionStorage.getItem('pd-sticky-closed') === '1';
    } catch (err) {}

    if (isClosed) {
      stickyBar.setAttribute('hidden', '');
    } else {
      document.documentElement.classList.add('pd-sticky-active');
      if (card) card.classList.add('pd-sticky-active');
    }

    if (stickyClose) {
      stickyClose.addEventListener('click', function () {
        stickyBar.setAttribute('hidden', '');
        document.documentElement.classList.remove('pd-sticky-active');
        if (card) card.classList.remove('pd-sticky-active');
        try {
          sessionStorage.setItem('pd-sticky-closed', '1');
        } catch (err) {}
      });
    }
  }
})();
