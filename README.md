# tafsir-data

Données de l'app Tafsir : traductions des tafsirs (arabe, français, anglais) et synthèse par verset, produites avec l'API Claude d'Anthropic.

## Contenu

| Dossier | Contenu |
| --- | --- |
| `translations/<langue>/<tafsir>/<sourate>.json` | Traduction d'un tafsir pour une sourate : un texte par verset |
| `synthesis/<sourate>.json` | Synthèse de tous les tafsirs, verset par verset : `{ "ar": [...], "fr": [...], "en": [...] }` |
| `summaries.json` | Présentation de chaque sourate en trois phrases : `{ "ar": [...], "fr": [...], "en": [...] }` (index = sourate − 1) |
| `originals/<tafsir>/<sourate>.json` | Textes originaux absents de spa5k/tafsir_api, au même format |
| `jobs/` | Suivi des lots envoyés à l'API |
| `pilot/` | Essais de comparaison entre modèles (non utilisés par l'app) |
| `pipeline/` | Scripts de traduction et de synthèse |

Les textes originaux viennent de [spa5k/tafsir_api](https://github.com/spa5k/tafsir_api), sauf le tafsir d'al-Sha'rawi, tiré des [données de Quranpedia.net](https://quranpedia.net/dumps) (livre 27803, version 2026-08-10). Ce tafsir couvre les sourates 1 à 53 en entier et quelques versets des sourates 54 à 60 et 66. Les traductions et synthèses sont générées par IA et doivent être relues.

## Lancer une traduction

1. Ajouter le secret `ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions).
2. Actions → **Submit translations** → Run workflow : choisir les sourates et le modèle.
3. Le workflow **Collect results** récupère les résultats toutes les 30 minutes et les publie ici.
