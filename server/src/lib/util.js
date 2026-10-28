import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function genReference() {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `HII-${s}`;
}

export const REF_RE = /^HII-[A-Z0-9]{6}$/;
export const normRef = (v) => String(v || '').trim().toUpperCase();

// Strips zero-width / bidi-control / Unicode "tag" characters that can be used as hidden tracking markers.
const HIDDEN = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFEFF\u{E0000}-\u{E007F}]/gu;
export function cleanText(v) {
  return String(v ?? '').normalize('NFC').replace(HIDDEN, '').replace(/\r\n/g, '\n').trim();
}

export const sigFor = () => `EMD-AUTH-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
