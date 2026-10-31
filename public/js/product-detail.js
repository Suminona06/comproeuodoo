(function () {
  'use strict';

  var currentTransitionId = 0;
  var isReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var mainTrigger = gallery.querySelector('[data-main-trigger], .pd-gallery-main');
    var mainImg = gallery.querySelector('#pdMainImage');
    var thumbs = gallery.querySelector('.pd-thumbs');

    if (thumbs && mainImg) {
      thumbs.addEventListener('click', function (e) {
        var btn = e.target.closest('.pd-thumb-btn');
        if (!btn) return;

        var allThumbs = Array.from(thumbs.querySelectorAll('.pd-thumb-btn'));
        var clickedIndex = parseInt(btn.getAttribute('data-index') || '', 10);
        if (Number.isNaN(clickedIndex)) {
          clickedIndex = Math.max(0, allThumbs.indexOf(btn));
        }

        if (mainTrigger) {
          mainTrigger.setAttribute('data-active-index', String(clickedIndex));
        }

        if (btn.getAttribute('aria-pressed') === 'true') return;

        var newSrc = btn.getAttribute('data-full');
        var newAlt = btn.getAttribute('data-alt') || '';
        if (!newSrc) return;

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

        var decodePromise =
          typeof tempImg.decode === 'function'
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

    if (mainTrigger && mainImg) {
      var openProductGalleryLightbox = function () {
        if (!window.EuodooLightbox || typeof window.EuodooLightbox.open !== 'function') {
          return;
        }

        var captionText =
          mainTrigger.getAttribute('data-caption') || mainImg.getAttribute('alt') || '';
        var thumbButtons = thumbs
          ? Array.from(thumbs.querySelectorAll('.pd-thumb-btn'))
          : [];

        var activeIndex =
          parseInt(mainTrigger.getAttribute('data-active-index') || '0', 10) || 0;

        var items = [];
        if (thumbButtons.length > 0) {
          items = thumbButtons
            .map(function (btn, idx) {
              var src = btn.getAttribute('data-full') || '';
              if (!src) return null;
              var thumbImg = btn.querySelector('img');
              return {
                src: src,
                msrc: src,
                alt: btn.getAttribute('data-alt') || captionText,
                title: captionText,
                element: thumbImg || (idx === activeIndex ? mainImg : null)
              };
            })
            .filter(Boolean);
        }

        if (!items.length) {
          var singleSrc = mainImg.currentSrc || mainImg.getAttribute('src') || '';
          if (singleSrc) {
            items.push({
              src: singleSrc,
              msrc: singleSrc,
              alt: mainImg.getAttribute('alt') || captionText,
              title: captionText,
              element: mainImg
            });
          }
        }

        if (activeIndex < 0 || activeIndex >= items.length) {
          activeIndex = 0;
        }

        window.EuodooLightbox.open(items, activeIndex, mainTrigger);
      };

      mainTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        openProductGalleryLightbox();
      });

      mainTrigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProductGalleryLightbox();
        }
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
})();
