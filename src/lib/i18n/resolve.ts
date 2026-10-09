import type { Lang } from '@/lib/i18n/dictionaries';

type TranslationBlock = Record<string, unknown>;
type Translations = Partial<Record<Lang, TranslationBlock>> | null | undefined;

/**
 * Return the translation for `field` in `lang` if present, otherwise the
 * English fallback. Falls through on null/empty strings so partially
 * translated records don't render blank.
 */
export function tField<T>(
  translations: Translations,
  lang: Lang,
  field: string,
  fallback: T,
): T {
  if (lang === 'en') return fallback;
  if (!translations || typeof translations !== 'object') return fallback;
  const block = translations[lang];
  if (!block || typeof block !== 'object') return fallback;
  const value = (block as TranslationBlock)[field];
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  return value as T;
}

/**
 * Same, but for arrays of strings (e.g. keyFeatures). Returns the
 * translated array only if it's a non-empty array of strings.
 */
export function tArray(
  translations: Translations,
  lang: Lang,
  field: string,
  fallback: string[],
): string[] {
  if (lang === 'en') return fallback;
  const value = tField<unknown>(translations, lang, field, fallback);
  if (Array.isArray(value) && value.every((x) => typeof x === 'string')) {
    const arr = value as string[];
    return arr.length > 0 ? arr : fallback;
  }
  return fallback;
}