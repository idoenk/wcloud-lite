/*!
 * wcloud-lite - WordCloudApp Controller & Upstream Adapter
 * Adapted from: https://github.com/timdream/wordcloud/blob/main/assets/app.js
 *
 * Copyright 2011, 2013-2019 Timothy Guan-tin Chien and other contributors.
 * Modified work Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import { WordCloud, WordFreq } from '../timdream/index.js';
import { INDONESIAN_STOPWORDS, WORKER_BASE_URI, isDebugEnabled } from './vars.js';
import { StoreOptions } from './utils/storage.js';
import { normWeight } from './utils/text-parser.js';

export function randomColorGenerator(colors) {
  return function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
  };
}

export function getRandomDarkColor() {
  return (
    'rgb(' +
    Math.floor(Math.random() * 128 + 48).toString(10) +
    ',' +
    Math.floor(Math.random() * 128 + 48).toString(10) +
    ',' +
    Math.floor(Math.random() * 128 + 48).toString(10) +
    ')'
  );
}

const SANS_SERIF_FONTS = '"Trebuchet MS", Arial, sans-serif';
const SERIF_FONTS = '"Libre Baskerville", "Times New Roman", serif';

export function createPresetThemes() {
  const presets = [
    {
      fontFamily: SERIF_FONTS,
      // Sublime Text 2 colors
      colorset: ['#66d9ef', '#a6e22d', '#fd9720', '#a6e22a', '#a581ff', '#f92772'],
      backgroundColor: '#272822',
    },
    {
      fontFamily: SANS_SERIF_FONTS,
      colorset: ['#07ABDA', '#63D6F6', '#0F7BDC', '#69B4F7', '#00DBB6', '#376F65'],
      backgroundColor: '#004438',
    },
    {
      fontFamily: SERIF_FONTS,
      colorset: ['#2F55D1', '#4058A5', '#133193', '#98AFFD'],
      backgroundColor: '#e3e9fd',
    },
    {
      fontFamily: SANS_SERIF_FONTS,
      colorset: ['#c30000', '#c37a00', '#650281', '#de3333', '#de5c5c', '#7e602c', '#633e00', '#481e53'],
      backgroundColor: '#edd1a4',
    },
    {
      fontFamily: SANS_SERIF_FONTS,
      colorset: false,
      color: getRandomDarkColor,
      backgroundColor: '#eee',
    },
    {
      fontFamily: SERIF_FONTS,
      colorset: false,
      color: 'random-light',
      backgroundColor: '#000',
    },
    {
      fontFamily: SERIF_FONTS,
      colorset: ['#979E8F', '#575d51', '#3a3f42', '#42361d'],
      backgroundColor: '#8d8380',
    },
    {
      fontFamily: SERIF_FONTS,
      colorset: ['#f0f4bc', '#f7e4be', '#9a80a4', '#848da6'],
      backgroundColor: '#223564',
    },
    {
      fontFamily: SERIF_FONTS,
      colorset: '#d0d0d0',
      backgroundColor: '#999',
    },
    {
      fontFamily: SANS_SERIF_FONTS,
      colorset: 'rgba(255,255,255,0.8)',
      backgroundColor: '#353130',
    },
    {
      fontFamily: SANS_SERIF_FONTS,
      colorset: 'rgba(0,0,0,0.7)',
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
  ];

  for (const theme of presets) {
    if (theme.color === undefined) {
      if (typeof theme.colorset === 'string') {
        theme.color = theme.colorset;
      } else if (Array.isArray(theme.colorset)) {
        theme.color = randomColorGenerator(theme.colorset);
      }
    }
  }

  return presets;
}

export function resolveRandomStyleColor(styleName, presetThemes) {
  const match = String(styleName || '').match(/^style-(\d+)$/);
  if (!match) {
    return 'random-dark';
  }
  const index = Number.parseInt(match[1], 10) - 1;
  const preset = presetThemes[index];
  if (!preset) {
    return 'random-dark';
  }
  if (typeof preset.color === 'function' || typeof preset.color === 'string') {
    return preset.color;
  }
  if (Array.isArray(preset.colorset)) {
    return randomColorGenerator(preset.colorset);
  }
  return 'random-dark';
}

export class WordCloudApp {
  constructor() {
    this.DEBUG_LOG = isDebugEnabled();
    this.storage = new StoreOptions();

    const hasWordFreq =
      (WordFreq && WordFreq.isSupported) ||
      (window.WordFreqSync && window.WordFreqSync.isSupported);

    if (
      !hasWordFreq ||
      !WordCloud ||
      !WordCloud.isSupported ||
      !Object.keys ||
      !Array.prototype.map ||
      !Array.prototype.forEach ||
      !Array.prototype.indexOf ||
      !Function.prototype.bind ||
      !('onhashchange' in window)
    ) {
      const showUnsupported = () => {
        const view = document.getElementById('wc-browser-support');
        if (view) {
          view.removeAttribute('hidden');
        }
      };
      if (document.readyState === 'complete') {
        showUnsupported();
      } else {
        window.addEventListener('load', showUnsupported, { once: true });
      }
      this.isSupported = false;
      this.logAction('WordCloudApp::isSupported::false');
      return;
    }

    this.isSupported = true;
    this.logAction('WordCloudApp::isSupported::true');

    this.isFullySupported = Boolean(window.FileReader && window.HTMLCanvasElement?.prototype?.toDataURL);
    this.logAction(`WordCloudApp::isFullySupported::${this.isFullySupported}`);

    this.fetchers = {};
    this.views = {};
    this.currentUIState = this.UI_STATE_LOADING;
    this.refView = 'source';

    // Maps UI states to the active views rendered for that state.
    this.UIStateViewMap = [
      ['loading'],
      ['canvas', 'source-dialog'],
      ['loading', 'dashboard'],
      ['canvas', 'dashboard'],
      ['canvas', 'dashboard', 'list-dialog'],
      ['loading', 'dashboard'],
      ['canvas', 'about-dialog'],
      ['canvas', 'option-dialog'],
    ];

    // Upstream unmodified wordfreq.worker.js merges options.stopWords with default stopWordSets.
    this.wordfreqOption = {
      workerUrl: `${WORKER_BASE_URI}wordfreq.worker.js`,
      stopWords: [...INDONESIAN_STOPWORDS],
    };

    // Custom 'love' polar shape lives here as a shape function so wordcloud2.js stays 100% unmodified.
    this.shapes = [
      { shape: 'circle' },
      {
        shape: function shapeSquare(theta) {
          const thetaPrime = (theta + Math.PI / 4) % ((2 * Math.PI) / 4);
          return 1 / (Math.cos(thetaPrime) + Math.sin(thetaPrime));
        },
      },
      { shape: 'triangle-forward', ellipticity: 1 },
      { shape: 'star', ellipticity: 1 },
      { shape: 'pentagon', ellipticity: 1 },
      {
        shape: function shapeLove(theta) {
          return (
            2 -
            2 * Math.sin(theta) +
            (Math.sin(theta) * Math.sqrt(Math.abs(Math.cos(theta)))) / (Math.sin(theta) + 1.4)
          );
        },
        ellipticity: 1,
      },
    ];

    this.themes = createPresetThemes();
    const customThemeIndex = this.themes.length;
    this.themes.push({});

    this.data = {
      theme: 0,
      shape: 0,
      gridSize: undefined,
      weightFactor: undefined,
      unitweightFactor: undefined,
      custom_themeIndex: customThemeIndex,
      panelpos: 'fixed-bottom-left',
      skewNormalize: false,
      skewnessTreshold: 0.5,
      directFont: null,
    };

    this.hydrateFromStorage();

    this.fontsets = [
      ['Arial', '"Trebuchet MS", "Arial Unicode MS", sans-serif'],
      ['Liberation Serif', '"Liberation Serif", serif'],
      ['Times New Roman', '"Libre Baskerville", "Times New Roman", serif'],
      ['Open Sans', '"Open Sans", sans-serif'],
      ['Candara', 'Candara, sans-serif'],
      ['Verdana', 'Verdana, sans-serif'],
      ['Impact', 'Impact, sans-serif'],
      ['Droid', '"Droid Sans", monospace'],
      ['FingerPaint', 'FingerPaint, cursive'],
      ['JollyLodger', 'JollyLodger, cursive'],
      ['Ubuntu', 'Ubuntu, monospace'],
      ['Lobster', 'Lobster, cursive'],
      ['Chlorinar Turtles', 'Chlorinar, sans-serif'],
      ['Comic Sans', 'LDFComicSans, cursive'],
    ];
    this.pushFonts();

    if (document.readyState === 'complete') {
      queueMicrotask(() => this.handleEvent({ type: 'load' }));
    } else {
      window.addEventListener('load', this);
    }
  }

  hydrateFromStorage() {
    const saved = this.getStorageOptions();
    if (!saved || typeof saved !== 'object') {
      return;
    }

    if (saved.theme !== undefined && !Number.isNaN(Number.parseInt(saved.theme, 10))) {
      const parsedTheme = Number.parseInt(saved.theme, 10);
      if (parsedTheme >= 0 && parsedTheme <= this.data.custom_themeIndex) {
        this.data.theme = parsedTheme;
      }
    }

    if (saved.shape !== undefined && !Number.isNaN(Number.parseInt(saved.shape, 10))) {
      const parsedShape = Number.parseInt(saved.shape, 10);
      if (parsedShape >= 0 && parsedShape < this.shapes.length) {
        this.data.shape = parsedShape;
      }
    }

    if (typeof saved.panelpos === 'string' && saved.panelpos) {
      this.data.panelpos = saved.panelpos;
    }

    if (typeof saved.skewNormalize === 'boolean') {
      this.data.skewNormalize = saved.skewNormalize;
    }

    if (saved.skewnessTreshold !== undefined && !Number.isNaN(Number.parseFloat(saved.skewnessTreshold))) {
      const skew = Number.parseFloat(saved.skewnessTreshold);
      this.data.skewnessTreshold = skew >= 0 && skew <= 0.5 ? skew : 0.5;
    }

    if (typeof saved.directFont === 'string' && saved.directFont) {
      this.data.directFont = saved.directFont;
    }

    if (saved.custom && typeof saved.custom === 'object') {
      this.data.custom = saved.custom;
      this.themes[this.data.custom_themeIndex] = saved.custom;
    } else if (this.data.theme === this.data.custom_themeIndex) {
      this.data.theme = 0;
    }
  }

  addView(view) {
    this.views[view.name] = view;
    view.app = this;
  }

  addFetcher(fetcher) {
    fetcher.types.forEach((type) => {
      this.fetchers[type] = fetcher;
    });
    fetcher.app = this;
  }

  pushUrlHash(hash) {
    if (hash === window.location.hash) {
      this.route();
      return true;
    }

    this.backToReset = !window.location.hash.slice(1);
    this.lastUrlHashChangePushedByScript = true;

    try {
      window.location.hash = hash;
    } catch {
      return false;
    }
    return true;
  }

  reset() {
    if (!window.location.hash.slice(1)) {
      return;
    }

    if (this.backToReset) {
      window.history.back();
    } else {
      this.pushUrlHash('');
    }
  }

  switchUIState(state) {
    if (!this.UIStateViewMap[state]) {
      throw new Error(`Undefined state ${state}`);
    }

    if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) {
      document.activeElement.blur();
    }

    const viewNames = Object.keys(this.views);
    const currentUIState = this.currentUIState;
    viewNames.forEach((viewName) => {
      const visible = this.UIStateViewMap[state].includes(viewName);
      this.views[viewName][visible ? 'show' : 'hide'](currentUIState, state);
    });

    this.currentUIState = state;
  }

  handleData(text, title) {
    const safeText = String(text || '');
    this.logAction('WordCloudApp::handleData', `${title || ''} (${safeText.length})`);

    if (!safeText.length) {
      this.switchUIState(this.UI_STATE_ERROR_WITH_DASHBOARD);
      this.views.loading.updateLabel(this.views.loading.LABEL_ERROR_DATA);
      return;
    }

    this.currentFetcher = undefined;
    this.views.loading.updateLabel(this.views.loading.LABEL_ANALYZING);
    this.data.title = title;

    const useWorker = Boolean(WordFreq && WordFreq.isSupported && !this.forceSyncWordFreq);
    if (useWorker) {
      let volume = 0;
      try {
        this.wordfreq = WordFreq(this.wordfreqOption)
          .process(safeText)
          .getVolume((vol) => {
            volume = vol;
          })
          .getList((list) => {
            this.wordfreq = undefined;
            this.handleList(list, volume);
          });
        return;
      } catch {
        this.forceSyncWordFreq = true;
      }
    }

    if (window.WordFreqSync) {
      this.wordfreq = window.setTimeout(() => {
        const wordfreqsync = window.WordFreqSync(this.wordfreqOption);
        const list = wordfreqsync.process(safeText);
        const volume = wordfreqsync.getVolume();
        this.wordfreq = undefined;
        this.handleList(list, volume);
      }, 0);
    } else {
      this.switchUIState(this.UI_STATE_ERROR_WITH_DASHBOARD);
      this.views.loading.updateLabel(this.views.loading.LABEL_ERROR_DATA);
    }
  }

  stopHandleData() {
    if (!this.wordfreq) {
      return;
    }

    if (typeof this.wordfreq === 'object' && typeof this.wordfreq.stop === 'function') {
      this.wordfreq.stop(false);
    } else {
      window.clearTimeout(this.wordfreq);
    }
    this.wordfreq = undefined;
  }

  handleList(list, vol) {
    this.logAction('WordCloudApp::handleList', `${list.length}; vol=${vol}`);

    if (!list.length) {
      this.switchUIState(this.UI_STATE_ERROR_WITH_DASHBOARD);
      this.views.loading.updateLabel(this.views.loading.LABEL_ERROR_LIST);
      return;
    }

    this.switchUIState(this.UI_STATE_DASHBOARD);

    this.data.list = list;
    if (this.data.gridSize === undefined) {
      this.data.gridSize = 5;
    }

    this.calculateWeightFactor(vol);
    this.draw();
  }

  draw() {
    const canvasView = this.views.canvas;
    canvasView.setDimension();

    if (this.dashboardEvent) {
      this.setStorage();
    }

    canvasView.draw(this.getWordCloudOption());
    this.setStorage();

    const parsedHash = this.parseHash();
    this.logAction(`WordCloudApp::draw::${parsedHash[0]}`, parsedHash[1].slice(0, 128));
  }

  getCanvasElement() {
    return this.views.canvas.canvasElement;
  }

  calculateWeightFactor(vol) {
    const width = this.views.canvas.documentWidth;
    const height = this.views.canvas.documentHeight;
    const safeVol = Math.max(vol || 1, 1);
    this.data.weightFactor = Math.sqrt((width * height) / safeVol);
    this.data.unitweightFactor = this.data.weightFactor / 3;
  }

  buildCustomColorCallback(custom) {
    if (!custom) {
      return 'random-dark';
    }

    if (custom.textcolorType === 'random') {
      return resolveRandomStyleColor(custom.textcolorRandomName, this.themes);
    }

    const ccolor = custom.color;
    if (!ccolor || typeof ccolor !== 'object') {
      return typeof ccolor === 'string' || typeof ccolor === 'function' ? ccolor : 'random-dark';
    }

    if (ccolor.type === 'palette' && Array.isArray(ccolor.ccolorset) && ccolor.ccolorset.length) {
      return randomColorGenerator(ccolor.ccolorset);
    }

    if (ccolor.type === 'dualtone') {
      const topwordColor = ccolor.topword || '#dd4b39';
      const otherwordColor = ccolor.otherword || '#333333';

      if (Array.isArray(ccolor.wordlist) && ccolor.wordlist.length) {
        const highlightSet = new Set(
          ccolor.wordlist.map((w) => String(w).trim().toLowerCase()).filter(Boolean)
        );
        if (highlightSet.size > 0) {
          return (word) =>
            highlightSet.has(String(word).trim().toLowerCase()) ? topwordColor : otherwordColor;
        }
      }

      const nword = Math.max(Number.parseInt(ccolor.nword, 10) || 10, 0);
      let drawnIndex = 0;
      return () => {
        drawnIndex += 1;
        return drawnIndex <= nword ? topwordColor : otherwordColor;
      };
    }

    return 'random-dark';
  }

  getWordCloudOption() {
    const option = {
      list: this.data.list || [],
      gridSize: this.data.gridSize ?? 5,
      weightFactor: this.data.weightFactor ?? 1,
      rotateRatio: 0,
      drawOutOfBound: false,
    };

    const isCustomTheme = this.data.theme === this.data.custom_themeIndex && Boolean(this.data.custom);

    if (!isCustomTheme) {
      const presetIndex =
        this.data.theme >= 0 && this.data.theme < this.data.custom_themeIndex ? this.data.theme : 0;
      const preset = this.themes[presetIndex];
      option.fontFamily = this.data.directFont || preset.fontFamily;
      option.color = preset.color;
      option.backgroundColor = preset.backgroundColor;
    } else {
      const custom = this.data.custom;
      option.fontFamily = custom.fontFamily || SANS_SERIF_FONTS;
      option.backgroundColor = custom.backgroundColor || '#363636';
      option.color = this.buildCustomColorCallback(custom);
    }

    const shapeIndex =
      this.data.shape >= 0 && this.data.shape < this.shapes.length ? this.data.shape : 0;
    const shapeConfig = this.shapes[shapeIndex];
    Object.assign(option, shapeConfig);

    // Single-pass cosine skewness normalization adapter over unmodified wordcloud2.js.
    if (this.data.skewNormalize && Array.isArray(option.list) && option.list.length > 0) {
      const baseFactor = typeof option.weightFactor === 'function' ? null : Number(option.weightFactor) || 1;
      const baseFn = typeof option.weightFactor === 'function' ? option.weightFactor : null;
      const total = option.list.length;
      const threshold = this.data.skewnessTreshold ?? 0.5;
      let itemIndex = 0;

      option.weightFactor = (weight) => {
        const normalized = normWeight(itemIndex, weight, total, threshold);
        itemIndex += 1;
        return baseFn ? baseFn(normalized) : normalized * baseFactor;
      };
    }

    return option;
  }

  getStorageOptions() {
    return this.storage.get('storeoptions', {});
  }

  setStorage() {
    const existing = this.getStorageOptions();
    const excludeFields = new Set(['title', 'list']);
    const payload = { ...existing };

    for (const [field, value] of Object.entries(this.data)) {
      if (excludeFields.has(field) || typeof value === 'function') {
        continue;
      }
      if (field === 'custom' && value && typeof value === 'object') {
        const sanitizedCustom = { ...value };
        if (typeof sanitizedCustom.color === 'function') {
          delete sanitizedCustom.color;
        }
        payload.custom = sanitizedCustom;
      } else {
        payload[field] = value;
      }
    }

    if (!this.data.custom) {
      delete payload.custom;
    }

    if (this.DEBUG_LOG) {
      console.log('StoreOptions.set:', payload);
    }
    this.storage.set('storeoptions', payload);
  }

  tooglePanel(show) {
    const dashboardEl = document.getElementById('wc-dashboard');
    if (!dashboardEl) {
      return;
    }
    const navbarEl = dashboardEl.querySelector('.navbar');
    const toggleSideEl = dashboardEl.querySelector('.wrap-toogleside');
    if (navbarEl) {
      navbarEl.classList.toggle('d-none', !show);
    }
    if (toggleSideEl) {
      toggleSideEl.classList.toggle('d-none', Boolean(show));
    }
  }

  reposPanel(position) {
    const pos = position || this.data.panelpos || 'fixed-bottom-left';
    const dashboardEl = document.getElementById('wc-dashboard');
    if (dashboardEl) {
      dashboardEl.classList.remove('fixed-top', 'fixed-bottom-left', 'fixed-bottom');
      dashboardEl.classList.add(pos);
    }

    const pickFontBtn = document.getElementById('btn-pickfont');
    const btnGroup = pickFontBtn?.closest('.btn-group');
    if (btnGroup) {
      const isTop = pos === 'fixed-top';
      btnGroup.classList.toggle('dropdown', isTop);
      btnGroup.classList.toggle('dropup', !isTop);
    }
  }

  pushFonts() {
    const fontSelect = document.getElementById('font-custom');
    if (fontSelect) {
      fontSelect.innerHTML = '';
      for (const [label, family] of this.fontsets) {
        const opt = document.createElement('option');
        opt.value = family;
        opt.textContent = label;
        fontSelect.appendChild(opt);
      }
    }

    const dropdownList = document.getElementById('dashboard-dropdown-fonts');
    if (dropdownList) {
      dropdownList.innerHTML = '';
      for (const [label, family] of this.fontsets) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'dropdown-item';
        link.href = '#';
        link.dataset.action = 'swfont';
        link.dataset.font = family;
        link.textContent = label;
        li.appendChild(link);
        dropdownList.appendChild(li);
      }
    }
  }

  route() {
    const hash = window.location.hash.slice(1);

    if (this.backToReset && !this.lastUrlHashChangePushedByScript) {
      this.backToReset = false;
    }

    this.lastUrlHashChangePushedByScript = false;

    if (this.currentFetcher) {
      this.currentFetcher.stop();
      this.currentFetcher = undefined;
    }

    this.stopHandleData();

    if (!hash) {
      this.switchUIState(this.UI_STATE_SOURCE_DIALOG);
      this.logAction('WordCloudApp::route::source-dialog');
      return;
    }

    const [dataType, data] = this.parseHash();
    this.logAction(`WordCloudApp::route::${dataType}`, data.slice(0, 128));

    const fetcherType = dataType.includes('.') ? dataType.split('.')[0] : dataType;

    if (fetcherType in this.fetchers) {
      this.switchUIState(this.UI_STATE_WORKING);
      const fetcher = (this.currentFetcher = this.fetchers[fetcherType]);
      this.views.loading.updateLabel(fetcher.LABEL_VERB);
      fetcher.getData(dataType, data);
    } else {
      this.reset();
    }
  }

  logAction(action, label, val) {
    if (!this.DEBUG_LOG) {
      return;
    }
    const parts = [action];
    if (label !== undefined) {
      parts.push(label);
    }
    if (val !== undefined) {
      parts.push(val);
    }
    console.log(parts.join('; '));
  }

  parseHash() {
    const hash = window.location.hash.slice(1);
    const match = hash.match(/^([^:]+):?(.*)$/);
    if (!match) {
      return ['', ''];
    }
    return [match[1] || '', match[2] || ''];
  }

  handleEvent(evt) {
    switch (evt.type) {
      case 'load':
        window.removeEventListener('load', this);
        window.addEventListener('hashchange', this);
        this.route();
        break;
      case 'hashchange':
        this.route();
        break;
    }
  }

  uninit() {
    window.removeEventListener('load', this);
    window.removeEventListener('hashchange', this);
  }
}

WordCloudApp.prototype.UI_STATE_LOADING = 0;
WordCloudApp.prototype.UI_STATE_SOURCE_DIALOG = 1;
WordCloudApp.prototype.UI_STATE_WORKING = 2;
WordCloudApp.prototype.UI_STATE_DASHBOARD = 3;
WordCloudApp.prototype.UI_STATE_LIST_DIALOG = 4;
WordCloudApp.prototype.UI_STATE_ERROR_WITH_DASHBOARD = 5;
WordCloudApp.prototype.UI_STATE_ABOUT_DIALOG = 6;
WordCloudApp.prototype.UI_STATE_OPTION_DIALOG = 7;
