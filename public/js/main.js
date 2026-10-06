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

  // ═══ HERO BANNER SLIDER (Autoplay, Nav, Dots, Touch, Loop) ═══
  (function initHeroSlider() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return; // Single banner doesn't need carousel logic

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
      // Deactivate current slide
      const currentSlide = slides[currentIndex];
      currentSlide.classList.remove('is-active');
      const currentVideo = currentSlide.querySelector('video');
      if (currentVideo) {
        currentVideo.pause();
      }

      // Activate new slide
      currentIndex = (newIndex + totalSlides) % totalSlides;
      const nextSlide = slides[currentIndex];
      nextSlide.classList.add('is-active');
      const nextVideo = nextSlide.querySelector('video');
      if (nextVideo) {
        nextVideo.currentTime = 0;
        nextVideo.play().catch(() => {});
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
});
