import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel, type Piece } from '../lib/models.ts';
import { byId, manifest, searchConcepts } from '../lib/manifest.ts';
import { initialState, selectSearch } from '../lib/explorer-state.ts';
import { branches, levelPath, levels, type LevelId } from '../lib/levels.ts';
import {
  chipCenters,
  contactPositions,
  edgeBottom,
  generations,
  keyCenter,
  MODULE,
  type Generation,
} from '../lib/memory-module.ts';
import { FBGA, packageIds, STACK } from '../lib/dram-package.ts';

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

const ddr5Levels: LevelId[] = ['dimm', 'dram', 'banks', 'bank', 'cell'];
const ddr4Levels: LevelId[] = ['ddr4', 'ddr4dram', 'ddr4banks'];
const ramLevels = [...ddr5Levels, ...ddr4Levels];
const models = new Map(ramLevels.map((l) => [l, buildModel(l)]));
const motherboard = buildModel('motherboard');
const family = (level: LevelId, id: string) =>
  models.get(level)!.pieces.filter((p) => p.concept === id);
const moduleLevel: Record<Generation, LevelId> = { ddr5: 'dimm', ddr4: 'ddr4' };
const packageLevel: Record<Generation, LevelId> = {
  ddr5: 'dram',
  ddr4: 'ddr4dram',
};
const U = 1 / 6; // module scene units per millimetre

/** World-space bounds of a piece at its assembled position. */
function bounds(p: Piece) {
  p.object.position.copy(p.base);
  p.object.updateMatrixWorld(true);
  const box = new T.Box3();
  p.object.traverse((o) => {
    if (!(o instanceof T.Mesh) || o.material instanceof T.MeshBasicMaterial)
      return;
    if (o instanceof T.InstancedMesh) {
      const m = new T.Matrix4();
      o.geometry.computeBoundingBox();
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m);
        box.union(
          o.geometry
            .boundingBox!.clone()
            .applyMatrix4(m)
            .applyMatrix4(o.matrixWorld),
        );
      }
    } else box.expandByObject(o);
  });
  return box;
}

/** Instanced pieces carry their own extent rather than a mesh of their own. */
const footprint = (p: Piece) =>
  p.batch ? new T.Box3().setFromCenterAndSize(p.base, p.extent) : bounds(p);

// ── Navigation ──────────────────────────────────────────────────────────────

await test('the Memory menu holds both generations, each in its own dropdown', () => {
  const memory = branches().find((b) => b.label === 'Memory')!;
  assert.deepEqual(
    memory.submenus.map((s) => s.label),
    ['DDR5 · FURY Beast', 'DDR4 · FURY Beast'],
  );
  assert.deepEqual(memory.submenus[0].levels, ddr5Levels);
  assert.deepEqual(memory.submenus[1].levels, ddr4Levels);
  assert.deepEqual(levelPath('cell'), [
    'pc',
    'motherboard',
    'dimm',
    'dram',
    'banks',
    'bank',
    'cell',
  ]);
  assert.deepEqual(levelPath('ddr4banks'), [
    'pc',
    'motherboard',
    'ddr4',
    'ddr4dram',
    'ddr4banks',
  ]);
  // The board carries DDR5; DDR4 is a real alternative it cannot take.
  assert.equal(levels.ddr4.alternative, true);
  assert.notEqual(levels.dimm.alternative, true);
});

await test('each dive step opens from a concept on the scale above it', () => {
  const chain: [string, LevelId, LevelId][] = [
    ['ram', 'motherboard', 'dimm'],
    ['dramchip', 'dimm', 'dram'],
    ['dramdie', 'dram', 'banks'],
    ['drambank', 'banks', 'bank'],
    ['drammat', 'bank', 'cell'],
    ['ddr4chip', 'ddr4', 'ddr4dram'],
    ['ddr4die', 'ddr4dram', 'ddr4banks'],
  ];
  for (const [id, at, opens] of chain) {
    assert.equal(byId[id].level, at, id);
    assert.equal(byId[id].open, opens, id);
    assert.equal(levels[opens].concept, id, opens);
    // The concept that opens a scale is drawn on the scale above it.
    if (at !== 'motherboard')
      assert.ok(family(at, id).length > 0, `${id} is not drawn at ${at}`);
  }
  assert.equal(byId.ddr4module.open, 'ddr4');
});

