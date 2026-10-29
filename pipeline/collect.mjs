// Checks the batches recorded in jobs/ and, for each one that has ended, writes
// its results to translations/ and synthesis/. A tafsir/surah/language whose
// requests did not all succeed is left unwritten, so the next submit retries it.
import { readdir } from 'node:fs/promises';

import Anthropic from '@anthropic-ai/sdk';

import { VERSE_COUNTS } from './catalog.mjs';
import { readJson, ROOT, summaryFile, synthesisFile, translationFile, writeJson } from './lib.mjs';

const client = new Anthropic();

function textOf(message) {
  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

// Token totals of a batch, to know what a run really cost.
function addUsage(total, usage) {
  for (const key of ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens']) {
    total[key] = (total[key] ?? 0) + (usage?.[key] ?? 0);
  }
  return total;
}

async function recordUsage(jobFile, job) {
  const usage = {};
  for await (const result of await client.messages.batches.results(job.batchId)) {
    if (result.result.type === 'succeeded') addUsage(usage, result.result.message.usage);
  }
  await writeJson(jobFile, { ...job, usage });
  console.log(`${job.batchId}: usage recorded`, usage);
}

async function collect(jobFile) {
  const job = await readJson(jobFile);
  if (job.done) {
    if (!job.usage) await recordUsage(jobFile, job);
    return;
  }
  const batch = await client.messages.batches.retrieve(job.batchId);
  if (batch.processing_status !== 'ended') {
    // As a workflow annotation, so the status can be read through the GitHub API.
    console.log(`::notice title=${job.batchId}::${job.model} ${job.task} ${batch.processing_status} ${JSON.stringify(batch.request_counts)} expires ${batch.expires_at}`);
    return;
  }

  const outputs = new Map(); // custom_id -> text
  const failed = [];
  const usage = {};
  for await (const result of await client.messages.batches.results(job.batchId)) {
    const message = result.result.type === 'succeeded' ? result.result.message : null;
    if (message) addUsage(usage, message.usage);
    if (!message || message.stop_reason !== 'end_turn') {
      failed.push({ id: result.custom_id, reason: message?.stop_reason ?? result.result.type });
      continue;
    }
    outputs.set(result.custom_id, textOf(message));
  }
  const failedIds = new Set(failed.map((f) => f.id));

  let written = 0;
  if (job.task === 'translate') {
    const targets = new Map(); // lang|id|surah -> { meta, customIds }
    for (const [customId, meta] of Object.entries(job.items)) {
      const key = `${meta.lang}|${meta.id}|${meta.surah}`;
      if (!targets.has(key)) targets.set(key, []);
      targets.get(key).push({ customId, meta });
    }
    for (const [key, parts] of targets) {
      if (parts.some((p) => failedIds.has(p.customId) || !outputs.has(p.customId))) continue;
      const [lang, id, surah] = key.split('|');
      const texts = Array(VERSE_COUNTS[surah - 1]).fill('');
      const groups = new Map();
      for (const { customId, meta } of parts) {
        if (!groups.has(meta.group)) groups.set(meta.group, { ayahs: meta.ayahs, chunks: [] });
        groups.get(meta.group).chunks[meta.chunk] = outputs.get(customId);
      }
      for (const { ayahs, chunks } of groups.values()) {
        const text = chunks.join('\n\n');
        for (const ayah of ayahs) texts[ayah - 1] = text;
      }
      await writeJson(translationFile(lang, id, Number(surah), job.out), texts);
      written++;
    }
  } else if (job.task === 'summary') {
    const file = summaryFile(job.out);
    const data = await readJson(file, {});
    for (const [customId, meta] of Object.entries(job.items)) {
      if (!outputs.has(customId)) continue;
      let parsed;
      try {
        parsed = JSON.parse(outputs.get(customId));
      } catch {
        failed.push({ id: customId, reason: 'invalid_json' });
        continue;
      }
      for (const lang of ['ar', 'fr', 'en']) {
        data[lang] ??= Array(114).fill('');
        data[lang][meta.surah - 1] = parsed[lang].trim();
      }
      written++;
    }
    await writeJson(file, data);
  } else {
    const bySurah = new Map();
    for (const [customId, meta] of Object.entries(job.items)) {
      if (!outputs.has(customId)) continue;
      let parsed;
      try {
        parsed = JSON.parse(outputs.get(customId));
      } catch {
        failed.push({ id: customId, reason: 'invalid_json' });
        continue;
      }
      if (!bySurah.has(meta.surah)) bySurah.set(meta.surah, []);
      bySurah.get(meta.surah).push({ ayah: meta.ayah, parsed });
    }
    for (const [surah, entries] of bySurah) {
      const file = synthesisFile(surah, job.out);
      const data = await readJson(file, {});
      for (const lang of ['ar', 'fr', 'en']) {
        data[lang] ??= Array(VERSE_COUNTS[surah - 1]).fill('');
        for (const { ayah, parsed } of entries) data[lang][ayah - 1] = parsed[lang].trim();
      }
      await writeJson(file, data);
      written += entries.length;
    }
  }

  await writeJson(jobFile, {
    ...job,
    done: true,
    endedAt: batch.ended_at,
    counts: batch.request_counts,
    written,
    failed,
    usage,
  });
  console.log(`${job.batchId}: ended, ${written} written, ${failed.length} failed`);
}

for (const name of (await readdir(`${ROOT}/jobs`)).filter((f) => f.endsWith('.json'))) {
  await collect(`${ROOT}/jobs/${name}`);
}
