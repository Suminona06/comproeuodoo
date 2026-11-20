/**
 * Universal Media Picker Client Script (T-87)
 * PT Euodoo CMS v2.0
 */

(function() {
  'use strict';

  let currentTargetInputId = null;
  let currentTargetCallback = null;
  let currentFilterType = 'all';
  let currentSearchQuery = '';
  let currentPage = 1;
  let selectedMedia = null;
  let isMultiple = false;
  let selectedMediaList = [];

  const modal = document.getElementById('universalMediaPickerModal');
  if (!modal) return;

  const grid = document.getElementById('mediaPickerGrid');
  const loading = document.getElementById('mediaPickerLoading');
  const empty = document.getElementById('mediaPickerEmpty');
  const searchInput = document.getElementById('mediaPickerSearch');
  const pageInfo = document.getElementById('mediaPickerPageInfo');
  const prevBtn = document.getElementById('btnMediaPickerPrev');
  const nextBtn = document.getElementById('btnMediaPickerNext');
  const refreshBtn = document.getElementById('btnRefreshMediaPicker');
  const selectedInfo = document.getElementById('pickerSelectedInfo');
  const confirmBtn = document.getElementById('btnConfirmSelectMedia');
  const closeBtn = document.getElementById('btnCloseMediaPicker');
  const cancelBtn = document.getElementById('btnCancelMediaPicker');
  const tabs = modal.querySelectorAll('.media-picker-tab-btn');
  const tabLibrary = document.getElementById('mediaPickerTabLibrary');
  const tabUpload = document.getElementById('mediaPickerTabUpload');
  const dropzone = document.getElementById('pickerUploadDropzone');
  const fileInput = document.getElementById('pickerFileInput');
  const triggerBrowseBtn = document.getElementById('btnTriggerBrowseFile');
  const uploadProgress = document.getElementById('pickerUploadProgress');
  const uploadProgressBar = document.getElementById('pickerUploadProgressBar');
  const uploadProgressText = document.getElementById('pickerUploadProgressText');
  const uploadQueue = document.getElementById('pickerUploadQueue');
  const uploadSummary = document.getElementById('pickerUploadSummary');
  const viewUploadedBtn = document.getElementById('btnViewUploadedInLibrary');

  function isEnglish() {
    return (document.documentElement.lang || 'id').toLowerCase().startsWith('en');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setEmptySelectionHint() {
    if (!selectedInfo) return;
    const hint = document.createElement('span');
    hint.className = 'media-picker-empty-hint';
    hint.textContent = isEnglish() ? 'No media selected' : 'Belum ada media dipilih';
    selectedInfo.replaceChildren(hint);
  }

  function showPreviewEl(el, displayClass) {
    if (!el) return;
    el.classList.remove('hidden', 'adm-d-none', 'stg-d-none');
    el.classList.add(displayClass || 'adm-d-block');
  }

  function hidePreviewEl(el) {
    if (!el) return;
    el.classList.remove('adm-d-block', 'adm-d-flex', 'adm-d-inline-flex', 'stg-d-block', 'stg-d-flex');
    el.classList.add('hidden', 'adm-d-none');
  }

  function openModal(options = {}) {
    currentTargetInputId = options.targetInputId || null;
    currentTargetCallback = options.onSelect || null;
    currentFilterType = options.type || 'all';
    isMultiple = !!options.multiple;
    currentPage = 1;
    selectedMedia = null;
    selectedMediaList = [];
    setEmptySelectionHint();
    updateConfirmButton();

    tabs.forEach(tab => {
      const tabType = tab.getAttribute('data-type');
      const isMatch = tabType === currentFilterType || (currentFilterType === 'all' && tabType === 'all');
      tab.classList.toggle('active', isMatch);
      tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    switchTab('library');
    resetPickerUploadUi();
    loadMedia();

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    resetPickerUploadUi();
    currentTargetInputId = null;
    currentTargetCallback = null;
    selectedMedia = null;
    selectedMediaList = [];
    isMultiple = false;
    setEmptySelectionHint();
  }

  function switchTab(tabName) {
    const isUpload = tabName === 'upload';
    tabLibrary.classList.toggle('adm-d-none', isUpload);
    tabUpload.classList.toggle('adm-d-none', !isUpload);
    tabs.forEach(t => {
      const active = isUpload
        ? t.getAttribute('data-tab') === 'upload'
        : t.getAttribute('data-tab') === 'library' && (t.getAttribute('data-type') || 'all') === currentFilterType;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  async function loadMedia() {
    if (!grid) return;
    const en = isEnglish();
    grid.replaceChildren();
    loading.classList.remove('adm-d-none');
    empty.classList.add('adm-d-none');

    try {
      const params = new URLSearchParams({
        type: currentFilterType,
        search: currentSearchQuery,
        page: currentPage,
        limit: 24,
        _t: Date.now()
      });

      const res = await fetch(`/admin/api/media?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      const data = await res.json();

      loading.classList.add('adm-d-none');

      if (!data.success || !data.data || data.data.length === 0) {
        empty.classList.remove('adm-d-none');
        pageInfo.textContent = en ? 'Page 1 of 1' : 'Halaman 1 dari 1';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      renderGrid(data.data);

      const p = data.pagination || { page: 1, totalPages: 1 };
      pageInfo.textContent = en
        ? `Page ${p.page} of ${p.totalPages || 1} (${p.total || data.data.length} media)`
        : `Halaman ${p.page} dari ${p.totalPages || 1} (${p.total || data.data.length} media)`;
      prevBtn.disabled = p.page <= 1;
      nextBtn.disabled = p.page >= p.totalPages;
    } catch (err) {
      loading.classList.add('adm-d-none');
      empty.classList.remove('adm-d-none');
      if (window.adminToast) {
        const msg = en ? `Failed to load media list: ${err.message}` : `Gagal memuat daftar media: ${err.message}`;
        window.adminToast('error', msg);
      }
    }
  }

  function createCardPreview(item) {
    const displayName = item.filename || item.original_name || 'Media';
    if (item.media_type === 'image') {
      const img = document.createElement('img');
      img.src = item.file_url;
      img.alt = displayName;
      img.className = 'media-picker-card-thumb';
      img.loading = 'lazy';
      return img;
    }
    if (item.media_type === 'youtube') {
      const ytId = item.youtube_id || (item.file_url && item.file_url.includes('embed/') ? item.file_url.split('embed/')[1] : '');
      if (ytId) {
        const img = document.createElement('img');
        img.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        img.alt = displayName;
        img.className = 'media-picker-card-thumb';
        img.loading = 'lazy';
        return img;
      }
      const ytBox = document.createElement('div');
      ytBox.className = 'adm-picker-card-placeholder adm-picker-card-placeholder--yt';
      ytBox.textContent = 'YT';
      return ytBox;
    }
    const box = document.createElement('div');
    box.className = item.media_type === 'video'
      ? 'adm-picker-card-placeholder adm-picker-card-placeholder--video'
      : 'adm-picker-card-placeholder adm-picker-card-placeholder--doc';
    box.innerHTML = item.media_type === 'video'
      ? '<svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
      : '<svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
    return box;
  }

  function renderGrid(items) {
    grid.innerHTML = '';
    items.forEach(item => {
      const displayName = item.filename || item.original_name || 'Media';
      const card = document.createElement('div');
      card.className = 'media-picker-card';
      card.tabIndex = 0;
      card.setAttribute('data-id', item.id);
      card.setAttribute('data-url', item.file_url);
      card.setAttribute('data-type', item.media_type);
      card.setAttribute('data-name', displayName);

      if (isMultiple) {
        const isSelected = selectedMediaList.some(m => Number(m.id) === Number(item.id));
        if (isSelected) card.classList.add('selected');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'media-picker-checkbox';
        checkbox.checked = isSelected;
        checkbox.setAttribute('aria-label', `Pilih ${displayName}`);
        card.appendChild(checkbox);
      }

      card.appendChild(createCardPreview(item));

      const nameEl = document.createElement('div');
      nameEl.className = 'media-picker-card-name';
      nameEl.title = displayName;
      nameEl.textContent = displayName;
      card.appendChild(nameEl);

      card.addEventListener('click', () => {
        selectCard(card, item);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.classList.contains('media-picker-checkbox')) return;
          e.preventDefault();
          selectCard(card, item);
        }
      });

      card.addEventListener('dblclick', () => {
        if (!isMultiple) {
          selectCard(card, item);
          confirmSelection();
        }
      });

      grid.appendChild(card);
    });
  }

  function selectCard(card, item) {
    if (isMultiple) {
      const idx = selectedMediaList.findIndex(m => Number(m.id) === Number(item.id));
      const checkbox = card ? card.querySelector('.media-picker-checkbox') : null;
      if (idx > -1) {
        selectedMediaList.splice(idx, 1);
        if (card) card.classList.remove('selected');
        if (checkbox) checkbox.checked = false;
      } else {
        selectedMediaList.push(item);
        if (card) card.classList.add('selected');
        if (checkbox) checkbox.checked = true;
      }
      updateConfirmButton();
      updateSelectedInfoMultiple();
      return;
    }

    grid.querySelectorAll('.media-picker-card').forEach(c => c.classList.remove('selected'));
    if (card) card.classList.add('selected');
    selectedMedia = item;
    updateConfirmButton();

    let thumbSrc = item.file_url;
    if (item.media_type === 'youtube') {
      const ytId = item.youtube_id || (item.file_url && item.file_url.includes('embed/') ? item.file_url.split('embed/')[1] : '');
      thumbSrc = ytId ? `https://img.youtube.com/vi/${ytId}/default.jpg` : '';
    }

    if (selectedInfo) {
      const nodes = [];
      if (thumbSrc) {
        const thumbImg = document.createElement('img');
        thumbImg.src = thumbSrc;
        thumbImg.alt = '';
        thumbImg.className = 'media-picker-selected-thumb';
        thumbImg.addEventListener('error', () => thumbImg.classList.add('adm-d-none'));
        nodes.push(thumbImg);
      }
      const meta = document.createElement('div');
      meta.className = 'adm-picker-selected-meta';
      const titleEl = document.createElement('strong');
      titleEl.className = 'adm-picker-selected-name';
      titleEl.textContent = item.filename || item.original_name || 'Media';
      const urlEl = document.createElement('span');
      urlEl.className = 'adm-picker-selected-url';
      urlEl.textContent = item.file_url || '';
      meta.appendChild(titleEl);
      meta.appendChild(urlEl);
      nodes.push(meta);
      selectedInfo.replaceChildren(...nodes);
    }
  }

  function updateSelectedInfoMultiple() {
    if (!selectedInfo) return;
    if (selectedMediaList.length === 0) {
      setEmptySelectionHint();
      return;
    }
    const countSpan = document.createElement('span');
    countSpan.className = 'adm-picker-selected-count';
    countSpan.textContent = isEnglish()
      ? `${selectedMediaList.length} photos selected`
      : `${selectedMediaList.length} foto dipilih`;
    selectedInfo.replaceChildren(countSpan);
  }

  function updateConfirmButton() {
    const en = isEnglish();
    if (isMultiple) {
      confirmBtn.disabled = selectedMediaList.length === 0;
      if (selectedMediaList.length > 0) {
        confirmBtn.textContent = en ? `Select ${selectedMediaList.length} Photos` : `Pilih ${selectedMediaList.length} Foto`;
      } else {
        confirmBtn.textContent = en ? 'Select Photos' : 'Pilih Foto';
      }
    } else {
      confirmBtn.disabled = !selectedMedia;
      confirmBtn.textContent = en ? 'Use This Media' : 'Gunakan Media Ini';
    }
  }

  function confirmSelection() {
    const en = isEnglish();
    if (isMultiple) {
      if (selectedMediaList.length === 0) return;
      if (typeof currentTargetCallback === 'function') {
        currentTargetCallback(selectedMediaList);
      }
      if (window.adminToast) {
        const msg = en ? `${selectedMediaList.length} photos selected.` : `${selectedMediaList.length} foto dipilih.`;
        window.adminToast('success', msg);
      }
      closeModal();
      return;
    }

    if (!selectedMedia) return;

    if (currentTargetInputId) {
      const input = document.getElementById(currentTargetInputId);
      if (input) {
        input.value = selectedMedia.file_url;
        input.dispatchEvent(new Event('change', { bubbles: true }));

        const container = input.closest('.media-picker-component, .form-group');
        if (container) {
          const img = container.querySelector('.media-picker-preview-box img');
          const video = container.querySelector('.media-picker-preview-box video');
          const emptyPlaceholder = container.querySelector('.media-picker-empty');
          const clearBtn = container.querySelector('.btn-clear-media');

          if (selectedMedia.media_type === 'image' && img) {
            img.src = selectedMedia.file_url;
            showPreviewEl(img, 'adm-d-block');
            hidePreviewEl(video);
            hidePreviewEl(emptyPlaceholder);
          } else if (selectedMedia.media_type === 'video' && video) {
            video.src = selectedMedia.file_url;
            showPreviewEl(video, 'adm-d-block');
            hidePreviewEl(img);
            hidePreviewEl(emptyPlaceholder);
          } else if (img) {
            img.src = selectedMedia.file_url;
            showPreviewEl(img, 'adm-d-block');
            hidePreviewEl(emptyPlaceholder);
          }

          showPreviewEl(clearBtn, 'adm-d-inline-flex');
        }
      }
    }

    if (typeof currentTargetCallback === 'function') {
      currentTargetCallback(selectedMedia);
    }

    if (window.adminToast) {
      const label = selectedMedia.filename || (en ? 'file' : 'berkas');
      const msg = en ? `Media "${label}" selected.` : `Media "${label}" dipilih.`;
      window.adminToast('success', msg);
    }

    closeModal();
  }

  function resetPickerUploadUi() {
    uploadProgress.classList.add('adm-d-none');
    if (uploadProgressBar) uploadProgressBar.value = 0;
    if (uploadQueue) {
      uploadQueue.replaceChildren();
      uploadQueue.classList.add('adm-d-none');
    }
    if (uploadSummary) {
      uploadSummary.textContent = '';
      uploadSummary.classList.add('adm-d-none');
      uploadSummary.classList.remove('is-error', 'is-warning', 'is-success');
    }
    if (viewUploadedBtn) viewUploadedBtn.classList.add('adm-d-none');
  }

  function buildQueueRow(file, en) {
    const li = document.createElement('li');
    li.className = 'adm-picker-queue-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'adm-picker-queue-name';
    nameSpan.textContent = file.name;

    const statusSpan = document.createElement('span');
    statusSpan.className = 'adm-picker-queue-status';
    statusSpan.textContent = en ? 'Waiting...' : 'Menunggu...';

    li.appendChild(nameSpan);
    li.appendChild(statusSpan);
    return { li, statusSpan };
  }

  function applyPostUploadSelection(uploadedItems) {
    if (uploadedItems.length === 0) return;
    if (isMultiple) {
      uploadedItems.forEach((item) => {
        if (!selectedMediaList.some((m) => Number(m.id) === Number(item.id))) {
          selectedMediaList.push(item);
        }
      });
      updateConfirmButton();
      updateSelectedInfoMultiple();
    }

    currentFilterType = 'all';
    currentPage = 1;
    currentSearchQuery = '';
    if (searchInput) searchInput.value = '';
    tabs.forEach((t) => t.classList.toggle('active', t.getAttribute('data-type') === 'all'));

    loadMedia().then(() => {
      if (!isMultiple) {
        const lastItem = uploadedItems[uploadedItems.length - 1];
        const uploadedCard = grid.querySelector(`.media-picker-card[data-id="${lastItem.id}"]`);
        selectCard(uploadedCard || null, lastItem);
      }
    });
  }

  function showUploadSummary(summary, en) {
    if (!uploadSummary) return;
    const text = en
      ? `Completed: ${summary.successCount} uploaded, ${summary.failedCount} failed.`
      : `Selesai: ${summary.successCount} berhasil diunggah, ${summary.failedCount} gagal.`;
    uploadSummary.textContent = text;
    uploadSummary.classList.remove('adm-d-none', 'is-error', 'is-warning', 'is-success');
    if (summary.successCount === 0) uploadSummary.classList.add('is-error');
    else if (summary.failedCount > 0) uploadSummary.classList.add('is-warning');
    else uploadSummary.classList.add('is-success');
  }

  async function handleFilesUpload(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0 || !window.EuMediaUpload) return;

    const en = window.EuMediaUpload.isEnglish();
    resetPickerUploadUi();
    uploadProgress.classList.remove('adm-d-none');

    const rows = files.map((f) => buildQueueRow(f, en));
    if (uploadQueue) {
      rows.forEach((r) => uploadQueue.appendChild(r.li));
      uploadQueue.classList.remove('adm-d-none');
    }

    const summary = await window.EuMediaUpload.runUploadQueue(files, {
      onFileStart: (idx, total, file) => {
        if (uploadProgressBar) uploadProgressBar.value = Math.round((idx / total) * 100);
        uploadProgressText.textContent = en
          ? `Uploading ${idx + 1} of ${total}: ${file.name}`
          : `Mengunggah ${idx + 1} dari ${total}: ${file.name}`;
        rows[idx].li.classList.add('is-uploading');
        rows[idx].statusSpan.textContent = en ? 'Uploading...' : 'Mengunggah...';
      },
      onFileDone: (idx, total, entry) => {
        if (uploadProgressBar) uploadProgressBar.value = Math.round(((idx + 1) / total) * 100);
        rows[idx].li.classList.remove('is-uploading');
        rows[idx].li.classList.add(entry.ok ? 'is-success' : 'is-error');
        rows[idx].statusSpan.textContent = entry.ok
          ? (en ? 'Uploaded' : 'Berhasil')
          : entry.message;
      }
    });

    uploadProgressText.textContent = en ? 'Upload queue finished.' : 'Antrean unggahan selesai.';
    showUploadSummary(summary, en);

    if (window.adminToast) {
      const toastType = summary.successCount === 0 ? 'error' : (summary.failedCount > 0 ? 'warning' : 'success');
      window.adminToast(toastType, uploadSummary ? uploadSummary.textContent : uploadProgressText.textContent);
    }

    applyPostUploadSelection(summary.uploadedItems);

    if (summary.failedCount === 0 && summary.uploadedItems.length > 0) {
      setTimeout(() => {
        resetPickerUploadUi();
        switchTab('library');
      }, 600);
    } else if (viewUploadedBtn && summary.uploadedItems.length > 0) {
      viewUploadedBtn.classList.remove('adm-d-none');
    }
  }

  // Tab Events
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      if (targetTab === 'upload') {
        switchTab('upload');
      } else {
        currentFilterType = tab.getAttribute('data-type') || 'all';
        currentPage = 1;
        switchTab('library');
        loadMedia();
      }
    });
  });

  // Search input debounce
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearchQuery = e.target.value.trim();
        currentPage = 1;
        loadMedia();
      }, 300);
    });
  }

  // Pagination buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadMedia();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentPage++;
      loadMedia();
    });
  }
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadMedia();
    });
  }

  // Dropzone drag & drop
  if (dropzone && fileInput) {
    triggerBrowseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!dropzone.contains(e.relatedTarget)) {
        dropzone.classList.remove('is-dragover');
      }
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleFilesUpload(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleFilesUpload(fileInput.files);
        fileInput.value = '';
      }
    });
  }

  if (viewUploadedBtn) {
    viewUploadedBtn.addEventListener('click', () => {
      resetPickerUploadUi();
      switchTab('library');
    });
  }

  // Confirm and Cancel buttons
  if (confirmBtn) confirmBtn.addEventListener('click', confirmSelection);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Global triggers for buttons with data-open-media-picker
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-open-media-picker, [data-open-media-picker]');
    if (btn) {
      e.preventDefault();
      const targetInput = btn.getAttribute('data-target') || btn.getAttribute('data-target-input');
      const filterType = btn.getAttribute('data-picker-type') || 'all';
      openModal({
        targetInputId: targetInput,
        type: filterType
      });
      return;
    }

    const clearBtn = e.target.closest('.btn-clear-media');
    if (clearBtn) {
      e.preventDefault();
      const container = clearBtn.closest('.media-picker-component, .form-group');
      if (container) {
        const input = container.querySelector('input[type="hidden"], input[type="text"]');
        const img = container.querySelector('.media-picker-preview-box img');
        const video = container.querySelector('.media-picker-preview-box video');
        const emptyPlaceholder = container.querySelector('.media-picker-empty');

        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (img) {
          img.src = '';
          hidePreviewEl(img);
        }
        if (video) {
          video.src = '';
          hidePreviewEl(video);
        }
        if (emptyPlaceholder) {
          showPreviewEl(emptyPlaceholder, 'adm-d-flex');
        }
        hidePreviewEl(clearBtn);
      }
    }
  });

  // Soft-warning check on Media Library delete button with SweetAlert2
  document.addEventListener('submit', async function(e) {
    const form = e.target;
    if (!form || !form.matches || !form.matches('form[data-confirm-delete]')) return;
    const mediaUrl = form.getAttribute('data-media-url');
    const mediaId = form.getAttribute('data-media-id');
    if ((!mediaUrl && !mediaId) || form.dataset.forceConfirmed === 'true') return;

    // Check if media is currently in use
    e.preventDefault();
    e.stopPropagation();

    try {
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      const res = await fetch('/admin/api/media/check-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfMeta ? csrfMeta.content : ''
        },
        body: JSON.stringify({ file_url: mediaUrl, media_id: mediaId || null })
      });
      const checkData = await res.json();

      if (checkData.inUse && checkData.usages && checkData.usages.length > 0) {
        const isEn = isEnglish();
        const listItems = checkData.usages
          .map(u => `<li><strong>${escapeHtml(u.source)}:</strong> ${escapeHtml(u.label)}</li>`)
          .join('');
        const warningHtml = `
          <p class="adm-picker-usage-warn">${isEn ? 'Warning: This file is actively used by:' : 'Peringatan: Berkas ini sedang aktif digunakan oleh:'}</p>
          <ul class="adm-picker-usage-list">${listItems}</ul>
          <p class="adm-picker-usage-note">${isEn ? 'Deleting this file may cause broken images or links on public pages.' : 'Menghapus berkas ini dapat menyebabkan tampilan gambar kosong (broken link) pada halaman publik.'}</p>
        `;

        const confirmed = window.showAdminConfirm
          ? await window.showAdminConfirm({
              title: isEn ? 'Media Is In Use!' : 'Media Sedang Digunakan!',
              text: warningHtml,
              isDanger: true,
              confirmButtonText: `<svg class="adm-btn-icon adm-btn-icon-trash" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> <span>${isEn ? 'Force Delete' : 'Tetap Hapus'}</span>`,
              cancelButtonText: `<svg class="adm-btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <span>${isEn ? 'Cancel' : 'Batal'}</span>`
            })
          : false;

        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (confirmed) {
          if (submitBtn) {
            submitBtn.classList.add('is-loading');
            submitBtn.disabled = true;
          }
          form.dataset.forceConfirmed = 'true';
          let action = form.getAttribute('action') || '';
          action += (action.includes('?') ? '&' : '?') + 'force=true';
          form.setAttribute('action', action);
          form.submit();
        } else if (submitBtn) {
          submitBtn.classList.remove('is-loading');
          submitBtn.disabled = false;
        }
        return;
      }
    } catch {
      // Continue to default delete confirm if check fails
    }

    // Default confirm if not in use
    form.dataset.forceConfirmed = 'true';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    delete form.dataset.forceConfirmed;
  }, true);

  // Expose global API
  window.openMediaPicker = openModal;
  window.closeMediaPicker = closeModal;
})();
