/**
 * Media Library Admin Script
 * Handles YouTube video preview and dynamic media interactions
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYoutubePreview);
  } else {
    initYoutubePreview();
  }
})();

