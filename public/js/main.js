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

  // Dynamic Header Height Offset calculation (T-224)
  function updateHeaderOffset() {
    if (!headerWrap) return;
    if (!headerWrap.classList.contains('is-scrolled')) {
      const height = headerWrap.offsetHeight;
      if (height > 0) {
        document.documentElement.style.setProperty('--header-actual-height', `${height}px`);
      }
    } else {
      const topBar = headerWrap.querySelector('.top-bar-inner');
      const siteHeader = headerWrap.querySelector('.site-header');
      const topBarH = topBar ? (topBar.offsetHeight || 28) : (window.innerWidth <= 768 ? 24 : 28);
      const siteH = siteHeader ? siteHeader.offsetHeight : 64;
      const totalH = topBarH + siteH;
      if (totalH > 0) {
        document.documentElement.style.setProperty('--header-actual-height', `${totalH}px`);
      }
    }
  }
  updateHeaderOffset();
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateHeaderOffset, 100);
  }, { passive: true });
  window.addEventListener('load', updateHeaderOffset, { passive: true, once: true });

  // Mobile Menu Toggle & Drawer (Anime.js driven)
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('navMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  let isMenuAnimating = false;

  function openMobileMenu() {
    if (!menu || !toggle || isMenuAnimating) return;
    if (menu.classList.contains('open')) return;

    isMenuAnimating = true;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animeLib = typeof anime !== 'undefined' ? anime : (typeof window !== 'undefined' ? window.anime : null);

    if (animeLib && !prefersReducedMotion) {
      animeLib.remove([menu, menuBackdrop]);
      const navItems = menu.querySelectorAll('li');
      if (navItems.length > 0) animeLib.remove(navItems);

      // Inisialisasi posisi dan transparansi sebelum display:flex aktif agar bebas flash/jitter
      menu.style.opacity = '0';
      menu.style.transform = 'translateY(-10px)';
      if (menuBackdrop) menuBackdrop.style.opacity = '0';

      menu.classList.add('open');
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      if (headerWrap) headerWrap.classList.add('menu-open');
      if (menuBackdrop) menuBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';

      if (menuBackdrop) {
        animeLib({
          targets: menuBackdrop,
          opacity: [0, 1],
          duration: 240,
          easing: 'easeOutQuad'
        });
      }

      animeLib({
        targets: menu,
        translateY: [-10, 0],
        opacity: [0, 1],
        duration: 280,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)',
        complete: () => {
          menu.style.transform = '';
          menu.style.opacity = '';
          isMenuAnimating = false;
        }
      });

      if (navItems.length > 0) {
        animeLib({
          targets: navItems,
          opacity: [0, 1],
          translateY: [-4, 0],
          delay: animeLib.stagger(20, { start: 50 }),
          duration: 200,
          easing: 'easeOutQuad',
          complete: () => {
            navItems.forEach((li) => {
              li.style.transform = '';
              li.style.opacity = '';
            });
          }
        });
      }
    } else {
      menu.classList.add('open');
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      if (headerWrap) headerWrap.classList.add('menu-open');
      if (menuBackdrop) {
        menuBackdrop.classList.add('open');
        menuBackdrop.style.opacity = '1';
      }
      menu.style.opacity = '1';
      menu.style.transform = 'none';
      document.body.style.overflow = 'hidden';
      isMenuAnimating = false;
    }
  }

  function closeMobileMenu(onComplete) {
    if (!menu || !toggle) return;
    if (!menu.classList.contains('open')) return;

    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animeLib = typeof anime !== 'undefined' ? anime : (typeof window !== 'undefined' ? window.anime : null);

    function finalizeClose() {
      menu.classList.remove('open');
      if (headerWrap) headerWrap.classList.remove('menu-open');
      if (menuBackdrop) {
        menuBackdrop.classList.remove('open');
        menuBackdrop.style.opacity = '';
      }
      menu.style.opacity = '';
      menu.style.transform = '';
      const navItems = menu.querySelectorAll('li');
      navItems.forEach((li) => {
        li.style.opacity = '';
        li.style.transform = '';
      });
      document.body.style.overflow = '';
      isMenuAnimating = false;
      if (typeof onComplete === 'function') onComplete();
    }

    if (animeLib && !prefersReducedMotion) {
      isMenuAnimating = true;
      animeLib.remove([menu, menuBackdrop]);
      const navItems = menu.querySelectorAll('li');
      if (navItems.length > 0) animeLib.remove(navItems);

      if (menuBackdrop) {
        animeLib({
          targets: menuBackdrop,
          opacity: [1, 0],
          duration: 180,
          easing: 'easeInQuad'
        });
      }

      animeLib({
        targets: menu,
        translateY: [0, -10],
        opacity: [1, 0],
        duration: 200,
        easing: 'cubicBezier(0.4, 0, 1, 1)',
        complete: finalizeClose
      });
    } else {
      finalizeClose();
    }
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
      menuBackdrop.addEventListener('click', () => closeMobileMenu());
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
      closeMobileMenu(() => {
        if (toggle) toggle.focus();
      });
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

  // Bento mosaic gallery page transitions and controls (T-133, T-134, T-135)
  (() => {
    const bentoGallery = document.getElementById('bentoGallery');
    const bentoGrid = document.getElementById('bentoGrid');
    if (!bentoGallery || !bentoGrid) return;

    const bentoDataEl = document.getElementById('bentoGalleryData');
    if (!bentoDataEl) return;

    let slides = [];
    try {
      slides = JSON.parse(bentoDataEl.textContent || '[]');
    } catch (_) {
      slides = [];
    }
    if (!slides.length) return;

    const bentoViewport = document.getElementById('abtGalViewport') || bentoGallery;
    const bentoPager = document.getElementById('bentoPager');
    const bentoCur = document.getElementById('bentoCur');
    const bentoTotal = document.getElementById('bentoTotal');
    const bentoPrev = document.getElementById('bentoPrev');
    const bentoNext = document.getElementById('bentoNext');

    let currentPage = 0;
    let isTransitioning = false;
    let activeTimeline = null;

    const getPageSize = () => (window.innerWidth <= 768 ? 2 : 6);
    const pad2 = (n) => (n < 10 ? '0' : '') + n;

    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    function updatePager(totalPages) {
      if (bentoCur) {
        const nextText = pad2(currentPage + 1);
        if (bentoCur.textContent !== nextText) {
          bentoCur.textContent = nextText;
          if (typeof anime !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            anime({
              targets: bentoCur,
              opacity: [0.3, 1],
              translateY: [-3, 0],
              duration: 350,
              easing: 'easeOutCubic'
            });
          }
        }
      }
      if (bentoTotal) bentoTotal.textContent = pad2(totalPages);
      if (bentoPrev) bentoPrev.disabled = currentPage === 0;
      if (bentoNext) bentoNext.disabled = currentPage >= totalPages - 1;
      if (bentoPager) {
        bentoPager.style.display = totalPages <= 1 ? 'none' : 'flex';
      }
    }

    function createSingleTile(slide, idx, isMobile, totalTiles = 6, entering = false) {
      const tile = document.createElement('div');
      let posClass = 'abt-gal-tile--pos-' + (idx + 1) + ' bento-tile--pos-' + (idx + 1);
      if (!isMobile && totalTiles === 6) {
        if (idx === 0) posClass = 'abt-gal-tile--pos-1 abt-gal-tile--tall bento-tile--pos-1 bento-tile--tall';
        else if (idx === 1 || idx === 4) posClass = 'abt-gal-tile--pos-' + (idx + 1) + ' abt-gal-tile--wide bento-tile--pos-' + (idx + 1) + ' bento-tile--wide';
      }
      tile.className = 'abt-gal-tile bento-tile ' + posClass + (entering ? ' is-entering' : '');
      tile.tabIndex = 0;
      tile.style.setProperty('--tile-i', idx);

      const tag = slide.category ? slide.category.trim() : '';
      const titleText = slide.title ? slide.title.trim() : '';
      const photoNum = pad2(idx + 1);
      const isEnglish = document.documentElement.lang === 'en';
      const fallbackLabel = isEnglish
        ? ('PT Euodoo Manufacturing & Operations Facility (Photo ' + photoNum + ')')
        : ('Fasilitas Manufaktur & Operasional PT Euodoo (Foto ' + photoNum + ')');
      const altText = titleText || tag || fallbackLabel;
      tile.setAttribute('aria-label', altText);

      const hasCaption = Boolean(tag || titleText);
      const catHtml = tag ? `<span class="abt-gal-cat bento-cat">${escapeHtml(tag)}</span>` : '';
      const titleHtml = titleText ? `<div class="abt-gal-title bento-title">${escapeHtml(titleText)}</div>` : '';
      const capHtml = hasCaption ? `<div class="abt-gal-cap bento-cap">${catHtml}${titleHtml}</div>` : '';

      tile.innerHTML = `
        <img src="${escapeHtml(slide.image_url)}" alt="${escapeHtml(altText)}" decoding="async">
        ${capHtml}
      `;
      return tile;
    }

    function applyGridModifiers(gridEl, pageSlideCount, isMobile) {
      gridEl.className = 'abt-gal-grid bento-grid';
      if (!isMobile) {
        if (pageSlideCount === 5) gridEl.classList.add('abt-gal-grid--5', 'bento-grid--5');
        else if (pageSlideCount === 4) gridEl.classList.add('abt-gal-grid--4', 'bento-grid--4');
        else if (pageSlideCount === 3) gridEl.classList.add('abt-gal-grid--3', 'bento-grid--3');
        else if (pageSlideCount === 2) gridEl.classList.add('abt-gal-grid--2', 'bento-grid--2');
        else if (pageSlideCount === 1) gridEl.classList.add('abt-gal-grid--1', 'bento-grid--1');
      } else {
        if (pageSlideCount === 1) gridEl.classList.add('abt-gal-grid--1', 'bento-grid--1');
      }
    }

    async function transitionToPage(targetPage, immediate = false) {
      const pageSize = getPageSize();
      const totalPages = Math.ceil(slides.length / pageSize);
      const boundedTarget = Math.max(0, Math.min(targetPage, totalPages - 1));

      if (isTransitioning || (boundedTarget === currentPage && !immediate)) return;

      const direction = boundedTarget > currentPage ? 1 : -1;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      currentPage = boundedTarget;

      const start = currentPage * pageSize;
      const end = Math.min(start + pageSize, slides.length);
      const pageSlides = slides.slice(start, end);
      const isMobile = window.innerWidth <= 768;

      let currentGrid = document.getElementById('bentoGrid');

      // Pre-decode target page images to ensure instant rendering without white flashes
      await Promise.all(pageSlides.map((slide) => {
        if (!slide.image_url) return Promise.resolve();
        const img = new Image();
        img.src = slide.image_url;
        return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      }));

      // Immediate swap for prefers-reduced-motion or initial resize
      if (prefersReducedMotion || immediate) {
        if (currentGrid) {
          applyGridModifiers(currentGrid, pageSlides.length, isMobile);
          currentGrid.innerHTML = '';
          pageSlides.forEach((slide, idx) => {
            currentGrid.appendChild(createSingleTile(slide, idx, isMobile, pageSlides.length, false));
          });
        }
        updatePager(totalPages);
        return;
      }

      isTransitioning = true;
      if (bentoPrev) { bentoPrev.disabled = true; bentoPrev.style.pointerEvents = 'none'; }
      if (bentoNext) { bentoNext.disabled = true; bentoNext.style.pointerEvents = 'none'; }

      if (activeTimeline) {
        try { activeTimeline.pause(); } catch (_) {}
        activeTimeline = null;
      }

      // Layered Stacking: construct incoming grid
      const incomingGrid = document.createElement('div');
      applyGridModifiers(incomingGrid, pageSlides.length, isMobile);
      incomingGrid.id = 'bentoGrid';
      incomingGrid.classList.add('is-incoming');

      pageSlides.forEach((slide, idx) => {
        const tile = createSingleTile(slide, idx, isMobile, pageSlides.length, true);
        tile.style.opacity = '0';
        tile.style.transform = 'scale(0.96)';
        tile.style.clipPath = 'inset(0% 50% 0% 50% round 12px)';
        tile.style.willChange = 'transform, opacity, clip-path';
        incomingGrid.appendChild(tile);
      });

      if (currentGrid) {
        currentGrid.removeAttribute('id');
        currentGrid.classList.add('is-outgoing');
        currentGrid.querySelectorAll('.abt-gal-tile, .bento-tile').forEach((tile) => {
          tile.classList.add('is-leaving');
          tile.style.willChange = 'transform, opacity, clip-path';
        });
      }

      bentoViewport.appendChild(incomingGrid);

      const outgoingTiles = currentGrid ? Array.from(currentGrid.children) : [];
      const incomingTiles = Array.from(incomingGrid.children);

      const onComplete = () => {
        if (currentGrid && currentGrid.parentNode) {
          currentGrid.parentNode.removeChild(currentGrid);
        }
        incomingGrid.classList.remove('is-incoming');
        incomingTiles.forEach((tile, idx) => {
          tile.classList.remove('is-entering', 'is-leaving');
          tile.style.removeProperty('opacity');
          tile.style.removeProperty('transform');
          tile.style.removeProperty('clip-path');
          tile.style.removeProperty('will-change');
          tile.style.setProperty('--tile-i', idx);
        });

        isTransitioning = false;
        if (bentoPrev) bentoPrev.style.pointerEvents = '';
        if (bentoNext) bentoNext.style.pointerEvents = '';
        updatePager(totalPages);
        activeTimeline = null;
      };

      if (typeof anime !== 'undefined') {
        const staggerOpts = direction < 0 ? { from: 'last' } : undefined;
        const timeline = anime.timeline({
          easing: 'easeInOutQuad',
          complete: onComplete
        });
        activeTimeline = timeline;

        if (outgoingTiles.length) {
          timeline.add({
            targets: outgoingTiles,
            opacity: [1, 0],
            scale: [1, 0.96],
            clipPath: ['inset(0% 0% 0% 0% round 12px)', 'inset(0% 50% 0% 50% round 12px)'],
            duration: 360,
            easing: 'easeInOutQuad',
            delay: anime.stagger(45, staggerOpts)
          });
        }

        timeline.add({
          targets: incomingTiles,
          opacity: [0, 1],
          scale: [0.96, 1],
          clipPath: ['inset(0% 50% 0% 50% round 12px)', 'inset(0% 0% 0% 0% round 12px)'],
          duration: 460,
          easing: 'easeOutCubic',
          delay: anime.stagger(50, staggerOpts)
        }, outgoingTiles.length ? '-=220' : 0);
      } else {
        setTimeout(onComplete, 450);
      }
    }

    if (bentoPrev) {
      bentoPrev.addEventListener('click', () => {
        if (!isTransitioning && currentPage > 0) {
          if (typeof anime !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            anime({
              targets: bentoPrev,
              scale: [0.92, 1],
              duration: 300,
              easing: 'easeOutElastic(1, .8)'
            });
          }
          transitionToPage(currentPage - 1);
        }
      });
    }

    if (bentoNext) {
      bentoNext.addEventListener('click', () => {
        const pageSize = getPageSize();
        const totalPages = Math.ceil(slides.length / pageSize);
        if (!isTransitioning && currentPage < totalPages - 1) {
          if (typeof anime !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            anime({
              targets: bentoNext,
              scale: [0.92, 1],
              duration: 300,
              easing: 'easeOutElastic(1, .8)'
            });
          }
          transitionToPage(currentPage + 1);
        }
      });
    }

    bentoGallery.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') && (e.target.classList.contains('bento-tile') || e.target.classList.contains('abt-gal-tile'))) {
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isTransitioning && currentPage > 0) {
          transitionToPage(currentPage - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const pageSize = getPageSize();
        const totalPages = Math.ceil(slides.length / pageSize);
        if (!isTransitioning && currentPage < totalPages - 1) {
          transitionToPage(currentPage + 1);
        }
      }
    });

    // Horizontal touch swipe gesture with 50px threshold (Keputusan Terkunci Opsi 4A)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isTrackingTouch = false;

    bentoGallery.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || isTransitioning) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
      isTrackingTouch = true;
    }, { passive: true });

    bentoGallery.addEventListener('touchmove', (e) => {
      if (!isTrackingTouch || e.touches.length !== 1) return;
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    }, { passive: true });

    bentoGallery.addEventListener('touchend', () => {
      if (!isTrackingTouch) return;
      isTrackingTouch = false;
      if (isTransitioning) return;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX >= 50 && absDeltaX > absDeltaY) {
        const pageSize = getPageSize();
        const totalPages = Math.ceil(slides.length / pageSize);
        if (deltaX < 0) {
          if (currentPage < totalPages - 1) {
            transitionToPage(currentPage + 1);
          }
        } else {
          if (currentPage > 0) {
            transitionToPage(currentPage - 1);
          }
        }
      }
    });

    bentoGallery.addEventListener('touchcancel', () => {
      isTrackingTouch = false;
    });

    let resizeTimer = null;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const currentWidth = window.innerWidth;
        const crossedBreakpoint =
          (lastWidth <= 768 && currentWidth > 768) ||
          (lastWidth > 768 && currentWidth <= 768);
        lastWidth = currentWidth;
        if (crossedBreakpoint) {
          transitionToPage(0, true);
        }
      }, 150);
    });

    const initialPageSize = getPageSize();
    const initialTotalPages = Math.ceil(slides.length / initialPageSize);
    if (window.innerWidth <= 768) {
      transitionToPage(0, true);
    } else {
      updatePager(initialTotalPages);
    }

    // Opening sequence when gallery enters viewport
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const openGalleryObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tiles = bentoGallery.querySelectorAll('.abt-gal-tile, .bento-tile');
            tiles.forEach((tile, idx) => {
              tile.style.setProperty('--tile-i', idx);
              tile.classList.add('is-opening');
            });
            setTimeout(() => {
              bentoGallery.querySelectorAll('.abt-gal-tile.is-opening, .bento-tile.is-opening').forEach((t) => {
                t.classList.remove('is-opening');
              });
            }, (tiles.length - 1) * 65 + 600);
            openGalleryObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      openGalleryObserver.observe(bentoGallery);
    }
  })();

  // Count-up animation for about page history stats (T-126)
  (() => {
    const statElements = document.querySelectorAll('.story-stat-num');
    if (!statElements.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      return;
    }

    function animateCountUp(el) {
      const originalText = el.textContent.trim();
      const match = originalText.match(/^(\d+)(.*)$/);
      if (!match) return;

      const targetNum = parseInt(match[1], 10);
      const suffix = match[2] || '';
      const duration = 1500;
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(targetNum * easeOut);

        el.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = targetNum + suffix;
        }
      }

      el.textContent = '0' + suffix;
      requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          animateCountUp(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statElements.forEach((el) => observer.observe(el));
  })();
});

