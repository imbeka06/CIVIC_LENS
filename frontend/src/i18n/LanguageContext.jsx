import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, isSupportedLanguage } from './languages';
import { translations } from './translations';

const STORAGE_KEY = 'civic_lens_lang';

const getInitialLanguage = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return isSupportedLanguage(saved) ? saved : DEFAULT_LANGUAGE;
};

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = (nextLang) => {
    if (!isSupportedLanguage(nextLang)) return;
    setLanguageState(nextLang);
    localStorage.setItem(STORAGE_KEY, nextLang);
  };

  const t = (key) => {
    const langTable = translations[language] || {};
    const enTable = translations.en || {};
    return langTable[key] || enTable[key] || key;
  };

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);