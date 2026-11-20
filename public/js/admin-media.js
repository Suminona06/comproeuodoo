/**
 * Media Library Admin Script
 * Handles YouTube video preview and sequential multi-upload interactions
 */

(function() {
  'use strict';

  function extractYoutubeId(url) {
    if (!url) return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = trimmed.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  }

  function previewYoutube(url) {
    const wrap = document.getElementById('ytPreviewWrap');
    const iframe = document.getElementById('ytIframe');
    if (!wrap || !iframe) return;

    const ytId = extractYoutubeId(url);
    if (!ytId) {
      wrap.style.display = 'none';
      iframe.src = '';
      return;
    }

    iframe.src = 'https://www.youtube-nocookie.com/embed/' + ytId;
    wrap.style.display = 'block';
  }

  function initYoutubePreview() {
    const ytInput = document.getElementById('youtube_url');
    if (!ytInput) return;

    ytInput.addEventListener('input', (e) => {
      previewYoutube(e.target.value);
    });

    if (ytInput.value) {
      previewYoutube(ytInput.value);
    }
  }

  function buildMediaQueueItem(file, en) {
    const li = document.createElement('li');
    li.className = 'adm-picker-queue-item';
    const nameEl = document.createElement('span');
    nameEl.className = 'adm-picker-queue-name';
    nameEl.textContent = file.name;
    const statusEl = document.createElement('span');
    statusEl.className = 'adm-picker-queue-status';
    statusEl.textContent = en ? 'Waiting...' : 'Menunggu...';
    li.appendChild(nameEl);
    li.appendChild(statusEl);
    return { li, statusEl };
  }

  function resetUploadButton(form) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }

  function renderMediaSummary(summaryEl, summary, en) {
    if (!summaryEl) return;
    summaryEl.textContent = en
      ? `Completed: ${summary.successCount} uploaded, ${summary.failedCount} failed.`
      : `Selesai: ${summary.successCount} berhasil diunggah, ${summary.failedCount} gagal.`;
    summaryEl.classList.remove('adm-d-none', 'is-error', 'is-warning', 'is-success');
    if (summary.successCount === 0) summaryEl.classList.add('is-error');
    else if (summary.failedCount > 0) summaryEl.classList.add('is-warning');
    else summaryEl.classList.add('is-success');
  }

  function bindPartialReload(getFlag) {
    const modal = document.getElementById('uploadModal');
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      const isClose = e.target === modal || Boolean(e.target.closest('[data-modal-close="uploadModal"]'));
      if (getFlag() && isClose) window.location.reload();
    });
  }

  function createProgressCallbacks(els, rows, en) {
    return {
      onFileStart: (idx, total, file) => {
        if (els.progressBar) els.progressBar.value = Math.round((idx / total) * 100);
        if (els.progressText) {
          els.progressText.textContent = en
            ? `Uploading ${idx + 1} of ${total}: ${file.name}`
            : `Mengunggah ${idx + 1} dari ${total}: ${file.name}`;
        }
        rows[idx].li.classList.add('is-uploading');
        rows[idx].statusEl.textContent = en ? 'Uploading...' : 'Mengunggah...';
      },
      onFileDone: (idx, total, entry) => {
        if (els.progressBar) els.progressBar.value = Math.round(((idx + 1) / total) * 100);
        rows[idx].li.classList.remove('is-uploading');
        rows[idx].li.classList.add(entry.ok ? 'is-success' : 'is-error');
        rows[idx].statusEl.textContent = entry.ok ? (en ? 'Uploaded' : 'Berhasil') : entry.message;
      }
    };
  }

  async function executeMultiUpload(form, fileInput, els, markPartial) {
    const files = Array.from(fileInput.files);
    const en = window.EuMediaUpload.isEnglish();

    if (els.progressWrap) els.progressWrap.classList.remove('adm-d-none');
    if (els.summaryEl) els.summaryEl.classList.add('adm-d-none');

    const rows = files.map((f) => buildMediaQueueItem(f, en));
    if (els.queueEl) {
      els.queueEl.replaceChildren(...rows.map((r) => r.li));
      els.queueEl.classList.remove('adm-d-none');
    }

    const summary = await window.EuMediaUpload.runUploadQueue(files, createProgressCallbacks(els, rows, en));
    resetUploadButton(form);
    renderMediaSummary(els.summaryEl, summary, en);

    if (summary.failedCount === 0 && summary.successCount > 0) {
      const msg = en
        ? `${summary.successCount} media files uploaded.`
        : `${summary.successCount} berkas media berhasil diunggah.`;
      window.location.href = `/admin/media?success=${encodeURIComponent(msg)}`;
      return;
    }
    if (summary.successCount > 0) markPartial();
  }

  function initMultiUploadForm() {
    const form = document.getElementById('mediaLibraryUploadForm');
    const fileInput = document.getElementById('file');
    if (!form || !fileInput) return;

    const els = {
      progressWrap: document.getElementById('mediaUploadProgress'),
      progressText: document.getElementById('mediaUploadProgressText'),
      progressBar: document.getElementById('mediaUploadProgressBar'),
      summaryEl: document.getElementById('mediaUploadSummary'),
      queueEl: document.getElementById('mediaUploadQueue')
    };
    let uploadedAnyOnPartial = false;
    bindPartialReload(() => uploadedAnyOnPartial);

    form.addEventListener('submit', async (e) => {
      if (!window.EuMediaUpload || !fileInput.files || fileInput.files.length === 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      await executeMultiUpload(form, fileInput, els, () => { uploadedAnyOnPartial = true; });
    });
  }

  function initMediaAdminPage() {
    initYoutubePreview();
    initMultiUploadForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMediaAdminPage);
  } else {
    initMediaAdminPage();
  }
})();
