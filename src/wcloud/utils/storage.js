/*!
 * wcloud-lite - LocalStorage Wrapper (StoreOptions)
 * Origin: https://github.com/idoenk/wcloud-lite
 *
 * Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import { store } from '../../vendor/index.js';

export class StoreOptions {
  get(name, fallback = {}) {
    try {
      const value = store.get(name);
      if (typeof value === 'string') {
        return JSON.parse(value) || fallback;
      }
      if (value && typeof value === 'object') {
        return value;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }

  set(name, value) {
    try {
      store.set(name, value);
    } catch {
      // Ignore storage quota or privacy-mode errors
    }
  }
}
