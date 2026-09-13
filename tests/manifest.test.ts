import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  manifest,
  byId,
  initialState,
  selectSearch,
  searchConcepts,
  levelPath,
  colors,
  categories,
} from '../lib/manifest.ts';
import {
  inventoryLayout,
  smoothstep,
  finiteBounds,
  spatialInventory,
  type Vec3,
} from '../lib/layout.ts';
import { branchRoot, levelIds, levels, rootLevel } from '../lib/levels.ts';
import { sources } from '../lib/sources.ts';

await test('all concepts have unique identities, reciprocal parents, sources and no cycles', () => {
  assert.equal(new Set(manifest.map((c) => c.id)).size, manifest.length);
  for (const c of manifest) {
    assert.ok(c.description && c.purpose && c.quantity);
    // A citation must resolve. An empty list is honest: some parts are just
    // sheet metal, and pointing at a vendor page for them would be a fiction.
    assert.equal(new Set(c.sources).size, c.sources.length, 'duplicate source on ' + c.id);
    for (const s of c.sources)
      assert.ok(sources[s], c.id + ' cites a source that does not exist: ' + s);
    assert.ok(categories.includes(c.category));
    assert.ok(colors[c.category]);
    assert.ok(c.physicalAccuracy.length > 30);
    if (c.parent) {
      assert.ok(byId[c.parent]);
      assert.ok(byId[c.parent].children.includes(c.id));
    }
    for (const child of c.children) assert.equal(byId[child].parent, c.id);
    const visited = new Set<string>();
    let id: string | null = c.id;
    while (id) {
      assert.ok(!visited.has(id), 'cycle at ' + id);
      visited.add(id);
      id = byId[id].parent;
    }
  }
});
await test('shipping SKU counts are distinct from full-chip capacity', () => {
  assert.equal(byId.die.specifications.SMs, '170');
  assert.equal(byId.die.specifications.TPCs, '85');
  assert.equal(byId.die.specifications.GPCs, '11');
  assert.equal(
    Number(byId.die.specifications['CUDA cores'].replace(',', '')),
    170 * 128,
  );
  assert.equal(byId.l2.specifications.Capacity, '96 MB');
  assert.equal(byId.gpc.specifications['Full GPC'], '8 TPCs / 16 SMs');
});
await test('search covers requested concepts, plurals and case without irrelevant misses', () => {
  for (const [query, id] of [
    ['Tensor Core', 'tensor'],
    ['GDDR7', 'gddr7'],
    ['L2', 'l2'],
    ['all SMs', 'sm'],
    ['VRM', 'vrm'],
    ['RT Core', 'rt'],
    ['CUDA', 'cuda'],
  ])
    assert.ok(
      searchConcepts(query).some((c) => c.id === id),
      query,
    );
  assert.equal(searchConcepts('nonsense missing component').length, 0);
});
await test('search restores hidden layers, selects groups and navigates to the correct context', () => {
  const hidden = {
    ...initialState,
    visible: [],
    hidden: ['tensor'],
    isolated: true,
  };
  const next = selectSearch(hidden, 'tensor');
  assert.equal(next.level, 'sm');
  assert.ok(next.visible.includes('Compute'));
  assert.ok(!next.hidden.includes('tensor'));
  assert.equal(next.selection?.concept, 'tensor');
  assert.equal(next.selection?.instance, undefined);
  assert.equal(next.isolated, false);
  assert.ok(next.focusRevision > hidden.focusRevision);
  assert.equal(hidden.hidden.length, 1);
  for (const id of ['card', 'die']) {
    const root = selectSearch(hidden, id);
    assert.equal(root.selection, null);
    assert.equal(root.level, id);
    assert.equal(root.explode, 0);
    assert.equal(root.visible.length, categories.length);
  }
  assert.deepEqual(levelPath('sm'), ['pc', 'card', 'die', 'gpc', 'tpc', 'sm']);
});
await test('deterministic inventories fit every normalized component without overlap at supported aspect ratios', () => {
  for (const n of [0, 1, 28, 154, 408, 589])
    for (const aspect of [0.45, 0.7, 1, 1.8, 2.4]) {
      const p = inventoryLayout(n, aspect);
      assert.equal(p.length, n);
      assert.ok(finiteBounds(p));
      assert.deepEqual(p, inventoryLayout(n, aspect));
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          assert.ok(
            Math.abs(p[i][0] - p[j][0]) >= 1.12 ||
              Math.abs(p[i][2] - p[j][2]) >= 1.12,
            'component cells intersect',
          );
    }
});
await test('explosion stage interpolation clamps boundaries and progresses monotonically', () => {
  assert.equal(smoothstep(0.2, 0.7, 0), 0);
  assert.equal(smoothstep(0.2, 0.7, 1), 1);
  let last = 0;
  for (let x = 0; x <= 100; x++) {
    const v = smoothstep(0.2, 0.7, x / 100);
    assert.ok(v >= last && v <= 1);
    last = v;
  }
});

