import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel, type Piece } from '../lib/models.ts';
import { byId, searchConcepts } from '../lib/manifest.ts';
import { initialState, selectSearch } from '../lib/explorer-state.ts';
import { branches, levelPath, levels, type LevelId } from '../lib/levels.ts';
import { MM } from '../lib/card-kit.ts';

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

const gpuLevels: LevelId[] = [
  'rx9070',
  'navi48',
  'rxse',
  'rxwgp',
  'rxcu',
  'arcb580',
  'bmg',
  'xeslice',
  'xecore',
  'xve',
];
const models = new Map(gpuLevels.map((l) => [l, buildModel(l)]));
const family = (level: LevelId, id: string) =>
  models.get(level)!.pieces.filter((p) => p.concept === id);
const top = (p: Piece) => p.base.y + p.center.y + p.extent.y / 2;
const bottom = (p: Piece) => p.base.y + p.center.y - p.extent.y / 2;

await test('the GPU menu holds three cards, each in its own dropdown', () => {
  const gpu = branches().find((b) => b.label === 'GPU')!;
  assert.deepEqual(
    gpu.submenus.map((s) => s.label),
    ['RTX 5090', 'RX 9070 XT', 'Arc B580'],
  );
  assert.deepEqual(gpu.submenus[0].levels, ['card', 'die', 'gpc', 'tpc', 'sm']);
  assert.deepEqual(gpu.submenus[1].levels, [
    'rx9070',
    'navi48',
    'rxse',
    'rxwgp',
    'rxcu',
  ]);
  assert.deepEqual(gpu.submenus[2].levels, [
    'arcb580',
    'bmg',
    'xeslice',
    'xecore',
    'xve',
  ]);
  // Every GPU scale is in exactly one dropdown. Memory has its own two
  // generations; no other menu grows one.
  const listed = gpu.submenus.flatMap((s) => s.levels);
  assert.deepEqual([...listed].sort(), [...gpu.levels].sort());
  assert.equal(new Set(listed).size, listed.length);
  for (const b of branches().filter(
    (b) => b.label !== 'GPU' && b.label !== 'Memory',
  ))
    assert.equal(b.submenus.length, 0, b.label);
});

await test('the new cards are extra cards, not replacements for the installed 5090', () => {
  assert.equal(byId.graphicscard.open, 'card');
  assert.deepEqual(levelPath('rxcu'), [
    'pc',
    'rx9070',
    'navi48',
    'rxse',
    'rxwgp',
    'rxcu',
  ]);
  assert.deepEqual(levelPath('xve'), [
    'pc',
    'arcb580',
    'bmg',
    'xeslice',
    'xecore',
    'xve',
  ]);
  for (const id of ['rx9070', 'arcb580'] as const) {
    assert.equal(levels[id].alternative, true);
    assert.equal(levels[id].branchLabel, 'GPU');
  }
  // Each card opens its own chip from both the package and the bare die.
  assert.equal(byId.rxpackage.open, 'navi48');
  assert.equal(byId.rxsilicon.open, 'navi48');
  assert.equal(byId.arcpackage.open, 'bmg');
  assert.equal(byId.arcsilicon.open, 'bmg');
});

await test('published hierarchy counts multiply out to the published totals', () => {
  const n = (s: string) => Number(s.replace(/,/g, ''));
  const rx = byId.rxgpu.specifications;
  assert.equal(n(rx['Shader engines']) * 8, n(rx.WGPs));
  assert.equal(n(rx.WGPs) * 2, n(rx['Compute units']));
  assert.equal(n(rx['Compute units']) * 64, n(rx['Stream processors']));
  assert.equal(n(rx['Compute units']) * 2, n(rx['AI accelerators']));
  assert.equal(byId.rxgddr6.specifications.Bandwidth, '640 GB/s');
  const arc = byId.arcgpu.specifications;
  assert.equal(n(arc['Render slices']) * 4, n(arc['Xe-cores']));
  assert.equal(n(arc['Xe-cores']) * 8, n(arc['Vector engines']));
  assert.equal(n(arc['Vector engines']), n(arc['XMX engines']));
  assert.equal(n(arc['Xe-cores']), n(arc['Ray tracing units']));
  assert.equal(byId.arcgddr6.specifications.Bandwidth, '456 GB/s');
});

await test('each diagram draws the counts its parent claims', () => {
  assert.equal(family('navi48', 'rxse').length, 4);
  assert.equal(family('navi48', 'rxmemctl').length, 4);
  assert.equal(family('navi48', 'rxinfinity').length, 4);
  assert.equal(family('navi48', 'rxmedia').length, 2);
  assert.equal(family('rxse', 'rxwgp').length, 8);
  assert.equal(family('rxse', 'rxrb').length, 2);
  assert.equal(family('rxse', 'rxra').length, 4);
  assert.equal(family('rxwgp', 'rxcu').length, 2);
  assert.equal(family('rxcu', 'rxmatrix').length, 2);
  assert.equal(family('rxcu', 'rxray').length, 1);
  assert.equal(family('bmg', 'xeslice').length, 5);
  assert.equal(family('bmg', 'arcmfx').length, 2);
  assert.equal(family('xeslice', 'xecore').length, 4);
  assert.equal(family('xeslice', 'arcsampler').length, 4);
  assert.equal(family('xeslice', 'arcpixel').length, 2);
  assert.equal(family('xecore', 'xve').length, 8);
  assert.equal(family('xecore', 'arcrtu').length, 1);
  assert.equal(family('xve', 'arcalu').length, 16);
  assert.equal(family('xve', 'arcthread').length, 8);
});

