// Builds the translation or synthesis requests for a set of surahs and sends
// them to the Anthropic Message Batches API (50% cheaper, results within 24h).
// Each batch is recorded in jobs/<batch id>.json; collect.mjs writes the
// results once the batch has ended.
//
//   node pipeline/submit.mjs --task translate --surahs 103,112-114 --model claude-sonnet-5-5
//   node pipeline/submit.mjs --task synthesis --surahs 1 --model claude-sonnet-5-5 --dry-run
//   (--out pilot/<name> writes the results to a separate folder)
import { existsSync } from 'node:fs';

import Anthropic from '@anthropic-ai/sdk';

import { CORPUS, READING_LANGS, VERSE_COUNTS } from './catalog.mjs';
import {
  arg,
  fetchOriginal,
  groupVerses,
  parseSurahs,
  readJson,
  ROOT,
  splitChunks,
  synthesisFile,
  translationFile,
  writeJson,
} from './lib.mjs';
import {
  SYNTHESIS_SCHEMA,
  SYNTHESIS_SYSTEM,
  synthesisUser,
  translationSystem,
  translationUser,
} from './prompts.mjs';

const task = arg('task');
const surahs = parseSurahs(arg('surahs', ''));
const model = arg('model', 'claude-sonnet-5-5');
const out = arg('out', '');
const dryRun = process.argv.includes('--dry-run');

if (!['translate', 'synthesis'].includes(task) || surahs.length === 0) {
  console.error('Usage: submit.mjs --task translate|synthesis --surahs 1,2-5 [--model ID] [--out DIR] [--dry-run]');
  process.exit(1);
}

const MAX_REQUESTS = 90_000;
const MAX_BYTES = 200 * 1024 * 1024;

let seq = 0;
const requests = []; // { custom_id, params, meta }

async function buildTranslations() {
  for (const surah of surahs) {
    const count = VERSE_COUNTS[surah - 1];
    for (const tafsir of CORPUS) {
      const targets = READING_LANGS.filter(
        (lang) => lang !== tafsir.lang && !existsSync(translationFile(lang, tafsir.id, surah, out)),
      );
      if (targets.length === 0) continue;
      const groups = groupVerses(await fetchOriginal(tafsir.id, surah, count));
      for (const lang of targets) {
        groups.forEach((group, g) => {
          const chunks = splitChunks(group.text);
          chunks.forEach((text, c) => {
            requests.push({
              custom_id: `t${++seq}`,
              meta: { lang, id: tafsir.id, surah, group: g, ayahs: group.ayahs, chunk: c, chunks: chunks.length },
              params: {
                model,
                max_tokens: 32000,
                output_config: { effort: 'low' },
                system: [
                  { type: 'text', text: translationSystem(tafsir.lang, lang), cache_control: { type: 'ephemeral' } },
                ],
                messages: [
                  {
                    role: 'user',
                    content: translationUser({ tafsir, surah, ayahs: group.ayahs, chunk: c, chunks: chunks.length, text }),
                  },
                ],
              },
            });
          });
        });
      }
    }
    console.log(`surah ${surah}: ${requests.length} requests so far`);
  }
}

async function buildSyntheses() {
  const quran = await (
    await fetch('https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/ara-quranuthmanienc.min.json')
  ).json();
  for (const surah of surahs) {
    const count = VERSE_COUNTS[surah - 1];
    const existing = await readJson(synthesisFile(surah, out), {});
    const missing = [];
    for (let ayah = 1; ayah <= count; ayah++) {
      if (READING_LANGS.some((lang) => !existing[lang]?.[ayah - 1])) missing.push(ayah);
    }
    if (missing.length === 0) continue;
    const originals = await Promise.all(CORPUS.map((t) => fetchOriginal(t.id, surah, count)));
    for (const ayah of missing) {
      const sources = CORPUS.map((t, i) => ({ ...t, text: originals[i][ayah - 1] })).filter((s) => s.text);
      const verseText = quran.quran.find((v) => v.chapter === surah && v.verse === ayah).text;
      requests.push({
        custom_id: `s${++seq}`,
        meta: { surah, ayah, sources: sources.length },
        params: {
          model,
          max_tokens: 16000,
          output_config: { effort: 'medium', format: { type: 'json_schema', schema: SYNTHESIS_SCHEMA } },
          system: [{ type: 'text', text: SYNTHESIS_SYSTEM, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: synthesisUser({ surah, ayah, verseText, sources }) }],
        },
      });
    }
    console.log(`surah ${surah}: ${requests.length} requests so far`);
  }
}

if (task === 'translate') await buildTranslations();
else await buildSyntheses();

const inputChars = requests.reduce((n, r) => n + r.params.messages[0].content.length, 0);
console.log(`${requests.length} requests, ${(inputChars / 1e6).toFixed(2)} M characters of source text`);
if (dryRun || requests.length === 0) process.exit(0);

// Split into batches that respect the API limits.
const batches = [[]];
let bytes = 0;
for (const r of requests) {
  const size = Buffer.byteLength(JSON.stringify(r.params));
  const current = batches.at(-1);
  if (current.length >= MAX_REQUESTS || bytes + size > MAX_BYTES) {
    batches.push([]);
    bytes = 0;
  }
  batches.at(-1).push(r);
  bytes += size;
}

const client = new Anthropic();
for (const batch of batches) {
  const created = await client.messages.batches.create({
    requests: batch.map(({ custom_id, params }) => ({ custom_id, params })),
  });
  await writeJson(`${ROOT}/jobs/${created.id}.json`, {
    batchId: created.id,
    task,
    model,
    surahs,
    out,
    createdAt: new Date().toISOString(),
    items: Object.fromEntries(batch.map((r) => [r.custom_id, r.meta])),
  });
  console.log(`Submitted batch ${created.id} (${batch.length} requests)`);
}
