const QUADRANT_VECTORS = {
  1: { x: 2.5, y: 2.5 },
  2: { x: -2.5, y: 2.5 },
  3: { x: 2.5, y: -2.5 },
  4: { x: -2.5, y: -2.5 }
};

function isReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function canHover() {
  return Boolean(window.matchMedia && window.matchMedia('(hover: hover)').matches);
}

function parseStatValue(rawText) {
  const raw = String(rawText || '').trim();
  const match = raw.match(/^([^\d]*)(\d[\d.,]*)(.*)$/);
  if (!match) return null;

  const numPart = match[2];
  const isGrouped = /^\d{1,3}([.,]\d{3})+$/.test(numPart);
  const sep = isGrouped ? (numPart.includes('.') ? '.' : ',') : '';
  const cleanDigits = isGrouped ? numPart.replace(/[.,]/g, '') : numPart.replace(/,/g, '');
  const target = parseInt(cleanDigits, 10);
  if (Number.isNaN(target)) return null;

  return { prefix: match[1] || '', target, sep, suffix: match[3] || '', raw };
}

function formatStatNumber(val, parsed) {
  const rounded = String(Math.round(val));
  const formatted = parsed.sep ? rounded.replace(/\B(?=(\d{3})+(?!\d))/g, parsed.sep) : rounded;
  return `${parsed.prefix}${formatted}${parsed.suffix}`;
}

function runCountUp(el) {
  const raw = el.getAttribute('data-stat-value') || el.textContent;
  const parsed = parseStatValue(raw);
  if (!parsed || typeof anime !== 'function') {
    el.textContent = String(raw || '').trim();
    return;
  }

  const state = { val: 0 };
  el.textContent = formatStatNumber(0, parsed);
  anime({
    targets: state,
    val: parsed.target,
    round: 1,
    duration: 1400,
    easing: 'easeOutExpo',
    update() {
      el.textContent = formatStatNumber(state.val, parsed);
    },
    complete() {
      el.textContent = parsed.raw;
    }
  });
}

function handleStatEntries(entries, observer) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    runCountUp(entry.target);
  });
}

function initCounterStats() {
  const statEls = document.querySelectorAll('.abt-cnt-num');
  if (!statEls.length) return;

  if (isReducedMotion() || !('IntersectionObserver' in window)) {
    statEls.forEach((el) => {
      el.textContent = String(el.getAttribute('data-stat-value') || el.textContent || '').trim();
    });
    return;
  }

  const observer = new IntersectionObserver(handleStatEntries, { threshold: 0.25 });
  statEls.forEach((el) => observer.observe(el));
}

function animateBadgeArrow(badge, arrow, x, y, isHovered) {
  badge.classList.toggle('is-hovered', isHovered);
  if (!arrow || typeof anime !== 'function' || isReducedMotion()) return;
  anime.remove(arrow);
  anime({
    targets: arrow,
    translateX: x,
    translateY: y,
    duration: 260,
    easing: 'easeOutCubic'
  });
}

function bindCardHover(stage, card) {
  const quad = card.getAttribute('data-quadrant');
  const vec = QUADRANT_VECTORS[quad];
  const badge = stage.querySelector(`.abt-cnt-badge[data-badge-quadrant="${quad}"]`);
  if (!vec || !badge) return;

  const arrow = badge.querySelector('.abt-cnt-badge-arrow');
  card.addEventListener('mouseenter', () => animateBadgeArrow(badge, arrow, vec.x, vec.y, true));
  card.addEventListener('mouseleave', () => animateBadgeArrow(badge, arrow, 0, 0, false));
}

function initBadgeHover() {
  if (!canHover() || isReducedMotion()) return;
  const stage = document.querySelector('.abt-cnt-stage');
  if (!stage) return;

  const cards = stage.querySelectorAll('.abt-cnt-card[data-quadrant]');
  cards.forEach((card) => bindCardHover(stage, card));
}

function getVisibleColumns() {
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 768) return 2;
  return 1;
}

function setBtnDisabled(btn, isDisabled) {
  if (!btn) return;
  btn.disabled = isDisabled;
  btn.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
}

function animateLineSegment(lineEl, shouldFill) {
  if (!lineEl) return;
  const wasFilled = lineEl.classList.contains('is-filled');
  lineEl.classList.toggle('is-filled', shouldFill);
  const fillEl = lineEl.querySelector('.abt-htl-line-fill');
  if (!fillEl || wasFilled === shouldFill || typeof anime !== 'function' || isReducedMotion()) return;

  anime.remove(fillEl);
  anime({
    targets: fillEl,
    scaleX: shouldFill ? [0, 1] : [1, 0],
    duration: 320,
    easing: 'easeOutCubic'
  });
}

