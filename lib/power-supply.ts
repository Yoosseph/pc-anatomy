import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import {
  buildCapacitor,
  buildChip,
  buildChoke,
  buildFan,
  buildFinStack,
  buildHoneycomb,
  buildMainsInlet,
  buildModularPanel,
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
 */

/** Millimetres to scene units. 1 unit ≈ 12 mm, so the unit fills the stage. */
const mm = (v: number) => v / 12;

const W = mm(150); // along the board, inlet to output
const D = mm(140); // across the board
const WALL = mm(1.2);

export function buildPowerSupply(tools: ModelTools, _root: T.Group) {
  const { add, instances, box, material, label } = tools;
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };
  const boardY = mm(10);

  // ── Housing ─────────────────────────────────────────────────────────────
  const housing = new T.Group();
  const steel = '#5d656b';
  // Base tray plus the inverted-U top shell, the way these are actually made.
  place(housing, box([W, WALL, D], '#4e565c', 0.8), [0, 0, 0]);
  place(housing, box([W, mm(86), WALL], steel, 0.8), [0, mm(43), -D / 2]);
  place(housing, box([W, mm(86), WALL], steel, 0.8), [0, mm(43), D / 2]);
  place(housing, box([W, WALL, D], steel, 0.8), [0, mm(86), 0]);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      place(housing, buildScrew(material, mm(3)), [
        (sx * (W - mm(16))) / 2,
        mm(86) + WALL,
        (sz * (D - mm(16))) / 2,
      ]);
  label(housing, 'ATX POWER SUPPLY', [0, mm(87), -mm(34)], mm(90), '#8d959b');
  add('psucase', housing, [0, 0, 0], [0, 4.6, 0]);

  // Intake fan in the base, blowing up through the board.
  const intake = buildFan(material, {
    size: mm(135),
    blades: 11,
    phase: 0.4,
    frameColor: '#3a4046',
    guard: true,
    cable: true,
  });
  add('psuintake', intake, [mm(6), mm(4), 0], [0, -2.4, 0]);

  // Rear grille, mains inlet and switch.
  const grille = buildHoneycomb(material, mm(78), mm(52), mm(1), mm(4.4), '#454c52');
  grille.rotation.y = Math.PI / 2;
  grille.rotation.z = Math.PI / 2;
  add('psugrille', grille, [-W / 2 - mm(1), mm(52), mm(22)], [-3.4, 1.4, 0]);

  const inlet = new T.Group();
  const socket = buildMainsInlet(material, mm(26));
  socket.rotation.y = -Math.PI / 2;
  place(inlet, socket, [0, 0, 0]);
  place(inlet, box([mm(4), mm(16), mm(22)], '#7a8288', 0.82), [0, mm(30), 0]);
  label(inlet, 'AC IN', [0, -mm(22), 0], mm(30), '#8d959b');
  add('psuinlet', inlet, [-W / 2 - mm(2), mm(30), -mm(34)], [-3.4, 0.6, -0.6]);

  // ── The board, and the isolation gap across it ─────────────────────────
  const board = new T.Group();
  place(board, box([W - mm(10), mm(1.6), D - mm(10)], '#2c3a24', 0.05, 0.01), [0, 0, 0]);
  // The routed slot that separates mains-voltage copper from the output side.
  place(board, box([mm(3), mm(2.2), D - mm(24)], '#12160f', 0.2), [mm(2), mm(0.6), 0]);
  label(board, 'PRIMARY · MAINS VOLTAGE', [-mm(44), mm(1.2), D / 2 - mm(14)], mm(64), '#7d8a6e');
  label(board, 'SECONDARY · LOW VOLTAGE', [mm(46), mm(1.2), D / 2 - mm(14)], mm(64), '#6e8a7f');
  add('psuboard', board, [0, boardY, 0], [0, -1.8, 0], 0.12);

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
      turn.position.set(i * mm(22) + Math.cos(a) * mm(11), mm(6), Math.sin(a) * mm(11));
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
  add('psufilter', filter, [-W / 2 + mm(24), boardY + mm(2), mm(6)], [-1.4, 1.6, 0], 0.1);

  // ── Bridge rectifier ────────────────────────────────────────────────────
  const bridge = new T.Group();
  place(bridge, box([mm(18), mm(16), mm(6)], '#1c2023', 0.15), [0, mm(8), 0]);
  place(bridge, box([mm(20), mm(22), mm(2)], '#8e979d', 0.9), [0, mm(11), -mm(4)]);
  for (let i = 0; i < 4; i++)
    place(bridge, box([mm(1.6), mm(8), mm(1.6)], '#b8bfc3', 0.92), [
      mm(-6 + i * 4),
      mm(2),
      mm(2),
    ]);
  label(bridge, 'BRIDGE', [0, mm(23), 0], mm(28), '#9aa2a8');
  add('psubridge', bridge, [-W / 2 + mm(56), boardY, mm(30)], [-0.8, 1.8, 0.6], 0.14);

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
  add('psupfc', pfc, [-W / 2 + mm(52), boardY, -mm(18)], [-0.6, 2.0, -0.5], 0.14);

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
  add('psubulk', bulk, [-W / 2 + mm(84), boardY, mm(4)], [-0.4, 2.4, 0], 0.16);

  // ── Primary switches, transformer, secondary ────────────────────────────
  const primarySink = new T.Group();
  const finsA = buildFinStack(material, 16, [mm(46), mm(1.4), mm(8)], mm(4.2), '#5c656c');
  finsA.rotation.z = Math.PI / 2;
  place(primarySink, finsA, [0, mm(24), 0]);
  place(primarySink, box([mm(66), mm(46), mm(3)], '#6a747b', 0.88), [0, mm(24), -mm(5)]);
  const secondarySink = new T.Group();
  const finsB = buildFinStack(material, 16, [mm(42), mm(1.4), mm(8)], mm(4.2), '#5c656c');
  finsB.rotation.z = Math.PI / 2;
  place(secondarySink, finsB, [0, mm(22), 0]);
  place(secondarySink, box([mm(66), mm(42), mm(3)], '#6a747b', 0.88), [0, mm(22), mm(5)]);
  const sinks = new T.Group();
  place(sinks, primarySink, [-mm(18), 0, mm(16)]);
  place(sinks, secondarySink, [mm(22), 0, -mm(14)]);
  add('psusinks', sinks, [mm(2), boardY, 0], [0, 2.8, 0], 0.2);

  const switches = new T.Group();
  for (let i = 0; i < 4; i++)
    place(
      switches,
      buildChip(material, [mm(13), mm(15), mm(4)], 3, false, '#17191b'),
      [mm(-20 + i * 13), mm(10), mm(12)],
    );
  label(switches, 'PRIMARY SWITCHES', [mm(-2), mm(20), mm(12)], mm(56), '#9aa2a8');
  add('psuswitch', switches, [mm(2), boardY, 0], [-0.4, 2.2, 0.8], 0.24);

  const transformer = new T.Group();
  place(transformer, box([mm(34), mm(30), mm(36)], '#2a2d30', 0.25), [0, mm(17), 0]);
  // Tape wrap around the middle, which is what makes a transformer legible.
  place(transformer, box([mm(35), mm(12), mm(37)], '#6b5f3a', 0.2), [0, mm(17), 0]);
  place(transformer, box([mm(38), mm(6), mm(14)], '#3a3f43', 0.4), [0, mm(31), 0]);
  for (const s of [-1, 1])
    for (let i = 0; i < 5; i++)
      place(transformer, box([mm(1.4), mm(6), mm(1.4)], '#b8bfc3', 0.92), [
        mm(-10 + i * 5),
        mm(1),
        s * mm(15),
      ]);
  label(transformer, 'TRANSFORMER', [0, mm(35), 0], mm(46), '#a8a08a');
  add('psutransformer', transformer, [mm(2), boardY, -mm(2)], [0, 3.2, 0], 0.28);

  const secondary = new T.Group();
  for (let i = 0; i < 6; i++)
    place(
      secondary,
      buildChip(material, [mm(11), mm(13), mm(4)], 3, false, '#17191b'),
      [mm(-26 + i * 11), mm(9), 0],
    );
  label(secondary, 'SYNCHRONOUS RECTIFICATION', [0, mm(18), 0], mm(72), '#8fae9c');
  add('psusecondary', secondary, [mm(26), boardY, -mm(20)], [0.6, 2.0, -0.8], 0.24);

  // ── Minor rails and output ──────────────────────────────────────────────
  const dcdc = new T.Group();
  for (let i = 0; i < 2; i++) {
    const daughter = new T.Group();
    place(daughter, box([mm(34), mm(1.4), mm(22)], '#2c3a24', 0.06), [0, 0, 0]);
    for (let k = 0; k < 3; k++)
      place(daughter, buildChoke(material, mm(8), mm(6), '#2b3033'), [
        mm(-10 + k * 10),
        mm(4),
        0,
      ]);
    place(daughter, box([mm(8), mm(3), mm(8)], '#17191b', 0.12), [mm(12), mm(2), mm(7)]);
    daughter.rotation.z = Math.PI / 2;
    place(dcdc, daughter, [i * mm(22), mm(16), 0]);
  }
  label(dcdc, '+5V · +3.3V', [mm(11), mm(34), 0], mm(40), '#8fae9c');
  add('psudcdc', dcdc, [mm(40), boardY, mm(22)], [1.0, 2.0, 0.6], 0.26);

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
  add('psuoutput', output, [W / 2 - mm(38), boardY, mm(6)], [1.4, 1.8, 0], 0.2);

  const supervisor = new T.Group();
  place(supervisor, buildChip(material, [mm(12), mm(3), mm(8)], 7, true, '#17191b'), [0, mm(2), 0]);
  place(supervisor, buildChip(material, [mm(9), mm(3), mm(6)], 5, true, '#17191b'), [
    mm(16),
    mm(2),
    mm(6),
  ]);
  label(supervisor, 'SUPERVISOR', [mm(8), mm(4), -mm(9)], mm(40), '#9aa2a8');
  add('psusupervisor', supervisor, [mm(30), boardY, mm(34)], [0.8, 1.4, 1.0], 0.3);

  // Output panel on the face that points into the machine.
  const panel = buildModularPanel(material, mm(76), mm(50), mm(4));
  panel.rotation.y = Math.PI / 2;
  add('psumodular', panel, [W / 2 - mm(2), mm(44), 0], [3.6, 0.6, 0], 0.08);

  // A scatter of small parts so the board is not bare between the stages.
  const smalls: Vec3[] = [];
  for (let i = 0; i < 54; i++) {
    const a = i * 2.399;
    const x = Math.cos(a) * (mm(12) + (i % 9) * mm(7));
    const z = Math.sin(a * 1.27) * (mm(14) + (i % 7) * mm(6));
    if (Math.abs(x) > W / 2 - mm(14) || Math.abs(z) > D / 2 - mm(14)) continue;
    smalls.push([x, boardY + mm(2), z]);
  }
  instances('psuboard', smalls, [mm(4), mm(2), mm(2.4)], 0.12, '#6f7a69');
}
