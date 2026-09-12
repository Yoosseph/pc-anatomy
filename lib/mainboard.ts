import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import {
  buildBlockSink,
  buildCapacitor,
  buildChip,
  buildChoke,
  buildFinStack,
  buildHeader,
  buildPort,
  buildScrew,
  buildSlot,
} from './parts.ts';

/**
 * The motherboard at its own scale.
 *
 * The board is laid flat here — X across, Z front-to-back, Y off the board —
 * because that is how you look at a board on a bench, and it matches how the
 * graphics card presents its own PCB one level down.
 *
 * Outline, slot pitch and the rear aperture follow ATX. Which controller sits
 * where, how many regulator phases there are and where the headers land are
 * representative of the category, not of any particular board.
 */

/** Millimetres to scene units. 1 unit ≈ 22 mm, so the board fills the stage. */
const mm = (v: number) => v / 22;

const W = mm(305); // across the board, the rear-I/O edge
const D = mm(244); // front to back
const SLOT_PITCH = mm(20.32);

export function buildMotherboard(tools: ModelTools, _root: T.Group) {
  const { add, instances, box, material, label } = tools;
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };

  // ── The board ───────────────────────────────────────────────────────────
  const board = new T.Group();
  place(board, box([W, mm(1.6), D], '#1d3a2b', 0.04, 0.01), [0, 0, 0]);
  for (const x of [-mm(130), mm(8), mm(146)])
    for (const z of [-mm(100), 0, mm(104)]) {
      const ring = new T.Mesh(
        new T.TorusGeometry(mm(4), mm(1.1), 6, 16),
        material('#c6cdd1', 0.92, 0.28),
      );
      ring.rotation.x = Math.PI / 2;
      place(board, ring, [x, mm(1.1), z]);
    }
  label(board, 'ATX · 305 × 244 mm', [mm(96), mm(1.2), mm(112)], mm(95), '#74846f');
  label(board, 'ILLUSTRATIVE LAYOUT', [-mm(96), mm(1.2), mm(112)], mm(95), '#63735f');
  add('moboboard', board, [0, 0, 0], [0, -1.6, 0]);

  // ── Processor socket and CPU ────────────────────────────────────────────
  const socketX = -mm(28),
    socketZ = -mm(46);
  const socket = new T.Group();
  place(socket, box([mm(56), mm(3), mm(56)], '#383e43', 0.6), [0, 0, 0]);
  const contact = new T.BoxGeometry(mm(0.9), mm(0.6), mm(0.9));
  const contactMaterial = material('#cbae60', 0.94, 0.22);
  for (let i = 0; i < 34; i++)
    for (let j = 0; j < 34; j++) {
      if ((i > 12 && i < 21 && j > 12 && j < 21) || (i + j) % 2) continue;
      const pin = new T.Mesh(contact, contactMaterial);
      pin.position.set(mm(-24.75 + i * 1.5), mm(1.8), mm(-24.75 + j * 1.5));
      socket.add(pin);
    }
  // Retention frame, load plate and the cam lever that holds it shut.
  for (const s of [-1, 1]) {
    place(socket, box([mm(64), mm(5), mm(5)], '#99a1a6', 0.9), [0, mm(3.4), s * mm(30)]);
    place(socket, box([mm(5), mm(5), mm(64)], '#99a1a6', 0.9), [s * mm(30), mm(3.4), 0]);
  }
  place(socket, box([mm(58), mm(1.6), mm(16)], '#aeb6bb', 0.92), [0, mm(5.2), mm(24)]);
  const lever = new T.Mesh(
    new T.CylinderGeometry(mm(1.8), mm(1.8), mm(52), 12),
    material('#b9c1c5', 0.92, 0.24),
  );
  lever.rotation.x = Math.PI / 2;
  place(socket, lever, [-mm(35), mm(4), mm(6)]);
  const hook = new T.Mesh(
    new T.CylinderGeometry(mm(1.6), mm(1.6), mm(14), 10),
    material('#b9c1c5', 0.92, 0.24),
  );
  hook.rotation.z = Math.PI / 2;
  place(socket, hook, [-mm(29), mm(4), mm(31)]);
  add('socket', socket, [socketX, mm(1.6), socketZ], [0, 1.4, 0], 0.18);

  const cpu = new T.Group();
  place(cpu, box([mm(45), mm(2.2), mm(38)], '#31363b', 0.5), [0, 0, 0]);
  place(cpu, box([mm(39), mm(3.2), mm(32)], '#ccd3d7', 0.95, 0.006), [0, mm(2.4), 0]);
  // The two notches that key the package into the socket.
  for (const s of [-1, 1])
    place(cpu, box([mm(3), mm(2.4), mm(2)], '#2a2e32', 0.4), [s * mm(16), 0, -mm(19)]);
  label(cpu, 'CPU', [0, mm(4.1), -mm(5)], mm(22), '#767e83');
  label(cpu, 'LGA', [0, mm(4.1), mm(7)], mm(15), '#8b9398');
  add('cpu', cpu, [socketX, mm(6.4), socketZ], [0, 2.6, 0]);

  // ── Memory ──────────────────────────────────────────────────────────────
  const slotZ = socketZ + mm(8);
  const dimmX = [mm(44), mm(55), mm(72), mm(83)];
  for (let i = 0; i < 4; i++) {
    const slot = buildSlot(material, mm(133), i % 2 ? '#2f3439' : '#464e54', {
      width: mm(7),
      height: mm(8),
      notch: 0.56,
      latch: true,
    });
    slot.rotation.y = Math.PI / 2;
    add('dimmslot', slot, [dimmX[i], mm(5), slotZ], [0, 1.0, 0], 0.12);
  }
  for (let i = 0; i < 2; i++) {
    const stick = new T.Group();
    place(stick, box([mm(3), mm(31), mm(133)], '#1d3a2b', 0.05), [0, 0, 0]);
    for (const s of [-1, 1])
      for (let j = 0; j < 8; j++)
        place(stick, box([mm(1.2), mm(11), mm(12)], '#1d2124', 0.12), [
          s * mm(2),
          mm(2),
          mm(-52 + j * 15),
        ]);
    place(stick, box([mm(4.6), mm(9), mm(11)], '#2f3336', 0.22), [0, mm(4), mm(58)]);
    // Gold edge contacts, split by the DDR5 key.
    for (const s of [-1, 1])
      for (const half of [-1, 1])
        place(stick, box([mm(0.5), mm(4), mm(58)], '#c2a457', 0.93, 0.006), [
          s * mm(1.6),
          -mm(13),
          half * mm(33),
        ]);
    // Brushed aluminium heatspreader over both faces.
    place(stick, box([mm(5.4), mm(26), mm(131)], '#59626a', 0.9, 0.004), [0, mm(6), 0]);
    for (let j = 0; j < 9; j++)
      place(stick, box([mm(5.8), mm(1.2), mm(5)], '#6f7a82', 0.92), [
        0,
        mm(14),
        mm(-56 + j * 14),
      ]);
    label(stick, 'DDR5', [0, mm(19.4), 0], mm(70), '#aeb6bb');
    add('ram', stick, [dimmX[i * 2 + 1], mm(22), slotZ], [0, 2.2, 0]);
  }

  // ── Voltage regulator ───────────────────────────────────────────────────
  const vrm = new T.Group();
  const stageZ = socketZ - mm(46);
  for (let i = 0; i < 10; i++) {
    const x = mm(-96 + i * 15);
    const stage = buildChip(material, [mm(7), mm(2), mm(7)], 5, false, '#1a1d20');
    place(vrm, stage, [x, mm(1.2), stageZ - mm(9)]);
    place(vrm, buildChoke(material, mm(11), mm(6.5), '#2b3033'), [x, mm(3.4), stageZ]);
    place(vrm, buildCapacitor(material, mm(3.4), mm(9), '#23282c'), [
      x,
      mm(4.6),
      stageZ + mm(10),
    ]);
  }
  for (let i = 0; i < 4; i++)
    place(vrm, buildChoke(material, mm(11), mm(6.5), '#2b3033'), [
      socketX - mm(46),
      mm(3.4),
      socketZ - mm(24) + i * mm(15),
    ]);
  label(vrm, '14 PHASE · ILLUSTRATIVE', [-mm(30), mm(7.4), stageZ - mm(20)], mm(110), '#a58f68');
  add('cpuvrm', vrm, [0, mm(1.6), 0], [0, 1.2, -0.6], 0.08);

  // VRM heatsinks: finned blocks joined by a heat pipe, as boards actually do.
  const vrmSink = new T.Group();
  const sinkA = buildFinStack(material, 20, [mm(30), mm(1.3), mm(26)], mm(7.5), '#525a60');
  sinkA.rotation.z = Math.PI / 2;
  place(vrmSink, sinkA, [-mm(30), mm(13), stageZ]);
  place(vrmSink, box([mm(152), mm(4), mm(28)], '#5d666d', 0.88), [-mm(30), mm(5), stageZ]);
  const sinkB = buildFinStack(material, 8, [mm(30), mm(1.3), mm(110)], mm(3.5), '#525a60');
  sinkB.rotation.z = Math.PI / 2;
  place(vrmSink, sinkB, [socketX - mm(46), mm(13), socketZ + mm(2)]);
  place(vrmSink, box([mm(28), mm(4), mm(112)], '#5d666d', 0.88), [
    socketX - mm(46),
    mm(5),
    socketZ + mm(2),
  ]);
  const heatpipe = new T.Mesh(
    new T.CylinderGeometry(mm(3), mm(3), mm(120), 12),
    material('#b8834e', 0.94, 0.24),
  );
  heatpipe.rotation.z = Math.PI / 2;
  place(vrmSink, heatpipe, [-mm(48), mm(9), stageZ]);
  add('vrmheatsink', vrmSink, [0, mm(1.6), 0], [0, 2.4, -0.4]);

  // ── Chipset, firmware, battery, controllers ─────────────────────────────
  const chipset = new T.Group();
  place(chipset, box([mm(50), mm(2), mm(50)], '#1e2124', 0.18), [0, 0, 0]);
  place(chipset, buildBlockSink(material, mm(52), mm(52), mm(14), '#5f686f'), [0, mm(8), 0]);
  label(chipset, 'PCH', [0, mm(17), 0], mm(30), '#aab3b8');
  add('chipset', chipset, [mm(58), mm(2.6), mm(66)], [0.6, 1.4, 0.6]);

  const flash = new T.Group();
  place(flash, buildChip(material, [mm(10), mm(2.4), mm(7)], 4, false, '#16191b'), [0, 0, 0]);
  label(flash, 'UEFI', [0, mm(1.5), 0], mm(9), '#8a9297');
  add('uefi', flash, [mm(120), mm(2.8), mm(40)], [1.0, 1.2, 0.4]);

  const battery = new T.Group();
  const cell = new T.Mesh(
    new T.CylinderGeometry(mm(10), mm(10), mm(3.2), 26),
    material('#c3cace', 0.93, 0.2),
  );
  place(battery, cell, [0, 0, 0]);
  // The retaining clip around the cell.
  const clip = new T.Mesh(
    new T.TorusGeometry(mm(11), mm(1.2), 6, 22, Math.PI * 1.4),
    material('#9aa2a7', 0.9, 0.3),
  );
  clip.rotation.x = Math.PI / 2;
  place(battery, clip, [0, -mm(0.6), 0]);
  label(battery, 'CR', [0, mm(1.8), 0], mm(9), '#666d71');
  add('cmos', battery, [mm(122), mm(3.4), mm(66)], [1.2, 1.0, 0.6]);

  const lan = new T.Group();
  place(lan, buildChip(material, [mm(12), mm(2.2), mm(12)], 6, true, '#1a1d20'), [0, 0, 0]);
  place(lan, box([mm(16), mm(7), mm(14)], '#282c30', 0.25), [0, mm(3), -mm(18)]);
  label(lan, 'LAN', [0, mm(1.5), 0], mm(10), '#8a9297');
  add('lan', lan, [-mm(124), mm(2.8), -mm(70)], [-1.0, 1.2, -0.4]);

  const codec = new T.Group();
  place(codec, buildChip(material, [mm(14), mm(2.2), mm(14)], 7, true, '#1a1d20'), [0, 0, 0]);
  for (let i = 0; i < 5; i++)
    place(codec, buildCapacitor(material, mm(4), mm(10), '#2b3f4a'), [
      mm(-18 + i * 9),
      mm(5),
      mm(16),
    ]);
  label(codec, 'AUDIO', [0, mm(1.5), -mm(12)], mm(22), '#8a9297');
  add('audiocodec', codec, [-mm(120), mm(2.8), mm(78)], [-1.0, 1.2, 0.6]);

  const sensor = new T.Group();
  place(sensor, buildChip(material, [mm(11), mm(2.2), mm(11)], 6, true, '#1a1d20'), [0, 0, 0]);
  label(sensor, 'IO', [0, mm(1.5), 0], mm(8), '#8a9297');
  add('superio', sensor, [mm(104), mm(2.8), mm(96)], [0.9, 1.2, 0.8]);

  // ── Expansion slots ─────────────────────────────────────────────────────
  const pcieZ = socketZ + mm(96);
  for (let i = 0; i < 2; i++) {
    const slot = buildSlot(material, mm(89), i ? '#2f3439' : '#54454e', {
      width: mm(9),
      height: mm(11),
      notch: 0.14,
      latch: true,
      armour: i === 0, // the primary slot carries a steel shroud
    });
    add('pcie16', slot, [-mm(60), mm(6), pcieZ + i * SLOT_PITCH * 3], [0, 1.1, 0], 0.12);
  }
  for (let i = 0; i < 2; i++)
    add(
      'pcie1',
      buildSlot(material, mm(25), '#2f3439', {
        width: mm(9),
        height: mm(11),
        notch: 0.2,
        latch: true,
      }),
      [-mm(78), mm(6), pcieZ + SLOT_PITCH * (i ? 5 : 1.5)],
      [0, 1.1, 0],
      0.12,
    );

  // ── M.2 storage ─────────────────────────────────────────────────────────
  for (let i = 0; i < 2; i++) {
    const z = pcieZ - SLOT_PITCH * 1.4 + i * SLOT_PITCH * 4.2;
    const socketM2 = new T.Group();
    place(socketM2, box([mm(22), mm(3.4), mm(4)], '#333940', 0.24), [-mm(40), 0, 0]);
    place(socketM2, box([mm(20), mm(1), mm(2)], '#c2a457', 0.92), [-mm(40), mm(1.4), 0]);
    place(socketM2, box([mm(6), mm(2), mm(8)], '#525a60', 0.66), [mm(40), 0, 0]);
    add('m2slot', socketM2, [-mm(6), mm(3), z], [0, 0.9, 0], 0.16);

    const drive = new T.Group();
    place(drive, box([mm(80), mm(1.4), mm(22)], '#1d3a2b', 0.05), [0, 0, 0]);
    for (let j = 0; j < 2; j++)
      place(drive, box([mm(14), mm(1.4), mm(16)], '#1d2124', 0.12), [
        mm(-14 + j * 26),
        mm(1.4),
        0,
      ]);
    place(drive, box([mm(11), mm(1.4), mm(11)], '#252a2e', 0.16), [mm(22), mm(1.4), 0]);
    label(drive, 'NVMe', [-mm(30), mm(1.2), 0], mm(20), '#8fa397');
    add('nvme', drive, [-mm(4), mm(5), z], [0, 1.8, 0], 0.2);

    const cover = new T.Group();
    const fins = buildFinStack(material, 12, [mm(8), mm(1.2), mm(26)], mm(7), '#636c72');
    fins.rotation.z = Math.PI / 2;
    place(cover, fins, [0, 0, 0]);
    place(cover, box([mm(88), mm(3), mm(28)], '#6d767c', 0.88), [0, -mm(4), 0]);
    add('m2heatsink', cover, [-mm(4), mm(13), z], [0, 2.6, 0]);
  }

  // ── Power connectors ────────────────────────────────────────────────────
  add(
    'atx24',
    buildHeader(material, 12, 2, mm(4.2), '#22262a', mm(13)),
    [mm(140), mm(7), -mm(10)],
    [1.4, 1.0, 0],
  );
  for (let i = 0; i < 2; i++)
    add(
      'eps8',
      buildHeader(material, 4, 2, mm(4.2), '#22262a', mm(12)),
      [socketX - mm(6) + i * mm(26), mm(6.5), -mm(106)],
      [0, 1.0, -1.2],
    );

  // ── Storage and front-panel connectors ──────────────────────────────────
  for (let i = 0; i < 4; i++) {
    const port = new T.Group();
    place(port, box([mm(15), mm(10), mm(7)], '#1e2226', 0.14), [0, 0, 0]);
    place(port, box([mm(11), mm(5), mm(2)], '#0d0f10', 0.3), [0, 0, mm(3.6)]);
    place(port, box([mm(9), mm(1), mm(2)], '#c2a457', 0.9), [0, -mm(2), mm(3.4)]);
    add('sataport', port, [mm(140), mm(6.5), mm(30) + i * mm(9)], [1.4, 0.8, 0]);
  }
  for (let i = 0; i < 4; i++)
    add(
      'frontheader',
      buildHeader(material, i < 2 ? 5 : 4, 2, mm(4.2), '#22262a', mm(10)),
      [mm(30) + i * mm(40), mm(5.5), mm(112)],
      [0.3, 0.8, 1.3],
    );
  const fanHeaders: Vec3[] = [
    [socketX + mm(40), mm(5), -mm(100)],
    [socketX - mm(40), mm(5), -mm(100)],
    [mm(138), mm(5), -mm(60)],
    [mm(138), mm(5), mm(84)],
    [-mm(60), mm(5), mm(112)],
    [mm(10), mm(5), -mm(104)],
  ];
  for (const position of fanHeaders)
    add(
      'mobofanheader',
      buildHeader(material, 4, 1, mm(4.2), '#2c3136', mm(9)),
      position,
      [0, 0.9, 0],
    );

  // ── Rear I/O stack ──────────────────────────────────────────────────────
  const io = new T.Group();
  place(io, box([mm(158), mm(44), mm(18)], '#333940', 0.66), [0, mm(20), 0]);
  // USB, display and network, as stacked shells with real openings.
  const ports: [Vec3, Vec3, string][] = [
    [[-mm(62), mm(10), mm(10)], [mm(15), mm(7), mm(14)], '#33455f'],
    [[-mm(62), mm(20), mm(10)], [mm(15), mm(7), mm(14)], '#33455f'],
    [[-mm(42), mm(10), mm(10)], [mm(15), mm(7), mm(14)], '#4a3434'],
    [[-mm(42), mm(20), mm(10)], [mm(15), mm(7), mm(14)], '#4a3434'],
    [[-mm(18), mm(15), mm(10)], [mm(12), mm(12), mm(14)], '#242a2e'],
    [[mm(6), mm(16), mm(10)], [mm(17), mm(15), mm(14)], '#2a3035'],
    [[mm(34), mm(14), mm(10)], [mm(22), mm(10), mm(14)], '#1e2226'],
  ];
  for (const [position, size, color] of ports)
    place(io, buildPort(material, size, color), position);
  for (let i = 0; i < 5; i++) {
    const jack = new T.Mesh(
      new T.CylinderGeometry(mm(3.4), mm(3.4), mm(14), 16),
      material(['#4a7d57', '#7d6f4a', '#7d4a57', '#4a6a7d', '#565b5f'][i], 0.74, 0.32),
    );
    jack.rotation.x = Math.PI / 2;
    place(io, jack, [mm(58), mm(8) + (i % 3) * mm(12), mm(8)]);
  }
  label(io, 'REAR I/O · 158.75 × 44.45 mm', [0, mm(41), mm(2)], mm(120), '#868e93');
  add('reario', io, [0, mm(1.6), -D / 2 + mm(10)], [0, 1.2, -2.2]);

  // Mounting screws around the outside.
  for (const x of [-mm(130), mm(8), mm(146)])
    for (const z of [-mm(100), 0, mm(104)])
      add('moboboard', buildScrew(material, mm(3.6)), [x, mm(3), z], [0, 2.0, 0], 0.3);

  // Small passives filling the space between assemblies, as on a real board.
  const passives: Vec3[] = [];
  for (let i = 0; i < 120; i++) {
    const a = i * 2.399;
    const x = Math.cos(a) * (mm(20) + (i % 11) * mm(12)) + mm(20);
    const z = Math.sin(a * 1.31) * (mm(18) + (i % 9) * mm(11)) + mm(14);
    if (Math.abs(x - socketX) < mm(38) && Math.abs(z - socketZ) < mm(38)) continue;
    if (Math.abs(x) > W / 2 - mm(14) || Math.abs(z) > D / 2 - mm(14)) continue;
    passives.push([x, mm(1.9), z]);
  }
  instances('moboboard', passives, [mm(3.2), mm(1.5), mm(1.8)], 0, '#6e7a69');
  // A handful of taller electrolytics, so the board has vertical relief.
  for (let i = 0; i < 7; i++) {
    const a = i * 1.7;
    add(
      'moboboard',
      buildCapacitor(material, mm(4.5), mm(11), '#23282c'),
      [mm(96) + Math.cos(a) * mm(26), mm(7), mm(40) + Math.sin(a) * mm(44)],
      [0.8, 1.4, 0.4],
      0.34,
    );
  }
}
