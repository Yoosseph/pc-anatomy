import { loadContentPack } from './content.ts';
import { locale } from './locale.ts';

/**
 * The catalogue text for the current language, or null for English.
 *
 * Awaited at the top level on purpose: the catalogue and the scale tree
 * import this, so they are built only once the pack has arrived and come out
 * already translated. Nothing has to patch them afterwards, and nothing that
 * copies a name out of them (the comparison catalogue, search) can ever see
 * the English text first. For English this settles at once.
 */
export const pack = await loadContentPack(locale);
