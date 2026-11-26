/*!
 * wcloud-lite - Runtime Configuration & Stopwords Constants
 * Adapted from: https://github.com/timdream/wordcloud/blob/main/assets/vars-sample.js
 *
 * Copyright 2011, 2013-2019 Timothy Guan-tin Chien and other contributors.
 * Modified work Copyright (c) 2026 Idx
 * Released under the MIT license
 */

export const FACEBOOK_APP_ID = '';
export const IMGUR_CLIENT_ID = '';
export const DONATE_HTML = '';

export const ASSET_WCLOUD_URI = './build/';
export const WORKER_BASE_URI = './build/workers/';

export const INDONESIAN_STOPWORDS = [
  'di',
  'yang',
  'dan',
  'untuk',
  'dengan',
  'pada',
  'dari',
  'ini',
];

export const isDebugEnabled = () => Boolean(window._DEBUG_);
