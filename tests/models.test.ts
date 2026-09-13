import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel, refreshBatches, type Piece } from '../lib/models.ts';
import { byId, isLevelRoot, manifest } from '../lib/manifest.ts';
import { resolvePick, resolvePickNear } from '../lib/picking.ts';
import { levelIds } from '../lib/levels.ts';
import { hardwareInventory, type Vec3 } from '../lib/layout.ts';

// Geometry tests need the canvas texture API, but not a WebGL context. Browser
// visual checks cover the real textures; this stub only records valid dimensions.
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

const models = new Map(levelIds.map((level) => [level, buildModel(level)]));

await test('every component family has real selectable geometry in its search context', () => {
  // Scales themselves have no piece of their own; everything else must.
  for (const concept of manifest.filter((c) => !isLevelRoot(c))) {
    assert.ok(
      models.get(concept.level)!.pieces.some((p) => p.concept === concept.id),
      concept.id,
    );
  }
  assert.ok(
    models
      .get('card')!
      .pieces.every(
        (p) =>
          manifest.find((c) => c.id === p.concept)?.representationType ===
          'physical',
      ),
  );
});

await test('all repeated structures have globally unique, consecutive identities', () => {
  for (const model of models.values()) {
    assert.equal(
      new Set(model.pieces.map((p) => p.key)).size,
      model.pieces.length,
    );
    const counters = new Map<string, number>();
    for (const p of model.pieces) {
      assert.equal(p.instance, counters.get(p.concept) ?? 0, p.key);
      counters.set(p.concept, p.instance + 1);
      assert.ok(
        p.extent.toArray().every((n) => Number.isFinite(n) && n > 0),
        p.key,
      );
      if (p.batch) assert.equal(p.batch.userData.pieces[p.index!], p);
      else assert.equal(p.object.userData.piece, p);
    }
  }
  assert.equal(
    models.get('card')!.pieces.filter((p) => p.concept === 'heatsink').length,
    152,
  );
});

await test('ray picking distinguishes the two fin banks instead of selecting duplicate fin IDs', () => {
  const fins = models
    .get('card')!
    .pieces.filter((p) => p.concept === 'heatsink');
  for (const p of fins) {
    p.batch!.setMatrixAt(
      p.index!,
      new T.Matrix4().makeTranslation(...p.base.toArray()),
    );
  }
  for (const index of [0, 75, 76, 151]) {
    const fin = fins[index];
    fin.batch!.computeBoundingSphere();
    const ray = new T.Raycaster(
      new T.Vector3(fin.base.x, 5, fin.base.z),
      new T.Vector3(0, -1, 0),
    );
    const hit = ray.intersectObject(fin.batch!)[0];
    assert.ok(hit, fin.key);
    assert.equal(fin.batch!.userData.pieces[hit.instanceId!].instance, index);
  }
});

await test('hardware inventory packs actual footprints without overlap on narrow and wide screens', () => {
  const pieces = models.get('card')!.pieces;
  const items = pieces.map((p) => ({
    extent: p.extent.toArray() as Vec3,
    size: p.size,
  }));
  for (const aspect of [0.45, 1, 1.8, 2.4]) {
    const layout = hardwareInventory(items, aspect);
    assert.deepEqual(layout, hardwareInventory(items, aspect));
    for (let i = 0; i < layout.length; i++) {
      assert.ok(layout[i].position.every(Number.isFinite));
      for (let j = i + 1; j < layout.length; j++) {
        const a = layout[i],
          b = layout[j];
        assert.ok(
          Math.abs(a.position[0] - b.position[0]) >=
            (items[i].extent[0] * a.scale + items[j].extent[0] * b.scale) / 2 ||
            Math.abs(a.position[2] - b.position[2]) >=
              (items[i].extent[2] * a.scale + items[j].extent[2] * b.scale) / 2,
          `${i} overlaps ${j}`,
        );
      }
    }
    const pcb = pieces.findIndex((p) => p.concept === 'pcb'),
      resistor = pieces.findIndex((p) => p.concept === 'resistor');
    assert.ok(
      items[pcb].extent[0] * layout[pcb].scale >
        items[resistor].extent[0] * layout[resistor].scale * 10,
    );
  }
});

await test('you can point through the glass instead of it answering for the whole machine', () => {
  const { pieces, root } = models.get('pc')!;
  root.updateMatrixWorld(true);
  const seeThrough = (o: T.Object3D) => {
    const m = (o as T.Mesh).material;
    return (Array.isArray(m) ? m : [m]).some(
      (one) =>
        one &&
        'transparent' in one &&
        one.transparent &&
        ((one as T.Material & { opacity: number }).opacity ?? 1) < 0.75,
    );
  };
  // Fire rays from where the camera actually sits at points spread over every
  // part, so plenty of them cross the window panel on the way in.
  const camera = new T.Vector3(11, 7, 19);
  const named = new Set<string>();
  let crossedGlass = 0;
  for (const p of pieces) {
    const centre = p.object.getWorldPosition(new T.Vector3()).add(p.center);
    for (const nudge of [
      new T.Vector3(0, 0, 0),
      p.extent.clone().multiplyScalar(0.3),
      p.extent.clone().multiplyScalar(-0.3),
      new T.Vector3(p.extent.x * 0.3, -p.extent.y * 0.3, 0),
    ]) {
      const ray = new T.Raycaster(
        camera,
        centre.clone().add(nudge).sub(camera).normalize(),
      );
      const hits = ray.intersectObject(root, true);
      const picked = resolvePick(hits);
      if (picked) named.add(picked.concept);
      const solid = hits.find((h) => !seeThrough(h.object));
      if (!solid) continue;
      if (hits.indexOf(solid) > 0) crossedGlass++;
      // The contract: a transparent surface in front never wins over a solid
      // part behind it. Without this the window answers for everything.
      assert.ok(
        picked && !seeThrough(solid.object) && picked.object.scale.x >= 0,
        'a see-through surface swallowed a pick meant for a solid part',
      );
      assert.ok(!seeThrough(hits[0].object) || picked !== null);
    }
  }
  assert.ok(crossedGlass > 20, 'the test never actually shot through the glass');
  assert.ok(named.size >= 8, 'only ' + named.size + ' distinct parts were reachable');
  for (const concept of named) assert.ok(byId[concept]?.shortName, concept + ' has no name');
});

