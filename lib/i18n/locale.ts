/**
 * The interface language.
 *
 * English is the source language: every string in the codebase is written in
 * English first, and other languages are layered on top. The locale is
 * settled once, before anything renders, from the visitor's saved choice or
 * else their browser's preferred languages. Changing it saves the choice and
 * reloads, which keeps every module that reads text simple: none of them has
 * to react to the language changing underneath it. The address carries the
 * whole view, so the reload lands back where the visitor was.
 */
export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

/** Each language named in itself, as the language menu lists it. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};

const STORAGE_KEY = 'pc-anatomy-locale';

function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

function savedLocale(): Locale | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLocale(saved) ? saved : null;
  } catch {
    return null;
  }
}

function browserLocale(): Locale | null {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const language = tag?.toLowerCase().split('-')[0];
    if (isLocale(language)) return language;
  }
  return null;
}

function detectLocale(): Locale {
  // Node (tests, scripts) has no window: stay on the source language.
  if (typeof window === 'undefined' || typeof navigator === 'undefined')
    return 'en';
  return savedLocale() ?? browserLocale() ?? 'en';
}

export const locale: Locale = detectLocale();

/** Save a language and reload into it. */
export function setLocale(next: Locale) {
  if (next === locale) return;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Without storage the choice cannot outlive the reload; nothing to do.
    return;
  }
  location.reload();
}
