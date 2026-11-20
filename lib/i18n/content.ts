import type { Concept } from '../concept.ts';
import type { LevelDef } from '../levels.ts';
import type { Locale } from './locale.ts';
import type { Messages } from './messages.ts';
import type { BuildMessages } from './build-messages.ts';

/**
 * Everything a language other than English needs, as one download.
 *
 * The component catalogue and the scale tree are far larger than the
 * interface around them, so a language's version of them, together with its
 * interface strings, is a pack loaded only by visitors who read that
 * language: English readers never download it.
 *
 * Catalogue text is translated by sentence, keyed by the English it
 * replaces, the way gettext catalogues work. Many components share their
 * prose (every board in the build workspace is drawn from the same parts),
 * so each sentence is translated once and every component that uses it
 * follows. A sentence a pack leaves out stays in English, and editing an
 * English sentence leaves its old translation unused until it is updated;
 * `tests/i18n.test.ts` reports both.
 */
export interface ContentPack {
  /** Every interface string, in the shape of the English set. */
  messages: Messages;
  /** The build workspace's strings, which only the workspace loads. */
  build: BuildMessages;
  /**
   * Catalogue text: names, descriptions, purposes, quantities, accuracy
   * notes, specification values and scale headings, keyed by the English.
   * Specification labels are in `messages.specLabels` instead.
   */
  text: Record<string, string>;
}

const packs: Partial<Record<Locale, () => Promise<{ default: ContentPack }>>> =
  {
    fr: () => import('./fr/index.ts'),
  };

/** Fetch the pack for a language; English is the catalogue itself. */
export async function loadContentPack(
  locale: Locale,
): Promise<ContentPack | null> {
  const load = packs[locale];
  return load ? (await load()).default : null;
}

/** A component with a pack's text written over it. */
export function translateConcept(
  c: Concept,
  pack: ContentPack | null,
): Concept {
  if (!pack) return c;
  const tr = (english: string) => pack.text[english] ?? english;
  return {
    ...c,
    name: tr(c.name),
    shortName: tr(c.shortName),
    description: tr(c.description),
    purpose: tr(c.purpose),
    quantity: tr(c.quantity),
    physicalAccuracy: tr(c.physicalAccuracy),
    specifications: Object.fromEntries(
      Object.entries(c.specifications).map(([label, value]) => [
        label,
        tr(value),
      ]),
    ),
    // The English names stay searchable.
    searchTerms: [...c.searchTerms, c.name, c.shortName],
  };
}

/** A scale with a pack's text written over it. */
export function translateLevel(
  level: LevelDef,
  pack: ContentPack | null,
): LevelDef {
  if (!pack) return level;
  const tr = (english: string) => pack.text[english] ?? english;
  return {
    ...level,
    name: tr(level.name),
    title: tr(level.title),
    caption: tr(level.caption),
    summary: tr(level.summary),
    submenuNote: level.submenuNote && tr(level.submenuNote),
    phases: level.phases.map(([label, value]) => [tr(label), value] as const),
  };
}
