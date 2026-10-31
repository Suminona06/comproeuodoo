/**
 * admin-form-validation.js - Central Form Validation Engine for PT Euodoo CMS (T-259)
 * Replacing native browser tooltips with themed inline validation, live post-error revalidation,
 * auto-opening closed tabs, and double-submit prevention.
 */

(function () {
  'use strict';

  // Multilingual error dictionary
  const MESSAGES = {
    id: {
      required: 'Bidang ini wajib diisi.',
      email: 'Masukkan alamat email yang valid (contoh: nama@domain.com).',
      url: 'Masukkan tautan URL yang valid (diawali http:// atau https://).',
      number: 'Harap masukkan angka yang valid.',
      min: 'Nilai minimal adalah {min}.',
      max: 'Nilai maksimal adalah {max}.',
      minlength: 'Minimal {min} karakter (saat ini {len} karakter).',
      maxlength: 'Maksimal {max} karakter (saat ini {len} karakter).',
      pattern: 'Format input tidak sesuai dengan pola yang ditentukan.',
      mediaRequired: 'Harap pilih berkas media terlebih dahulu.',
      whatsappTotal: 'Total alokasi persentase WhatsApp harus tepat 100% (saat ini {sum}%).'
    },
    en: {
      required: 'This field is required.',
      email: 'Please enter a valid email address (e.g. name@domain.com).',
      url: 'Please enter a valid URL (starting with http:// or https://).',
      number: 'Please enter a valid number.',
      min: 'Minimum value is {min}.',
      max: 'Maximum value is {max}.',
      minlength: 'Minimum {min} characters (currently {len} characters).',
      maxlength: 'Maximum {max} characters (currently {len} characters).',
      pattern: 'Please match the requested format.',
      mediaRequired: 'Please select a media file first.',
      whatsappTotal: 'Total WhatsApp allocation percentage must equal 100% (currently {sum}%).'
    }
  };

  function getLang() {
    const docLang = (document.documentElement.lang || 'id').toLowerCase();
    return docLang.startsWith('en') ? 'en' : 'id';
  }

  function getMessage(key, params = {}) {
    const lang = getLang();
    let text = (MESSAGES[lang] && MESSAGES[lang][key]) || MESSAGES.id[key] || 'Input tidak valid.';
    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
    return text;
  }

  const ALERT_SVG_ICON = `<svg class="adm-field-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  /**
   * Validate a single form field according to its HTML attributes and custom type
   */
  function validateField(field) {
    // Skip disabled or ignored fields
    if (field.disabled || field.type === 'hidden' && !field.classList.contains('validate-hidden') && !field.closest('.media-picker-component')) {
      return { valid: true };
    }

    const val = (field.value || '').trim();

    // 1. TinyMCE Check
    if (window.tinymce && field.id && tinymce.get(field.id)) {
      const editor = tinymce.get(field.id);
      const textContent = editor.getContent({ format: 'text' }).trim();
      const htmlContent = editor.getContent().trim();
      if (field.hasAttribute('required') && (!textContent && !htmlContent)) {
        return { valid: false, message: getMessage('required') };
      }
      return { valid: true };
    }

    // 2. Media Picker Component Check
    const mediaPicker = field.closest('.media-picker-component');
    if (mediaPicker && field.type === 'hidden') {
      if (field.hasAttribute('required') && !val) {
        return { valid: false, message: getMessage('mediaRequired') };
      }
      return { valid: true };
    }

    // 3. Required Check
    if (field.hasAttribute('required')) {
      if (field.type === 'checkbox') {
        if (!field.checked) return { valid: false, message: getMessage('required') };
      } else if (field.type === 'radio') {
        const name = field.name;
        const checked = field.form?.querySelector(`input[name="${name}"]:checked`);
        if (!checked) return { valid: false, message: getMessage('required') };
      } else if (!val) {
        return { valid: false, message: getMessage('required') };
      }
    }

    // If field is optional and empty, it is considered valid
    if (!val) {
      return { valid: true };
    }

    // 4. Type Email
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return { valid: false, message: getMessage('email') };
      }
    }

    // 5. Type URL
    if (field.type === 'url') {
      const urlRegex = /^https?:\/\/.+/i;
      if (!urlRegex.test(val)) {
        return { valid: false, message: getMessage('url') };
      }
    }

    // 6. Type Number / Min / Max
    if (field.type === 'number') {
      const num = parseFloat(val);
      if (isNaN(num)) {
        return { valid: false, message: getMessage('number') };
      }
      if (field.hasAttribute('min')) {
        const min = parseFloat(field.getAttribute('min'));
        if (num < min) {
          return { valid: false, message: getMessage('min', { min }) };
        }
      }
      if (field.hasAttribute('max')) {
        const max = parseFloat(field.getAttribute('max'));
        if (num > max) {
          return { valid: false, message: getMessage('max', { max }) };
        }
      }
    }

    // 7. Minlength / Maxlength
    if (field.hasAttribute('minlength')) {
      const min = parseInt(field.getAttribute('minlength'), 10);
      if (val.length < min) {
        return { valid: false, message: getMessage('minlength', { min, len: val.length }) };
      }
    }
    if (field.hasAttribute('maxlength')) {
      const max = parseInt(field.getAttribute('maxlength'), 10);
      if (val.length > max) {
        return { valid: false, message: getMessage('maxlength', { max, len: val.length }) };
      }
    }

    // 8. Pattern
    if (field.hasAttribute('pattern')) {
      const pattern = field.getAttribute('pattern');
      try {
        const regex = new RegExp(`^(?:${pattern})$`);
        if (!regex.test(val)) {
          return { valid: false, message: field.title || getMessage('pattern') };
        }
      } catch (e) {
        // Ignore invalid regex patterns in markup
      }
    }

    return { valid: true };
  }

  /**
   * Display inline error for a field
   */
  function showFieldError(field, message) {
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('data-had-error', 'true');

    // Handle TinyMCE container styling
    if (window.tinymce && field.id && tinymce.get(field.id)) {
      const container = tinymce.get(field.id).getContainer();
      if (container) container.classList.add('is-invalid');
    }

    // Handle Media Picker component container
    const mediaPicker = field.closest('.media-picker-component');
    if (mediaPicker) {
      mediaPicker.classList.add('is-invalid');
    }

    // Generate unique error element ID
    const errorId = `err-${field.id || field.name || Math.random().toString(36).substring(2, 9)}`;
    field.setAttribute('aria-describedby', errorId);

    // Determine target location for error message insertion
    let parent = field.closest('.form-group') || field.parentElement;
    let existingError = parent.querySelector(`.adm-field-error[id="${errorId}"]`);

    if (!existingError) {
      existingError = document.createElement('div');
      existingError.className = 'adm-field-error';
      existingError.id = errorId;
      existingError.setAttribute('role', 'alert');
      parent.appendChild(existingError);
    }

    existingError.innerHTML = `${ALERT_SVG_ICON}<span>${message}</span>`;
  }

  /**
   * Remove inline error from a field
   */
  function clearFieldError(field) {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');

    if (window.tinymce && field.id && tinymce.get(field.id)) {
      const container = tinymce.get(field.id).getContainer();
      if (container) container.classList.remove('is-invalid');
    }

    const mediaPicker = field.closest('.media-picker-component');
    if (mediaPicker) {
      mediaPicker.classList.remove('is-invalid');
    }

    const errorId = field.getAttribute('aria-describedby');
    if (errorId) {
      field.removeAttribute('aria-describedby');
      const errElem = document.getElementById(errorId);
      if (errElem) errElem.remove();
    }
  }

  /**
   * Automatically open the tab containing the error field if it's hidden
   */
  function ensureFieldVisible(field) {
    // Check for about tabs / home-content tabs (.about-tab-pane)
    const tabPane = field.closest('.about-tab-pane, .tab-pane, [role="tabpanel"]');
    if (tabPane && tabPane.id) {
      const tabBtn = document.querySelector(`.about-tab-btn[data-tab="${tabPane.id}"], button[data-tab="${tabPane.id}"], [aria-controls="${tabPane.id}"]`);
      if (tabBtn && !tabBtn.classList.contains('active')) {
        tabBtn.click();
      }
    }
  }

  /**
   * Main form validation runner
   */
  function validateForm(form) {
    let isValid = true;
    let firstErrorField = null;

    // Collect all candidate input fields in form
    const fields = form.querySelectorAll('input, textarea, select');

    fields.forEach(field => {
      const result = validateField(field);
      if (!result.valid) {
        isValid = false;
        showFieldError(field, result.message);
        if (!firstErrorField) {
          firstErrorField = field;
        }
      } else {
        // If field was previously in error and is now valid, clear it
        if (field.getAttribute('data-had-error') === 'true') {
          clearFieldError(field);
          field.removeAttribute('data-had-error');
        }
      }
    });

    // Special check: WhatsApp Multi-Number Repeater total % must be 100% if configured
    const waHiddenInput = form.querySelector('#whatsapp_numbers_json');
    if (waHiddenInput) {
      const rows = form.querySelectorAll('#waTableBody tr.wa-row');
      if (rows.length > 0) {
        let sum = 0;
        rows.forEach(r => {
          const pct = parseInt(r.querySelector('.wa-input-pct')?.value, 10);
          if (!isNaN(pct)) sum += pct;
        });
        if (sum !== 100) {
          isValid = false;
          showFieldError(waHiddenInput, getMessage('whatsappTotal', { sum }));
          if (!firstErrorField) firstErrorField = waHiddenInput;
        } else {
          clearFieldError(waHiddenInput);
        }
      }
    }

    if (!isValid && firstErrorField) {
      ensureFieldVisible(firstErrorField);
      setTimeout(() => {
        try {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof firstErrorField.focus === 'function' && firstErrorField.type !== 'hidden') {
            firstErrorField.focus();
          }
        } catch (e) {
          // Fallback
        }
      }, 60);
    }

    return isValid;
  }

  /**
   * Attach live re-validation listeners (Q5: Opsi A - after field had error)
   */
  function setupLiveRevalidation(form) {
    const handleLiveInput = (e) => {
      const field = e.target;
      if (field.getAttribute('data-had-error') === 'true') {
        const result = validateField(field);
        if (result.valid) {
          clearFieldError(field);
          field.removeAttribute('data-had-error');
        } else {
          showFieldError(field, result.message);
        }
      }
    };

    form.addEventListener('input', handleLiveInput);
    form.addEventListener('change', handleLiveInput);

    // TinyMCE live binding if initialized later
    if (window.tinymce) {
      tinymce.on('AddEditor', (e) => {
        e.editor.on('input change keyup', () => {
          const textarea = document.getElementById(e.editor.id);
          if (textarea && textarea.getAttribute('data-had-error') === 'true') {
            const result = validateField(textarea);
            if (result.valid) {
              clearFieldError(textarea);
              textarea.removeAttribute('data-had-error');
            } else {
              showFieldError(textarea, result.message);
            }
          }
        });
      });
    }
  }

  /**
   * Initialize validation on a single form
   */
  function initForm(form) {
    // Avoid double initialization
    if (form.getAttribute('data-admin-validated') === 'true') return;
    form.setAttribute('data-admin-validated', 'true');

    // Turn off native browser tooltips
    form.setAttribute('novalidate', 'true');

    // Setup live re-validation listeners
    setupLiveRevalidation(form);

    // Form submit listener
    form.addEventListener('submit', (e) => {
      // If form is already loading, prevent duplicate submits
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn && submitBtn.classList.contains('is-loading')) {
        e.preventDefault();
        return;
      }

      const valid = validateForm(form);
      if (!valid) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        // Prevent double submit by setting submit button to loading state
        if (submitBtn) {
          submitBtn.classList.add('is-loading');
          // Allow small timeout so form submit event finishes firing
          setTimeout(() => {
            submitBtn.disabled = true;
          }, 0);
        }
      }
    });
  }

  // Auto-initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(initForm);
  });

  // Export engine to window for programmatic use / dynamic forms
  window.AdminFormValidation = {
    validateForm,
    validateField,
    showFieldError,
    clearFieldError,
    initForm
  };
})();

