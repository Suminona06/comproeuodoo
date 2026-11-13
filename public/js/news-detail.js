(function initNewsDetail() {
  const copyBtn = document.getElementById('copyLinkBtn');
  if (!copyBtn) return;

  function fallbackCopy(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.className = 'sr-only';
    document.body.appendChild(el);
    el.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(el);
    }
  }

  copyBtn.addEventListener('click', () => {
    const shareUrl = copyBtn.dataset.shareUrl || window.location.href;
    const msg = copyBtn.dataset.copiedMsg || '';
    const notify = () => {
      if (msg) window.alert(msg);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(notify)
        .catch(() => {
          if (fallbackCopy(shareUrl)) notify();
        });
      return;
    }

    if (fallbackCopy(shareUrl)) notify();
  });
})();
