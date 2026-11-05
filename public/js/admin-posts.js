/**
 * Admin Articles & Blog Management Client Script
 * Handles scheduled publication date toggle and auto-generating SEO slug from article title.
 */

(function() {
  'use strict';

  function toggleScheduled(val) {
    const row = document.getElementById('scheduledRow');
    if (!row) return;

    if (val === 'scheduled') {
      row.classList.remove('adm-d-none');
      row.style.display = 'grid';
    } else {
      row.classList.add('adm-d-none');
      row.style.display = 'none';
    }
  }

  function initSlugGenerator() {
    const titleInput = document.getElementById('title_id');
    const slugInput = document.getElementById('slug');
    if (!titleInput || !slugInput) return;

    let isSlugManuallyEdited = slugInput.value.trim().length > 0;

    slugInput.addEventListener('input', () => {
      isSlugManuallyEdited = slugInput.value.trim().length > 0;
    });

    titleInput.addEventListener('input', () => {
      if (!isSlugManuallyEdited) {
        slugInput.value = titleInput.value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/--+/g, '-');
      }
    });
  }

  function initPostForm() {
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        toggleScheduled(e.target.value);
      });
      toggleScheduled(statusSelect.value);
    }

    initSlugGenerator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostForm);
  } else {
    initPostForm();
  }
})();

