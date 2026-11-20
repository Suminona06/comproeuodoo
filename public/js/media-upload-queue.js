(function () {
  'use strict';

  const MAX_FILE_SIZE = 30 * 1024 * 1024;
  const SVG_NAME_RE = /\.svgz?$/i;

  function isEnglish() {
    return (document.documentElement.lang || 'id').toLowerCase().startsWith('en');
  }

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta && meta.content) return meta.content;
    const input = document.querySelector('input[name="_csrf"]');
    return input ? input.value : '';
  }

  function isSvgFile(file) {
    const name = String(file.name || '');
    const mime = String(file.type || '').toLowerCase();
    return SVG_NAME_RE.test(name) || mime.includes('svg');
  }

  function validateMediaFile(file) {
    const en = isEnglish();
    if (!file) {
      return { ok: false, message: en ? 'File not found.' : 'Berkas tidak ditemukan.' };
    }
    if (isSvgFile(file)) {
      return {
        ok: false,
        message: en ? 'SVG format is blocked for security.' : 'Format SVG tidak diizinkan demi keamanan.'
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        ok: false,
        message: en ? 'File exceeds the 30 MB limit.' : 'Ukuran berkas melebihi batas maksimal 30 MB.'
      };
    }
    return { ok: true };
  }

  function formatUploadFailMessage(data, en) {
    return (data && data.message) || (en ? 'Failed to upload file.' : 'Gagal mengunggah berkas.');
  }

  function formatNetworkError(err, en) {
    const fallback = en ? 'Network error while uploading.' : 'Gangguan jaringan saat mengunggah.';
    return (err && err.message) ? err.message : fallback;
  }

  async function uploadSingleFile(file) {
    const en = isEnglish();
    const token = getCsrfToken();
    const formData = new FormData();
    formData.append('file', file);
    if (token) formData.append('_csrf', token);

    try {
      const res = await fetch('/admin/api/media/upload', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'X-CSRF-Token': token },
        body: formData
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) return { ok: true, media: data.data };
      return { ok: false, message: formatUploadFailMessage(data, en) };
    } catch (err) {
      return { ok: false, message: formatNetworkError(err, en) };
    }
  }

  async function processSingleItem(index, total, file, callbacks) {
    if (typeof callbacks.onFileStart === 'function') {
      callbacks.onFileStart(index, total, file);
    }
    const check = validateMediaFile(file);
    const outcome = check.ok ? await uploadSingleFile(file) : check;
    const entry = {
      index,
      file,
      ok: outcome.ok,
      media: outcome.media || null,
      message: outcome.message || ''
    };
    if (typeof callbacks.onFileDone === 'function') {
      callbacks.onFileDone(index, total, entry);
    }
    return entry;
  }

  function recordQueueResult(entry, state) {
    state.results.push(entry);
    if (!entry.ok) {
      state.failedCount++;
      return;
    }
    state.successCount++;
    if (entry.media) state.uploadedItems.push(entry.media);
  }

  async function runUploadQueue(rawFiles, callbacks = {}) {
    const files = Array.from(rawFiles || []);
    const state = { uploadedItems: [], results: [], successCount: 0, failedCount: 0 };

    for (let i = 0; i < files.length; i++) {
      const entry = await processSingleItem(i, files.length, files[i], callbacks);
      recordQueueResult(entry, state);
    }

    return { ...state, total: files.length };
  }

  window.EuMediaUpload = {
    MAX_FILE_SIZE,
    isEnglish,
    getCsrfToken,
    validateMediaFile,
    uploadSingleFile,
    runUploadQueue
  };
})();
