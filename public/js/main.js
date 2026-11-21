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

  function updateHeaderOffset() {
    if (!headerWrap) return;
    const topBarWrap = headerWrap.querySelector('.top-bar-wrap');
    const siteHeader = headerWrap.querySelector('.site-header');
    const topBarH = topBarWrap ? (topBarWrap.offsetHeight || 28) : (window.innerWidth <= 768 ? 24 : 28);
    const siteH = siteHeader ? siteHeader.offsetHeight : 64;
    headerWrap.style.setProperty('--topbar-h', `${topBarH}px`);
    const totalH = headerWrap.classList.contains('is-scrolled') ? siteH : topBarH + siteH;
    if (totalH > 0) {
      document.documentElement.style.setProperty('--header-actual-height', `${totalH}px`);
    }
  }
  updateHeaderOffset();
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateHeaderOffset, 100);
  }, { passive: true });
  window.addEventListener('load', updateHeaderOffset, { passive: true, once: true });

  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('navMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  let isMenuAnimating = false;
  let activeMenuTimeline = null;

  function getAnimeLib() {
    return typeof anime !== 'undefined' ? anime : (typeof window !== 'undefined' ? window.anime : null);
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function clearMenuInlineStyles() {
    if (menu) {
      menu.style.clipPath = '';
      menu.style.opacity = '';
      menu.style.transform = '';
      menu.classList.remove('hdr-wipe-animating');
      menu.querySelectorAll('li').forEach((li) => {
        li.style.opacity = '';
        li.style.transform = '';
      });
    }
    if (menuBackdrop) {
      menuBackdrop.style.opacity = '';
      menuBackdrop.classList.remove('hdr-wipe-animating');
    }
  }

  function cancelMenuAnimations(animeLib) {
    if (activeMenuTimeline) {
      activeMenuTimeline.pause();
      activeMenuTimeline = null;
    }
    if (!animeLib) return;
    const targets = [menu, menuBackdrop].filter(Boolean);
    if (menu) targets.push(...menu.querySelectorAll('li'));
    if (targets.length > 0) animeLib.remove(targets);
  }

  function setMenuToggleLocked(locked) {
    isMenuAnimating = locked;
    if (toggle) toggle.setAttribute('aria-busy', locked ? 'true' : 'false');
  }

  function prepareOpenMenuStyles(navItems) {
    menu.classList.add('hdr-wipe-animating');
    menu.style.clipPath = 'circle(0% at 100% 0%)';
    menu.style.opacity = '0';
    menu.style.transform = 'translate3d(0, -6px, 0)';
    if (menuBackdrop) {
      menuBackdrop.classList.add('hdr-wipe-animating');
      menuBackdrop.style.opacity = '0';
    }
    navItems.forEach((li) => {
      li.style.opacity = '0';
      li.style.transform = 'translate3d(0, -4px, 0)';
    });
  }

  function buildOpenMenuTimeline(animeLib, navItems) {
    const tl = animeLib.timeline({
      complete: () => {
        activeMenuTimeline = null;
        clearMenuInlineStyles();
        setMenuToggleLocked(false);
      }
    });
    if (menuBackdrop) {
      tl.add({ targets: menuBackdrop, opacity: [0, 1], duration: 240, easing: 'easeOutQuad' }, 0);
    }
    tl.add({
      targets: menu,
      clipPath: ['circle(0% at 100% 0%)', 'circle(150% at 100% 0%)'],
      opacity: [0, 1],
      translateY: [-6, 0],
      duration: 360,
      easing: 'cubicBezier(0.22, 1, 0.36, 1)'
    }, 0);
    if (navItems.length > 0) {
      tl.add({
        targets: navItems,
        opacity: [0, 1],
        translateY: [-4, 0],
        duration: 200,
        delay: animeLib.stagger(20),
        easing: 'easeOutQuad'
      }, 60);
    }
    return tl;
  }

  function openMobileMenu() {
    if (!menu || !toggle || isMenuAnimating || menu.classList.contains('open')) return;
    const animeLib = getAnimeLib();
    const useMotion = Boolean(animeLib && !prefersReducedMotion());
    const navItems = Array.from(menu.querySelectorAll('li'));

    cancelMenuAnimations(animeLib);
    if (useMotion) {
      setMenuToggleLocked(true);
      prepareOpenMenuStyles(navItems);
    }

    menu.classList.add('open');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    if (headerWrap) headerWrap.classList.add('menu-open');
    if (menuBackdrop) menuBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (!useMotion) {
      clearMenuInlineStyles();
      setMenuToggleLocked(false);
      return;
    }
    activeMenuTimeline = buildOpenMenuTimeline(animeLib, navItems);
  }

  function closeMobileMenu(onComplete) {
    if (!menu || !toggle || !menu.classList.contains('open')) return;
    const animeLib = getAnimeLib();
    const useMotion = Boolean(animeLib && !prefersReducedMotion());

    cancelMenuAnimations(animeLib);
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');

    function finalizeClose() {
      activeMenuTimeline = null;
      menu.classList.remove('open');
      if (headerWrap) headerWrap.classList.remove('menu-open');
      if (menuBackdrop) menuBackdrop.classList.remove('open');
      clearMenuInlineStyles();
      document.body.style.overflow = '';
      setMenuToggleLocked(false);
      if (typeof onComplete === 'function') onComplete();
    }

    if (!useMotion) {
      finalizeClose();
      return;
    }

    setMenuToggleLocked(true);
    menu.classList.add('hdr-wipe-animating');
    if (menuBackdrop) menuBackdrop.classList.add('hdr-wipe-animating');

    const tl = animeLib.timeline({ complete: finalizeClose });
    tl.add({
      targets: menu,
      clipPath: ['circle(150% at 100% 0%)', 'circle(0% at 100% 0%)'],
      opacity: [1, 0],
      translateY: [0, -6],
      duration: 240,
      easing: 'cubicBezier(0.4, 0, 1, 1)'
    }, 0);
    if (menuBackdrop) {
      tl.add({ targets: menuBackdrop, opacity: [1, 0], duration: 200, easing: 'easeInQuad' }, 0);
    }
    activeMenuTimeline = tl;
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

