import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  branches,
  levels,
  levelPath,
  menuRoot,
  systemRoot,
  systemRoots,
} from '../lib/levels.ts';
import { notebookLevels, type NotebookLevel } from '../lib/notebook-levels.ts';
import { notebookConcepts } from '../lib/concepts/notebooks.ts';
import { byId, searchConcepts } from '../lib/manifest.ts';
import { initialState, selectSearch } from '../lib/explorer-state.ts';
import { placeToSearch, searchToPlace } from '../lib/deep-link.ts';
import { buildModel } from '../lib/models.ts';
import { comparisonItem, comparisonLevels } from '../lib/comparison-state.ts';
import {
  disposeModelResources,
  posedModelBounds,
  prepareModelInventory,
} from '../lib/model-stage.ts';

const previousDocument = globalThis.document;
globalThis.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () =>
      new Proxy(
        {},
        {
          get: (_, key) =>
            key === 'createImageData'
              ? (width: number, height: number) => ({
                  data: new Uint8ClampedArray(width * height * 4),
                })
              : () => {},
        },
      ),
  }),
} as unknown as Document;
const models = new Map(
  (Object.keys(notebookLevels) as NotebookLevel[]).map((id) => [
    id,
    buildModel(id),
  ]),
);
after(() => {
  models.forEach(disposeModelResources);
  globalThis.document = previousDocument;
});

await test('system menus partition the scale forest without crossing machines', () => {
  assert.deepEqual(systemRoots, ['pc', 'legion', 'macbook']);
  for (const root of systemRoots) {
    const entries = branches(root).flatMap((branch) => branch.levels);
    assert.equal(new Set(entries).size, entries.length);
    assert.deepEqual(
      new Set(entries),
      new Set(
        Object.keys(levels).filter(
          (id) => id !== root && systemRoot(id as keyof typeof levels) === root,
        ),
      ),
    );
    for (const id of entries) {
      assert.equal(levelPath(id)[0], root);
      assert.ok(menuRoot(id));
    }
  }
  assert.deepEqual(levelPath('maccell'), [
    'macbook',
    'macboard',
    'm1pro',
    'macmemory',
    'macdram',
    'maccell',
  ]);
  assert.deepEqual(levelPath('legionsm'), [
    'legion',
    'legionboard',
    'legiongpu',
    'legionsm',
  ]);
});

await test('notebook search and links preserve the owning system and selected part', () => {
  for (const c of notebookConcepts) {
    assert.ok(
      searchConcepts(c.name).some((result) => result.id === c.id),
      c.id,
    );
    const next = selectSearch(initialState, c.id);
    assert.equal(systemRoot(next.level), systemRoot(c.level), c.id);
    const place = {
      level: c.level,
      selection: c.open === c.level ? null : { concept: c.id },
      explode: levels[c.level].kind === 'physical' ? 50 : 0,
    };
    assert.deepEqual(searchToPlace(placeToSearch(place)), place, c.id);
  }
});

await test('laptop catalogue distinguishes replaceable hardware from integrated Apple Silicon', () => {
  assert.equal(byId.legionmemory.level, 'legionboard');
  assert.equal(byId.macmemory.level, 'm1pro');
  assert.equal(byId.legiongpu.level, 'legionboard');
  assert.equal(byId.macgpu.level, 'm1pro');
  assert.match(byId.macstorage.specifications.Storage, /not an M.2/);
  assert.match(byId.macbook.specifications.Memory, /not socketed/);
  assert.equal(byId['maccpu-efficiency'].specifications.Count, '2');
  assert.equal(byId.maccore.specifications.Count, '8');
  assert.equal(byId.macgpucore.specifications.Count, '16');
});

await test('every notebook scale renders its catalogue with finite assembled and inventory bounds', () => {
  for (const [id, model] of models) {
    const expected = notebookConcepts
      .filter((c) => c.level === id && c.open !== id)
      .map((c) => c.id);
    assert.deepEqual(
      new Set(model.pieces.map((p) => p.concept)),
      new Set(expected),
      id,
    );
    assert.ok(
      model.pieces.every((p) => p.reveal === 0),
      id + ' hides assembled geometry',
    );
    for (const aspect of [0.6, 1.8]) {
      prepareModelInventory(model, id, aspect);
      for (const amount of [0, 0.5, 1]) {
        const bounds = posedModelBounds(model, id, amount);
        assert.ok(
          [...bounds.min.toArray(), ...bounds.max.toArray()].every(
            Number.isFinite,
          ),
          id,
        );
        assert.ok(!bounds.isEmpty(), id);
      }
    }
    if (levels[id].kind === 'logical') {
      const boxes = model.pieces.map((p) =>
        new T.Box3().setFromObject(p.object),
      );
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++)
          assert.ok(
            !boxes[i].intersectsBox(boxes[j]),
            id + ' has overlapping diagram groups',
          );
    }
  }
});

await test('notebook comparison retains common physical units and complete specifications', () => {
  assert.deepEqual(comparisonLevels('notebook'), ['legion', 'macbook']);
  for (const id of ['legion', 'macbook'] as const) {
    assert.ok(
      comparisonItem('notebook', id).specs.every(
        (spec) => spec.value && spec.value !== '—',
      ),
    );
    const cover = models
      .get(id)!
      .pieces.find((p) => p.concept === `${id}-cover`)!;
    const width =
      new T.Box3().setFromObject(cover.object).getSize(new T.Vector3()).x * 20;
    assert.ok(Math.abs(width - (id === 'legion' ? 362.56 : 312.6)) < 0.01);
    const board = models
      .get(id)!
      .pieces.find(
        (p) => p.concept === (id === 'legion' ? 'legionboard' : 'macboard'),
      )!;
    board.object.traverse((object) => {
      if (object !== board.object)
        assert.equal(
          object.userData.piece,
          undefined,
          'nested picking escaped assembly',
        );
    });
  }
});
