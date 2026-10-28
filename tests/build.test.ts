import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel, type Piece } from '../lib/models.ts';
import { disposeModelResources } from '../lib/model-stage.ts';
import { byId } from '../lib/manifest.ts';
import { sources } from '../lib/sources.ts';
import { initialState } from '../lib/explorer-state.ts';
import { powerPanelState } from '../lib/power-flow-policy.ts';
import { levels } from '../lib/levels.ts';
import {
  buildStatus,
  caseCardClearance,
  checkBuild,
  conflicts,
  defaultBuild,
  graphicsFeed,
  graphicsOptions,
  installedBuild,
  opensTo,
  powerOptions,
  ratedDraw,
  slotOptions,
  slots,
  standIn,
  towerKey,
  type DesktopBuild,
  type GraphicsChoice,
  type PowerChoice,
} from '../lib/desktop-build.ts';
import type { Vec3 } from '../lib/layout.ts';

// Geometry needs the canvas texture API, not a WebGL context.
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

const graphics = Object.keys(graphicsOptions) as GraphicsChoice[];
const power = Object.keys(powerOptions) as PowerChoice[];
// Built up front, while the canvas stub is in place.
const towers = new Map(
  [...allBuilds()].map((build) => {
    const model = buildModel('pc', build);
    model.root.updateMatrixWorld(true);
    return [towerKey(build), model] as const;
  }),
);
const tower = (build: DesktopBuild) => towers.get(towerKey(build))!;
const cards = new Map(graphics.map((id) => [id, buildModel(id)] as const));
after(() => {
  towers.forEach(disposeModelResources);
  cards.forEach(disposeModelResources);
  globalThis.document = previousDocument;
});

const piece = (model: { pieces: Piece[] }, concept: string) =>
  model.pieces.find((p) => p.concept === concept)!;
const box = (p: Piece) => new T.Box3().setFromObject(p.object);
const check = (build: DesktopBuild, id: string) =>
  checkBuild(build).find((c) => c.id === id)!;

await test('the explorer starts on the machine it has always shown, and that build passes', () => {
  assert.deepEqual(initialState.build, defaultBuild);
  const checks = checkBuild(defaultBuild);
  // The 5090's maker asks for more than the 850 W unit, which is a warning,
  // and nothing else in the original machine is in question.
  assert.equal(buildStatus(checks), 'warn');
  assert.deepEqual(
    checks.filter((c) => c.status !== 'ok').map((c) => c.id),
    ['supply'],
  );
});

await test('every slot offers the scales the project models, and every option is cited', () => {
  for (const { id } of slots) {
    const options = slotOptions(id);
    assert.ok(options.length >= 2, id);
    for (const option of options) {
      // Each option is a scale the explorer can open.
      assert.ok(option.id in levels, option.id);
      assert.ok(option.sources.length > 0, option.id);
      for (const source of option.sources) assert.ok(source in sources, source);
    }
  }
  for (const build of allBuilds())
    for (const c of checkBuild(build))
      for (const source of c.sources) assert.ok(source in sources, source);
});

await test('parts that cannot physically seat fail, and stay out of the tower', () => {
  const intel = { ...defaultBuild, processor: 'corei9' } as const;
  assert.equal(check(intel, 'socket').status, 'fail');
  assert.match(check(intel, 'socket').detail, /LGA 1851/);
  assert.equal(installedBuild(intel).processor, 'ryzen');
  const ddr4 = { ...defaultBuild, memory: 'ddr4' } as const;
  assert.equal(check(ddr4, 'memory').status, 'fail');
  assert.equal(installedBuild(ddr4).memory, 'dimm');
  // Neither changes the tower, so neither rebuilds it.
  assert.equal(towerKey(intel), towerKey(defaultBuild));
  assert.equal(towerKey(ddr4), towerKey(defaultBuild));
});

