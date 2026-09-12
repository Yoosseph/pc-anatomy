import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import {
  buildBlockSink,
  buildLightStrip,
  buildCapacitor,
  buildChoke,
  buildFan,
  buildFinStack,
  buildHoneycomb,
  buildMainsInlet,
  buildModularPanel,
  buildScrew,
  glowMaterial,
} from './parts.ts';

/**
 * The assembled desktop machine.
 *
 * Scale: 1 unit ≈ 35 mm, chosen so the ATX board and the graphics card come out
 * the same size here as the card does at its own scale.
 *
 * Orientation, looking through the open side of the tower:
 *   +X → the front of the case      −X → the rear panel
 *   +Y → up                         −Y → the floor of the case
 *   +Z → toward the viewer          −Z → the motherboard tray
 *
 * Board outline, the rear aperture and expansion-slot pitch follow the ATX
 * specification. Everything else — panel thicknesses, cooler size, drive
 * placement, cable routing — is an illustrative build, not a specific product.
 */

/** Millimetres to scene units. */
const mm = (v: number) => v / 35;

// ── ATX geometry, in units ────────────────────────────────────────────────
const BOARD_H = mm(305); //  8.71  vertical, along the rear panel
const BOARD_D = mm(244); //  6.97  front-to-back
const SLOT_PITCH = mm(20.32); // expansion slot spacing
const APERTURE_W = mm(158.75); // rear I/O aperture, along the board edge
const APERTURE_H = mm(44.45); // rear I/O aperture, off the board surface

// Case interior.
const REAR = -6.6;
const FRONT = 6.6;
const FLOOR = -6.5;
const ROOF = 6.5;
const TRAY = -2.95; // motherboard tray plane
const BOARD_Z = TRAY + 0.2; // board sits on standoffs
const GLASS = 3.15; // window panel plane

// Board placement: rear edge against the rear panel, top edge near the roof.
const BOARD_X0 = REAR + 0.42;
const BOARD_X = BOARD_X0 + BOARD_D / 2;
const BOARD_Y0 = -2.95;
const BOARD_Y = BOARD_Y0 + BOARD_H / 2;

/** The primary ×16 slot, and the card installed in it. */
const SLOT1_Y = BOARD_Y0 + mm(120);

/**
 * Lighting colours, swept front to back rather than scattered. Addressable
 * fans are usually run as one gradient across the build, and a gradient also
 * keeps the machine readable — a true rainbow flattens every surface it
 * touches into noise.
 */
const RGB = ['#2f6bff', '#7a3cff', '#c62ce0', '#ff3aa0'] as const;
const ACCENT = '#37d6ff';

/**
 * The board as one object, for the scale where the whole machine is on screen.
 * Parts stand off the surface properly so it reads in relief through the glass
 * rather than as a flat green rectangle. The motherboard scale rebuilds all of
 * this separately, at its own detail.
 */
/** Shared with the machine below so the board's accent matches the build. */
const BOARD_ACCENT = '#37d6ff';