function syncTimelineVisuals(ctx) {
  const cols = getVisibleColumns();
  const maxIdx = Math.max(0, ctx.items.length - cols);
  ctx.currentIndex = Math.max(0, Math.min(ctx.currentIndex, maxIdx));

  ctx.items.forEach((item, idx) => {
    item.classList.toggle('is-active', idx === ctx.currentIndex);
    const lineEl = item.querySelector('.abt-htl-line');
    animateLineSegment(lineEl, idx < ctx.currentIndex);
  });

  if (ctx.nav) {
    ctx.nav.hidden = ctx.items.length <= cols;
  }
  setBtnDisabled(ctx.prevBtn, ctx.currentIndex <= 0);
  setBtnDisabled(ctx.nextBtn, ctx.currentIndex >= maxIdx);

  if (ctx.liveEl) {
    ctx.liveEl.textContent = `${ctx.labelPrefix}: ${ctx.currentIndex + 1} / ${ctx.items.length}`;
  }
}

function scrollToTimelineIndex(ctx, nextIdx) {
  const cols = getVisibleColumns();
  const maxIdx = Math.max(0, ctx.items.length - cols);
  const clamped = Math.max(0, Math.min(nextIdx, maxIdx));
  ctx.currentIndex = clamped;

  const targetItem = ctx.items[clamped];
  const targetLeft = targetItem ? targetItem.offsetLeft : 0;
  ctx.isProgrammatic = true;
  ctx.viewport.scrollTo({
    left: targetLeft,
    behavior: isReducedMotion() ? 'auto' : 'smooth'
  });
  syncTimelineVisuals(ctx);

  window.clearTimeout(ctx.scrollTimer);
  ctx.scrollTimer = window.setTimeout(() => {
    ctx.isProgrammatic = false;
  }, 380);
}

function onViewportScroll(ctx) {
  if (ctx.isProgrammatic || !ctx.items.length) return;
  const itemWidth = ctx.items[0].offsetWidth || 1;
  const cols = getVisibleColumns();
  const maxIdx = Math.max(0, ctx.items.length - cols);
  const rawIdx = Math.round(ctx.viewport.scrollLeft / itemWidth);
  const nextIdx = Math.max(0, Math.min(rawIdx, maxIdx));
  if (nextIdx === ctx.currentIndex) return;

  ctx.currentIndex = nextIdx;
  syncTimelineVisuals(ctx);
}

function onTimelineKeydown(ctx, evt) {
  if (evt.key === 'ArrowRight') {
    evt.preventDefault();
    scrollToTimelineIndex(ctx, ctx.currentIndex + 1);
  } else if (evt.key === 'ArrowLeft') {
    evt.preventDefault();
    scrollToTimelineIndex(ctx, ctx.currentIndex - 1);
  }
}

function initHorizontalTimeline() {
  const block = document.querySelector('.abt-htl-block');
  if (!block) return;

  const viewport = block.querySelector('.abt-htl-viewport');
  const items = Array.from(block.querySelectorAll('.abt-htl-item'));
  if (!viewport || !items.length) return;

  const liveEl = block.querySelector('.abt-htl-live');
  const ctx = {
    block,
    viewport,
    items,
    nav: block.querySelector('.abt-htl-nav'),
    prevBtn: block.querySelector('.abt-htl-btn--prev'),
    nextBtn: block.querySelector('.abt-htl-btn--next'),
    liveEl,
    labelPrefix: (liveEl && liveEl.getAttribute('data-label-prefix')) || 'Milestone',
    currentIndex: 0,
    isProgrammatic: false,
    scrollTimer: null
  };

  if (ctx.prevBtn) {
    ctx.prevBtn.addEventListener('click', () => scrollToTimelineIndex(ctx, ctx.currentIndex - 1));
  }
  if (ctx.nextBtn) {
    ctx.nextBtn.addEventListener('click', () => scrollToTimelineIndex(ctx, ctx.currentIndex + 1));
  }
  viewport.addEventListener('scroll', () => onViewportScroll(ctx), { passive: true });
  block.addEventListener('keydown', (evt) => onTimelineKeydown(ctx, evt));
  window.addEventListener('resize', () => syncTimelineVisuals(ctx));

  syncTimelineVisuals(ctx);
}

function initAboutStory() {
  initCounterStats();
  initBadgeHover();
  initHorizontalTimeline();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAboutStory);
} else {
  initAboutStory();
}
