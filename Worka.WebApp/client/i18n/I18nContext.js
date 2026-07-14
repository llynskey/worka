import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES, translations } from './translations';

const STORAGE_KEY = 'worka.language';

const detectDeviceLanguage = () => {
  try {
    const locale =
      (typeof navigator !== 'undefined' && navigator.language) ||
      Intl.DateTimeFormat().resolvedOptions().locale ||
      'en';
    const code = String(locale).slice(0, 2).toLowerCase();
    return translations[code] ? code : 'en';
  } catch {
    return 'en';
  }
};

const I18nContext = createContext({
  language: 'en',
  languages: LANGUAGES,
  // eslint-disable-next-line no-unused-vars
  setLanguage: (code) => {},
  t: (key) => key,
});

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!mounted) return;
        setLanguageState(saved && translations[saved] ? saved : detectDeviceLanguage());
      })
      .catch(() => {
        if (mounted) setLanguageState(detectDeviceLanguage());
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback((code) => {
    if (!translations[code]) return;
    setLanguageState(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const t = useCallback(
    (key) => translations[language]?.[key] ?? translations.en[key] ?? key,
    [language]
  );

  const value = useMemo(
    () => ({ language, languages: LANGUAGES, setLanguage, t }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

export default I18nContext;
