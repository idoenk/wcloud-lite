/*!
 * wcloud-lite - Word List Parser, Cosine Weight Normalizer & UTF-8 Base64 Utilities
 * Origin: https://github.com/idoenk/wcloud-lite
 *
 * Copyright (c) 2026 Idx
 * Released under the MIT license
 */

export const SEPARATOR_MAP = {
  sep_colon: ':',
  sep_tab: '\t',
  sep_comma: ',',
  sep_semicolon: ';',
  sep_pipe: '|',
  sep_space: ' ',
};

/**
 * Normalizes a pasted or uploaded word list into "<FREQ>\t<WORD>" lines.
 * Supports both "wordfreq" (Word <sep> Frequency) and "freqword" (Frequency <sep> Word).
 */
export function normalizeWordListText(rawText, order, separatorKey) {
  const separator = SEPARATOR_MAP[separatorKey];
  if (separator === undefined) {
    return null;
  }

  if (order === 'freqword' && separatorKey === 'sep_tab') {
    return rawText;
  }

  const lines = String(rawText || '').split(/\r?\n/);
  const output = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    let word = '';
    let freq = '';

    if (separatorKey === 'sep_space') {
      if (order === 'wordfreq') {
        const match = line.match(/^(.+?)\s+([^\s]+)$/);
        if (!match) {
          continue;
        }
        word = match[1].trim();
        freq = match[2].trim();
      } else {
        const match = line.match(/^([^\s]+)\s+(.+)$/);
        if (!match) {
          continue;
        }
        freq = match[1].trim();
        word = match[2].trim();
      }
    } else {
      const idx = order === 'wordfreq' ? line.lastIndexOf(separator) : line.indexOf(separator);
      if (idx === -1) {
        continue;
      }
      if (order === 'wordfreq') {
        word = line.slice(0, idx).trim();
        freq = line.slice(idx + separator.length).trim();
      } else {
        freq = line.slice(0, idx).trim();
        word = line.slice(idx + separator.length).trim();
      }
    }

    if (word && freq) {
      output.push(`${freq}\t${word}`);
    }
  }

  return output.join('\n');
}

/**
 * Cosine approximation weight normalizer for skewed word frequency distributions.
 */
export function normWeight(iword, weight, wordLength, skewnessThreshold = 0.5) {
  const M_PI = Math.PI;
  const treshSbx = -(M_PI / 1.1);
  const radVal = (((M_PI / 2) + treshSbx) * iword) / Math.max(wordLength, 1);

  const treshArbMax = 0.5;
  const parsedSkew = Number.parseFloat(skewnessThreshold);
  const treshArbSkew = Number.isFinite(parsedSkew) && parsedSkew >= 0 && parsedSkew <= 0.5 ? parsedSkew : 0.5;

  const cosRad =
    Math.cos(radVal) /
    (Math.sqrt(iword + 1) / Math.pow((iword + 1) * treshArbMax, treshArbSkew));

  return weight * cosRad;
}

/**
 * Encodes UTF-8 strings cleanly for base64 URL hashes (compatible with legacy atob/decodeURIComponent).
 */
export function encodeBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function decodeBase64Utf8(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}
