import * as T from 'three';
import { roundedBox } from './geometry-cache.ts';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ModelTools } from './hardware.ts';
import type { Piece } from './models.ts';
import type { Vec3 } from './layout.ts';
import { finishes } from './materials.ts';
import { bladeGeometry } from './graphics-card.ts';
import {
  buildCapacitor,
  buildChip,
  buildHeader,
  buildScrew,
  glowMaterial,
} from './parts.ts';

/**
 * Shared workshop for the second and third graphics cards.
 *
 * The RTX 5090 builder predates this file and is left exactly as it was. The
 * Radeon and Arc cards are built from the same kinds of parts, so rather than
 * copy the 5090's helpers twice they live here once.
 *
 * ── Units ────────────────────────────────────────────────────────────────
 * Every helper takes millimetres. `MM` is the RTX 5090's own scale, 8.93 scene
 * units for its 348 mm length, so all three cards come out at their true
 * relative sizes and a 272 mm Arc really is shorter than a 331 mm Radeon.
 *
 * ── Local frame, identical to the 5090 ────────────────────────────────────
 *   +X  along the card, away from the bracket   −X  the bracket end
 *   +Y  out of the board, the way the fans face
 *   +Z  across the card, towards the PCIe edge   −Z  the top edge
 */
export const MM = 8.93 / 348;

