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

  function openModal(options = {}) {
    currentTargetInputId = options.targetInputId || null;
    currentTargetCallback = options.onSelect || null;
    currentFilterType = options.type || 'all';
    currentPage = 1;
    selectedMedia = null;
    updateConfirmButton();

    // Activate the appropriate tab
    tabs.forEach(tab => {
      const tabType = tab.getAttribute('data-type');
      if (tabType === currentFilterType || (currentFilterType === 'all' && tabType === 'all')) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    switchTab('library');
    loadMedia();

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    currentTargetInputId = null;
    currentTargetCallback = null;
    selectedMedia = null;
  }

  function switchTab(tabName) {
    if (tabName === 'upload') {
      tabLibrary.style.display = 'none';
      tabUpload.style.display = 'block';
    } else {
      tabLibrary.style.display = 'block';
      tabUpload.style.display = 'none';
    }
  }

  async function loadMedia() {
    if (!grid) return;
    grid.innerHTML = '';
    loading.style.display = 'block';
    empty.style.display = 'none';

    try {
      const params = new URLSearchParams({
        type: currentFilterType,
        search: currentSearchQuery,
        page: currentPage,
        limit: 24
      });

      const res = await fetch(`/admin/api/media?${params.toString()}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      loading.style.display = 'none';

      if (!data.success || !data.data || data.data.length === 0) {
        empty.style.display = 'block';
        pageInfo.textContent = 'Halaman 1 dari 1';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      renderGrid(data.data);

      const p = data.pagination || { page: 1, totalPages: 1 };
      pageInfo.textContent = `Halaman ${p.page} dari ${p.totalPages || 1} (${p.total || data.data.length} media)`;
      prevBtn.disabled = p.page <= 1;
      nextBtn.disabled = p.page >= p.totalPages;
    } catch (err) {
      loading.style.display = 'none';
      empty.style.display = 'block';
      if (window.adminToast) window.adminToast('error', 'Gagal memuat daftar media: ' + err.message);
    }
  }

  function renderGrid(items) {
    grid.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'media-picker-card';
      card.setAttribute('data-id', item.id);
      card.setAttribute('data-url', item.file_url);
      card.setAttribute('data-type', item.media_type);
      card.setAttribute('data-name', item.filename || item.original_name);

      let mediaHtml = '';
      if (item.media_type === 'image') {
        mediaHtml = `<img src="${item.file_url}" alt="${item.filename}" class="media-picker-card-thumb" loading="lazy">`;
      } else if (item.media_type === 'video') {
        mediaHtml = `
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #0f172a; color: #38bdf8;">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        `;
      } else if (item.media_type === 'youtube') {
        const ytId = item.youtube_id || (item.file_url.includes('embed/') ? item.file_url.split('embed/')[1] : '');
        const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
        mediaHtml = ytThumb
          ? `<img src="${ytThumb}" alt="${item.filename}" class="media-picker-card-thumb" loading="lazy">`
          : `<div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #991b1b; color: #fff;">YT</div>`;
      } else {
        mediaHtml = `
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #64748b;">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
        `;
      }

      card.innerHTML = `
        ${mediaHtml}
        <div class="media-picker-card-name" title="${item.filename || item.original_name}">
          ${item.filename || item.original_name}
        </div>
      `;

      card.addEventListener('click', () => {
        selectCard(card, item);
      });

      card.addEventListener('dblclick', () => {
        selectCard(card, item);
        confirmSelection();
      });

      grid.appendChild(card);
    });
  }

  function selectCard(card, item) {
    grid.querySelectorAll('.media-picker-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedMedia = item;
    updateConfirmButton();

    let thumbSrc = item.file_url;
    if (item.media_type === 'youtube') {
      const ytId = item.youtube_id || (item.file_url.includes('embed/') ? item.file_url.split('embed/')[1] : '');
      thumbSrc = ytId ? `https://img.youtube.com/vi/${ytId}/default.jpg` : '';
    }

    selectedInfo.innerHTML = `
      <img src="${thumbSrc}" class="media-picker-selected-thumb" onerror="this.style.display='none'">
      <div style="overflow: hidden;">
        <strong style="color: var(--secondary, #0d2040); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px;">${item.filename || item.original_name}</strong>
        <span style="font-size: 11.5px; color: #64748b; font-family: monospace;">${item.file_url}</span>
      </div>
    `;
  }

  function updateConfirmButton() {
    confirmBtn.disabled = !selectedMedia;
  }

  function confirmSelection() {
    if (!selectedMedia) return;

    if (currentTargetInputId) {
      const input = document.getElementById(currentTargetInputId);
      if (input) {
        input.value = selectedMedia.file_url;
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Check if there is a preview box attached to this input
        const container = input.closest('.media-picker-component, .form-group');
        if (container) {
          const img = container.querySelector('.media-picker-preview-box img');
          const video = container.querySelector('.media-picker-preview-box video');
          const emptyPlaceholder = container.querySelector('.media-picker-empty');
          const clearBtn = container.querySelector('.btn-clear-media');

          if (selectedMedia.media_type === 'image' && img) {
            img.src = selectedMedia.file_url;
            img.style.display = 'block';
            if (video) video.style.display = 'none';
            if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';
          } else if (selectedMedia.media_type === 'video' && video) {
            video.src = selectedMedia.file_url;
            video.style.display = 'block';
            if (img) img.style.display = 'none';
            if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';
          } else if (img) {
            img.src = selectedMedia.file_url;
            img.style.display = 'block';
            if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';
          }

          if (clearBtn) clearBtn.style.display = 'inline-flex';
        }
      }
    }

    if (typeof currentTargetCallback === 'function') {
      currentTargetCallback(selectedMedia);
    }

    if (window.adminToast) {
      window.adminToast('success', `Media "${selectedMedia.filename || 'berkas'}" dipilih.`);
    }

    closeModal();
  }

  // Upload Handler
  async function handleFileUpload(file) {
    if (!file) return;

    uploadProgress.style.display = 'block';
    uploadProgressBar.style.width = '35%';
    uploadProgressText.textContent = `Mengunggah ${file.name}...`;

    const formData = new FormData();
    formData.append('file', file);

    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta && csrfMeta.content) {
      formData.append('_csrf', csrfMeta.content);
    }

    try {
      const res = await fetch('/admin/api/media/upload', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfMeta ? csrfMeta.content : ''
        },
        body: formData
      });

      uploadProgressBar.style.width = '85%';
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengunggah berkas.');
      }

      uploadProgressBar.style.width = '100%';
      uploadProgressText.textContent = 'Unggahan selesai!';

      setTimeout(() => {
        uploadProgress.style.display = 'none';
        uploadProgressBar.style.width = '0%';
        switchTab('library');
        currentFilterType = 'all';
        tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-type') === 'all'));
        loadMedia().then(() => {
          if (data.data) {
            const uploadedCard = grid.querySelector(`.media-picker-card[data-id="${data.data.id}"]`);
            if (uploadedCard) selectCard(uploadedCard, data.data);
          }
        });
      }, 600);
    } catch (err) {
      uploadProgress.style.display = 'none';
      if (window.adminToast) {
        window.adminToast('error', err.message || 'Gagal mengunggah file.');
      } else {
        alert(err.message);
      }
    }
  }

  // Tab Events
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetTab = tab.getAttribute('data-tab');
      if (targetTab === 'upload') {
        switchTab('upload');
      } else {
        switchTab('library');
        currentFilterType = tab.getAttribute('data-type') || 'all';
        currentPage = 1;
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
      dropzone.style.borderColor = 'var(--secondary, #0d2040)';
      dropzone.style.background = '#eef2ff';
    });
    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--primary, #0055b8)';
      dropzone.style.background = '#f8fafc';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--primary, #0055b8)';
      dropzone.style.background = '#f8fafc';
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleFileUpload(fileInput.files[0]);
        fileInput.value = '';
      }
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
          img.style.display = 'none';
        }
        if (video) {
          video.src = '';
          video.style.display = 'none';
        }
        if (emptyPlaceholder) emptyPlaceholder.style.display = 'flex';
        clearBtn.style.display = 'none';
      }
    }
  });

  // Soft-warning check on Media Library delete button with SweetAlert2
  document.addEventListener('submit', async function(e) {
    const form = e.target;
    if (!form || !form.matches || !form.matches('form[data-confirm-delete]')) return;
    const mediaUrl = form.getAttribute('data-media-url');
    if (!mediaUrl || form.dataset.forceConfirmed === 'true') return;

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
        body: JSON.stringify({ file_url: mediaUrl })
      });
      const checkData = await res.json();

      if (checkData.inUse && checkData.usages && checkData.usages.length > 0) {
        // Option 3 Pilihan B: Soft Warning with Force Delete
        const listItems = checkData.usages.map(u => `<li><strong>${u.source}:</strong> ${u.label}</li>`).join('');
        const warningHtml = `
          <p style="margin-bottom: 0.75rem; text-align: left; color: #dc2626; font-weight: 600;">
            ⚠️ Peringatan: Berkas ini sedang aktif digunakan oleh:
          </p>
          <ul style="text-align: left; margin: 0 0 1rem 1.25rem; font-size: 0.85rem; color: #334155; line-height: 1.6;">
            ${listItems}
          </ul>
          <p style="text-align: left; font-size: 0.85rem; color: #64748b;">
            Menghapus berkas ini dapat menyebabkan tampilan gambar kosong (broken link) pada halaman publik.
          </p>
        `;

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: 'Media Sedang Digunakan!',
            html: warningHtml,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#0D2040',
            confirmButtonText: 'Tetap Hapus (Paksa Hapus)',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            focusCancel: true,
            customClass: {
              popup: 'swal2-custom-popup',
              title: 'swal2-custom-title',
              confirmButton: 'swal2-custom-confirm-btn',
              cancelButton: 'swal2-custom-cancel-btn'
            }
          }).then((result) => {
            if (result.isConfirmed) {
              form.dataset.forceConfirmed = 'true';
              let action = form.getAttribute('action') || '';
              action += (action.includes('?') ? '&' : '?') + 'force=true';
              form.setAttribute('action', action);
              form.submit();
            }
          });
        } else {
          if (confirm('Media ini sedang digunakan pada entitas lain! Tetap paksa hapus?')) {
            form.dataset.forceConfirmed = 'true';
            let action = form.getAttribute('action') || '';
            action += (action.includes('?') ? '&' : '?') + 'force=true';
            form.setAttribute('action', action);
            form.submit();
          }
        }
        return;
      }
    } catch (err) {
      // Continue to default delete confirm if check fails
    }

    // Default confirm if not in use
    form.dataset.forceConfirmed = 'true';
    form.dispatchEvent(new Event('submit'));
  }, true);

  // Expose global API
  window.openMediaPicker = openModal;
  window.closeMediaPicker = closeModal;
})();
