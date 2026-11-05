/**
 * Admin Hero Banners Management Client Script
 * Handles multi-source media switching (Image, Video, YouTube) and live YouTube embed preview.
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

  function previewBannerYoutube(url) {
    const wrap = document.getElementById('bannerYtPreview');
    const iframe = document.getElementById('bannerYtIframe');
    if (!wrap || !iframe) return;

    const ytId = extractYoutubeId(url);
    if (ytId) {
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + ytId;
      wrap.classList.remove('adm-d-none');
      wrap.style.display = 'block';
    } else {
      wrap.classList.add('adm-d-none');
      wrap.style.display = 'none';
      iframe.src = '';
    }
  }

  function setElementDisplay(el, isVisible) {
    if (!el) return;
    if (isVisible) {
      el.classList.remove('adm-d-none');
      el.style.display = 'block';
    } else {
      el.classList.add('adm-d-none');
      el.style.display = 'none';
    }
  }

  function toggleBannerSource(type) {
    const groupMediaPicker = document.getElementById('groupMediaPicker');
    const groupYouTube = document.getElementById('groupYouTubeInput');
    const groupPoster = document.getElementById('groupPosterPicker');
    const btnPicker = document.getElementById('btnBannerOpenPicker');

    if (type === 'youtube') {
      setElementDisplay(groupMediaPicker, false);
      setElementDisplay(groupYouTube, true);
      setElementDisplay(groupPoster, true);
      return;
    }

    if (type === 'video') {
      setElementDisplay(groupMediaPicker, true);
      setElementDisplay(groupYouTube, false);
      setElementDisplay(groupPoster, true);
      if (btnPicker) btnPicker.setAttribute('data-picker-type', 'video');
      return;
    }

    // Default: image
    setElementDisplay(groupMediaPicker, true);
    setElementDisplay(groupYouTube, false);
    setElementDisplay(groupPoster, false);
    if (btnPicker) btnPicker.setAttribute('data-picker-type', 'image');
  }

  function initBannerForm() {
    const mediaTypeSelect = document.getElementById('media_type');
    if (mediaTypeSelect) {
      mediaTypeSelect.addEventListener('change', (e) => {
        toggleBannerSource(e.target.value);
      });
      toggleBannerSource(mediaTypeSelect.value);
    }

    const ytInput = document.getElementById('youtube_url');
    if (ytInput) {
      ytInput.addEventListener('input', (e) => {
        previewBannerYoutube(e.target.value);
      });
      if (ytInput.value) {
        previewBannerYoutube(ytInput.value);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBannerForm);
  } else {
    initBannerForm();
  }
})();