await test('the RAM dive is as deep and as full as the graphics card dive', () => {
  const count = (scales: LevelId[]) =>
    manifest.filter((c) => scales.includes(c.level)).length;
  assert.ok(ddr5Levels.length >= 5, 'five scales, like the RTX 5090 chain');
  for (const level of ramLevels)
    assert.ok(
      new Set(models.get(level)!.pieces.map((p) => p.concept)).size >= 8,
      `${level} draws fewer than eight distinct parts`,
    );
  assert.ok(count(ddr5Levels) >= 45, 'the DDR5 catalogue is too thin');
});

// ── Organisation arithmetic ─────────────────────────────────────────────────

await test('bank, row and page counts multiply out to 16 Gb on both dies', () => {
  const dies = [
    ['banks', 'drambank', 'drambankgroup', 32, 8, 65536],
    ['ddr4banks', 'ddr4bank', 'ddr4bankgroup', 16, 4, 131072],
  ] as const;
  for (const [level, bank, group, banks, groups, rows] of dies) {
    assert.equal(family(level, bank).length, banks);
    assert.equal(family(level, group).length, groups);
    const spec = byId[bank].specifications;
    assert.match(spec.Banks, new RegExp(`^${banks} `));
    assert.equal(spec.Groups, `${groups} bank groups × 4 banks`);
    assert.match(spec.Rows, new RegExp(rows.toLocaleString('en-US')));
    const pageBits = 1024 * 8;
    assert.equal(
      banks * rows * pageBits,
      16 * 2 ** 30,
      `${level} is not 16 Gb`,
    );
    // Eight x8 packages of 16 Gb make the 16 GB module.
    assert.equal((8 * 16 * 2 ** 30) / 8, 16 * 2 ** 30);
  }
  // A burst fills one 64-byte cache line on both generations.
  assert.equal((32 * 16) / 8, 64); // DDR5: 32-bit subchannel × BL16
  assert.equal((64 * 8) / 8, 64); // DDR4: 64-bit channel × BL8
});

await test('each bank group owns exactly four banks, on its own side of the stripe', () => {
  for (const [level, bank, group] of [
    ['banks', 'drambank', 'drambankgroup'],
    ['ddr4banks', 'ddr4bank', 'ddr4bankgroup'],
  ] as const) {
    const banks = family(level, bank);
    for (const g of family(level, group)) {
      const gb = footprint(g);
      const mine = banks.filter(
        (b) =>
          b.base.x > gb.min.x &&
          b.base.x < gb.max.x &&
          Math.sign(b.base.z) === Math.sign(g.base.z),
      );
      assert.equal(mine.length, 4, `${level}: ${g.key} owns ${mine.length}`);
    }
  }
});

await test('DDR5 adds on-die ECC; DDR4 keeps a DLL', () => {
  assert.equal(family('banks', 'dramecc').length, 1);
  assert.equal(family('ddr4banks', 'ddr4dll').length, 1);
  assert.ok(!byId.ddr4ecc);
  assert.equal(byId.dramecc.specifications.Code, '128 data + 8 check bits');
});

await test('diagram parts never occupy the same space', () => {
  for (const level of ramLevels.filter((l) => levels[l].kind === 'logical')) {
    const pieces = models.get(level)!.pieces;
    const boxes = pieces.map(footprint);
    for (let i = 0; i < pieces.length; i++)
      for (let j = i + 1; j < pieces.length; j++) {
        const overlap = boxes[i].clone().intersect(boxes[j]);
        const size = overlap.getSize(new T.Vector3());
        const solid =
          !overlap.isEmpty() && size.x > 0.01 && size.y > 0.01 && size.z > 0.01;
        assert.ok(
          !solid,
          `${level}: ${pieces[i].key} overlaps ${pieces[j].key}`,
        );
      }
  }
});

// ── The module ──────────────────────────────────────────────────────────────

await test('both modules keep the JEDEC outline and the data sheet envelope', () => {
  for (const gen of ['ddr5', 'ddr4'] as const) {
    const level = moduleLevel[gen];
    const { ids, outerHeight, outerThickness } = generations[gen];
    const board = bounds(family(level, ids.board)[0]);
    const size = board.getSize(new T.Vector3());
    assert.ok(Math.abs(size.x - MODULE.length * U) < 0.01, `${gen} length`);
    assert.ok(Math.abs(size.z - MODULE.height * U) < 0.02, `${gen} height`);
    assert.ok(Math.abs(size.y - MODULE.thickness * U) < 0.01, `${gen} board`);
    const all = new T.Box3();
    for (const p of models.get(level)!.pieces) all.union(bounds(p));
    const outer = all.getSize(new T.Vector3());
    assert.ok(
      Math.abs(outer.z - outerHeight * U) < 0.15 * U + 0.01,
      `${gen} height with spreader is ${outer.z / U} mm`,
    );
    assert.ok(
      Math.abs(outer.y - outerThickness * U) < 0.1 * U + 0.01,
      `${gen} thickness with spreader is ${outer.y / U} mm`,
    );
    assert.equal(family(level, ids.chip).length, 8);
  }
});