export function cardKit(tools: ModelTools) {
  const { material } = tools;
  const finish = finishes();
  /** Every part placed through the kit, for the free-space search below. */
  const placed: Piece[] = [];
  const add: ModelTools['add'] = (...args) => {
    const p = tools.add(...args);
    placed.push(p);
    return p;
  };
  const instances: ModelTools['instances'] = (...args) => {
    const p = tools.instances(...args);
    placed.push(...p);
    return p;
  };
  const m = (n: number) => n * MM;
  const v = (x: number, y: number, z: number): Vec3 => [m(x), m(y), m(z)];
  const put = <O extends T.Object3D>(
    g: T.Object3D,
    o: O,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    o.position.set(...v(x, y, z));
    g.add(o);
    return o;
  };
  /** Place a part at a millimetre position; delta stays in scene units. */
  const register = (
    id: string,
    o: T.Object3D,
    x: number,
    y: number,
    z: number,
    delta: Vec3 = [0, 1, 0],
  ) => add(id, o, v(x, y, z), delta, 0);

  const black = material('#0c0e11', 0.12, 0.85),
    nickel = material('#8e9395', 0.84, 0.65),
    gold = material('#b29859', 0.72, 0.6),
    copper = finish('copper'),
    steel = finish('brushed', '#82878a', 0.5);
  black.envMapIntensity = 0.35;
  nickel.envMapIntensity = 0.7;

  const box = (w: number, h: number, d: number, mat: T.Material = black) =>
    new T.Mesh(new T.BoxGeometry(m(w), m(h), m(d)), mat);
  const slab = (
    w: number,
    h: number,
    d: number,
    mat: T.Material,
    radius = 0.8,
  ) =>
    new T.Mesh(
      roundedBox(
        m(w),
        m(h),
        m(d),
        2,
        m(Math.min(radius, Math.min(w, h, d) * 0.45)),
      ),
      mat,
    );
  /** Printed text lying on a face, sized in millimetres. */
  const text = (
    g: T.Group,
    words: string,
    x: number,
    y: number,
    z: number,
    width: number,
    color?: string,
  ) => tools.label(g, words, v(x, y, z), m(width), color);

  /** A closed outline in millimetres, in the card's X–Z plane. */
  const outline = (
    points: [number, number][],
    holes: T.Path[] = [],
  ): T.Shape => {
    const s = new T.Shape();
    points.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z)));
    s.closePath();
    s.holes.push(...holes);
    return s;
  };
  /** A rectangle with chamfered corners. */
  const chamfered = (halfX: number, halfZ: number, cut: number) =>
    outline([
      [-halfX + cut, -halfZ],
      [halfX - cut, -halfZ],
      [halfX, -halfZ + cut],
      [halfX, halfZ - cut],
      [halfX - cut, halfZ],
      [-halfX + cut, halfZ],
      [-halfX, halfZ - cut],
      [-halfX, -halfZ + cut],
    ]);
  const circle = (x: number, z: number, r: number) => {
    const p = new T.Path();
    p.absarc(x, z, r, 0, Math.PI * 2, true);
    return p;
  };
  const rect = (x0: number, z0: number, x1: number, z1: number) => {
    const p = new T.Path();
    p.moveTo(x0, z0);
    p.lineTo(x0, z1);
    p.lineTo(x1, z1);
    p.lineTo(x1, z0);
    p.closePath();
    return p;
  };
  /**
   * Extrude an outline into a plate lying in X–Z, thickness along +Y. The
   * shape is authored in millimetres and scaled once, so bevels stay in
   * proportion on every card.
   */
  const plate = (shape: T.Shape, thickness: number, mat: T.Material) => {
    const g = new T.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSize: 0.35,
      bevelThickness: 0.25,
      bevelSegments: 1,
      curveSegments: 40,
    });
    g.rotateX(Math.PI / 2);
    g.translate(0, thickness, 0);
    g.scale(MM, MM, MM);
    return new T.Mesh(g, mat);
  };

  /** A leaded IC with a printed marking. */
  const chip = (
    id: string,
    marking: string,
    x: number,
    z: number,
    w = 7,
    d = w,
    delta: Vec3 = [x < 0 ? -0.6 : 0.6, 0.9, z * 0.006],
  ) => {
    const g = new T.Group();
    put(g, buildChip(material, v(w, 1.5, d), 6, true, '#101215'));
    text(g, marking, 0, 0.9, 0, w * 0.78, '#818786');
    return register(id, g, x, 1.8, z, delta);
  };

  /** A sealed copper heat pipe along a smooth path, nickel plated. */
  const heatpipe = (
    id: string,
    points: Vec3[],
    radius: number,
    delta: Vec3,
    mat: T.Material = nickel,
  ) => {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...v(...p))),
    );
    return register(
      id,
      new T.Mesh(new T.TubeGeometry(curve, 48, m(radius), 10, false), mat),
      0,
      0,
      0,
      delta,
    );
  };

  /** A square ball grid under a package. */
  const ballGrid = (n: number, pitch: number) => {
    const g = new T.Group();
    const balls = new T.InstancedMesh(
      new T.SphereGeometry(m(0.35), 6, 4),
      nickel,
      n * n,
    );
    const matrix = new T.Matrix4();
    for (let i = 0; i < n * n; i++) {
      matrix.makeTranslation(
        m(((i % n) - (n - 1) / 2) * pitch),
        0,
        m((Math.floor(i / n) - (n - 1) / 2) * pitch),
      );
      balls.setMatrixAt(i, matrix);
    }
    g.add(balls);
    return g;
  };

  /** One merged, vertex-coloured capacitor geometry for instancing. */
  const capacitorGeometry = (radius: number, height: number) => {
    const cap = buildCapacitor(material, m(radius), m(height), '#202426');
    const parts: T.BufferGeometry[] = [];
    cap.updateMatrixWorld(true);
    cap.traverse((o) => {
      if (!(o instanceof T.Mesh)) return;
      const g = o.geometry.toNonIndexed();
      g.applyMatrix4(o.matrixWorld);
      const c = (o.material as T.MeshStandardMaterial).color;
      const colors = new Float32Array(g.getAttribute('position').count * 3);
      for (let i = 0; i < colors.length; i += 3) c.toArray(colors, i);
      g.setAttribute('color', new T.BufferAttribute(colors, 3));
      parts.push(g);
    });
    const merged = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    cap.traverse((o) => {
      if (o instanceof T.Mesh) o.geometry.dispose();
    });
    return merged;
  };

  /**
   * Resistors and ceramic capacitors in whatever board area is still free.
   *
   * Scatter by searching a fine grid and rejecting cells that touch anything
   * already placed, the same approach the 5090 takes, so no passive ever sits
   * inside a memory chip or a controller.
   */
  const passives = (
    resistorId: string,
    ceramicId: string,
    families: string[],
    bounds: { x0: number; x1: number; z0: number; z1: number },
    count: number,
  ) => {
    const occupied = placed.filter((p) => families.includes(p.concept));
    const resistors: Vec3[] = [],
      ceramics: Vec3[] = [];
    const cols = Math.floor((bounds.x1 - bounds.x0) / 3),
      rows = Math.floor((bounds.z1 - bounds.z0) / 3),
      cells = cols * rows;
    for (
      let i = 0;
      i < cells && (resistors.length < count || ceramics.length < count);
      i++
    ) {
      const k = (i * 1297) % cells,
        x = m(bounds.x0 + (k % cols) * 3),
        z = m(bounds.z0 + Math.floor(k / cols) * 3);
      if (
        occupied.some(
          (p) =>
            Math.abs(x - p.base.x - p.center.x) < p.extent.x / 2 + m(1.4) &&
            Math.abs(z - p.base.z - p.center.z) < p.extent.z / 2 + m(1.4),
        )
      )
        continue;
      const bucket = resistors.length <= ceramics.length ? resistors : ceramics;
      bucket.push([x, m(1.3), z]);
    }
    instances(resistorId, resistors, v(2, 0.7, 1), 0, '#25282a').forEach((p) =>
      p.delta.set(-1.4, 0.25, p.base.z * 0.3),
    );
    instances(ceramicId, ceramics, v(1.8, 0.8, 1), 0, '#8c8068').forEach((p) =>
      p.delta.set(-0.8, 0.45, p.base.z * 0.4),
    );
  };

  /**
   * An axial fan: `blades` swept blades on a hub, optionally tied together by
   * an outer ring. Spins about +Y like every fan in the project.
   */
  const fan = (
    radius: number,
    blades: number,
    options: {
      ring?: boolean;
      reverse?: boolean;
      badge?: string;
      hubColor?: string;
      bladeColor?: string;
    } = {},
  ) => {
    const group = new T.Group();
    let geometry = bladeGeometry();
    if (options.reverse) {
      geometry = geometry.scale(1, 1, -1);
      const ix = geometry.getIndex()!;
      for (let i = 0; i < ix.count; i += 3) {
        const b = ix.getX(i + 1);
        ix.setX(i + 1, ix.getX(i + 2));
        ix.setX(i + 2, b);
      }
    }
    const R = m(radius);
    const impeller = new T.InstancedMesh(
      geometry,
      finish('plastic', options.bladeColor ?? '#0a0c0e'),
      blades,
    );
    const helper = new T.Object3D();
    // Narrower blades when there are many of them, so eleven do not overlap
    // into a solid disc.
    const chord = Math.min(1, 7 / blades) ** 0.55;
    for (let i = 0; i < blades; i++) {
      helper.rotation.set(0, (i * Math.PI * 2) / blades, 0);
      helper.scale.set(R, R, R * chord);
      helper.updateMatrix();
      impeller.setMatrixAt(i, helper.matrix);
    }
    impeller.userData.spinRate = options.reverse ? -3.2 : 3.2;
    group.add(impeller);
    const hub = new T.Mesh(
      new T.CylinderGeometry(R * 0.3, R * 0.31, R * 0.17, 40),
      finish('plasticGloss', options.hubColor ?? '#0b0d0f'),
    );
    hub.position.y = R * 0.03;
    group.add(hub);
    if (options.ring) {
      const ring = new T.Mesh(
        new T.TorusGeometry(R * 0.995, R * 0.02, 8, 64),
        finish('plastic', options.bladeColor ?? '#0a0c0e'),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = R * 0.03;
      group.add(ring);
    }
    if (options.badge) {
      const badge = new T.Group();
      tools.label(badge, options.badge, [0, 0, 0], R * 0.42, '#c6c9c7');
      badge.position.y = R * 0.125;
      group.add(badge);
    }
    return group;
  };

  /** A copper-wound stator on its hub plate, under a fan. */
  const fanMotor = (id: string, x: number, y: number, radius: number) => {
    const motor = new T.Group();
    put(
      motor,
      new T.Mesh(
        new T.CylinderGeometry(m(radius), m(radius), m(1), 28),
        material('#203a2d', 0.15),
      ),
    );
    for (let j = 0; j < 9; j++) {
      const a = (j * Math.PI * 2) / 9,
        coil = new T.Mesh(
          new T.TorusGeometry(m(radius * 0.18), m(radius * 0.07), 6, 12),
          material('#94613d', 0.8, 0.7),
        );
      coil.rotation.x = Math.PI / 2;
      put(
        motor,
        coil,
        Math.cos(a) * radius * 0.6,
        1.7,
        Math.sin(a) * radius * 0.6,
      );
    }
    put(
      motor,
      new T.Mesh(new T.CylinderGeometry(m(1.8), m(1.8), m(4), 16), nickel),
      0,
      1.5,
      0,
    );
    return register(id, motor, x, y, 0, [x * MM * 0.4, 4.3, 0]);
  };

  /** A fan lead: a four-wire harness from a header up to a motor. */
  const fanCable = (id: string, path: Vec3[], delta: Vec3) => {
    const cable = new T.Group();
    for (let j = 0; j < 4; j++) {
      const curve = new T.CatmullRomCurve3(
        path.map(
          ([x, y, z], i) =>
            new T.Vector3(...v(x + (i === 0 ? j : j * 0.4), y, z)),
        ),
      );
      cable.add(
        new T.Mesh(new T.TubeGeometry(curve, 32, m(0.45), 5, false), black),
      );
    }
    return register(id, cable, 0, 0, 0, delta);
  };

  const fanHeader = (id: string, x: number, z: number, delta: Vec3) =>
    register(
      id,
      buildHeader(material, 4, 1, m(1.5), '#34383a', m(4)),
      x,
      3,
      z,
      delta,
    );

  /**
   * A display socket seen end on through the bracket. HDMI's mouth is a
   * trapezoid; DisplayPort's has one chamfered corner.
   */
  const displaySocket = (kind: 'dp' | 'hdmi') => {
    const port = new T.Group(),
      hdmi = kind === 'hdmi';
    for (const y of [-2.4, 2.4])
      put(port, box(15, 0.65, hdmi ? 14 : 16, nickel), 0, y, 0);
    for (const side of [-1, 1]) {
      const wall = box(15, 4.8, 0.65, nickel);
      if (hdmi) wall.rotation.x = side * 0.2;
      put(port, wall, 0, 0, side * (hdmi ? 6.8 : 7.8));
    }
    put(port, box(0.7, 4, 13, black), 6.8, 0, 0);
    put(port, box(12, 0.7, hdmi ? 10 : 12, black), 0, -0.6, 0);
    for (let j = 0; j < (hdmi ? 19 : 20); j++)
      put(port, box(9, 0.12, 0.25, gold), -1, -0.15, -5 + j * 0.52);
    return port;
  };

  /**
   * The gold-fingered edge connector. `lanes` sets how many contacts are
   * populated; the key notch sits 11 contacts in, as on every PCIe card.
   */
  const edgeConnector = (
    length: number,
    contacts: number,
    board = '#242d20',
  ) => {
    const g = new T.Group();
    put(g, box(12, 1.5, 10, material(board, 0.1)), -length / 2 + 6, 0, 0);
    put(g, box(length - 14, 1.5, 10, material(board, 0.1)), 7, 0, 0);
    for (const side of [-1, 1])
      for (let i = 0; i < contacts; i++)
        put(
          g,
          box(0.6, 0.12, 8, gold),
          -length / 2 + 1 + i + (i >= 11 ? 2 : 0),
          side * 0.81,
          0,
        );
    return g;
  };

  /** A perforated steel bracket spanning `slots` expansion slots. */
  const bracket = (height: number, depth: number) => {
    const g = new T.Group();
    for (const y of [-depth * 0.45, -depth * 0.2, depth * 0.1, depth * 0.43])
      put(g, slab(1.4, 4, height * 0.9, steel), 0, y, 0);
    for (const z of [-height * 0.45, height * 0.45])
      put(g, slab(1.4, depth * 0.9, 4.5, steel), 0, 0, z);
    const vents = Math.floor(height / 7);
    for (let i = 0; i < vents; i++)
      put(
        g,
        slab(1.4, depth * 0.24, 1.8, steel),
        0,
        depth * 0.28,
        -height * 0.42 + (i * height * 0.84) / (vents - 1),
      );
    put(g, slab(14, depth * 0.85, 2.8, steel), 4.5, 0, height * 0.465);
    return g;
  };

  const glow = glowMaterial;
  const screw = (r: number) => buildScrew(material, m(r));

  return {
    finish,
    placed,
    add,
    instances,
    m,
    v,
    put,
    register,
    box,
    slab,
    text,
    outline,
    chamfered,
    circle,
    rect,
    plate,
    chip,
    heatpipe,
    ballGrid,
    capacitorGeometry,
    passives,
    fan,
    fanMotor,
    fanCable,
    fanHeader,
    displaySocket,
    edgeConnector,
    bracket,
    glow,
    screw,
    materials: { black, nickel, gold, copper, steel },
  };
}

export type CardKit = ReturnType<typeof cardKit>;