await test('a maker’s minimum is a failure; a recommendation is a warning', () => {
  const radeon = { ...defaultBuild, graphics: 'rx9070' } as const;
  assert.equal(check(radeon, 'supply').status, 'ok');
  assert.equal(
    check({ ...radeon, power: 'psubronze' }, 'supply').status,
    'fail',
  );
  assert.equal(
    check({ ...defaultBuild, power: 'psubronze' }, 'supply').status,
    'warn',
  );
  for (const p of power)
    assert.equal(
      check({ ...defaultBuild, graphics: 'arcb580', power: p }, 'supply')
        .status,
      'ok',
    );
});

await test('the card’s power socket is matched against the supply’s leads', () => {
  assert.equal(check(defaultBuild, 'connector').status, 'ok');
  const bronze = { ...defaultBuild, power: 'psubronze' } as const;
  assert.equal(check(bronze, 'connector').status, 'warn');
  assert.match(
    check({ ...bronze, graphics: 'rx9070' }, 'connector').detail,
    /3 × 8-pin adapter/,
  );
  assert.equal(
    check({ ...bronze, graphics: 'arcb580' }, 'connector').status,
    'ok',
  );
});

await test('only a part involved in a failure is marked as the problem', () => {
  // The Radeon on the 750 W unit is below Sapphire’s minimum.
  const build = {
    ...defaultBuild,
    graphics: 'rx9070',
    power: 'psubronze',
  } as const;
  assert.equal(buildStatus(checkBuild(build)), 'fail');
  assert.equal(conflicts(build, 'graphics', 'rx9070'), true);
  assert.equal(conflicts(build, 'power', 'psubronze'), true);
  assert.equal(conflicts(build, 'power', 'psu'), false);
  assert.equal(conflicts(build, 'graphics', 'arcb580'), false);
  // Nothing about the processor or memory is in question.
  assert.equal(conflicts(build, 'processor', 'ryzen'), false);
  assert.equal(conflicts(build, 'memory', 'dimm'), false);
  assert.equal(conflicts(build, 'processor', 'corei9'), true);
  assert.equal(conflicts(build, 'memory', 'ddr4'), true);
});

await test('the power legend names the installed card’s own feed', () => {
  const legend = (build: DesktopBuild) =>
    powerPanelState({
      ...initialState,
      power: true,
      powerTarget: 'gpu',
      build,
    });
  const original = legend(defaultBuild);
  const gpu = original.routes.find((route) => route.id === 'gpu')!;
  assert.equal(gpu.label, '12V-2x6');
  assert.match(gpu.description, /RTX 5090/);
  assert.equal(graphicsFeed(defaultBuild), null);
  const arc = legend({ ...defaultBuild, graphics: 'arcb580' });
  const arcFeed = arc.routes.find((route) => route.id === 'gpu')!;
  assert.equal(arcFeed.label, '8-pin PCIe');
  assert.match(arcFeed.description, /Arc B580/);
  // The explanation is the feed's own description, not the 5090's.
  assert.equal(arc.explanation, arcFeed.description);
});

await test('rated draw adds the published processor and card figures', () => {
  assert.equal(ratedDraw(defaultBuild), 170 + 575);
  const intel = {
    ...defaultBuild,
    processor: 'corei9',
    power: 'psubronze',
  } as const;
  assert.equal(ratedDraw(intel), 250 + 575);
  assert.equal(check(intel, 'budget').status, 'fail');
  assert.equal(check(defaultBuild, 'budget').status, 'ok');
});

await test('installed pieces keep their ids and describe what is actually in the slot', () => {
  const radeon = {
    ...defaultBuild,
    graphics: 'rx9070',
    power: 'psubronze',
  } as const;
  assert.equal(standIn('graphicscard', defaultBuild), 'graphicscard');
  assert.equal(byId[standIn('graphicscard', radeon)].level, 'rx9070');
  assert.equal(byId[standIn('psu', radeon)].level, 'psubronze');
  assert.equal(standIn('motherboard', radeon), 'motherboard');
  assert.equal(opensTo('graphicscard', defaultBuild), 'card');
  assert.equal(opensTo('graphicscard', radeon), 'rx9070');
  assert.equal(opensTo('psu', radeon), 'psubronze');
  assert.equal(opensTo('motherboard', radeon), 'motherboard');
  for (const g of graphics) {
    const model = tower({ ...defaultBuild, graphics: g });
    assert.ok(piece(model, 'graphicscard'), g);
    assert.ok(piece(model, 'psu'), g);
  }
});

