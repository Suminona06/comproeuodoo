(function () {
  'use strict';

  function isReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function isMobileLayout() {
    return Boolean(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  }

  function preDecodeImages(root) {
    const imgs = root.querySelectorAll('.abt-tkt-img');
    imgs.forEach((img) => {
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });
  }

  function clearInlineStyles(panels, contents) {
    panels.forEach((panel) => {
      panel.style.flexGrow = '';
    });
    contents.forEach((content) => {
      content.style.opacity = '';
      content.style.transform = '';
    });
  }

  function syncDomState(section, panels, dots, activeIdx) {
    section.dataset.activeIndex = String(activeIdx);
    panels.forEach((panel, idx) => {
      const isActive = idx === activeIdx;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-selected', String(isActive));
      panel.setAttribute('aria-expanded', String(isActive));
      panel.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    dots.forEach((dot, idx) => {
      const isActive = idx === activeIdx;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
      dot.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  function animatePanelFlex(animeLib, panel, fromGrow, toGrow) {
    panel.style.flexGrow = String(fromGrow);
    animeLib({
      targets: panel,
      flexGrow: [fromGrow, toGrow],
      duration: 650,
      easing: 'cubicBezier(0.2, 0.75, 0.2, 1)',
      complete() {
        panel.style.flexGrow = '';
      }
    });
  }

  function runPanelAnimation(prevPanel, nextPanel, nextContent, panels, contents) {
    const animeLib = window.anime;
    if (!animeLib || isReducedMotion()) {
      clearInlineStyles(panels, contents);
      return;
    }

    animeLib.remove(panels);
    animeLib.remove(contents);
    clearInlineStyles(panels, contents);

    if (!isMobileLayout()) {
      if (prevPanel && prevPanel !== nextPanel) {
        animatePanelFlex(animeLib, prevPanel, 3, 1);
      }
      animatePanelFlex(animeLib, nextPanel, 1, 3);
    }

    if (nextContent) {
      animeLib({
        targets: nextContent,
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 420,
        delay: 80,
        easing: 'cubicBezier(0.2, 0.75, 0.2, 1)',
        complete() {
          nextContent.style.opacity = '';
          nextContent.style.transform = '';
        }
      });
    }
  }

  function resolveKeyTargetIndex(key, index, total) {
    if (key === 'ArrowRight' || key === 'ArrowDown') return (index + 1) % total;
    if (key === 'ArrowLeft' || key === 'ArrowUp') return (index + total - 1) % total;
    if (key === 'Home') return 0;
    if (key === 'End') return total - 1;
    return -1;
  }

  function bindNavigationEvents(panels, dots, activate) {
    panels.forEach((panel, idx) => {
      panel.addEventListener('click', () => activate(idx, false));
      panel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(idx, false);
          return;
        }
        const nextIdx = resolveKeyTargetIndex(e.key, idx, panels.length);
        if (nextIdx !== -1) {
          e.preventDefault();
          activate(nextIdx, true);
          panels[nextIdx].focus();
        }
      });
    });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => activate(idx, false));
      dot.addEventListener('keydown', (e) => {
        const nextIdx = resolveKeyTargetIndex(e.key, idx, dots.length);
        if (nextIdx !== -1) {
          e.preventDefault();
          activate(nextIdx, true);
          dots[nextIdx].focus();
        }
      });
    });
  }

  function initTicketAccordion() {
    const section = document.getElementById('core-values');
    if (!section) return;

    const panels = Array.from(section.querySelectorAll('.abt-tkt-panel'));
    const dots = Array.from(section.querySelectorAll('.abt-tkt-dot'));
    const contents = Array.from(section.querySelectorAll('.abt-tkt-content'));
    if (panels.length === 0) return;

    preDecodeImages(section);

    const rawDefault = parseInt(section.dataset.activeIndex || '2', 10);
    let currentIndex = Number.isNaN(rawDefault) ? 2 : Math.min(Math.max(0, rawDefault), panels.length - 1);
    syncDomState(section, panels, dots, currentIndex);

    function activate(targetIndex) {
      if (targetIndex < 0 || targetIndex >= panels.length || targetIndex === currentIndex) {
        return;
      }
      const prevPanel = panels[currentIndex];
      const nextPanel = panels[targetIndex];
      const nextContent = contents[targetIndex];
      currentIndex = targetIndex;

      syncDomState(section, panels, dots, currentIndex);
      runPanelAnimation(prevPanel, nextPanel, nextContent, panels, contents);
    }

    bindNavigationEvents(panels, dots, activate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTicketAccordion);
  } else {
    initTicketAccordion();
  }
})();
