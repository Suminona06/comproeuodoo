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

  // Bento mosaic gallery page transitions and controls (T-122, T-123)
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

    const bentoPager = document.getElementById('bentoPager');
    const bentoCur = document.getElementById('bentoCur');
    const bentoTotal = document.getElementById('bentoTotal');
    const bentoPrev = document.getElementById('bentoPrev');
    const bentoNext = document.getElementById('bentoNext');

    let currentPage = 0;
    let isTransitioning = false;
    let transitionTimer = null;

    const getPageSize = () => (window.innerWidth <= 768 ? 4 : 6);
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
      if (bentoCur) bentoCur.textContent = pad2(currentPage + 1);
      if (bentoTotal) bentoTotal.textContent = pad2(totalPages);
      if (bentoPrev) bentoPrev.disabled = currentPage === 0;
      if (bentoNext) bentoNext.disabled = currentPage >= totalPages - 1;
      if (bentoPager) {
        bentoPager.style.display = totalPages <= 1 ? 'none' : 'flex';
      }
    }

    function createSingleTile(slide, idx, isMobile, totalTiles = 6, entering = false) {
      const tile = document.createElement('div');
      let posClass = 'bento-tile--pos-' + (idx + 1);
      if (!isMobile && totalTiles === 6) {
        if (idx === 0) posClass += ' bento-tile--tall';
        else if (idx === 1 || idx === 4) posClass += ' bento-tile--wide';
      }
      tile.className = 'bento-tile ' + posClass + (entering ? ' is-entering' : '');
      tile.tabIndex = 0;
      tile.style.setProperty('--tile-i', idx);

      const catHtml = slide.category
        ? `<span class="bento-cat">${escapeHtml(slide.category)}</span>`
        : '';
      const titleHtml = slide.title
        ? `<div class="bento-title">${escapeHtml(slide.title)}</div>`
        : '';

      tile.innerHTML = `
        <img src="${escapeHtml(slide.image_url)}" alt="${escapeHtml(slide.title || 'Euodoo Gallery')}" ${idx > 0 ? 'loading="lazy"' : ''}>
        <div class="bento-cap">
          ${catHtml}
          ${titleHtml}
        </div>
      `;
      return tile;
    }

    function createTilesFragment(pageSlides, isMobile, entering = false) {
      const fragment = document.createDocumentFragment();
      pageSlides.forEach((slide, idx) => {
        fragment.appendChild(createSingleTile(slide, idx, isMobile, pageSlides.length, entering));
      });
      return fragment;
    }

    function applyGridModifiers(pageSlideCount, isMobile) {
      bentoGrid.className = 'bento-grid';
      if (!isMobile) {
        if (pageSlideCount === 5) bentoGrid.classList.add('bento-grid--5');
        else if (pageSlideCount === 4) bentoGrid.classList.add('bento-grid--4');
        else if (pageSlideCount === 3) bentoGrid.classList.add('bento-grid--3');
        else if (pageSlideCount === 2) bentoGrid.classList.add('bento-grid--2');
        else if (pageSlideCount === 1) bentoGrid.classList.add('bento-grid--1');
      } else {
        if (pageSlideCount === 1) bentoGrid.classList.add('bento-grid--1');
      }
    }

    function transitionToPage(targetPage, immediate = false) {
      const pageSize = getPageSize();
      const totalPages = Math.ceil(slides.length / pageSize);
      const boundedTarget = Math.max(0, Math.min(targetPage, totalPages - 1));

      if (isTransitioning || (boundedTarget === currentPage && !immediate)) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      currentPage = boundedTarget;

      const start = currentPage * pageSize;
      const end = Math.min(start + pageSize, slides.length);
      const pageSlides = slides.slice(start, end);
      const isMobile = window.innerWidth <= 768;

      if (prefersReducedMotion || immediate) {
        applyGridModifiers(pageSlides.length, isMobile);
        const fragment = createTilesFragment(pageSlides, isMobile, false);
        bentoGrid.innerHTML = '';
        bentoGrid.appendChild(fragment);
        updatePager(totalPages);
        return;
      }

      isTransitioning = true;
      updatePager(totalPages);

      const currentTiles = Array.from(bentoGrid.querySelectorAll('.bento-tile'));
      const staggerDelay = 45;
      const closeDuration = 220;
      const openDuration = 340;

      // Preload next/target page images to ensure instant rendering at swap apex
      pageSlides.forEach((slide) => {
        if (slide.image_url) {
          const img = new Image();
          img.src = slide.image_url;
        }
      });

      // Synchronized continuous shutter wave
      currentTiles.forEach((tile, idx) => {
        tile.style.setProperty('--tile-i', idx);
        tile.classList.remove('is-entering', 'is-opening');
        tile.classList.add('is-leaving');

        const swapTime = idx * staggerDelay + closeDuration;
        setTimeout(() => {
          if (idx < pageSlides.length) {
            const slide = pageSlides[idx];
            const img = tile.querySelector('img');
            if (img) {
              img.src = slide.image_url;
              img.alt = slide.title || 'Euodoo Gallery';
            }
            let cat = tile.querySelector('.bento-cat');
            if (slide.category) {
              if (!cat) {
                cat = document.createElement('span');
                cat.className = 'bento-cat';
                const cap = tile.querySelector('.bento-cap');
                if (cap) cap.prepend(cat);
              }
              cat.textContent = slide.category;
              cat.style.display = '';
            } else if (cat) {
              cat.style.display = 'none';
            }

            let title = tile.querySelector('.bento-title');
            if (slide.title) {
              if (!title) {
                title = document.createElement('div');
                title.className = 'bento-title';
                const cap = tile.querySelector('.bento-cap');
                if (cap) cap.appendChild(title);
              }
              title.textContent = slide.title;
              title.style.display = '';
            } else if (title) {
              title.style.display = 'none';
            }

            let targetPosClass = 'bento-tile--pos-' + (idx + 1);
            if (!isMobile && pageSlides.length === 6) {
              if (idx === 0) targetPosClass += ' bento-tile--tall';
              else if (idx === 1 || idx === 4) targetPosClass += ' bento-tile--wide';
            }
            tile.className = 'bento-tile ' + targetPosClass + ' is-entering';
          } else {
            tile.remove();
          }
        }, swapTime);
      });

      // Handle extra tiles if page expands (e.g. 4 to 6)
      if (pageSlides.length > currentTiles.length) {
        const extraSlides = pageSlides.slice(currentTiles.length);
        const appendTime = currentTiles.length * staggerDelay + closeDuration;
        setTimeout(() => {
          applyGridModifiers(pageSlides.length, isMobile);
          extraSlides.forEach((slide, extraIdx) => {
            const actualIdx = currentTiles.length + extraIdx;
            const newTile = createSingleTile(slide, actualIdx, isMobile, pageSlides.length, true);
            bentoGrid.appendChild(newTile);
          });
        }, appendTime);
      } else {
        setTimeout(() => {
          applyGridModifiers(pageSlides.length, isMobile);
        }, closeDuration);
      }

      const totalTransitionTime =
        (Math.max(currentTiles.length, pageSlides.length) - 1) * staggerDelay +
        closeDuration +
        openDuration +
        60;

      clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        bentoGrid.querySelectorAll('.bento-tile').forEach((t) => {
          t.classList.remove('is-leaving', 'is-entering', 'is-opening');
        });
        isTransitioning = false;
      }, totalTransitionTime);
    }

    if (bentoPrev) {
      bentoPrev.addEventListener('click', () => {
        if (!isTransitioning && currentPage > 0) {
          transitionToPage(currentPage - 1);
        }
      });
    }

    if (bentoNext) {
      bentoNext.addEventListener('click', () => {
        const pageSize = getPageSize();
        const totalPages = Math.ceil(slides.length / pageSize);
        if (!isTransitioning && currentPage < totalPages - 1) {
          transitionToPage(currentPage + 1);
        }
      });
    }

    bentoGallery.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') && e.target.classList.contains('bento-tile')) {
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

    // Opening sequence when gallery enters viewport (Membuka Gallery)
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const openGalleryObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tiles = bentoGrid.querySelectorAll('.bento-tile');
            tiles.forEach((tile, idx) => {
              tile.style.setProperty('--tile-i', idx);
              tile.classList.add('is-opening');
            });
            setTimeout(() => {
              bentoGrid.querySelectorAll('.bento-tile.is-opening').forEach((t) => {
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

