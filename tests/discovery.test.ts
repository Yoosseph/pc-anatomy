import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { manifest, isLevelRoot } from '../lib/manifest.ts';
import { isPhysical, levelIds, levels, rootLevel } from '../lib/levels.ts';
import {
  homePlace,
  placeTitle,
  placeToSearch,
  searchToPlace,
  type Place,
} from '../lib/deep-link.ts';
import { tapIntent } from '../lib/pointer-intent.ts';
import { labelWidth, placeLabels } from '../lib/inventory-labels.ts';
import { sitemapUrls } from '../scripts/sitemap-urls.ts';

// Everything here is about being found and understood: links that land on a
// place, the first tap on a phone, names on the laid-out parts, and the
// interface loading before the engine does.

await test('the home place is the bare address, and the bare address is home', () => {
  assert.equal(placeToSearch(homePlace), '');
  assert.deepEqual(searchToPlace(''), homePlace);
  assert.deepEqual(searchToPlace('?utm_source=x'), homePlace);
});

await test('every scale and every part on it survives a round trip through a link', () => {
  for (const level of levelIds) {
    const scale: Place = { level, selection: null, explode: 0 };
    assert.deepEqual(searchToPlace(placeToSearch(scale)), scale, level);
  }
  for (const c of manifest) {
    if (isLevelRoot(c)) continue;
    const place: Place = {
      level: c.level,
      selection: { concept: c.id },
      explode: 0,
    };
    assert.deepEqual(searchToPlace(placeToSearch(place)), place, c.id);
  }
});

await test('a link keeps the instance and how far apart the hardware is', () => {
  const part = manifest.find((c) => c.level === 'pc' && !isLevelRoot(c))!;
  const place: Place = {
    level: 'pc',
    selection: { concept: part.id, instance: 2 },
    explode: 48,
  };
  const search = placeToSearch(place);
  assert.match(search, /[?&]n=3(&|$)/);
  assert.match(search, /[?&]open=48(&|$)/);
  assert.deepEqual(searchToPlace(search), place);
});

await test('arriving on a scale may describe the part that was opened to get there', () => {
  const level = levelIds.find((id) => id !== rootLevel)!;
  const place: Place = {
    level,
    selection: { concept: levels[level].concept },
    explode: 0,
  };
  assert.deepEqual(searchToPlace(placeToSearch(place)), place);
});

await test('links that do not make sense open the nearest thing that does', () => {
  assert.deepEqual(searchToPlace('?scale=nope&part=fan'), homePlace);
  assert.deepEqual(searchToPlace('?scale=toString'), homePlace);
  const elsewhere = manifest.find(
    (c) => c.level !== 'pc' && !isLevelRoot(c) && c.id !== levels.pc.concept,
  )!;
  assert.equal(searchToPlace(`?scale=pc&part=${elsewhere.id}`).selection, null);
  assert.equal(searchToPlace('?scale=pc&open=250').explode, 100);
  assert.equal(searchToPlace('?scale=pc&open=-4').explode, 0);
  assert.equal(searchToPlace('?scale=pc&open=lots').explode, 0);
  const logical = levelIds.find((id) => !isPhysical(id))!;
  assert.equal(searchToPlace(`?scale=${logical}&open=60`).explode, 0);
  const part = manifest.find((c) => c.level === 'pc' && !isLevelRoot(c))!;
  assert.deepEqual(searchToPlace(`?scale=pc&part=${part.id}&n=0`).selection, {
    concept: part.id,
  });
});

await test('a place is titled after what it shows', () => {
  assert.equal(placeTitle(homePlace), 'PC Anatomy');
  const part = manifest.find((c) => c.level === 'pc' && !isLevelRoot(c))!;
  assert.equal(
    placeTitle({ level: 'pc', selection: { concept: part.id }, explode: 0 }),
    `${part.name} · PC Anatomy`,
  );
  const level = levelIds.find((id) => id !== rootLevel)!;
  assert.equal(
    placeTitle({ level, selection: null, explode: 0 }),
    `${levels[level].name} · PC Anatomy`,
  );
});

await test('the sitemap lists every place a link can name, and is up to date', () => {
  const urls = sitemapUrls();
  assert.equal(new Set(urls).size, urls.length);
  for (const url of urls) {
    const search = new URL(url).search;
    assert.equal(placeToSearch(searchToPlace(search)), search, url);
  }
  const written = fs.readFileSync(
    new URL('../public/sitemap.xml', import.meta.url),
    'utf8',
  );
  for (const url of urls)
    assert.ok(
      written.includes(`<loc>${url.replaceAll('&', '&amp;')}</loc>`),
      `public/sitemap.xml is missing ${url}; run scripts/generate-sitemap.mjs`,
    );
});

await test('a mouse click opens, and a tap describes first and opens on the second tap', () => {
  const part = { concept: 'fan', instance: 1 };
  assert.equal(tapIntent('mouse', part, null), 'open');
  assert.equal(tapIntent('touch', part, null), 'inspect');
  assert.equal(
    tapIntent('touch', part, { concept: 'fan', instance: 0 }),
    'inspect',
  );
  assert.equal(
    tapIntent('touch', part, { concept: 'fan', instance: 1 }),
    'open',
  );
  assert.equal(tapIntent('pen', part, { concept: 'fan', instance: 1 }), 'open');
  assert.equal(
    tapIntent('touch', { concept: 'fan', instance: 0 }, { concept: 'fan' }),
    'open',
  );
  assert.equal(tapIntent('touch', null, { concept: 'fan' }), 'inspect');
});

await test('part names go on the biggest parts first and never overlap or leave the stage', () => {
  const candidates = [
    { concept: 'a', instance: 0, name: 'Small', x: 100, y: 100, size: 5 },
    { concept: 'b', instance: 0, name: 'Big part', x: 110, y: 104, size: 50 },
    { concept: 'c', instance: 0, name: 'Chip', x: 300, y: 200, size: 10 },
    { concept: 'c', instance: 1, name: 'Chip', x: 300, y: 260, size: 10 },
    { concept: 'd', instance: 0, name: 'Edge', x: 2, y: 200, size: 40 },
  ];
  const placed = placeLabels(candidates, 400, 300);
  assert.deepEqual(
    placed.map((l) => `${l.concept}${l.instance}`),
    ['b0', 'c0'],
  );
  for (const l of placed) {
    assert.ok(l.left >= 0 && l.left + labelWidth(l.name) <= 400);
    assert.ok(l.top >= 0 && l.top + 22 <= 300);
  }
  assert.equal(placeLabels(candidates, 400, 300, 1).length, 1);
});

await test('the interface can ask about airflow without loading three.js', () => {
  const source = fs.readFileSync(
    new URL('../lib/airflow-policy.ts', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /from 'three/);
  for (const file of [
    '../app/use-explorer.ts',
    '../app/stage-tools.tsx',
    '../lib/explorer-state.ts',
    '../lib/deep-link.ts',
    '../lib/pointer-intent.ts',
    '../lib/inventory-labels.ts',
  ]) {
    const code = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(code, /from '(@\/lib|\.)\/airflow(\.ts)?'/, file);
    assert.doesNotMatch(code, /from 'three/, file);
  }
});
