import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel, type Piece } from '../lib/models.ts';
import {
  applyPiecePose,
  ModelStageScratch,
  prepareModelInventory,
} from '../lib/model-stage.ts';
import type { LevelId } from '../lib/levels.ts';

// The same canvas stub the geometry tests use: the builders draw their labels
// and filter weave through it, and none of this needs a WebGL context.
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
              ? (w: number, h: number) => ({
                  data: new Uint8ClampedArray(w * h * 4),
                })
              : () => {},
        },
      ),
  }),
} as unknown as Document;
after(() => {
  globalThis.document = previousDocument;
});

const PC = 'pc' as LevelId;
const model = buildModel(PC);
const find = (concept: string, instance = 0) => {
  const piece = model.pieces.find(
    (p) => p.concept === concept && p.instance === instance,
  );
  assert.ok(piece, `${concept}-${instance} is missing`);
  return piece;
};
const boxOf = (piece: Piece) => {
  piece.object.updateMatrixWorld(true);
  return new T.Box3().setFromObject(piece.object);
};

await test('the case opens before anything behind its panels moves', () => {
  // A fan that sets off forward while the mesh in front of it is still shut
  // goes through the mesh. The panels, the lid and the filters leave first.
  prepareModelInventory(model, PC, 1.6);
  const scratch = new ModelStageScratch();
  const covers = ['frontpanel', 'dustfilter'].map((c) => find(c));
  const fans = model.pieces.filter((p) => p.concept === 'casefan');
  try {
    for (let value = 0.01; value <= 0.5; value += 0.01) {
      for (const piece of model.pieces)
        applyPiecePose(piece, PC, value, scratch);
      for (const cover of covers) {
        const shut = boxOf(cover).expandByScalar(-0.01);
        for (const fan of fans)
          assert.ok(
            !shut.intersectsBox(boxOf(fan).expandByScalar(-0.01)),
            `${fan.key} runs into ${cover.key} at ${(value * 100).toFixed(0)}%`,
          );
      }
    }
  } finally {
    for (const piece of model.pieces) applyPiecePose(piece, PC, 0, scratch);
  }
});

await test('every rear connector can be seen through the I/O shield', () => {
  // Look at each connector from behind the machine. The first thing the ray
  // meets has to be the board, not the shield in front of it.
  model.root.updateMatrixWorld(true);
  const board = find('motherboard').object.children[0];
  const ports = (board.userData.rearPorts as T.Box3[]).map((b) =>
    b.clone().applyMatrix4(board.matrixWorld),
  );
  assert.ok(ports.length >= 10, 'the board has almost no rear connectors');
  const shield = find('ioshield');
  const raycaster = new T.Raycaster();
  for (const port of ports) {
    const centre = port.getCenter(new T.Vector3());
    raycaster.set(
      new T.Vector3(port.min.x - 2, centre.y, centre.z),
      new T.Vector3(1, 0, 0),
    );
    const hits = raycaster.intersectObject(model.root, true);
    let owner: T.Object3D | null = hits[0]?.object ?? null;
    while (owner && !owner.userData.piece) owner = owner.parent;
    assert.notEqual(
      owner?.userData.piece,
      shield,
      `the shield covers the connector at ${centre.y.toFixed(2)}, ${centre.z.toFixed(2)}`,
    );
    assert.equal(owner?.userData.piece?.concept, 'motherboard');
  }
});

await test('the front I/O is on the outside of the case', () => {
  // It used to sit under the roof, inside the case, out of reach.
  const io = boxOf(find('frontio'));
  const roof = boxOf(find('chassis')).max.y;
  assert.ok(io.max.y > roof, 'the buttons do not stand above the roof');
  assert.ok(io.min.y > roof - 0.4, 'the front I/O hangs into the case');
});
