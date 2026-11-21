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

  function isEnglish() {
    return (document.documentElement.lang || 'id').toLowerCase().startsWith('en');
  }

  function setFieldValidity(input, isValid) {
    if (!input) return true;
    input.classList.toggle('is-invalid', !isValid);
    if (isValid) input.removeAttribute('aria-invalid');
    else input.setAttribute('aria-invalid', 'true');
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
      if (el.classList.contains('is-invalid')) setFieldValidity(el, true);
    });
  }

  function parseJsonAttr(el, attr, fallback) {
    if (!el) return fallback;
    try {
      return JSON.parse(el.getAttribute(attr) || '') || fallback;
    } catch {
      return fallback;
    }
  }

  function buildInitialSelectionState(initialList) {
    const state = new Map();
    if (!Array.isArray(initialList)) return state;
    initialList.forEach((grp) => {
      const gId = grp && (grp.group_id || grp.id);
      const opts = grp && Array.isArray(grp.options) ? grp.options : [];
      if (!gId || opts.length === 0) return;
      const set = new Set(opts.map((o) => (typeof o === 'object' ? o.id : o)).filter(Boolean));
      if (set.size > 0) state.set(gId, set);
    });
    return state;
  }

  function toggleVariantOption(state, groupId, optId) {
    let set = state.get(groupId);
    if (!set) {
      set = new Set();
      state.set(groupId, set);
    }
    if (set.has(optId)) {
      set.delete(optId);
      if (set.size === 0) state.delete(groupId);
    } else {
      set.add(optId);
    }
  }

  function syncHiddenVariantInput(inputEl, groups, state) {
    if (!inputEl) return;
    const payload = [];
    groups.forEach((grp) => {
      const picked = state.get(grp.id);
      if (!picked || picked.size === 0) return;
      const validIds = grp.options.filter((o) => picked.has(o.id)).map((o) => o.id);
      if (validIds.length > 0) payload.push({ group_id: grp.id, option_ids: validIds });
    });
    inputEl.value = payload.length > 0 ? JSON.stringify(payload) : '';
  }

  function createChipNode(gName, optLabel, removeAria, onRemove) {
    const chip = document.createElement('span');
    chip.className = 'cf-var-chip';
    const text = document.createElement('span');
    text.className = 'cf-var-chip-text';
    text.textContent = `${gName}: ${optLabel}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cf-var-chip-remove';
    btn.setAttribute('aria-label', `${removeAria} ${gName} ${optLabel}`);
    btn.textContent = '×';
    btn.addEventListener('click', onRemove);
    chip.appendChild(text);
    chip.appendChild(btn);
    return chip;
  }

  function renderSelectedChips(chipsEl, groups, state, emptyText, removeAria, onToggle) {
    if (!chipsEl) return;
    const en = isEnglish();
    const frag = document.createDocumentFragment();
    let count = 0;

    groups.forEach((grp) => {
      const picked = state.get(grp.id);
      if (!picked) return;
      const gName = en ? (grp.name_en || grp.name_id) : (grp.name_id || grp.name_en);
      grp.options.forEach((opt) => {
        if (!picked.has(opt.id)) return;
        count += 1;
        const optLabel = en ? (opt.label_en || opt.label_id) : (opt.label_id || opt.label_en);
        frag.appendChild(createChipNode(gName, optLabel, removeAria, () => onToggle(grp.id, opt.id)));
      });
    });

    if (count === 0) {
      const empty = document.createElement('span');
      empty.className = 'cf-var-empty';
      empty.textContent = emptyText;
      frag.appendChild(empty);
    }
    chipsEl.replaceChildren(frag);
  }

  function renderVariantPickerGroups(pickerEl, groups, state, onToggle) {
    if (!pickerEl) return;
    const en = isEnglish();
    const frag = document.createDocumentFragment();

    groups.forEach((grp) => {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'cf-var-group';
      const legend = document.createElement('legend');
      legend.className = 'cf-var-legend';
      legend.textContent = en ? (grp.name_en || grp.name_id) : (grp.name_id || grp.name_en);
      fieldset.appendChild(legend);

      const pillsWrap = document.createElement('div');
      pillsWrap.className = 'cf-var-pills';
      const picked = state.get(grp.id);

      grp.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cf-var-pill';
        const active = Boolean(picked && picked.has(opt.id));
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.textContent = en ? (opt.label_en || opt.label_id) : (opt.label_id || opt.label_en);
        btn.addEventListener('click', () => onToggle(grp.id, opt.id));
        pillsWrap.appendChild(btn);
      });

      fieldset.appendChild(pillsWrap);
      frag.appendChild(fieldset);
    });

    pickerEl.replaceChildren(frag);
  }

  function initRfqVariantsPicker() {
    const section = document.getElementById('cfVariantsSection');
    const productSelect = document.getElementById('product_id');
    const chipsEl = document.getElementById('cfSelectedChips');
    const pickerEl = document.getElementById('cfVariantGroupsPicker');
    const hiddenInput = document.getElementById('cfSelectedVariantsInput');
    if (!section || !productSelect) return;

    const variantsMap = parseJsonAttr(section, 'data-variants-map', {});
    const initialSelected = parseJsonAttr(section, 'data-initial-selected', []);
    const emptyText = section.getAttribute('data-empty-text') || '';
    const removeAria = section.getAttribute('data-remove-label') || 'Hapus varian';
    let selectionState = buildInitialSelectionState(initialSelected);

    function renderCurrentProductVariants() {
      const prodId = productSelect.value;
      const groups = (prodId && Array.isArray(variantsMap[prodId])) ? variantsMap[prodId] : [];
      if (groups.length === 0) {
        section.classList.add('cf-var-hidden');
        if (chipsEl) chipsEl.textContent = '';
        if (pickerEl) pickerEl.textContent = '';
        if (hiddenInput) hiddenInput.value = '';
        return;
      }
      section.classList.remove('cf-var-hidden');
      const handleToggle = (gId, oId) => {
        toggleVariantOption(selectionState, gId, oId);
        renderCurrentProductVariants();
      };
      renderSelectedChips(chipsEl, groups, selectionState, emptyText, removeAria, handleToggle);
      renderVariantPickerGroups(pickerEl, groups, selectionState, handleToggle);
      syncHiddenVariantInput(hiddenInput, groups, selectionState);
    }

    productSelect.addEventListener('change', () => {
      selectionState = new Map();
      renderCurrentProductVariants();
    });

    renderCurrentProductVariants();
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
    initRfqVariantsPicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();
