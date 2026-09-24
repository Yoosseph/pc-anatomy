import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import type { Finisher } from './materials.ts';
import { temperedGlass } from './materials.ts';
import {
  buildHoneycomb,
  buildPerforation,
  buildPort,
  buildScrew,
  glowMaterial,
} from './parts.ts';
import { filterWeaveTexture } from './surfaces.ts';

/**
 * The case.
 *
 * What was here before was a skeleton: a dozen thin plates with air between
 * them, so the machine had no outside. You could see the background through
 * the rear panel, through the tray and through the floor at the same time, and
 * a tower you can see straight through does not read as one manufactured
 * object however good the parts inside it are. Everything below exists to fix
 * that: the shell is continuous, every opening in it is a deliberate cut-out
 * with an edge, and the panels meet their frame instead of floating near it.
 *
 * The exterior is an aluminium-framed mid tower built for front-to-back air:
 * the body is solid steel and aluminium, the one face you look through is a
 * deliberate glass panel rather than a missing wall, and the face the fans
 * breathe through is mesh. It used to be glass there too, with the three
 * intake fans pressed against it and drawing through a strip at the edge,
 * which no case that puts its fans at the front actually does.
 *
 *   · four extruded aluminium corner columns carry the whole frame
 *   · tempered glass down the left side, a perforated mesh front
 *   · folded steel everywhere else: rear panel, tray, floor, roof, back side
 *   · a filter behind every intake: front, floor and lid
 *   · the front I/O along the top front edge, and four feet
 *
 * Axes match `machine.ts`: +X front, −X rear, +Y up, +Z toward the viewer.
 */

export type CaseShell = {
  REAR: number;
  FRONT: number;
  FLOOR: number;
  ROOF: number;
  TRAY: number;
  GLASS: number;
  BACK: number;
  /**
   * The rear I/O aperture, given in world coordinates as it is cut in the rear
   * panel: the panel's plane is Y-Z, so the window is `up` tall along the board
   * edge and `across` deep off the board surface.
   */
  io: { y: number; z: number; up: number; across: number };
  /** Expansion slots: the top slot's centre, the pitch below it, and how many. */
  slotY: number;
  slotZ: number;
  slotPitch: number;
  slots: number;
  /** The supply's rear face, which shows through its own opening. */
  psu: { y: number; z: number; up: number; across: number };
  /** The supply's centre, front to back, which its floor intake sits under. */
  psuX: number;
  /** The rear exhaust fan's mounting: its centre and its frame size. */
  exhaust: { y: number; z: number; size: number };
  /**
   * The grommet above the board's top edge that the processor power lead
   * comes through, centred on the connector it feeds.
   */
  eps: { x: number; y: number; width: number; height: number };
  /** Accent colour for the lit trim. */
  accent: string;
};

/** A rectangle in a panel's own plane: width, height, centre. */
type Rect = [w: number, h: number, cx: number, cy: number];

/**
 * A solid panel with rectangular openings cut in it.
 *
 * Three.js has no solid modelling, and a panel drawn as one box with parts
 * laid over the holes is exactly the fake that made the old rear panel read as
 * cardboard. This subtracts properly: the plate is split into horizontal bands
 * at every hole edge, and each band is split again across, so what comes back
 * is the real remaining material and every opening has a genuine edge with
 * thickness. Three ports and eight slots cost eleven boxes, not eleven decals.
 */
export function plateWithHoles(
  width: number,
  height: number,
  holes: Rect[],
): Rect[] {
  const ys = new Set([-height / 2, height / 2]);
  for (const [, h, , cy] of holes) {
    ys.add(Math.max(-height / 2, cy - h / 2));
    ys.add(Math.min(height / 2, cy + h / 2));
  }
  const rows = [...ys].sort((a, b) => a - b);
  const out: Rect[] = [];
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r],
      y1 = rows[r + 1];
    if (y1 - y0 < 1e-6) continue;
    const mid = (y0 + y1) / 2;
    // Which openings this band actually runs through.
    const spans = holes
      .filter(([, h, , cy]) => cy - h / 2 < mid && cy + h / 2 > mid)
      .map(([w, , cx]) => [cx - w / 2, cx + w / 2] as const)
      .sort((a, b) => a[0] - b[0]);
    let x = -width / 2;
    for (const [x0, x1] of spans) {
      if (x0 > x) out.push([x0 - x, y1 - y0, (x + x0) / 2, mid]);
      x = Math.max(x, x1);
    }
    if (x < width / 2)
      out.push([width / 2 - x, y1 - y0, (x + width / 2) / 2, mid]);
  }
  return out;
}

