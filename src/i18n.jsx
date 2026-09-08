import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getTranslation, TRANSLATIONS } from './data/translations';
import { subscribe, lookup } from './services/translationService';

const LANG_STORAGE_KEY = 'schemesetu_lang';

const I18nContext = createContext(null);

function readInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && TRANSLATIONS[saved]) return saved;
  } catch {
    /* ignore */
  }
  return 'hi';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);
  // Bumped whenever new runtime translations arrive, forcing consumers to re-read.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setVersion((v) => v + 1));
    return unsub;
  }, []);

  const setLang = useCallback((next) => {
    if (!TRANSLATIONS[next]) return;
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  // Keyed lookup against the hand-authored dictionary (all 12 languages present
  // for these keys, so no runtime call is needed). Falls back per getTranslation.
  const t = useCallback((key) => getTranslation(lang, key), [lang]);

  // Inline pair: components pass both the English and Hindi literals. English is
  // the machine-translation source for the other ten languages.
  const tr = useCallback(
    (en, hi) => {
      if (lang === 'en') return en;
      if (lang === 'hi') return hi != null ? hi : en;
      const got = lookup(en, lang, 'en');
      return got !== undefined ? got : (hi != null ? hi : en);
    },
    [lang]
  );

  // Arbitrary content string (e.g. scheme data). sourceLang defaults to Hindi
  // because most scheme content is authored in Hindi.
  const trText = useCallback(
    (text, sourceLang = 'hi') => {
      if (text == null || text === '') return text;
      if (lang === sourceLang) return text;
      const got = lookup(text, lang, sourceLang);
      return got !== undefined ? got : text;
    },
    [lang]
  );

  const trList = useCallback(
    (arr, sourceLang = 'hi') => (Array.isArray(arr) ? arr.map((x) => trText(x, sourceLang)) : arr),
    [trText]
  );

  // `version` is intentionally part of the deps: when runtime translations land,
  // a new value object is produced so context consumers re-render and re-read.
  const value = useMemo(
    () => ({ lang, setLang, t, tr, trText, trList, isHindi: lang === 'hi' }),
    [lang, version, setLang, t, tr, trText, trList]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
