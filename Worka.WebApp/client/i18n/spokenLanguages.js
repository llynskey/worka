export const SPOKEN_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espa\u00f1ol' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'ro', label: 'Rom\u00e2n\u0103' },
  { code: 'pl', label: 'Polski' },
  { code: 'pt', label: 'Portugu\u00eas' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { code: 'zh', label: '\u4e2d\u6587' },
  { code: 'hi', label: '\u0939\u093f\u0928\u094d\u0926\u0940' },
  { code: 'ur', label: '\u0627\u0631\u062f\u0648' },
  { code: 'tr', label: 'T\u00fcrk\u00e7e' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
  { code: 'uk', label: '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430' },
  { code: 'bg', label: '\u0411\u044a\u043b\u0433\u0430\u0440\u0441\u043a\u0438' },
  { code: 'cs', label: '\u010ce\u0161tina' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'el', label: '\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac' },
  { code: 'so', label: 'Soomaali' },
];

export const languageLabel = (code) => {
  const normalized = String(code ?? '').trim().toLowerCase();
  const match = SPOKEN_LANGUAGES.find((language) => language.code === normalized);
  return match ? match.label : normalized.toUpperCase();
};
