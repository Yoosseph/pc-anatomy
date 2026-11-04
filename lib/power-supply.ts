import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import {
  supplyModels,
  supplyPartId,
  type SupplyModel,
} from './concepts/psu.ts';
import {
  buildCapacitor,
  buildChip,
  buildChoke,
  buildFan,
  buildFinStack,
  buildHoneycomb,
  buildMainsInlet,
  buildScrew,
} from './parts.ts';

/**
 * Inside the power supply, laid out along the conversion chain.
 *
 * X runs the length of the board from the mains inlet to the output panel, so
 * the stages read left to right in the order the energy passes through them:
 * inlet → filter → rectifier → power factor correction → bulk store → primary
 * switches → transformer → secondary rectification → output.
 *
 * Z is across the board, Y is up off it. The isolation gap down the middle of
 * the board, the one real safety feature you can see, runs along Z at the
 * transformer.
 *
 * **Nothing here takes a `reveal` threshold.** Every internal part exists at
 * slider position zero, but the complete six-sided housing naturally hides it
 * until the enclosure moves away during dissection. That keeps the assembled
 * supply closed without making its contents pop into existence later.
 */

/** Millimetres to scene units. 1 unit ≈ 12 mm, so the unit fills the stage. */
const mm = (v: number) => v / 12;

const W = mm(150); // along the board, inlet to output
const D = mm(150); // across the board; both TUF models are 150 × 150 × 86 mm
const WALL = mm(1.2);

/** Printed metal side treatment, generated in the browser like the other maps. */
function sideBadge(model: SupplyModel, side: number) {
  const canvas = document.createElement('canvas');
  // Draw above the displayed resolution: the side is usually seen obliquely,
  // where a small canvas otherwise turns the lettering soft and jagged.
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  const accent = model.efficiency === 'Gold' ? '#b8a477' : '#b68763';
  ctx.fillStyle = '#171c20';
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = '#2b3338';
  ctx.fillRect(0, 0, 1024, 12);
  ctx.fillRect(0, 500, 1024, 12);
  ctx.font = 'bold 62px sans-serif';
  ctx.fillStyle = '#f5f5f0';
  ctx.fillText('TUF GAMING', 91, 135);
  ctx.font = 'bold 154px sans-serif';
  ctx.fillText(`${model.watts}W`, 85, 312);
  ctx.fillStyle = accent;
  ctx.font = 'bold 45px sans-serif';
  ctx.fillText(`80 PLUS ${model.efficiency.toUpperCase()}`, 93, 390);
  ctx.fillStyle = '#ccd2d3';
  ctx.font = 'bold 31px sans-serif';
  ctx.fillText(model.modular ? 'FULLY MODULAR' : 'FIXED CABLE', 93, 448);
  ctx.fillStyle = '#30383d';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(730 + i * 42, 35);
    ctx.lineTo(1000, 305 - i * 31);
    ctx.lineTo(1000, 321 - i * 31);
    ctx.lineTo(714 + i * 42, 51);
    ctx.fill();
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 16;
  const badge = new T.Mesh(
    new T.PlaneGeometry(mm(130), mm(65)),
    new T.MeshStandardMaterial({
      map: texture,
      metalness: 0.36,
      roughness: 0.7,
    }),
  );
  if (side < 0) badge.rotation.y = Math.PI;
  return badge;
}

function faceText(text: string, width: number, height = mm(5)) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e6e9e7';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(text, 256, 47, 500);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 16;
  return new T.Mesh(
    new T.PlaneGeometry(width, height),
    new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
}