await test('every card seats on the same slot, at its true length', () => {
  // The edge connector of each card, carried into the tower by the installed
  // assembly's own transform.
  const edge = (g: GraphicsChoice) => {
    const installed = piece(
      tower({ ...defaultBuild, graphics: g }),
      'graphicscard',
    );
    const detailed = installed.object.children[0];
    const id = { card: 'pcie', rx9070: 'rxpcie', arcb580: 'arcpcie' }[g];
    return piece(cards.get(g)!, id)
      .base.clone()
      .applyMatrix4(detailed.matrixWorld);
  };
  // Brackets all stand against the rear panel, and the builders place their
  // connectors up to 5 mm apart along the card, so along the slot that much
  // is allowed. Into the slot and off the board there is no slack.
  const slot = edge('card');
  for (const g of graphics) {
    const e = edge(g);
    assert.ok(Math.abs(e.x - slot.x) < 6 / 35, g + ' along the slot');
    assert.ok(Math.abs(e.y - slot.y) < 0.01, g + ' off the board');
    assert.ok(Math.abs(e.z - slot.z) < 0.01, g + ' into the slot');
    const size = box(
      piece(tower({ ...defaultBuild, graphics: g }), 'graphicscard'),
    ).getSize(new T.Vector3());
    const length = size.x * 35;
    assert.ok(
      Math.abs(length - graphicsOptions[g].length) < 12,
      `${g} is ${length.toFixed(0)} mm in the tower`,
    );
  }
});

await test('every card fits the case: clear of the fans, the deck, the cooler, the roof and the glass', () => {
  for (const g of graphics) {
    const model = tower({ ...defaultBuild, graphics: g });
    const card = box(piece(model, 'graphicscard'));
    const cooler = box(piece(model, 'cpucooler'));
    const fans = model.pieces
      .filter((p) => p.concept === 'casefan')
      .map(box)
      .filter((b) => b.min.x > 4);
    assert.equal(fans.length, 3);
    for (const fan of fans)
      assert.ok(
        card.max.x < fan.min.x,
        g + ' must stop short of the intake fans',
      );
    assert.ok(card.min.x > -6.65, g + ' rear');
    assert.ok(card.min.y > -3.35, g + ' must clear the PSU deck');
    assert.ok(card.max.z < 3, g + ' must clear the side glass');
    assert.ok(cooler.min.y > card.max.y, g + ' must clear the CPU cooler');
    // The clearance the checks quote is the one the model has.
    const bracket = -6.44;
    const room = (Math.min(...fans.map((f) => f.min.x)) - bracket) * 35;
    assert.ok(
      Math.abs(room - caseCardClearance) < 10,
      `case takes ${room.toFixed(0)} mm`,
    );
  }
});

await test('the card’s cable ends on its socket, and the supply’s face matches its cabling', () => {
  for (const build of allBuilds()) {
    const model = tower(build);
    const overlay = model.root.children.find((o) => o.userData.powerTick)!;
    const gpu = overlay.children.find((g) => g.name === 'gpu')!;
    const path = gpu.userData.path as Vec3[];
    const end = new T.Vector3(...path[path.length - 1]);
    const card = box(piece(model, 'graphicscard')).expandByScalar(0.2);
    assert.ok(card.containsPoint(end), towerKey(build));
  }
  const triangles = (p: Piece) => {
    let n = 0;
    p.object.traverse((o) => {
      if (o instanceof T.Mesh) n += o.geometry.getAttribute('position').count;
    });
    return n;
  };
  const modular = piece(tower(defaultBuild), 'psu');
  const fixed = piece(tower({ ...defaultBuild, power: 'psubronze' }), 'psu');
  assert.notEqual(
    triangles(fixed),
    triangles(modular),
    'the fixed unit has a cable exit, not a socket panel',
  );
});

function* allBuilds(): Generator<DesktopBuild> {
  for (const g of graphics)
    for (const p of power) yield { ...defaultBuild, graphics: g, power: p };
}
