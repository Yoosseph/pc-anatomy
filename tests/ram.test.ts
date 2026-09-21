import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel, type Piece } from '../lib/models.ts';
import { byId, searchConcepts } from '../lib/manifest.ts';
import { initialState, selectSearch } from '../lib/explorer-state.ts';
import { branches, levelPath, levels, type LevelId } from '../lib/levels.ts';

// Same canvas stub as the model tests: geometry only, no WebGL.
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

const ramLevels: LevelId[] = ['dimm', 'dram', 'banks', 'bank'];
const models = new Map(ramLevels.map((l) => [l, buildModel(l)]));
const family = (level: LevelId, id: string) =>
  models.get(level)!.pieces.filter((p) => p.concept === id);

await test('the Memory menu holds the module-to-cell dive in order', () => {
  assert.deepEqual(
    branches().find((b) => b.label === 'Memory')?.levels,
    ramLevels,
  );
  assert.deepEqual(levelPath('dimm'), ['pc', 'motherboard', 'dimm']);
  assert.deepEqual(levelPath('bank'), [
    'pc',
    'motherboard',
    'dimm',
    'dram',
    'banks',
    'bank',
  ]);
});

await test('each dive step opens from a concept on its parent scale', () => {
  assert.equal(byId.ram.open, 'dimm');
  assert.equal(byId.ram.level, 'motherboard');
  assert.equal(byId.dramchip.open, 'dram');
  assert.equal(byId.dramchip.level, 'dimm');
  assert.equal(byId.dramdie.open, 'banks');
  assert.equal(byId.dramdie.level, 'dram');
  assert.equal(byId.drambank.open, 'bank');
  assert.equal(byId.drambank.level, 'banks');
  assert.equal(levels.dimm.branchLabel, 'Memory');
  assert.equal(levels.dimm.kind, 'physical');
  assert.equal(levels.dram.kind, 'physical');
  assert.equal(levels.banks.kind, 'logical');
  assert.equal(levels.bank.kind, 'logical');
});

await test('bank counts multiply out to the 16 Gb x8 organisation', () => {
  assert.equal(family('banks', 'drambank').length, 32);
  assert.equal(family('banks', 'dramio').length, 1);
  assert.equal(
    byId.drambank.specifications.Banks,
    '32 on 16 Gb or larger x8 die',
  );
  assert.equal(byId.drambank.specifications.Groups, '8 bank groups × 4 banks');
  assert.equal(family('bank', 'dramcell').length, 128);
  assert.equal(family('bank', 'dramrow').length, 16);
  assert.equal(family('bank', 'dramcolumn').length, 8);
  assert.equal(family('bank', 'dramrowdec').length, 1);
  assert.equal(family('bank', 'dramsenseamp').length, 1);
});

await test('RAM diagram blocks do not overlap one another', () => {
  for (const level of ramLevels.filter((l) => levels[l].kind === 'logical')) {
    const pieces = models.get(level)!.pieces;
    const footprint = (p: Piece) => ({
      x0: p.base.x + p.center.x - p.extent.x / 2,
      x1: p.base.x + p.center.x + p.extent.x / 2,
      z0: p.base.z + p.center.z - p.extent.z / 2,
      z1: p.base.z + p.center.z + p.extent.z / 2,
    });
    for (let i = 0; i < pieces.length; i++)
      for (let j = i + 1; j < pieces.length; j++) {
        const a = footprint(pieces[i]),
          b = footprint(pieces[j]);
        const overlap =
          Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0.01 &&
          Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0) > 0.01;
        assert.ok(
          !overlap,
          `${level}: ${pieces[i].key} overlaps ${pieces[j].key}`,
        );
      }
  }
});

await test('each bank group frame holds exactly four banks', () => {
  const banks = family('banks', 'drambank');
  assert.equal(banks.length, 32);
  for (let g = 0; g < 8; g++) {
    const gx = ((g % 4) - 1.5) * 2.7;
    const gz = g < 4 ? -1.9 : 1.1;
    const inside = banks.filter(
      (p) => Math.abs(p.base.x - gx) <= 1.28 && Math.abs(p.base.z - gz) <= 1.46,
    );
    assert.equal(inside.length, 4, `bank group ${g} holds ${inside.length}`);
  }
});

