import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from './LanguageContext';

const cache = new Map();

export const useLocalizedStrings = (englishMap) => {
  const { language } = useLanguage();
  const [localized, setLocalized] = useState(englishMap);

  const stableEntries = useMemo(() => {
    const sorted = Object.entries(englishMap).sort(([a], [b]) => a.localeCompare(b));
    return JSON.stringify(sorted);
  }, [englishMap]);

  useEffect(() => {
    let active = true;

    if (language === 'en') {
      setLocalized(englishMap);
      return () => {
        active = false;
      };
    }

    const cacheKey = `${language}:${stableEntries}`;
    if (cache.has(cacheKey)) {
      setLocalized(cache.get(cacheKey));
      return () => {
        active = false;
      };
    }

    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/translate-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entries: englishMap,
        target_lang: language
      })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Batch translation failed');
        }
        return res.json();
      })
      .then((payload) => {
        const entries = payload?.entries || englishMap;
        cache.set(cacheKey, entries);
        if (active) {
          setLocalized(entries);
        }
      })
      .catch(() => {
        if (active) {
          setLocalized(englishMap);
        }
      });

    return () => {
      active = false;
    };
  }, [language, stableEntries, englishMap]);

  return localized;
};
