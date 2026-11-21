(function () {
  'use strict';

  function collectGroupSelections(wrap) {
    const groups = Array.from(wrap.querySelectorAll('.pd-var-group'));
    const textParts = [];
    const querySegments = [];

    groups.forEach((grpEl) => {
      const grpId = (grpEl.getAttribute('data-group-id') || '').trim();
      const grpName = (grpEl.getAttribute('data-group-name') || '').trim();
      const activePills = Array.from(grpEl.querySelectorAll('.pd-var-pill[aria-pressed="true"]'));
      if (activePills.length === 0) return;

      const labels = activePills
        .map((btn) => (btn.getAttribute('data-option-label') || btn.textContent || '').trim())
        .filter(Boolean);
      const optIds = activePills
        .map((btn) => (btn.getAttribute('data-option-id') || '').trim())
        .filter(Boolean);

      if (grpName && labels.length > 0) {
        textParts.push(`${grpName}: ${labels.join(', ')}`);
      }
      if (grpId && optIds.length > 0) {
        querySegments.push(`${grpId}:${optIds.join(',')}`);
      }
    });

    return { textParts, querySegments };
  }

  function updateWhatsappLink(wrap, textParts) {
    const waBtn = document.querySelector('.pd-btn-wa');
    if (!waBtn) return;
    const defaultHref = wrap.getAttribute('data-wa-default-href') || waBtn.getAttribute('href') || '#';
    if (textParts.length === 0) {
      waBtn.setAttribute('href', defaultHref);
      return;
    }

    const prodName = wrap.getAttribute('data-product-name') || '';
    const tpl = wrap.getAttribute('data-wa-variant-tpl')
      || 'Halo, saya tertarik dengan produk {name}. Varian: {variants}. Boleh saya minta informasi lebih lanjut?';
    const message = tpl
      .replace('{name}', prodName)
      .replace('{variants}', textParts.join('; '));
    const baseUrl = defaultHref.split('?')[0];
    waBtn.setAttribute('href', `${baseUrl}?text=${encodeURIComponent(message)}`);
  }

  function updateRfqLink(wrap, querySegments) {
    const rfqBtn = document.querySelector('.pd-btn-outline');
    if (!rfqBtn) return;
    const baseHref = wrap.getAttribute('data-rfq-base-href') || rfqBtn.getAttribute('href') || '/contact';
    if (querySegments.length === 0) {
      rfqBtn.setAttribute('href', baseHref);
      return;
    }
    const separator = baseHref.includes('?') ? '&' : '?';
    rfqBtn.setAttribute('href', `${baseHref}${separator}variants=${encodeURIComponent(querySegments.join(';'))}`);
  }

  function initProductVariants() {
    const wraps = document.querySelectorAll('[data-variants]');
    wraps.forEach((wrap) => {
      wrap.addEventListener('click', (e) => {
        const pill = e.target.closest('.pd-var-pill, .pd-pill');
        if (!pill || !wrap.contains(pill)) return;
        const isPressed = pill.getAttribute('aria-pressed') === 'true';
        pill.setAttribute('aria-pressed', isPressed ? 'false' : 'true');

        const { textParts, querySegments } = collectGroupSelections(wrap);
        updateWhatsappLink(wrap, textParts);
        updateRfqLink(wrap, querySegments);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductVariants);
  } else {
    initProductVariants();
  }
})();
