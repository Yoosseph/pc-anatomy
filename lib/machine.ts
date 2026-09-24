import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import {
  buildLightStrip,
  buildFan,
  buildFinStack,
  buildHoneycomb,
  buildMainsInlet,
  buildModularPanel,
  buildScrew,
  glowMaterial,
} from './parts.ts';
import { buildChassis, plateWithHoles, type CaseShell } from './chassis.ts';
import { cardStack } from './graphics-card.ts';
import { finishes, type Finish } from './materials.ts';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
 * specification. Everything else (panel thicknesses, cooler size, drive
 * placement, cable routing) is an illustrative build, not a specific product.
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
// Behind the tray: the cable chamber, closed by the solid side panel. A tower
// of this shape is two rooms, and the run that feeds the processor only has
// anywhere to hide because this one exists.
const BACK = -3.95;

// Board placement: rear edge against the rear panel, top edge near the roof.
const BOARD_X0 = REAR + 0.42;
const BOARD_X = BOARD_X0 + BOARD_D / 2;
const BOARD_Y0 = -2.95;
const BOARD_Y = BOARD_Y0 + BOARD_H / 2;

/** The primary ×16 slot, and the card installed in it. */
const SLOT1_Y = BOARD_Y - mm(32);
/** The 8-pin processor power connector, near the board's top rear corner. */
const EPS_X = BOARD_X - mm(73);

/**
 * Lighting colours, swept front to back rather than scattered. Addressable
 * fans are usually run as one gradient across the build, and a gradient also
 * keeps the machine readable. A true rainbow flattens every surface it
 * touches into noise.
 */
const RGB = ['#2f6bff', '#7a3cff', '#c62ce0', '#ff3aa0'] as const;
const ACCENT = '#37d6ff';

/**
 * The rear exhaust fan's centre. Its frame sits against the inside of the rear
 * panel, behind the panel's own grille: it used to be half a frame further
 * out, through the steel.
 */
const EXHAUST: Vec3 = [REAR + 0.64, 4.0, 0.75];

/** The inspection model installed vertically at the tower's physical scale. */
export function buildMotherboardAssembly(tools: ModelTools) {
  const board = tools.assembly('motherboard');
  board.scale.setScalar(22 / 35);
  board.rotation.x = Math.PI / 2;
  const group = new T.Group();
  group.add(board);
  return group;
}

