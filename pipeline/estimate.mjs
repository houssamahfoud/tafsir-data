// Size of the work for given surahs, without calling the API: characters of
// translation input and of each synthesis request.
//   node pipeline/estimate.mjs --surahs 1-114 > sizes.json
import { CORPUS, READING_LANGS, VERSE_COUNTS } from './catalog.mjs';
import { arg, fetchOriginal, groupVerses, parseSurahs } from './lib.mjs';

const result = {};
for (const surah of parseSurahs(arg('surahs'))) {
  const count = VERSE_COUNTS[surah - 1];
  const originals = await Promise.all(CORPUS.map((t) => fetchOriginal(t.id, surah, count)));
  let translateChars = 0;
  CORPUS.forEach((t, i) => {
    const langs = READING_LANGS.filter((l) => l !== t.lang).length;
    for (const g of groupVerses(originals[i])) translateChars += g.text.length * langs;
  });
  const synthesisChars = [];
  for (let a = 0; a < count; a++) synthesisChars.push(originals.reduce((n, o) => n + o[a].length, 0));
  result[surah] = { translateChars, synthesisChars };
  console.error(`surah ${surah} done`);
}
console.log(JSON.stringify(result));