await test('288 contacts at 0.85 mm pitch, 144 per face, none across the key', () => {
  for (const gen of ['ddr5', 'ddr4'] as const) {
    const xs = contactPositions(gen);
    assert.equal(xs.length, 144);
    for (let i = 1; i < xs.length; i++) {
      const step = xs[i] - xs[i - 1];
      assert.ok(
        Math.abs(step - MODULE.pitch) < 1e-9 ||
          Math.abs(step - MODULE.keyGap) < 1e-9,
        `${gen}: contact ${i} is off pitch`,
      );
    }
    // Equal margins at both ends.
    assert.ok(Math.abs(xs[0] + xs[143]) < 1e-9, `${gen} is lopsided`);
    const k = keyCenter(gen);
    assert.ok(
      xs.every((x) => Math.abs(x - k) >= MODULE.keyWidth / 2 + 0.3),
      `${gen}: a contact runs into the key`,
    );
    const contacts = family(moduleLevel[gen], generations[gen].ids.contacts)[0];
    const fingers = contacts.object.userData.fingers as T.InstancedMesh;
    assert.equal(fingers.count, 288);
  }
});

await test('the key is a real cut, and the generations key in different places', () => {
  const gap = Math.abs(keyCenter('ddr5') - keyCenter('ddr4'));
  assert.ok(gap > MODULE.keyWidth, 'a DDR4 module would drop into a DDR5 slot');
  for (const gen of ['ddr5', 'ddr4'] as const) {
    const level = moduleLevel[gen];
    const { ids } = generations[gen];
    const k = keyCenter(gen) * U;
    const z = (edgeBottom(gen, keyCenter(gen)) + 1.5) * U;
    for (const piece of models.get(level)!.pieces) {
      piece.object.position.copy(piece.base);
      piece.object.updateMatrixWorld(true);
    }
    const ray = (x: number) =>
      new T.Raycaster(new T.Vector3(x, 5, z), new T.Vector3(0, -1, 0))
        .intersectObjects(
          [ids.board, ids.contacts].map((id) => family(level, id)[0].object),
          true,
        )
        .filter(
          (h) =>
            !(h.object as T.Mesh).isMesh ||
            !((h.object as T.Mesh).material instanceof T.MeshBasicMaterial),
        );
    assert.equal(ray(k).length, 0, `${gen}: the key is filled`);
    assert.ok(
      ray(k + 3 * U).length > 0,
      `${gen}: the board beside the key is missing`,
    );
  }
});

await test('DDR4 bows its contact edge; DDR5 keeps it straight', () => {
  const ends = (gen: Generation) =>
    edgeBottom(gen, MODULE.length / 2) - edgeBottom(gen, 0);
  assert.equal(ends('ddr5'), 0);
  assert.ok(ends('ddr4') >= 0.4, 'the DDR4 edge must rise toward its ends');
  // The fingers follow the edge they sit on.
  const fingers = family('ddr4', 'ddr4contacts')[0].object.userData
    .fingers as T.InstancedMesh;
  const m = new T.Matrix4();
  const z = (i: number) => {
    fingers.getMatrixAt(i, m);
    return new T.Vector3().setFromMatrixPosition(m).z;
  };
  assert.ok(
    z(0) > z(72) + 0.3 * U,
    'end fingers must sit higher than middle ones',
  );
});

await test('DDR5 regulates on the module; DDR4 terminates its fly-by bus there instead', () => {
  assert.equal(family('dimm', 'dimmpmic').length, 1);
  assert.equal(family('dimm', 'dimminductor').length, 1);
  assert.equal(family('ddr4', 'ddr4term').length, 1);
  assert.ok(
    !models.get('ddr4')!.pieces.some((p) => /pmic|inductor/.test(p.concept)),
  );
  assert.ok(
    !models.get('dimm')!.pieces.some((p) => p.concept.includes('term')),
  );
  // The regulator sits in the gap at the centre of the chip row.
  const pmic = bounds(family('dimm', 'dimmpmic')[0]);
  const inner = Math.min(...chipCenters.map(Math.abs)) - 7.5 / 2;
  assert.ok(pmic.max.x < inner * U && pmic.min.x > -inner * U);
});