export function buildChassis(
  tools: ModelTools,
  finish: Finisher,
  s: CaseShell,
) {
  const { add, material } = tools;
  const { REAR, FRONT, FLOOR, ROOF, TRAY, GLASS, BACK } = s;
  const DEPTH = FRONT - REAR,
    HEIGHT = ROOF - FLOOR,
    WIDTH = GLASS - BACK,
    MIDX = (FRONT + REAR) / 2,
    MIDZ = (GLASS + BACK) / 2;

  /** A panel. Rounded, because a folded steel edge is never a knife edge. */
  const slab = (size: Vec3, mat: T.Material, radius = 0.012) =>
    new T.Mesh(
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(radius, Math.min(...size) * 0.45),
      ),
      mat,
    );
  const put = (parent: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    parent.add(obj);
    return obj;
  };

  const steel = finish('steel');
  const steelInner = finish('steel', '#272c30');
  const alu = finish('anodized');
  // The columns and rails are the line the eye follows round the case, so they
  // are a shade up from the panels they carry, the way a milled extrusion sits
  // against a coated sheet.
  const aluFrame = finish('anodized', '#3c444a', 0.33);
  const aluBright = finish('anodizedLight');
  const rubber = finish('rubber');

  // ── Frame: columns, rails, shell ────────────────────────────────────────
  const frame = new T.Group();

  /**
   * The four extruded corner columns.
   *
   * These are the part that makes the tower one object. Every panel lands on a
   * column, the glass sits against them, and the front-side column is the
   * visible edge where the two glass faces meet, which is the whole silhouette
   * of a case like this. A hollow section with a visible inner web is how the
   * extrusion is actually drawn, and it catches a highlight down its length
   * that a plain bar does not.
   */
  const COL = 0.36;
  /** The solid strip of roof ahead of the lid opening, carrying the front I/O. */
  const FRONT_BAND = 1.35;
  for (const [cx, cz] of [
    [FRONT - COL / 2, GLASS - COL / 2],
    [FRONT - COL / 2, BACK + COL / 2],
    [REAR + COL / 2, GLASS - COL / 2],
    [REAR + COL / 2, BACK + COL / 2],
  ] as const) {
    const column = new T.Group();
    put(column, slab([COL, HEIGHT, COL], aluFrame, 0.05), [0, 0, 0]);
    // A chamfer down the outer arris, which is what actually reads as milled
    // aluminium: it holds a bright line the flat faces never do.
    const arris = new T.Mesh(
      new T.BoxGeometry(COL * 0.36, HEIGHT, COL * 0.36),
      aluBright,
    );
    arris.rotation.y = Math.PI / 4;
    put(column, arris, [
      (cx > MIDX ? 1 : -1) * COL * 0.46,
      0,
      (cz > MIDZ ? 1 : -1) * COL * 0.46,
    ]);
    put(frame, column, [cx, 0, cz]);
  }

  // Top and bottom rails, tying the columns into a frame on all four sides.
  for (const sy of [-1, 1] as const) {
    const y = sy > 0 ? ROOF - 0.19 : FLOOR + 0.19;
    for (const cz of [GLASS - COL / 2, BACK + COL / 2])
      put(frame, slab([DEPTH - COL * 2, 0.34, COL], aluFrame, 0.04), [
        MIDX,
        y,
        cz,
      ]);
    for (const cx of [FRONT - COL / 2, REAR + COL / 2])
      put(frame, slab([COL, 0.34, WIDTH - COL * 2], aluFrame, 0.04), [
        cx,
        y,
        MIDZ,
      ]);
  }

  /**
   * A cut sheet: the pieces `plateWithHoles` returns, laid edge to edge.
   *
   * The pieces meet in the middle of a flat sheet, so they are square-edged.
   * Rounding them, as a panel's outer edge should be, put a dark groove along
   * every seam, and the rear panel read as a stack of planks with a line at
   * every slot.
   */
  const sheet = (size: Vec3, mat: T.Material) =>
    new T.Mesh(new T.BoxGeometry(...size), mat);

  /**
   * The rear panel, cut rather than covered: the I/O window, the expansion
   * slots, the exhaust fan's opening and the supply's own opening are real
   * holes with material between them. The fan used to sit in front of solid
   * steel with its frame through the sheet.
   */
  // Square, and inside the fan's 105 mm screw pattern, so the four screws
  // land on steel rather than on the grille.
  const fanHole = s.exhaust.size - 0.6;
  const rearHoles: Rect[] = [
    [s.io.across, s.io.up, s.io.z - MIDZ, s.io.y],
    [s.psu.across, s.psu.up, s.psu.z - MIDZ, s.psu.y],
  ];
  for (let i = 0; i < s.slots; i++)
    rearHoles.push([
      1.94,
      s.slotPitch * 0.84,
      s.slotZ - MIDZ,
      s.slotY - i * s.slotPitch,
    ]);
  const lipped = rearHoles.length;
  rearHoles.push([fanHole, fanHole, s.exhaust.z - MIDZ, s.exhaust.y]);
  for (const [w, h, cz, cy] of plateWithHoles(
    WIDTH - COL * 2,
    HEIGHT - 0.38,
    rearHoles,
  ))
    put(frame, sheet([0.1, h, w], steel), [REAR + 0.05, cy, MIDZ + cz]);
  // A returned lip round each opening, so the cuts have an edge you can read.
  // Not round the fan's: the fan frame sits against the inside of the sheet
  // there, and a lip would be inside the frame.
  for (const [w, h, cz, cy] of rearHoles.slice(0, lipped)) {
    for (const sz of [-1, 1])
      put(frame, slab([0.13, h + 0.09, 0.05], steelInner, 0.01), [
        REAR + 0.12,
        cy,
        MIDZ + cz + (sz * (w + 0.05)) / 2,
      ]);
    for (const sy of [-1, 1])
      put(frame, slab([0.13, 0.05, w + 0.09], steelInner, 0.01), [
        REAR + 0.12,
        cy + (sy * (h + 0.05)) / 2,
        MIDZ + cz,
      ]);
  }
  // The exhaust grille: a hex pattern punched in its own insert, level with
  // the sheet, and the four screws that hold the fan to the inside of it.
  const grille = buildHoneycomb(
    material,
    fanHole,
    fanHole,
    0.05,
    0.11,
    '#1d2124',
  );
  grille.rotation.y = Math.PI / 2;
  put(frame, grille, [REAR + 0.05, s.exhaust.y, s.exhaust.z]);
  for (const sy of [-1, 1])
    for (const sz of [-1, 1]) {
      const screw = buildScrew(material, 0.065);
      screw.rotation.z = Math.PI / 2;
      put(frame, screw, [
        REAR - 0.02,
        s.exhaust.y + sy * s.exhaust.size * 0.4375,
        s.exhaust.z + sz * s.exhaust.size * 0.4375,
      ]);
    }

  /**
   * The motherboard tray: one continuous sheet, not the five bars it was.
   *
   * A tray is the part every other part is bolted to, so a tray with gaps in
   * it is the reason a build looks like it is hanging in mid-air. The
   * openings are the ones a real tray has, and each is bound by a rubber
   * grommet: the big pass-through down the front edge, the slot above the
   * board's top edge for the processor power lead, the window behind the
   * socket that lets a cooler backplate come off without stripping the board
   * out, and two low ones under the shroud where the supply's leads cross into
   * the cable chamber.
   *
   * The processor lead's slot used to be a long run hidden behind the top of
   * the board, where no cable can reach it, so the lead went up the gap behind
   * the board's rear edge instead and through the I/O shield on its way.
   */
  const trayHoles: Rect[] = [
    [1.15, 7.3, FRONT - 2.0 - MIDX, 0.1], // front pass-through
    [s.eps.width, s.eps.height, s.eps.x - MIDX, s.eps.y], // processor power
    [2.5, 2.6, REAR + 3.0 - MIDX, 2.05], // socket access window
    [1.05, 1.5, FRONT - 2.0 - MIDX, FLOOR + 2.35], // lower pass-through
    [0.9, 0.9, REAR + 1.0 - MIDX, FLOOR + 2.2], // rear, under the shroud
  ];
  for (const [w, h, cx, cy] of plateWithHoles(
    DEPTH - COL * 2,
    HEIGHT - 0.38,
    trayHoles,
  ))
    put(frame, sheet([w, h, 0.085], steelInner), [MIDX + cx, cy, TRAY]);
  for (const [w, h, cx, cy] of trayHoles) {
    for (const sx of [-1, 1])
      put(frame, slab([0.09, h + 0.14, 0.19], rubber, 0.03), [
        MIDX + cx + (sx * (w + 0.07)) / 2,
        cy,
        TRAY + 0.02,
      ]);
    for (const sy of [-1, 1])
      put(frame, slab([w + 0.14, 0.09, 0.19], rubber, 0.03), [
        MIDX + cx,
        cy + (sy * (h + 0.07)) / 2,
        TRAY + 0.02,
      ]);
  }

  // Floor, with the supply's intake cut through it under its fan, and the
  // roof. The cut used to be offset toward the front, so half of it opened on
  // to nothing, a hole in the floor beside the supply.
  const psuIntake: Rect = [
    s.psu.across - 1.1,
    s.psu.across - 1.1,
    s.psuX - MIDX,
    s.psu.z - MIDZ,
  ];
  for (const [w, h, cx, cz] of plateWithHoles(
    DEPTH - COL * 2,
    WIDTH - COL * 2,
    [psuIntake],
  ))
    put(frame, sheet([w, 0.1, h], steel), [MIDX + cx, FLOOR + 0.05, MIDZ + cz]);
  /**
   * The roof is a frame, not a lid: the mesh panel drops into the opening.
   * Laying a solid plate here and the mesh under it is what buried the lid.
   *
   * The opening stops short of the front, leaving a solid band across the
   * top front edge. That band is where the front I/O lives on a case with a
   * mesh face, and it used to be missing: the buttons and ports were inside
   * the case, under the roof, where nobody could reach or see them.
   */
  const ROOF_OPEN = {
    width: DEPTH - COL * 2 - 0.45 - FRONT_BAND,
    depth: WIDTH - COL * 2 - 0.9,
    x: MIDX + (0.45 - FRONT_BAND) / 2,
  };
  // The front I/O module drops through its own cut-out in the band.
  const frontIo = buildFrontIo();
  const IO_X = FRONT - COL - FRONT_BAND / 2;
  for (const [w, h, cx, cz] of plateWithHoles(
    DEPTH - COL * 2,
    WIDTH - COL * 2,
    [
      [ROOF_OPEN.width, ROOF_OPEN.depth, ROOF_OPEN.x - MIDX, 0],
      [frontIo.depth, frontIo.length, IO_X - MIDX, 0],
    ],
  ))
    put(frame, sheet([w, 0.09, h], steel), [MIDX + cx, ROOF - 0.05, MIDZ + cz]);
  // The back side, closing the cable chamber.
  put(frame, slab([DEPTH - COL * 2, HEIGHT - 0.38, 0.09], steel, 0.014), [
    MIDX,
    0,
    BACK + 0.045,
  ]);

  /**
   * Feet. A tower stands on four of them, and the 20 mm they lift it by is
   * what feeds the supply's floor intake. Leaving them off is why the case
   * used to look like it had been dropped through the table.
   */
  for (const fx of [REAR + 0.75, FRONT - 0.75])
    for (const fz of [BACK + 0.75, GLASS - 0.75]) {
      const foot = new T.Group();
      put(foot, slab([0.72, 0.2, 0.72], alu, 0.06), [0, 0.1, 0]);
      put(foot, slab([0.56, 0.22, 0.56], rubber, 0.09), [0, -0.08, 0]);
      put(frame, foot, [fx, FLOOR - 0.2, fz]);
    }

  add('chassis', frame, [0, 0, 0], [0, 0, -2.4]);

  // ── Front I/O ───────────────────────────────────────────────────────────
  // Fixed to the frame, so it travels with it.
  add('frontio', frontIo.io, [IO_X, ROOF, MIDZ], [0, 0, -2.4]);

  /**
   * The front I/O: one row of controls on a brushed plate set into the roof's
   * front band, where a mesh-fronted case puts it.
   *
   * Every item is centred on one line, and the gaps between them are equal
   * edge to edge rather than centre to centre, because that is what reads as
   * aligned: a 15 mm power button and a 6 mm jack spaced on equal centres look
   * as if they had drifted. The row is laid out from the items' real widths
   * and centred on the plate, so nothing here is a hand-placed offset.
   *
   * Left to right as you face the front (the case's +Z to −Z): power, reset,
   * two USB-A, one USB-C, and the headset jack. The ports are cut through the
   * plate and sit with their shells flush with its face; the buttons and the
   * jack stand proud in their own bezels, as they do on a real panel.
   */
  function buildFrontIo() {
    const u = (v: number) => v / 35;
    const io = new T.Group();
    const THICK = u(1.6);
    const items = [
      { kind: 'power', width: u(17) },
      { kind: 'reset', width: u(8) },
      { kind: 'usba', width: u(14.6), open: [u(14.6), u(6.6)] },
      { kind: 'usba', width: u(14.6), open: [u(14.6), u(6.6)] },
      { kind: 'usbc', width: u(9.4), open: [u(9.4), u(3.9)] },
      { kind: 'audio', width: u(9) },
    ] as const;
    const GAP = u(7);
    const row =
      items.reduce((sum, item) => sum + item.width, 0) +
      GAP * (items.length - 1);
    const plateLength = row + u(18);
    const plateDepth = u(26);
    // Centre of each item along the row, from +Z (left, facing the front).
    const centres: number[] = [];
    let cursor = row / 2;
    for (const item of items) {
      centres.push(cursor - item.width / 2);
      cursor -= item.width + GAP;
    }
    // The plate, with the port openings cut through it: one extruded outline
    // with real holes, so the brushed grain runs unbroken across it. Built
    // from strips, as the case's big sheets are, it showed a hairline at
    // every strip edge through the grain.
    const outline = new T.Shape();
    outline.moveTo(-plateDepth / 2, -plateLength / 2);
    outline.lineTo(plateDepth / 2, -plateLength / 2);
    outline.lineTo(plateDepth / 2, plateLength / 2);
    outline.lineTo(-plateDepth / 2, plateLength / 2);
    outline.closePath();
    items.forEach((item, i) => {
      if (!('open' in item)) return;
      const [along, across] = item.open;
      // The shape's +Y becomes the case's −Z once it is laid flat.
      const y = -centres[i];
      const hole = new T.Path();
      hole.moveTo(-across / 2, y - along / 2);
      hole.lineTo(-across / 2, y + along / 2);
      hole.lineTo(across / 2, y + along / 2);
      hole.lineTo(across / 2, y - along / 2);
      hole.closePath();
      outline.holes.push(hole);
    });
    const plate = new T.Mesh(
      new T.ExtrudeGeometry(outline, { depth: THICK, bevelEnabled: false }),
      finish('brushed', '#3a4147', 0.3),
    );
    plate.rotation.x = -Math.PI / 2;
    io.add(plate);
    // A chamfered border so the plate reads as set into the roof, not laid on it.
    for (const sx of [-1, 1])
      put(
        io,
        slab([u(1.2), THICK * 1.2, plateLength + u(2.4)], aluFrame, 0.006),
        [sx * (plateDepth / 2 + u(0.6)), THICK * 0.55, 0],
      );
    for (const sz of [-1, 1])
      put(io, slab([plateDepth, THICK * 1.2, u(1.2)], aluFrame, 0.006), [
        0,
        THICK * 0.55,
        sz * (plateLength / 2 + u(0.6)),
      ]);
    const ring = (outer: number, inner: number, mat: T.Material, y: number) => {
      const mesh = new T.Mesh(new T.RingGeometry(inner, outer, 40), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = y;
      return mesh;
    };
    const disc = (radius: number, height: number, mat: T.Material) =>
      new T.Mesh(new T.CylinderGeometry(radius, radius, height, 40), mat);
    const bezel = finish('anodizedLight', '#a9b1b6', 0.28);
    const black = finish('plasticGloss', '#0d0f10');
    items.forEach((item, i) => {
      const z = centres[i];
      const top = THICK;
      if (item.kind === 'power') {
        // A machined bezel, the cap inside it, and the lit ring between them.
        const outer = put(io, disc(u(8.5), u(1.4), bezel), [
          0,
          top + u(0.7),
          z,
        ]);
        outer.castShadow = true;
        put(io, disc(u(6.6), u(2.2), finish('anodized', '#2b3136', 0.24)), [
          0,
          top + u(1.1),
          z,
        ]);
        put(
          io,
          ring(u(7.6), u(6.7), glowMaterial(s.accent, 1.8), top + u(1.45)),
          [0, 0, z],
        );
        // The power symbol: a ring broken toward the back of the case, which
        // is "up" to someone standing at the front, and a bar through the
        // break.
        const ink = finish('plasticGloss', '#aeb6bb');
        const gap = 1.2;
        const symbol = new T.Mesh(
          new T.RingGeometry(
            u(2.2),
            u(2.9),
            28,
            1,
            Math.PI + gap / 2,
            Math.PI * 2 - gap,
          ),
          ink,
        );
        symbol.rotation.x = -Math.PI / 2;
        put(io, symbol, [0, top + u(2.25), z]);
        put(io, new T.Mesh(new T.BoxGeometry(u(3.4), u(0.2), u(0.7)), ink), [
          -u(1.7),
          top + u(2.26),
          z,
        ]);
      } else if (item.kind === 'reset') {
        put(io, disc(u(4), u(0.9), bezel), [0, top + u(0.45), z]);
        put(io, disc(u(2.8), u(1.5), black), [0, top + u(0.75), z]);
      } else if (item.kind === 'audio') {
        put(io, disc(u(4.5), u(0.9), black), [0, top + u(0.45), z]);
        put(io, ring(u(3.2), u(2.2), bezel, top + u(0.92)), [0, 0, z]);
        put(io, disc(u(1.8), u(0.2), finish('rubber', '#050606')), [
          0,
          top + u(0.93),
          z,
        ]);
      } else {
        // A connector shell dropped through its cut-out, mouth up, its rim
        // level with the plate. USB-A ports are wide side across the row.
        const [w, h] = item.open;
        const depth = u(11);
        const port = buildPort(material, [w, h, depth], '#8d969b');
        port.rotation.x = -Math.PI / 2;
        const holder = new T.Group();
        holder.add(port);
        holder.rotation.y = Math.PI / 2;
        put(io, holder, [0, top - depth / 2 + u(0.2), z]);
      }
    });
    return { io, length: plateLength, depth: plateDepth };
  }

  // ── Expansion slot covers ───────────────────────────────────────────────
  const covers = new T.Group();
  // The installed 3.6-slot card occupies the first four openings.
  for (let i = 4; i < s.slots; i++) {
    const cover = new T.Group();
    put(
      cover,
      slab([0.07, s.slotPitch * 0.78, 1.9], steelInner, 0.012),
      [0, 0, 0],
    );
    // The thumbscrew tab that holds it, folded toward the inside.
    put(cover, slab([0.22, 0.3, 0.26], steelInner, 0.02), [
      0.11,
      s.slotPitch * 0.42,
      0.82,
    ]);
    put(cover, buildScrew(material, 0.07), [0.2, s.slotPitch * 0.42, 0.82]);
    put(covers, cover, [REAR + 0.16, s.slotY - i * s.slotPitch, s.slotZ]);
  }
  add('chassis', covers, [0, 0, 0], [-2.6, 0, 0]);

  // ── Panels ──────────────────────────────────────────────────────────────
  const glassMaterial = temperedGlass();
  /**
   * How tall an opening in the frame is: between the top and bottom rails,
   * not between the roof and the floor. The glass and the mesh front used to
   * be the full height of the case, so their top and bottom edges ran through
   * the rails behind them.
   */
  const PANEL_H = HEIGHT - 0.38 * 2 - 0.04;

  /**
   * A glass panel in its frame: the pane, its polished edge trim and the four
   * rubber-bushed studs it hangs on.
   *
   * `axis` is which way the panel's width runs, and therefore which way it
   * faces: an 'x' panel spans the depth of the case and looks in from the
   * side, a 'z' panel spans the width and is the front. Getting this backwards
   * is not a subtle error - it stands both sheets of glass on the wrong axis,
   * so each one runs out through the walls it was supposed to close.
   */
  const pane = (w: number, h: number, axis: 'x' | 'z') => {
    const panel = new T.Group();
    const T_ = 0.07;
    const size: Vec3 = axis === 'x' ? [w, h, T_] : [T_, h, w];
    const across: Vec3 = axis === 'x' ? [1, 0, 0] : [0, 0, 1];
    const normal: Vec3 = axis === 'x' ? [0, 0, 1] : [1, 0, 0];
    panel.add(new T.Mesh(new T.BoxGeometry(...size), glassMaterial));
    // A narrow ceramic border and polished trim make the clear pane
    // readable without tinting away the hardware behind it.
    const ceramic = finish('plasticGloss', '#111619');
    const edge = finish('anodized', '#454e55', 0.13);
    const bar = (along: 'across' | 'up', length: number): Vec3 => {
      const d: Vec3 = [0.06, 0.06, 0.06];
      if (along === 'up') d[1] = length;
      else for (let i = 0; i < 3; i++) if (across[i]) d[i] = length;
      return d;
    };
    // Trim down all four edges, so the pane has a visible frame rather than
    // fading out into nothing where it meets the column.
    for (const sign of [-1, 1]) {
      const seal = bar('across', w - 0.08);
      seal[1] = 0.14;
      put(panel, slab(seal, ceramic), [0, sign * (h / 2 - 0.09), 0]);
      put(panel, slab(bar('across', w), edge, 0.012), [0, (sign * h) / 2, 0]);
      put(panel, slab(bar('up', h), edge, 0.012), [
        (across[0] * sign * w) / 2,
        0,
        (across[2] * sign * w) / 2,
      ]);
    }
    for (const sy of [-1, 1])
      for (const sw of [-1, 1])
        put(panel, slab([0.17, 0.17, 0.17], rubber, 0.07), [
          (across[0] * sw * (w - 0.8)) / 2 - normal[0] * 0.1,
          (sy * (h - 0.8)) / 2,
          (across[2] * sw * (w - 0.8)) / 2 - normal[2] * 0.1,
        ]);
    return panel;
  };

  // Side window. Up and out rather than straight at the camera, so a panel
  // this size does not park itself in front of everything it was covering.
  add(
    'sidepanel',
    pane(DEPTH - COL * 2 - 0.06, PANEL_H, 'x'),
    [MIDX, 0, GLASS - 0.035],
    [0, 3.2, 3.6],
  );

  /**
   * The front: perforated steel in an aluminium frame, straight in front of
   * the intake fans.
   *
   * This was a second sheet of glass, with the fans pressed against it and a
   * narrow perforated strip down one edge as the only way in. Three 120 mm
   * fans drawing through a strip a third of their width is not a layout any
   * front-intake case uses. The mesh is cut in four tiles with a rib at each
   * seam, which is how a panel this tall is stiffened, and it is real holes:
   * the fans and their light show through it.
   */
  const meshFront = () => {
    const panel = new T.Group();
    const w = WIDTH - COL * 2 - 0.06,
      h = PANEL_H,
      rail = 0.26,
      tiles = 4;
    const tileH = (h - rail * 2) / tiles;
    for (let i = 0; i < tiles; i++) {
      // Open enough that the fans and their light read through it, as they
      // do through a real mesh front.
      const tile = buildPerforation(
        material,
        w - rail * 2,
        tileH,
        0.03,
        0.16,
        '#1b1f22',
        0.4,
      );
      tile.rotation.y = Math.PI / 2;
      put(panel, tile, [0, -h / 2 + rail + tileH * (i + 0.5), 0]);
      if (i)
        put(panel, sheet([0.06, 0.07, w - rail * 2], aluFrame), [
          -0.02,
          -h / 2 + rail + tileH * i,
          0,
        ]);
    }
    for (const sign of [-1, 1]) {
      put(panel, slab([0.08, rail, w], aluFrame, 0.02), [
        0,
        (sign * (h - rail)) / 2,
        0,
      ]);
      put(panel, slab([0.08, h - rail * 2, rail], aluFrame, 0.02), [
        0,
        0,
        (sign * (w - rail)) / 2,
      ]);
    }
    // A bright chamfer round the opening, as on the columns.
    for (const sign of [-1, 1]) {
      put(panel, sheet([0.02, 0.03, w - rail * 2], aluBright), [
        0.04,
        sign * (h / 2 - rail),
        0,
      ]);
      put(panel, sheet([0.02, h - rail * 2, 0.03], aluBright), [
        0.04,
        0,
        sign * (w / 2 - rail),
      ]);
    }
    // Ball studs on the inside, which is how a panel like this is held.
    for (const sy of [-1, 1])
      for (const sz of [-1, 1])
        put(panel, slab([0.17, 0.17, 0.17], rubber, 0.07), [
          -0.1,
          (sy * (h - 0.8)) / 2,
          (sz * (w - 0.8)) / 2,
        ]);
    return panel;
  };
  add('frontpanel', meshFront(), [FRONT - 0.045, 0, MIDZ], [4.4, 1.4, 0]);

  // ── Dust filters ────────────────────────────────────────────────────────
  //
  // Fine nylon mesh in a thin frame, over every opening that draws air in.
  // The weave is a map rather than holes (see `filterWeaveTexture`), and it
  // is kept faint enough that the picker looks through it to the fan behind.
  const weave = (w: number, h: number) =>
    new T.MeshStandardMaterial({
      color: '#0c0e0f',
      roughness: 0.9,
      metalness: 0,
      alphaMap: filterWeaveTexture([w / 0.05, h / 0.05]),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      side: T.DoubleSide,
    });
  /** A filter in its own frame, lying in the X-Z plane, face up. */
  const filter = (w: number, d: number, border: number) => {
    const group = new T.Group();
    const cloth = new T.Mesh(new T.PlaneGeometry(w, d), weave(w, d));
    cloth.rotation.x = -Math.PI / 2;
    group.add(cloth);
    const edge = finish('plastic', '#101315');
    for (const sign of [-1, 1]) {
      put(group, slab([w, 0.035, border], edge, 0.01), [
        0,
        0,
        (sign * (d - border)) / 2,
      ]);
      put(group, slab([border, 0.035, d - border * 2], edge, 0.01), [
        (sign * (w - border)) / 2,
        0,
        0,
      ]);
    }
    return group;
  };

  // Front: between the mesh and the fans, and wide enough to cover all three
  // but not so wide that it runs into the panel's studs.
  const frontFilter = filter(HEIGHT - 1.1, 5.1, 0.1);
  frontFilter.rotation.z = Math.PI / 2;
  add('dustfilter', frontFilter, [FRONT - 0.13, 0, MIDZ], [4.0, 1.2, 0]);

  // Bottom: a slide-out tray under the supply's intake, run in two rails and
  // drawn out of the back by its tab, which is where a supply filter is
  // reached from with the case against a wall. It sits between the feet,
  // which is what lets it slide past them.
  const bottom = new T.Group();
  const bottomLength = s.psu.across + 0.5,
    bottomWidth = s.psu.across + 0.2;
  put(bottom, filter(bottomLength, bottomWidth, 0.12), [0, 0, 0]);
  put(bottom, slab([0.16, 0.05, 1.4], finish('plastic', '#15181a'), 0.02), [
    -bottomLength / 2 - 0.06,
    -0.01,
    0,
  ]);
  const bottomX = REAR + 0.1 + bottomLength / 2;
  add('dustfilter', bottom, [bottomX, FLOOR - 0.05, s.psu.z], [-4.2, 0, 0]);
  // The rails it runs in, fixed to the floor.
  const rails = new T.Group();
  for (const sz of [-1, 1])
    put(rails, sheet([bottomLength, 0.06, 0.08], steelInner), [
      0,
      0,
      (sz * (bottomWidth + 0.1)) / 2,
    ]);
  add('chassis', rails, [bottomX, FLOOR - 0.03, s.psu.z], [0, 0, -2.4]);

  // The solid side, behind the tray. Steel, with the thumbscrews that hold it.
  const backPanel = new T.Group();
  put(
    backPanel,
    slab([DEPTH - COL * 2 - 0.1, HEIGHT - 0.5, 0.08], steel, 0.02),
    [0, 0, 0],
  );
  put(
    backPanel,
    slab([DEPTH - COL * 2 - 0.5, 0.05, 0.04], alu, 0.01),
    [0, 0, -0.06],
  );
  for (const sy of [-1, 1])
    for (const sx of [-1, 1])
      put(backPanel, buildScrew(material, 0.08), [
        (sx * (DEPTH - COL * 2 - 0.7)) / 2,
        (sy * (HEIGHT - 1.1)) / 2,
        -0.07,
      ]);
  add('sidepanel', backPanel, [MIDX, 0, BACK - 0.04], [0, -1.2, -4.6]);

  /**
   * The lid: a mesh insert dropped into a recess in the roof rather than a
   * slab floating above it. The gap between a panel and its frame is the
   * detail that tells you whether a case was assembled or approximated, so
   * this one sits in its opening with the frame proud around it.
   *
   * Everything on it is under the roof sheet or inside the opening. Its
   * screws, a trim strip and a label used to sit where the roof sheet is, so
   * they came through it.
   */
  const top = new T.Group();
  const lidWidth = ROOF_OPEN.width + 0.7;
  const lidDepth = ROOF_OPEN.depth + 0.7;
  for (const [w, d, x, z] of plateWithHoles(lidWidth, lidDepth, [
    [ROOF_OPEN.width + 0.14, ROOF_OPEN.depth + 0.14, 0, 0],
  ]))
    put(top, sheet([w, 0.09, d], alu), [x, 0, z]);
  // Two rails, near the ends: one down the middle came within a few
  // millimetres of the cooler's heat pipes.
  for (const x of [-(lidWidth / 2 - 1.1), lidWidth / 2 - 1.1])
    put(top, slab([0.14, 0.1, lidDepth - 0.35], steelInner), [x, -0.095, 0]);
  const lid = buildPerforation(
    material,
    ROOF_OPEN.width + 0.12,
    ROOF_OPEN.depth + 0.12,
    0.05,
    0.17,
    '#23282c',
  );
  lid.rotation.x = -Math.PI / 2;
  put(top, lid, [0, 0.02, 0]);
  add('toppanel', top, [ROOF_OPEN.x, ROOF - 0.14, MIDZ], [0, 4.4, 0]);

  // Top: a magnetic sheet lying in the opening, on the lid's mesh.
  add(
    'dustfilter',
    filter(ROOF_OPEN.width - 0.04, ROOF_OPEN.depth - 0.04, 0.09),
    [ROOF_OPEN.x, ROOF - 0.055, MIDZ],
    [0, 5.8, 0],
  );

  return { COL, MIDX, MIDZ, WIDTH, DEPTH, HEIGHT };
}
