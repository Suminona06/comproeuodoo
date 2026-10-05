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
});
