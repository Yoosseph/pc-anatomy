import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { comparisonItem } from '../lib/comparison-state.ts';
import { buildModel } from '../lib/models.ts';
import {
  disposeModelResources,
  posedModelBounds,
  prepareModelInventory,
} from '../lib/model-stage.ts';
import {
  COMPARISON_ORBIT_DISTANCE,
  comparisonFitDistances,
  updateComparisonCamera,
  type ComparisonFrame,
} from '../lib/comparison-framing.ts';

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} != ${expected}`);

function orbitCamera(aspect: number) {
  const camera = new T.PerspectiveCamera(32, aspect, 0.1, 200);
  camera.position.set(0.7, 0.85, 1.2).setLength(COMPARISON_ORBIT_DISTANCE);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

await test('independent fitting fills each pane while true scale converts authored units', () => {
  const fit = comparisonFitDistances([10, 0.1], [35, 20], 'fit', 0.8, 32);
  close(fit[0] / fit[1], 100);
  const scaled = comparisonFitDistances([10, 0.1], [35, 20], 'scale', 0.8, 32);
  close(scaled[0] * 35, scaled[1] * 20);
  close(scaled[0], fit[0]);
  assert.ok(scaled[1] > fit[1]);
  const reversed = comparisonFitDistances(
    [0.1, 10],
    [20, 35],
    'scale',
    0.8,
    32,
  );
  close(reversed[0], scaled[1]);
  close(reversed[1], scaled[0]);
});

await test('unknown or invalid physical units never imply a shared real scale', () => {
  const fit = comparisonFitDistances([10, 1], [35, null], 'fit', 1, 32);
  for (const units of [
    [35, null],
    [null, 20],
    [35, 0],
    [NaN, 20],
  ] as const)
    assert.deepEqual(
      comparisonFitDistances([10, 1], units, 'scale', 1, 32),
      fit,
    );
});

await test('pane cameras contain off-center hardware at mobile and split aspects', () => {
  const boxes = [
    new T.Box3(new T.Vector3(-10, -8, -6), new T.Vector3(10, 8, 6)),
    new T.Box3(new T.Vector3(50, -5, 12), new T.Vector3(50.2, -4.99, 12.1)),
  ];
  for (const aspect of [0.45, 1, 1.8])
    for (const framing of ['fit', 'scale'] as const) {
      const shared = orbitCamera(aspect);
      const radii = boxes.map(
        (box) => box.getSize(new T.Vector3()).length() / 2,
      ) as [number, number];
      const distances = comparisonFitDistances(
        radii,
        [35, 20],
        framing,
        aspect,
        shared.fov,
      );
      boxes.forEach((box, index) => {
        const frame = {
          center: box.getCenter(new T.Vector3()),
          radius: radii[index],
          distance: distances[index],
        };
        const camera = new T.PerspectiveCamera();
        updateComparisonCamera(shared, frame, camera);
        for (const x of [box.min.x, box.max.x])
          for (const y of [box.min.y, box.max.y])
            for (const z of [box.min.z, box.max.z]) {
              const point = new T.Vector3(x, y, z).project(camera);
              assert.ok(
                Math.abs(point.x) < 1 &&
                  Math.abs(point.y) < 1 &&
                  Math.abs(point.z) < 1,
                `${framing} clipped at aspect ${aspect}`,
              );
            }
      });
    }
});

await test('normalized orbit, pan and zoom map consistently into each pane', () => {
  const shared = orbitCamera(1);
  const target = new T.Vector3(1, 0.5, -0.2);
  shared.position.multiplyScalar(0.7).add(target);
  shared.lookAt(target);
  shared.updateMatrixWorld(true);
  const cameras = [new T.PerspectiveCamera(), new T.PerspectiveCamera()];
  const frames: ComparisonFrame[] = [
    { center: new T.Vector3(-2, 5, 1), radius: 10, distance: 40 },
    { center: new T.Vector3(50, -5, 12), radius: 0.1, distance: 0.4 },
  ];
  const points = frames.map((frame, index) => {
    updateComparisonCamera(shared, frame, cameras[index]);
    assert.deepEqual(
      cameras[index].quaternion.toArray(),
      shared.quaternion.toArray(),
    );
    return frame.center.clone().project(cameras[index]);
  });
  close(points[0].x, points[1].x);
  close(points[0].y, points[1].y);
});

await test('picking uses the displayed pane camera for models with different centers and scales', () => {
  const shared = orbitCamera(1);
  const raycaster = new T.Raycaster();
  const geometry = new T.BoxGeometry(1, 1, 1);
  const material = new T.MeshBasicMaterial();
  for (const [center, size] of [
    [new T.Vector3(-20, 3, 7), 10],
    [new T.Vector3(50, -5, 12), 0.01],
  ] as const) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.copy(center);
    mesh.scale.setScalar(size);
    mesh.updateMatrixWorld(true);
    const radius = (Math.sqrt(3) * size) / 2;
    const [distance] = comparisonFitDistances(
      [radius, radius],
      [null, null],
      'fit',
      1,
      shared.fov,
    );
    const camera = new T.PerspectiveCamera();
    updateComparisonCamera(shared, { center, radius, distance }, camera);
    raycaster.setFromCamera(new T.Vector2(), camera);
    assert.ok(raycaster.intersectObject(mesh).length > 0);
  }
  geometry.dispose();
  material.dispose();
});

await test('cross-system hardware and diagram pairs stay framed through disassembly and inventory', () => {
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
  const pairs = [
    ['pc', 'legiondram'],
    ['nvme', 'legion'],
    ['cell', 'psu'],
    ['dimm', 'ddr4'],
    ['dram', 'legiondram'],
  ] as const;
  const models = new Map(
    [...new Set(pairs.flat())].map((level) => [level, buildModel(level)]),
  );
  try {
    for (const pair of pairs)
      for (const aspect of [0.5, 1.5])
        for (const amount of [0, 0.5, 1]) {
          const shared = orbitCamera(aspect);
          const boxes = pair.map((level) => {
            const model = models.get(level)!;
            for (const piece of model.pieces)
              piece.visible = piece.reveal === 0 || amount > piece.reveal;
            prepareModelInventory(model, level, aspect);
            return posedModelBounds(model, level, amount);
          });
          const radii = boxes.map(
            (box) => box.getSize(new T.Vector3()).length() / 2,
          ) as [number, number];
          const units = pair.map(
            (level) => comparisonItem(level).millimetersPerUnit,
          ) as [number | null, number | null];
          for (const framing of ['fit', 'scale'] as const) {
            const distances = comparisonFitDistances(
              radii,
              units,
              framing,
              aspect,
              shared.fov,
            );
            boxes.forEach((box, index) => {
              const camera = new T.PerspectiveCamera();
              updateComparisonCamera(
                shared,
                {
                  center: box.getCenter(new T.Vector3()),
                  radius: radii[index],
                  distance: distances[index],
                },
                camera,
              );
              for (const x of [box.min.x, box.max.x])
                for (const y of [box.min.y, box.max.y])
                  for (const z of [box.min.z, box.max.z]) {
                    const point = new T.Vector3(x, y, z).project(camera);
                    assert.ok(
                      Math.abs(point.x) < 1 &&
                        Math.abs(point.y) < 1 &&
                        Math.abs(point.z) < 1,
                      `${pair[index]} clipped at ${amount} (${framing}, aspect ${aspect})`,
                    );
                  }
            });
          }
        }
  } finally {
    models.forEach(disposeModelResources);
    globalThis.document = previousDocument;
  }
});
