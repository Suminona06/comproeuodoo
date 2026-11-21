(function () {
  'use strict';

  var isReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DRAG_THRESHOLD_PX = 10;

  var attachMouseDragScroll = function (scroller, onDragEnd) {
    if (!scroller) return;
    var isDown = false;
    var startX = 0;
    var startScrollLeft = 0;
    var lastDx = 0;
    var moved = false;
    var prevSnap = '';
    var prevBehavior = '';

    scroller.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      isDown = true;
      moved = false;
      lastDx = 0;
      startX = e.clientX;
      startScrollLeft = scroller.scrollLeft;
      prevSnap = scroller.style.scrollSnapType || '';
      prevBehavior = scroller.style.scrollBehavior || '';
      scroller.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      lastDx = dx;
      if (Math.abs(dx) > DRAG_THRESHOLD_PX) {
        moved = true;
        scroller.style.scrollSnapType = 'none';
        scroller.style.scrollBehavior = 'auto';
      }
      if (moved) {
        scroller.scrollLeft = startScrollLeft - dx;
      }
    });

    window.addEventListener('mouseup', function () {
      if (!isDown) return;
      isDown = false;
      scroller.classList.remove('is-dragging');
      scroller.style.scrollSnapType = prevSnap;
      scroller.style.scrollBehavior = prevBehavior;
      if (moved && typeof onDragEnd === 'function') {
        onDragEnd(lastDx);
      }
    });
  };

  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var mainTrigger = gallery.querySelector('[data-main-trigger], .pd-gallery-main');
    var track = gallery.querySelector('[data-gallery-track]');
    var mainImg = gallery.querySelector('#pdMainImage');
    var thumbs = gallery.querySelector('.pd-thumbs');
    var thumbButtons = thumbs ? Array.from(thumbs.querySelectorAll('.pd-thumb-btn')) : [];
    var prevBtn = gallery.querySelector('[data-gallery-prev]');
    var nextBtn = gallery.querySelector('[data-gallery-next]');
    var counterEl = gallery.querySelector('[data-gallery-counter]');
    var liveEl = gallery.querySelector('[data-gallery-live]');
    var slides = track ? Array.from(track.querySelectorAll('.pd-gallery-slide')) : [];
    var totalSlides = slides.length;
    var activeIndex = 0;
    var suppressLightboxClick = false;
    var scrollRaf = 0;

    var centerThumbInView = function (thumbBtn) {
      if (!thumbs || !thumbBtn) return;
      var targetLeft =
        thumbBtn.offsetLeft - thumbs.clientWidth / 2 + thumbBtn.offsetWidth / 2;
      thumbs.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: isReducedMotion ? 'auto' : 'smooth'
      });
    };

    var announceSlide = function (idx) {
      if (!liveEl || totalSlides <= 1) return;
      var tpl = liveEl.getAttribute('data-template') || 'Foto {current} dari {total}';
      liveEl.textContent = tpl
        .replace('{current}', String(idx + 1))
        .replace('{total}', String(totalSlides));
    };

    var syncGalleryUi = function (idx, announce) {
      if (totalSlides === 0) return;
      var clamped = Math.max(0, Math.min(idx, totalSlides - 1));
      var changed = clamped !== activeIndex;
      activeIndex = clamped;

      if (mainTrigger) {
        mainTrigger.setAttribute('data-active-index', String(clamped));
      }
      thumbButtons.forEach(function (btn, i) {
        btn.setAttribute('aria-pressed', i === clamped ? 'true' : 'false');
      });
      if (thumbButtons[clamped] && changed) {
        centerThumbInView(thumbButtons[clamped]);
      }
      if (counterEl) {
        counterEl.textContent = String(clamped + 1) + ' / ' + String(totalSlides);
      }
      if (prevBtn) prevBtn.disabled = clamped <= 0;
      if (nextBtn) nextBtn.disabled = clamped >= totalSlides - 1;
      if (announce && changed) announceSlide(clamped);
    };

    var goToSlide = function (idx, announce) {
      if (!track || totalSlides === 0) return;
      var clamped = Math.max(0, Math.min(idx, totalSlides - 1));
      var slideWidth = track.clientWidth;
      if (slideWidth > 0) {
        track.scrollTo({
          left: clamped * slideWidth,
          behavior: isReducedMotion ? 'auto' : 'smooth'
        });
      }
      syncGalleryUi(clamped, announce);
    };

    if (track && totalSlides > 1) {
      track.addEventListener('scroll', function () {
        if (scrollRaf) cancelAnimationFrame(scrollRaf);
        scrollRaf = requestAnimationFrame(function () {
          var width = track.clientWidth;
          if (!width) return;
          var nearest = Math.round(track.scrollLeft / width);
          if (nearest !== activeIndex) {
            syncGalleryUi(nearest, true);
          }
        });
      }, { passive: true });

      attachMouseDragScroll(track, function (dx) {
        suppressLightboxClick = true;
        var width = track.clientWidth;
        if (width) {
          var targetIdx = activeIndex;
          if (dx < -40) targetIdx = activeIndex + 1;
          else if (dx > 40) targetIdx = activeIndex - 1;
          else targetIdx = Math.round(track.scrollLeft / width);
          goToSlide(targetIdx, true);
        }
        setTimeout(function () {
          suppressLightboxClick = false;
        }, 80);
      });
    }

    if (thumbs && thumbButtons.length > 1) {
      var suppressThumbClick = false;
      attachMouseDragScroll(thumbs, function () {
        suppressThumbClick = true;
        setTimeout(function () {
          suppressThumbClick = false;
        }, 80);
      });

      thumbs.addEventListener('click', function (e) {
        if (suppressThumbClick) {
          e.preventDefault();
          return;
        }
        var btn = e.target.closest('.pd-thumb-btn');
        if (!btn) return;
        var clickedIndex = parseInt(btn.getAttribute('data-index') || '', 10);
        if (Number.isNaN(clickedIndex)) {
          clickedIndex = Math.max(0, thumbButtons.indexOf(btn));
        }
        goToSlide(clickedIndex, true);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        goToSlide(activeIndex - 1, true);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        goToSlide(activeIndex + 1, true);
      });
    }

    if (totalSlides > 1) {
      gallery.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToSlide(activeIndex - 1, true);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToSlide(activeIndex + 1, true);
        }
      });
    }

    if (mainTrigger) {
      var openProductGalleryLightbox = function () {
        if (!window.EuodooLightbox || typeof window.EuodooLightbox.open !== 'function') {
          return;
        }
        var captionText =
          mainTrigger.getAttribute('data-caption') ||
          (mainImg && mainImg.getAttribute('alt')) ||
          '';
        var currentIdx =
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
                element: thumbImg || (idx === currentIdx ? mainImg : null)
              };
            })
            .filter(Boolean);
        }

        if (!items.length && mainImg) {
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

        if (currentIdx < 0 || currentIdx >= items.length) {
          currentIdx = 0;
        }
        window.EuodooLightbox.open(items, currentIdx, mainTrigger);
      };

      mainTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        if (suppressLightboxClick) return;
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

  var tabContainers = document.querySelectorAll('[data-pd-tabs]');
  tabContainers.forEach(function (container) {
    var tabs = Array.from(container.querySelectorAll('[role="tab"]'));
    var panels = Array.from(container.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length || !panels.length) return;

    var activateTab = function (nextTab, shouldFocus) {
      var targetId = nextTab.getAttribute('aria-controls');
      tabs.forEach(function (tab) {
        var selected = tab === nextTab;
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.setAttribute('tabindex', selected ? '0' : '-1');
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.id !== targetId;
      });
      if (shouldFocus) nextTab.focus();
    };

    var initialTab = tabs.find(function (t) {
      return t.getAttribute('aria-selected') === 'true';
    }) || tabs[0];
    activateTab(initialTab, false);

    tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () {
        activateTab(tab, false);
      });
      tab.addEventListener('keydown', function (e) {
        var nextIdx = -1;
        if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') nextIdx = 0;
        else if (e.key === 'End') nextIdx = tabs.length - 1;
        if (nextIdx !== -1) {
          e.preventDefault();
          activateTab(tabs[nextIdx], true);
        }
      });
    });
  });
})();