await test('every scale sits on a finite path back to the machine, and each has something to render', () => {
  for (const id of levelIds) {
    const path = levelPath(id);
    assert.equal(path[0], rootLevel, id + ' does not descend from the machine');
    assert.equal(path.at(-1), id);
    assert.equal(new Set(path).size, path.length, 'cycle in path to ' + id);
    // A scale nobody can reach, or one with nothing on it, is a dead branch.
    assert.ok(
      manifest.some((c) => c.level === id),
      'no concept renders at ' + id,
    );
    // Every scale has to be reachable. Normally that means something on the
    // parent scale opens it. A scale marked `alternative` is a build the
    // machine does not use, so nothing in the case can open it and the
    // subsystem menu is the way in: it must declare one, directly or through
    // the branch it sits on.
    if (levels[id].parent && !levels[id].alternative)
      assert.ok(
        manifest.some((c) => c.open === id && c.level === levels[id].parent),
        'nothing on ' + levels[id].parent + ' opens ' + id,
      );
    if (levels[id].alternative) {
      assert.ok(
        branchRoot(id),
        id + ' is an alternative but sits under no subsystem menu',
      );
      assert.ok(
        !manifest.some((c) => c.open === id && c.level === levels[id].parent),
        id + ' is marked alternative but the machine still opens it',
      );
    }
  }
});

await test('descending is reversible: every scale names the concept it belongs to', () => {
  for (const id of levelIds) {
    const owner = byId[levels[id].concept];
    assert.ok(owner, 'scale ' + id + ' names a concept that does not exist');
    assert.ok(
      owner.open === id,
      'the concept for ' + id + ' does not open it',
    );
  }
  // The graphics branch still hangs off the machine, unchanged internally.
  assert.deepEqual(levelPath('card'), ['pc', 'card']);
  assert.equal(byId.card.parent, 'graphicscard');
  assert.equal(byId.graphicscard.open, 'card');
  assert.equal(byId.silicon.open, 'die');
});

await test('branching does not strand the viewer: back always reaches the machine', () => {
  for (const id of levelIds) {
    let cursor = id,
      steps = 0;
    while (cursor !== rootLevel && steps++ < levelIds.length)
      cursor = levelPath(cursor).at(-2)!;
    assert.equal(cursor, rootLevel, 'cannot walk back from ' + id);
  }
});

await test('searching for a part on another branch moves the viewer to that branch', () => {
  // A viewer deep inside the graphics card searching for RAM should end up on
  // the motherboard, with the memory system visible.
  const deep = { ...initialState, level: 'sm' as const, visible: [] };
  const found = selectSearch(deep, 'ram');
  assert.equal(found.level, 'motherboard');
  assert.equal(found.selection?.concept, 'ram');
  assert.ok(found.visible.includes('Memory'));
  assert.ok(found.explode > 0, 'a part inside a closed assembly must be exposed');
  // Scales themselves navigate rather than select.
  for (const id of ['pc', 'card', 'die']) {
    const root = selectSearch(deep, id);
    assert.equal(root.selection, null);
    assert.equal(root.explode, 0);
  }
});

