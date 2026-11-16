(function () {
  'use strict';

  const MAX_TEXT_LENGTH = 100;
  const MIN_MESSAGE_LENGTH = 10;
  const MAX_MESSAGE_LENGTH = 3000;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[0-9\s+\-()]{7,30}$/;

  const FIELD_RULES = [
    { id: 'name', check: (v) => v.length > 0 && v.length <= MAX_TEXT_LENGTH },
    { id: 'company', check: (v) => v.length <= MAX_TEXT_LENGTH },
    { id: 'email', check: (v) => EMAIL_REGEX.test(v) && v.length <= MAX_TEXT_LENGTH },
    { id: 'phone', check: (v) => PHONE_REGEX.test(v) },
    { id: 'message', check: (v) => v.length >= MIN_MESSAGE_LENGTH && v.length <= MAX_MESSAGE_LENGTH }
  ];

  function setFieldValidity(input, isValid) {
    if (!input) return true;
    input.classList.toggle('is-invalid', !isValid);
    if (isValid) {
      input.removeAttribute('aria-invalid');
    } else {
      input.setAttribute('aria-invalid', 'true');
    }
    return isValid;
  }

  function validateFormFields(form) {
    const results = FIELD_RULES.map((rule) => {
      const input = document.getElementById(rule.id);
      if (!input) return true;
      return setFieldValidity(input, rule.check(input.value.trim()));
    });
    if (results.every(Boolean)) return true;
    const firstInvalid = form.querySelector('.is-invalid');
    if (firstInvalid) firstInvalid.focus();
    return false;
  }

  function applyLoadingState(btn) {
    btn.disabled = true;
    const loadingText = btn.getAttribute('data-loading-text') || '';
    const labelEl = btn.querySelector('.cf-submit-label');
    const arrowEl = btn.querySelector('.cf-submit-arrow');
    if (arrowEl) arrowEl.hidden = true;
    if (labelEl && loadingText) {
      labelEl.textContent = loadingText;
      return;
    }
    if (loadingText) btn.textContent = loadingText;
  }

  function bindClearOnInput(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.addEventListener('input', () => {
      if (el.classList.contains('is-invalid')) {
        setFieldValidity(el, true);
      }
    });
  }

  function initContactForm() {
    const form = document.getElementById('rfqForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      const btn = document.getElementById('submitBtn');
      if (!btn) return;
      if (!validateFormFields(form)) {
        e.preventDefault();
        return;
      }
      applyLoadingState(btn);
    });

    FIELD_RULES.forEach((rule) => bindClearOnInput(rule.id));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();