export function buildMotherboardAssembly(tools: ModelTools) {
  const { box, material, label } = tools;
  const group = new T.Group();
  const put = (obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };

  put(box([BOARD_D, BOARD_H, 0.055], '#1d3a2b', 0.04, 0.004), [0, 0, 0]);

  // Rear I/O cover and the port stack showing through the case.
  put(box([0.5, APERTURE_W, APERTURE_H * 0.92], '#40474d', 0.66), [
    -BOARD_D / 2 + 0.25,
    BOARD_H / 2 - APERTURE_W / 2 - 0.2,
    APERTURE_H * 0.46 + 0.03,
  ]);
  const ioGlow = new T.Mesh(
    new T.PlaneGeometry(APERTURE_W * 0.82, 0.1),
    glowMaterial(BOARD_ACCENT, 1.7),
  );
  ioGlow.rotation.y = Math.PI / 2;
  ioGlow.rotation.z = Math.PI / 2;
  put(ioGlow, [
    -BOARD_D / 2 + 0.51,
    BOARD_H / 2 - APERTURE_W / 2 - 0.2,
    APERTURE_H * 0.46 + 0.03,
  ]);
  for (let i = 0; i < 9; i++)
    put(box([0.1, 0.3, 0.22], '#0e1112', 0.35), [
      -BOARD_D / 2 + 0.02,
      BOARD_H / 2 - 0.55 - i * 0.44,
      0.28 + (i % 2) * 0.46,
    ]);

  const socketX = -0.55,
    socketY = 1.55;
  put(box([mm(56), mm(56), 0.06], '#454b51', 0.72), [socketX, socketY, 0.05]);
  for (const side of [-1, 1]) {
    put(box([mm(60), 0.1, 0.2], '#a2aaae', 0.9), [socketX, socketY + side * mm(30), 0.13]);
    put(box([0.1, mm(60), 0.2], '#a2aaae', 0.9), [socketX + side * mm(30), socketY, 0.13]);
  }

  // Memory: four slots, two populated, standing off the board.
  for (let i = 0; i < 4; i++) {
    const x = socketX + mm(62) + i * mm(11);
    put(box([mm(7.4), mm(133), 0.2], i % 2 ? '#33383d' : '#4c545a', 0.14), [
      x,
      socketY + mm(6),
      0.11,
    ]);
    if (i % 2 === 1) {
      put(box([mm(6.6), mm(131), 0.86], '#6a747a', 0.86, 0.01), [x, socketY + mm(6), 0.58]);
      put(box([mm(7), mm(40), 0.08], '#9ba5ab', 0.92), [x, socketY + mm(6), 1.0]);
      // Frosted diffuser along the top of the heatspreader.
      const bar = new T.Mesh(
        new T.BoxGeometry(mm(5), mm(124), 0.07),
        glowMaterial(BOARD_ACCENT, 1.6),
      );
      put(bar, [x, socketY + mm(6), 1.02]);
    }
  }

  for (let i = 0; i < 4; i++) {
    const long = i === 0 || i === 2;
    put(box([long ? mm(89) : mm(25), mm(7.5), 0.2], i === 0 ? '#7d6a74' : '#3a4146', 0.14), [
      -BOARD_D / 2 + (long ? mm(58) : mm(26)),
      SLOT1_Y - BOARD_Y - i * SLOT_PITCH * 1.6,
      0.11,
    ]);
  }

  // Chipset block and the M.2 thermal covers.
  const chipset = buildBlockSink(material, mm(48), mm(48), 0.38, '#6d767c');
  chipset.rotation.x = Math.PI / 2;
  put(chipset, [mm(34), -mm(92), 0.22]);
  label(group, 'PCH', [mm(34), -mm(92), 0.46], mm(34), '#b6bec3');
  for (let i = 0; i < 2; i++)
    put(box([mm(88), mm(26), 0.18], '#737c82', 0.88), [-mm(18), -mm(30) - i * mm(64), 0.11]);

  // Regulator heatsinks: the tall finned blocks above and beside the socket.
  for (const [w, h, x, y, along] of [
    [mm(150), mm(30), socketX + mm(12), socketY + mm(78), true],
    [mm(28), mm(120), socketX - mm(70), socketY + mm(10), false],
  ] as const) {
    const sink = buildBlockSink(material, along ? w : h, along ? h : w, 0.56, '#646d73');
    sink.rotation.x = Math.PI / 2;
    if (!along) sink.rotation.z = Math.PI / 2;
    put(sink, [x, y, 0.3]);
  }

  const ramGlow = new T.PointLight(BOARD_ACCENT, 4.5, 4.5, 2);
  ramGlow.position.set(socketX + mm(74), socketY + mm(6), 1.5);
  group.add(ramGlow);

  put(box([mm(20), mm(52), 0.34], '#26292c', 0.1), [BOARD_D / 2 - mm(18), mm(30), 0.19]);
  put(box([mm(38), mm(16), 0.3], '#26292c', 0.1), [socketX - mm(4), BOARD_H / 2 - mm(16), 0.17]);

  // Scattered small parts, so the empty board area is not a flat plane.
  for (let i = 0; i < 16; i++) {
    const a = i * 2.39;
    const x = Math.cos(a) * (0.5 + (i % 7) * 0.36) + mm(10),
      y = Math.sin(a * 1.7) * (0.9 + (i % 5) * 0.52) - mm(20);
    if (i % 3 === 0) {
      const cap = buildCapacitor(material, mm(4), mm(11), '#232a2e');
      cap.rotation.x = Math.PI / 2;
      put(cap, [x, y, 0.18]);
    } else {
      const choke = buildChoke(material, mm(9), mm(7), '#2b2f33');
      choke.rotation.x = Math.PI / 2;
      put(choke, [x, y, 0.13]);
    }
  }
  return group;
}

