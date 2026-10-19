// CPU microbenchmark: geometry construction and the work shared by both viewers.
// Run with node --experimental-strip-types scripts/benchmark-rendering.mjs.
import * as T from 'three';
import { buildModel, refreshBatches } from '../lib/models.ts';
import {
  applyPiecePose,
  prepareModelInventory,
  ModelStageScratch,
} from '../lib/model-stage.ts';

Reflect.set(globalThis, 'document', {
  createElement: () => ({
    getContext: () =>
      new Proxy(
        {},
        {
          get: (_, key) =>
            key === 'createImageData'
              ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })
              : () => {},
        },
      ),
  }),
});
const stage = await import('../lib/model-stage.ts');
const { accelerateRaycasts } = await import('../lib/raycast-acceleration.ts');
const baseline = process.argv.includes('--baseline');
const median = (values) =>
  values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
const measure = (fn, iterations) => {
  const samples = [];
  for (let run = 0; run < 7; run++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) fn(i);
    samples.push((performance.now() - start) / iterations);
  }
  return Number(median(samples).toFixed(4));
};
for (const level of ['pc', 'card', 'legion', 'macbook']) {
  const start = performance.now();
  const model = buildModel(level);
  const buildMs = performance.now() - start;
  prepareModelInventory(model, level, 1.6);
  const scratch = new ModelStageScratch();
  const batches = new Set(
    model.pieces.flatMap((p) => (p.batch ? [p.batch] : [])),
  );
  const cache =
    !baseline && stage.ModelPoseCache
      ? new stage.ModelPoseCache(model, level)
      : null;
  const pose = (amount) => {
    if (cache) cache.update(amount);
    else {
      for (const p of model.pieces) applyPiecePose(p, level, amount, scratch);
      refreshBatches(batches);
    }
  };
  pose(0);
  const idlePoseMs = measure(() => pose(0), 1000);
  const movingPoseMs = measure((i) => pose((i % 100) / 100), 200);
  pose(0);
  model.root.updateMatrixWorld(true);
  if (baseline)
    model.root.traverse((o) => {
      if (o instanceof T.Mesh) o.geometry.boundingBox = null;
    });
  // The viewers build these in idle time after the first frame.
  const treeStart = performance.now();
  if (!baseline) accelerateRaycasts(model.root);
  const treeMs = Math.round(performance.now() - treeStart);
  const raycaster = new T.Raycaster();
  const raycastMs = measure((i) => {
    raycaster.set(
      new T.Vector3(((i % 9) - 4) * 2, 25, ((Math.floor(i / 9) % 9) - 4) * 2),
      new T.Vector3(0, -1, 0),
    );
    raycaster.intersectObject(model.root, true);
  }, 81);
  console.log(
    JSON.stringify({
      level,
      pieces: model.pieces.length,
      buildMs: Math.round(buildMs),
      treeMs,
      idlePoseMs,
      movingPoseMs,
      raycastMs,
    }),
  );
}
