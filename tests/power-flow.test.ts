import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { initialState, selectSearch } from '../lib/explorer-state.ts';
import {
  powerRoutes,
  hasPowerFlow,
  visiblePowerRoutes,
  powerStrength,
} from '../lib/power-flow-policy.ts';
import { buildModel } from '../lib/models.ts';
import { disposeModelResources } from '../lib/model-stage.ts';
import { byId } from '../lib/manifest.ts';
import { sources } from '../lib/sources.ts';
import type { PowerTick } from '../lib/power-flow.ts';
import type { Vec3 } from '../lib/layout.ts';

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
const model = buildModel('pc');
const overlay = model.root.children.find(
  (object) => object.userData.powerTick,
)!;
const tick = overlay.userData.powerTick as PowerTick;
after(() => {
  disposeModelResources(model);
  globalThis.document = previousDocument;
});

await test('power is opt-in, desktop-only, and its preference survives search', () => {
  assert.deepEqual(visiblePowerRoutes(initialState), []);
  assert.equal(hasPowerFlow('pc'), true);
  for (const level of ['motherboard', 'card', 'legion', 'macbook'] as const) {
    assert.equal(hasPowerFlow(level), false);
    assert.deepEqual(
      visiblePowerRoutes({ ...initialState, power: true, level }),
      [],
    );
  }
  const state = selectSearch(
    { ...initialState, power: true, powerTarget: 'cpu' },
    'eps8',
  );
  assert.equal(state.power, true);
  assert.equal(state.powerTarget, 'cpu');
});

await test('GPU has two feeds; hidden hardware, isolation and dives suppress the affected routes', () => {
  const state = { ...initialState, power: true };
  assert.deepEqual(visiblePowerRoutes({ ...state, powerTarget: 'gpu' }), [
    'atx',
    'gpu',
    'slot',
  ]);
  assert.deepEqual(visiblePowerRoutes({ ...state, powerTarget: 'cpu' }), [
    'eps',
  ]);
  assert.deepEqual(visiblePowerRoutes({ ...state, powerTarget: 'storage' }), [
    'sata',
  ]);
  assert.deepEqual(visiblePowerRoutes({ ...state, hidden: ['motherboard'] }), [
    'gpu',
    'sata',
  ]);
  assert.deepEqual(visiblePowerRoutes({ ...state, hidden: ['graphicscard'] }), [
    'atx',
    'eps',
    'sata',
  ]);
  for (const hidden of [['psu'], ['psucable']])
    assert.deepEqual(visiblePowerRoutes({ ...state, hidden }), []);
  assert.deepEqual(
    visiblePowerRoutes({ ...state, visible: ['Power', 'Storage'] }),
    ['sata'],
  );
  assert.deepEqual(visiblePowerRoutes({ ...state, isolated: true }), []);
  assert.deepEqual(
    visiblePowerRoutes({ ...state, diveInto: 'motherboard' }),
    [],
  );
});

await test('route descriptions cite real sources and inspection destinations exist', () => {
  for (const route of powerRoutes) {
    assert.ok(byId[route.inspect]);
    assert.ok(route.sources.length);
    for (const id of route.sources) {
      assert.ok(sources[id]);
      assert.ok(
        byId[route.inspect].sources.includes(id),
        `${route.id}: citation is reachable in component details`,
      );
    }
    for (const id of route.requires) assert.equal(byId[id].level, 'pc');
  }
});

await test('all four cable feeds begin at the PSU and terminate at their hardware', () => {
  const bounds = (id: string) => {
    const piece = model.pieces.find((piece) => piece.concept === id)!;
    return new T.Box3()
      .setFromCenterAndSize(piece.base.clone().add(piece.center), piece.extent)
      .expandByScalar(0.25);
  };
  assert.equal(overlay.children.length, powerRoutes.length);
  for (const group of overlay.children) {
    const path = group.userData.path as Vec3[];
    const start = new T.Vector3(...path[0]);
    const end = new T.Vector3(...path[path.length - 1]);
    assert.ok(
      bounds(group.name === 'slot' ? 'motherboard' : 'psu').containsPoint(
        start,
      ),
      `${group.name} source`,
    );
    const destination =
      group.name === 'sata'
        ? 'ssd'
        : ['gpu', 'slot'].includes(group.name)
          ? 'graphicscard'
          : 'motherboard';
    assert.ok(
      bounds(destination).containsPoint(end),
      `${group.name} destination`,
    );
  }
});

await test('power arrows move toward their destination, freeze with a fixed clock, and never intercept picking', () => {
  assert.equal(overlay.userData.contextFrame, true);
  assert.ok(!model.pieces.some((piece) => piece.object === overlay));
  const ids = powerRoutes.map((route) => route.id);
  tick(0, 1, ids);
  const matrices = () =>
    overlay.children.map((group) => {
      const mesh = group.children.find(
        (child) => child instanceof T.InstancedMesh,
      ) as T.InstancedMesh;
      const matrix = new T.Matrix4();
      mesh.getMatrixAt(0, matrix);
      return matrix;
    });
  const before = matrices();
  tick(0.1, 1, ids);
  const after = matrices();
  before.forEach((matrix, i) => {
    const delta = new T.Vector3()
      .setFromMatrixPosition(after[i])
      .sub(new T.Vector3().setFromMatrixPosition(matrix));
    assert.ok(delta.dot(new T.Vector3(0, 0, 1).transformDirection(matrix)) > 0);
  });
  tick(0, 1, ids);
  assert.deepEqual(matrices(), before);
  overlay.traverse((object) => {
    if (!(object instanceof T.Mesh || object instanceof T.Line)) return;
    assert.equal(object.userData.contextFrame, true);
    const hits: T.Intersection[] = [];
    object.raycast(new T.Raycaster(), hits);
    assert.deepEqual(hits, []);
  });
  tick(0, 1, ['sata']);
  assert.deepEqual(
    overlay.children
      .filter((group) => group.visible)
      .map((group) => group.name),
    ['sata'],
  );
  tick(0, 1, []);
  assert.equal(overlay.visible, false);
  tick(0, 0, ids);
  assert.equal(overlay.visible, false);
});

await test('power fades monotonically and is gone before disassembly separates the hardware', () => {
  let previous = 1;
  assert.equal(powerStrength(0), 1);
  for (let i = 0; i <= 100; i++) {
    const strength = powerStrength(i / 100);
    assert.ok(strength <= previous && strength >= 0);
    previous = strength;
  }
  assert.equal(powerStrength(0.09), 0);
});
