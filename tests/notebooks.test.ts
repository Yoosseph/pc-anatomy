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
import {
  collectAnimatedObjects,
  animateObjects,
} from '../lib/stage-runtime.ts';
import { notebookPorts } from '../lib/notebook-chassis.ts';
import { notebookSpecs, notebookV } from '../lib/notebook-kit.ts';
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
    'macbank',
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
    if (
      levels[id].kind === 'logical' &&
      id !== 'legioncell' &&
      id !== 'maccell'
    ) {
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

await test('installed notebook assemblies retain their detailed geometry at their native scale', () => {
  for (const root of ['legion', 'macbook'] as const) {
    const model = models.get(root)!;
    for (const id of root === 'legion'
      ? (['legionboard', 'legioncooling', 'legionbattery'] as const)
      : (['macboard', 'maccooling', 'macbattery'] as const)) {
      const installed = model.pieces.find((piece) => piece.concept === id)!;
      const standalone = models.get(id)!;
      const installedSize = new T.Box3()
        .setFromObject(installed.object)
        .getSize(new T.Vector3());
      const sourceSize = new T.Box3()
        .setFromObject(standalone.root)
        .getSize(new T.Vector3());
      assert.ok(
        installedSize.distanceTo(sourceSize) < 0.00001,
        `${id} was stretched to fit`,
      );
    }
  }
});

await test('every published notebook port is reachable through its actual enclosure opening', () => {
  for (const system of ['legion', 'macbook'] as const) {
    const model = models.get(system)!;
    model.root.updateMatrixWorld(true);
    const spec = notebookSpecs[system];
    for (const port of notebookPorts[system]) {
      const side = port.edge === 'left' ? -1 : 1;
      const origin =
        port.edge === 'rear'
          ? notebookV(port.at, -0.5, -spec.depth / 2 - 25)
          : notebookV(side * (spec.width / 2 + 25), -0.5, port.at);
      const direction =
        port.edge === 'rear'
          ? new T.Vector3(0, 0, 1)
          : new T.Vector3(-side, 0, 0);
      const hits = new T.Raycaster(
        new T.Vector3(...origin),
        direction,
      ).intersectObject(model.root, true);
      assert.ok(hits.length > 0, `${system} ${port.kind} has no connector`);
      let owner: T.Object3D | null = hits[0].object;
      while (owner && !owner.userData.piece) owner = owner.parent;
      assert.equal(
        owner?.userData.piece.concept,
        system === 'legion' ? 'legionboard' : 'macboard',
        `${system} ${port.kind} is blocked by the shell`,
      );
    }
  }
});

await test('notebook ports match the two published inventories', () => {
  const counts = (system: 'legion' | 'macbook') =>
    Object.fromEntries(
      [...new Set(notebookPorts[system].map((port) => port.kind))].map(
        (kind) => [
          kind,
          notebookPorts[system].filter((port) => port.kind === kind).length,
        ],
      ),
    );
  assert.deepEqual(counts('legion'), {
    usbc: 2,
    audio: 1,
    usba: 4,
    ethernet: 1,
    hdmi: 1,
    power: 1,
  });
  assert.deepEqual(counts('macbook'), {
    magsafe: 1,
    usbc: 3,
    audio: 1,
    hdmi: 1,
    sd: 1,
  });
});

await test('major notebook board packages and replaceable modules do not intersect', () => {
  for (const id of ['legionboard', 'macboard'] as const) {
    const names =
      id === 'legionboard'
        ? [
            'legioncpu',
            'legiongpu',
            'legionmemory',
            'legionstorage',
            'legionboard-vram',
            'legionboard-wireless',
          ]
        : ['m1pro', 'macstorage', 'macboard-wireless'];
    const pieces = models
      .get(id)!
      .pieces.filter((piece) => names.includes(piece.concept));
    const boxes = pieces.map((piece) =>
      new T.Box3().setFromObject(piece.object),
    );
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++)
        assert.ok(
          !boxes[i].intersectsBox(boxes[j]),
          `${pieces[i].key} intersects ${pieces[j].key}`,
        );
  }
});