export function buildMachine(tools: ModelTools, root: T.Group) {
  const { add, airflow, instances, material, label } = tools;
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };
  /**
   * The surface the tower stands on.
   *
   * A machine drawn against nothing floats, and floating is most of why the
   * old render read as a model rather than as a photograph of a machine. This
   * catches the key light's shadow and nothing else, so the background stays
   * transparent and all that appears under the case is the contact shadow its
   * own feet cast. It is scenery rather than a part, which is what
   * `contextFrame` marks: it is never selected, named or laid out.
   */
  const ground = new T.Mesh(
    new T.PlaneGeometry(60, 60),
    new T.ShadowMaterial({ opacity: 0.42 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = FLOOR - 0.41;
  ground.receiveShadow = true;
  ground.userData.contextFrame = true;
  root.add(ground);

  const finish = finishes();
  /**
   * A part made in a named finish rather than in a colour.
   *
   * `box` takes a colour and a metalness and gives everything the same grain
   * and the same roughness, which is why the shroud, the supply, the cage and
   * the card all used to look moulded from one grey polymer. Asking for the
   * finish instead - powder-coated steel, anodised aluminium, moulded ABS -
   * carries the grain and the highlight that tell those materials apart.
   */
  const slab = (size: Vec3, kind: Finish, color?: string, radius = 0.014) =>
    new T.Mesh(
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(radius, Math.min(...size) * 0.45),
      ),
      finish(kind, color),
    );

  // ── Chassis ─────────────────────────────────────────────────────────────
  //
  // The shell, its panels and its cut-outs are built in `chassis.ts`, from the
  // openings the parts below actually need. Everything it is given here is a
  // measurement taken from a component, not a styling number: the I/O window
  // is where the board's port stack is, the slot cut-outs are on the ATX slot
  // pitch, and the supply's opening is the size of the supply.
  const shell: CaseShell = {
    REAR,
    FRONT,
    FLOOR,
    ROOF,
    TRAY,
    GLASS,
    BACK,
    io: {
      y: BOARD_Y + BOARD_H / 2 - APERTURE_W / 2 - 0.2,
      z: BOARD_Z + APERTURE_H * 0.46,
      up: APERTURE_W,
      across: APERTURE_H,
    },
    slotY: SLOT1_Y,
    slotZ: BOARD_Z + 1.55,
    slotPitch: SLOT_PITCH,
    slots: 7,
    psu: {
      y: FLOOR + mm(46),
      z: -0.4,
      up: mm(86) + 0.1,
      across: mm(150) + 0.1,
    },
    psuX: REAR + mm(100),
    exhaust: { y: EXHAUST[1], z: EXHAUST[2], size: mm(120) },
    // Above the board's top edge, over the 8-pin connector it feeds.
    eps: {
      x: EPS_X + 0.1,
      y: BOARD_Y + BOARD_H / 2 + 0.26,
      width: 1.3,
      height: 0.32,
    },
    accent: ACCENT,
  };
  buildChassis(tools, finish, shell);

  const standoffs: Vec3[] = [];
  for (const gx of [-mm(100), mm(6), mm(112)])
    for (const gy of [-mm(130), mm(0), mm(132)])
      standoffs.push([BOARD_X + gx, BOARD_Y + gy, TRAY + 0.1]);
  instances('boardstandoff', standoffs, [0.14, 0.14, 0.2], 0, '#9ba3a7');

  // A light column down the inner face of the front corner post.
  const pillar = buildLightStrip(ROOF - FLOOR - 1.6, 0.11, RGB[0], 1.9);
  pillar.rotation.z = Math.PI / 2;
  const pillarGroup = new T.Group();
  pillarGroup.add(pillar);
  const pillarGlow = new T.PointLight(RGB[0], 8, 9, 2);
  pillarGlow.position.set(-1.0, 1.2, -0.6);
  pillarGroup.add(pillarGlow);
  add('chassis', pillarGroup, [FRONT - 0.62, 0.2, GLASS - 0.62], [2.2, 0, 2.2]);

  // Power supply shroud.
  // Ends at the intake fan wall, not through it: the deck used to reach past
  // the front fans, so the lit ring of the bottom one came out of its top face.
  const SHROUD_W = FRONT - REAR - 1.6;
  const SHROUD_D = 5.9;
  const shroud = new T.Group();

  /**
   * The deck, cut rather than plain.
   *
   * One unbroken sheet eleven units across was the largest flat surface in the
   * machine and had nothing on it, so it read as a moulded tray and dragged
   * everything standing on it down with it. A real deck is cut: a long vent
   * under the card, because the card's fans face down into it and would
   * otherwise be breathing against a closed lid, and a grommeted pass-through
   * where the supply's leads come up. Both are holes the build actually needs,
   * and between them they break the plane into something with structure.
   */
  const deckHoles: [number, number, number, number][] = [
    [5.0, 2.0, -1.4, -0.2], // vent under the graphics card
    [1.1, 1.5, 3.9, 1.4], // cable pass-through
  ];
  // The deck stops at the tray. It used to be centred on the shroud and so
  // ran a few millimetres back through the tray into the cable chamber.
  const SHROUD_Z = -0.2;
  const deckBack = TRAY + 0.06 - SHROUD_Z,
    deckFront = SHROUD_D / 2;
  const deckMid = (deckBack + deckFront) / 2;
  for (const [w, h, cx, cz] of plateWithHoles(
    SHROUD_W,
    deckFront - deckBack,
    deckHoles.map(([w, h, x, z]) => [w, h, x, z - deckMid]),
  ))
    place(shroud, slab([w, 0.12, h], 'steel'), [cx, 0, cz + deckMid]);
  // A grommet round the cable hole and a returned lip round the vent, so both
  // openings have an edge instead of stopping dead in the sheet.
  for (const [index, [w, h, cx, cz]] of deckHoles.entries()) {
    const trim: Finish = index ? 'rubber' : 'steel';
    for (const sx of [-1, 1])
      place(
        shroud,
        slab([0.11, 0.16, h + 0.18], trim, index ? undefined : '#2e353a'),
        [cx + (sx * (w + 0.09)) / 2, 0.02, cz],
      );
    for (const sz of [-1, 1])
      place(
        shroud,
        slab([w + 0.18, 0.16, 0.11], trim, index ? undefined : '#2e353a'),
        [cx, 0.02, cz + (sz * (h + 0.09)) / 2],
      );
  }
  // A honeycomb screen across the vent: the card breathes through it, and it
  // is the one place in the lower half of this machine with any fine detail.
  const deckVent = buildHoneycomb(material, 4.9, 1.9, 0.03, 0.14, '#1b1f22');
  deckVent.rotation.x = -Math.PI / 2;
  place(shroud, deckVent, [-1.4, 0.01, -0.2]);

  // The front wall of the deck, and the louvres over the supply's own air.
  place(shroud, slab([0.12, 1.4, 5.3], 'steel'), [SHROUD_W / 2, -0.7, 0.1]);
  for (let i = 0; i < 7; i++)
    place(shroud, slab([0.28, 0.07, 1.5], 'plastic', '#0c0e0f'), [
      -4.6 + i * 0.42,
      0.06,
      2.05,
    ]);
  // A brushed inlay along the window edge and a chamfered lip carrying the
  // light strip, so the deck has a front face and not just a cut edge.
  place(
    shroud,
    slab([SHROUD_W - 1.0, 0.05, 0.9], 'anodized', '#2a3136'),
    [0, 0.1, 2.28],
  );
  place(
    shroud,
    slab([SHROUD_W, 0.17, 0.2], 'anodizedLight', '#7d868c'),
    [0, 0.02, 2.92],
  );
  const shroudStrip = buildLightStrip(SHROUD_W - 0.8, 0.12, ACCENT, 2.3);
  place(shroud, shroudStrip, [0, 0.02, 2.78]);
  const shroudGlow = new T.PointLight(ACCENT, 7, 7.5, 2);
  shroudGlow.position.set(0.4, 0.6, 2.2);
  shroud.add(shroudGlow);
  // Sits high enough that a loom fits between it and the top of the supply.
  add(
    'psushroud',
    shroud,
    [(FRONT + REAR) / 2 - 0.2, FLOOR + 3.0, SHROUD_Z],
    // Out toward the window, and only a little up: lifting it straight up
    // drove it into the underside of the graphics card on its way out.
    [0, 0.3, 4.2],
  );

  // Compact 2.5-inch SSD tray, stood back from the intake fans with its keyed
  // data and power edge facing the cable channel.
  const CAGE_X = 3.3,
    CAGE_W = mm(112),
    CAGE_D = mm(82);
  const cage = new T.Group();
  place(cage, slab([CAGE_W, 0.07, CAGE_D], 'steel', '#262b2f'), [0, -0.1, 0]);
  for (const sz of [-1, 1])
    place(cage, slab([CAGE_W, 0.4, 0.07], 'steel', '#262b2f'), [
      0,
      0.1,
      (sz * CAGE_D) / 2,
    ]);
  for (const sx of [-1, 1])
    place(cage, slab([0.08, 0.4, CAGE_D], 'steel', '#262b2f'), [
      (sx * CAGE_W) / 2,
      0.1,
      0,
    ]);
  // Folded legs and mounting feet tie the tray to the case floor.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      place(cage, slab([0.16, 0.65, 0.16], 'steel', '#262b2f'), [
        (sx * (CAGE_W - 0.4)) / 2,
        -0.42,
        (sz * (CAGE_D - 0.3)) / 2,
      ]);
      place(cage, slab([0.42, 0.08, 0.42], 'steel', '#262b2f'), [
        (sx * (CAGE_W - 0.4)) / 2,
        -0.75,
        (sz * (CAGE_D - 0.3)) / 2,
      ]);
    }
  add('drivecage', cage, [CAGE_X, FLOOR + 0.8, -0.3], [1.6, 0, 0]);

  // ── Storage ─────────────────────────────────────────────────────────────
  const ssd = new T.Group();
  place(
    ssd,
    slab([mm(100), mm(7), mm(70)], 'anodized', '#32383d', 0.01),
    [0, 0, 0],
  );
  place(ssd, slab([mm(88), mm(1), mm(58)], 'anodizedLight', '#6f777d'), [
    0,
    mm(3.8),
    0,
  ]);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      place(ssd, buildScrew(material, mm(1.4)), [
        sx * mm(43),
        mm(4.1),
        sz * mm(28),
      ]);
  // Separate 7-pin data and 15-pin power sockets on the cable-facing edge.
  place(ssd, slab([mm(16), mm(4), mm(6)], 'plasticGloss', '#111416'), [
    mm(30),
    0,
    mm(36),
  ]);
  place(ssd, slab([mm(28), mm(4), mm(6)], 'plasticGloss', '#111416'), [
    mm(6),
    0,
    mm(36),
  ]);
  label(ssd, 'SATA SSD', [0, mm(4.6), 0], 0.9, '#aeb6bb');
  add('ssd', ssd, [CAGE_X, FLOOR + 1.0, -0.3], [1.9, 0.4, 0]);

  // ── Power supply ────────────────────────────────────────────────────────
  const psu = new T.Group();
  const pw = mm(150),
    ph = mm(86),
    pd = mm(150);
  place(psu, slab([pw, ph, pd], 'steel', '#1c2023', 0.012), [0, 0, 0]);
  // The fold line down each side of the wrap, which is how the sheet is made.
  for (const sz of [-1, 1])
    place(psu, slab([pw + 0.005, mm(3), mm(3)], 'steel', '#2b3134'), [
      0,
      ph / 2 - mm(3),
      (sz * pd) / 2,
    ]);

  // Bottom intake: fan behind a wire guard, drawing through the floor filter.
  const psuFan = buildFan(material, {
    size: mm(135),
    phase: 0.4,
    blades: 11,
    frameColor: '#15181a',
    guard: true,
  });
  psuFan.rotation.x = Math.PI;
  place(psu, psuFan, [0, -ph / 2 + mm(24), 0]);

  // Rear face: hex exhaust grille, mains inlet and switch.
  const grille = buildHoneycomb(
    material,
    ph * 0.82,
    pd * 0.62,
    0.04,
    mm(5),
    '#23282b',
  );
  grille.rotation.y = Math.PI / 2;
  grille.rotation.z = Math.PI / 2;
  place(psu, grille, [-pw / 2 - 0.01, mm(4), -mm(28)]);
  const inlet = buildMainsInlet(material, mm(26));
  inlet.rotation.y = -Math.PI / 2;
  place(psu, inlet, [-pw / 2 - 0.04, -mm(20), mm(38)]);
  place(psu, slab([0.08, mm(16), mm(22)], 'plasticGloss', '#1a1d1f'), [
    -pw / 2 - 0.04,
    mm(10),
    mm(38),
  ]);

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
  label(
    psu,
    'TUF GAMING 850W GOLD',
    [0, ph / 2 + 0.01, -mm(20)],
    2.2,
    '#9d9b8e',
  );
  add('psu', psu, [REAR + mm(100), FLOOR + mm(46), -0.4], [-1.2, -2.4, 0]);

  // Cable looms from the supply up to the board and the card.
  //
  // Three runs, one per connector the supply actually feeds, each ending on
  // the connector it plugs into rather than somewhere inside the part. There
  // used to be five: two pairs went to the same two connectors, and both of
  // the spares terminated inside the graphics card.
  const cables = new T.Group();
  const loom = (points: Vec3[], radius: number, color: string) => {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...p)),
    );
    const frames = curve.computeFrenetFrames(48, false);
    // Individual sleeved conductors follow the same bend, held by cable combs.
    for (let wire = 0; wire < 6; wire++) {
      const offset = (wire - 2.5) * radius * 0.43;
      const route = Array.from({ length: 49 }, (_, i) =>
        curve.getPointAt(i / 48).addScaledVector(frames.binormals[i], offset),
      );
      cables.add(
        new T.Mesh(
          new T.TubeGeometry(
            new T.CatmullRomCurve3(route),
            48,
            radius * 0.19,
            6,
            false,
          ),
          finish('rubber', wire % 2 ? color : '#30363b'),
        ),
      );
    }
    for (const t of [0.24, 0.56, 0.8]) {
      const i = Math.round(t * 48);
      const comb = slab([radius * 2.7, radius * 0.6, radius * 0.75], 'plastic');
      comb.quaternion.setFromRotationMatrix(
        new T.Matrix4().makeBasis(
          frames.binormals[i],
          frames.tangents[i],
          frames.normals[i],
        ),
      );
      comb.position.copy(curve.getPointAt(i / 48));
      cables.add(comb);
    }
  };
  // 24-pin: up through the shroud and along the front edge of the board, in
  // plain sight through the window, passing in front of the card rather than
  // through it.
  loom(
    [
      [2.6, FLOOR + 3.1, 1.4],
      [1.7, FLOOR + 3.65, 1.9],
      [1.0, 0.2, 1.95],
      [0.72, BOARD_Y + mm(22), 1.6],
      [BOARD_X + mm(127), BOARD_Y + mm(45), -1.5],
      [BOARD_X + mm(115), BOARD_Y + mm(45), BOARD_Z + mm(10)],
    ],
    0.16,
    '#16191b',
  );
  // 8-pin EPS: the run a build hides. Back along the supply under the
  // shroud, through the tray into the cable chamber, up the back of the tray,
  // and forward through the grommet above the board's top edge onto the
  // connector. It used to climb the gap behind the board's rear edge instead,
  // in front of the tray, and pass straight through the I/O shield.
  const EPS_TOP = BOARD_Y + BOARD_H / 2 + 0.26;
  const CHAMBER_Z = (TRAY + BACK) / 2;
  loom(
    [
      [REAR + 5.19, FLOOR + 1.75, -0.55],
      [REAR + 5.34, FLOOR + 2.1, -1.4],
      [REAR + 5.0, FLOOR + 2.22, -2.62],
      [REAR + 3.0, FLOOR + 2.2, -2.72],
      [REAR + 1.45, FLOOR + 2.2, -2.72],
      [REAR + 1.0, FLOOR + 2.2, TRAY],
      [REAR + 0.95, FLOOR + 2.6, CHAMBER_Z],
      [REAR + 1.0, 0, CHAMBER_Z],
      [EPS_X + 0.35, EPS_TOP - 0.9, CHAMBER_Z],
      [EPS_X + 0.2, EPS_TOP, CHAMBER_Z + 0.1],
      [EPS_X + 0.1, EPS_TOP, TRAY],
      [EPS_X + 0.05, EPS_TOP, BOARD_Z + 0.2],
      [EPS_X, BOARD_Y + BOARD_H / 2 - mm(8), BOARD_Z + mm(12)],
      [EPS_X, BOARD_Y + mm(145), BOARD_Z + mm(10)],
    ],
    0.1,
    '#1f2325',
  );
  // 12V-2x6 to the card: out of the shroud, forward of everything, and down
  // onto the socket on the card's top face.
  loom(
    [
      [3.4, FLOOR + 3.1, 0.4],
      [2.3, FLOOR + 3.65, 1.5],
      [0.6, SLOT1_Y + 0.6, 1.9],
      [-0.554, SLOT1_Y + 0.6, 1.75],
      [-0.554, SLOT1_Y - mm(10), BOARD_Z + mm(139)],
    ],
    0.13,
    '#1d2124',
  );
  add('psucable', cables, [0, 0, 0], [0, -1.4, 1.2], 0);

  // ── Motherboard ─────────────────────────────────────────────────────────
  const motherboard = buildMotherboardAssembly(tools);
  add('motherboard', motherboard, [BOARD_X, BOARD_Y, BOARD_Z], [0, 0, -3.2]);

  /**
   * The rear I/O shield, cut to the board's own port stack.
   *
   * This was a solid plate with nine dark blocks on it, a few millimetres
   * behind the aperture and a few in front of the ports, so from behind the
   * machine the board had no ports at all. The holes are now taken from the
   * connectors themselves once the board is in place, so each shell sits in
   * its own opening with its face level with the plate, and a pressed flange
   * carries the plate back out to the rear panel.
   */
  motherboard.updateMatrixWorld(true);
  const board = motherboard.children[0];
  const ports = (board.userData.rearPorts as T.Box3[]).map((b) =>
    b.clone().applyMatrix4(board.matrixWorld),
  );
  // The plane most connector faces share. The antenna posts stand proud of
  // it, through their holes, as they do on a real shield.
  const faces = ports.map((b) => b.min.x).sort((a, b) => a - b);
  const face = faces[Math.floor(faces.length / 2)];
  const shield = new T.Group();
  const shieldX = face + 0.012;
  const shieldHoles: [number, number, number, number][] = ports.map((b) => [
    b.max.z - b.min.z + 0.02,
    b.max.y - b.min.y + 0.02,
    (b.max.z + b.min.z) / 2 - shell.io.z,
    (b.max.y + b.min.y) / 2 - shell.io.y,
  ]);
  const shieldFinish = finish('nickel', '#8f989d', 0.42);
  for (const [w, h, cz, cy] of plateWithHoles(
    APERTURE_H,
    APERTURE_W,
    shieldHoles,
  ))
    place(shield, new T.Mesh(new T.BoxGeometry(0.024, h, w), shieldFinish), [
      shieldX,
      shell.io.y + cy,
      shell.io.z + cz,
    ]);
  // The flange: four walls from the plate back to the panel's inner face.
  const flangeDepth = REAR + 0.1 - shieldX;
  const flangeX = (REAR + 0.1 + shieldX) / 2;
  for (const s of [-1, 1]) {
    place(
      shield,
      new T.Mesh(
        new T.BoxGeometry(Math.abs(flangeDepth), 0.02, APERTURE_H),
        shieldFinish,
      ),
      [flangeX, shell.io.y + s * (APERTURE_W / 2 - 0.01), shell.io.z],
    );
    place(
      shield,
      new T.Mesh(
        new T.BoxGeometry(Math.abs(flangeDepth), APERTURE_W, 0.02),
        shieldFinish,
      ),
      [flangeX, shell.io.y, shell.io.z + s * (APERTURE_H / 2 - 0.01)],
    );
  }
  add('ioshield', shield, [0, 0, 0], [-1.8, 0, 0]);

  // ── Processor cooler ────────────────────────────────────────────────────
  // A tower air cooler, bolted to the socket, which is the build this machine
  // actually runs. Heat leaves the lid through the coldplate, rises through
  // four pipes and is shed by a fin stack standing in the path of the front to
  // rear airflow, so the cooler is the one part that ties the board and the
  // case fans together.
  //
  // Three clearances fix every number below, and all three are the reasons a
  // liquid loop exists at all: the fin stack has to sit clear of the regulator
  // heatsinks along the top of the board, its fan has to clear the memory
  // beside the socket, and the whole tower has to fit under the roof. The loop
  // is modelled at its own scale rather than fitted here.
  //
  // Local frame: +Y up the tower, +X toward the front of the case (the way the
  // fan faces), +Z off the board. The coldplate is therefore thin in Z, lying
  // flat on the lid, and the fins are stacked along Y.
  const SOCK_X = BOARD_X + mm(8),
    SOCK_Y = BOARD_Y + mm(64),
    SOCK_Z = BOARD_Z + mm(8); // on top of the socket retention frame
  const STACK_NEAR = mm(28), // clears the regulator heatsinks below it
    STACK_W = mm(120), // how far the stack reaches off the board
    STACK_D = mm(52), // depth along the airflow
    STACK_Z = STACK_NEAR + STACK_W / 2,
    STACK_Y = mm(42); // fan and cable tail stay below the roof at the AM5 socket
  const PIPE_X = [-1.5, -0.5, 0.5, 1.5];

  const tower = new T.Group();

  // Coldplate, and the crossbar whose two sprung screws pull it onto the lid.
  place(tower, slab([mm(54), mm(54), mm(8)], 'nickel', undefined, 0.004), [
    0,
    0,
    mm(4),
  ]);
  place(tower, slab([mm(78), mm(11), mm(6)], 'brushed', '#8d959a'), [
    0,
    0,
    mm(11),
  ]);
  for (const sx of [-1, 1])
    place(tower, buildScrew(material, mm(5)), [sx * mm(38), 0, mm(15)]);

  // Four pipes out of the plate, bending away from the board as they rise so
  // the stack can stand clear of everything mounted along the top of it.
  for (const px of PIPE_X) {
    const path = new T.CatmullRomCurve3([
      new T.Vector3(px * mm(11), mm(2), mm(6)),
      new T.Vector3(px * mm(12), mm(22), mm(12)),
      new T.Vector3(px * mm(13), mm(40), STACK_NEAR + mm(16)),
      new T.Vector3(px * mm(14), mm(62), STACK_Z - mm(10)),
      new T.Vector3(px * mm(14), STACK_Y + mm(44), STACK_Z - mm(10)),
    ]);
    place(
      tower,
      new T.Mesh(
        new T.TubeGeometry(path, 32, mm(3.2), 12, false),
        finish('copper'),
      ),
      [0, 0, 0],
    );
  }

  // Fin stack: horizontal plates stacked up the tower, air passing between
  // them front to rear.
  // Forty-odd fins on a 2 mm pitch, not thirty on a 3 mm one. A fin stack is
  // mostly shadow: it is the density of the gaps, and the dark between them,
  // that makes it read as a heatsink rather than as a white plastic block.
  // Seen end-on, a fin stack is mostly the shadow between the fins, not the
  // fins. Rendered at a bright aluminium value the forty of them merge into
  // one white block, which is what the tower used to look like, so the fin
  // colour here is the *average* of a lit fin and the dark gap beside it.
  const stack = buildFinStack(
    material,
    42,
    [STACK_D, mm(0.42), STACK_W],
    mm(2.05),
    '#6d757b',
  );
  place(tower, stack, [0, STACK_Y, STACK_Z]);
  place(tower, slab([STACK_D + mm(4), mm(3.5), STACK_W + mm(4)], 'anodized'), [
    0,
    STACK_Y + mm(46),
    STACK_Z,
  ]);
  const towerCap = new T.Mesh(
    new T.PlaneGeometry(STACK_D - mm(10), STACK_W - mm(12)),
    glowMaterial(RGB[1], 1.25, 0.9),
  );
  towerCap.rotation.x = -Math.PI / 2;
  place(tower, towerCap, [0, STACK_Y + mm(48), STACK_Z]);

  // The fan hangs on the front face of the stack and blows toward the rear
  // exhaust, which is the direction the case is already moving air.
  const towerFan = buildFan(material, {
    size: mm(104),
    phase: 1.1,
    pads: true,
    cable: true,
    frameColor: '#131618',
    rgb: RGB[1],
  });
  towerFan.rotation.z = Math.PI / 2; // axis along −X: front to rear
  place(tower, towerFan, [STACK_D / 2 + mm(13), STACK_Y, STACK_Z]);
  const towerGlow = new T.PointLight(RGB[1], 6, 6.5, 2);
  towerGlow.position.set(STACK_D / 2 + mm(32), STACK_Y, STACK_Z);
  tower.add(towerGlow);

  add('cpucooler', tower, [SOCK_X, SOCK_Y, SOCK_Z], [0, 2.4, 1.6]);

  // ── Case fans ───────────────────────────────────────────────────────────
  //
  // Three across the front and one at the back, on one line through the
  // machine at z = 0. The airflow section at the end of this file draws the
  // path they share, so their heights are named here rather than computed
  // twice.
  const INTAKE_Y = [0, 1, 2].map((i) => -3.0 + i * mm(125));
  for (let i = 0; i < 3; i++) {
    // No cable tail on these three. `buildFan` sweeps it out past the frame
    // corner, which on a stacked wall of fans means through the front panel
    // and into the neighbour above. A real build routes them behind the tray,
    // where nothing here would show them anyway.
    const fan = buildFan(material, {
      size: mm(120),
      phase: i * 0.7,
      pads: true,
      rgb: RGB[i],
    });
    fan.rotation.z = Math.PI / 2;
    const spill = new T.PointLight(RGB[i], 12, 9, 2);
    spill.position.set(0, -0.5, 0); // just inside the case, past the frame
    fan.add(spill);
    add('casefan', fan, [FRONT - 0.55, INTAKE_Y[i], 0], [3.4, 0, 0]);
  }
  // Rear exhaust. It sits beside the I/O aperture against the inside of the
  // rear panel, above the graphics card, so the front intakes and tower cooler all
  // share one straight front-to-back path.
  const exhaust = buildFan(material, {
    size: mm(120),
    phase: 2.2,
    pads: true,
    guard: true,
    rgb: RGB[3],
  });
  const exhaustSpill = new T.PointLight(RGB[3], 6, 6, 2);
  exhaustSpill.position.set(0, -0.5, 0);
  exhaust.add(exhaustSpill);
  exhaust.rotation.z = Math.PI / 2;
  // It comes out inward and across, as it is taken out: back through the
  // grille is not a way a fan leaves a case.
  add('casefan', exhaust, EXHAUST, [1.2, 0, 3.4]);

  // ── Graphics card, in the primary slot ──────────────────────────────────
  //
  // Reuse the complete inspection model, including its PCB components, dense
  // fin banks and fan details. It remains one selectable assembly at PC scale.
  //
  // A card in a tower hangs cooler-downward, which is the half turn about X
  // below. The turn also swaps the card's two long edges, so the lit wordmark
  // is asked for on the far edge in order to end up facing the window.
  const CARD_L = mm(348);
  const card = new T.Group();
  const detailedCard = tools.assembly('card');
  detailedCard.scale.setScalar(CARD_L / 8.93);
  card.add(detailedCard);
  // Cooler-downward, and seated on the slot rather than hovering over it: the
  // board inside the card lands on the connector, and the card's height then
  // reaches out from the tray toward the window.
  card.rotation.x = Math.PI;
  const CARD_Y = SLOT1_Y - mm(2);
  add(
    'graphicscard',
    card,
    [REAR + 0.16 + CARD_L / 2, CARD_Y, BOARD_Z + mm(71)],
    [0, 0, 3.0],
  );

  // ── Airflow ─────────────────────────────────────────────────────────────
  //
  // What all of those fans are actually for.
  //
  // One path runs the length of the machine, front to back, and everything
  // else is arranged around it: the tower cooler stands in it on purpose, the
  // graphics card hangs below it breathing across it, and the supply is shut
  // out of it underneath the shroud, which is most of why the shroud exists.
  //
  // The paths are authored rather than read off each fan's transform, for the
  // reason `airflow.ts` gives, but every point below is taken from a part
  // placed above, so the air keeps meeting the hardware if the build moves.
  // The card supplies its own streams: it is installed here as the complete
  // card assembly, turned over, and its airflow turns over with it.
  const COOLER_FAN: Vec3 = [
    SOCK_X + STACK_D / 2 + mm(13),
    SOCK_Y + STACK_Y,
    SOCK_Z + STACK_Z,
  ];
  const CARD_INTAKE = CARD_Y - cardStack(CARD_L).fan;
  const PSU_X = REAR + mm(100),
    PSU_Y = FLOOR + mm(46);
  airflow([
    {
      // Top intake, straight into the cooler, out through the fin stack and
      // the rear exhaust. Every part of that is one run of air.
      kind: 'through',
      size: 0.6,
      path: [
        [FRONT + 0.7, INTAKE_Y[2], 0],
        [FRONT - 1.2, INTAKE_Y[2], 0],
        [COOLER_FAN[0] + 1.7, (INTAKE_Y[2] + COOLER_FAN[1]) / 2, COOLER_FAN[2]],
        COOLER_FAN,
        [SOCK_X, COOLER_FAN[1], COOLER_FAN[2]],
        [SOCK_X - STACK_D, COOLER_FAN[1] - 0.2, COOLER_FAN[2] + 0.4],
        EXHAUST,
        [REAR - 1.1, EXHAUST[1], EXHAUST[2]],
      ],
    },
    {
      // Middle intake, over the card and out of the same exhaust.
      kind: 'through',
      size: 0.6,
      path: [
        [FRONT + 0.7, INTAKE_Y[1], 0],
        [FRONT - 1.3, INTAKE_Y[1], 0.05],
        [2.6, INTAKE_Y[1] + 0.55, -0.1],
        [-0.4, 2.0, 0.15],
        [-3.9, 3.05, 0.5],
        EXHAUST,
        [REAR - 1.1, EXHAUST[1] + 0.06, EXHAUST[2]],
      ],
    },
    {
      // Bottom intake, along the shroud and up into the card's fans. It stops
      // there because the card takes over: this is the air it is breathing.
      kind: 'intake',
      size: 0.6,
      path: [
        [FRONT + 0.7, INTAKE_Y[0], 0],
        [FRONT - 1.4, INTAKE_Y[0], -0.1],
        [2.2, INTAKE_Y[0] + 0.2, -0.4],
        [0.2, CARD_INTAKE - 0.55, -0.6],
      ],
    },
    {
      // The supply, breathing through the floor and out of the back on its
      // own. Nothing it exhausts passes over anything else in the machine.
      kind: 'through',
      size: 0.5,
      path: [
        [PSU_X, FLOOR - 0.26, -0.4],
        [PSU_X, PSU_Y - ph / 2 + mm(24), -0.4],
        [PSU_X - 0.9, PSU_Y + mm(8), -0.5],
        [PSU_X - pw / 2 - 0.4, PSU_Y + mm(4), -0.4 - mm(28)],
        [REAR - 1.0, PSU_Y + mm(4), -0.4 - mm(28)],
      ],
    },
  ]);
}
