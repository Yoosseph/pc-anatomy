import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel, type Piece } from '../lib/models.ts';
import { disposeModelResources } from '../lib/model-stage.ts';
import { byId } from '../lib/manifest.ts';
import { sources } from '../lib/sources.ts';
import { initialState } from '../lib/explorer-state.ts';
import {
  powerPanelState,
  visiblePowerRoutes,
} from '../lib/power-flow-policy.ts';
import { levels } from '../lib/levels.ts';
import {
  buildStatus,
  cardClearance,
  checkBuild,
  conflicts,
  coolerCheck,
  lengthCheck,
  ratedDraw,
  slotStatus,
} from '../lib/build-checks.ts';
import {
  caseRoom,
  coolerOptions,
  defaultBuild,
  graphicsFeed,
  graphicsOptions,
  installedBuild,
  isCustomBuild,
  opensTo,
  slotForPiece,
  powerOptions,
  slotOptions,
  pieceForSlot,
  slots,
  standIn,
  towerKey,
  type CoolerChoice,
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
const coolers = Object.keys(coolerOptions) as CoolerChoice[];
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
const board = buildModel('motherboard');
board.root.updateMatrixWorld(true);
after(() => {
  towers.forEach(disposeModelResources);
  cards.forEach(disposeModelResources);
  disposeModelResources(board);
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
      // Each option is a scale the explorer can open, except the drives,
      // which choose what is fitted rather than one part to open.
      if (id !== 'storage') assert.ok(option.id in levels, option.id);
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
  // The adapter is only a way out if the supply has the leads to fill it.
  const radeonBronze = { ...bronze, graphics: 'rx9070' } as const;
  assert.equal(check(radeonBronze, 'connector').status, 'warn');
  assert.match(check(radeonBronze, 'connector').detail, /4 8-pin PCIe leads/);
  const original = powerOptions.psubronze.eightPin;
  try {
    powerOptions.psubronze.eightPin = 2;
    assert.equal(check(radeonBronze, 'connector').status, 'fail');
    powerOptions.psubronze.eightPin = 0;
    assert.equal(
      check({ ...bronze, graphics: 'arcb580' }, 'connector').status,
      'fail',
    );
  } finally {
    powerOptions.psubronze.eightPin = original;
  }
});

await test('a card longer than the case takes fails the length check, and a front radiator takes room', () => {
  const sources = graphicsOptions.card.sources;
  const air = coolerOptions.cooler,
    liquid = coolerOptions.liquid;
  assert.equal(cardClearance(air), caseRoom.cardLength);
  assert.equal(
    cardClearance(liquid),
    caseRoom.cardLength - liquid.radiator!.thickness,
  );
  for (const cooler of [air, liquid]) {
    const room = cardClearance(cooler);
    assert.equal(lengthCheck({ length: room, sources }, cooler).status, 'ok');
    assert.equal(
      lengthCheck({ length: room + 1, sources }, cooler).status,
      'fail',
    );
  }
  // A card between the two fits only with the air tower.
  const long = { length: 400, sources };
  assert.equal(lengthCheck(long, air).status, 'ok');
  assert.equal(lengthCheck(long, liquid).status, 'fail');
  assert.match(lengthCheck(long, liquid).detail, /radiator/);
});

await test('a cooler has to fit the case: a tower under the glass, a radiator on the front fans', () => {
  for (const c of coolers)
    assert.equal(check({ ...defaultBuild, cooler: c }, 'cooler').status, 'ok');
  const tall = { ...coolerOptions.cooler, height: caseRoom.coolerHeight + 1 };
  assert.equal(coolerCheck(tall).status, 'fail');
  const long = {
    ...coolerOptions.liquid,
    radiator: { length: 480, thickness: 30, fans: caseRoom.frontFans + 1 },
  };
  assert.equal(coolerCheck(long).status, 'fail');
  assert.match(
    check({ ...defaultBuild, cooler: 'liquid' }, 'cooler').detail,
    /roof/,
  );
});

await test('each drive has its connection, and the SATA drive its lead', () => {
  assert.equal(check(defaultBuild, 'storage').status, 'ok');
  assert.match(
    check(defaultBuild, 'storage').detail,
    /5 SATA power connectors/,
  );
  const m2 = { ...defaultBuild, storage: 'nvme' } as const;
  assert.equal(check(m2, 'storage').status, 'ok');
  assert.match(check(m2, 'storage').detail, /no drive cables/);
  const original = powerOptions.psu.sata;
  try {
    powerOptions.psu.sata = 0;
    assert.equal(check(defaultBuild, 'storage').status, 'fail');
    assert.equal(check(m2, 'storage').status, 'ok');
  } finally {
    powerOptions.psu.sata = original;
  }
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
  // A slot's marker is the worst of its own checks.
  const checks = checkBuild(build);
  assert.equal(slotStatus(checks, 'graphics'), 'fail');
  assert.equal(slotStatus(checks, 'cooler'), 'ok');
  assert.equal(slotStatus(checks, 'storage'), 'ok');
});

await test('the tower is rebuilt only for the parts it shows', () => {
  const keys = new Set<string>();
  for (const c of coolers)
    for (const g of graphics)
      for (const p of power)
        for (const { id: d } of slotOptions('storage'))
          keys.add(
            towerKey({
              ...defaultBuild,
              cooler: c,
              graphics: g,
              power: p,
              storage: d,
            }),
          );
  assert.equal(keys.size, coolers.length * graphics.length * power.length * 2);
  assert.equal(isCustomBuild(defaultBuild), false);
  for (const { id } of slots) {
    const other = slotOptions(id).find((o) => o.id !== defaultBuild[id])!;
    assert.equal(isCustomBuild({ ...defaultBuild, [id]: other.id }), true, id);
  }
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
  // Both processors are counted by their peak socket power, not one by its
  // cooling figure and the other by its peak.
  assert.equal(ratedDraw(defaultBuild), 200 + 575);
  const intel = {
    ...defaultBuild,
    processor: 'corei9',
    power: 'psubronze',
  } as const;
  assert.equal(ratedDraw(intel), 250 + 575);
  assert.equal(check(intel, 'budget').status, 'fail');
  // A processor that cannot seat is still counted, and the check says so.
  assert.match(check(intel, 'budget').detail, /does not fit this board/);
  assert.doesNotMatch(check(defaultBuild, 'budget').detail, /does not fit/);
  assert.equal(check(defaultBuild, 'budget').status, 'ok');
  assert.equal(
    check({ ...defaultBuild, power: 'psubronze' }, 'budget').status,
    'fail',
  );
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
  const liquid = { ...defaultBuild, cooler: 'liquid' } as const;
  assert.equal(standIn('cpucooler', defaultBuild), 'cpucooler');
  assert.equal(standIn('cpucooler', liquid), 'aio');
  assert.equal(opensTo('cpucooler', defaultBuild), 'cooler');
  assert.equal(opensTo('cpucooler', liquid), 'liquid');
  // Each slot points at the piece its part went into, and back.
  for (const { id } of slots) {
    const target = pieceForSlot(id, defaultBuild);
    assert.ok(piece(tower(defaultBuild), target), id);
    const back = slotForPiece(target);
    if (back) assert.equal(back, id);
  }
  assert.equal(
    pieceForSlot('storage', { ...defaultBuild, storage: 'nvme' }),
    'motherboard',
  );
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

await test('every card fits the case with either cooler: clear of the fans, the radiator, the deck, the cooler, the roof and the glass', () => {
  const bracket = -6.44;
  for (const c of coolers)
    for (const g of graphics) {
      const name = g + ' with ' + c;
      const model = tower({ ...defaultBuild, graphics: g, cooler: c });
      const card = box(piece(model, 'graphicscard'));
      const front = Math.min(...intakes(model).map((f) => f.min.x));
      // The front of the room is the fans, or the radiator inside them.
      const stop = c === 'liquid' ? radiator(model).min.x : front;
      assert.ok(card.max.x < stop, name + ' must stop short of the front');
      assert.ok(card.min.x > -6.65, name + ' rear');
      assert.ok(card.min.y > -3.35, name + ' must clear the PSU deck');
      assert.ok(card.max.z < 3, name + ' must clear the side glass');
      if (c === 'cooler')
        assert.ok(
          box(piece(model, 'cpucooler')).min.y > card.max.y,
          name + ' must clear the CPU cooler',
        );
      // The clearance the checks quote is the one the model has.
      const room = (stop - bracket) * 35;
      assert.ok(
        Math.abs(room - cardClearance(coolerOptions[c])) < 10,
        `${name}: case takes ${room.toFixed(0)} mm`,
      );
    }
});

await test('the air tower fits under the glass, as the cooler check says', () => {
  const model = tower(defaultBuild);
  const board = box(piece(model, 'motherboard'));
  const tower_ = box(piece(model, 'cpucooler'));
  // Off the face of the board, which is the back of its own bounds.
  const face = -2.54;
  assert.ok(board.min.z < face);
  const height = (tower_.max.z - face) * 35;
  assert.ok(
    Math.abs(height - coolerOptions.cooler.height!) < 6,
    `tower stands ${height.toFixed(0)} mm`,
  );
  const glass = (3.15 - face) * 35;
  assert.ok(
    Math.abs(glass - caseRoom.coolerHeight) < 6,
    `glass is ${glass.toFixed(0)} mm off the board`,
  );
  // And the roof over the board is as the radiator check says.
  const roof = (6.5 - board.max.y) * 35;
  assert.ok(Math.abs(roof - caseRoom.roof) < 3, `roof ${roof.toFixed(0)} mm`);
});

await test('the liquid loop fits: radiator inside the intakes and clear of the deck, tubes clear of the memory, under the roof', () => {
  const model = tower({ ...defaultBuild, cooler: 'liquid' });
  const loop = piece(model, 'cpucooler');
  const core = radiator(model);
  const front = Math.min(...intakes(model).map((f) => f.min.x));
  assert.ok(core.max.x < front, 'radiator stands inside the fans');
  assert.ok(
    box(piece(model, 'psushroud')).max.x < core.min.x,
    'deck is cut back',
  );
  assert.ok(box(piece(model, 'drivecage')).max.y < core.min.y, 'over the cage');
  // As long as the radiator the cooler option describes.
  assert.ok(
    Math.abs(
      (core.max.y - core.min.y) * 35 - coolerOptions.liquid.radiator!.length,
    ) < 4,
  );
  const whole = box(loop);
  assert.ok(whole.max.y < 6.5, 'under the roof');
  assert.ok(whole.max.z < 3, 'inside the glass');
  // Nothing of the loop inside the memory modules beside the socket.
  const ram = memory(model).expandByScalar(0.02);
  for (const v of vertices(loop))
    assert.ok(
      !ram.containsPoint(v),
      `loop runs through the memory at ${v.toArray().join(', ')}`,
    );
});

await test('without a SATA drive the cage is empty, and no SATA lead or route is drawn', () => {
  const both = tower(defaultBuild),
    m2 = tower({ ...defaultBuild, storage: 'nvme' });
  assert.ok(piece(both, 'ssd'));
  assert.equal(piece(m2, 'ssd'), undefined);
  assert.ok(piece(m2, 'drivecage'));
  const routes = (model: { root: T.Object3D }) =>
    model.root.children
      .find((o) => o.userData.powerTick)!
      .children.map((g) => g.name);
  assert.ok(routes(both).includes('sata'));
  assert.ok(!routes(m2).includes('sata'));
  const view = (build: DesktopBuild) => ({
    ...initialState,
    power: true,
    powerTarget: 'storage' as const,
    build,
  });
  assert.deepEqual(visiblePowerRoutes(view(defaultBuild)), ['sata']);
  assert.deepEqual(
    visiblePowerRoutes(view({ ...defaultBuild, storage: 'nvme' })),
    [],
  );
  const legend = powerPanelState(view({ ...defaultBuild, storage: 'nvme' }));
  assert.equal(legend.routes.length, 0);
  assert.match(legend.status!, /no SATA drive/);
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

/**
 * The towers the geometry tests build: every card with every supply, every
 * card again with the liquid loop, whose radiator takes the card's room, and
 * the build without a SATA drive.
 */
function* allBuilds(): Generator<DesktopBuild> {
  for (const g of graphics) {
    for (const p of power) yield { ...defaultBuild, graphics: g, power: p };
    yield { ...defaultBuild, graphics: g, cooler: 'liquid' };
  }
  yield { ...defaultBuild, storage: 'nvme' };
  yield {
    ...defaultBuild,
    cooler: 'liquid',
    storage: 'nvme',
    power: 'psubronze',
  };
}

/** Every vertex of a piece, in case coordinates. */
function vertices(p: Piece) {
  const out: T.Vector3[] = [];
  p.object.updateMatrixWorld(true);
  p.object.traverse((o) => {
    if (!(o instanceof T.Mesh)) return;
    const position = o.geometry.getAttribute('position');
    for (let i = 0; i < position.count; i++)
      out.push(
        new T.Vector3()
          .fromBufferAttribute(position, i)
          .applyMatrix4(o.matrixWorld),
      );
  });
  return out;
}

/** The three front intake fans. */
function intakes(model: { pieces: Piece[] }) {
  const fans = model.pieces
    .filter((p) => p.concept === 'casefan')
    .map(box)
    .filter((b) => b.min.x > 4);
  assert.equal(fans.length, 3);
  return fans;
}

/**
 * The radiator of a fitted liquid loop. Low in the case nothing else of the
 * loop is forward of the socket, which finds its inner face; everything at or
 * in front of that face is the radiator.
 */
function radiator(model: { pieces: Piece[] }) {
  const all = vertices(piece(model, 'cpucooler'));
  const face = Math.min(
    ...all.filter((v) => v.x > 0 && v.y < 2.5).map((v) => v.x),
  );
  return new T.Box3().setFromPoints(all.filter((v) => v.x >= face - 0.001));
}

/** The memory modules, carried from the board's own model into the tower. */
function memory(model: { pieces: Piece[] }) {
  const installed = piece(model, 'motherboard').object.children[0];
  installed.updateMatrixWorld(true);
  const ram = new T.Box3();
  for (const p of board.pieces.filter((p) => p.concept === 'ram'))
    ram.union(
      p.batch
        ? new T.Box3().setFromCenterAndSize(p.base.clone(), new T.Vector3())
        : new T.Box3().setFromObject(p.object),
    );
  return ram.applyMatrix4(installed.matrixWorld);
}