await test('components stay on the board, off each other and above the contacts', () => {
  for (const gen of ['ddr5', 'ddr4'] as const) {
    const level = moduleLevel[gen];
    const { ids } = generations[gen];
    const skip = new Set<string>([
      ids.board,
      ids.contacts,
      ids.pad,
      ids.spreaderFront,
      ids.spreaderBack,
      ids.decap,
    ]);
    const parts = models.get(level)!.pieces.filter((p) => !skip.has(p.concept));
    const top = MODULE.thickness / 2;
    // Mesh by mesh, so a part spread over the board (the inductors) is not
    // mistaken for one block covering whatever sits between its pieces.
    const solids: { key: string; box: T.Box3 }[] = [];
    for (const p of parts) {
      p.object.position.copy(p.base);
      p.object.updateMatrixWorld(true);
      p.object.traverse((o) => {
        if (
          o instanceof T.Mesh &&
          !(o.material instanceof T.MeshBasicMaterial) &&
          !(o instanceof T.InstancedMesh)
        ) {
          const pos = o.geometry.getAttribute('position');
          // Merged meshes hold several parts: split them back by connectivity
          // is overkill here, so take each merged mesh's unmerged children
          // where they exist and the whole mesh otherwise.
          const box = new T.Box3()
            .setFromBufferAttribute(pos as T.BufferAttribute)
            .applyMatrix4(o.matrixWorld);
          solids.push({ key: p.key, box });
        }
      });
    }
    for (const p of parts) {
      const b = bounds(p);
      assert.ok(b.min.y >= top * U - 1e-3, `${p.key} sinks into the board`);
      assert.ok(
        Math.abs(b.max.x) <= (MODULE.length / 2) * U,
        `${p.key} leaves the board`,
      );
      assert.ok(
        b.min.z > (-MODULE.height / 2 + MODULE.fingerHeight + 1) * U,
        `${p.key} sits on the contact field`,
      );
    }
    const chips = parts.filter((p) => p.concept === ids.chip).map(bounds);
    for (const s of solids)
      for (const [i, chip] of chips.entries()) {
        if (s.key === family(level, ids.chip)[i].key) continue;
        const o = s.box.clone().intersect(chip).getSize(new T.Vector3());
        assert.ok(
          s.box.clone().intersect(chip).isEmpty() || o.x < 1e-3 || o.z < 1e-3,
          `${s.key} overlaps a package`,
        );
      }
  }
});

await test('the spreader clears the contacts and seats on its pads', () => {
  for (const gen of ['ddr5', 'ddr4'] as const) {
    const level = moduleLevel[gen];
    const { ids } = generations[gen];
    for (const id of [ids.spreaderFront, ids.spreaderBack]) {
      const plate = bounds(family(level, id)[0]);
      assert.ok(
        plate.min.z > (-MODULE.height / 2 + MODULE.fingerHeight + 1) * U,
        `${gen}: ${id} covers the contacts`,
      );
      assert.ok(
        byId[id].opensFirst,
        `${id} must come off before the chips move`,
      );
    }
    // Pad on the package tops, plate on the pad: touching, not overlapping.
    const chipTop = Math.max(
      ...family(level, ids.chip).map((c) => bounds(c).max.y),
    );
    const pad = bounds(family(level, ids.pad)[0]);
    const front = bounds(family(level, ids.spreaderFront)[0]);
    assert.ok(pad.max.y <= front.max.y);
    // The front pad strips start exactly at the package tops. Same-material
    // meshes merge at build, so read the baked vertices.
    let lowest = Infinity;
    family(level, ids.pad)[0].object.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      const pos = o.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++)
        if (pos.getY(i) > 0)
          lowest = Math.min(lowest, pos.getY(i) + o.position.y);
    });
    assert.ok(
      Math.abs(lowest - chipTop) < 0.03 * U,
      `${gen}: pad floats above the packages`,
    );
  }
});

