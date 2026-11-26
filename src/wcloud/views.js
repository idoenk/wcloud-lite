/*!
 * wcloud-lite - Core Views & OptionDialogView
 * Adapted from: https://github.com/timdream/wordcloud/blob/main/assets/views.js
 *
 * Copyright 2011, 2013-2019 Timothy Guan-tin Chien and other contributors.
 * Modified work Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import { Picker, Tab } from '../vendor/index.js';
import { __, webL10n } from '../timdream/index.js';
import { DONATE_HTML } from './vars.js';
import { attachModalDrag } from './utils/draggable.js';
import { StoreOptions } from './utils/storage.js';
import { encodeBase64Utf8 } from './utils/text-parser.js';

const DEFAULT_PALETTE_COLORS = ['66d9ef', 'a6e22d', 'fd9720', 'a581ff', 'f92772'];

function normalizeHex6(raw, fallback = 'ffffff') {
  const cleaned = String(raw || '').replace(/^#/, '').trim();
  if (/^[0-9a-f]{6}$/i.test(cleaned)) {
    return cleaned.toLowerCase();
  }
  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    return cleaned
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toLowerCase();
  }
  return fallback;
}

export class View {
  load(properties, defaultProperties) {
    const props = properties || {};
    for (const name in defaultProperties) {
      if (name in this) {
        break;
      }

      this[name] = name in props ? props[name] : defaultProperties[name];

      if (name === 'element' || /Element$/.test(name)) {
        this[name] =
          typeof this[name] === 'string' ? document.getElementById(this[name]) : this[name];
      } else if (/Modal$/.test(name)) {
        this[name] =
          typeof this[name] === 'string' ? document.querySelector(this[name]) : this[name];
      }
    }
  }

  show(...args) {
    if ('beforeShow' in this && this.beforeShow(...args) === false) {
      return false;
    }

    this.element.removeAttribute('hidden');

    if ('afterShow' in this) {
      this.afterShow(...args);
    }

    attachModalDrag(this.element);
    return true;
  }

  hide(...args) {
    if ('beforeHide' in this && this.beforeHide(...args) === false) {
      return false;
    }

    this.element.setAttribute('hidden', '');

    if ('afterHide' in this) {
      this.afterHide(...args);
    }
    return true;
  }
}

export class LanguageSwitcherView extends View {
  constructor(opts) {
    super();
    this.load(opts, {
      element: 'wc-language',
    });

    const rawLang = navigator.language || navigator.userLanguage || 'en-US';
    const defaultLanguage = rawLang.replace(/-[a-z]{2}$/i, (str) => str.toUpperCase());

    this.langs = [];
    Array.from(this.element.children).forEach((el) => {
      this.langs.push(el.value);
      if (el.value === defaultLanguage) {
        el.selected = true;
      }
    });

    if (!this.langs.includes(defaultLanguage)) {
      this.element.selectedIndex = 0;
    }

    document.addEventListener('localized', this);
    this.element.addEventListener('change', this);
  }

  handleEvent(evt) {
    switch (evt.type) {
      case 'change':
        webL10n.setLanguage(this.element.value);
        this.app.logAction('LanguageSwitcherView::change', this.element.value);
        break;
      case 'localized':
        this.app.logAction('LanguageSwitcherView::localized', document.documentElement.lang);
        break;
    }
  }
}

export class LoadingView extends View {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'loading',
      element: 'wc-loading',
      labelElement: 'wc-loading-label',
    });

    this.stringIds = ['downloading', 'loading', 'analyzing', 'no_data', 'no_list_output'];
  }

  beforeShow(state, nextState) {
    this.element.className = nextState === this.app.UI_STATE_ERROR_WITH_DASHBOARD ? 'error' : '';
  }

  updateLabel(stringId) {
    if (!this.stringIds[stringId]) {
      throw new Error(`Undefined stringId ${stringId}`);
    }
    this.labelElement.setAttribute('data-l10n-id', this.stringIds[stringId]);
    __(this.labelElement);
  }
}
LoadingView.prototype.LABEL_DOWNLOADING = 0;
LoadingView.prototype.LABEL_LOADING = 1;
LoadingView.prototype.LABEL_ANALYZING = 2;
LoadingView.prototype.LABEL_ERROR_DATA = 3;
LoadingView.prototype.LABEL_ERROR_LIST = 4;

export class ListDialogView extends View {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'list-dialog',
      element: 'wc-list-dialog',
      textElement: 'wc-list-edit',
      cancelBtnElement: 'wc-list-cancel-btn',
      confirmBtnElement: 'wc-list-confirm-btn',
      closeBtnModal: '#wc-list-dialog button.btn-close',
    });

    this.cancelBtnElement.addEventListener('click', this);
    this.confirmBtnElement.addEventListener('click', this);
    if (this.closeBtnModal) {
      this.closeBtnModal.addEventListener('click', this);
    }
  }

  beforeShow() {
    this.textElement.value = (this.app.data.list || [])
      .map((item) => `${item[1]}\t${item[0]}`)
      .join('\n');
  }

  afterShow() {
    this.textElement.focus();
  }

  handleEvent(evt) {
    switch (evt.currentTarget) {
      case this.confirmBtnElement:
        this.submit();
        break;
      case this.cancelBtnElement:
      case this.closeBtnModal:
        this.close();
        break;
    }
  }

  submit() {
    const rawValue = this.textElement.value;
    const hash = window.btoa
      ? `#base64-list:${encodeBase64Utf8(rawValue)}`
      : `#list:${encodeURIComponent(rawValue)}`;

    const hashPushed = this.app.pushUrlHash(hash);
    if (!hashPushed) {
      this.app.pushUrlHash('#list');
    }
  }

  close() {
    this.app.switchUIState(this.app.UI_STATE_DASHBOARD);
  }
}

export class AboutDialogView extends View {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'about-dialog',
      element: 'wc-about-dialog',
      donateElement: 'wc-about-donate',
      donateContentElement: 'wc-about-donate-content',
      contentElement: 'wc-about-content',
      closeBtnElement: 'wc-about-close-btn',
      closeBtnModal: '#wc-about-dialog button.btn-close',
    });

    this.closeBtnElement.addEventListener('click', this);
    this.contentElement.addEventListener('click', this);
    if (this.closeBtnModal) {
      this.closeBtnModal.addEventListener('click', this);
    }
  }

  beforeShow() {
    this.app.logAction('AboutDialogView::view');
    if (DONATE_HTML) {
      const lang = document.documentElement.lang || 'en-US';
      this.donateElement.removeAttribute('hidden');
      this.donateContentElement.innerHTML = DONATE_HTML.replace(/%lang/, lang.replace(/-/, '_'));
    }
  }

  handleEvent(evt) {
    switch (evt.currentTarget) {
      case this.contentElement: {
        const anchor = evt.target.closest('a[href]');
        if (!anchor) {
          break;
        }
        evt.preventDefault();
        window.open(anchor.href, '_blank', 'noopener,noreferrer');
        this.app.logAction('AboutDialogView::externalLink', anchor.href);
        break;
      }
      case this.closeBtnElement:
      case this.closeBtnModal:
        this.close();
        break;
    }
  }

  close() {
    this.app.switchUIState(this.app.UI_STATE_SOURCE_DIALOG);
  }
}

export class OptionDialogView extends View {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'option-dialog',
      element: 'wc-option-dialog',
      contentElement: 'wc-option-content',
      closeBtnElement: 'wc-option-close-btn',
      applyBtnElement: 'wc-option-apply-btn',
      closeBtnModal: '#wc-option-dialog button.btn-close',
    });

    this.eventsInitialized = false;
    this.pickers = new Map();
    this.storage = new StoreOptions();

    this.closeBtnElement.addEventListener('click', this);
    this.applyBtnElement.addEventListener('click', this);
    if (this.closeBtnModal) {
      this.closeBtnModal.addEventListener('click', this);
    }

    this.preloadStore();
  }

  preloadStore() {
    const options = this.storage.get('storeoptions', null);
    if (!options || typeof options !== 'object') {
      this.storage.set('storeoptions', {});
      return {};
    }
    return options;
  }

  beforeShow() {
    this.app.logAction('OptionDialogView::view');
    if (!this.eventsInitialized) {
      this.initializeDialog();
      this.eventsInitialized = true;
    }
    this.syncFromOptions();
    this.closeAllColorPickers();
  }

  initColorPicker(btnEl, defaultHex = 'ffffff') {
    if (!btnEl) {
      return null;
    }

    const itemEl = btnEl.closest('.item');
    const colorInput = itemEl?.querySelector('.color-value');
    const pickerHost = itemEl?.querySelector('.wrap-color-picker');
    const fieldId = btnEl.id;
    const initialHex = normalizeHex6(defaultHex, 'ffffff');

    const applyVisualHex = (hex6) => {
      btnEl.style.backgroundColor = `#${hex6}`;
      if (colorInput) {
        colorInput.value = hex6.toUpperCase();
      }
    };

    const picker = new Picker({
      parent: pickerHost,
      popup: false,
      alpha: false,
      editor: false,
      color: `#${initialHex}`,
      onChange: (color) => {
        const hex6 = normalizeHex6(color.hex.slice(0, 7), initialHex);
        applyVisualHex(hex6);
      },
    });

    const controller = {
      picker,
      btnEl,
      colorInput,
      setHex(hexValue) {
        const hex6 = normalizeHex6(hexValue, initialHex);
        picker.setColor(`#${hex6}`, true);
        applyVisualHex(hex6);
      },
      getHex() {
        return `#${normalizeHex6(colorInput ? colorInput.value : initialHex, initialHex)}`;
      },
    };

    this.pickers.set(fieldId, controller);
    applyVisualHex(initialHex);
    return controller;
  }

  buildColorPickPalette() {
    const target = this.element.querySelector('#wrap-pane1B');
    const tpl = this.element.querySelector('#tplcolorpick');
    if (!target || !tpl) {
      return;
    }

    target.innerHTML = '';
    const maxColors = 5;

    for (let i = 0; i < maxColors; i += 1) {
      const fragment = tpl.content.cloneNode(true);
      const btnEl = fragment.querySelector('.btn-pickcolor');
      const inputEl = fragment.querySelector('.color-value');
      const clearEl = fragment.querySelector('.btn-clear');
      const pickerWrap = fragment.querySelector('.wrap-color-picker');

      btnEl.id = `btn-pickcolor-palette-${i}`;
      inputEl.id = `color-value-palette-${i}`;
      clearEl.id = `btn-clearcolor-palette-${i}`;
      pickerWrap.id = `wrap-picker-palette-${i}`;

      target.appendChild(fragment);
      this.initColorPicker(
        target.querySelector(`#btn-pickcolor-palette-${i}`),
        DEFAULT_PALETTE_COLORS[i] || 'ffffff'
      );
    }
  }

  closeAllColorPickers(exceptWrap = null) {
    this.element.querySelectorAll('.wrap-color-picker').forEach((wrap) => {
      if (wrap === exceptWrap || wrap.classList.contains('d-none')) {
        return;
      }
      wrap.classList.add('d-none');
      const itemEl = wrap.closest('.item');
      const actionRow = itemEl?.querySelector('.wrap-action-result');
      const btn = itemEl?.querySelector('.btn-pickcolor');
      actionRow?.querySelector('.input-group')?.classList.add('d-none');
      actionRow?.querySelector('.btn-clear')?.classList.add('d-none');
      if (btn?.dataset.originalTitle) {
        btn.setAttribute('title', btn.dataset.originalTitle);
      }
    });
  }

  toggleThemeMode(mode) {
    if (!mode) {
      return;
    }

    this.closeAllColorPickers();
    const outer = this.element.querySelector('.wrap-themes-outer');
    if (outer) {
      outer.querySelectorAll('.itemwrap').forEach((wrap) => wrap.classList.add('d-none'));
      const activeWrap = outer.querySelector(`.wrap-${mode}`);
      if (activeWrap) {
        activeWrap.classList.remove('d-none');
      }
    }

    const menuItems = this.element.querySelectorAll('ul.menu-themes > li');
    menuItems.forEach((li) => {
      const link = li.querySelector('a[data-name]');
      const input = li.querySelector('input[name="themes"]');
      const isMatch = link?.dataset.name === mode;
      li.classList.toggle('active', isMatch);
      if (link) {
        link.classList.toggle('active', isMatch);
      }
      if (input) {
        input.checked = isMatch;
      }
    });
  }

  setTextColorMode(mode) {
    const customWrap = this.element.querySelector('.wrap-color-custom');
    const randomWrap = this.element.querySelector('.wrap-color-random');
    const customRadio = this.element.querySelector('#fcolor-custom');
    const randomRadio = this.element.querySelector('#fcolor-random');

    const isRandom = mode === 'random';
    if (randomRadio) {
      randomRadio.checked = isRandom;
    }
    if (customRadio) {
      customRadio.checked = !isRandom;
    }
    if (randomWrap) {
      randomWrap.classList.toggle('d-none', !isRandom);
    }
    if (customWrap) {
      customWrap.classList.toggle('d-none', isRandom);
    }
  }

  setCustomColorTab(tabType) {
    const isPalette = tabType === 'palette';
    const targetHref = isPalette ? '#lB' : '#lA';
    const triggerEl = this.element.querySelector(`.wrap-color-custom .nav-tabs a[href="${targetHref}"]`);
    if (triggerEl) {
      Tab.getOrCreateInstance(triggerEl).show();
    }

    const dualRadio = this.element.querySelector('#tab-dual');
    const paletteRadio = this.element.querySelector('#tab-palette');
    if (dualRadio) {
      dualRadio.checked = !isPalette;
    }
    if (paletteRadio) {
      paletteRadio.checked = isPalette;
    }
  }

  updatePaletteSlotCount(count) {
    const n = Math.min(Math.max(Number.parseInt(count, 10) || 4, 1), 5);
    const items = this.element.querySelectorAll('#wrap-pane1B > .item');
    items.forEach((item, idx) => {
      item.classList.toggle('d-none', idx >= n);
    });
  }

  buildPresetPalettes() {
    const presetContainer = this.element.querySelector('.wrap-preset .wrap-themes');
    const randomContainer = this.element.querySelector('.wrap-custom .wrap-color-random');
    if (!presetContainer || !randomContainer) {
      return;
    }

    presetContainer.innerHTML = '';
    randomContainer.innerHTML = '';

    this.app.themes.forEach((theme, idx) => {
      if (idx === this.app.data.custom_themeIndex) {
        return;
      }

      const buildUnitPalette = (includeBackground) => {
        const unit = document.createElement('div');
        unit.className = 'unitpalete';

        if (includeBackground) {
          const bkg = document.createElement('div');
          bkg.className = 'pbox pbox-bkg';
          bkg.title = 'Background';
          bkg.style.backgroundColor = theme.backgroundColor;
          unit.appendChild(bkg);
        }

        if (Array.isArray(theme.colorset)) {
          theme.colorset.forEach((hex) => {
            const pbox = document.createElement('div');
            pbox.className = 'pbox pbox-palette';

            const swatch = document.createElement('span');
            swatch.className = 'boxc';
            swatch.style.backgroundColor = hex;

            const codeInput = document.createElement('input');
            codeInput.className = 'ctext';
            codeInput.value = String(hex).replace(/#/g, '').toUpperCase();
            codeInput.readOnly = true;

            pbox.appendChild(swatch);
            pbox.appendChild(codeInput);
            unit.appendChild(pbox);
          });
        } else if (theme.colorset) {
          const pbox = document.createElement('div');
          pbox.className = 'pbox keduax';
          pbox.style.backgroundColor = theme.colorset;
          unit.appendChild(pbox);
        } else {
          const pbox = document.createElement('div');
          pbox.className = 'pbox randomize';
          // const label = typeof theme.color === 'string' ? `random-${theme.color}` : 'random';
          // pbox.title = label;
          pbox.style.backgroundColor = '#ffffff';
          pbox.textContent = 'random';
          unit.appendChild(pbox);
        }

        return unit;
      };

      const themeDiv = document.createElement('div');
      themeDiv.className = 'theme';
      themeDiv.dataset.theme = String(idx + 1);
      themeDiv.appendChild(buildUnitPalette(true));
      presetContainer.appendChild(themeDiv);

      const radioLabel = document.createElement('label');
      radioLabel.className = 'randomcolor';

      const radioInput = document.createElement('input');
      radioInput.type = 'radio';
      radioInput.className = 'form-check-input mt-0';
      radioInput.name = 'randomcolor';
      radioInput.value = `style-${idx + 1}`;
      if (idx === 0) {
        radioInput.checked = true;
      }

      const detailBtn = document.createElement('button');
      detailBtn.type = 'button';
      detailBtn.className = 'btn btn-xs btn-default btn-detailcolor';
      detailBtn.title = 'Detail Color Code';
      detailBtn.innerHTML = '<i class="bi bi-list" aria-hidden="true"></i>';

      radioLabel.appendChild(radioInput);
      radioLabel.appendChild(buildUnitPalette(false));
      radioLabel.appendChild(detailBtn);
      randomContainer.appendChild(radioLabel);
    });
  }

  initializeDialog() {
    this.buildColorPickPalette();
    this.initColorPicker(this.element.querySelector('#btn-pickcolor'), '363636');
    this.initColorPicker(this.element.querySelector('#btn-pickcolor-dualtone-topword'), 'dd4b39');
    this.initColorPicker(this.element.querySelector('#btn-pickcolor-dualtone-otherword'), 'cccccc');
    this.buildPresetPalettes();

    // Theme mode tabs (Preset vs Custom)
    this.element.querySelectorAll('ul.menu-themes > li > a[data-name]').forEach((link) => {
      link.addEventListener('click', (evt) => {
        evt.preventDefault();
        this.toggleThemeMode(link.dataset.name);
      });
    });

    // Text color mode radios (Custom vs Sample Palette)
    this.element.querySelectorAll('#fcolor-custom, #fcolor-random').forEach((radio) => {
      radio.addEventListener('change', () => {
        this.setTextColorMode(radio.value);
      });
    });

    // Click to select hex code text inside preset color details
    this.element.querySelectorAll('.ctext').forEach((input) => {
      input.addEventListener('click', (evt) => {
        evt.stopPropagation();
        input.select();
      });
    });

    // Toggle palette detail hex listing
    this.element.querySelectorAll('.btn-detailcolor').forEach((btn) => {
      btn.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        const unit = btn.closest('.randomcolor')?.querySelector('.unitpalete');
        if (unit) {
          unit.classList.toggle('listing');
        }
      });
    });

    // Toggle floating vanilla-picker + hex input + clear button on swatch click
    this.element.querySelectorAll('.btn-pickcolor').forEach((btn) => {
      btn.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        const actionRow = btn.closest('.wrap-action-result');
        const itemEl = btn.closest('.item');
        const pickerWrap = itemEl?.querySelector('.wrap-color-picker');
        if (!actionRow || !pickerWrap) {
          return;
        }

        const willShow = pickerWrap.classList.contains('d-none');
        this.closeAllColorPickers(willShow ? pickerWrap : null);
        pickerWrap.classList.toggle('d-none', !willShow);
        actionRow.querySelector('.input-group')?.classList.toggle('d-none', !willShow);
        actionRow.querySelector('.btn-clear')?.classList.toggle('d-none', !willShow);

        if (willShow) {
          btn.dataset.originalTitle = btn.getAttribute('title') || 'Select';
          btn.setAttribute('title', btn.dataset.current || 'Current');
        } else if (btn.dataset.originalTitle) {
          btn.setAttribute('title', btn.dataset.originalTitle);
        }
      });
    });

    // Close open floating color picker when clicking outside its item container
    this.element.addEventListener('click', (evt) => {
      const targetItem = evt.target.closest?.('.item');
      const targetWrap = targetItem?.querySelector('.wrap-color-picker') || null;
      this.closeAllColorPickers(targetWrap);
    });

    // Clear color buttons
    this.element.querySelectorAll('.btn-clear').forEach((btn) => {
      btn.addEventListener('click', () => {
        const itemEl = btn.closest('.item');
        const pickBtn = itemEl?.querySelector('.btn-pickcolor');
        const controller = pickBtn ? this.pickers.get(pickBtn.id) : null;
        if (controller) {
          controller.setHex('#ffffff');
        }
      });
    });

    // Manual hex input sync
    this.element.querySelectorAll('.color-value').forEach((input) => {
      input.addEventListener('focus', () => input.select());
      const syncHex = () => {
        const val = input.value.trim();
        if (!/^[0-9a-f]{6}$/i.test(val)) {
          return;
        }
        const itemEl = input.closest('.item');
        const pickBtn = itemEl?.querySelector('.btn-pickcolor');
        const controller = pickBtn ? this.pickers.get(pickBtn.id) : null;
        if (controller) {
          controller.setHex(`#${val}`);
        }
      };
      input.addEventListener('blur', syncHex);
      input.addEventListener('change', syncHex);
    });

    // Focus hex input when clicking "#" prefix addon
    this.element.querySelectorAll('.input-group-text').forEach((addon) => {
      const next = addon.nextElementSibling;
      if (next && next.classList.contains('color-value')) {
        addon.addEventListener('click', () => next.focus());
      }
    });

    // Dual-Tone vs Palette tabs
    this.element.querySelectorAll('.wrap-color-custom .nav-tabs a[data-bs-toggle="tab"]').forEach((tabLink) => {
      tabLink.addEventListener('click', (evt) => {
        evt.preventDefault();
        const tabType = tabLink.getAttribute('href') === '#lB' ? 'palette' : 'dualtone';
        this.setCustomColorTab(tabType);
      });
    });

    // Shape selection
    this.element.querySelectorAll('.wrap-shapes .shape').forEach((shapeEl) => {
      shapeEl.addEventListener('click', () => {
        this.element.querySelectorAll('.wrap-shapes .shape').forEach((el) => el.classList.remove('selected'));
        shapeEl.classList.add('selected');
        const hiddenInput = this.element.querySelector('#inputShape');
        if (hiddenInput) {
          hiddenInput.value = shapeEl.dataset.shape;
        }
      });
    });

    // Preset theme selection
    this.element.querySelectorAll('.wrap-themes .theme').forEach((themeEl) => {
      themeEl.addEventListener('click', () => {
        this.element.querySelectorAll('.wrap-themes .theme').forEach((el) => el.classList.remove('selected'));
        themeEl.classList.add('selected');
        const hiddenInput = this.element.querySelector('#inputTheme');
        if (hiddenInput) {
          hiddenInput.value = themeEl.dataset.theme;
        }
      });
    });

    // Specific words toggle
    const specificWordCheck = this.element.querySelector('#specific-word');
    if (specificWordCheck) {
      specificWordCheck.addEventListener('change', () => {
        const checked = specificWordCheck.checked;
        const nwordInput = this.element.querySelector('#nword');
        const specWrap = this.element.querySelector('#wrap-specific-wordlist');
        if (nwordInput) {
          nwordInput.disabled = checked;
        }
        if (specWrap) {
          specWrap.classList.toggle('d-none', !checked);
        }
      });
    }

    // Palette count dropdown
    const ncolorSelect = this.element.querySelector('#ncolor');
    if (ncolorSelect) {
      ncolorSelect.addEventListener('change', () => {
        this.updatePaletteSlotCount(ncolorSelect.value);
      });
      this.updatePaletteSlotCount(ncolorSelect.value);
    }

    // Skew normalize toggle
    const skewCheck = this.element.querySelector('#skew-normalize');
    if (skewCheck) {
      skewCheck.addEventListener('change', () => {
        const skewInput = this.element.querySelector('#skew-treshold');
        if (skewInput) {
          skewInput.disabled = !skewCheck.checked;
        }
      });
    }
  }

  syncFromOptions() {
    const app = this.app;
    const options = { ...app.getStorageOptions(), ...app.data };

    // Preset theme highlight
    const themeEls = this.element.querySelectorAll('.wrap-themes .theme');
    themeEls.forEach((el) => el.classList.remove('selected'));
    const presetThemeNum =
      typeof options.theme === 'number' && options.theme < app.data.custom_themeIndex
        ? options.theme + 1
        : 1;
    const activeThemeEl =
      this.element.querySelector(`.wrap-themes .theme[data-theme="${presetThemeNum}"]`) ||
      themeEls[0];
    if (activeThemeEl) {
      activeThemeEl.classList.add('selected');
      const hiddenTheme = this.element.querySelector('#inputTheme');
      if (hiddenTheme) {
        hiddenTheme.value = activeThemeEl.dataset.theme;
      }
    }

    // Shape selection
    const shapeIndex = Number.isInteger(options.shape) ? options.shape : 0;
    this.element.querySelectorAll('.wrap-shapes .shape').forEach((el) => {
      el.classList.toggle('selected', Number.parseInt(el.dataset.shape, 10) === shapeIndex);
    });
    const hiddenShape = this.element.querySelector('#inputShape');
    if (hiddenShape) {
      hiddenShape.value = String(shapeIndex);
    }

    // Panel position
    const panelSelect = this.element.querySelector('#panel-possition');
    if (panelSelect && options.panelpos) {
      panelSelect.value = options.panelpos;
    }

    // Skew normalization
    const skewCheck = this.element.querySelector('#skew-normalize');
    const skewInput = this.element.querySelector('#skew-treshold');
    if (skewCheck) {
      skewCheck.checked = Boolean(options.skewNormalize);
    }
    if (skewInput) {
      if (options.skewnessTreshold !== undefined) {
        skewInput.value = String(options.skewnessTreshold);
      }
      skewInput.disabled = !options.skewNormalize;
    }

    // Custom theme state restoration
    if (options.theme === app.data.custom_themeIndex && options.custom) {
      this.toggleThemeMode('custom');

      const custom = options.custom;
      if (custom.backgroundColor) {
        this.pickers.get('btn-pickcolor')?.setHex(custom.backgroundColor);
      }

      const fontSelect = this.element.querySelector('#font-custom');
      if (fontSelect && custom.fontFamily) {
        const primaryFont = String(custom.fontFamily).split(',')[0].replace(/"/g, '').trim();
        const matchOption = Array.from(fontSelect.options).find(
          (opt) => opt.value === custom.fontFamily || opt.value.includes(primaryFont)
        );
        if (matchOption) {
          fontSelect.value = matchOption.value;
        }
      }

      if (custom.textcolorType === 'random') {
        this.setTextColorMode('random');
        if (custom.textcolorRandomName) {
          const targetRadio = this.element.querySelector(
            `input[name="randomcolor"][value="${custom.textcolorRandomName}"]`
          );
          if (targetRadio) {
            targetRadio.checked = true;
          }
        }
      } else {
        this.setTextColorMode('custom');
        const customcolor =
          custom.color && typeof custom.color === 'object' && custom.color.type
            ? custom.color
            : { type: 'dualtone' };

        if (customcolor.type === 'dualtone') {
          this.setCustomColorTab('dualtone');

          if (customcolor.topword) {
            this.pickers.get('btn-pickcolor-dualtone-topword')?.setHex(customcolor.topword);
          }
          if (customcolor.otherword) {
            this.pickers.get('btn-pickcolor-dualtone-otherword')?.setHex(customcolor.otherword);
          }

          const nwordInput = this.element.querySelector('#nword');
          const specCheck = this.element.querySelector('#specific-word');
          const specWrap = this.element.querySelector('#wrap-specific-wordlist');
          const specTextarea = this.element.querySelector('#specific-wordlist');

          if (customcolor.nword !== undefined && nwordInput) {
            nwordInput.value = String(customcolor.nword);
          }

          const hasWordlist = Array.isArray(customcolor.wordlist) && customcolor.wordlist.length > 0;
          if (specCheck) {
            specCheck.checked = hasWordlist;
          }
          if (nwordInput) {
            nwordInput.disabled = hasWordlist;
          }
          if (specWrap) {
            specWrap.classList.toggle('d-none', !hasWordlist);
          }
          if (specTextarea && hasWordlist) {
            specTextarea.value = customcolor.wordlist.join('\n');
          }
        } else if (customcolor.type === 'palette') {
          this.setCustomColorTab('palette');
          const ncolorSelect = this.element.querySelector('#ncolor');
          const ncolor = custom.ncolor || (customcolor.ccolorset ? customcolor.ccolorset.length : 4);
          if (ncolorSelect) {
            ncolorSelect.value = String(ncolor);
          }
          this.updatePaletteSlotCount(ncolor);

          const ccolorset = Array.isArray(customcolor.ccolorset) ? customcolor.ccolorset : [];
          ccolorset.forEach((hex, idx) => {
            this.pickers.get(`btn-pickcolor-palette-${idx}`)?.setHex(hex);
          });
        }
      }
    } else {
      this.toggleThemeMode('preset');
    }
  }

  handleEvent(evt) {
    switch (evt.currentTarget) {
      case this.applyBtnElement:
        this.app.logAction('OptionDialogView::apply');
        this.apply();
        break;
      case this.closeBtnElement:
      case this.closeBtnModal:
        this.close();
        break;
    }
  }

  close() {
    if (this.app.refView === 'dashboard') {
      this.app.switchUIState(this.app.UI_STATE_DASHBOARD);
    } else {
      this.app.switchUIState(this.app.UI_STATE_SOURCE_DIALOG);
    }
  }

  apply() {
    const app = this.app;
    const selectedMode = this.element.querySelector('input[name="themes"]:checked')?.value || 'preset';

    if (selectedMode === 'preset') {
      const selectedPreset = this.element.querySelector('.wrap-preset .theme.selected');
      const presetNum = Number.parseInt(selectedPreset?.dataset.theme || '1', 10);
      app.data.theme = Math.max(presetNum - 1, 0);
      delete app.data.custom;
    } else {
      app.data.theme = app.data.custom_themeIndex;

      const bgHex = this.pickers.get('btn-pickcolor')?.getHex() || '#363636';
      const fontSelect = this.element.querySelector('#font-custom');
      const isRandom = Boolean(this.element.querySelector('#fcolor-random')?.checked);

      const custom = {
        backgroundColor: bgHex,
        fontFamily: fontSelect?.value || '"Trebuchet MS", Arial, sans-serif',
        textcolorType: isRandom ? 'random' : 'custom',
        color: null,
      };

      if (isRandom) {
        const selectedRandom = this.element.querySelector('input[name="randomcolor"]:checked');
        custom.textcolorRandomName = selectedRandom?.value || 'style-1';
      } else {
        const isPalette = Boolean(this.element.querySelector('#tab-palette')?.checked);
        const ccolor = {
          flag: 'custom-textcolor',
          type: isPalette ? 'palette' : 'dualtone',
        };

        if (!isPalette) {
          const useSpecific = Boolean(this.element.querySelector('#specific-word')?.checked);
          if (!useSpecific) {
            const parsedNword = Number.parseInt(this.element.querySelector('#nword')?.value, 10);
            ccolor.nword = Number.isNaN(parsedNword) || parsedNword < 1 ? 10 : parsedNword;
          } else {
            const rawLines = (this.element.querySelector('#specific-wordlist')?.value || '').split(/\r?\n/);
            ccolor.wordlist = rawLines.map((w) => w.trim().toLowerCase()).filter(Boolean);
          }

          ccolor.topword = this.pickers.get('btn-pickcolor-dualtone-topword')?.getHex() || '#dd4b39';
          ccolor.otherword = this.pickers.get('btn-pickcolor-dualtone-otherword')?.getHex() || '#cccccc';
        } else {
          const ncolor = Number.parseInt(this.element.querySelector('#ncolor')?.value || '4', 10);
          custom.ncolor = ncolor;
          ccolor.ccolorset = [];
          for (let i = 0; i < ncolor; i += 1) {
            const hex = this.pickers.get(`btn-pickcolor-palette-${i}`)?.getHex();
            if (hex) {
              ccolor.ccolorset.push(hex);
            }
          }
        }

        custom.color = ccolor;
      }

      app.data.custom = custom;
      app.themes[app.data.custom_themeIndex] = custom;
    }

    // Shape
    const selectedShape = this.element.querySelector('.wrap-shapes .shape.selected');
    app.data.shape = Number.parseInt(selectedShape?.dataset.shape || '0', 10);

    // Cosine skewness normalization
    app.data.skewNormalize = Boolean(this.element.querySelector('#skew-normalize')?.checked);
    let skew = Number.parseFloat(this.element.querySelector('#skew-treshold')?.value);
    if (Number.isNaN(skew) || skew < 0 || skew > 0.5) {
      skew = 0.5;
    }
    app.data.skewnessTreshold = skew;

    // Dashboard position
    app.data.panelpos = this.element.querySelector('#panel-possition')?.value || 'fixed-bottom-left';
    app.reposPanel(app.data.panelpos);

    // Persist and redraw
    app.setStorage();
    if (app.refView === 'dashboard') {
      app.switchUIState(app.UI_STATE_DASHBOARD);
      app.draw();
    } else {
      app.switchUIState(app.UI_STATE_SOURCE_DIALOG);
    }
  }
}

export function installEscapeModalHandler() {
  document.addEventListener('keyup', (evt) => {
    if (evt.key !== 'Escape') {
      return;
    }
    const visibleModal = document.querySelector('[role="dialog"].modal.escapable:not([hidden])');
    if (!visibleModal) {
      return;
    }
    const closeBtn = visibleModal.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.click();
    }
  });
}
