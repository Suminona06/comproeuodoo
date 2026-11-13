(function () {
  'use strict';

  let activeTween = null;

  function isReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function isMobileLayout() {
    return Boolean(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  }

  function getActiveFlexGrow() {
    return isMobileLayout() ? 4.5 : 3;
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

  function stopRunningAnimations(animeLib, panels, contents) {
    if (activeTween && typeof activeTween.pause === 'function') {
      activeTween.pause();
      activeTween = null;
    }
    animeLib.remove(panels);
    animeLib.remove(contents);
    clearInlineStyles(panels, contents);
  }

  function runSingleTimeline(animeLib, prevPanel, nextPanel, nextContent, targetGrow, mobile) {
    const proxy = { t: 0 };
    if (prevPanel && prevPanel !== nextPanel) {
      prevPanel.style.flexGrow = String(targetGrow);
    }
    nextPanel.style.flexGrow = '1';
    if (nextContent) {
      nextContent.style.opacity = '0';
      nextContent.style.transform = 'translate3d(0, 12px, 0)';
    }

    activeTween = animeLib({
      targets: proxy,
      t: 1,
      duration: mobile ? 400 : 600,
      easing: 'cubicBezier(0.22, 1, 0.36, 1)',
      update() {
        const p = proxy.t;
        const delta = (targetGrow - 1) * p;
        if (prevPanel && prevPanel !== nextPanel) {
          prevPanel.style.flexGrow = (targetGrow - delta).toFixed(4);
        }
        nextPanel.style.flexGrow = (1 + delta).toFixed(4);
        if (nextContent) {
          const cp = p < 0.15 ? 0 : (p - 0.15) / 0.85;
          nextContent.style.opacity = cp.toFixed(3);
          nextContent.style.transform = `translate3d(0, ${((1 - cp) * 12).toFixed(2)}px, 0)`;
        }
      },
      complete() {
        if (prevPanel) prevPanel.style.flexGrow = '';
        nextPanel.style.flexGrow = '';
        if (nextContent) {
          nextContent.style.opacity = '';
          nextContent.style.transform = '';
        }
        activeTween = null;
      }
    });
  }

  function runPanelAnimation(prevPanel, nextPanel, nextContent, panels, contents) {
    const animeLib = window.anime;
    if (!animeLib || isReducedMotion()) {
      clearInlineStyles(panels, contents);
      return;
    }

    stopRunningAnimations(animeLib, panels, contents);
    runSingleTimeline(animeLib, prevPanel, nextPanel, nextContent, getActiveFlexGrow(), isMobileLayout());
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
      panel.addEventListener('click', () => activate(idx));
      panel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(idx);
          return;
        }
        const nextIdx = resolveKeyTargetIndex(e.key, idx, panels.length);
        if (nextIdx !== -1) {
          e.preventDefault();
          activate(nextIdx);
          panels[nextIdx].focus();
        }
      });
    });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => activate(idx));
      dot.addEventListener('keydown', (e) => {
        const nextIdx = resolveKeyTargetIndex(e.key, idx, dots.length);
        if (nextIdx !== -1) {
          e.preventDefault();
          activate(nextIdx);
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
