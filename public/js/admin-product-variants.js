(function () {
  'use strict';

  const container = document.getElementById('adminVariantsBuilder');
  const hiddenInput = document.getElementById('inputVariantsJson');
  const btnAddGroup = document.getElementById('btnAddVariantGroup');

  if (!container || !hiddenInput) return;

  const MAX_GROUPS = 5;
  const MAX_OPTIONS = 20;
  const MAX_GROUP_LEN = 40;
  const MAX_OPT_LEN = 50;

  const PRESETS = [
    { key: 'ukuran', label: 'Ukuran / Size', name_id: 'Ukuran', name_en: 'Size' },
    { key: 'warna', label: 'Warna / Color', name_id: 'Warna', name_en: 'Color' },
    { key: 'tipe', label: 'Tipe / Type', name_id: 'Tipe', name_en: 'Type' },
    { key: 'jenis', label: 'Jenis / Kind', name_id: 'Jenis', name_en: 'Kind' },
    { key: 'custom', label: 'Lainnya (Teks Bebas)', name_id: '', name_en: '' }
  ];

  let uidCounter = 1;
  function nextUid(prefix) {
    uidCounter += 1;
    return `${prefix}_${Date.now().toString(36)}_${uidCounter}`;
  }

  function detectPresetKey(nameId, nameEn) {
    const nId = String(nameId || '').trim().toLowerCase();
    const nEn = String(nameEn || '').trim().toLowerCase();
    const found = PRESETS.find((p) => p.key !== 'custom' && p.name_id.toLowerCase() === nId && p.name_en.toLowerCase() === nEn);
    return found ? found.key : 'custom';
  }

  function pickFirstText(raw, keys) {
    for (const k of keys) {
      if (raw[k]) return String(raw[k]).trim().slice(0, MAX_OPT_LEN);
    }
    return '';
  }

  function normalizeInitialOption(raw, idx) {
    if (typeof raw === 'string') {
      const val = raw.trim().slice(0, MAX_OPT_LEN);
      return { id: `opt_${idx + 1}`, label_id: val, label_en: val };
    }
    if (!raw || typeof raw !== 'object') return { id: nextUid('opt'), label_id: '', label_en: '' };
    const lId = pickFirstText(raw, ['label_id', 'size_label', 'name_id']);
    const lEn = pickFirstText(raw, ['label_en', 'name_en']) || lId;
    return { id: String(raw.id || `opt_${idx + 1}`), label_id: lId, label_en: lEn };
  }

  function parseInitialGroups() {
    let raw;
    try {
      raw = JSON.parse(container.getAttribute('data-initial') || '[]');
    } catch {
      raw = [];
    }
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const isGroupList = raw.some((item) => item && typeof item === 'object' && Array.isArray(item.options));
    if (!isGroupList) {
      const opts = raw.map(normalizeInitialOption).filter((o) => o.label_id || o.label_en).slice(0, MAX_OPTIONS);
      if (opts.length === 0) return [];
      return [{ id: 'grp_ukuran', preset: 'ukuran', name_id: 'Ukuran', name_en: 'Size', options: opts }];
    }
    return raw.slice(0, MAX_GROUPS).map((g, idx) => {
      const nameId = String(g.name_id || '').trim().slice(0, MAX_GROUP_LEN);
      const nameEn = String(g.name_en || nameId).trim().slice(0, MAX_GROUP_LEN);
      const opts = Array.isArray(g.options) ? g.options.slice(0, MAX_OPTIONS).map(normalizeInitialOption) : [];
      return {
        id: String(g.id || `grp_${idx + 1}`),
        preset: detectPresetKey(nameId, nameEn),
        name_id: nameId,
        name_en: nameEn,
        options: opts.length > 0 ? opts : [{ id: nextUid('opt'), label_id: '', label_en: '' }]
      };
    });
  }

  let groups = parseInitialGroups();

  function syncJsonInput() {
    const clean = groups.slice(0, MAX_GROUPS).map((g, gIdx) => ({
      id: g.id || `grp_${gIdx + 1}`,
      name_id: String(g.name_id || '').trim().slice(0, MAX_GROUP_LEN),
      name_en: String(g.name_en || g.name_id || '').trim().slice(0, MAX_GROUP_LEN),
      options: (g.options || [])
        .slice(0, MAX_OPTIONS)
        .map((o, oIdx) => ({
          id: o.id || `opt_${oIdx + 1}`,
          label_id: String(o.label_id || '').trim().slice(0, MAX_OPT_LEN),
          label_en: String(o.label_en || o.label_id || '').trim().slice(0, MAX_OPT_LEN)
        }))
        .filter((o) => o.label_id.length > 0 || o.label_en.length > 0)
    })).filter((g) => (g.name_id.length > 0 || g.name_en.length > 0) && g.options.length > 0);

    hiddenInput.value = JSON.stringify(clean);
    if (btnAddGroup) btnAddGroup.disabled = groups.length >= MAX_GROUPS;
  }

  function confirmDelete(title, text, onConfirm) {
    if (typeof Swal !== 'undefined' && typeof Swal.fire === 'function') {
      Swal.fire({ title, text, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal' })
        .then((res) => { if (res.isConfirmed) onConfirm(); });
      return;
    }
    onConfirm();
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICON_SPECS = {
    up: { cls: 'adm-var-icon-chevron', sw: '2.4', shapes: [['polyline', { points: '18 15 12 9 6 15' }]] },
    down: { cls: 'adm-var-icon-chevron', sw: '2.4', shapes: [['polyline', { points: '6 9 12 15 18 9' }]] },
    trash: {
      cls: 'adm-btn-icon adm-btn-icon-trash',
      sw: '2',
      shapes: [
        ['polyline', { points: '3 6 5 6 21 6' }],
        ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
        ['line', { x1: '10', y1: '11', x2: '10', y2: '17' }],
        ['line', { x1: '14', y1: '11', x2: '14', y2: '17' }]
      ]
    }
  };

  function createSvgIcon(name) {
    const spec = ICON_SPECS[name];
    const svg = document.createElementNS(SVG_NS, 'svg');
    Object.entries({ class: spec.cls, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': spec.sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })
      .forEach(([k, v]) => svg.setAttribute(k, v));
    spec.shapes.forEach(([tag, attrs]) => {
      const node = document.createElementNS(SVG_NS, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      svg.appendChild(node);
    });
    return svg;
  }

  function createIconBtn(className, label, content, disabled, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    if (ICON_SPECS[content]) btn.appendChild(createSvgIcon(content));
    else btn.textContent = content;
    btn.disabled = Boolean(disabled);
    btn.addEventListener('click', onClick);
    return btn;
  }

  function createTextInput(className, value, maxLen, placeholder, ariaLabel, readOnly, onInput) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = className;
    input.value = value || '';
    input.maxLength = maxLen;
    input.placeholder = placeholder;
    input.setAttribute('aria-label', ariaLabel);
    input.readOnly = Boolean(readOnly);
    input.addEventListener('input', (e) => onInput(e.target.value));
    return input;
  }

  function moveArrayItem(arr, fromIdx, delta) {
    const toIdx = fromIdx + delta;
    if (toIdx < 0 || toIdx >= arr.length) return;
    const temp = arr[fromIdx];
    arr[fromIdx] = arr[toIdx];
    arr[toIdx] = temp;
    render();
  }

  function buildOptionRow(grp, opt, oIdx) {
    const row = document.createElement('div');
    row.className = 'adm-var-opt-row';

    row.appendChild(createTextInput('form-input adm-var-opt-input', opt.label_id, MAX_OPT_LEN, 'Label Opsi (ID) - mis: Merah / Custom', 'Label Opsi Bahasa Indonesia', false, (val) => {
      opt.label_id = val;
      syncJsonInput();
    }));
    row.appendChild(createTextInput('form-input adm-var-opt-input', opt.label_en, MAX_OPT_LEN, 'Option Label (EN) - e.g. Red / Custom', 'Option Label English', false, (val) => {
      opt.label_en = val;
      syncJsonInput();
    }));

    const actions = document.createElement('div');
    actions.className = 'adm-var-opt-actions';
    actions.appendChild(createIconBtn('btn-row-action adm-var-btn-move', 'Geser opsi naik', 'up', oIdx === 0, () => moveArrayItem(grp.options, oIdx, -1)));
    actions.appendChild(createIconBtn('btn-row-action adm-var-btn-move', 'Geser opsi turun', 'down', oIdx === grp.options.length - 1, () => moveArrayItem(grp.options, oIdx, 1)));
    actions.appendChild(createIconBtn('btn-row-action btn-row-delete adm-var-btn-del-opt', 'Hapus opsi', 'trash', false, () => {
      const hasVal = Boolean((opt.label_id || '').trim() || (opt.label_en || '').trim());
      const doRemove = () => {
        grp.options.splice(oIdx, 1);
        if (grp.options.length === 0) grp.options.push({ id: nextUid('opt'), label_id: '', label_en: '' });
        render();
      };
      if (hasVal) confirmDelete('Hapus Opsi Varian?', `Opsi "${opt.label_id || opt.label_en}" akan dihapus.`, doRemove);
      else doRemove();
    }));
    row.appendChild(actions);
    return row;
  }

  function buildPresetSelect(grp) {
    const select = document.createElement('select');
    select.className = 'form-select adm-var-preset-select';
    select.setAttribute('data-eu-dropdown', 'outlined');
    select.setAttribute('data-eu-size', 'sm');
    select.setAttribute('aria-label', 'Pilih tipe grup varian');
    PRESETS.forEach((p) => {
      const optEl = document.createElement('option');
      optEl.value = p.key;
      optEl.textContent = p.label;
      if (p.key === grp.preset) optEl.selected = true;
      select.appendChild(optEl);
    });
    select.addEventListener('change', (e) => {
      grp.preset = e.target.value;
      const found = PRESETS.find((p) => p.key === grp.preset);
      if (found && found.key !== 'custom') {
        grp.name_id = found.name_id;
        grp.name_en = found.name_en;
      }
      render();
    });
    return select;
  }

  function buildGroupHeader(grp, gIdx) {
    const header = document.createElement('div');
    header.className = 'adm-var-group-header';

    const badge = document.createElement('span');
    badge.className = 'adm-var-group-badge';
    badge.textContent = `Grup #${gIdx + 1}`;
    header.appendChild(badge);
    header.appendChild(buildPresetSelect(grp));

    const isPreset = grp.preset !== 'custom';
    header.appendChild(createTextInput('form-input adm-var-gname-input', grp.name_id, MAX_GROUP_LEN, 'Nama Grup (ID)', 'Nama Grup Bahasa Indonesia', isPreset, (val) => {
      grp.name_id = val;
      syncJsonInput();
    }));
    header.appendChild(createTextInput('form-input adm-var-gname-input', grp.name_en, MAX_GROUP_LEN, 'Group Name (EN)', 'Group Name English', isPreset, (val) => {
      grp.name_en = val;
      syncJsonInput();
    }));

    const actions = document.createElement('div');
    actions.className = 'adm-var-group-actions';
    actions.appendChild(createIconBtn('btn-row-action adm-var-btn-move', 'Geser grup naik', 'up', gIdx === 0, () => moveArrayItem(groups, gIdx, -1)));
    actions.appendChild(createIconBtn('btn-row-action adm-var-btn-move', 'Geser grup turun', 'down', gIdx === groups.length - 1, () => moveArrayItem(groups, gIdx, 1)));
    actions.appendChild(createIconBtn('btn-row-action btn-row-delete adm-var-btn-del-group', 'Hapus grup varian', 'trash', false, () => {
      const hasData = grp.options.some((o) => (o.label_id || '').trim() || (o.label_en || '').trim());
      const doRemove = () => { groups.splice(gIdx, 1); render(); };
      if (hasData) confirmDelete('Hapus Grup Varian?', `Grup "${grp.name_id || grp.name_en || gIdx + 1}" beserta seluruh opsinya akan dihapus.`, doRemove);
      else doRemove();
    }));
    header.appendChild(actions);
    return header;
  }

  function buildGroupCard(grp, gIdx) {
    const card = document.createElement('div');
    card.className = 'adm-var-group';
    card.appendChild(buildGroupHeader(grp, gIdx));

    const optsWrap = document.createElement('div');
    optsWrap.className = 'adm-var-options';
    grp.options.forEach((opt, oIdx) => {
      optsWrap.appendChild(buildOptionRow(grp, opt, oIdx));
    });
    card.appendChild(optsWrap);

    const footer = document.createElement('div');
    footer.className = 'adm-var-group-footer';
    const addOptBtn = createIconBtn('btn-add-row adm-var-btn-add-opt', 'Tambah opsi varian', '+ Tambah Opsi', grp.options.length >= MAX_OPTIONS, () => {
      if (grp.options.length >= MAX_OPTIONS) return;
      grp.options.push({ id: nextUid('opt'), label_id: '', label_en: '' });
      render();
    });
    footer.appendChild(addOptBtn);
    card.appendChild(footer);
    return card;
  }

  function render() {
    const frag = document.createDocumentFragment();
    if (groups.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'adm-var-empty';
      empty.textContent = 'Belum ada grup varian. Klik "Tambah Grup Varian" untuk menambahkan pilihan seperti Ukuran, Warna, Tipe, atau Jenis.';
      frag.appendChild(empty);
    } else {
      groups.forEach((grp, gIdx) => frag.appendChild(buildGroupCard(grp, gIdx)));
    }
    container.replaceChildren(frag);
    if (window.EuDropdown && typeof window.EuDropdown.init === 'function') {
      window.EuDropdown.init(container);
    }
    syncJsonInput();
  }

  if (btnAddGroup) {
    btnAddGroup.addEventListener('click', () => {
      if (groups.length >= MAX_GROUPS) return;
      const usedPresets = new Set(groups.map((g) => g.preset));
      const nextPreset = PRESETS.find((p) => p.key !== 'custom' && !usedPresets.has(p.key)) || PRESETS[0];
      groups.push({
        id: nextUid('grp'),
        preset: nextPreset.key,
        name_id: nextPreset.name_id,
        name_en: nextPreset.name_en,
        options: [{ id: nextUid('opt'), label_id: '', label_en: '' }]
      });
      render();
    });
  }

  const form = hiddenInput.closest('form');
  if (form) form.addEventListener('submit', syncJsonInput);

  render();
})();
