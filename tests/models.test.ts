import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel, refreshBatches, type Piece } from '../lib/models.ts';
import { byId, isLevelRoot, manifest } from '../lib/manifest.ts';
import { resolvePick, resolvePickNear } from '../lib/picking.ts';
import { levelIds } from '../lib/levels.ts';
import { keyCenter } from '../lib/memory-module.ts';
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

await test('installed motherboard and GPU retain their full inspection geometry and parent picking identity', () => {
  const triangles = (root: T.Object3D) => {
    let count = 0;
    root.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      const vertices =
        o.geometry.index?.count ?? o.geometry.getAttribute('position').count;
      count += (vertices / 3) * (o instanceof T.InstancedMesh ? o.count : 1);
    });
    return count;
  };
  const pc = models.get('pc')!;
  for (const [concept, level] of [
    ['motherboard', 'motherboard'],
    ['graphicscard', 'card'],
  ] as const) {
    const installed = pc.pieces.find((p) => p.concept === concept)!;
    assert.equal(
      triangles(installed.object),
      triangles(models.get(level)!.root),
      concept,
    );
    installed.object.traverse((object) => {
      if (!(object instanceof T.Mesh)) return;
      // Detailed children must open the component at PC scale, including
      // batches that used to select individual RAM chips at the deeper scale.
      assert.equal(
        resolvePick([
          { object, distance: 1, instanceId: 0, point: new T.Vector3() },
        ]),
        installed,
      );
      if (object instanceof T.InstancedMesh) {
        const matrix = new T.Matrix4();
        object.getMatrixAt(0, matrix);
        assert.ok(
          matrix.determinant() > 0,
          'installed instances must be initialized',
        );
      }
    });
  }
});

await test('installed hardware fits the case and clears the power supply deck', () => {
  const pc = models.get('pc')!;
  pc.root.updateMatrixWorld(true);
  const bounds = (id: string) =>
    new T.Box3().setFromObject(pc.pieces.find((p) => p.concept === id)!.object);
  const card = bounds('graphicscard');
  const board = bounds('motherboard');
  const cooler = bounds('cpucooler');
  assert.ok(card.min.y > -3.35, 'GPU cooler must clear the PSU deck');
  for (const box of [card, board, cooler]) {
    assert.ok(
      box.max.x < 6.3 && box.min.x > -6.65,
      'hardware must fit between front and rear panels',
    );
    assert.ok(box.max.y < 6.4, 'hardware must clear the roof');
    assert.ok(box.max.z < 3, 'hardware must clear the side glass');
  }
  assert.ok(
    cooler.min.y > card.max.y,
    'CPU cooler must clear the graphics card',
  );
});

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
  // Individual fins remain geometry inside one complete cooling assembly.
  assert.equal(
    models.get('card')!.pieces.filter((p) => p.concept === 'heatsink').length,
    1,
  );
});

await test('the SATA SSD exposes flash and two distinct interfaces', () => {
  const ssd = models.get('ssd')!;
  assert.equal(ssd.pieces.filter((p) => p.concept === 'ssdnand').length, 4);
  assert.equal(ssd.pieces.filter((p) => p.concept === 'ssddata').length, 1);
  assert.equal(ssd.pieces.filter((p) => p.concept === 'ssdpower').length, 1);
});

await test('M.2 packages and keyed contacts fit a 2280 module and stay pickable', () => {
  const model = models.get('nvme')!;
  assert.equal(model.pieces.filter((p) => p.concept === 'nvmenand').length, 2);
  for (const piece of model.pieces) {
    if (piece.concept === 'nvmefastener') continue;
    const extentX =
      Math.abs(piece.base.x + piece.center.x) + piece.extent.x / 2;
    const extentZ =
      Math.abs(piece.base.z + piece.center.z) + piece.extent.z / 2;
    assert.ok(extentX <= 40 / 6 + 0.01, piece.key + ' exceeds 80 mm length');
    assert.ok(extentZ <= 11 / 6 + 0.01, piece.key + ' exceeds 22 mm width');
    piece.object.traverse((object) => {
      if (object instanceof T.Mesh)
        assert.equal(
          resolvePick([
            { object, distance: 1, instanceId: 0, point: new T.Vector3() },
          ]),
          piece,
          piece.key,
        );
    });
  }
});

await test('the assembled motherboard never invents parts mid-dissection', () => {
  const motherboard = models.get('motherboard')!;
  assert.ok(motherboard.pieces.length > 0);
  assert.ok(motherboard.pieces.every((piece) => piece.reveal === 0));
});