function modularSockets(
  material: ModelTools['material'],
  box: ModelTools['box'],
) {
  const group = new T.Group();
  const put = (mesh: T.Object3D, x: number, y: number, z: number) => {
    mesh.position.set(x, y, z);
    group.add(mesh);
  };
  put(box([mm(124), mm(70), mm(3)], '#252b30', 0.8), 0, 0, 0);
  put(box([mm(119), mm(1), mm(2)], '#545f66', 0.9), 0, mm(31), mm(2));
  put(faceText('TUF GAMING  |  MODULAR OUTPUTS', mm(99)), 0, mm(26), mm(2.1));
  const sockets: [number, number, number, number, string][] = [
    [-43, 11, 25, 15, 'MB'],
    [-12, 11, 20, 15, 'CPU'],
    [16, 11, 20, 15, 'PCI-E'],
    [43, 11, 20, 15, 'PCI-E'],
    [-43, -17, 25, 14, '16-PIN'],
    [-15, -17, 20, 14, 'SATA'],
    [12, -17, 20, 14, 'SATA'],
    [40, -17, 20, 14, 'PERIPH'],
  ];
  for (const [x, y, w, h, title] of sockets) {
    put(
      box([mm(w + 3), mm(h + 3), mm(2)], '#485158', 0.78),
      mm(x),
      mm(y),
      mm(2),
    );
    put(box([mm(w), mm(h), mm(2.4)], '#090c0e', 0.18), mm(x), mm(y), mm(3));
    const columns = title === 'MB' || title === '16-PIN' ? 8 : 4;
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < columns; col++) {
        const px = mm(x + ((col + 0.5) / columns - 0.5) * (w - 3));
        const py = mm(y + (row ? -1 : 1) * h * 0.23);
        put(box([mm(1.25), mm(1.8), mm(0.4)], '#65583e', 0.7), px, py, mm(4.3));
      }
    put(
      faceText(title, mm(w + 3), mm(4.2)),
      mm(x),
      mm(y - h / 2 - 4.5),
      mm(2.2),
    );
  }
  // Machined panel fasteners visually separate the socket plate from the shell.
  for (const x of [-56, 56])
    for (const y of [-29, 29]) {
      const screw = new T.Mesh(
        new T.CylinderGeometry(mm(1.8), mm(1.8), mm(0.7), 12),
        material('#a3a9aa', 0.9, 0.28),
      );
      screw.rotation.x = Math.PI / 2;
      put(screw, mm(x), mm(y), mm(2.2));
    }
  return group;
}

function fixedHarness(
  material: ModelTools['material'],
  box: ModelTools['box'],
) {
  const group = new T.Group();
  const put = (obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
  };
  put(box([mm(3), mm(70), mm(124)], '#22282c', 0.85), [0, 0, 0]);
  put(box([mm(3), mm(42), mm(64)], '#3b4247', 0.55), [mm(2), 0, 0]);
  put(box([mm(3), mm(35), mm(56)], '#0a0d0f', 0.12), [mm(4), 0, 0]);
  const title = faceText('FIXED CABLE HARNESS', mm(78));
  title.rotation.y = Math.PI / 2;
  put(title, [mm(2.4), mm(26), 0]);
  const runs: [number, number, number, string][] = [
    [-15, 8, -16, 'MB 24'],
    [-5, -7, -6, 'CPU 8'],
    [6, 7, 8, 'PCI-E'],
    [16, -8, 19, 'SATA'],
  ];
  for (const [z, y, endZ, name] of runs) {
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(mm(5), mm(y * 0.45), mm(z * 0.6)),
      new T.Vector3(mm(17), mm(y * 0.75), mm(z)),
      new T.Vector3(mm(34), mm(y), mm(endZ)),
      new T.Vector3(mm(48), mm(y), mm(endZ)),
    ]);
    group.add(
      new T.Mesh(
        new T.TubeGeometry(curve, 16, mm(3.2), 8, false),
        material('#111518', 0.12, 0.72),
      ),
    );
    // Fine raised lines suggest woven sleeving rather than smooth plastic.
    for (let i = 2; i < 13; i += 2) {
      const point = curve.getPoint(i / 16);
      const rib = new T.Mesh(
        new T.TorusGeometry(mm(3.25), mm(0.22), 5, 10),
        material('#4b5459', 0.5, 0.6),
      );
      rib.rotation.y = Math.PI / 2;
      rib.position.copy(point);
      group.add(rib);
    }
    put(box([mm(10), mm(11), mm(16)], '#14191d', 0.22), [
      mm(52),
      mm(y),
      mm(endZ),
    ]);
    put(box([mm(1), mm(7), mm(12)], '#555e62', 0.77), [
      mm(57),
      mm(y),
      mm(endZ),
    ]);
    const tag = faceText(name, mm(20), mm(3));
    tag.rotation.y = Math.PI / 2;
    put(tag, [mm(58), mm(y + 9), mm(endZ)]);
  }
  return group;
}

