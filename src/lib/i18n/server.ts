import { cookies } from 'next/headers';
import { dictionaries, type Lang } from './dictionaries';

export async function getServerLang(): Promise<Lang> {
  const store = await cookies();
  const raw = store.get('lura-lang')?.value;
  return raw === 'zh' || raw === 'fr' ? raw : 'en';
}

export async function getServerT(): Promise<{
  lang: Lang;
  t: (key: string) => string;
}> {
  const lang = await getServerLang();
  const t = (key: string): string => {
    const dict = dictionaries[lang] ?? dictionaries.en;
    return dict[key] ?? dictionaries.en[key] ?? key;
  };
  return { lang, t };
}