await test('motherboard components stay on the 244 by 305 mm ATX outline', () => {
  const motherboard = models.get('motherboard')!;
  const halfWidth = 244 / 22 / 2;
  const halfDepth = 305 / 22 / 2;
  for (const piece of motherboard.pieces) {
    const outerX = Math.abs(piece.base.x + piece.center.x) + piece.extent.x / 2;
    const outerZ = Math.abs(piece.base.z + piece.center.z) + piece.extent.z / 2;
    assert.ok(
      outerX <= halfWidth + 0.35,
      `${piece.key} leaves the ATX side edge`,
    );
    assert.ok(
      outerZ <= halfDepth + 0.35,
      `${piece.key} leaves the ATX top or bottom edge`,
    );
  }
});

await test('motherboard thermal armour keeps real clearance from sockets and slots', () => {
  const motherboard = models.get('motherboard')!;
  const pieces = (concept: string) =>
    motherboard.pieces.filter((piece) => piece.concept === concept);
  const footprint = (piece: Piece) => ({
    minX: piece.base.x + piece.center.x - piece.extent.x / 2,
    maxX: piece.base.x + piece.center.x + piece.extent.x / 2,
    minZ: piece.base.z + piece.center.z - piece.extent.z / 2,
    maxZ: piece.base.z + piece.center.z + piece.extent.z / 2,
  });
  const overlaps = (a: Piece, b: Piece) => {
    const aa = footprint(a),
      bb = footprint(b),
      epsilon = 0.01;
    return (
      Math.min(aa.maxX, bb.maxX) - Math.max(aa.minX, bb.minX) > epsilon &&
      Math.min(aa.maxZ, bb.maxZ) - Math.max(aa.minZ, bb.minZ) > epsilon
    );
  };
  const clear = (left: string, right: string) => {
    for (const a of pieces(left))
      for (const b of pieces(right))
        assert.ok(
          !overlaps(a, b),
          `${a.key} ${JSON.stringify(footprint(a))} clips ${b.key} ${JSON.stringify(footprint(b))}`,
        );
  };

  clear('vrmheatsink', 'socket');
  clear('vrmheatsink', 'dimmslot');
  clear('vrmheatsink', 'eps8');
  clear('vrmheatsink', 'mobofanheader');
  clear('reario', 'vrmheatsink');
  clear('m2heatsink', 'pcie16');
  clear('m2heatsink', 'pcie1');
  clear('m2heatsink', 'chipset');
  clear('chipset', 'pcie16');
  clear('cmos', 'chipset');
  clear('cmos', 'm2heatsink');
  clear('cmos', 'pcie1');
  clear('lan', 'reario');
  clear('lan', 'pcie16');
  clear('audiocodec', 'pcie16');
  clear('superio', 'm2heatsink');
  clear('superio', 'frontheader');
  clear('frontheader', 'mobofanheader');
  for (const armour of ['vrmheatsink', 'm2heatsink', 'chipset', 'reario'])
    for (const connector of [
      'atx24',
      'sataport',
      'frontheader',
      'mobofanheader',
    ])
      clear(armour, connector);
  clear('dimmslot', 'atx24');
  clear('dimmslot', 'socket');
  clear('chipset', 'pcie1');
  clear('cmos', 'audiocodec');
});

await test('M.2 flash packages fit entirely beneath their thermal covers', () => {
  const { pieces } = models.get('motherboard')!;
  const drives = pieces.filter((p) => p.concept === 'nvme');
  const covers = pieces.filter((p) => p.concept === 'm2heatsink');
  for (const drive of drives) {
    const cover = covers.find((p) => p.base.z === drive.base.z)!;
    assert.ok(cover, drive.key);
    const driveTop = drive.base.y + drive.center.y + drive.extent.y / 2;
    const coverBottom = cover.base.y + cover.center.y - cover.extent.y / 2;
    assert.ok(
      coverBottom - driveTop >= 0.5 / 22,
      `${drive.key} pierces its cover`,
    );
  }
});

await test('installed DDR5 modules leave a real notch for the socket key', () => {
  const { pieces, root } = models.get('motherboard')!;
  root.updateMatrixWorld(true);
  for (const ram of pieces.filter((p) => p.concept === 'ram')) {
    const hitsAt = (z: number) =>
      new T.Raycaster(
        new T.Vector3(ram.base.x - 1, 5.2 / 22, ram.base.z + z / 22),
        new T.Vector3(1, 0, 0),
      ).intersectObject(ram.object, true);
    assert.equal(
      hitsAt(keyCenter('ddr5')).length,
      0,
      `${ram.key} blocks its slot key`,
    );
    assert.ok(
      hitsAt(-15).length > 0,
      'the ray must cross the adjacent contact tab',
    );
  }
});

