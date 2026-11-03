/**
 * admin-dropdown.js - Unified Dropdown Controller (.eu-dd-*)
 * WAI-ARIA 1.2 Combobox/Listbox compliant, keyboard navigation, auto-search,
 * viewport auto-flip, and native <select> two-way synchronization.
 * PT Euodoo Industrial - Strictly vanilla JS, CSP-compliant.
 */

(function (window, document) {
  'use strict';

  const OPEN_CLASS = 'is-open';
  const ACTIVE_CLASS = 'is-active';
  const SELECTED_CLASS = 'is-selected';
  const TOP_CLASS = 'eu-dd-panel--top';
  const SEARCH_THRESHOLD = 10;

  let activeDropdown = null;

  /**
   * Escape special HTML characters to prevent XSS
   */
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Close any open dropdown in the document
   */
  function closeAllDropdowns(except = null) {
    const openDropdowns = document.querySelectorAll(`.eu-dd.${OPEN_CLASS}`);
    openDropdowns.forEach(dd => {
      if (dd !== except) {
        closeDropdown(dd);
      }
    });
  }

  /**
   * Close a specific dropdown
   */
  function closeDropdown(dd) {
    if (!dd || !dd.classList.contains(OPEN_CLASS)) return;

    dd.classList.remove(OPEN_CLASS);
    const trigger = dd.querySelector('.eu-dd-trigger');
    const panel = dd.querySelector('.eu-dd-panel');

    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
    }

    if (panel) {
      panel.classList.remove(TOP_CLASS);
      // Reset search filter when closed
      const searchInput = panel.querySelector('.eu-dd-search-input');
      if (searchInput) {
        searchInput.value = '';
        filterItems(panel, '');
      }
    }

    if (activeDropdown === dd) {
      activeDropdown = null;
    }
  }

  /**
   * Open a specific dropdown and adjust viewport orientation
   */
  function openDropdown(dd) {
    if (!dd || dd.classList.contains('is-disabled')) return;

    closeAllDropdowns(dd);
    dd.classList.add(OPEN_CLASS);
    activeDropdown = dd;

    const trigger = dd.querySelector('.eu-dd-trigger');
    const panel = dd.querySelector('.eu-dd-panel');

    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
    }

    // Auto-flip orientation check: flip to top if space below is limited
    if (trigger && panel) {
      const triggerRect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const estimatedPanelHeight = Math.min(panel.scrollHeight || 260, 260) + 12;

      if (spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow) {
        panel.classList.add(TOP_CLASS);
      } else {
        panel.classList.remove(TOP_CLASS);
      }

      // If search box is present, focus it; otherwise focus first active item
      const searchInput = panel.querySelector('.eu-dd-search-input');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 60);
      } else {
        const selectedItem = panel.querySelector(`.eu-dd-item.${SELECTED_CLASS}`) || panel.querySelector('.eu-dd-item:not(.is-disabled)');
        if (selectedItem) {
          highlightItem(dd, selectedItem);
        }
      }
    }
  }

  /**
   * Filter visible options in the listbox panel based on user query
   */
  function filterItems(panel, query) {
    const q = (query || '').toLowerCase().trim();
    const items = panel.querySelectorAll('.eu-dd-item');
    let visibleCount = 0;

    items.forEach(item => {
      const text = (item.textContent || '').toLowerCase();
      const match = !q || text.includes(q);
      item.style.display = match ? 'flex' : 'none';
      if (match) visibleCount++;
    });

    let emptyElem = panel.querySelector('.eu-dd-empty');
    if (visibleCount === 0) {
      if (!emptyElem) {
        emptyElem = document.createElement('div');
        emptyElem.className = 'eu-dd-empty';
        const lang = (document.documentElement.lang || 'id').toLowerCase().startsWith('en') ? 'en' : 'id';
        emptyElem.textContent = lang === 'en' ? 'No options available' : 'Tidak ada opsi';
        panel.querySelector('.eu-dd-options')?.appendChild(emptyElem);
      }
      emptyElem.style.display = 'block';
    } else if (emptyElem) {
      emptyElem.style.display = 'none';
    }
  }

  /**
   * Highlight item for keyboard active descendant tracking
   */
  function highlightItem(dd, item) {
    if (!dd || !item) return;

    const panel = dd.querySelector('.eu-dd-panel');
    const trigger = dd.querySelector('.eu-dd-trigger');
    if (!panel) return;

    panel.querySelectorAll('.eu-dd-item').forEach(i => i.classList.remove(ACTIVE_CLASS));
    item.classList.add(ACTIVE_CLASS);

    if (item.id && trigger) {
      trigger.setAttribute('aria-activedescendant', item.id);
    }

    // Ensure item is scrolled into visible view inside panel container
    const optionsContainer = panel.querySelector('.eu-dd-options');
    if (optionsContainer) {
      const itemTop = item.offsetTop;
      const itemBottom = itemTop + item.offsetHeight;
      const scrollPos = optionsContainer.scrollTop;
      const containerHeight = optionsContainer.clientHeight;

      if (itemTop < scrollPos) {
        optionsContainer.scrollTop = itemTop;
      } else if (itemBottom > scrollPos + containerHeight) {
        optionsContainer.scrollTop = itemBottom - containerHeight;
      }
    }
  }

  /**
   * Select a value, sync native <select>, update visual trigger, and trigger change event
   */
  function selectOption(dd, item, isInit = false) {
    if (!dd || !item || item.classList.contains('is-disabled')) return;

    const val = item.getAttribute('data-value') || '';
    const labelText = item.getAttribute('data-label') || item.querySelector('.eu-dd-item-text')?.textContent.trim() || item.textContent.trim();

    // 1. Update native select value
    const nativeSelect = dd.querySelector('select.eu-dd-native');
    const prevVal = nativeSelect ? nativeSelect.value : null;

    if (nativeSelect) {
      nativeSelect.value = val;
      if (!isInit && prevVal !== val) {
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // 2. Update visual value display
    const valueDisplay = dd.querySelector('.eu-dd-value');
    if (valueDisplay) {
      const prefix = dd.getAttribute('data-prefix');
      const isElevated = dd.classList.contains('eu-dd--elevated');

      if (isElevated && prefix) {
        valueDisplay.innerHTML = `<span class="eu-dd-prefix">${escapeHtml(prefix)}:</span> <span class="eu-dd-strong">${escapeHtml(labelText)}</span>`;
      } else if (prefix) {
        valueDisplay.textContent = `${prefix}: ${labelText}`;
      } else {
        valueDisplay.textContent = labelText;
      }

      const isPlaceholder = !val && val !== '0' && val !== 0;
      valueDisplay.classList.toggle('is-placeholder', isPlaceholder);
    }

    // 3. Update listbox item states
    const panel = dd.querySelector('.eu-dd-panel');
    if (panel) {
      panel.querySelectorAll('.eu-dd-item').forEach(i => {
        const isCurrent = i === item;
        i.classList.toggle(SELECTED_CLASS, isCurrent);
        i.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });
    }

    // 4. Remove validation error class if present
    dd.classList.remove('is-invalid', 'has-error');
    const trigger = dd.querySelector('.eu-dd-trigger');
    if (trigger) {
      trigger.removeAttribute('aria-invalid');
    }

    // 5. Close dropdown and return focus unless during initial binding
    if (!isInit) {
      closeDropdown(dd);
      if (trigger) trigger.focus();
    }
  }

  /**
   * Build or enhance an .eu-dd element from a native <select>
   */
  function enhanceSelect(nativeSelect) {
    if (!nativeSelect || nativeSelect.dataset.euDdEnhanced === 'true') return null;

    nativeSelect.dataset.euDdEnhanced = 'true';
    let wrapper = nativeSelect.closest('.eu-dd');

    // If native select is standalone, create outer wrapper
    if (!wrapper) {
      wrapper = document.createElement('div');
      const variant = nativeSelect.getAttribute('data-eu-variant') || 'outlined';
      wrapper.className = `eu-dd eu-dd--${variant}`;
      nativeSelect.parentNode.insertBefore(wrapper, nativeSelect);
      wrapper.appendChild(nativeSelect);
    }

    nativeSelect.classList.add('eu-dd-native', 'sr-only');
    nativeSelect.setAttribute('tabindex', '-1');
    nativeSelect.setAttribute('aria-hidden', 'true');

    const ddId = nativeSelect.id || nativeSelect.name || `dd-${Math.random().toString(36).substring(2, 9)}`;
    const listId = `eu-dd-list-${ddId}`;

    // Read attributes
    const prefix = nativeSelect.getAttribute('data-prefix') || wrapper.getAttribute('data-prefix') || '';
    if (prefix) wrapper.setAttribute('data-prefix', prefix);

    const isFloating = nativeSelect.hasAttribute('data-floating') || wrapper.classList.contains('eu-dd--floating');
    const floatingLabelText = nativeSelect.getAttribute('data-label') || wrapper.getAttribute('data-label') || '';

    // Check if trigger and panel already exist in template EJS
    let trigger = wrapper.querySelector('.eu-dd-trigger');
    let panel = wrapper.querySelector('.eu-dd-panel');

    if (!trigger) {
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'eu-dd-trigger';
      trigger.setAttribute('role', 'combobox');
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', listId);

      let floatingHtml = '';
      if (isFloating && floatingLabelText) {
        floatingHtml = `<span class="eu-dd-floating-label">${escapeHtml(floatingLabelText)}</span>`;
      }

      trigger.innerHTML = `
        ${floatingHtml}
        <span class="eu-dd-value">Pilih opsi</span>
        <span class="eu-dd-caret" aria-hidden="true">
          <svg viewBox="0 0 10 6" class="eu-dd-caret-icon" fill="currentColor"><polygon points="0,0 10,0 5,6"/></svg>
        </span>
      `;
      wrapper.appendChild(trigger);
    }

    if (!panel) {
      panel = document.createElement('div');
      panel.id = listId;
      panel.className = 'eu-dd-panel';
      panel.setAttribute('role', 'listbox');
      panel.setAttribute('tabindex', '-1');

      const options = Array.from(nativeSelect.options || []);
      const needsSearch = options.length > SEARCH_THRESHOLD;

      let searchHtml = '';
      if (needsSearch) {
        const lang = (document.documentElement.lang || 'id').toLowerCase().startsWith('en') ? 'en' : 'id';
        const searchPlaceholder = lang === 'en' ? 'Search options...' : 'Cari opsi...';
        searchHtml = `
          <div class="eu-dd-search-wrap">
            <input type="text" class="eu-dd-search-input" placeholder="${searchPlaceholder}" aria-label="${searchPlaceholder}">
          </div>
        `;
      }

      let optionsHtml = '';
      options.forEach((opt, idx) => {
        const optId = `eu-opt-${ddId}-${idx}`;
        const isSelected = opt.selected;
        const iconUrl = opt.getAttribute('data-icon') || '';
        let mediaHtml = '';
        if (iconUrl) {
          mediaHtml = `<span class="eu-dd-item-media"><img src="${escapeHtml(iconUrl)}" alt="" onerror="this.style.display='none'"></span>`;
        }

        optionsHtml += `
          <div class="eu-dd-item ${isSelected ? SELECTED_CLASS : ''}" role="option" aria-selected="${isSelected ? 'true' : 'false'}" data-value="${escapeHtml(opt.value)}" data-label="${escapeHtml(opt.text)}" id="${optId}" ${opt.disabled ? 'aria-disabled="true" class="is-disabled"' : ''}>
            ${mediaHtml}
            <span class="eu-dd-item-text">${escapeHtml(opt.text)}</span>
            <span class="eu-dd-check-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 8 6 12 13 4"/></svg>
            </span>
          </div>
        `;
      });

      panel.innerHTML = `
        ${searchHtml}
        <div class="eu-dd-options" role="presentation">
          ${optionsHtml}
        </div>
      `;
      wrapper.appendChild(panel);
    }

    // Sync initial selected state
    const selectedOption = nativeSelect.options[nativeSelect.selectedIndex] || nativeSelect.options[0];
    if (selectedOption) {
      const matchItem = panel.querySelector(`.eu-dd-item[data-value="${CSS.escape(selectedOption.value)}"]`);
      if (matchItem) {
        selectOption(wrapper, matchItem, true);
      }
    }

    // Attach event listeners
    bindEvents(wrapper);
    return wrapper;
  }

  /**
   * Bind event handlers to an .eu-dd component
   */
  function bindEvents(dd) {
    if (!dd || dd.dataset.euDdBound === 'true') return;
    dd.dataset.euDdBound = 'true';

    const trigger = dd.querySelector('.eu-dd-trigger');
    const panel = dd.querySelector('.eu-dd-panel');
    const nativeSelect = dd.querySelector('select.eu-dd-native');
    const searchInput = panel ? panel.querySelector('.eu-dd-search-input') : null;

    if (!trigger || !panel) return;

    // 1. Click Trigger Toggle
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dd.classList.contains(OPEN_CLASS)) {
        closeDropdown(dd);
      } else {
        openDropdown(dd);
      }
    });

    // 2. Click Option Item
    panel.addEventListener('click', (e) => {
      const item = e.target.closest('.eu-dd-item');
      if (item && !item.classList.contains('is-disabled')) {
        e.preventDefault();
        e.stopPropagation();
        selectOption(dd, item);
      }
    });

    // 3. Search Box Input Filtering
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterItems(panel, e.target.value);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const firstVisible = panel.querySelector('.eu-dd-item:not([style*="display: none"]):not(.is-disabled)');
          if (firstVisible) highlightItem(dd, firstVisible);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeDropdown(dd);
          trigger.focus();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const activeItem = panel.querySelector(`.eu-dd-item.${ACTIVE_CLASS}`) || panel.querySelector('.eu-dd-item:not([style*="display: none"]):not(.is-disabled)');
          if (activeItem) selectOption(dd, activeItem);
        }
      });
    }

    // 4. Keyboard Navigation on Trigger & Panel
    trigger.addEventListener('keydown', (e) => {
      const isOpen = dd.classList.contains(OPEN_CLASS);

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          openDropdown(dd);
        } else {
          navigateItems(dd, e.key === 'ArrowDown' ? 1 : -1);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isOpen) {
          openDropdown(dd);
        } else {
          const activeItem = panel.querySelector(`.eu-dd-item.${ACTIVE_CLASS}`);
          if (activeItem) selectOption(dd, activeItem);
          else closeDropdown(dd);
        }
      } else if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          closeDropdown(dd);
        }
      } else if (e.key === 'Tab') {
        if (isOpen) {
          closeDropdown(dd);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Type-ahead jump when closed
        typeAheadJump(dd, e.key);
      }
    });

    panel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateItems(dd, e.key === 'ArrowDown' ? 1 : -1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        const first = panel.querySelector('.eu-dd-item:not([style*="display: none"]):not(.is-disabled)');
        if (first) highlightItem(dd, first);
      } else if (e.key === 'End') {
        e.preventDefault();
        const items = Array.from(panel.querySelectorAll('.eu-dd-item:not([style*="display: none"]):not(.is-disabled)'));
        if (items.length) highlightItem(dd, items[items.length - 1]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const activeItem = panel.querySelector(`.eu-dd-item.${ACTIVE_CLASS}`);
        if (activeItem) selectOption(dd, activeItem);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown(dd);
        trigger.focus();
      } else if (e.key === 'Tab') {
        closeDropdown(dd);
      }
    });

    // 5. Sync when native <select> changes via code
    if (nativeSelect) {
      nativeSelect.addEventListener('change', () => {
        const currentVal = nativeSelect.value;
        const matchItem = panel.querySelector(`.eu-dd-item[data-value="${CSS.escape(currentVal)}"]`);
        if (matchItem && !matchItem.classList.contains(SELECTED_CLASS)) {
          selectOption(dd, matchItem, true);
        }
      });

      // Handle form reset event
      const form = nativeSelect.form;
      if (form) {
        form.addEventListener('reset', () => {
          setTimeout(() => {
            const defaultOpt = nativeSelect.querySelector('option[selected]') || nativeSelect.options[0];
            if (defaultOpt) {
              const matchItem = panel.querySelector(`.eu-dd-item[data-value="${CSS.escape(defaultOpt.value)}"]`);
              if (matchItem) selectOption(dd, matchItem, true);
            }
          }, 10);
        });
      }
    }
  }

  /**
   * Move active item focus up or down among visible options
   */
  function navigateItems(dd, direction) {
    const panel = dd.querySelector('.eu-dd-panel');
    if (!panel) return;

    const visibleItems = Array.from(panel.querySelectorAll('.eu-dd-item:not([style*="display: none"]):not(.is-disabled)'));
    if (!visibleItems.length) return;

    const currentActive = panel.querySelector(`.eu-dd-item.${ACTIVE_CLASS}`) || panel.querySelector(`.eu-dd-item.${SELECTED_CLASS}`);
    let currentIndex = visibleItems.indexOf(currentActive);

    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = visibleItems.length - 1;
    if (nextIndex >= visibleItems.length) nextIndex = 0;

    highlightItem(dd, visibleItems[nextIndex]);
  }

  /**
   * Rapid jump by typing character
   */
  function typeAheadJump(dd, char) {
    const panel = dd.querySelector('.eu-dd-panel');
    if (!panel) return;

    const c = char.toLowerCase();
    const items = Array.from(panel.querySelectorAll('.eu-dd-item:not(.is-disabled)'));
    const match = items.find(i => (i.textContent || '').trim().toLowerCase().startsWith(c));

    if (match) {
      selectOption(dd, match);
    }
  }

  // Global Click Outside Listener
  document.addEventListener('click', (e) => {
    if (activeDropdown && !activeDropdown.contains(e.target)) {
      closeDropdown(activeDropdown);
    }
  });

  // Global Escape Key Listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeDropdown) {
      const trigger = activeDropdown.querySelector('.eu-dd-trigger');
      closeDropdown(activeDropdown);
      if (trigger) trigger.focus();
    }
  });

  /**
   * Initialize all dropdown components in container or document
   */
  function initAll(root = document) {
    // 1. Upgrade native selects with data-eu-dropdown
    const declarativeSelects = root.querySelectorAll('select[data-eu-dropdown]');
    declarativeSelects.forEach(sel => enhanceSelect(sel));

    // 2. Bind existing .eu-dd markup rendered directly in EJS
    const existingDds = root.querySelectorAll('.eu-dd');
    existingDds.forEach(dd => {
      const sel = dd.querySelector('select.eu-dd-native');
      if (sel) {
        enhanceSelect(sel);
      } else {
        bindEvents(dd);
      }
    });
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }

  // Expose global controller
  window.EuDropdown = {
    init: initAll,
    enhance: enhanceSelect,
    open: openDropdown,
    close: closeDropdown,
    closeAll: closeAllDropdowns,
    select: selectOption
  };

})(window, document);

