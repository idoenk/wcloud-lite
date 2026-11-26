/*!
 * wcloud-lite - Data Fetchers (Text, File, List, Wikipedia)
 * Adapted from: https://github.com/timdream/wordcloud/blob/main/assets/fetchers.js
 *
 * Copyright 2011, 2013-2019 Timothy Guan-tin Chien and other contributors.
 * Modified work Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import { _ } from '../timdream/index.js';
import { WORKER_BASE_URI } from './vars.js';
import { LoadingView } from './views.js';
import {
  decodeBase64Utf8,
  encodeBase64Utf8,
  normalizeWordListText,
} from './utils/text-parser.js';

export class Fetcher {}
Fetcher.prototype.LABEL_VERB = LoadingView.prototype.LABEL_LOADING;

export class TextFetcher extends Fetcher {
  constructor() {
    super();
    this.types = ['text', 'base64'];
  }

  stop() {
    window.clearTimeout(this.timer);
  }

  getData(dataType, data) {
    let text = '';
    if (dataType === 'text' && !data) {
      text = this.app.views['source-dialog'].panels.cp.textareaElement.value;
    } else if (dataType === 'base64') {
      text = decodeBase64Utf8(data);
    } else {
      text = decodeURIComponent(data);
    }

    this.timer = window.setTimeout(() => {
      this.app.handleData(text, 'Custom TextData');
    }, 0);
  }
}

export class FileFetcher extends Fetcher {
  constructor() {
    super();
    this.types = ['file'];
  }

  stop() {
    if (!this.reader) {
      return;
    }
    this.reader.abort();
    this.reader = null;
  }

  getData() {
    const filePanelView = this.app.views['source-dialog'].panels.file;
    const fileElement = filePanelView.fileElement;
    if (!fileElement.files.length) {
      this.app.reset();
      this.app.views['source-dialog'].showPanel(filePanelView);
      return;
    }

    const file = fileElement.files[0];
    const reader = (this.reader = new FileReader());
    reader.onloadend = () => {
      if (reader !== this.reader || reader.result === null) {
        return;
      }

      const rawText = String(reader.result);

      if (filePanelView.contenttypeElement.value === 'wordlist') {
        const normalized = normalizeWordListText(
          rawText,
          filePanelView.formatorderElement.value,
          filePanelView.separatorElement.value
        );
        if (!normalized) {
          this.app.handleData('');
          return;
        }

        const hash = window.btoa
          ? `#base64-list:${encodeBase64Utf8(normalized)}`
          : `#list:${encodeURIComponent(normalized)}`;

        const hashPushed = this.app.pushUrlHash(hash);
        if (!hashPushed) {
          this.app.pushUrlHash('#list');
        }
      } else {
        this.app.handleData(rawText, file.name);
      }
    };

    reader.readAsText(file, filePanelView.encodingElement.value || 'UTF-8');
  }
}

export class ListFetcher extends Fetcher {
  constructor() {
    super();
    this.types = ['list', 'base64-list'];
  }

  stop() {
    window.clearTimeout(this.timer);
  }

  getData(dataType, data) {
    let text = '';
    if (dataType === 'list' && !data) {
      text = this.app.views['list-dialog'].textElement.value;
    } else if (dataType === 'base64-list') {
      text = decodeBase64Utf8(data);
    } else {
      text = decodeURIComponent(data);
    }

    let vol = 0;
    const list = [];

    text.split(/\r?\n/).forEach((line) => {
      if (!line) {
        return;
      }
      const item = line.split('\t').reverse();
      if (!item[0] || !item[1]) {
        return;
      }

      const count = Number.parseInt(item[1], 10);
      if (Number.isNaN(count)) {
        return;
      }

      const word = item[0].trim();
      if (!word) {
        return;
      }

      vol += word.length * count * count;
      list.push([word, count]);
    });

    this.timer = window.setTimeout(() => {
      this.app.handleList(list, vol);
    }, 0);
  }
}

export class JSONPScriptDownloader {
  stop() {
    this.currentRequest = undefined;
    window.clearTimeout(this.timer);
  }

  reset() {
    this.stop();
  }

  handleEvent(evt) {
    const el = evt.target;
    window[el.getAttribute('data-callback-name')] = undefined;
    this.currentRequest = undefined;
    window.clearTimeout(this.timer);

    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }

    if (evt.type === 'error') {
      this.fetcher.handleResponse();
    }
  }

  getNewCallbackName() {
    const callbackName =
      this.CALLBACK_PREFIX + Math.random().toString(36).slice(2, 10).toUpperCase();

    window[callbackName] = (...args) => {
      if (this.currentRequest !== callbackName) {
        return;
      }
      this.currentRequest = undefined;
      window.clearTimeout(this.timer);
      this.fetcher.handleResponse(...args);
    };

    return callbackName;
  }

  requestData(url) {
    const callbackName = (this.currentRequest = this.getNewCallbackName());
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}callback=${callbackName}`;

    const el = (this.scriptElement = document.createElement('script'));
    el.src = fullUrl;
    el.setAttribute('data-callback-name', callbackName);
    el.addEventListener('load', this);
    el.addEventListener('error', this);

    document.head.appendChild(el);

    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      if (typeof window[callbackName] === 'function') {
        window[callbackName]();
      }
    }, this.fetcher.TIMEOUT);
  }
}
JSONPScriptDownloader.prototype.CALLBACK_PREFIX = 'JSONPCallbackX';

export class JSONPWorkerDownloader {
  stop() {
    if (!this.worker) {
      return;
    }
    window.clearTimeout(this.timer);
    this.worker.terminate();
    this.worker = null;
  }

  reset() {
    this.stop();
  }

  requestData(url) {
    if (this.worker) {
      this.stop();
    }

    this.worker = new Worker(`${this.PATH}downloader-worker.js`);
    this.worker.addEventListener('message', this);
    this.worker.addEventListener('error', this);
    this.worker.postMessage(url);

    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.stop();
      this.fetcher.handleResponse();
    }, this.fetcher.TIMEOUT);
  }

  handleEvent(evt) {
    let data = [];
    if (evt.type === 'message') {
      data = evt.data;
    } else if (evt.type === 'error') {
      evt.preventDefault();
    }
    this.stop();
    this.fetcher.handleResponse(...data);
  }
}
JSONPWorkerDownloader.prototype.PATH = WORKER_BASE_URI;

export class JSONPFetcher extends Fetcher {
  reset() {
    if (this.downloader) {
      this.downloader.reset();
    }
  }

  stop() {
    if (this.downloader) {
      this.downloader.stop();
    }
    this.downloader = null;
  }

  requestData(url) {
    if (this.USE_WORKER_WHEN_AVAILABLE && window.Worker) {
      try {
        this.downloader = new JSONPWorkerDownloader();
        this.downloader.fetcher = this;
        this.downloader.requestData(url);
        return;
      } catch {
        // Fallback to script tag JSONP when Worker construction fails
      }
    }

    this.downloader = new JSONPScriptDownloader();
    this.downloader.fetcher = this;
    this.downloader.requestData(url);
  }
}
JSONPFetcher.prototype.LABEL_VERB = LoadingView.prototype.LABEL_DOWNLOADING;
JSONPFetcher.prototype.USE_WORKER_WHEN_AVAILABLE = true;
JSONPFetcher.prototype.TIMEOUT = 30 * 1000;

export class WikipediaFetcher extends JSONPFetcher {
  constructor() {
    super();
    this.types = ['wiki', 'wikipedia'];
    this.params = [
      ['action', 'query'],
      ['prop', 'revisions'],
      ['rvprop', 'content'],
      ['redirects', '1'],
      ['format', 'json'],
      ['rvparse', '1'],
    ];
  }

  getData(dataType, data) {
    const params = [...this.params];
    const dataTypeArr = dataType.split('.');
    const lang = dataTypeArr[1] || this.DEFAULT_LANG;

    if (dataTypeArr[2]) {
      params.push(['converttitles', dataTypeArr[2]]);
    }
    let title = data;
    try {
      title = decodeURIComponent(data);
    } catch {
      // Keep raw title if URI decoding fails
    }
    params.push(['titles', title]);

    const query = params
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    const url = `${this.WIKIPEDIA_API_URL.replace(/%lang/, lang)}?${query}`;

    this.requestData(url);
  }

  handleResponse(res) {
    if (!res || !res.query || !res.query.pages) {
      this.app.handleData('');
      return;
    }

    const pageId = Object.keys(res.query.pages)[0];
    const page = res.query.pages[pageId];
    if (!page || !('revisions' in page)) {
      this.app.handleData('');
      return;
    }

    const text = page.revisions[0]['*'].replace(this.PARSED_WIKITEXT_REGEXP, '');
    this.app.handleData(text, _('wikipedia-title', { title: page.title }));
  }
}
WikipediaFetcher.prototype.WIKIPEDIA_API_URL = 'https://%lang.wikipedia.org/w/api.php';
WikipediaFetcher.prototype.DEFAULT_LANG = 'en';
WikipediaFetcher.prototype.PARSED_WIKITEXT_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|&\w+;|<script.+?\/script>/gi;
