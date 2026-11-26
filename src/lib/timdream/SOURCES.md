# Vendored Upstream Sources (`src/lib/timdream/`)

All files in this directory are **100% unmodified verbatim copies** of upstream libraries from Timothy Guan-tin Chien's repositories (packaged into `build/timdream-app.js` and `build/workers/*`).

## Why These Files Are Vendored Here Instead of `node_modules`

Rather than relying on `git submodule` or relative paths outside this repository, these files are vendored locally to keep `wcloud-lite` **self-contained**, **version-locked**, and reproducible:

1. **Outdated or unavailable on npm:**
   - `wordfreq` on npm (`0.1.0-dev`) is outdated, targets Node CLI (`main: ./src/wordfreq.worker.js`), and bundles obsolete CLI dependencies (`optimist`).
   - `timdream/webL10n` (`l10n.js`) is a 2013 fork (`defer-loading-fix2`) that is not published as an npm package.
   - `downloader-worker.js` is an internal worker script belonging to `timdream/wordcloud`, not a standalone npm package.
2. **Consistent upstream core grouping:**
   - Although `wordcloud2.js` (`v1.2.3`) is published on npm as `wordcloud`, keeping all 5 `timdream` core files together under `src/lib/timdream/` locks the exact tested snapshot and isolates all unmodified upstream code in one directory (`build/timdream-app.js`).
3. **Zero modifications to upstream files:**
   - Earlier `wcloud-lite` versions (circa 2014) patched `wordcloud2.js` and `wordfreq.worker.js` directly.
   - In the modernized architecture, **none of the files in `src/lib/timdream/` are modified** (0-byte diff against upstream). All `wcloud-lite` customizations (`shapeLove`, `directFont`, Dual-Tone / Palette color callbacks, cosine skewness normalization, and Indonesian stopwords via `wordfreqOption.stopWords`) are implemented cleanly as adapters in `src/wcloud/`.

---

## Upstream Provenance Table

| Local File | Origin Repository & File URL | Pinned Commit / Version | Commit Date | License |
| :--- | :--- | :--- | :--- | :--- |
| `wordcloud2.js` | [timdream/wordcloud2.js — `src/wordcloud2.js`](https://github.com/timdream/wordcloud2.js/blob/gh-pages/src/wordcloud2.js) | `v1.2.3` (`bce07098d4a7b2c298c1b51715f6370b07d80ef2`) | 2024-11-14 | MIT |
| `wordfreq.js` | [timdream/wordfreq — `src/wordfreq.js`](https://github.com/timdream/wordfreq/blob/gh-pages/src/wordfreq.js) | `2424edd4b3b2d19e2accd927b519005b635a5218` | 2021-01-30 | MIT |
| `wordfreq.worker.js` | [timdream/wordfreq — `src/wordfreq.worker.js`](https://github.com/timdream/wordfreq/blob/gh-pages/src/wordfreq.worker.js) | `2424edd4b3b2d19e2accd927b519005b635a5218` | 2021-01-30 | MIT |
| `l10n.js` | [timdream/webL10n — `l10n.js`](https://github.com/timdream/webL10n/blob/master/l10n.js) | `cb2bc279ef1751e87635454900a350b1f4cefecb` | 2013-06-13 | MIT |
| `downloader-worker.js` | [timdream/wordcloud — `assets/downloader-worker.js`](https://github.com/timdream/wordcloud/blob/main/assets/downloader-worker.js) | `c2367977d2bc86c7bff36468684d5b3242423f83` | 2024-06-15 | MIT |
