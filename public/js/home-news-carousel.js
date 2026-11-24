(function () {
  'use strict';

  const AUTOPLAY_MS = 3000;
  const SWIPE_THRESHOLD_PX = 45;
  const TRANSITION_FALLBACK_MS = 520;
  const RESIZE_DEBOUNCE_MS = 150;
  const MAX_EDGE_CLONES = 3;

  function getVisibleCount() {
    if (window.innerWidth >= 1024) return 2;
    if (window.innerWidth >= 768) return 1.5;
    return 1;
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function getAutoplayDelay(carousel) {
    const parsed = parseInt(carousel.getAttribute('data-autoplay-ms') || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : AUTOPLAY_MS;
  }

  function createCloneSlide(slide) {
    const clone = slide.cloneNode(true);
    clone.classList.add('hnc-slide--clone');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a').forEach((link) => {
      link.setAttribute('tabindex', '-1');
    });
    return clone;
  }

  function setupEdgeClones(state) {
    if (state.totalOriginal <= 1) return;
    const edgeCount = Math.min(MAX_EDGE_CLONES, state.totalOriginal);
    const headClones = state.originals.slice(-edgeCount).map(createCloneSlide);
    const tailClones = state.originals.slice(0, edgeCount).map(createCloneSlide);
    const fragmentBefore = document.createDocumentFragment();
    headClones.forEach((clone) => fragmentBefore.appendChild(clone));
    state.track.insertBefore(fragmentBefore, state.track.firstChild);
    tailClones.forEach((clone) => state.track.appendChild(clone));
    state.edgeCount = edgeCount;
    state.clones = headClones.concat(tailClones);
    state.allSlides = Array.from(state.track.querySelectorAll('.hnc-slide'));
  }

  function getSlideOffset(state, virtualIndex) {
    const domIndex = state.edgeCount + virtualIndex;
    const targetSlide = state.allSlides[domIndex];
    return targetSlide ? targetSlide.offsetLeft : 0;
  }

  function applyTrackPosition(state, offsetPx, instant) {
    if (instant) state.track.classList.add('is-no-transition');
    state.track.style.transform = `translate3d(-${offsetPx}px, 0, 0)`;
    if (!instant) return;
    void state.track.offsetWidth;
    state.track.classList.remove('is-no-transition');
  }

  function syncCloneVisibility(state, isStatic) {
    state.clones.forEach((clone) => {
      clone.hidden = isStatic;
    });
  }

  function stopAutoplay(state) {
    if (!state.autoplayTimer) return;
    clearInterval(state.autoplayTimer);
    state.autoplayTimer = null;
  }

  function startAutoplay(state) {
    stopAutoplay(state);
    if (state.isStatic || state.isPaused || document.hidden || prefersReducedMotion()) return;
    state.autoplayTimer = setInterval(() => moveBy(state, 1), state.autoplayDelay);
  }

  function finishTransition(state) {
    if (!state.isTransitioning) return;
    clearTimeout(state.fallbackTimer);
    state.fallbackTimer = null;
    state.isTransitioning = false;
    if (state.virtualIndex < 0) {
      state.virtualIndex = state.totalOriginal - 1;
      applyTrackPosition(state, getSlideOffset(state, state.virtualIndex), true);
      return;
    }
    if (state.virtualIndex >= state.totalOriginal) {
      state.virtualIndex = 0;
      applyTrackPosition(state, getSlideOffset(state, state.virtualIndex), true);
    }
  }

  function moveBy(state, delta) {
    if (state.isStatic || state.isTransitioning) return;
    const nextVirtual = state.virtualIndex + delta;
    if (prefersReducedMotion()) {
      const normalized = (nextVirtual + state.totalOriginal) % state.totalOriginal;
      state.virtualIndex = normalized;
      applyTrackPosition(state, getSlideOffset(state, normalized), true);
      return;
    }
    state.isTransitioning = true;
    state.virtualIndex = nextVirtual;
    applyTrackPosition(state, getSlideOffset(state, nextVirtual), false);
    clearTimeout(state.fallbackTimer);
    state.fallbackTimer = setTimeout(() => finishTransition(state), TRANSITION_FALLBACK_MS);
  }

  function updateLayout(state) {
    const isStatic = state.totalOriginal <= Math.ceil(getVisibleCount());
    state.isStatic = isStatic;
    state.carousel.classList.toggle('is-static', isStatic);
    if (state.controls) state.controls.hidden = isStatic;
    syncCloneVisibility(state, isStatic);
    if (isStatic) {
      stopAutoplay(state);
      state.virtualIndex = 0;
      state.track.style.transform = 'translate3d(0, 0, 0)';
      return;
    }
    applyTrackPosition(state, getSlideOffset(state, state.virtualIndex), true);
    startAutoplay(state);
  }

  function setPauseFlag(state, paused) {
    state.isPaused = paused;
    if (paused) {
      stopAutoplay(state);
      return;
    }
    startAutoplay(state);
  }

  function bindPauseEvents(state) {
    const targets = state.controls ? [state.carousel, state.controls] : [state.carousel];
    targets.forEach((el) => {
      el.addEventListener('mouseenter', () => setPauseFlag(state, true));
      el.addEventListener('mouseleave', () => setPauseFlag(state, false));
      el.addEventListener('focusin', () => setPauseFlag(state, true));
      el.addEventListener('focusout', () => setPauseFlag(state, false));
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay(state);
        return;
      }
      startAutoplay(state);
    });
  }

  function bindSwipe(state) {
    let startX = 0;
    let startY = 0;
    state.carousel.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
      setPauseFlag(state, true);
    }, { passive: true });
    state.carousel.addEventListener('touchend', (e) => {
      const diffX = startX - e.changedTouches[0].screenX;
      const diffY = startY - e.changedTouches[0].screenY;
      if (Math.abs(diffX) > SWIPE_THRESHOLD_PX && Math.abs(diffX) > Math.abs(diffY)) {
        moveBy(state, diffX > 0 ? 1 : -1);
      }
      setPauseFlag(state, false);
    }, { passive: true });
    state.carousel.addEventListener('touchcancel', () => setPauseFlag(state, false), { passive: true });
  }

  function bindKeyboard(state) {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveBy(state, -1);
        startAutoplay(state);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveBy(state, 1);
        startAutoplay(state);
      }
    };
    state.carousel.addEventListener('keydown', handleKey);
    if (state.controls) state.controls.addEventListener('keydown', handleKey);
  }

  function bindControls(state) {
    if (state.prevBtn) {
      state.prevBtn.addEventListener('click', () => {
        moveBy(state, -1);
        startAutoplay(state);
      });
    }
    if (state.nextBtn) {
      state.nextBtn.addEventListener('click', () => {
        moveBy(state, 1);
        startAutoplay(state);
      });
    }
    state.track.addEventListener('transitionend', (e) => {
      if (e.target === state.track && e.propertyName === 'transform') {
        finishTransition(state);
      }
    });
  }

  function bindResize(state) {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => updateLayout(state), RESIZE_DEBOUNCE_MS);
    });
  }

  function initHomeNewsCarousel() {
    const carousel = document.getElementById('hncCarousel');
    const track = document.getElementById('hncTrack');
    if (!carousel || !track) return;
    const originals = Array.from(track.querySelectorAll('.hnc-slide'));
    if (!originals.length) return;
    const state = {
      carousel,
      track,
      controls: carousel.closest('.sec-news')?.querySelector('.hnc-controls') || null,
      prevBtn: document.getElementById('hncPrevBtn'),
      nextBtn: document.getElementById('hncNextBtn'),
      originals,
      allSlides: originals,
      clones: [],
      totalOriginal: originals.length,
      edgeCount: 0,
      virtualIndex: 0,
      isStatic: false,
      isTransitioning: false,
      isPaused: false,
      autoplayDelay: getAutoplayDelay(carousel),
      autoplayTimer: null,
      fallbackTimer: null
    };
    setupEdgeClones(state);
    bindControls(state);
    bindPauseEvents(state);
    bindSwipe(state);
    bindKeyboard(state);
    bindResize(state);
    updateLayout(state);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeNewsCarousel);
  } else {
    initHomeNewsCarousel();
  }
}());
