/*!
 * wcloud-lite - Upstream timdream Core Bundle Entry (build/timdream-app.js)
 * Re-exports unmodified upstream libraries from src/lib/timdream/:
 *   - wordcloud2.js v1.2.3 : https://github.com/timdream/wordcloud2.js/blob/gh-pages/src/wordcloud2.js
 *   - wordfreq.js          : https://github.com/timdream/wordfreq/blob/gh-pages/src/wordfreq.js
 *   - l10n.js              : https://github.com/timdream/webL10n/blob/master/l10n.js
 *   (Workers emitted verbatim from src/lib/timdream/wordfreq.worker.js & downloader-worker.js)
 *
 * See src/lib/timdream/SOURCES.md for pinned commits and upstream licenses.
 * Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import '../lib/timdream/wordcloud2.js';
import '../lib/timdream/wordfreq.js';
import '../lib/timdream/l10n.js';

const WordCloud = window.WordCloud;
const WordFreq = window.WordFreq;
const webL10n = document.webL10n;
const _ = webL10n.get;
const __ = webL10n.translate;

if (window._ === undefined) {
  window._ = _;
}
if (window.__ === undefined) {
  window.__ = __;
}

export { WordCloud, WordFreq, webL10n, _, __ };
