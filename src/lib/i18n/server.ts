import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { dictionaries, type Lang } from './dictionaries';
import type { LangScope } from './context';

const COOKIE_BY_SCOPE: Record<Exclude<LangScope, 'admin'>, string> = {
  front: 'lura-lang-front',
  login: 'lura-lang-login',
};

const ADMIN_LANG_KEY = 'admin.language';

function toLang(raw: unknown): Lang {
  return raw === 'zh' || raw === 'fr' ? raw : 'en';
}

async function readAdminLang(): Promise<Lang> {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: ADMIN_LANG_KEY },
    });
    return toLang(row?.value);
  } catch {
    return 'en';
  }
}

export async function getServerLang(
  scope: LangScope = 'front',
): Promise<Lang> {
  if (scope === 'admin') {
    return readAdminLang();
  }
  const store = await cookies();
  return toLang(store.get(COOKIE_BY_SCOPE[scope])?.value);
}

export async function getServerT(
  scope: LangScope = 'front',
): Promise<{ lang: Lang; t: (key: string) => string }> {
  const lang = await getServerLang(scope);
  const t = (key: string): string => {
    const dict = dictionaries[lang] ?? dictionaries.en;
    return dict[key] ?? dictionaries.en[key] ?? key;
  };
  return { lang, t };
}