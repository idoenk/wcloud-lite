# HTML5 Word Cloud (wcloud-lite)

Create a [Wordle](http://www.wordle.net/)-style tag cloud presentation on an HTML5 `<canvas>` element from a word list, plain text file, bulk text, or Wikipedia article — running entirely client-side in your browser.

Forked and modernized from [timdream/wordcloud](https://github.com/timdream/wordcloud) by [Timothy Guan-tin Chien](https://timdream.org/).

**Preview:** [https://idoenk.github.io/wcloud-lite/](https://idoenk.github.io/wcloud-lite/)

---

## Privacy

> **The actual content of the file or copy-pasted text is not transmitted to any server in any form.**
> Everything is processed on your computer directly, employing technologies in the browser known collectively as *HTML5* (`Canvas`, `FileReader`, `Web Workers`, and `localStorage`).

- **Zero tracking or analytics:** All upstream analytics, social widgets, and external sharing/upload hooks have been removed.
- **Local persistence only:** Custom theme, font, shape, panel position, and normalization settings are saved strictly in your browser's `localStorage`.
- **Optional external lookup:** Only when you explicitly choose **Examples → Wikipedia** does your browser fetch public article text directly from Wikipedia's [MediaWiki API](https://en.wikipedia.org/w/api.php).

---

## What's Different in `wcloud-lite`

Compared to upstream [timdream/wordcloud](https://github.com/timdream/wordcloud), `wcloud-lite` focuses on a lightweight, offline-capable generator with extended input parsing and customization:

- **Flexible Input Parsing (Copy & Paste & File Upload):**
  - Supports both **Word List** (`Word - Frequency` or `Frequency - Word` with configurable separators: `:`, `Tab`, `,`, `;`, `|`, `Space`) and **Bulk Text** (analyzed locally via `wordfreq` Web Worker).
  - Built-in **Indonesian stopwords** (`di`, `yang`, `dan`, `untuk`, `dengan`, `pada`, `dari`, `ini`) alongside English and CJK stopword sets without modifying upstream `wordfreq.worker.js`.
- **Extended Settings (`OptionDialogView`):**
  - **11 Preset Themes** + **Custom Theme** builder (custom background color with `vanilla-picker`, **14 bundled canvas fonts**, Sample Palette, **Dual-Tone** highlighting for Top-N words or Specific Words, and **1–5 Custom Color Palette**).
  - **6 Cloud Shapes:** Circle, Square, Triangle, Star, Pentagon, and **Love** (polar heart curve).
  - **Cosine Skewness Normalization:** Optional non-destructive weight curve normalization with configurable threshold (`0`–`0.5`).
  - **Dashboard Controls:** Bottom-left / Bottom-center / Top-center toolbar placement, live font switcher, theme/shape cycling, size & gap tuning, Edit List modal, collapsible panel toggle, and timestamped PNG export.
- **Modern Zero-jQuery Stack:**
  - Removed jQuery, jQuery UI, Bootstrap 3, TODC Bootstrap 3, Font Awesome 4, IE shims, and deprecated social fetchers/sharers.
  - Built with vanilla ES modules, **Bootstrap 5**, a scratch-built **TODC-BS5** Google-style theme, **Bootstrap Icons**, and **Vite**.

---

## Architecture & Build Bundles

Running `npm run build` compiles the app with Vite into fixed-name assets under `build/` loaded directly by root [index.html](./index.html) (ready for static hosting / GitHub Pages):

| Bundle | Description |
| :--- | :--- |
| `build/timdream-app.js` + `build/workers/*` | 100% unmodified upstream `timdream/*` core libraries (`wordcloud2.js`, `wordfreq`, `webL10n`, `downloader-worker.js`). |
| `build/vendor-app.js` + `build/vendor-app.css` | External npm dependencies (`bootstrap` v5, `bootstrap-icons`, `vanilla-picker`, `store`). |
| `build/wcloud-app.js` + `build/wcloud-app.css` | Custom `wcloud-lite` vanilla JS modules, adapters, custom TODC-BS5 theme, and bundled canvas fonts. |

See [src/lib/timdream/SOURCES.md](https://github.com/idoenk/wcloud-lite/blob/feature/modernize-structure/src/lib/timdream/SOURCES.md) for the exact upstream repository URLs, pinned commit SHAs, and rationale for vendored upstream files.

---

## Libraries Used & Acknowledgements

### Upstream Core Libraries
- [wordcloud2.js](https://github.com/timdream/wordcloud2.js) (`v1.2.3`) — standalone library for rendering word clouds on HTML5 canvas.
- [wordfreq](https://github.com/timdream/wordfreq) — text corpus frequency calculation in JavaScript (with Web Workers), incorporating Christopher McKenzie's JavaScript implementation of the [Porter Stemming Algorithm](http://tartarus.org/~martin/PorterStemmer/).
- [webL10n](https://github.com/timdream/webL10n) — lightweight client-side `.properties` localization library (by Fabien Cazenave / Mozilla, timdream fork).

### External Dependencies & Tooling
- [Bootstrap 5](https://getbootstrap.com/) + custom TODC-inspired Google theme (`src/styles/todc-bs5.css`).
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [vanilla-picker](https://vanilla-picker.js.org/) — lightweight zero-dependency HSV color picker.
- [store.js](https://github.com/marcuswestin/store.js) — cross-browser `localStorage` wrapper.
- [Vite](https://vite.dev/) — bundler & development toolchain.
- [MediaWiki API](https://en.wikipedia.org/w/api.php) — used only for the optional Wikipedia example source.

### Upstream Contributors
- [Grassboy Wu](https://github.com/Grassboy) — contributions to the upstream rewrite of `timdream/wordcloud`.
- [Yuren Ju](https://github.com/yurenju) — early upstream contributions to `timdream/wordcloud`.

---

## Development & Build

> **Note:** The `gh-pages` branch contains static production assets only (`index.html` and `build/`). For full source code and Vite build setup, check out the [`feature/modernize-structure`](https://github.com/idoenk/wcloud-lite/tree/feature/modernize-structure) branch.

Requires Node.js (`>= 18`).

```bash
# Install dependencies
npm install

# Build production bundles into ./build/
npm run build

# Watch mode (rebuilds ./build/ on changes)
npm run watch

# Serve locally over HTTP
npm run preview
```

> Because the app uses ES modules (`<script type="module">`), Web Workers, and XHR for `locales.ini`, serve the project over HTTP (e.g. `npm run preview`, Apache/Nginx, or GitHub Pages) rather than opening `index.html` via `file://`.

---

## Author, Credits & License

- **Original Author & Origin Repository:**
  Copyright 2011, 2013–2019 [Timothy Guan-tin Chien](https://timdream.org/) and other contributors — [https://github.com/timdream/wordcloud](https://github.com/timdream/wordcloud).
- **Fork & Modernization (`wcloud-lite`):**
  Modified work Copyright (c) 2026 Idx — [https://github.com/idoenk/wcloud-lite](https://github.com/idoenk/wcloud-lite).

Released under the MIT License. See [MIT-LICENSE.txt](./MIT-LICENSE.txt) for full details.
