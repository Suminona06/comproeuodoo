(function() {
  'use strict';

  function setupCharCounter(textareaId, counterId, maxLen) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (!textarea || !counter) return;

    function update() {
      const len = textarea.value.length;
      counter.textContent = `${len}/${maxLen}`;
      if (maxLen - len <= 10) {
        counter.classList.add('text-danger', 'counter-danger');
      } else {
        counter.classList.remove('text-danger', 'counter-danger');
      }
    }

    textarea.addEventListener('input', update);
    update();
  }

  setupCharCounter('short_description_id', 'counter_short_desc_id', 200);
  setupCharCounter('short_description_en', 'counter_short_desc_en', 200);

  const galleryStrip = document.getElementById('prodGalleryStrip');
  const galleryInput = document.getElementById('gallery_images_input');
  const btnOpenGallery = document.getElementById('btnOpenGalleryPicker');

  function updateGalleryInput() {
    if (!galleryStrip || !galleryInput) return;
    const items = galleryStrip.querySelectorAll('.prod-gallery-item');
    const list = [];
    items.forEach(function(el) {
      const id = el.getAttribute('data-id');
      if (id && /^\d+$/.test(id)) {
        list.push(parseInt(id, 10));
      } else if (el.getAttribute('data-url')) {
        list.push(el.getAttribute('data-url'));
      }
    });
    galleryInput.value = JSON.stringify(list);
  }

  function bindGalleryItemEvents(div) {
    const delBtn = div.querySelector('.prod-gallery-btn-del');
    const upBtn = div.querySelector('.prod-gallery-btn-up');
    const downBtn = div.querySelector('.prod-gallery-btn-down');

    if (delBtn) {
      delBtn.addEventListener('click', function() {
        div.remove();
        updateGalleryInput();
      });
    }

    if (upBtn) {
      upBtn.addEventListener('click', function() {
        const prev = div.previousElementSibling;
        if (prev) {
          galleryStrip.insertBefore(div, prev);
          updateGalleryInput();
        }
      });
    }

    if (downBtn) {
      downBtn.addEventListener('click', function() {
        const next = div.nextElementSibling;
        if (next) {
          galleryStrip.insertBefore(next, div);
          updateGalleryInput();
        }
      });
    }
  }

  if (galleryStrip) {
    galleryStrip.querySelectorAll('.prod-gallery-item').forEach(bindGalleryItemEvents);
  }

  function createGalleryItem(item) {
    const id = item.id || '';
    const url = item.file_url || item.url || '';
    if (!url) return null;

    const div = document.createElement('div');
    div.className = 'prod-gallery-item';
    div.setAttribute('data-id', id);
    div.setAttribute('data-url', url);

    div.innerHTML = `
      <div class="prod-gallery-thumb-box">
        <img src="${url}" alt="" class="prod-gallery-thumb" width="64" height="64" loading="lazy">
        <button type="button" class="prod-gallery-btn-del" title="Hapus foto" aria-label="Hapus foto">&times;</button>
      </div>
      <div class="prod-gallery-reorder">
        <button type="button" class="prod-gallery-btn-move prod-gallery-btn-up" title="Geser ke kiri / atas" aria-label="Geser ke kiri">\u25B2</button>
        <button type="button" class="prod-gallery-btn-move prod-gallery-btn-down" title="Geser ke kanan / bawah" aria-label="Geser ke kanan">\u25BC</button>
      </div>
    `;

    bindGalleryItemEvents(div);
    return div;
  }

  if (btnOpenGallery) {
    btnOpenGallery.addEventListener('click', function() {
      if (typeof window.openMediaPicker === 'function') {
        window.openMediaPicker({
          multiple: true,
          type: 'image',
          onSelect: function(selectedList) {
            if (Array.isArray(selectedList)) {
              selectedList.forEach(function(m) {
                const existing = galleryStrip.querySelector(`[data-id="${m.id}"], [data-url="${m.file_url}"]`);
                if (!existing) {
                  const el = createGalleryItem(m);
                  if (el) galleryStrip.appendChild(el);
                }
              });
              updateGalleryInput();
            }
          }
        });
      }
    });
  }

  const btnAddVariant = document.getElementById('btnAddVariant');
  const variantsContainer = document.getElementById('variantsContainer');

  function bindVariantRow(row) {
    const btn = row.querySelector('.btn-remove-variant');
    if (!btn) return;
    btn.addEventListener('click', function() {
      const rows = variantsContainer.querySelectorAll('.prod-variant-row-item');
      if (rows.length > 1) {
        row.remove();
      } else {
        const input = row.querySelector('input');
        if (input) input.value = '';
      }
    });
  }

  function createVariantRow(val) {
    const value = val || '';
    const div = document.createElement('div');
    div.className = 'prod-variant-row-item';
    div.innerHTML = `
      <input type="text" name="variant_labels[]" class="form-input" placeholder="Contoh: 24 x 40 cm (40 Micron)" value="${value}">
      <button type="button" class="btn-row-action btn-row-delete btn-remove-variant" title="Hapus varian" aria-label="Hapus varian">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      </button>
    `;
    bindVariantRow(div);
    return div;
  }

  if (btnAddVariant && variantsContainer) {
    btnAddVariant.addEventListener('click', function() {
      const row = createVariantRow('');
      variantsContainer.appendChild(row);
      const input = row.querySelector('input');
      if (input) input.focus();
    });

    variantsContainer.querySelectorAll('.prod-variant-row-item').forEach(bindVariantRow);
  }
})();

