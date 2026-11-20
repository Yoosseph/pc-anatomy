'use client';
import { Languages } from 'lucide-react';
import {
  locale,
  localeNames,
  locales,
  setLocale,
  type Locale,
} from '@/lib/i18n/locale';
import { t } from '@/lib/i18n/messages';

/**
 * The language menu: a short code in the header, the full names in the list.
 * The native select covers the chip invisibly, so the whole chip opens it and
 * the platform's own picker is used on phones. Switching saves the choice and
 * reloads into it; see `lib/i18n/locale.ts`.
 */
export default function LanguagePicker() {
  return (
    <label className="chip language-picker" title={t.language.label}>
      <Languages size={15} aria-hidden="true" />
      <span aria-hidden="true">{locale.toUpperCase()}</span>
      <select
        aria-label={t.language.label}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {locales.map((option) => (
          <option key={option} value={option} lang={option}>
            {localeNames[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
