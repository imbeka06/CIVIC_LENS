import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from './LanguageContext';
import { translations } from './translations';

const CACHE_STORAGE_KEY = 'civic_lens_i18n_cache_v1';
const cache = new Map();
const inFlight = new Map();

const hydrateCacheFromStorage = () => {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }

    parsed.forEach(([key, value]) => {
      if (typeof key === 'string' && value && typeof value === 'object') {
        cache.set(key, value);
      }
    });
  } catch {
    // Ignore malformed cache payloads.
  }
};

const persistCacheToStorage = () => {
  try {
    // Keep storage bounded and prioritize recent entries.
    const entries = Array.from(cache.entries()).slice(-200);
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota and serialization failures.
  }
};

hydrateCacheFromStorage();

const sortedEntries = (obj) => Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));

const buildInstantLocalized = (englishMap, language) => {
  if (language === 'en') {
    return englishMap;
  }

  const langTable = translations[language] || {};
  const enTable = translations.en || {};
  const localized = {};

  Object.keys(englishMap).forEach((key) => {
    localized[key] = langTable[key] || enTable[key] || englishMap[key];
  });

  return localized;
};

const getMissingEntries = (englishMap, language) => {
  if (language === 'en') {
    return {};
  }

  const langTable = translations[language] || {};
  const missing = {};

  Object.keys(englishMap).forEach((key) => {
    if (!langTable[key]) {
      missing[key] = englishMap[key];
    }
  });

  return missing;
};

export const useLocalizedStrings = (englishMap) => {
  const { language } = useLanguage();
  const [localized, setLocalized] = useState(englishMap);

  const stableEntries = useMemo(() => {
    const sorted = sortedEntries(englishMap);
    return JSON.stringify(sorted);
  }, [englishMap]);

  const normalizedEnglishMap = useMemo(() => {
    return Object.fromEntries(sortedEntries(englishMap));
  }, [stableEntries]);

  useEffect(() => {
    let active = true;

    const cacheKey = `${language}:${stableEntries}`;

    // Render immediately using local static translations to avoid visible lag.
    const instant = buildInstantLocalized(normalizedEnglishMap, language);
    setLocalized(instant);

    if (cache.has(cacheKey)) {
      setLocalized(cache.get(cacheKey));
      return () => {
        active = false;
      };
    }

    if (language === 'en') {
      cache.set(cacheKey, normalizedEnglishMap);
      persistCacheToStorage();
      return () => {
        active = false;
      };
    }

    const missingEntries = getMissingEntries(normalizedEnglishMap, language);
    if (Object.keys(missingEntries).length === 0) {
      cache.set(cacheKey, instant);
      persistCacheToStorage();
      return () => {
        active = false;
      };
    }

    const requestKey = `${language}:${JSON.stringify(sortedEntries(missingEntries))}`;
    const requestPromise =
      inFlight.get(requestKey) ||
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/translate-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entries: missingEntries,
          target_lang: language
        })
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Batch translation failed');
          }
          return res.json();
        })
        .finally(() => {
          inFlight.delete(requestKey);
        });

    inFlight.set(requestKey, requestPromise);

    requestPromise
      .then((payload) => {
        const merged = {
          ...instant,
          ...(payload?.entries || {})
        };
        cache.set(cacheKey, merged);
        persistCacheToStorage();
        if (active) {
          setLocalized(merged);
        }
      })
      .catch(() => {
        cache.set(cacheKey, instant);
        persistCacheToStorage();
        if (active) {
          setLocalized(instant);
        }
      });

    return () => {
      active = false;
    };
  }, [language, stableEntries, normalizedEnglishMap]);

  return localized;
};