await test('the disassembled machine occupies real depth and never overlaps itself', () => {
  // Mixed sizes, the way a machine actually is: a case panel next to a screw.
  const items = Array.from({ length: 60 }, (_, i) => {
    const s = i % 6 === 0 ? 6 : i % 3 === 0 ? 1.4 : 0.25;
    return { extent: [s, s * 0.35, s * 0.8] as Vec3, size: s };
  });
  for (const aspect of [0.5, 1, 1.8, 2.6]) {
    const laid = spatialInventory(items, aspect);
    assert.equal(laid.length, items.length);
    assert.deepEqual(laid, spatialInventory(items, aspect), 'must be deterministic');
    assert.ok(laid.every((c) => c.position.every(Number.isFinite)));
    // It has to be a volume, not a tray: more than one shelf height.
    assert.ok(
      new Set(laid.map((c) => c.position[1].toFixed(4))).size > 1,
      'inventory collapsed to a single plane',
    );
    for (let i = 0; i < laid.length; i++)
      for (let j = i + 1; j < laid.length; j++) {
        const a = laid[i],
          b = laid[j];
        const ax = items[i].extent[0] * a.scale,
          az = items[i].extent[2] * a.scale;
        const bx = items[j].extent[0] * b.scale,
          bz = items[j].extent[2] * b.scale;
        assert.ok(
          Math.abs(a.position[1] - b.position[1]) > 0.01 ||
            Math.abs(a.position[0] - b.position[0]) >= (ax + bx) / 2 ||
            Math.abs(a.position[2] - b.position[2]) >= (az + bz) / 2,
          'two parts occupy the same space',
        );
      }
  }
});

await test('scales that hold big assemblies push them further apart', () => {
  // The machine must separate by more than the card does, or its subsystems
  // stay visually stacked on top of each other.
  assert.ok((levels.pc.spread ?? 1) > (levels.card.spread ?? 1));
  assert.ok((levels.motherboard.spread ?? 1) > (levels.card.spread ?? 1));
  for (const id of levelIds) assert.ok((levels[id].spread ?? 1) >= 1);
});

await test('the inventory does not lose its smallest parts in empty space', () => {
  // The shape that broke: a handful of large parts and a crowd of tiny ones,
  // the way a real teardown ends up. A flat gap gave the tiny ones a moat
  // several times their own width, so the shelf was almost entirely air and a
  // part was a speck you had to hit exactly.
  const items = [
    ...Array.from({ length: 6 }, () => ({ extent: [7, 2, 5] as Vec3, size: 7 })),
    ...Array.from({ length: 30 }, () => ({
      extent: [1.4, 0.5, 1.1] as Vec3,
      size: 1.4,
    })),
    ...Array.from({ length: 180 }, () => ({
      extent: [0.1, 0.04, 0.08] as Vec3,
      size: 0.1,
    })),
  ];
  for (const aspect of [0.5, 1, 1.8, 2.6]) {
    const laid = spatialInventory(items, aspect);
    // How much of the space a part is given does the part actually fill?
    const covered = items.map((item, i) => {
      const drawn = item.extent[0] * laid[i].scale;
      const neighbour = laid
        .map((c, j) => ({ c, j }))
        .filter(
          ({ c, j }) =>
            j !== i && Math.abs(c.position[1] - laid[i].position[1]) < 0.01,
        )
        .reduce(
          (closest, { c }) =>
            Math.min(
              closest,
              Math.hypot(
                c.position[0] - laid[i].position[0],
                c.position[2] - laid[i].position[2],
              ),
            ),
          Infinity,
        );
      return drawn / neighbour;
    });
    const smallest = covered.slice(-180);
    const median = smallest.sort((a, b) => a - b)[Math.floor(smallest.length / 2)];
    assert.ok(
      median > 0.45,
      `small parts span only ${(median * 100).toFixed(0)}% of the distance to their nearest neighbour at aspect ${aspect}: they are lost in the gaps`,
    );
  }
});