export function buildPowerSupply(
  tools: ModelTools,
  _root: T.Group,
  model: SupplyModel = supplyModels.psu,
) {
  const {
    add: baseAdd,
    airflow,
    instances: baseInstances,
    box,
    pcb,
    material,
    label,
  } = tools;
  const id = (name: string) => supplyPartId(model, name);
  const add: ModelTools['add'] = (name, object, pos, delta, reveal) =>
    baseAdd(id(name), object, pos, delta, reveal);
  const instances: ModelTools['instances'] = (
    name,
    positions,
    size,
    reveal,
    color,
    geometry,
  ) => baseInstances(id(name), positions, size, reveal, color, geometry);
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };
  const boardY = mm(10);

  // ── Housing ─────────────────────────────────────────────────────────────
  const housing = new T.Group();
  const steel = model.modular ? '#22282d' : '#242729';
  // Folded powder-coated steel. Four lid strips leave a real 135 mm fan
  // aperture, instead of the uninterrupted grey slab in the earlier model.
  place(housing, box([W, WALL, D], '#171b1f', 0.88), [0, 0, 0]);
  for (const z of [-1, 1]) {
    place(housing, box([W, mm(86), WALL], steel, 0.88), [
      0,
      mm(43),
      (z * D) / 2,
    ]);
    place(housing, box([W, mm(2.2), mm(5)], '#353c41', 0.9), [
      0,
      mm(83),
      z * (D / 2 - mm(3)),
    ]);
    place(housing, sideBadge(model, z), [0, mm(43), z * (D / 2 + mm(0.75))]);
  }
  for (const x of [-1, 1])
    place(housing, box([mm(8), WALL, D], steel, 0.88), [
      x * (W / 2 - mm(4)),
      mm(86),
      0,
    ]);
  for (const z of [-1, 1])
    place(housing, box([W - mm(16), WALL, mm(8)], steel, 0.88), [
      0,
      mm(86),
      z * (D / 2 - mm(4)),
    ]);
  place(housing, box([WALL, mm(86), D], '#1a1f23', 0.9), [-W / 2, mm(43), 0]);
  place(housing, box([WALL, mm(86), D], '#1a1f23', 0.9), [W / 2, mm(43), 0]);
  // An inset lip and dense wire guard make the fan visible from above.
  const guard = buildHoneycomb(
    material,
    mm(129),
    mm(129),
    mm(0.8),
    mm(4.2),
    '#343a3f',
  );
  guard.rotation.x = -Math.PI / 2;
  place(housing, guard, [0, mm(87), 0]);
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      place(housing, box([mm(12), mm(1), mm(12)], '#3b4248', 0.87), [
        x * mm(67),
        mm(86),
        z * mm(67),
      ]);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      place(housing, buildScrew(material, mm(3)), [
        (sx * (W - mm(16))) / 2,
        mm(86) + WALL,
        (sz * (D - mm(16))) / 2,
      ]);
  add('psucase', housing, [0, 0, 0], [0, 4.6, 0]);

  // 135 mm Axial-tech fan behind the visible lid guard.
  const intake = buildFan(material, {
    size: mm(135),
    blades: 11,
    phase: 0.4,
    frameColor: '#111519',
    bladeColor: '#272d32',
    hubColor: '#14191d',
  });
  add('psuintake', intake, [0, mm(73), 0], [0, -2.4, 0]);

  // Rear grille, mains inlet and switch.
  const grille = buildHoneycomb(
    material,
    mm(86),
    mm(70),
    mm(1),
    mm(4.4),
    '#333a3f',
  );
  grille.rotation.y = Math.PI / 2;
  grille.rotation.z = Math.PI / 2;
  add('psugrille', grille, [-W / 2 - mm(1), mm(44), mm(29)], [-3.4, 1.4, 0]);

  const inlet = new T.Group();
  const socket = buildMainsInlet(material, mm(26));
  socket.rotation.y = -Math.PI / 2;
  place(inlet, socket, [0, 0, 0]);
  place(inlet, box([mm(4), mm(16), mm(22)], '#101416', 0.28), [0, mm(30), 0]);
  add('psuinlet', inlet, [-W / 2 - mm(2), mm(29), -mm(42)], [-3.4, 0.6, -0.6]);

  // ── The board, and the isolation gap across it ─────────────────────────
  const board = new T.Group();
  place(board, pcb([W - mm(10), mm(1.6), D - mm(10)], 'psu'), [0, 0, 0]);
  // The routed slot that separates mains-voltage copper from the output side.
  place(board, box([mm(3), mm(2.2), D - mm(24)], '#12160f', 0.2), [
    mm(2),
    mm(0.6),
    0,
  ]);
  label(
    board,
    'PRIMARY · MAINS VOLTAGE',
    [-mm(44), mm(1.2), D / 2 - mm(14)],
    mm(64),
    '#7d8a6e',
  );
  label(
    board,
    'SECONDARY · LOW VOLTAGE',
    [mm(46), mm(1.2), D / 2 - mm(14)],
    mm(64),
    '#6e8a7f',
  );
  add('psuboard', board, [0, boardY, 0], [0, -1.8, 0]);

  // ── Mains filter ────────────────────────────────────────────────────────
  const filter = new T.Group();
  for (let i = 0; i < 2; i++) {
    const core = new T.Mesh(
      new T.TorusGeometry(mm(11), mm(5), 10, 20),
      material('#2a2f33', 0.3, 0.6),
    );
    core.rotation.x = Math.PI / 2;
    place(filter, core, [i * mm(22), mm(6), 0]);
    // Windings: a few turns of enamelled copper over the ring.
    for (let k = 0; k < 9; k++) {
      const turn = new T.Mesh(
        new T.TorusGeometry(mm(5.4), mm(1.1), 5, 10),
        material('#b0793f', 0.9, 0.34),
      );
      const a = (k / 9) * Math.PI * 2;
      turn.position.set(
        i * mm(22) + Math.cos(a) * mm(11),
        mm(6),
        Math.sin(a) * mm(11),
      );
      turn.rotation.y = -a;
      filter.add(turn);
    }
  }
  for (let i = 0; i < 3; i++)
    place(filter, box([mm(5), mm(14), mm(11)], '#8d7d3e', 0.15), [
      mm(-6 + i * 11),
      mm(7),
      mm(-26),
    ]);
  label(filter, 'EMI FILTER', [mm(10), mm(13), mm(20)], mm(44), '#9aa2a8');
  add(
    'psufilter',
    filter,
    [-W / 2 + mm(24), boardY + mm(2), mm(6)],
    [-1.4, 1.6, 0],
  );

  // ── Bridge rectifier ────────────────────────────────────────────────────
  const bridge = new T.Group();
  place(bridge, box([mm(18), mm(16), mm(6)], '#1c2023', 0.15), [0, mm(8), 0]);
  place(bridge, box([mm(20), mm(22), mm(2)], '#8e979d', 0.9), [
    0,
    mm(11),
    -mm(4),
  ]);
  for (let i = 0; i < 4; i++)
    place(bridge, box([mm(1.6), mm(8), mm(1.6)], '#b8bfc3', 0.92), [
      mm(-6 + i * 4),
      mm(2),
      mm(2),
    ]);
  label(bridge, 'BRIDGE', [0, mm(23), 0], mm(28), '#9aa2a8');
  add('psubridge', bridge, [-W / 2 + mm(56), boardY, mm(30)], [-0.8, 1.8, 0.6]);

  // ── Power factor correction ─────────────────────────────────────────────
  const pfc = new T.Group();
  const pfcCore = new T.Mesh(
    new T.TorusGeometry(mm(15), mm(7), 12, 22),
    material('#3b3026', 0.3, 0.65),
  );
  pfcCore.rotation.x = Math.PI / 2;
  place(pfc, pfcCore, [0, mm(9), 0]);
  for (let k = 0; k < 16; k++) {
    const turn = new T.Mesh(
      new T.TorusGeometry(mm(7.4), mm(1.5), 5, 10),
      material('#b8834e', 0.92, 0.3),
    );
    const a = (k / 16) * Math.PI * 2;
    turn.position.set(Math.cos(a) * mm(15), mm(9), Math.sin(a) * mm(15));
    turn.rotation.y = -a;
    pfc.add(turn);
  }
  label(pfc, 'PFC CHOKE', [0, mm(18), 0], mm(40), '#a8946e');
  add('psupfc', pfc, [-W / 2 + mm(52), boardY, -mm(18)], [-0.6, 2.0, -0.5]);

  // ── Bulk capacitor ──────────────────────────────────────────────────────
  const bulk = new T.Group();
  const can = buildCapacitor(material, mm(17), mm(48), '#1f2a33');
  place(bulk, can, [0, mm(24), 0]);
  const sleeve = new T.Mesh(
    new T.CylinderGeometry(mm(17.3), mm(17.3), mm(30), 22, 1, true),
    material('#26333f', 0.4, 0.5),
  );
  place(bulk, sleeve, [0, mm(22), 0]);
  label(bulk, 'BULK', [0, mm(50), 0], mm(30), '#9fb0bd');
  add('psubulk', bulk, [-W / 2 + mm(84), boardY, mm(4)], [-0.4, 2.4, 0]);

  // ── Primary switches, transformer, secondary ────────────────────────────
  const primarySink = new T.Group();
  const finsA = buildFinStack(
    material,
    16,
    [mm(46), mm(1.4), mm(8)],
    mm(4.2),
    '#5c656c',
  );
  finsA.rotation.z = Math.PI / 2;
  place(primarySink, finsA, [0, mm(24), 0]);
  place(primarySink, box([mm(66), mm(46), mm(3)], '#6a747b', 0.88), [
    0,
    mm(24),
    -mm(5),
  ]);
  const secondarySink = new T.Group();
  const finsB = buildFinStack(
    material,
    16,
    [mm(42), mm(1.4), mm(8)],
    mm(4.2),
    '#5c656c',
  );
  finsB.rotation.z = Math.PI / 2;
  place(secondarySink, finsB, [0, mm(22), 0]);
  place(secondarySink, box([mm(66), mm(42), mm(3)], '#6a747b', 0.88), [
    0,
    mm(22),
    mm(5),
  ]);
  const sinks = new T.Group();
  place(sinks, primarySink, [-mm(18), 0, mm(16)]);
  place(sinks, secondarySink, [mm(22), 0, -mm(14)]);
  add('psusinks', sinks, [mm(2), boardY, 0], [0, 2.8, 0]);

  const switches = new T.Group();
  for (let i = 0; i < 4; i++)
    place(
      switches,
      buildChip(material, [mm(13), mm(15), mm(4)], 3, false, '#17191b'),
      [mm(-20 + i * 13), mm(10), mm(12)],
    );
  label(
    switches,
    'PRIMARY SWITCHES',
    [mm(-2), mm(20), mm(12)],
    mm(56),
    '#9aa2a8',
  );
  add('psuswitch', switches, [mm(2), boardY, 0], [-0.4, 2.2, 0.8]);

  const transformer = new T.Group();
  place(transformer, box([mm(34), mm(30), mm(36)], '#2a2d30', 0.25), [
    0,
    mm(17),
    0,
  ]);
  // Tape wrap around the middle, which is what makes a transformer legible.
  place(transformer, box([mm(35), mm(12), mm(37)], '#6b5f3a', 0.2), [
    0,
    mm(17),
    0,
  ]);
  place(transformer, box([mm(38), mm(6), mm(14)], '#3a3f43', 0.4), [
    0,
    mm(31),
    0,
  ]);
  for (const s of [-1, 1])
    for (let i = 0; i < 5; i++)
      place(transformer, box([mm(1.4), mm(6), mm(1.4)], '#b8bfc3', 0.92), [
        mm(-10 + i * 5),
        mm(1),
        s * mm(15),
      ]);
  label(transformer, 'TRANSFORMER', [0, mm(35), 0], mm(46), '#a8a08a');
  add('psutransformer', transformer, [mm(2), boardY, -mm(2)], [0, 3.2, 0]);

  const secondary = new T.Group();
  for (let i = 0; i < 6; i++)
    place(
      secondary,
      buildChip(material, [mm(11), mm(13), mm(4)], 3, false, '#17191b'),
      [mm(-26 + i * 11), mm(9), 0],
    );
  label(
    secondary,
    'SYNCHRONOUS RECTIFICATION',
    [0, mm(18), 0],
    mm(72),
    '#8fae9c',
  );
  add('psusecondary', secondary, [mm(26), boardY, -mm(20)], [0.6, 2.0, -0.8]);

  // ── Minor rails and output ──────────────────────────────────────────────
  const dcdc = new T.Group();
  for (let i = 0; i < 2; i++) {
    const daughter = new T.Group();
    place(daughter, pcb([mm(34), mm(1.4), mm(22)], 'psu'), [0, 0, 0]);
    for (let k = 0; k < 3; k++)
      place(daughter, buildChoke(material, mm(8), mm(6), '#2b3033'), [
        mm(-10 + k * 10),
        mm(4),
        0,
      ]);
    place(daughter, box([mm(8), mm(3), mm(8)], '#17191b', 0.12), [
      mm(12),
      mm(2),
      mm(7),
    ]);
    daughter.rotation.z = Math.PI / 2;
    place(dcdc, daughter, [i * mm(22), mm(16), 0]);
  }
  label(dcdc, '+5V · +3.3V', [mm(11), mm(34), 0], mm(40), '#8fae9c');
  add('psudcdc', dcdc, [mm(40), boardY, mm(22)], [1.0, 2.0, 0.6]);

  const output = new T.Group();
  for (let i = 0; i < 8; i++)
    place(output, buildCapacitor(material, mm(5), mm(20), '#25323d'), [
      mm(-14 + (i % 4) * 11),
      mm(11),
      mm(i < 4 ? -12 : 8),
    ]);
  for (let i = 0; i < 2; i++)
    place(output, buildChoke(material, mm(12), mm(9), '#2b3033'), [
      mm(-4 + i * 16),
      mm(5),
      mm(-30),
    ]);
  label(output, 'OUTPUT FILTER', [mm(2), mm(24), mm(-2)], mm(52), '#8fae9c');
  add('psuoutput', output, [W / 2 - mm(38), boardY, mm(6)], [1.4, 1.8, 0]);

  const supervisor = new T.Group();
  place(
    supervisor,
    buildChip(material, [mm(12), mm(3), mm(8)], 7, true, '#17191b'),
    [0, mm(2), 0],
  );
  place(
    supervisor,
    buildChip(material, [mm(9), mm(3), mm(6)], 5, true, '#17191b'),
    [mm(16), mm(2), mm(6)],
  );
  label(supervisor, 'SUPERVISOR', [mm(8), mm(4), -mm(9)], mm(40), '#9aa2a8');
  add('psusupervisor', supervisor, [mm(30), boardY, mm(34)], [0.8, 1.4, 1.0]);

  // The cable face is the clearest functional difference between the models.
  const cableFace = model.modular
    ? modularSockets(material, box)
    : fixedHarness(material, box);
  if (model.modular) cableFace.rotation.y = Math.PI / 2;
  add('psumodular', cableFace, [W / 2 + mm(1), mm(43), 0], [3.6, 0.6, 0]);

  // A scatter of small parts so the board is not bare between the stages.
  const smalls: Vec3[] = [];
  for (let i = 0; i < 54; i++) {
    const a = i * 2.399;
    const x = Math.cos(a) * (mm(12) + (i % 9) * mm(7));
    const z = Math.sin(a * 1.27) * (mm(14) + (i % 7) * mm(6));
    if (Math.abs(x) > W / 2 - mm(14) || Math.abs(z) > D / 2 - mm(14)) continue;
    smalls.push([x, boardY + mm(2), z]);
  }
  instances('psuboard', smalls, [mm(4), mm(2), mm(2.4)], 0, '#6f7a69');

  // ── Airflow ─────────────────────────────────────────────────────────────
  // The top axial fan draws into the sealed enclosure; exhaust leaves through
  // the rear honeycomb. Nothing else in the machine shares this air path.
  airflow([
    {
      kind: 'through',
      size: mm(22),
      count: 9,
      path: [
        [0, mm(122), 0],
        [0, mm(89), 0],
        [0, mm(58), 0],
        [-mm(30), mm(48), mm(14)],
        [-W / 2 - mm(8), mm(44), mm(29)],
        [-W / 2 - mm(38), mm(44), mm(29)],
      ],
    },
  ]);
}
