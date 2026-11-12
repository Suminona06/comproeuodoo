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

function initAboutStory() {
  initCounterStats();
  initBadgeHover();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAboutStory);
} else {
  initAboutStory();
}

