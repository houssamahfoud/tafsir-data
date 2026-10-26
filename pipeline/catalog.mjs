// The 30 tafsirs translated by the pipeline (same list and order as the app's
// src/data/tafsirs.ts CORPUS). `lang` is the language of the source text.
export const CORPUS = [
  ['ar-tafsir-al-tabari', 'ar', 'al-Tabari', 'Jami al-Bayan'],
  ['tafsir-al-mawardi', 'ar', 'al-Mawardi', 'al-Nukat wa al-Uyun'],
  ['al-wajiz-wahidi', 'ar', 'al-Wahidi', 'al-Wajiz'],
  ['tafsir-al-sam-ani', 'ar', "al-Sam'ani", 'Tafsir al-Quran'],
  ['ar-tafsir-al-baghawi', 'ar', 'al-Baghawi', "Ma'alim al-Tanzil"],
  ['al-kashshaf-al-zamakhshari', 'ar', 'al-Zamakhshari', 'al-Kashshaf'],
  ['al-muharrar-al-wajiz-ibn-atiyyah', 'ar', "Ibn 'Atiyya", 'al-Muharrar al-Wajiz'],
  ['tafsir-ibn-al-jawzi', 'ar', 'Ibn al-Jawzi', 'Zad al-Masir'],
  ['tafsir-al-razi', 'ar', 'al-Razi', 'Mafatih al-Ghayb'],
  ['ar-tafseer-al-qurtubi', 'ar', 'al-Qurtubi', "al-Jami' li-Ahkam al-Quran"],
  ['tafsir-al-baydawi', 'ar', 'al-Baydawi', 'Anwar al-Tanzil'],
  ['tafsir-al-nasafi', 'ar', 'al-Nasafi', 'Madarik al-Tanzil'],
  ['tafsir-ibn-juzay', 'ar', 'Ibn Juzayy', 'al-Tashil'],
  ['al-bahr-al-muhit', 'ar', 'Abu Hayyan', 'al-Bahr al-Muhit'],
  ['tafsir-ibn-al-qayyim', 'ar', 'Ibn al-Qayyim', 'al-Tafsir al-Qayyim'],
  ['ar-tafsir-ibn-kathir', 'ar', 'Ibn Kathir', "Tafsir al-Quran al-'Azim"],
  ['ar-tafsir-al-tha-alibi', 'ar', "al-Tha'alibi", 'al-Jawahir al-Hisan'],
  ['nazam-al-durar-al-biqa-i', 'ar', "al-Biqa'i", 'Nazm al-Durar'],
  ['ar-tafsir-al-jalalayn', 'ar', 'al-Mahalli & al-Suyuti', 'Tafsir al-Jalalayn'],
  ['tafsir-abi-al-su-ood', 'ar', "Abu al-Su'ud", "Irshad al-'Aql al-Salim"],
  ['fath-al-qadir-al-shawkani', 'ar', 'al-Shawkani', 'Fath al-Qadir'],
  ['tafsir-al-alusi', 'ar', 'al-Alusi', "Ruh al-Ma'ani"],
  ['mahasin-al-ta-wil-al-qasimi', 'ar', 'al-Qasimi', "Mahasin al-Ta'wil"],
  ['ar-tafsir-as-saadi', 'ar', "Ibn Sa'di", 'Taysir al-Karim al-Rahman'],
  ['tafsir-fe-zalul-quran-syed-qatab', 'ur', 'Sayyid Qutb', 'Fi Zilal al-Quran (Urdu translation)'],
  ['ar-tafseer-tahrir-al-tanwir', 'ar', "Ibn 'Ashur", 'al-Tahrir wa al-Tanwir'],
  ['adwa-al-bayan', 'ar', 'al-Shinqiti', "Adwa' al-Bayan"],
  ['tafsir-ibn-uthaymeen', 'ar', "Ibn 'Uthaymin", 'Tafsir al-Quran al-Karim'],
  ['abu-bakr-jabir-al-jazairi', 'ar', "al-Jaza'iri", 'Aysar al-Tafasir'],
  ['ar-tafsir-muyassar', 'ar', 'King Fahd Complex', 'al-Tafsir al-Muyassar'],
].map(([id, lang, author, title]) => ({ id, lang, author, title }));

export const READING_LANGS = ['ar', 'fr', 'en'];

export const LANG_NAMES = { ar: 'Arabic', fr: 'French', en: 'English', ur: 'Urdu' };

// Number of verses per surah.
export const VERSE_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89,
  59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30,
  52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
  21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];