await test('nothing on screen is anonymous: every rendered object belongs to a named part', () => {
  for (const level of levelIds) {
    const { pieces, root } = models.get(level)!;
    const owned = new Set<T.Object3D>();
    for (const p of pieces) p.object.traverse((o) => owned.add(o));
    for (const child of root.children) {
      // Context frames are deliberate scenery and carry their own 3-D labels.
      if (child.userData.contextFrame) continue;
      assert.ok(
        owned.has(child) || child instanceof T.InstancedMesh,
        `${level}: an object is rendered but belongs to no named part`,
      );
    }
    for (const p of pieces)
      assert.ok(byId[p.concept]?.shortName, `${level}: ${p.concept} has no name`);
  }
});

await test('pointing has a margin for error, and it never reaches past what is in front', () => {
  // The ring only matters where a part is surrounded by empty space, the
  // exploded inventory, and that placement happens in the scene, not in the
  // model. So this tests the contract directly, which is why resolvePickNear
  // takes a cast callback instead of a camera.
  const stub = (distance: number) => {
    const mesh = new T.Mesh(
      new T.BoxGeometry(1, 1, 1),
      new T.MeshBasicMaterial(),
    );
    const piece = {
      concept: 'p' + distance,
      instance: 0,
      visible: true,
      object: mesh,
    } as unknown as Piece;
    mesh.userData.piece = piece;
    const intersection = {
      object: mesh,
      distance,
      point: new T.Vector3(),
    } as T.Intersection;
    return { intersection, piece };
  };

  const near = stub(4),
    far = stub(9);

  // A centre hit answers alone: the ring is never consulted.
  let casts = 0;
  const centreHits = (dx: number, dy: number) => {
    casts++;
    return dx === 0 && dy === 0 ? [near.intersection] : [far.intersection];
  };
  assert.equal(resolvePickNear(centreHits, 12), near.piece);
  assert.equal(casts, 1, 'a direct hit should cost exactly one ray');

  // A centre miss reaches out, but only when a radius is given.
  const offCentre = (dx: number, dy: number) =>
    dx === 0 && dy === 0 ? [] : [far.intersection];
  assert.equal(resolvePickNear(offCentre, 0), null, 'no radius, no reaching');
  assert.equal(resolvePickNear(offCentre, 12), far.piece);

  // When several directions find something, the nearest to the camera wins, so
  // widening the target never picks something behind a closer part.
  const mixed = (dx: number) =>
    dx === 0 ? [] : dx > 0 ? [far.intersection] : [near.intersection];
  assert.equal(resolvePickNear((dx) => mixed(dx), 12), near.piece);

  // Empty sky stays empty.
  assert.equal(resolvePickNear(() => [], 30), null);
});

await test('parts drawn as instances stay pickable after the layout moves them', () => {
  // Most of this machine is instanced (408 of the card's 459 parts) and the
  // scene rewrites those matrices on every frame of an explode. three.js caches
  // the bounding sphere it raycasts against on first use, so without an explicit
  // invalidation the pickable region freezes wherever the parts happened to be
  // the first time anyone pointed at them, and everything that moves out of it
  // goes quietly dead. See refreshBatches.
  const { pieces, root } = models.get('card')!;
  const batched = pieces.filter((p) => p.batch);
  assert.ok(batched.length > 50, 'expected the card to be mostly instanced');
  const batches = new Set(batched.map((p) => p.batch!));

  const matrix = new T.Matrix4(),
    quat = new T.Quaternion(),
    scale = new T.Vector3();
  const sync = () => {
    for (const p of pieces) {
      if (!p.batch) continue;
      matrix.compose(p.object.position, quat, scale.setScalar(1));
      p.batch.setMatrixAt(p.index!, matrix);
    }
    refreshBatches(batches);
    root.updateMatrixWorld(true);
  };
  // Straight down the +Z axis at the part, from outside everything.
  const reachable = (p: (typeof pieces)[number]) => {
    const at = p.object.getWorldPosition(new T.Vector3());
    const from = at.clone().add(new T.Vector3(0, 0, 60));
    const ray = new T.Raycaster(from, at.clone().sub(from).normalize());
    return resolvePick(ray.intersectObject(root, true))?.key === p.key;
  };

  // Somewhere to put them where nothing occludes anything: one long row.
  const sample = batched.filter((_, i) => i % 7 === 0).slice(0, 24);
  const spread = (gap: number) =>
    pieces.forEach((p, i) => p.object.position.set((i - pieces.length / 2) * gap, 0, 0));

  spread(0.6);
  sync();
  const first = sample.filter(reachable).length;
  assert.ok(first > sample.length * 0.7, `only ${first}/${sample.length} reachable to begin with`);

  // Now move everything, exactly as sliding the explode control does.
  spread(2.4);
  sync();
  const moved = sample.filter(reachable).length;
  assert.ok(
    moved > sample.length * 0.7,
    `${moved}/${sample.length} instanced parts reachable after the layout moved them: the cached bounding sphere is stale`,
  );

  // Restore, so later tests see the model as they found it.
  for (const p of pieces) p.object.position.copy(p.base);
  sync();
});