await test('the spreader clads the module but clears the contact field', () => {
  const spreaders = family('dimm', 'dimmspreader');
  assert.equal(spreaders.length, 1);
  const spreader = spreaders[0];
  // Brushed dark metal, not board green or bare plastic. (Same-finish
  // submeshes merge at build, so count the finish, then the assembly extent.)
  const dark = new T.Color('#202326').getHex();
  let clad = 0;
  spreader.object.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (
      mats.some(
        (m) => m instanceof T.MeshStandardMaterial && m.color.getHex() === dark,
      )
    )
      clad++;
  });
  assert.ok(clad >= 1, 'spreader must wear the dark finish');
  assert.ok(
    spreader.extent.x >= 128 / 6 && spreader.extent.y >= 4.6 / 6,
    'spreader assembly must span plates and caps',
  );
  // Plates stop above the contact field: the extruded profile runs z -10 to
  // 15 mm with a 0.6 mm bevel, so the real silhouette boundary is -10.6 mm —
  // clear of the key band and the finger rows — while spanning the chip row.
  const z0 = spreader.base.z + spreader.center.z - spreader.extent.z / 2;
  assert.ok(z0 > -10.7 / 6, 'spreader must clear the contact field');
  const x0 = spreader.base.x + spreader.center.x - spreader.extent.x / 2;
  const x1 = spreader.base.x + spreader.center.x + spreader.extent.x / 2;
  let chipX0 = Infinity,
    chipX1 = -Infinity;
  for (const chip of family('dimm', 'dramchip')) {
    chipX0 = Math.min(chipX0, chip.base.x + chip.center.x - chip.extent.x / 2);
    chipX1 = Math.max(chipX1, chip.base.x + chip.center.x + chip.extent.x / 2);
  }
  assert.ok(x0 <= chipX0 && x1 >= chipX1, 'spreader must span the chip row');
});

await test('the thermal pads seat between chip tops and plate', () => {
  // Pads are the '#2a2d30' meshes inside the spreader group: bottom faces
  // touch the 2.0 mm chip tops without entering the bodies, tops meet the
  // 2.05 mm plate underside. Both bounds use >= with epsilon.
  const pad = new T.Color('#2a2d30').getHex();
  const eps = 0.001;
  let found = 0;
  family('dimm', 'dimmspreader')[0].object.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (
      !mats.some(
        (m) => m instanceof T.MeshStandardMaterial && m.color.getHex() === pad,
      )
    )
      return;
    found++;
    o.updateWorldMatrix(true, false);
    o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox!.clone().applyMatrix4(o.matrixWorld);
    // Spreader group sits at the origin, so world units are group units.
    assert.ok(
      bb.min.y >= 2.0 / 6 - eps,
      'pad enters the chip bodies below 2.0 mm',
    );
    assert.ok(
      bb.max.y >= 2.05 / 6 - eps,
      'pad stops short of the plate underside',
    );
  });
  assert.ok(found > 0, 'no thermal pads drawn');
});