await test('every fin selects the complete heatsink, including after inventory movement', () => {
  const fins = models
    .get('card')!
    .pieces.filter((p) => p.concept === 'heatsink');
  assert.equal(fins.length, 1);
  const fin = fins[0];
  const banks: T.InstancedMesh[] = [];
  fin.object.traverse((o) => {
    if (o instanceof T.InstancedMesh) banks.push(o);
  });
  assert.equal(banks.length, 2);
  assert.ok(
    banks.every((b) => b.count > 50),
    'dense fin geometry is retained',
  );
  for (const offset of [new T.Vector3(), new T.Vector3(12, 4, -9)]) {
    fin.object.position.copy(fin.base).add(offset);
    fin.object.updateMatrixWorld(true);
    for (const bank of banks)
      for (const index of [0, bank.count - 1]) {
        const matrix = new T.Matrix4();
        bank.getMatrixAt(index, matrix);
        const point = new T.Vector3()
          .setFromMatrixPosition(matrix)
          .applyMatrix4(bank.matrixWorld);
        const ray = new T.Raycaster(
          point.clone().add(new T.Vector3(0, 5, 0)),
          new T.Vector3(0, -1, 0),
        );
        assert.equal(resolvePick(ray.intersectObject(fin.object, true)), fin);
      }
  }
  fin.object.position.copy(fin.base);
  fin.object.updateMatrixWorld(true);
});

await test('TUF 5090 has one backplate, three aligned fan motors and five outputs', () => {
  const { pieces } = models.get('card')!;
  const family = (id: string) => pieces.filter((p) => p.concept === id);
  assert.equal(family('backplate').length, 1);
  assert.equal(family('fan').length, 3);
  assert.equal(family('fanmotor').length, 3);
  assert.equal(family('displayport').length, 3);
  assert.equal(family('hdmi').length, 2);
  assert.equal(family('power').length, 1);
  assert.equal(family('heatpipe').length, 12);
  assert.equal(family('gddr7').length, 16);
  family('fan').forEach((fan, i) =>
    assert.ok(Math.abs(fan.base.x - family('fanmotor')[i].base.x) < 1e-6),
  );
  const board = family('pcb')[0];
  const boardEnd = board.base.x + board.center.x + board.extent.x / 2;
  assert.ok(
    boardEnd < 8.93 * 0.205,
    'PCB must not obstruct the rear flow-through window',
  );
  const heatsink = family('heatsink')[0];
  const finTop = heatsink.base.y + heatsink.center.y + heatsink.extent.y / 2;
  for (const fan of family('fan')) {
    const bladeBottom = fan.base.y + fan.center.y - fan.extent.y / 2;
    assert.ok(bladeBottom > finTop, 'fan rotors must clear the fin stack');
  }
  const solids = pieces.filter((p) =>
    [
      'gddr7',
      'package',
      'vrm',
      'powerstage',
      'capacitor',
      'pwm',
      'bios',
      'monitor',
      'temperature',
      'auxreg',
      'esd',
      'shunt',
      'crystal',
      'fuse',
      'fanheader',
      'standoff',
    ].includes(p.concept),
  );
  for (const passive of pieces.filter((p) =>
    ['resistor', 'mlcc'].includes(p.concept),
  ))
    for (const solid of solids)
      assert.ok(
        Math.abs(passive.base.x - solid.base.x - solid.center.x) >
          (passive.extent.x + solid.extent.x) / 2 ||
          Math.abs(passive.base.z - solid.base.z - solid.center.z) >
            (passive.extent.z + solid.extent.z) / 2,
        passive.key + ' clips ' + solid.key,
      );
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
  assert.ok(
    crossedGlass > 20,
    'the test never actually shot through the glass',
  );
  assert.ok(
    named.size >= 8,
    'only ' + named.size + ' distinct parts were reachable',
  );
  for (const concept of named)
    assert.ok(byId[concept]?.shortName, concept + ' has no name');
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
      assert.ok(
        byId[p.concept]?.shortName,
        `${level}: ${p.concept} has no name`,
      );
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
  assert.equal(
    resolvePickNear((dx) => mixed(dx), 12),
    near.piece,
  );

  // Empty sky stays empty.
  assert.equal(
    resolvePickNear(() => [], 30),
    null,
  );
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
    pieces.forEach((p, i) =>
      p.object.position.set((i - pieces.length / 2) * gap, 0, 0),
    );

  spread(0.6);
  sync();
  const first = sample.filter(reachable).length;
  assert.ok(
    first > sample.length * 0.7,
    `only ${first}/${sample.length} reachable to begin with`,
  );

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
