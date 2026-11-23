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

  return { prefix: match[1], target, sep, suffix: match[3], raw };
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

function reorderChildrenReversed(parent, selector) {
  if (!parent) return;
  const nodes = Array.from(parent.querySelectorAll(selector));
  if (nodes.length < 2) return;
  const frag = document.createDocumentFragment();
  nodes.reverse().forEach((node) => frag.appendChild(node));
  parent.appendChild(frag);
}

function centerActiveChip(yearNav, pill) {
  if (!yearNav || !pill || window.innerWidth >= 1024) return;
  const targetLeft = pill.offsetLeft - (yearNav.clientWidth - pill.offsetWidth) / 2;
  yearNav.scrollTo({
    left: Math.max(0, targetLeft),
    behavior: isReducedMotion() ? 'auto' : 'smooth'
  });
}

function setActiveYear(ctx, yearKey) {
  if (!yearKey || yearKey === ctx.activeKey) return;
  ctx.activeKey = yearKey;
  ctx.groups.forEach((group) => {
    group.classList.toggle('is-active', group.getAttribute('data-year-key') === yearKey);
  });
  let activePill = null;
  ctx.pills.forEach((pill) => {
    const match = pill.getAttribute('data-year-key') === yearKey;
    pill.classList.toggle('is-active', match);
    pill.setAttribute('aria-current', match ? 'true' : 'false');
    if (match) activePill = pill;
  });
  centerActiveChip(ctx.yearNav, activePill);
}

function measureTimelineGeometry(ctx) {
  if (!ctx.rail || !ctx.groups.length) return;
  const scrollY = window.scrollY;
  const railRect = ctx.rail.getBoundingClientRect();
  ctx.railStartDocY = railRect.top + scrollY;

  const lastDot = ctx.groups[ctx.groups.length - 1].querySelector('.abt-htl-dot');
  if (lastDot) {
    const dotRect = lastDot.getBoundingClientRect();
    const dotCenterY = dotRect.top + dotRect.height / 2 + scrollY;
    ctx.railHeight = Math.max(0, Math.round(dotCenterY - ctx.railStartDocY));
    ctx.rail.style.setProperty('--abt-htl-rail-height', `${ctx.railHeight}px`);
  }

  ctx.groupOffsets = ctx.groups.map((el) => ({
    key: el.getAttribute('data-year-key'),
    top: el.getBoundingClientRect().top + scrollY
  }));
}

function syncTimelineScroll(ctx) {
  ctx.rafId = 0;
  if (!ctx.groupOffsets.length || !ctx.rail) return;

  const anchorDocY = window.scrollY + window.innerHeight * 0.35;
  const rawProgress = ctx.railHeight > 0 ? (anchorDocY - ctx.railStartDocY) / ctx.railHeight : 0;
  const clamped = Math.max(0, Math.min(1, rawProgress));
  ctx.rail.style.setProperty('--abt-htl-progress', clamped.toFixed(4));

  let nextKey = ctx.groupOffsets[0].key;
  for (let i = 0; i < ctx.groupOffsets.length; i += 1) {
    if (ctx.groupOffsets[i].top <= anchorDocY) {
      nextKey = ctx.groupOffsets[i].key;
    }
  }
  setActiveYear(ctx, nextKey);
}

function scheduleTimelineSync(ctx) {
  if (ctx.rafId) return;
  ctx.rafId = window.requestAnimationFrame(() => syncTimelineScroll(ctx));
}

function handlePillClick(ctx, pill) {
  const targetId = pill.getAttribute('data-year-target');
  const yearKey = pill.getAttribute('data-year-key');
  const targetEl = targetId ? document.getElementById(targetId) : null;
  if (!targetEl) return;

  setActiveYear(ctx, yearKey);
  if (ctx.liveEl) {
    ctx.liveEl.textContent = pill.textContent.trim();
  }
  targetEl.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

function handleSortClick(ctx, btn) {
  const nextDir = btn.getAttribute('data-sort-dir');
  if (!nextDir || nextDir === ctx.sortDir) return;

  ctx.sortDir = nextDir;
  ctx.layout.setAttribute('data-sort-dir', nextDir);
  ctx.sortBtns.forEach((b) => {
    const active = b === btn;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  if (!isReducedMotion()) {
    ctx.list.classList.add('is-sorting');
    window.clearTimeout(ctx.sortTimer);
    ctx.sortTimer = window.setTimeout(() => ctx.list.classList.remove('is-sorting'), 180);
  }

  reorderChildrenReversed(ctx.list, ':scope > .abt-htl-group');
  reorderChildrenReversed(ctx.yearNav, '.abt-htl-year-pill');
  ctx.list.querySelectorAll('.abt-htl-cards').forEach((c) => reorderChildrenReversed(c, '.abt-htl-card'));
  ctx.groups = Array.from(ctx.list.querySelectorAll('.abt-htl-group'));
  ctx.pills = Array.from(ctx.yearNav.querySelectorAll('.abt-htl-year-pill'));
  ctx.activeKey = '';

  if (ctx.liveEl) ctx.liveEl.textContent = btn.textContent.trim();
  measureTimelineGeometry(ctx);
  syncTimelineScroll(ctx);
}

function initCardReveal(cards) {
  if (!cards.length) return;
  if (isReducedMotion() || !('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  cards.forEach((card) => observer.observe(card));
}

function bindTimelineEvents(ctx) {
  ctx.pills.forEach((pill) => pill.addEventListener('click', () => handlePillClick(ctx, pill)));
  ctx.sortBtns.forEach((btn) => btn.addEventListener('click', () => handleSortClick(ctx, btn)));
  window.addEventListener('scroll', () => scheduleTimelineSync(ctx), { passive: true });

  const refresh = () => {
    measureTimelineGeometry(ctx);
    scheduleTimelineSync(ctx);
  };
  if ('ResizeObserver' in window) {
    new ResizeObserver(refresh).observe(ctx.list);
  } else {
    window.addEventListener('resize', refresh, { passive: true });
  }
}

function initVerticalTimeline() {
  const layout = document.querySelector('.abt-htl-layout');
  if (!layout || layout.hidden) return;

  const list = layout.querySelector('#abt-htl-list');
  const yearNav = layout.querySelector('.abt-htl-year-nav');
  const rail = layout.querySelector('.abt-htl-rail');
  if (!list || !yearNav || !rail) return;

  const ctx = {
    layout,
    list,
    yearNav,
    rail,
    liveEl: document.querySelector('.abt-htl-live'),
    sortBtns: Array.from(layout.querySelectorAll('.abt-htl-sort-btn')),
    pills: Array.from(yearNav.querySelectorAll('.abt-htl-year-pill')),
    groups: Array.from(list.querySelectorAll('.abt-htl-group')),
    sortDir: layout.getAttribute('data-sort-dir') || 'asc',
    activeKey: '',
    railStartDocY: 0,
    railHeight: 0,
    groupOffsets: [],
    rafId: 0,
    sortTimer: 0
  };
  if (!ctx.groups.length) return;

  initCardReveal(Array.from(list.querySelectorAll('.abt-htl-card')));
  bindTimelineEvents(ctx);
  measureTimelineGeometry(ctx);
  syncTimelineScroll(ctx);
}

function initAboutStory() {
  initCounterStats();
  initBadgeHover();
  initVerticalTimeline();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAboutStory);
} else {
  initAboutStory();
}
