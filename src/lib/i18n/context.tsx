'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { dictionaries, type Lang } from './dictionaries';

export type LangScope = 'front' | 'login' | 'admin';

const COOKIE_BY_SCOPE: Record<LangScope, string> = {
  front: 'lura-lang-front',
  login: 'lura-lang-login',
  admin: 'lura-lang-admin',
};

function toLang(raw: string | null | undefined): Lang | null {
  return raw === 'en' || raw === 'zh' || raw === 'fr' ? raw : null;
}

function readCookie(name: string): Lang | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)' + name + '=([^;]+)'),
  );
  return toLang(match?.[2] ?? null);
}

function writeCookie(name: string, lang: Lang) {
  if (typeof document === 'undefined') return;
  document.cookie =
    name + '=' + lang + '; path=/; max-age=' + 60 * 60 * 24 * 365;
}

type ContextValue = {
  lang: Lang;
  scope: LangScope;
  setLang: (l: Lang) => void;
  /** Update the language locally without persisting (used for server-pushed changes). */
  applyServerLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<ContextValue>({
  lang: 'en',
  scope: 'front',
  setLang: () => undefined,
  applyServerLang: () => undefined,
  t: (key: string) => key,
});

export function LanguageProvider({
  children,
  scope,
  initialLang,
}: {
  children: React.ReactNode;
  scope: LangScope;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? 'en');

  useEffect(() => {
    if (scope === 'admin') {
      if (initialLang) setLangState(initialLang);
      document.documentElement.lang = initialLang ?? 'en';
      return;
    }
    const stored = readCookie(COOKIE_BY_SCOPE[scope]);
    if (stored) setLangState(stored);
    document.documentElement.lang = stored ?? 'en';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, initialLang]);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      writeCookie(COOKIE_BY_SCOPE[scope], next);
      document.documentElement.lang = next;

      if (scope === 'admin' && typeof window !== 'undefined') {
        void fetch('/api/admin/language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: next }),
        }).catch(() => undefined);
      }
    },
    [scope],
  );

  const applyServerLang = useCallback((next: Lang) => {
    setLangState((current) => (current === next ? current : next));
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const dict = dictionaries[lang] ?? dictionaries.en;
      return dict[key] ?? dictionaries.en[key] ?? key;
    },
    [lang],
  );

  return (
    <LanguageContext.Provider
      value={{ lang, scope, setLang, applyServerLang, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}