await test('the module keeps the DDR5 outline with a keyed contact edge', () => {
  const f = (id: string) => family('dimm', id);
  assert.equal(f('dimmboard').length, 1);
  assert.equal(f('dramchip').length, 8);
  assert.equal(f('dimmpmic').length, 1);
  assert.equal(f('dimmspd').length, 1);
  assert.equal(f('dimmcontacts').length, 1);
  const board = f('dimmboard')[0];
  assert.ok(
    Math.abs(board.base.x + board.center.x) + board.extent.x / 2 <=
      133.35 / 6 + 0.05,
    'module exceeds the 133.35 mm DDR5 length',
  );
  for (const chip of f('dramchip')) {
    const outerX = Math.abs(chip.base.x + chip.center.x) + chip.extent.x / 2;
    assert.ok(outerX <= 133.35 / 6 / 2 + 0.05, chip.key + ' leaves the board');
  }
  // The key cutout is real geometry: across the full keyed edge band
  // (x in [-7, 1] mm, z below -12 mm) there are no vertices at all — no
  // board, no backing strip, no finger. (Submeshes sharing a material are
  // merged at build, so read the baked geometry rather than individual
  // meshes, skipping label planes.)
  const keyPieces = [f('dimmboard')[0], f('dimmcontacts')[0]];
  const inBand: number[] = [];
  for (const piece of keyPieces)
    piece.object.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      if (o.material instanceof T.MeshBasicMaterial) return;
      const pos = o.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++)
        if (pos.getZ(i) < -12 / 6 - 0.05) inBand.push(pos.getX(i));
    });
  assert.ok(inBand.length > 0, 'no keyed-edge geometry drawn at all');
  assert.ok(
    inBand.every((x) => x <= -7 / 6 + 0.001 || x >= 1 / 6 - 0.001),
    'geometry spans the key cutout',
  );
  assert.ok(
    inBand.some((x) => x < -7 / 6) && inBand.some((x) => x >= 1 / 6),
    'contacts must flank the key on both sides',
  );
  // 288 pins: 144 gold fingers per face at 0.8 mm pitch. Fingers are the
  // only gold meshes, so snap every baked gold vertex to its finger column
  // on the pitch grid: 72 per field, both faces sharing each column.
  const gold = new T.Color('#d5b96b').getHex();
  const columns = new Set<string>();
  let goldYMin = Infinity,
    goldYMax = -Infinity,
    goldCount = 0;
  f('dimmcontacts')[0].object.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (
      !mats.some(
        (m) => m instanceof T.MeshStandardMaterial && m.color.getHex() === gold,
      )
    )
      return;
    const pos = o.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      goldCount++;
      const x = pos.getX(i);
      goldYMin = Math.min(goldYMin, pos.getY(i));
      goldYMax = Math.max(goldYMax, pos.getY(i));
      // Finger centers sit exactly on the grid; edges deviate by under a
      // third of a pitch step, so rounding lands every vertex correctly.
      const idx =
        x < -1
          ? Math.round((x + 64.55 / 6) / (0.8 / 6))
          : Math.round((x - 1.75 / 6) / (0.8 / 6));
      columns.add((x < -1 ? 'L' : 'R') + idx);
    }
  });
  assert.ok(goldCount > 0, 'no contact fingers drawn');
  assert.equal(columns.size, 144);
  for (const key of columns) {
    const n = Number(key.slice(1));
    assert.ok(n >= 0 && n < 72, key + ' is off the finger grid');
  }
  assert.ok(goldYMin < 0 && goldYMax > 0, 'fingers must sit on both faces');
  // Surface clearance: the 1.27 mm board slab reaches |y| = 0.635 mm, so no
  // gold vertex may lie inside it — fingers sit on the faces, not in the board.
  const slab = 0.635 / 6 - 0.001;
  f('dimmcontacts')[0].object.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (
      !mats.some(
        (m) => m instanceof T.MeshStandardMaterial && m.color.getHex() === gold,
      )
    )
      return;
    const pos = o.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++)
      assert.ok(
        Math.abs(pos.getY(i)) >= slab,
        'a gold finger is embedded in the board',
      );
  });
});

await test('the package scale shows substrate, die and balls', () => {
  const f = (id: string) => family('dram', id);
  assert.equal(f('dramsubstrate').length, 1);
  assert.equal(f('dramdie').length, 1);
  assert.ok(f('dramball').length > 40, 'ball grid is too sparse');
  const die = f('dramdie')[0];
  const substrate = f('dramsubstrate')[0];
  assert.ok(
    die.base.y > substrate.base.y,
    'the die must sit above the substrate',
  );
  for (const ball of f('dramball'))
    assert.ok(
      ball.base.y < substrate.base.y,
      'balls must sit beneath the substrate',
    );
});

await test('every new piece belongs to a named concept', () => {
  for (const level of ramLevels) {
    const { pieces, root } = models.get(level)!;
    assert.ok(pieces.length > 0, level + ' renders nothing');
    const owned = new Set<T.Object3D>();
    for (const p of pieces) p.object.traverse((o) => owned.add(o));
    for (const child of root.children) {
      if (child.userData.contextFrame) continue;
      assert.ok(
        owned.has(child) || child instanceof T.InstancedMesh,
        `${level}: an object is rendered but belongs to no named part`,
      );
    }
    for (const p of pieces)
      assert.ok(byId[p.concept]?.shortName, `${level}: ${p.concept} unnamed`);
  }
});

await test('search reaches the module and the cell array at their own scales', () => {
  assert.ok(searchConcepts('dram').some((c) => c.id === 'dramchip'));
  assert.ok(searchConcepts('cell').some((c) => c.id === 'dramcell'));
  assert.equal(selectSearch(initialState, 'dramchip').level, 'dimm');
  assert.equal(selectSearch(initialState, 'dramcell').level, 'bank');
  assert.equal(selectSearch(initialState, 'drambank').level, 'banks');
  // The motherboard search for RAM still lands on the installed module.
  const found = selectSearch(
    { ...initialState, level: 'sm' as const, visible: [] },
    'ram',
  );
  assert.equal(found.level, 'motherboard');
  assert.equal(found.selection?.concept, 'ram');
});
