'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dictionaries, type Lang } from './dictionaries';

const STORAGE_KEY = 'lura-lang';
const COOKIE_NAME = 'lura-lang';

function readCookie(): Lang {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
  const v = match?.[2];
  return v === 'zh' || v === 'fr' ? v : 'en';
}

function writeCookie(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.cookie = COOKIE_NAME + '=' + lang + '; path=/; max-age=' + 60 * 60 * 24 * 365;
}

type ContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<ContextValue>({
  lang: 'en',
  setLang: () => undefined,
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = readCookie();
    if (stored !== 'en') {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeCookie(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string): string => {
      const dict = dictionaries[lang] ?? dictionaries.en;
      return dict[key] ?? dictionaries.en[key] ?? key;
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}