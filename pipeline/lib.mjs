import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SOURCE_BASE = 'https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir';

// Long commentaries are split at paragraph breaks into chunks of at most this
// many characters, so each translation request stays well within max_tokens.
const CHUNK_CHARS = 12000;

export async function readJson(file, fallback = null) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value) + '\n');
}

// Returns the original text of every verse of a surah (index = ayah - 1).
// Tafsirs missing from spa5k/tafsir_api are kept in originals/<id>/, in the same
// format; a surah they do not cover has no file and comes back empty.
export async function fetchOriginal(id, surah, count) {
  const localDir = path.join(ROOT, 'originals', id);
  if (existsSync(localDir)) {
    const texts = Array(count).fill('');
    for (const e of await readJson(path.join(localDir, `${surah}.json`), [])) texts[e.ayah - 1] = (e.text ?? '').trim();
    return texts;
  }
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${SOURCE_BASE}/${id}/${surah}.json`);
    if (res.ok) {
      const texts = Array(count).fill('');
      for (const e of await res.json()) texts[e.ayah - 1] = (e.text ?? '').trim();
      return texts;
    }
    if (attempt >= 4) throw new Error(`${id}/${surah}: HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

// Several verses often share one commentary: translate each distinct text once.
export function groupVerses(texts) {
  const groups = new Map();
  texts.forEach((text, i) => {
    if (!text) return;
    if (!groups.has(text)) groups.set(text, []);
    groups.get(text).push(i + 1);
  });
  return [...groups].map(([text, ayahs]) => ({ text, ayahs }));
}

export function splitChunks(text) {
  if (text.length <= CHUNK_CHARS) return [text];
  const chunks = [];
  let current = '';
  for (const para of text.split(/\n+/)) {
    // A single paragraph longer than the limit is cut at sentence ends.
    const pieces = para.length > CHUNK_CHARS ? para.split(/(?<=[.؟!:۔])\s+/) : [para];
    for (const piece of pieces) {
      if (current && current.length + piece.length + 1 > CHUNK_CHARS) {
        chunks.push(current);
        current = '';
      }
      current = current ? `${current}\n${piece}` : piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// `out` is an optional sub-folder, used to keep pilot runs apart from the
// published data (e.g. "pilot/claude-haiku-5-5").
export function translationFile(lang, id, surah, out = '') {
  return path.join(ROOT, out, 'translations', lang, id, `${surah}.json`);
}

export function synthesisFile(surah, out = '') {
  return path.join(ROOT, out, 'synthesis', `${surah}.json`);
}

export function parseSurahs(spec) {
  const out = new Set();
  for (const part of spec.split(',')) {
    const [a, b] = part.split('-').map(Number);
    for (let n = a; n <= (b || a); n++) if (n >= 1 && n <= 114) out.add(n);
  }
  return [...out].sort((x, y) => x - y);
}

export function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
