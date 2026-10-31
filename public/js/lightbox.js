(function () {
  'use strict';

  var activeInstance = null;
  var imageDimCache = Object.create(null);

  var I18N = {
    id: {
      dialogLabel: 'Galeri foto layar penuh',
      zoomIn: 'Perbesar foto',
      zoomOut: 'Perkecil foto',
      prev: 'Foto sebelumnya',
      next: 'Foto berikutnya',
      close: 'Tutup galeri',
      errorMsg: 'Foto tidak dapat dimuat'
    },
    en: {
      dialogLabel: 'Fullscreen photo gallery',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      prev: 'Previous photo',
      next: 'Next photo',
      close: 'Close gallery',
      errorMsg: 'The image cannot be loaded'
    }
  };

  function resolveLang(overrideLang) {
    var raw = (overrideLang || document.documentElement.lang || 'id').toLowerCase();
    return raw.indexOf('en') === 0 ? 'en' : 'id';
  }

  function isReducedMotionPreferred() {
    return Boolean(
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function normalizeUrlKey(src) {
    if (!src) return '';
    try {
      var u = new URL(src, window.location.origin);
      return u.pathname + u.search;
    } catch (_e) {
      return String(src);
    }
  }

  function computeScaledSize(naturalW, naturalH) {
    var w = Number(naturalW) || 1600;
    var h = Number(naturalH) || 1200;
    var targetMax = 2400;
    var maxSide = Math.max(w, h);
    if (maxSide <= 0) {
      return { width: 2000, height: 1500 };
    }
    var scale = targetMax / maxSide;
    return {
      width: Math.round(w * scale),
      height: Math.round(h * scale)
    };
  }

  function findMatchingDomImageDims(src) {
    var key = normalizeUrlKey(src);
    if (!key) return null;
    if (imageDimCache[key]) return imageDimCache[key];

    var allImgs = document.images ? Array.from(document.images) : [];
    for (var i = 0; i < allImgs.length; i++) {
      var img = allImgs[i];
      var imgSrc = img.currentSrc || img.getAttribute('src') || '';
      if (
        normalizeUrlKey(imgSrc) === key &&
        img.complete &&
        img.naturalWidth > 0 &&
        img.naturalHeight > 0
      ) {
        var found = { width: img.naturalWidth, height: img.naturalHeight };
        imageDimCache[key] = found;
        return found;
      }
    }
    return null;
  }

  function normalizeSlides(rawItems) {
    if (!Array.isArray(rawItems)) return [];
    return rawItems
      .map(function (item) {
        if (!item) return null;
        var src = item.src || item.image_url || item.image || item.url || '';
        if (!src) return null;

        var naturalW = Number(item.width || item.w) || 0;
        var naturalH = Number(item.height || item.h) || 0;

        if (!naturalW || !naturalH) {
          var cachedOrDom = findMatchingDomImageDims(src);
          if (cachedOrDom) {
            naturalW = cachedOrDom.width;
            naturalH = cachedOrDom.height;
          } else if (item.element) {
            var imgEl =
              item.element.tagName === 'IMG'
                ? item.element
                : item.element.querySelector && item.element.querySelector('img');
            var elSrc = imgEl ? imgEl.currentSrc || imgEl.getAttribute('src') || '' : '';
            if (
              imgEl &&
              normalizeUrlKey(elSrc) === normalizeUrlKey(src) &&
              imgEl.naturalWidth > 0 &&
              imgEl.naturalHeight > 0
            ) {
              naturalW = imgEl.naturalWidth;
              naturalH = imgEl.naturalHeight;
              imageDimCache[normalizeUrlKey(src)] = { width: naturalW, height: naturalH };
            }
          }
        }

        var hasExact = Boolean(naturalW > 0 && naturalH > 0);
        var dims = computeScaledSize(naturalW || 1600, naturalH || 1200);
        var title = item.title || item.caption || item.alt || '';
        var category = item.category || '';

        return {
          src: src,
          msrc: item.msrc || src,
          width: dims.width,
          height: dims.height,
          w: dims.width,
          h: dims.height,
          alt: item.alt || title || '',
          title: title,
          category: category,
          element: item.element || null,
          hasExactAspect: hasExact
        };
      })
      .filter(Boolean);
  }

  function applyExactDimensionsToSlide(pswp, slideIndex, slideData, naturalW, naturalH, zoomInBtn, zoomOutBtn) {
    if (!naturalW || !naturalH || !slideData) return;
    var key = normalizeUrlKey(slideData.src);
    if (key) {
      imageDimCache[key] = { width: naturalW, height: naturalH };
    }

    var exact = computeScaledSize(naturalW, naturalH);
    var changed =
      !slideData.hasExactAspect ||
      slideData.width !== exact.width ||
      slideData.height !== exact.height;

    slideData.hasExactAspect = true;
    slideData.width = exact.width;
    slideData.height = exact.height;
    slideData.w = exact.width;
    slideData.h = exact.height;

    if (!pswp || pswp.isDestroying) return;

    if (pswp.contentLoader && typeof pswp.contentLoader.getContentByIndex === 'function') {
      var cachedContent = pswp.contentLoader.getContentByIndex(slideIndex);
      if (cachedContent) {
        cachedContent.width = exact.width;
        cachedContent.height = exact.height;
      }
    }

    if (pswp.mainScroll && Array.isArray(pswp.mainScroll.itemHolders)) {
      pswp.mainScroll.itemHolders.forEach(function (holder) {
        if (holder && holder.slide && holder.slide.index === slideIndex) {
          var s = holder.slide;
          var slideMismatch = s.width !== exact.width || s.height !== exact.height;
          s.width = exact.width;
          s.height = exact.height;
          if (s.content) {
            s.content.width = exact.width;
            s.content.height = exact.height;
          }
          if (changed || slideMismatch) {
            s.prevDisplayedWidth = -1;
            s.prevDisplayedHeight = -1;
            s.currentResolution = 0;
            s.calculateSize();
            s.zoomAndPanToInitial();
            s.applyCurrentZoomPan();
            s.updateContentSize(true);
          }
        }
      });
    }

    if (pswp.currSlide && pswp.currSlide.index === slideIndex) {
      syncZoomButtonState(pswp, zoomInBtn, zoomOutBtn);
    }
  }

  function preloadAndSyncSlideDimensions(pswp, slides, zoomInBtn, zoomOutBtn) {
    slides.forEach(function (slideData, idx) {
      if (slideData.hasExactAspect) return;
      var probe = new Image();
      probe.onload = function () {
        if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
          applyExactDimensionsToSlide(
            pswp,
            idx,
            slideData,
            probe.naturalWidth,
            probe.naturalHeight,
            zoomInBtn,
            zoomOutBtn
          );
        }
      };
      probe.src = slideData.src;
    });
  }

  function stepZoom(pswp, direction, reducedMotion) {
    if (!pswp || !pswp.currSlide) return;
    var slide = pswp.currSlide;
    var zl = slide.zoomLevels;
    if (!zl) return;

    var curr = slide.currZoomLevel;
    var initial = zl.initial;
    var secondary = Math.max(zl.secondary, initial * 1.8);
    var max = Math.max(zl.max, initial * 3.2);
    var dest = curr;

    if (direction > 0) {
      if (curr < secondary - 0.02) {
        dest = secondary;
      } else {
        dest = max;
      }
    } else {
      if (curr <= secondary + 0.05) {
        dest = initial;
      } else {
        dest = secondary;
      }
    }

    var duration = reducedMotion ? 0 : 220;
    slide.zoomTo(dest, pswp.getViewportCenterPoint(), duration);
  }

  function syncZoomButtonState(pswp, zoomInBtn, zoomOutBtn) {
    if (!pswp || !pswp.currSlide) return;
    var slide = pswp.currSlide;
    var zl = slide.zoomLevels;
    if (!zl) return;

    var curr = slide.currZoomLevel;
    var initial = zl.initial;
    var max = Math.max(zl.max, initial * 3.2);
    var atMin = curr <= initial + 0.01;
    var atMax = curr >= max - 0.01;

    if (zoomOutBtn) {
      zoomOutBtn.disabled = atMin;
      zoomOutBtn.setAttribute('aria-disabled', atMin ? 'true' : 'false');
    }
    if (zoomInBtn) {
      zoomInBtn.disabled = atMax;
      zoomInBtn.setAttribute('aria-disabled', atMax ? 'true' : 'false');
    }
    if (pswp.element) {
      pswp.element.classList.toggle('pswp--zoomed-in', !atMin);
    }
  }

  function createIconButton(className, label, svgInner, onClick) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pswp__button lbx-btn ' + className;
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + svgInner + '</svg>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    });
    return btn;
  }

  function openLightbox(rawItems, startIndex, triggerEl, options) {
    var PhotoSwipeCtor = window.PhotoSwipe;
    if (typeof PhotoSwipeCtor !== 'function') return null;

    var slides = normalizeSlides(rawItems);
    if (!slides.length) return null;

    if (activeInstance) {
      try {
        activeInstance.close();
      } catch (_e) {}
      activeInstance = null;
    }

    var opts = options || {};
    var lang = resolveLang(opts.lang);
    var labels = I18N[lang] || I18N.id;
    var reducedMotion = isReducedMotionPreferred();
    var safeIndex = Number(startIndex) || 0;
    if (safeIndex < 0 || safeIndex >= slides.length) {
      safeIndex = 0;
    }

    var pswp = new PhotoSwipeCtor({
      dataSource: slides,
      index: safeIndex,
      mainClass: 'lbx-root',
      bgOpacity: 0.94,
      loop: slides.length > 1,
      pinchToClose: true,
      closeOnVerticalDrag: true,
      allowPanToNext: true,
      escKey: true,
      arrowKeys: true,
      trapFocus: true,
      returnFocus: false,
      zoom: false,
      close: false,
      counter: false,
      arrowPrev: false,
      arrowNext: false,
      imageClickAction: 'zoom',
      doubleTapAction: 'zoom',
      bgClickAction: 'close',
      tapAction: 'toggle-controls',
      showHideAnimationType: 'none',
      showAnimationDuration: 0,
      hideAnimationDuration: 0,
      zoomAnimationDuration: reducedMotion ? 0 : 220,
      errorMsg: labels.errorMsg,
      initialZoomLevel: 'fit',
      secondaryZoomLevel: function (zoomLevels) {
        return Math.max(zoomLevels.fit * 2.15, 1.4);
      },
      maxZoomLevel: function (zoomLevels) {
        return Math.max(zoomLevels.fit * 3.5, 2.8);
      },
      paddingFn: function (viewportSize) {
        var isCompact = viewportSize.x <= 600;
        return {
          top: isCompact ? 64 : 76,
          bottom: isCompact ? 68 : 80,
          left: isCompact ? 12 : 64,
          right: isCompact ? 12 : 64
        };
      }
    });

    var zoomInBtn = null;
    var zoomOutBtn = null;
    var closeBtn = null;

    pswp.on('uiRegister', function () {
      pswp.ui.registerElement({
        name: 'lbx-counter',
        className: 'pswp__counter lbx-counter',
        appendTo: 'bar',
        order: 5,
        onInit: function (el, instance) {
          el.setAttribute('aria-live', 'polite');
          var updateCounter = function () {
            el.textContent = (instance.currIndex + 1) + ' / ' + instance.getNumItems();
          };
          instance.on('change', updateCounter);
          updateCounter();
        }
      });

      pswp.ui.registerElement({
        name: 'lbx-toolbar',
        className: 'lbx-toolbar-group',
        appendTo: 'bar',
        order: 15,
        onInit: function (el, instance) {
          zoomOutBtn = createIconButton(
            'lbx-btn--zoom-out',
            labels.zoomOut,
            '<circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line>',
            function () {
              stepZoom(instance, -1, reducedMotion);
            }
          );

          zoomInBtn = createIconButton(
            'lbx-btn--zoom-in',
            labels.zoomIn,
            '<circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line>',
            function () {
              stepZoom(instance, 1, reducedMotion);
            }
          );

          closeBtn = createIconButton(
            'lbx-btn--close',
            labels.close,
            '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
            function () {
              instance.close();
            }
          );

          el.appendChild(zoomOutBtn);
          el.appendChild(zoomInBtn);
          el.appendChild(closeBtn);
        }
      });

      pswp.ui.registerElement({
        name: 'lbx-prev',
        className: 'pswp__button lbx-btn lbx-btn--prev',
        appendTo: 'wrapper',
        order: 10,
        isButton: true,
        ariaLabel: labels.prev,
        title: labels.prev,
        html: '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>',
        onClick: function (_e, _el, instance) {
          instance.prev();
        }
      });

      pswp.ui.registerElement({
        name: 'lbx-next',
        className: 'pswp__button lbx-btn lbx-btn--next',
        appendTo: 'wrapper',
        order: 11,
        isButton: true,
        ariaLabel: labels.next,
        title: labels.next,
        html: '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>',
        onClick: function (_e, _el, instance) {
          instance.next();
        }
      });

      pswp.ui.registerElement({
        name: 'lbx-caption',
        className: 'lbx-caption pswp__hide-on-close',
        appendTo: 'wrapper',
        order: 16,
        onInit: function (el, instance) {
          var updateCaption = function () {
            var currData =
              (instance.currSlide && instance.currSlide.data) ||
              slides[instance.currIndex] ||
              {};
            var catText = (currData.category || '').trim();
            var titleText = (currData.title || '').trim();

            el.textContent = '';
            if (!catText && !titleText) {
              el.hidden = true;
              return;
            }
            el.hidden = false;

            var inner = document.createElement('div');
            inner.className = 'lbx-caption-inner';

            if (catText) {
              var catSpan = document.createElement('span');
              catSpan.className = 'lbx-caption-cat';
              catSpan.textContent = catText;
              inner.appendChild(catSpan);
            }

            if (titleText) {
              var titleDiv = document.createElement('p');
              titleDiv.className = 'lbx-caption-title';
              titleDiv.textContent = titleText;
              inner.appendChild(titleDiv);
            }

            el.appendChild(inner);
          };

          instance.on('change', updateCaption);
          updateCaption();
        }
      });
    });

    pswp.addFilter('useContentPlaceholder', function () {
      return false;
    });

    pswp.on('gettingData', function (e) {
      if (!e || !e.data) return;
      var cached = findMatchingDomImageDims(e.data.src);
      if (cached) {
        var exact = computeScaledSize(cached.width, cached.height);
        e.data.hasExactAspect = true;
        e.data.width = exact.width;
        e.data.height = exact.height;
        e.data.w = exact.width;
        e.data.h = exact.height;
      }
    });

    pswp.on('slideInit', function (e) {
      if (!e || !e.slide || !e.slide.data) return;
      var s = e.slide;
      var img = s.content && s.content.element;
      if (img && img.tagName === 'IMG' && img.naturalWidth > 0 && img.naturalHeight > 0) {
        var exact = computeScaledSize(img.naturalWidth, img.naturalHeight);
        s.data.hasExactAspect = true;
        s.data.width = exact.width;
        s.data.height = exact.height;
        s.data.w = exact.width;
        s.data.h = exact.height;
      }
      if (s.data.width && s.data.height) {
        s.width = s.data.width;
        s.height = s.data.height;
        if (s.content) {
          s.content.width = s.data.width;
          s.content.height = s.data.height;
        }
      }
    });

    pswp.on('contentLoadImage', function (e) {
      if (!e || !e.content || !e.content.element) return;
      var content = e.content;
      var img = content.element;
      var syncFromImg = function () {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          applyExactDimensionsToSlide(
            pswp,
            content.index,
            content.data,
            img.naturalWidth,
            img.naturalHeight,
            zoomInBtn,
            zoomOutBtn
          );
        }
      };
      if (img.complete && img.naturalWidth > 0) {
        syncFromImg();
      } else {
        img.addEventListener('load', syncFromImg, { once: true });
      }
    });

    pswp.on('loadComplete', function (e) {
      if (!e || !e.content || !e.content.element) return;
      var img = e.content.element;
      if (img.tagName === 'IMG' && img.naturalWidth > 0 && img.naturalHeight > 0) {
        applyExactDimensionsToSlide(
          pswp,
          e.content.index,
          e.content.data,
          img.naturalWidth,
          img.naturalHeight,
          zoomInBtn,
          zoomOutBtn
        );
      }
    });

    pswp.on('afterInit', function () {
      document.body.classList.add('lbx-body-lock');
      preloadAndSyncSlideDimensions(pswp, slides, zoomInBtn, zoomOutBtn);

      if (pswp.element) {
        pswp.element.setAttribute('role', 'dialog');
        pswp.element.setAttribute('aria-modal', 'true');
        pswp.element.setAttribute('aria-label', labels.dialogLabel);

        pswp.element.addEventListener('keydown', function (e) {
          if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            stepZoom(pswp, 1, reducedMotion);
            return;
          }
          if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            stepZoom(pswp, -1, reducedMotion);
            return;
          }
          if (e.key !== 'Tab') return;

          var focusables = Array.from(
            pswp.element.querySelectorAll('button.lbx-btn:not(:disabled)')
          ).filter(function (btn) {
            return btn.offsetParent !== null;
          });

          if (!focusables.length) return;
          var first = focusables[0];
          var last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || !pswp.element.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !pswp.element.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        });
      }

      syncZoomButtonState(pswp, zoomInBtn, zoomOutBtn);
      if (closeBtn) {
        setTimeout(function () {
          if (closeBtn) closeBtn.focus({ preventScroll: true });
        }, 20);
      }
    });

    pswp.on('change', function () {
      if (pswp.currSlide && pswp.currSlide.data) {
        var s = pswp.currSlide;
        var img = s.content && s.content.element;
        if (img && img.tagName === 'IMG' && img.naturalWidth > 0 && img.naturalHeight > 0) {
          applyExactDimensionsToSlide(
            pswp,
            s.index,
            s.data,
            img.naturalWidth,
            img.naturalHeight,
            zoomInBtn,
            zoomOutBtn
          );
        }
        var targetW = s.data.width;
        var targetH = s.data.height;
        var expectedDispW = s.zoomLevels ? Math.round(targetW * s.zoomLevels.initial) : 0;
        var expectedDispH = s.zoomLevels ? Math.round(targetH * s.zoomLevels.initial) : 0;
        var dispMismatch =
          s.content &&
          expectedDispW > 0 &&
          (Math.abs((s.content.displayedImageWidth || 0) - expectedDispW) > 2 ||
            Math.abs((s.content.displayedImageHeight || 0) - expectedDispH) > 2);

        if (s.width !== targetW || s.height !== targetH || dispMismatch) {
          s.width = targetW;
          s.height = targetH;
          if (s.content) {
            s.content.width = targetW;
            s.content.height = targetH;
          }
          s.prevDisplayedWidth = -1;
          s.prevDisplayedHeight = -1;
          s.currentResolution = 0;
          s.calculateSize();
          s.zoomAndPanToInitial();
          s.applyCurrentZoomPan();
          s.updateContentSize(true);
        }
      }
      syncZoomButtonState(pswp, zoomInBtn, zoomOutBtn);
    });

    pswp.on('zoomPanUpdate', function () {
      syncZoomButtonState(pswp, zoomInBtn, zoomOutBtn);
    });

    pswp.on('close', function () {
      document.body.classList.remove('lbx-body-lock');
    });

    pswp.on('destroy', function () {
      document.body.classList.remove('lbx-body-lock');
      if (activeInstance === pswp) {
        activeInstance = null;
      }
      if (window.pswp === pswp) {
        delete window.pswp;
      }
      if (triggerEl && typeof triggerEl.focus === 'function' && document.contains(triggerEl)) {
        try {
          triggerEl.focus({ preventScroll: true });
        } catch (_e) {
          triggerEl.focus();
        }
      }
    });

    activeInstance = pswp;
    window.pswp = pswp;
    pswp.init();
    return pswp;
  }

  function closeLightbox() {
    if (activeInstance) {
      activeInstance.close();
    }
  }

  function getActiveInstance() {
    return activeInstance;
  }

  window.EuodooLightbox = {
    open: openLightbox,
    close: closeLightbox,
    getInstance: getActiveInstance
  };
})();