await test('the motherboard carries the complete DDR5 module in each populated slot', () => {
  const ram = motherboard.pieces.filter((p) => p.concept === 'ram');
  assert.equal(ram.length, 2);
  for (const installed of ram) {
    let fingers = 0;
    installed.object.traverse((o) => {
      if (o instanceof T.InstancedMesh && o.count === 288) fingers++;
    });
    assert.equal(fingers, 1, 'the installed module is not the detailed one');
    const b = bounds(installed).getSize(new T.Vector3());
    // Standing up: 133 mm along the slot, 34.9 mm tall, at 1/22 scale.
    assert.ok(Math.abs(b.z - MODULE.length / 22) < 0.05);
    assert.ok(Math.abs(b.y - generations.ddr5.outerHeight / 22) < 0.05);
  }
});

// ── The package ─────────────────────────────────────────────────────────────

await test('78 balls: 13 rows of 3 + 3 at 0.8 mm, centre columns empty', () => {
  for (const gen of ['ddr5', 'ddr4'] as const) {
    const ids = packageIds[gen];
    const balls = family(packageLevel[gen], ids.ball);
    assert.equal(balls.length, 78);
    const xs = [...new Set(balls.map((b) => b.base.x.toFixed(3)))].map(Number);
    assert.equal(xs.length, 6);
    assert.ok(
      xs.every((x) => Math.abs(x) >= 1.6 - 1e-6),
      'a ball sits in the centre columns',
    );
    const zs = [...new Set(balls.map((b) => b.base.z.toFixed(3)))]
      .map(Number)
      .sort((a, b) => a - b);
    assert.equal(zs.length, 13);
    for (let i = 1; i < zs.length; i++)
      assert.ok(Math.abs(zs[i] - zs[i - 1] - FBGA.pitch) < 1e-3);
    // The grid fits the published 7.5 × 11 mm body.
    assert.ok(Math.max(...xs) + FBGA.ballDiameter / 2 < FBGA.body[0] / 2);
    assert.ok(Math.max(...zs) + FBGA.ballDiameter / 2 < FBGA.body[1] / 2);
  }
});

await test('the package stacks balls, substrate, die and mold in order, die face down over the slot', () => {
  for (const gen of ['ddr5', 'ddr4'] as const) {
    const level = packageLevel[gen];
    const ids = packageIds[gen];
    const b = (id: string) => bounds(family(level, id)[0]);
    const substrate = b(ids.substrate);
    const die = b(ids.die);
    const mold = b(ids.mold);
    const encap = b(ids.encap);
    const ballBottom = Math.min(
      ...family(level, ids.ball).map((p) => p.base.y - p.extent.y / 2),
    );
    assert.ok(
      ballBottom < encap.min.y,
      'the encapsulant bead would hold the package off the board',
    );
    assert.ok(die.min.y >= substrate.max.y - 1e-6, 'die below the substrate');
    assert.ok(mold.max.y > die.max.y, 'the mold must cover the die');
    // The bead fits between the ball columns.
    assert.ok(encap.max.x < 1.6 - FBGA.ballDiameter / 2);
    // Every pad lies over the slot, and every wire passes through it.
    for (const pad of family(level, ids.pads))
      assert.ok(Math.abs(pad.base.x) < FBGA.slot, 'a pad is not over the slot');
    const wires = family(level, ids.wire)[0].object;
    wires.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      const pos = o.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / 2.5;
        if (y > 0.02 && y < STACK.substrate - 0.02)
          assert.ok(
            Math.abs(pos.getX(i)) < FBGA.slot,
            'a wire passes through the substrate',
          );
      }
    });
  }
});

// ── The whole dive ──────────────────────────────────────────────────────────

await test('every rendered object on the memory scales belongs to a named part', () => {
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

await test('search reaches every memory scale at its own depth', () => {
  assert.equal(selectSearch(initialState, 'dramchip').level, 'dimm');
  assert.equal(selectSearch(initialState, 'dramball').level, 'dram');
  assert.equal(selectSearch(initialState, 'drambank').level, 'banks');
  assert.equal(selectSearch(initialState, 'drammat').level, 'bank');
  assert.equal(selectSearch(initialState, 'dramcapacitor').level, 'cell');
  assert.equal(selectSearch(initialState, 'ddr4term').level, 'ddr4');
  assert.equal(selectSearch(initialState, 'ddr4dll').level, 'ddr4banks');
  assert.ok(searchConcepts('ddr4').some((c) => c.id === 'ddr4module'));
  assert.ok(searchConcepts('capacitor').some((c) => c.id === 'dramcapacitor'));
  const found = selectSearch(
    { ...initialState, level: 'sm' as const, visible: [] },
    'ram',
  );
  assert.equal(found.level, 'motherboard');
  assert.equal(found.selection?.concept, 'ram');
});