await test('diagram blocks do not overlap one another on the drawing plane', () => {
  for (const level of gpuLevels.filter((l) => levels[l].kind === 'logical')) {
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

await test('NITRO+ RX 9070 XT carries its published construction', () => {
  const f = (id: string) => family('rx9070', id);
  assert.equal(f('rxfan').length, 3);
  assert.equal(f('rxfanmotor').length, 3);
  assert.equal(f('rxheatpipe').length, 6);
  assert.equal(f('rxgddr6').length, 8);
  assert.equal(f('rxvrm').length, 16);
  assert.equal(f('rxpowerstage').length, 16);
  assert.equal(f('rxpwm').length, 2);
  assert.equal(f('rxdisplayport').length, 2);
  assert.equal(f('rxhdmi').length, 2);
  assert.equal(f('rxpower').length, 1);
  assert.equal(f('rxmagnet').length, 6);
  assert.equal(f('rxbackplate').length, 1);
  assert.equal(f('rxheatsink').length, 1);
  f('rxfan').forEach((fan, i) =>
    assert.ok(Math.abs(fan.base.x - f('rxfanmotor')[i].base.x) < 1e-6),
  );
  // The power socket is on the back of the board, not the fan side.
  assert.ok(
    top(f('rxpower')[0]) < 0,
    '12V-2x6 must sit on the rear of the PCB',
  );
  const finTop = top(f('rxheatsink')[0]);
  for (const fan of f('rxfan'))
    assert.ok(bottom(fan) > finTop, 'fans must clear the fins');
});

await test('Arc B580 Limited Edition carries its published construction', () => {
  const f = (id: string) => family('arcb580', id);
  assert.equal(f('arcfan').length, 2);
  assert.equal(f('arcfanmotor').length, 2);
  assert.equal(f('archeatpipe').length, 4);
  assert.equal(f('arcgddr6').length, 6);
  assert.equal(f('arcvrm').length, 8);
  assert.equal(f('arcdisplayport').length, 3);
  assert.equal(f('archdmi').length, 1);
  assert.equal(f('arcpower').length, 1);
  // A short board: the second fan sits entirely past its end.
  const pcb = f('arcpcb')[0];
  const boardEnd = pcb.base.x + pcb.center.x + pcb.extent.x / 2;
  const outer = f('arcfan')[1];
  assert.ok(
    outer.base.x - outer.extent.x / 2 > boardEnd,
    'flow-through fan must clear the PCB',
  );
  const finTop = top(f('archeatsink')[0]);
  for (const fan of f('arcfan'))
    assert.ok(bottom(fan) > finTop, 'fans must clear the fins');
});

await test('both cards keep to their published envelopes and true relative size', () => {
  for (const [level, length, height] of [
    ['rx9070', 330.8, 128.5],
    ['arcb580', 272, 115],
  ] as const) {
    const { root } = models.get(level)!;
    root.updateMatrixWorld(true);
    const size = new T.Box3().setFromObject(root).getSize(new T.Vector3());
    // Bracket tabs and the PCIe fingers sit just outside the cooler outline.
    assert.ok(size.x / MM < length + 12, `${level} is ${size.x / MM} mm long`);
    assert.ok(size.x / MM > length - 4, `${level} is ${size.x / MM} mm long`);
    assert.ok(size.z / MM < height + 12, `${level} is ${size.z / MM} mm tall`);
  }
});

await test('board passives never sit inside another part', () => {
  for (const [level, prefix] of [
    ['rx9070', 'rx'],
    ['arcb580', 'arc'],
  ] as const) {
    const pieces = models.get(level)!.pieces;
    const solids = pieces.filter((p) =>
      [
        'gddr6',
        'package',
        'vrm',
        'powerstage',
        'capacitor',
        'pwm',
        'bios',
        'temperature',
        'esd',
        'crystal',
        'fanheader',
        'standoff',
      ]
        .map((s) => prefix + s)
        .includes(p.concept),
    );
    const passives = pieces.filter((p) =>
      [prefix + 'resistor', prefix + 'mlcc'].includes(p.concept),
    );
    assert.ok(passives.length > 40, level + ' has too few passives');
    for (const passive of passives)
      for (const solid of solids)
        assert.ok(
          Math.abs(passive.base.x - solid.base.x - solid.center.x) >
            (passive.extent.x + solid.extent.x) / 2 ||
            Math.abs(passive.base.z - solid.base.z - solid.center.z) >
              (passive.extent.z + solid.extent.z) / 2,
          passive.key + ' clips ' + solid.key,
        );
  }
});

await test('search reaches the new chips at their own scale', () => {
  for (const [query, id] of [
    ['Navi 48', 'rxgpu'],
    ['XMX', 'arcxmx'],
    ['workgroup', 'rxwgp'],
    ['render slice', 'xeslice'],
    ['Infinity Cache', 'rxinfinity'],
  ] as const)
    assert.ok(
      searchConcepts(query).some((c) => c.id === id),
      query,
    );
  assert.equal(selectSearch(initialState, 'rxray').level, 'rxcu');
  assert.equal(selectSearch(initialState, 'arcrtu').level, 'xecore');
});
