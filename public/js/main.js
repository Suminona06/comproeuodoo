/**
 * PT Euodoo - Public Client Script v2.0
 * Acuan: prototype-homepage-v2.html & DESIGN.md
 */

document.addEventListener('DOMContentLoaded', () => {
  const headerWrap = document.getElementById('headerWrap');
  let lastScrolled = null;
  let scrollRafId = 0;

  function applyScrollState() {
    scrollRafId = 0;
    if (!headerWrap) return;
    const nextScrolled = window.scrollY > 30;
    if (nextScrolled === lastScrolled) return;
    lastScrolled = nextScrolled;
    headerWrap.classList.toggle('is-scrolled', nextScrolled);
  }

  function onScroll() {
    if (scrollRafId) return;
    scrollRafId = window.requestAnimationFrame(applyScrollState);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  applyScrollState();

  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('navMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const MENU_MOTION_CLASSES = ['hdr-wipe-opening', 'hdr-wipe-closing', 'hdr-wipe-animating'];
  let isMenuOpen = false;
  let activeMenuTl = null;

  function getGsapLib() {
    return typeof gsap !== 'undefined' ? gsap : (typeof window !== 'undefined' ? window.gsap : null);
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function getMenuMotionTargets() {
    return [headerWrap, menu, menuBackdrop].filter(Boolean);
  }

  function getMenuItems() {
    return menu ? Array.from(menu.querySelectorAll(':scope > li')) : [];
  }

  function clearMenuPhaseClasses() {
    getMenuMotionTargets().forEach((el) => {
      el.classList.remove(...MENU_MOTION_CLASSES);
    });
  }

  function addMenuPhaseClasses(phaseClass) {
    getMenuMotionTargets().forEach((el) => {
      el.classList.add(phaseClass, 'hdr-wipe-animating');
    });
  }

  function clearMenuInlineStyles() {
    const gsapLib = getGsapLib();
    const targets = [menu, menuBackdrop, ...getMenuItems()].filter(Boolean);
    if (gsapLib && targets.length > 0) {
      gsapLib.set(targets, { clearProps: 'all' });
      return;
    }
    targets.forEach((el) => el.removeAttribute('style'));
  }

  function cancelActiveMenuAnimation() {
    if (activeMenuTl) {
      activeMenuTl.kill();
      activeMenuTl = null;
    }
  }

  function lockBodyScroll() {
    document.body.classList.add('menu-scroll-locked');
  }

  function unlockBodyScroll() {
    document.body.classList.remove('menu-scroll-locked');
  }

  function buildOpenMenuTl(gsapLib, navItems) {
    const tl = gsapLib.timeline({
      onComplete: () => {
        activeMenuTl = null;
        clearMenuInlineStyles();
        clearMenuPhaseClasses();
      }
    });
    if (menuBackdrop) {
      tl.fromTo(menuBackdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.26, ease: 'power2.out' }, 0);
    }
    tl.fromTo(
      menu,
      { autoAlpha: 0, y: -28, scale: 0.94, transformOrigin: '100% 0%' },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: 'power3.out', force3D: true },
      0
    );
    if (navItems.length > 0) {
      tl.fromTo(
        navItems,
        { autoAlpha: 0, y: -12 },
        { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.032, ease: 'power2.out', force3D: true },
        0.05
      );
    }
    return tl;
  }

  function buildCloseMenuTl(gsapLib, navItems, finalizeClose) {
    const tl = gsapLib.timeline({ onComplete: finalizeClose });
    if (navItems.length > 0) {
      tl.to(
        navItems,
        { autoAlpha: 0, y: -10, duration: 0.14, stagger: { each: 0.015, from: 'end' }, ease: 'power2.in', force3D: true },
        0
      );
    }
    tl.to(
      menu,
      { autoAlpha: 0, y: -24, scale: 0.94, transformOrigin: '100% 0%', duration: 0.26, ease: 'power2.in', force3D: true },
      0
    );
    if (menuBackdrop) {
      tl.to(menuBackdrop, { autoAlpha: 0, duration: 0.26, ease: 'power2.in' }, 0);
    }
    return tl;
  }

  function openMobileMenu() {
    if (!menu || !toggle || isMenuOpen) return;
    isMenuOpen = true;
    const gsapLib = getGsapLib();
    const useGsap = Boolean(gsapLib && !prefersReducedMotion() && window.innerWidth <= 1024);

    cancelActiveMenuAnimation();
    clearMenuPhaseClasses();

    menu.classList.add('open');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    if (headerWrap) headerWrap.classList.add('menu-open');
    if (menuBackdrop) menuBackdrop.classList.add('open');

    if (!useGsap) {
      clearMenuInlineStyles();
      lockBodyScroll();
      return;
    }

    addMenuPhaseClasses('hdr-wipe-opening');
    activeMenuTl = buildOpenMenuTl(gsapLib, getMenuItems());
    lockBodyScroll();
  }

  function closeMobileMenu(onComplete) {
    if (!menu || !toggle || !isMenuOpen) return;
    isMenuOpen = false;
    const gsapLib = getGsapLib();
    const useGsap = Boolean(gsapLib && !prefersReducedMotion() && window.innerWidth <= 1024);

    cancelActiveMenuAnimation();
    clearMenuPhaseClasses();

    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    if (headerWrap) headerWrap.classList.remove('menu-open');

    const finalizeClose = () => {
      activeMenuTl = null;
      menu.classList.remove('open');
      if (menuBackdrop) menuBackdrop.classList.remove('open');
      clearMenuInlineStyles();
      clearMenuPhaseClasses();
      unlockBodyScroll();
      if (typeof onComplete === 'function') onComplete();
    };

    if (!useGsap) {
      finalizeClose();
      return;
    }

    addMenuPhaseClasses('hdr-wipe-closing');
    activeMenuTl = buildCloseMenuTl(gsapLib, getMenuItems(), finalizeClose);
  }

  if (toggle && menu) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isMenuOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (isMenuOpen && headerWrap && !headerWrap.contains(e.target)) {
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
    if (e.key === 'Escape' && isMenuOpen) {
      closeMobileMenu(() => {
        if (toggle) toggle.focus();
      });
    }
  });

  // Automatically close drawer when resized to desktop (>1024px)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && isMenuOpen) {
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
        bentoPager.hidden = totalPages <= 1;
        bentoPager.style.display = totalPages <= 1 ? 'none' : 'flex';
      }
    }

    function createSingleTile(slide, idx, isMobile, totalTiles = 6, entering = false, globalIdx = idx) {
      const tile = document.createElement('div');
      let posClass = 'abt-gal-tile--pos-' + (idx + 1) + ' bento-tile--pos-' + (idx + 1);
      if (!isMobile && totalTiles === 6) {
        if (idx === 0) posClass = 'abt-gal-tile--pos-1 abt-gal-tile--tall bento-tile--pos-1 bento-tile--tall';
        else if (idx === 1 || idx === 4) posClass = 'abt-gal-tile--pos-' + (idx + 1) + ' abt-gal-tile--wide bento-tile--pos-' + (idx + 1) + ' bento-tile--wide';
      }
      tile.className = 'abt-gal-tile bento-tile ' + posClass + (entering ? ' is-entering' : '');
      tile.setAttribute('role', 'button');
      tile.tabIndex = 0;
      tile.setAttribute('data-slide-index', String(globalIdx));

      const tag = slide.category ? slide.category.trim() : '';
      const titleText = slide.title ? slide.title.trim() : '';
      const photoNum = pad2(globalIdx + 1);
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
            currentGrid.appendChild(createSingleTile(slide, idx, isMobile, pageSlides.length, false, start + idx));
          });
        }
        updatePager(totalPages);
        return;
      }

      isTransitioning = true;
      updatePager(totalPages);
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
        const tile = createSingleTile(slide, idx, isMobile, pageSlides.length, true, start + idx);
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
        incomingTiles.forEach((tile) => {
          tile.classList.remove('is-entering', 'is-leaving');
          tile.style.removeProperty('opacity');
          tile.style.removeProperty('transform');
          tile.style.removeProperty('clip-path');
          tile.style.removeProperty('will-change');
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

    function openBentoSlideLightbox(tileEl) {
      if (!tileEl || isTransitioning) return;
      if (!window.EuodooLightbox || typeof window.EuodooLightbox.open !== 'function') return;

      const rawIndex = parseInt(tileEl.getAttribute('data-slide-index') || '0', 10);
      const globalIndex = Number.isNaN(rawIndex)
        ? 0
        : Math.max(0, Math.min(rawIndex, slides.length - 1));
      const imgEl = tileEl.querySelector('img');

      const lightboxItems = slides.map((s, idx) => ({
        src: s.image_url || s.src || '',
        msrc: s.image_url || s.src || '',
        category: (s.category || '').trim(),
        title: (s.title || '').trim(),
        alt: (s.title || s.category || '').trim(),
        element: idx === globalIndex ? (imgEl || tileEl) : null
      }));

      window.EuodooLightbox.open(lightboxItems, globalIndex, tileEl);
    }

    bentoViewport.addEventListener('click', (e) => {
      const tile = e.target.closest('.abt-gal-tile, .bento-tile');
      if (!tile || !bentoViewport.contains(tile)) return;
      e.preventDefault();
      openBentoSlideLightbox(tile);
    });

    bentoGallery.addEventListener('keydown', (e) => {
      const tile = e.target.closest('.abt-gal-tile, .bento-tile');
      if ((e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') && tile) {
        e.preventDefault();
        openBentoSlideLightbox(tile);
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
            tiles.forEach((tile) => {
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

  document.querySelectorAll('.brand-logo-header').forEach((logoImg) => {
    const showLogoFallback = () => {
      logoImg.classList.add('is-hidden');
    };
    if (logoImg.complete && logoImg.naturalWidth === 0) {
      showLogoFallback();
    } else {
      logoImg.addEventListener('error', showLogoFallback);
    }
  });
});

