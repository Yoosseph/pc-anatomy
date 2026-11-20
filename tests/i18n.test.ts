import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manifest } from '../lib/manifest.ts';
import { levels } from '../lib/levels.ts';
import { comparisonItems } from '../lib/comparison-catalogue.ts';
import { locale, locales } from '../lib/i18n/locale.ts';
import { en, t } from '../lib/i18n/messages.ts';
import { translateConcept, translateLevel } from '../lib/i18n/content.ts';
import fr from '../lib/i18n/fr/index.ts';

// Translations are keyed by the English they replace, so the risks are an
// English edit that orphans its translation, and a new sentence nobody has
// translated yet. These checks catch both for every language pack.

const packs = { fr };

/** Every piece of catalogue text a pack can translate. */
const catalogueText = new Set<string>();
for (const c of manifest)
  for (const text of [
    c.name,
    c.shortName,
    c.description,
    c.purpose,
    c.quantity,
    c.physicalAccuracy,
    ...Object.values(c.specifications),
  ])
    catalogueText.add(text);
for (const level of Object.values(levels)) {
  for (const text of [level.name, level.title, level.caption, level.summary])
    catalogueText.add(text);
  if (level.submenuNote) catalogueText.add(level.submenuNote);
  for (const [label] of level.phases) catalogueText.add(label);
}
/** Product names and codes read the same in every language. */
const needsTranslation = (text: string) => /\b[a-z]{3,}\b/.test(text);
const specLabels = new Set(
  manifest.flatMap((c) => Object.keys(c.specifications)),
);

await test('tests and scripts run in English, the source language', () => {
  assert.equal(locale, 'en');
  assert.equal(t, en);
  assert.deepEqual(
    Object.keys(packs).sort(),
    locales.filter((l) => l !== 'en'),
  );
});

for (const [name, pack] of Object.entries(packs)) {
  await test(`${name}: every catalogue translation still matches English text`, () => {
    const stale = Object.keys(pack.text).filter(
      (english) => !catalogueText.has(english),
    );
    assert.deepEqual(stale, [], 'translations whose English no longer exists');
  });

  await test(`${name}: every specification label translation matches a label`, () => {
    const stale = Object.keys(pack.messages.specLabels).filter(
      (label) => !specLabels.has(label),
    );
    assert.deepEqual(stale, []);
  });

  await test(`${name}: every component's prose is translated`, () => {
    const missing = manifest.flatMap((c) =>
      [c.description, c.purpose]
        .filter((text) => needsTranslation(text) && !pack.text[text])
        .map((text) => `${c.id}: ${text}`),
    );
    assert.deepEqual(
      missing,
      [],
      'descriptions and purposes with no translation',
    );
  });

  await test(`${name}: every scale heading is translated`, () => {
    const missing = Object.values(levels)
      .filter(
        (level) => needsTranslation(level.title) && !pack.text[level.title],
      )
      .map((level) => level.id);
    assert.deepEqual(missing, []);
  });

  await test(`${name}: translating keeps ids, structure and English search`, () => {
    const c = manifest.find((concept) => concept.id === 'fanimpeller')!;
    const translated = translateConcept(c, pack);
    assert.equal(translated.id, c.id);
    assert.equal(translated.parent, c.parent);
    assert.deepEqual(translated.sources, c.sources);
    assert.deepEqual(
      Object.keys(translated.specifications),
      Object.keys(c.specifications),
    );
    assert.notEqual(translated.description, c.description);
    assert.ok(translated.searchTerms.includes(c.name));
    const level = translateLevel(levels.fan, pack);
    assert.equal(level.parent, levels.fan.parent);
    assert.deepEqual(
      level.phases.map(([, value]) => value),
      levels.fan.phases.map(([, value]) => value),
    );
  });

  await test(`${name}: comparison rows still line up by their English field`, () => {
    // Field ids come from the English label, so a translation can never
    // merge two fields or split one.
    for (const item of comparisonItems)
      assert.equal(
        new Set(item.specs.map((spec) => spec.id)).size,
        item.specs.length,
      );
  });

  await test(`${name}: every message that takes a value gives text back`, () => {
    // Stands in for any argument: a number, a name, a part with any field.
    const any: unknown = new Proxy(function () {}, {
      get: (_, key) => (key === Symbol.toPrimitive ? () => 2 : any),
      apply: () => any,
    });
    const walk = (value: unknown, path: string): void => {
      if (typeof value === 'string') assert.ok(value.trim(), path);
      else if (typeof value === 'function') {
        const out = (value as (...args: unknown[]) => unknown)(
          ...Array.from({ length: value.length }, () => any),
        );
        assert.equal(typeof out, 'string', path);
        assert.ok(!String(out).includes('undefined'), path);
      } else if (value && typeof value === 'object')
        for (const [key, inner] of Object.entries(value))
          walk(inner, `${path}.${key}`);
    };
    walk(pack.messages, `${name}.messages`);
    walk(pack.build, `${name}.build`);
  });
}
