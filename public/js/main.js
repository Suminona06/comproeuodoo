/**
 * PT Euodoo - Public Client Script v2.0
 * Acuan: prototype-homepage-v2.html & DESIGN.md
 */

document.addEventListener('DOMContentLoaded', () => {
  // Transparent-to-Frosted Header on Scroll
  const headerWrap = document.getElementById('headerWrap');
  function onScroll() {
    if (!headerWrap) return;
    if (window.scrollY > 30) {
      headerWrap.classList.add('is-scrolled');
    } else {
      headerWrap.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile Menu Toggle & Drawer
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('navMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');

  function openMobileMenu() {
    if (!menu || !toggle) return;
    menu.classList.add('open');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    if (headerWrap) headerWrap.classList.add('menu-open');
    if (menuBackdrop) menuBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    if (headerWrap) headerWrap.classList.remove('menu-open');
    if (menuBackdrop) menuBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (toggle && menu) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('open') && headerWrap && !headerWrap.contains(e.target)) {
        closeMobileMenu();
      }
    });

    if (menuBackdrop) {
      menuBackdrop.addEventListener('click', closeMobileMenu);
    }
  }

  // Close when clicking any nav item link inside drawer
  document.querySelectorAll('#navMenu a').forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Keyboard accessibility: Escape key closes menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu && menu.classList.contains('open')) {
      closeMobileMenu();
      if (toggle) toggle.focus();
    }
  });

  // Automatically close drawer when resized to desktop (>1024px)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && menu && menu.classList.contains('open')) {
      closeMobileMenu();
    }
  }, { passive: true });

  // Smooth scroll for hash anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href !== '#' && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Scroll Reveal Observer
  if ('IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach((el) => {
      revealObs.observe(el);
    });

    if (window.location.hash) {
      revealEls.forEach((el) => el.classList.add('visible'));
    }
  }

  (function initHeroYouTube() {
    const iframes = document.querySelectorAll('iframe.hero-youtube-iframe');
    if (!iframes.length) return;

    iframes.forEach(iframe => {
      iframe.addEventListener('load', () => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: '' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
          }
        } catch (_) {}
      });
    });

    window.addEventListener('message', (event) => {
      if (!event.data) return;
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (_) {
          return;
        }
      }
      if (data && (data.event === 'infoDelivery' || data.event === 'onStateChange' || data.event === 'initialDelivery')) {
        const state = (data.info && typeof data.info.playerState !== 'undefined') ? data.info.playerState : data.info;
        if (state === 0) {
          const activeIframe = document.querySelector('.hero-slide.is-active iframe.hero-youtube-iframe') || document.querySelector('iframe.hero-youtube-iframe');
          if (activeIframe && activeIframe.contentWindow) {
            activeIframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }), '*');
            activeIframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
          }
        }
      }
    });
  })();

  // ═══ HERO BANNER SLIDER (Autoplay, Nav, Dots, Touch, Loop) ═══
  (function initHeroSlider() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    const prevBtn = document.getElementById('heroPrevBtn');
    const nextBtn = document.getElementById('heroNextBtn');
    const dots = slider.querySelectorAll('.hero-dot');
    const currentNumEl = document.getElementById('heroCurrentNum');

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoplayTimer = null;
    const AUTOPLAY_DELAY = 5000;
    let isTransitioning = false;

    function updateActiveState(newIndex) {
      const currentSlide = slides[currentIndex];
      currentSlide.classList.remove('is-active');
      const currentVideo = currentSlide.querySelector('video');
      if (currentVideo) {
        currentVideo.pause();
      }
      const currentYt = currentSlide.querySelector('iframe.hero-youtube-iframe');
      if (currentYt && currentYt.contentWindow) {
        currentYt.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
      }

      currentIndex = (newIndex + totalSlides) % totalSlides;
      const nextSlide = slides[currentIndex];
      nextSlide.classList.add('is-active');
      const nextVideo = nextSlide.querySelector('video');
      if (nextVideo) {
        nextVideo.currentTime = 0;
        nextVideo.play().catch(() => {});
      }
      const nextYt = nextSlide.querySelector('iframe.hero-youtube-iframe');
      if (nextYt && nextYt.contentWindow) {
        nextYt.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
      }

      // Update dots
      dots.forEach((dot, idx) => {
        const isActive = idx === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // Update counter
      if (currentNumEl) {
        currentNumEl.textContent = String(currentIndex + 1).padStart(2, '0');
      }
    }

    function goToSlide(targetIndex) {
      if (isTransitioning || targetIndex === currentIndex) return;
      isTransitioning = true;
      updateActiveState(targetIndex);
      restartAutoplay();
      setTimeout(() => {
        isTransitioning = false;
      }, 500);
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(nextSlide, AUTOPLAY_DELAY);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // Nav Arrows
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextSlide();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevSlide();
      });
    }

    // Dots navigation
    dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const target = parseInt(dot.getAttribute('data-slide-target'), 10);
        if (!isNaN(target)) {
          goToSlide(target);
        }
      });
    });

    // Pause on hover
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    // Pause on focus (keyboard accessibility)
    slider.addEventListener('focusin', stopAutoplay);
    slider.addEventListener('focusout', startAutoplay);

    // Keyboard Arrow keys when slider is focused
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    });

    // Mobile Touch Swipe Handling
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const SWIPE_THRESHOLD = 45;

    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      stopAutoplay();
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;

      // Ensure horizontal swipe is more significant than vertical scroll
      if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          nextSlide(); // Swiped left -> next
        } else {
          prevSlide(); // Swiped right -> prev
        }
      }
      startAutoplay();
    }, { passive: true });

    // Initial autoplay start
    startAutoplay();
  })();

  // Brand Logo Zoom Preview Lightbox Modal
  (() => {
    const modal = document.getElementById('brandPreviewModal');
    if (!modal) return;

    const backdrop = document.getElementById('brandModalBackdrop');
    const closeBtn = document.getElementById('brandModalCloseBtn');
    const closeAction = document.getElementById('brandModalCloseAction');
    const titleEl = document.getElementById('brandModalTitle');
    const imgWrapEl = document.getElementById('brandModalImgWrap');
    let lastActiveTrigger = null;

    function openModal(trigger) {
      const name = trigger.getAttribute('data-brand-name') || 'Merek Resmi';
      const logoUrl = trigger.getAttribute('data-brand-logo') || '';
      const initials = trigger.getAttribute('data-brand-initials') || name.substring(0, 2).toUpperCase();

      if (titleEl) titleEl.textContent = name;
      if (imgWrapEl) {
        if (logoUrl) {
          imgWrapEl.innerHTML = `<img src="${logoUrl}" alt="${name}" class="brand-modal-zoom-img">`;
        } else {
          imgWrapEl.innerHTML = `<span class="brand-fallback-initials">${initials}</span>`;
        }
      }

      lastActiveTrigger = trigger;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Accessible focus to close button
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastActiveTrigger) {
        lastActiveTrigger.focus();
        lastActiveTrigger = null;
      }
    }

    // Attach click and keyboard events to triggers
    document.querySelectorAll('.js-brand-preview-trigger').forEach((trigger) => {
      trigger.addEventListener('click', () => openModal(trigger));
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(trigger);
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeAction) closeAction.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  })();

  // Public About Page: Gallery Slider (#galeri)
  (() => {
    const galTrack = document.getElementById('galTrack');
    if (!galTrack) return;

    const galThumbs = document.getElementById('galThumbs');
    const galCur = document.getElementById('galCur');
    const galTotal = document.getElementById('galTotal');
    const galPrev = document.getElementById('galPrev');
    const galNext = document.getElementById('galNext');
    const galViewport = galTrack.closest('.gal-viewport') || galTrack.parentElement;
    const galSlides = Array.from(galTrack.querySelectorAll('.gal-slide'));
    const galCount = galSlides.length;

    if (galCount <= 1) {
      if (galTotal) galTotal.textContent = '01';
      if (galCur) galCur.textContent = '01';
      return;
    }

    let galIndex = 0;
    const thumbBtns = [];

    const pad2 = (n) => (n < 10 ? '0' : '') + n;

    if (galThumbs) {
      galSlides.forEach((slide, i) => {
        const img = slide.querySelector('img');
        const title = slide.querySelector('.gal-slide-title');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gal-thumb' + (i === 0 ? ' is-active' : '');
        btn.setAttribute(
          'aria-label',
          title && title.textContent.trim()
            ? `Lihat foto: ${title.textContent.trim()}`
            : `Lihat foto ${i + 1}`
        );
        const th = document.createElement('img');
        th.src = img ? (img.getAttribute('src') || '') : '';
        th.alt = '';
        btn.appendChild(th);
        btn.addEventListener('click', () => {
          goTo(i);
          restartAutoplay();
        });
        galThumbs.appendChild(btn);
        thumbBtns.push(btn);
      });
    }

    if (galTotal) galTotal.textContent = pad2(galCount);
    if (galCur) galCur.textContent = pad2(1);

    function goTo(i) {
      galIndex = ((i % galCount) + galCount) % galCount;
      galTrack.style.transform = `translateX(-${galIndex * 100}%)`;
      if (galCur) galCur.textContent = pad2(galIndex + 1);
      thumbBtns.forEach((btn, k) => {
        btn.classList.toggle('is-active', k === galIndex);
      });
      const active = thumbBtns[galIndex];
      if (active && galThumbs) {
        const tl = galThumbs.scrollLeft;
        const tw = galThumbs.clientWidth;
        const bl = active.offsetLeft;
        const br = bl + active.offsetWidth;
        if (bl < tl) {
          galThumbs.scrollLeft = bl - 12;
        } else if (br > tl + tw) {
          galThumbs.scrollLeft = br - tw + 12;
        }
      }
    }

    if (galPrev) {
      galPrev.addEventListener('click', () => {
        goTo(galIndex - 1);
        restartAutoplay();
      });
    }

    if (galNext) {
      galNext.addEventListener('click', () => {
        goTo(galIndex + 1);
        restartAutoplay();
      });
    }

    function isGalActive() {
      if (galViewport && galViewport.matches && galViewport.matches(':hover')) return true;
      const act = document.activeElement;
      if (!act) return false;
      return (
        act === galViewport ||
        (galViewport && galViewport.contains(act)) ||
        (galThumbs && galThumbs.contains(act)) ||
        act === galPrev ||
        act === galNext
      );
    }

    document.addEventListener('keydown', (e) => {
      if (!isGalActive()) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(galIndex - 1);
        restartAutoplay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(galIndex + 1);
        restartAutoplay();
      }
    });

    let dragActive = false;
    let dragStartX = 0;

    galTrack.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragActive = true;
      dragStartX = e.clientX;
      galTrack.classList.add('is-dragging');
      try {
        galTrack.setPointerCapture(e.pointerId);
      } catch (_) {}
    });

    galTrack.addEventListener('pointermove', (e) => {
      if (!dragActive) return;
      const width = galTrack.parentElement.getBoundingClientRect().width || 1;
      const pct = -galIndex * 100 + ((e.clientX - dragStartX) / width) * 100;
      galTrack.style.transform = `translateX(${pct}%)`;
    });

    function endDrag(e) {
      if (!dragActive) return;
      dragActive = false;
      galTrack.classList.remove('is-dragging');
      const width = galTrack.parentElement.getBoundingClientRect().width || 1;
      const delta = e.clientX - dragStartX;
      if (Math.abs(delta) > Math.max(40, width * 0.12)) {
        goTo(galIndex + (delta < 0 ? 1 : -1));
      } else {
        goTo(galIndex);
      }
      restartAutoplay();
    }

    galTrack.addEventListener('pointerup', endDrag);
    galTrack.addEventListener('pointercancel', () => {
      if (!dragActive) return;
      dragActive = false;
      galTrack.classList.remove('is-dragging');
      goTo(galIndex);
      restartAutoplay();
    });

    const AUTOPLAY_MS = 5000;
    let galPaused = false;
    let autoTimer = null;
    const mediaReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

    function stopAutoplay() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();
      if (galPaused || (mediaReducedMotion && mediaReducedMotion.matches) || document.hidden) return;
      autoTimer = setInterval(() => {
        goTo(galIndex + 1);
      }, AUTOPLAY_MS);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    const galSection = galTrack.closest('.sec-gallery');
    if (galSection) {
      galSection.addEventListener('mouseenter', () => {
        galPaused = true;
        stopAutoplay();
      });
      galSection.addEventListener('mouseleave', () => {
        galPaused = false;
        restartAutoplay();
      });
      galSection.addEventListener('focusin', () => {
        galPaused = true;
        stopAutoplay();
      });
      galSection.addEventListener('focusout', () => {
        galPaused = false;
        restartAutoplay();
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        restartAutoplay();
      }
    });

    if (mediaReducedMotion) {
      mediaReducedMotion.addEventListener('change', (e) => {
        if (e.matches) {
          stopAutoplay();
        } else {
          restartAutoplay();
        }
      });
    }

    goTo(0);
    startAutoplay();
  })();
});

