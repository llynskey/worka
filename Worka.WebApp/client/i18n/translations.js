/**
 * Worka UI translations.
 *
 * Dictionaries live in ./locales/<code>.js — one flat key/value map per
 * language. Every user-facing string renders through t('key').
 * Missing keys fall back to English, so partial dictionaries are safe.
 *
 * Right-to-left languages (Arabic, Hebrew) additionally need
 * I18nManager/RTL layout work — add them only with proper RTL testing.
 */
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import ro from './locales/ro';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ro', label: 'Română' },
];

export const translations = { en, es, fr, ro };