await test('the SO-DIMM has a physical key gap and contacts on both faces', () => {
  const model = models.get('legionmemory')!;
  model.root.updateMatrixWorld(true);
  const ray = (x: number, z: number) =>
    new T.Raycaster(
      new T.Vector3(...notebookV(x, 10, z)),
      new T.Vector3(0, -1, 0),
    ).intersectObject(model.root, true);
  assert.equal(
    ray(3.5, 14.2).length,
    0,
    'the DDR4 key notch was only painted onto the board',
  );
  assert.ok(ray(0, 13.6).length > 0, 'the contact edge disappeared');
  const packages = model.pieces.filter(
    (piece) => piece.concept === 'legionpackage',
  );
  assert.equal(packages.length, 8);
  assert.equal(packages.filter((piece) => piece.base.y > 0).length, 4);
  assert.equal(packages.filter((piece) => piece.base.y < 0).length, 4);
  const board = new T.Box3()
    .setFromObject(
      model.pieces.find((piece) => piece.concept === 'legionmemory-board')!
        .object,
    )
    .getSize(new T.Vector3())
    .multiplyScalar(20);
  assert.ok(
    Math.abs(board.x - 69.6) < 0.001 &&
      Math.abs(board.z - 30) < 0.001 &&
      Math.abs(board.y - 1.2) < 0.001,
  );
});

await test('chip hierarchy drawings show the selected configurations and Ampere resources', () => {
  const count = (level: NotebookLevel, concept: string) =>
    models.get(level)!.pieces.filter((piece) => piece.concept === concept)
      .length;
  assert.equal(count('legioncpu', 'legioncore'), 8);
  assert.equal(count('legiongpu', 'legionsm'), 30);
  assert.equal(
    30 * 128,
    Number(byId.legionsm.specifications['CUDA cores'].replace(',', '')),
  );
  assert.equal(count('maccpu', 'maccore'), 8);
  assert.equal(count('maccpu', 'maccpu-efficiency'), 2);
  assert.equal(count('macgpu', 'macgpucore'), 16);
  for (const id of ['schedule', 'registers', 'arithmetic'])
    assert.equal(count('legionsm', `legionsm-${id}`), 4);
  assert.equal(count('legiondram', 'legionbank'), 16);
  assert.equal(count('legionbank', 'legioncell'), 6);
});

await test('DRAM cell diagrams contain circuits with separate wordline and bitline layers', () => {
  for (const level of ['legioncell', 'maccell'] as const) {
    const model = models.get(level)!;
    assert.equal(
      model.pieces.filter((piece) => piece.concept === `${level}-transistor`)
        .length,
      12,
    );
    assert.equal(
      model.pieces.filter((piece) => piece.concept === `${level}-capacitor`)
        .length,
      12,
    );
    const wordline = model.pieces.find(
      (piece) => piece.concept === `${level}-wordline`,
    )!;
    const bitline = model.pieces.find(
      (piece) => piece.concept === `${level}-bitline`,
    )!;
    assert.ok(
      new T.Box3().setFromObject(wordline.object).min.y >
        new T.Box3().setFromObject(bitline.object).max.y,
    );
  }
});

await test('both notebook blowers remain animated through model consolidation and installed assemblies', () => {
  for (const level of [
    'legioncooling',
    'maccooling',
    'legion',
    'macbook',
  ] as const) {
    const rotors = collectAnimatedObjects(models.get(level)!.root).filter(
      (object) => object.userData.spinRate,
    );
    assert.equal(
      rotors.length,
      2,
      level + ' lost a rotor during geometry merging',
    );
    const previous = rotors.map((rotor) => rotor.rotation.y);
    animateObjects(rotors, 0.25);
    rotors.forEach((rotor, index) => {
      assert.notEqual(rotor.rotation.y, previous[index]);
      rotor.rotation.y = previous[index];
    });
  }
});

await test('MacBook display has an open camera notch without triangles across the opening', () => {
  const panel = models
    .get('macdisplay')!
    .pieces.find((piece) => piece.concept === 'macdisplay-panel')!.object;
  panel.updateMatrixWorld(true);
  const ray = (x: number) =>
    new T.Raycaster(
      new T.Vector3(...notebookV(x, 20, -98.5)),
      new T.Vector3(0, -1, 0),
    ).intersectObject(panel, true);
  assert.equal(ray(0).length, 0, 'LCD triangles cover the camera notch');
  assert.ok(ray(25).length > 0, 'the LCD beside the notch is missing');
});