export function buildMachine(tools: ModelTools, _root: T.Group) {
  const { add, instances, box, material, label } = tools;
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };

  // ── Chassis frame ───────────────────────────────────────────────────────
  const frame = new T.Group();
  const steel = '#474e54';
  for (const [w, h, cy] of [
    [FRONT - REAR, 2.0, ROOF - 1.0],
    [FRONT - REAR, 2.2, FLOOR + 1.1],
  ] as const)
    place(frame, box([w, h, 0.09], steel, 0.76), [(FRONT + REAR) / 2, cy, TRAY]);
  place(frame, box([2.4, ROOF - FLOOR, 0.09], steel, 0.76), [REAR + 1.2, 0, TRAY]);
  place(frame, box([2.0, ROOF - FLOOR, 0.09], steel, 0.76), [FRONT - 1.0, 0, TRAY]);
  place(frame, box([1.5, 3.4, 0.09], steel, 0.76), [1.6, -1.2, TRAY]);
  place(frame, box([FRONT - REAR, 0.1, 6.3], '#3f464b', 0.8), [(FRONT + REAR) / 2, FLOOR, 0]);
  place(frame, box([FRONT - REAR, 0.1, 6.3], steel, 0.76), [(FRONT + REAR) / 2, ROOF, 0]);
  place(frame, box([0.12, ROOF - FLOOR, 6.3], steel, 0.76), [FRONT, 0, 0]);

  const apertureTop = BOARD_Y + BOARD_H / 2;
  place(frame, box([0.12, ROOF - apertureTop, 6.3], steel, 0.78), [
    REAR,
    (ROOF + apertureTop) / 2,
    0,
  ]);
  place(frame, box([0.12, 1.2, 6.3], steel, 0.78), [REAR, FLOOR + 0.6, 0]);
  place(frame, box([0.12, apertureTop - APERTURE_W - (FLOOR + 1.2), 3.0], steel, 0.78), [
    REAR,
    (apertureTop - APERTURE_W + FLOOR + 1.2) / 2,
    -1.6,
  ]);
  place(frame, box([0.12, ROOF - FLOOR, 1.1], steel, 0.78), [REAR, 0, GLASS - 0.6]);
  // Strip down the front-inner corner post, against the upright above rather
  // than hanging in open space in the middle of the case.
  const pillar = buildLightStrip(ROOF - FLOOR - 1.2, 0.11, RGB[0], 1.9);
  // rotation.z alone stands the strip on end; adding a second axis lays it
  // diagonally across the shroud.
  pillar.rotation.z = Math.PI / 2;
  place(frame, pillar, [FRONT - 0.22, 0.2, 2.86]);
  const pillarGlow = new T.PointLight(RGB[0], 7, 9, 2);
  pillarGlow.position.set(FRONT - 1.4, 1.2, 2.0);
  frame.add(pillarGlow);
  add('chassis', frame, [0, 0, 0], [0, 0, -2.2]);

  const covers: Vec3[] = [];
  for (let i = 0; i < 7; i++)
    covers.push([REAR + 0.12, SLOT1_Y - i * SLOT_PITCH, -0.55]);
  instances('chassis', covers, [0.1, SLOT_PITCH * 0.9, 1.9], 0, '#5b6268');

  // Rear I/O aperture frame.
  const aperture = new T.Group();
  const apY = apertureTop - APERTURE_W / 2 - 0.2;
  for (const s of [-1, 1])
    place(aperture, box([0.07, 0.16, APERTURE_H + 0.3], '#6b7377', 0.86), [
      0,
      apY + s * (APERTURE_W / 2 + 0.08),
      APERTURE_H / 2,
    ]);
  for (const s of [-1, 1])
    place(aperture, box([0.07, APERTURE_W + 0.3, 0.16], '#6b7377', 0.86), [
      0,
      apY,
      APERTURE_H / 2 + s * (APERTURE_H / 2 + 0.08),
    ]);
  add('ioshield', aperture, [REAR + 0.06, 0, 0], [-1.8, 0, 0]);

  const standoffs: Vec3[] = [];
  for (const gx of [-mm(100), mm(6), mm(112)])
    for (const gy of [-mm(130), mm(0), mm(132)])
      standoffs.push([BOARD_X + gx, BOARD_Y + gy, TRAY + 0.1]);
  instances('boardstandoff', standoffs, [0.14, 0.14, 0.2], 0, '#9ba3a7');

  // ── Panels ──────────────────────────────────────────────────────────────
  const glass = new T.MeshPhysicalMaterial({
    color: '#79878f',
    metalness: 0,
    roughness: 0.04,
    transmission: 0.95,
    thickness: 0.14,
    transparent: true,
    opacity: 0.2,
    ior: 1.5,
  });
  const windowPanel = new T.Group();
  windowPanel.add(
    new T.Mesh(
      new T.BoxGeometry(FRONT - REAR - 0.3, ROOF - FLOOR - 0.3, 0.06),
      glass,
    ),
  );
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      place(windowPanel, buildScrew(material, 0.075), [
        (sx * (FRONT - REAR - 0.9)) / 2,
        (sy * (ROOF - FLOOR - 0.9)) / 2,
        0.06,
      ]);
  // Up and out, not straight at the camera: a 13-unit pane travelling toward
  // the viewer parks itself in front of everything it was covering.
  add('sidepanel', windowPanel, [(FRONT + REAR) / 2, 0, GLASS], [0, 3.1, 3.4]);

  const backPanel = new T.Group();
  place(backPanel, box([FRONT - REAR - 0.3, ROOF - FLOOR - 0.3, 0.08], '#3d4449', 0.8), [0, 0, 0]);
  add('sidepanel', backPanel, [(FRONT + REAR) / 2, 0, TRAY - 0.62], [0, -1.4, -4.8]);

  // Front panel: dark mesh intake over the fan wall, with the power button.
  const front = new T.Group();
  // A real mesh panel is mostly hole. Modelling ~700 apertures is too costly,
  // so the backing sheet is rendered see-through and the stamped webbing sits
  // in front of it: from outside you read a mesh, and the lit intake fans
  // behind it show through the way they do on a real build.
  const screen = new T.Mesh(
    new T.BoxGeometry(0.06, ROOF - FLOOR + 0.2, 6.5),
    new T.MeshPhysicalMaterial({
      color: '#1b2023',
      metalness: 0.3,
      roughness: 0.62,
      transparent: true,
      opacity: 0.34,
      side: T.DoubleSide,
    }),
  );
  front.add(screen);
  place(front, box([0.16, ROOF - FLOOR + 0.2, 0.22], '#3b4247', 0.7), [0, 0, 3.24]);
  place(front, box([0.16, ROOF - FLOOR + 0.2, 0.22], '#3b4247', 0.7), [0, 0, -3.24]);
  place(front, box([0.16, 0.22, 6.5], '#3b4247', 0.7), [0, (ROOF - FLOOR) / 2, 0]);
  place(front, box([0.16, 0.22, 6.5], '#3b4247', 0.7), [0, -(ROOF - FLOOR) / 2, 0]);
  const perf = new T.BoxGeometry(0.09, 0.055, 0.055);
  const perfMaterial = material('#252c30', 0.5, 0.5);
  for (let r = 0; r < 46; r++)
    for (let c = 0; c < 27; c++) {
      const web = new T.Mesh(perf, perfMaterial);
      web.position.set(0.06, (r - 22.5) * 0.27, (c - 13) * 0.23 + (r % 2 ? 0.115 : 0));
      front.add(web);
    }
  place(front, box([0.14, 0.42, 0.42], '#6d757b', 0.88), [0.18, ROOF - 0.9, 2.2]);
  place(front, box([0.16, 0.1, 0.34], '#1b1e20', 0.5), [0.2, ROOF - 1.5, 2.2]);
  add('frontpanel', front, [FRONT + 0.16, 0, 0], [4.2, 1.5, 0]);

  // Top panel: vented lid.
  const top = new T.Group();
  place(top, box([FRONT - REAR + 0.2, 0.14, 6.5], '#40474d', 0.74), [0, 0, 0]);
  for (let i = 0; i < 20; i++)
    place(top, box([0.42, 0.07, 4.6], '#121516', 0.42), [(i - 9.5) * 0.6, 0.05, 0]);
  add('toppanel', top, [(FRONT + REAR) / 2, ROOF + 0.14, 0], [0, 4.4, 0]);

  // Power supply shroud.
  const shroud = new T.Group();
  place(shroud, box([FRONT - REAR - 0.6, 0.12, 5.9], '#3c4349', 0.72), [0, 0, 0]);
  place(shroud, box([0.12, 1.4, 5.9], '#3c4349', 0.72), [(FRONT - REAR) / 2 - 0.4, -0.7, 0]);
  for (let i = 0; i < 9; i++)
    place(shroud, box([0.3, 0.06, 2.6], '#131617', 0.42), [-3.6 + i * 0.42, 0.07, 1.2]);
  // Brushed top plate and a chamfered lip, so the biggest flat surface in the
  // machine is not one bare rectangle from the front three-quarter view.
  place(shroud, box([FRONT - REAR - 1.6, 0.04, 4.6], '#4a5259', 0.86), [0, 0.09, -0.5]);
  place(shroud, box([FRONT - REAR - 0.6, 0.16, 0.2], '#525a61', 0.88), [0, 0.02, 2.92]);
  const shroudStrip = buildLightStrip(FRONT - REAR - 1.4, 0.12, ACCENT, 2.3);
  place(shroud, shroudStrip, [0, 0.02, 2.78]);
  const shroudGlow = new T.PointLight(ACCENT, 7, 7.5, 2);
  shroudGlow.position.set(0.4, 0.6, 2.2);
  shroud.add(shroudGlow);
  add('psushroud', shroud, [(FRONT + REAR) / 2 + 0.3, FLOOR + 2.85, -0.2], [0, 2.6, 0]);

  // Drive cage.
  const cage = new T.Group();
  for (const sy of [-1, 1])
    place(cage, box([2.7, 0.07, 4.4], '#4e565b', 0.8), [0, sy * 0.95, 0]);
  for (const sz of [-1, 1])
    place(cage, box([2.7, 1.9, 0.07], '#4e565b', 0.8), [0, 0, sz * 2.1]);
  add('drivecage', cage, [FRONT - 2.2, FLOOR + 1.5, -0.3], [1.6, 0, 0]);

  // ── Storage ─────────────────────────────────────────────────────────────
  const hdd = new T.Group();
  place(hdd, box([mm(147), mm(26), mm(102)], '#959da1', 0.92, 0.01), [0, 0, 0]);
  place(hdd, box([mm(120), 0.02, mm(80)], '#a9b1b5', 0.94), [0, mm(14), 0]);
  place(hdd, box([mm(40), mm(6), mm(30)], '#2d3134', 0.3), [mm(48), -mm(14), mm(30)]);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      place(hdd, buildScrew(material, mm(2.4)), [sx * mm(62), mm(13.5), sz * mm(40)]);
  label(hdd, '3.5" HDD', [0, mm(15), 0], 1.2, '#40464a');
  add('hdd', hdd, [FRONT - 2.2, FLOOR + 0.95, -0.3], [1.9, -0.4, 0]);

  const ssd = new T.Group();
  place(ssd, box([mm(100), mm(7), mm(70)], '#565e64', 0.84, 0.01), [0, 0, 0]);
  label(ssd, 'SATA SSD', [0, mm(4.2), 0], 0.9, '#a2aaae');
  add('ssd', ssd, [FRONT - 2.2, FLOOR + 1.95, -0.3], [1.9, 0.4, 0]);

  // ── Power supply ────────────────────────────────────────────────────────
  const psu = new T.Group();
  const pw = mm(160),
    ph = mm(86),
    pd = mm(150);
  place(psu, box([pw, ph, pd], '#42484e', 0.76, 0.012), [0, 0, 0]);

  // Bottom intake: fan behind a wire guard, drawing through the floor filter.
  const psuFan = buildFan(material, {
    size: mm(135),
    phase: 0.4,
    blades: 11,
    frameColor: '#363c41',
    guard: true,
  });
  psuFan.rotation.x = Math.PI;
  place(psu, psuFan, [0, -ph / 2 + mm(14), 0]);

  // Rear face: hex exhaust grille, mains inlet and switch.
  const grille = buildHoneycomb(material, ph * 0.82, pd * 0.62, 0.04, mm(5), '#3c4247');
  grille.rotation.y = Math.PI / 2;
  grille.rotation.z = Math.PI / 2;
  place(psu, grille, [-pw / 2 - 0.01, mm(4), -mm(28)]);
  const inlet = buildMainsInlet(material, mm(26));
  inlet.rotation.y = -Math.PI / 2;
  place(psu, inlet, [-pw / 2 - 0.04, -mm(20), mm(38)]);
  place(psu, box([0.08, mm(16), mm(22)], '#6b7378', 0.8), [-pw / 2 - 0.04, mm(10), mm(38)]);

  // Front face: the modular connector panel, facing into the case.
  const panel = buildModularPanel(material, ph * 0.86, pd * 0.5, 0.09);
  panel.rotation.y = Math.PI / 2;
  panel.rotation.z = Math.PI / 2;
  place(psu, panel, [pw / 2 + 0.02, 0, 0]);

  for (const sy of [-1, 1])
    for (const sz of [-1, 1])
      place(psu, buildScrew(material, mm(3)), [
        -pw / 2 - 0.02,
        sy * (ph / 2 - mm(9)),
        sz * (pd / 2 - mm(9)),
      ]);
  label(psu, 'ATX POWER SUPPLY', [0, ph / 2 + 0.01, -mm(20)], 2.2, '#878f94');
  add('psu', psu, [REAR + mm(100), FLOOR + mm(46), -0.4], [-1.2, -2.4, 0]);

  // Cable looms from the supply up to the board and the card.
  const cables = new T.Group();
  const loom = (points: Vec3[], radius: number, color: string) => {
    const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p)));
    cables.add(
      new T.Mesh(
        new T.TubeGeometry(curve, 26, radius, 7, false),
        material(color, 0.16, 0.7),
      ),
    );
  };
  loom(
    [
      [REAR + 1.4, FLOOR + 1.3, -1.2],
      [REAR + 0.8, FLOOR + 3.2, -2.3],
      [REAR + 0.9, 1.4, -2.6],
      [BOARD_X + BOARD_D / 2 - 0.2, mm(30) + BOARD_Y, TRAY + 0.5],
    ],
    0.14,
    '#1f2325',
  );
  loom(
    [
      [REAR + 1.2, FLOOR + 1.4, -1.6],
      [REAR + 0.7, 3.0, -2.6],
      [REAR + 0.9, ROOF - 1.0, -2.4],
      [BOARD_X - 0.5, BOARD_Y + BOARD_H / 2 - 0.3, TRAY + 0.45],
    ],
    0.1,
    '#1f2325',
  );
  loom(
    [
      [REAR + 2.0, FLOOR + 1.3, -0.6],
      [REAR + 2.6, FLOOR + 3.4, 1.2],
      [-1.0, SLOT1_Y + 1.4, 1.4],
      [-0.2, SLOT1_Y + 0.42, 0.2],
    ],
    0.12,
    '#292d31',
  );
  // Two sleeved runs that come up over the shroud in plain sight, rather than
  // only behind the tray where the window never shows them.
  loom(
    [
      [2.6, FLOOR + 2.95, 1.4],
      [1.4, FLOOR + 3.6, 1.9],
      [0.2, BOARD_Y + mm(10), 0.9],
      [BOARD_X + BOARD_D / 2 - 0.3, BOARD_Y + mm(28), TRAY + 0.6],
    ],
    0.16,
    '#16191b',
  );
  loom(
    [
      [3.4, FLOOR + 2.95, 0.4],
      [2.2, FLOOR + 3.4, 1.2],
      [0.6, SLOT1_Y - 0.2, 1.5],
      [-0.4, SLOT1_Y + 0.36, 0.3],
    ],
    0.13,
    '#1d2124',
  );
  add('psucable', cables, [0, 0, 0], [0, -1.4, 1.2], 0.02);

  // ── Motherboard ─────────────────────────────────────────────────────────
  add('motherboard', buildMotherboardAssembly(tools), [BOARD_X, BOARD_Y, BOARD_Z], [0, 0, -3.2]);

  // ── Processor cooler ────────────────────────────────────────────────────
  const cooler = new T.Group();
  const coolerX = BOARD_X - 0.55,
    coolerY = BOARD_Y + 1.55;
  // Machined base block, clamped to the socket.
  place(cooler, box([mm(54), mm(54), mm(12)], '#b6bec2', 0.94), [0, 0, -mm(40)]);
  place(cooler, box([mm(64), mm(10), mm(6)], '#8d9599', 0.9), [0, mm(30), -mm(40)]);
  place(cooler, box([mm(64), mm(10), mm(6)], '#8d9599', 0.9), [0, -mm(30), -mm(40)]);
  // Heat pipes leaving the base and turning up into the fin stack.
  for (const sx of [-1.5, -0.5, 0.5, 1.5]) {
    const pipe = new T.Mesh(
      new T.CylinderGeometry(mm(3.1), mm(3.1), mm(112), 14),
      material('#b8834e', 0.94, 0.24),
    );
    pipe.rotation.x = Math.PI / 2;
    place(cooler, pipe, [sx * mm(13), 0, mm(16)]);
  }
  const stack = buildFinStack(material, 48, [mm(122), 0.022, mm(108)], mm(2.05), '#c3cace');
  stack.rotation.x = Math.PI / 2;
  place(cooler, stack, [0, 0, mm(20)]);
  place(cooler, box([mm(126), mm(4), mm(112)], '#9aa2a6', 0.92), [0, mm(62), mm(20)]);
  const coolerFan = buildFan(material, {
    size: mm(120),
    phase: 1.1,
    pads: true,
    cable: true,
    frameColor: '#25292d',
    rgb: RGB[1],
  });
  coolerFan.rotation.z = Math.PI / 2;
  place(cooler, coolerFan, [mm(76), 0, mm(20)]);
  // Lit top cap, which is where tower coolers carry their light.
  place(cooler, box([mm(120), mm(2), mm(106)], '#14171a', 0.2), [0, mm(64), mm(20)]);
  const capGlow = new T.Mesh(
    new T.PlaneGeometry(mm(104), mm(92)),
    glowMaterial(RGB[1], 1.15, 0.85),
  );
  capGlow.rotation.x = -Math.PI / 2;
  place(cooler, capGlow, [0, mm(65.4), mm(20)]);
  const coolerSpill = new T.PointLight(RGB[1], 5, 5.5, 2);
  coolerSpill.position.set(0, mm(74), mm(20));
  cooler.add(coolerSpill);
  add('cpucooler', cooler, [coolerX, coolerY, BOARD_Z + 0.1], [0, 0, 3.4]);

  // ── Case fans ───────────────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const fan = buildFan(material, {
      size: mm(120),
      phase: i * 0.7,
      pads: true,
      cable: true,
      rgb: RGB[i],
    });
    fan.rotation.z = Math.PI / 2;
    const spill = new T.PointLight(RGB[i], 12, 9, 2);
    spill.position.set(0, -0.5, 0); // just inside the case, past the frame
    fan.add(spill);
    add('casefan', fan, [FRONT - 0.55, -3.0 + i * mm(125), 0], [3.4, 0, 0]);
  }
  const exhaust = buildFan(material, {
    size: mm(120),
    phase: 2.2,
    pads: true,
    cable: true,
    guard: true,
    rgb: RGB[3],
  });
  exhaust.rotation.z = -Math.PI / 2;
  const exhaustSpill = new T.PointLight(RGB[3], 6, 6, 2);
  exhaustSpill.position.set(0, -0.5, 0);
  exhaust.add(exhaustSpill);
  add('casefan', exhaust, [REAR + 0.55, apertureTop - APERTURE_W - 0.4, 1.1], [-3.4, 0, 0]);

  // ── Graphics card, in the primary slot ──────────────────────────────────
  const card = new T.Group();
  // Authored PCB-up / cooler-down, which is how a card sits in a tower.
  const cardLen = mm(304),
    cardWide = mm(112);
  place(card, box([cardLen - 0.15, 0.05, cardWide - 0.1], '#4e565d', 0.88), [0, mm(20), 0]);
  place(card, box([cardLen, 0.06, cardWide], '#1d3a2b', 0.05), [0, mm(13), 0]);
  place(card, box([cardLen, mm(34), cardWide], '#414951', 0.72, 0.02), [0, -mm(6), 0]);
  for (let i = 0; i < 2; i++) {
    const fan = buildFan(material, {
      size: mm(95),
      phase: i * 0.9,
      blades: 11,
      frameColor: '#31373d',
    });
    fan.rotation.x = Math.PI; // pulls air up through the cooler
    place(card, fan, [(i - 0.5) * mm(130), -mm(24), 0]);
  }
  place(card, box([0.07, mm(112), mm(19)], '#9ba3a7', 0.9), [
    -cardLen / 2 - 0.05,
    -mm(6),
    -cardWide / 2 + mm(22),
  ]);
  for (let i = 0; i < 3; i++)
    place(card, box([0.1, mm(18), mm(8)], '#121516', 0.4), [
      -cardLen / 2 - 0.09,
      -mm(30) + i * mm(24),
      -cardWide / 2 + mm(22),
    ]);
  place(card, box([mm(28), mm(12), mm(16)], '#1b1e20', 0.12), [
    mm(40),
    mm(26),
    cardWide / 2 - mm(20),
  ]);
  // Lit logo bar along the side that faces the window.
  place(card, box([mm(150), mm(7), mm(2)], '#111416', 0.2), [
    mm(10),
    mm(4),
    cardWide / 2 + mm(1),
  ]);
  const cardLogo = new T.Mesh(
    new T.PlaneGeometry(mm(138), mm(4.4)),
    glowMaterial(ACCENT, 1.9),
  );
  cardLogo.position.set(mm(10), mm(4), cardWide / 2 + mm(2.4));
  card.add(cardLogo);
  const cardSpill = new T.PointLight(ACCENT, 5.5, 5.5, 2);
  cardSpill.position.set(mm(10), mm(16), cardWide / 2 + mm(20));
  card.add(cardSpill);
  // Cut-outs in the backplate, which break up the top face.
  for (let i = 0; i < 5; i++)
    place(card, box([mm(26), 0.02, mm(52)], '#232a2f', 0.5), [
      mm(-100 + i * 50),
      mm(21),
      -mm(18),
    ]);
  label(card, 'GEFORCE RTX', [mm(10), mm(23), cardWide / 2 - mm(34)], 1.9, '#9aa4ad');
  add(
    'graphicscard',
    card,
    [REAR + 0.24 + cardLen / 2, SLOT1_Y + mm(24), BOARD_Z + cardWide / 2 + 0.14],
    [0, 0, 3.0],
  );
}
