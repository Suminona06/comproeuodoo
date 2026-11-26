(function () {
  'use strict';

  const openPickerBtn = document.getElementById('btnOpenGalleryPicker');
  const galleryStrip = document.getElementById('prodGalleryStrip');
  const galleryInput = document.getElementById('gallery_images_input');

  if (!openPickerBtn || !galleryStrip || !galleryInput) return;

  function isEnglish() {
    return (document.documentElement.lang || 'id').toLowerCase().startsWith('en');
  }

  function parsePositiveInt(val) {
    const num = parseInt(val, 10);
    return Number.isInteger(num) && num > 0 ? num : null;
  }

  function normalizeObjectItem(raw) {
    const id = parsePositiveInt(raw.id);
    const url = String(raw.file_url || raw.url || '').trim();
    if (!url && !id) return null;
    const rawName = raw.filename || raw.original_name || raw.name;
    return { id, url, name: String(rawName || 'Foto Galeri') };
  }

  function normalizeGalleryItem(raw) {
    if (!raw) return null;
    if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) {
      return { id: raw, url: '', name: `Media #${raw}` };
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      return trimmed ? { id: null, url: trimmed, name: trimmed.split('/').pop() || 'Foto Galeri' } : null;
    }
    return normalizeObjectItem(raw);
  }

  function readInitialItems() {
    const domItems = [];
    galleryStrip.querySelectorAll('.prod-gallery-item').forEach((el) => {
      const img = el.querySelector('img');
      const item = normalizeGalleryItem({
        id: el.getAttribute('data-id'),
        url: el.getAttribute('data-url') || (img ? img.getAttribute('src') : '')
      });
      if (item && item.url) domItems.push(item);
    });
    if (domItems.length > 0) return domItems;

    try {
      const parsed = JSON.parse(galleryInput.value || '[]');
      return Array.isArray(parsed) ? parsed.map(normalizeGalleryItem).filter((it) => it && it.url) : [];
    } catch {
      return [];
    }
  }

  function isDuplicateItem(items, candidate) {
    return items.some((it) => {
      if (it.id && candidate.id && it.id === candidate.id) return true;
      return Boolean(it.url && candidate.url && it.url === candidate.url);
    });
  }

  function syncHiddenInput(items) {
    const payload = items.map((it) => (it.id ? it.id : it.url));
    galleryInput.value = JSON.stringify(payload);
  }

  function createSvgEl(tag) {
    return typeof document.createElementNS === 'function'
      ? document.createElementNS('http://www.w3.org/2000/svg', tag)
      : document.createElement(tag);
  }

  function createDeleteIconSvg() {
    const svg = createSvgEl('svg');
    svg.setAttribute('class', 'prod-gallery-icon-del');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const coords = [[18, 6, 6, 18], [6, 6, 18, 18]];
    coords.forEach(([x1, y1, x2, y2]) => {
      const line = createSvgEl('line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      svg.appendChild(line);
    });
    return svg;
  }

  function createGalleryBtn(className, label, text, disabled) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.textContent = text;
    btn.disabled = Boolean(disabled);
    return btn;
  }

  function buildThumbBox(item, en) {
    const thumbBox = document.createElement('div');
    thumbBox.className = 'prod-gallery-thumb-box';

    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.name || '';
    img.className = 'prod-gallery-thumb';
    img.width = 64;
    img.height = 64;
    img.loading = 'lazy';

    const delLabel = en ? 'Remove photo' : 'Hapus foto';
    const delBtn = createGalleryBtn('prod-gallery-btn-del', delLabel, '', false);
    delBtn.appendChild(createDeleteIconSvg());
    thumbBox.appendChild(img);
    thumbBox.appendChild(delBtn);
    return thumbBox;
  }

  function buildReorderWrap(index, total, en) {
    const wrap = document.createElement('div');
    wrap.className = 'prod-gallery-reorder';
    const leftLabel = en ? 'Move photo left' : 'Geser foto ke kiri';
    const rightLabel = en ? 'Move photo right' : 'Geser foto ke kanan';
    wrap.appendChild(createGalleryBtn('prod-gallery-btn-move prod-gallery-btn-up', leftLabel, '▲', index === 0));
    wrap.appendChild(createGalleryBtn('prod-gallery-btn-move prod-gallery-btn-down', rightLabel, '▼', index === total - 1));
    return wrap;
  }

  function buildGalleryCard(item, index, total) {
    const en = isEnglish();
    const card = document.createElement('div');
    card.className = 'prod-gallery-item';
    card.setAttribute('data-index', String(index));
    card.setAttribute('data-id', item.id ? String(item.id) : '');
    card.setAttribute('data-url', item.url);
    card.appendChild(buildThumbBox(item, en));
    card.appendChild(buildReorderWrap(index, total, en));
    return card;
  }

  let galleryItems = readInitialItems();

  function renderGallery() {
    const fragment = document.createDocumentFragment();
    galleryItems.forEach((item, idx) => {
      fragment.appendChild(buildGalleryCard(item, idx, galleryItems.length));
    });
    galleryStrip.replaceChildren(fragment);
    syncHiddenInput(galleryItems);
  }

  function moveItem(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= galleryItems.length) return;
    const temp = galleryItems[index];
    galleryItems[index] = galleryItems[target];
    galleryItems[target] = temp;
    renderGallery();
  }

  galleryStrip.addEventListener('click', (e) => {
    const card = e.target.closest('.prod-gallery-item');
    if (!card) return;
    const idx = parseInt(card.getAttribute('data-index'), 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= galleryItems.length) return;

    if (e.target.closest('.prod-gallery-btn-del')) {
      galleryItems.splice(idx, 1);
      renderGallery();
    } else if (e.target.closest('.prod-gallery-btn-up')) {
      moveItem(idx, -1);
    } else if (e.target.closest('.prod-gallery-btn-down')) {
      moveItem(idx, 1);
    }
  });

  openPickerBtn.addEventListener('click', () => {
    if (typeof window.openMediaPicker !== 'function') return;
    window.openMediaPicker({
      type: 'image',
      multiple: true,
      onSelect: (selectedList) => {
        const list = Array.isArray(selectedList) ? selectedList : [selectedList];
        list.forEach((raw) => {
          const normalized = normalizeGalleryItem(raw);
          if (normalized && normalized.url && !isDuplicateItem(galleryItems, normalized)) {
            galleryItems.push(normalized);
          }
        });
        renderGallery();
      }
    });
  });

  const parentForm = galleryInput.closest('form');
  if (parentForm) {
    parentForm.addEventListener('submit', () => syncHiddenInput(galleryItems));
  }

  renderGallery();
})();
