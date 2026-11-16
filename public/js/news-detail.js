(function () {
  'use strict';

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function updateLiveStatus(message) {
    const statusEl = document.getElementById('nwdCopyStatus');
    if (!statusEl) return;
    statusEl.textContent = '';
    window.requestAnimationFrame(function () {
      statusEl.textContent = message;
    });
  }

  function bindToastHoverTimers(toastEl) {
    if (!toastEl || typeof Swal === 'undefined') return;
    toastEl.addEventListener('mouseenter', Swal.stopTimer);
    toastEl.addEventListener('mouseleave', Swal.resumeTimer);
  }

  function fireCopyToast(isSuccess, message) {
    updateLiveStatus(message);
    if (typeof Swal === 'undefined') return;

    const variantClass = isSuccess ? 'nwd-swal-success' : 'nwd-swal-error';
    const motionOpts = prefersReducedMotion()
      ? { showClass: { popup: '' }, hideClass: { popup: '' } }
      : {};

    const Toast = Swal.mixin(Object.assign({
      toast: true,
      position: 'top-end',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        container: 'nwd-swal-container',
        popup: 'nwd-swal-popup nwd-swal-toast ' + variantClass,
        title: 'nwd-swal-title',
        closeButton: 'nwd-swal-close',
        timerProgressBar: 'nwd-swal-progress'
      },
      didOpen: bindToastHoverTimers
    }, motionOpts));

    Toast.fire({
      icon: isSuccess ? 'success' : 'error',
      title: message
    });
  }

  function fallbackCopy(text) {
    if (!text) return false;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.className = 'sr-only';
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus({ preventScroll: true });
    ta.select();
    let copied;
    try {
      copied = Boolean(document.execCommand('copy'));
    } catch {
      copied = false;
    }
    document.body.removeChild(ta);
    return copied;
  }

  function copyShareText(url) {
    if (!url) return Promise.resolve(false);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(url).then(
        function () {
          return true;
        },
        function () {
          return fallbackCopy(url);
        }
      );
    }
    return Promise.resolve(fallbackCopy(url));
  }

  function initCopyLinkButton() {
    const copyBtn = document.getElementById('copyLinkBtn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', function () {
      const url = copyBtn.getAttribute('data-share-url') || window.location.href;
      const successMsg = copyBtn.getAttribute('data-copied-msg') || 'Link copied!';
      const errorMsg = copyBtn.getAttribute('data-copy-error-msg') || 'Failed to copy link.';

      copyShareText(url).then(function (ok) {
        fireCopyToast(ok, ok ? successMsg : errorMsg);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initCopyLinkButton);
})();
