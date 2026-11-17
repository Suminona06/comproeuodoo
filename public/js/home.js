(function () {
  'use strict';

  const HERO_AUTOPLAY_DELAY = 5000;
  const HERO_SWIPE_THRESHOLD = 45;
  const HERO_TRANSITION_MS = 500;
  const YOUTUBE_ORIGINS = new Set(['https://www.youtube.com', 'https://www.youtube-nocookie.com']);
  const YOUTUBE_EVENTS = new Set(['infoDelivery', 'onStateChange', 'initialDelivery']);

  function getYoutubeOrigin(iframe) {
    const src = iframe.getAttribute('src') || '';
    return src.startsWith('https://www.youtube-nocookie.com')
      ? 'https://www.youtube-nocookie.com'
      : 'https://www.youtube.com';
  }

  function postYoutubeMessage(iframe, payload) {
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(JSON.stringify(payload), getYoutubeOrigin(iframe));
    } catch {
      return;
    }
  }

  function sendYoutubeCommand(iframe, func, args = '') {
    postYoutubeMessage(iframe, { event: 'command', func, args });
  }

  function parseYoutubeMessage(event) {
    if (!YOUTUBE_ORIGINS.has(event.origin) || !event.data) return null;
    if (typeof event.data !== 'string') return event.data;
    try {
      return JSON.parse(event.data);
    } catch {
      return null;
    }
  }

  function handleYoutubeMessage(event) {
    const data = parseYoutubeMessage(event);
    if (!data || !YOUTUBE_EVENTS.has(data.event)) return;
    const state = data.info && data.info.playerState !== undefined ? data.info.playerState : data.info;
    if (state !== 0) return;
    const activeIframe = document.querySelector('.hero-slide.is-active iframe.hero-youtube-iframe')
      || document.querySelector('iframe.hero-youtube-iframe');
    sendYoutubeCommand(activeIframe, 'seekTo', [0, true]);
    sendYoutubeCommand(activeIframe, 'playVideo');
  }

  function initHeroYouTube() {
    const iframes = document.querySelectorAll('iframe.hero-youtube-iframe');
    if (!iframes.length) return;
    iframes.forEach((iframe) => {
      iframe.addEventListener('load', () => {
        sendYoutubeCommand(iframe, 'mute');
        sendYoutubeCommand(iframe, 'playVideo');
        postYoutubeMessage(iframe, { event: 'listening' });
      });
    });
    window.addEventListener('message', handleYoutubeMessage);
  }

  function syncSlideVideo(slide, isEntering) {
    const video = slide.querySelector('video');
    if (!video) return;
    if (!isEntering) {
      video.pause();
      return;
    }
    video.currentTime = 0;
    video.play().catch(() => undefined);
  }

  function toggleSlideMedia(slide, isEntering) {
    syncSlideVideo(slide, isEntering);
    sendYoutubeCommand(slide.querySelector('iframe.hero-youtube-iframe'), isEntering ? 'playVideo' : 'pauseVideo');
  }

  function updateHeroControls(ctx) {
    ctx.dots.forEach((dot, idx) => {
      const isActive = idx === ctx.currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    if (ctx.currentNumEl) {
      ctx.currentNumEl.textContent = String(ctx.currentIndex + 1).padStart(2, '0');
    }
  }

  function updateActiveSlide(ctx, newIndex) {
    const currentSlide = ctx.slides[ctx.currentIndex];
    currentSlide.classList.remove('is-active');
    toggleSlideMedia(currentSlide, false);
    ctx.currentIndex = (newIndex + ctx.totalSlides) % ctx.totalSlides;
    const nextSlide = ctx.slides[ctx.currentIndex];
    nextSlide.classList.add('is-active');
    toggleSlideMedia(nextSlide, true);
    updateHeroControls(ctx);
  }

  function stopHeroAutoplay(ctx) {
    if (!ctx.autoplayTimer) return;
    clearInterval(ctx.autoplayTimer);
    ctx.autoplayTimer = null;
  }

  function startHeroAutoplay(ctx, onTick) {
    stopHeroAutoplay(ctx);
    ctx.autoplayTimer = setInterval(onTick, HERO_AUTOPLAY_DELAY);
  }

  function goToHeroSlide(ctx, targetIndex, onTick) {
    if (ctx.isTransitioning || targetIndex === ctx.currentIndex) return;
    ctx.isTransitioning = true;
    updateActiveSlide(ctx, targetIndex);
    startHeroAutoplay(ctx, onTick);
    setTimeout(() => { ctx.isTransitioning = false; }, HERO_TRANSITION_MS);
  }

  function bindHeroTouchSwipe(ctx, actions) {
    let startX = 0;
    let startY = 0;
    ctx.slider.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
      stopHeroAutoplay(ctx);
    }, { passive: true });
    ctx.slider.addEventListener('touchend', (e) => {
      const diffX = startX - e.changedTouches[0].screenX;
      const diffY = startY - e.changedTouches[0].screenY;
      if (Math.abs(diffX) > HERO_SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
        actions.goTo(ctx.currentIndex + (diffX > 0 ? 1 : -1));
      }
      startHeroAutoplay(ctx, actions.next);
    }, { passive: true });
  }

  function bindHeroControls(ctx, actions) {
    if (ctx.nextBtn) ctx.nextBtn.addEventListener('click', (e) => { e.preventDefault(); actions.next(); });
    if (ctx.prevBtn) ctx.prevBtn.addEventListener('click', (e) => { e.preventDefault(); actions.prev(); });
    ctx.dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const target = parseInt(dot.getAttribute('data-slide-target'), 10);
        if (!Number.isNaN(target)) actions.goTo(target);
      });
    });
  }

  function bindHeroKeyboardAndHover(ctx, actions) {
    ctx.slider.addEventListener('mouseenter', () => stopHeroAutoplay(ctx));
    ctx.slider.addEventListener('mouseleave', () => startHeroAutoplay(ctx, actions.next));
    ctx.slider.addEventListener('focusin', () => stopHeroAutoplay(ctx));
    ctx.slider.addEventListener('focusout', () => startHeroAutoplay(ctx, actions.next));
    ctx.slider.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      if (e.key === 'ArrowRight') actions.next();
      else actions.prev();
    });
  }

  function initHeroSlider() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;
    const slides = slider.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;
    const ctx = {
      slider,
      slides,
      totalSlides: slides.length,
      currentIndex: 0,
      autoplayTimer: null,
      isTransitioning: false,
      prevBtn: document.getElementById('heroPrevBtn'),
      nextBtn: document.getElementById('heroNextBtn'),
      dots: slider.querySelectorAll('.hero-dot'),
      currentNumEl: document.getElementById('heroCurrentNum')
    };
    const actions = {
      next: () => goToHeroSlide(ctx, ctx.currentIndex + 1, actions.next),
      prev: () => goToHeroSlide(ctx, ctx.currentIndex - 1, actions.next),
      goTo: (idx) => goToHeroSlide(ctx, idx, actions.next)
    };
    bindHeroControls(ctx, actions);
    bindHeroKeyboardAndHover(ctx, actions);
    bindHeroTouchSwipe(ctx, actions);
    startHeroAutoplay(ctx, actions.next);
  }

  function isSafeLogoUrl(url) {
    return typeof url === 'string' && /^(?:\/(?!\/)|https?:\/\/|data:image\/)/i.test(url.trim());
  }

  function renderBrandModalMedia(imgWrapEl, name, logoUrl, initials) {
    if (!imgWrapEl) return;
    imgWrapEl.textContent = '';
    if (isSafeLogoUrl(logoUrl)) {
      const img = document.createElement('img');
      img.src = logoUrl.trim();
      img.alt = name;
      img.className = 'brand-modal-zoom-img';
      imgWrapEl.appendChild(img);
      return;
    }
    const span = document.createElement('span');
    span.className = 'brand-fallback-initials';
    span.textContent = initials;
    imgWrapEl.appendChild(span);
  }

  function bindBrandTrigger(trigger, onOpen) {
    trigger.addEventListener('click', () => onOpen(trigger));
    trigger.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      onOpen(trigger);
    });
  }

  function openBrandPreview(state, trigger) {
    const defaultName = state.modal.getAttribute('data-default-brand-name') || 'Merek Resmi';
    const name = trigger.getAttribute('data-brand-name') || defaultName;
    const logoUrl = trigger.getAttribute('data-brand-logo') || '';
    const initials = trigger.getAttribute('data-brand-initials') || name.substring(0, 2).toUpperCase();
    if (state.titleEl) state.titleEl.textContent = name;
    renderBrandModalMedia(state.imgWrapEl, name, logoUrl, initials);
    state.lastActiveTrigger = trigger;
    state.modal.classList.add('is-open');
    state.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (state.closeBtn) state.closeBtn.focus();
  }

  function closeBrandPreview(state) {
    state.modal.classList.remove('is-open');
    state.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (!state.lastActiveTrigger) return;
    state.lastActiveTrigger.focus();
    state.lastActiveTrigger = null;
  }

  function initBrandPreviewModal() {
    const modal = document.getElementById('brandPreviewModal');
    if (!modal) return;
    const state = {
      modal,
      backdrop: document.getElementById('brandModalBackdrop'),
      closeBtn: document.getElementById('brandModalCloseBtn'),
      closeAction: document.getElementById('brandModalCloseAction'),
      titleEl: document.getElementById('brandModalTitle'),
      imgWrapEl: document.getElementById('brandModalImgWrap'),
      lastActiveTrigger: null
    };
    const close = () => closeBrandPreview(state);
    document.querySelectorAll('.js-brand-preview-trigger').forEach((el) => bindBrandTrigger(el, (t) => openBrandPreview(state, t)));
    if (state.closeBtn) state.closeBtn.addEventListener('click', close);
    if (state.closeAction) state.closeAction.addEventListener('click', close);
    if (state.backdrop) state.backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  function applyFallbackImage(img) {
    const fallbackSrc = img.getAttribute('data-fallback-src');
    if (!fallbackSrc || img.dataset.fallbackApplied === 'true') return;
    img.dataset.fallbackApplied = 'true';
    img.src = fallbackSrc;
  }

  function initNewsFallbackImages() {
    document.querySelectorAll('img[data-fallback-src]').forEach((img) => {
      if (img.complete && img.naturalWidth === 0) {
        applyFallbackImage(img);
        return;
      }
      img.addEventListener('error', () => applyFallbackImage(img));
    });
  }

  function initHomePage() {
    initHeroYouTube();
    initHeroSlider();
    initBrandPreviewModal();
    initNewsFallbackImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
  } else {
    initHomePage();
  }
})();
