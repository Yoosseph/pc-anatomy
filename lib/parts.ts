import * as T from 'three';
import type { Vec3 } from './layout.ts';

/**
 * Small mechanical pieces that appear all over a machine: fans, heatsinks,
 * grilles, connectors, capacitors and chokes.
 *
 * Everything is built around the origin and points, stacks or blows along +Y,
 * so callers place and rotate it. Geometry is authored from how these parts are
 * actually made — a fan really does have four motor struts and rubber corner
 * pads, a supply really does exhaust through a hex grille — but no dimension
 * here is taken from a specific product.
 */

export type MaterialFn = (
  color: string,
  metal?: number,
  rough?: number,
) => T.MeshStandardMaterial;

/**
 * A surface that reads as its own light source: lit fan rings, strips and
 * logos. Emissive only — it glows at any camera angle but does not illuminate
 * anything, so pair it with a small point light where the colour should spill.
 */
export function glowMaterial(color: string, intensity = 2.2, opacity = 1) {
  return new T.MeshStandardMaterial({
    color: '#0b0c0d',
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.45,
    metalness: 0,
    transparent: opacity < 1,
    opacity,
    side: opacity < 1 ? T.DoubleSide : T.FrontSide,
  });
}

/** A short strip of light, as sold on adhesive tape and built into shrouds. */
export function buildLightStrip(
  length: number,
  thickness: number,
  color: string,
  intensity = 2.1,
) {
  const group = new T.Group();
  group.add(
    new T.Mesh(
      new T.BoxGeometry(length, thickness, thickness),
      glowMaterial(color, intensity),
    ),
  );
  // A wider, dimmer sheet behind it stands in for the spill on the surface.
  const wash = new T.Mesh(
    new T.BoxGeometry(length, thickness * 0.3, thickness * 3.4),
    glowMaterial(color, 0.42, 0.3),
  );
  wash.position.y = -thickness * 0.55;
  group.add(wash);
  return group;
}

// ── Fans ──────────────────────────────────────────────────────────────────

/**
 * One fan blade: a swept, cambered, twisted surface with real thickness and
 * closed edges. Flat quads read as a paper pinwheel; this reads as a fan.
 */
function bladeGeometry(inner: number, outer: number, thickness: number) {
  const verts: number[] = [],
    indices: number[] = [];
  const rows = 14,
    cols = 7;
  for (let side = 0; side < 2; side++)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const t = r / (rows - 1),
          u = c / (cols - 1) - 0.5;
        // Chord widens toward the tip, and the trailing edge sweeps back.
        const chord = 0.46 + 0.34 * t - 0.22 * t * t;
        const radius = inner + t * (outer - inner);
        const angle = 0.52 * Math.pow(t, 1.15) + u * chord;
        // Camber across the chord plus pitch that flattens toward the tip.
        const camber = Math.cos(u * Math.PI) * 0.09 * (1 - 0.45 * t);
        const pitch = u * (0.42 - 0.16 * t);
        // Taper the blade thinner at the tip, like a moulded blade.
        const skin = thickness * (1 - 0.55 * t) * (1 - Math.abs(u) * 0.7);
        verts.push(
          Math.cos(angle) * radius,
          (camber + pitch) * outer + (side ? skin : -skin),
          Math.sin(angle) * radius,
        );
      }
  for (let side = 0; side < 2; side++)
    for (let r = 0; r < rows - 1; r++)
      for (let c = 0; c < cols - 1; c++) {
        const a = side * rows * cols + r * cols + c,
          b = a + 1,
          d = a + cols,
          e = d + 1;
        indices.push(...(side ? [a, d, b, b, d, e] : [a, b, d, b, e, d]));
      }
  const layer = rows * cols;
  for (let r = 0; r < rows - 1; r++)
    for (const c of [0, cols - 1]) {
      const a = r * cols + c,
        b = (r + 1) * cols + c;
      indices.push(a, a + layer, b, b, a + layer, b + layer);
    }
  for (let c = 0; c < cols - 1; c++)
    for (const r of [0, rows - 1]) {
      const a = r * cols + c,
        b = a + 1;
      indices.push(a, b, a + layer, b, b + layer, a + layer);
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Square frame with a circular bore, chamfered corners and mounting holes. */
function fanFrame(size: number, depth: number) {
  const half = size / 2,
    radius = size * 0.075;
  const shape = new T.Shape();
  shape.moveTo(-half + radius, -half);
  shape.lineTo(half - radius, -half);
  shape.quadraticCurveTo(half, -half, half, -half + radius);
  shape.lineTo(half, half - radius);
  shape.quadraticCurveTo(half, half, half - radius, half);
  shape.lineTo(-half + radius, half);
  shape.quadraticCurveTo(-half, half, -half, half - radius);
  shape.lineTo(-half, -half + radius);
  shape.quadraticCurveTo(-half, -half, -half + radius, -half);
  const bore = new T.Path();
  bore.absarc(0, 0, size * 0.474, 0, Math.PI * 2, true);
  shape.holes.push(bore);
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const hole = new T.Path();
      hole.absarc(
        sx * half * 0.835,
        sy * half * 0.835,
        size * 0.034,
        0,
        Math.PI * 2,
        true,
      );
      shape.holes.push(hole);
    }
  const geometry = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: size * 0.006,
    bevelSize: size * 0.006,
    bevelSegments: 1,
    curveSegments: 22,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -depth / 2, 0);
  return geometry;
}

export interface FanOptions {
  /** Frame edge length. A 120 mm fan at 1 unit ≈ 35 mm is about 3.4. */
  size: number;
  blades?: number;
  frameColor?: string;
  bladeColor?: string;
  hubColor?: string;
  /** Rotational offset so a row of fans does not look stamped from one part. */
  phase?: number;
  /** Rubber corner pads, as case fans have and card fans do not. */
  pads?: boolean;
  /** A wire finger guard over the intake face. */
  guard?: boolean;
  /** The sleeved lead leaving one corner. */
  cable?: boolean;
  /**
   * Lit diffuser ring on the intake face, as addressable fans have. Pass the
   * colour; the ring glows on its own and the caller adds a matching point
   * light if the colour should also spill onto what is around it.
   */
  rgb?: string;
}

/**
 * An axial fan blowing along +Y: frame, hub, swept blades, motor struts and
 * the small details that stop it reading as a disc in a square hole.
 */
export function buildFan(material: MaterialFn, options: FanOptions) {
  const {
    size,
    blades = 9,
    frameColor = '#212528',
    bladeColor = '#2c3237',
    hubColor = '#16191c',
    phase = 0,
    pads = false,
    guard = false,
    cable = false,
    rgb,
  } = options;
  const group = new T.Group();
  const depth = size * 0.213;
  const half = size / 2;

  group.add(new T.Mesh(fanFrame(size, depth), material(frameColor, 0.22, 0.58)));

  // Hub: barrel, domed cap and a printed ring where the label sits.
  const hubRadius = size * 0.163;
  group.add(
    new T.Mesh(
      new T.CylinderGeometry(hubRadius, hubRadius * 0.96, depth * 0.78, 30),
      material(hubColor, 0.4, 0.45),
    ),
  );
  const cap = new T.Mesh(
    new T.SphereGeometry(hubRadius * 0.95, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2.6),
    material('#31383d', 0.52, 0.34),
  );
  cap.position.y = depth * 0.36;
  cap.scale.y = 0.42;
  group.add(cap);
  const ring = new T.Mesh(
    new T.TorusGeometry(hubRadius * 0.7, hubRadius * 0.05, 6, 26),
    material('#4b545a', 0.6, 0.4),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = depth * 0.42;
  group.add(ring);

  const blade = new T.InstancedMesh(
    bladeGeometry(hubRadius * 0.96, size * 0.462, size * 0.011),
    material(bladeColor, 0.26, 0.52),
    blades,
  );
  const helper = new T.Object3D();
  for (let i = 0; i < blades; i++) {
    helper.position.set(0, 0, 0);
    helper.rotation.set(0, phase + (i / blades) * Math.PI * 2, 0);
    helper.updateMatrix();
    blade.setMatrixAt(i, helper.matrix);
  }
  blade.castShadow = blade.receiveShadow = true;
  group.add(blade);

  // Four struts carrying the motor, visible through the blades from behind.
  const strut = new T.BoxGeometry(size * 0.03, depth * 0.14, size * 0.44);
  const strutMaterial = material(frameColor, 0.24, 0.56);
  for (let i = 0; i < 4; i++) {
    const arm = new T.Mesh(strut, strutMaterial);
    arm.position.set(0, -depth * 0.41, 0);
    arm.rotation.y = (i / 4) * Math.PI * 2 + 0.35;
    arm.translateZ(size * 0.25);
    group.add(arm);
  }

  if (pads) {
    const pad = new T.BoxGeometry(size * 0.15, depth * 1.03, size * 0.15);
    const padMaterial = material('#101213', 0.02, 0.94);
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        const corner = new T.Mesh(pad, padMaterial);
        corner.position.set(sx * half * 0.85, 0, sy * half * 0.85);
        group.add(corner);
      }
  }

  if (guard) {
    const wire = material('#8f979c', 0.9, 0.28);
    const gauge = size * 0.009;
    for (let i = 1; i <= 4; i++) {
      const hoop = new T.Mesh(
        new T.TorusGeometry(size * 0.11 * i, gauge, 5, 30),
        wire,
      );
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = depth * 0.56;
      group.add(hoop);
    }
    const spoke = new T.BoxGeometry(gauge * 2, gauge * 2, size * 0.9);
    for (let i = 0; i < 6; i++) {
      const arm = new T.Mesh(spoke, wire);
      arm.position.y = depth * 0.56;
      arm.rotation.y = (i / 6) * Math.PI;
      group.add(arm);
    }
  }

  if (rgb) {
    // A frosted diffuser ring around the bore, plus a thin inner halo. Emissive
    // rather than lit, so it reads as a source at any camera angle.
    group.add(
      (() => {
        const ring = new T.Mesh(
          new T.TorusGeometry(size * 0.408, size * 0.03, 8, 40),
          glowMaterial(rgb, 2.6),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = depth * 0.44;
        return ring;
      })(),
    );
    const halo = new T.Mesh(
      new T.RingGeometry(size * 0.19, size * 0.378, 40),
      glowMaterial(rgb, 0.5, 0.34),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = depth * 0.5;
    group.add(halo);
  }

  if (cable) {
    const path = new T.CatmullRomCurve3([
      new T.Vector3(half * 0.8, -depth * 0.3, half * 0.8),
      new T.Vector3(half * 1.05, -depth * 0.5, half * 1.0),
      new T.Vector3(half * 1.25, -depth * 1.4, half * 0.75),
    ]);
    group.add(
      new T.Mesh(
        new T.TubeGeometry(path, 10, size * 0.016, 6, false),
        material('#0e1011', 0.1, 0.85),
      ),
    );
  }
  return group;
}

// ── Grilles ───────────────────────────────────────────────────────────────

/**
 * A hexagonal exhaust grille — the punched pattern on the back of a power
 * supply. Built as one extruded plate with real holes, so you see through it.
 */
export function buildHoneycomb(
  material: MaterialFn,
  width: number,
  height: number,
  thickness: number,
  cell: number,
  color = '#31363a',
) {
  const shape = new T.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
  const stepX = cell * 1.74,
    stepY = cell * 1.5;
  const columns = Math.floor(width / stepX),
    rows = Math.floor(height / stepY);
  for (let r = 0; r <= rows; r++)
    for (let c = 0; c <= columns; c++) {
      const x = (c - columns / 2) * stepX + (r % 2 ? stepX / 2 : 0);
      const y = (r - rows / 2) * stepY;
      if (Math.abs(x) > width / 2 - cell || Math.abs(y) > height / 2 - cell)
        continue;
      const hole = new T.Path();
      // A hexagon, flat-topped, traced directly rather than approximated.
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
        const hx = x + Math.cos(a) * cell * 0.92,
          hy = y + Math.sin(a) * cell * 0.92;
        if (k === 0) hole.moveTo(hx, hy);
        else hole.lineTo(hx, hy);
      }
      hole.closePath();
      shape.holes.push(hole);
    }
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, -thickness / 2);
  return new T.Mesh(geometry, material(color, 0.82, 0.34));
}

/** A punched round-hole vent panel, as used on case side and top panels. */
export function buildPerforation(
  material: MaterialFn,
  width: number,
  height: number,
  thickness: number,
  pitch: number,
  color = '#3b4146',
) {
  const shape = new T.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  const columns = Math.floor(width / pitch),
    rows = Math.floor(height / pitch);
  for (let r = 0; r <= rows; r++)
    for (let c = 0; c <= columns; c++) {
      const x = (c - columns / 2) * pitch + (r % 2 ? pitch / 2 : 0);
      const y = (r - rows / 2) * pitch;
      if (Math.abs(x) > width / 2 - pitch || Math.abs(y) > height / 2 - pitch)
        continue;
      const hole = new T.Path();
      hole.absarc(x, y, pitch * 0.31, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  const geometry = new T.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 7,
  });
  geometry.translate(0, 0, -thickness / 2);
  return new T.Mesh(geometry, material(color, 0.76, 0.42));
}

// ── Heatsinks ─────────────────────────────────────────────────────────────

/**
 * A finned heatsink with a solid base. Fins run in the X–Z plane and stack
 * along Y, which is how a tower cooler and a VRM block are both built.
 */
export function buildFinStack(
  material: MaterialFn,
  count: number,
  size: Vec3,
  pitch: number,
  color = '#aeb6bb',
) {
  const group = new T.Group();
  const fin = new T.BoxGeometry(size[0], size[1], size[2]);
  const finMaterial = material(color, 0.88, 0.26);
  for (let i = 0; i < count; i++) {
    const mesh = new T.Mesh(fin, finMaterial);
    mesh.position.y = (i - (count - 1) / 2) * pitch;
    group.add(mesh);
  }
  return group;
}

/** A low block heatsink with a machined base and square fin pillars. */
export function buildBlockSink(
  material: MaterialFn,
  width: number,
  depth: number,
  height: number,
  color = '#5b6165',
) {
  const group = new T.Group();
  const body = material(color, 0.86, 0.3);
  const base = new T.Mesh(new T.BoxGeometry(width, height * 0.3, depth), body);
  group.add(base);
  const columns = Math.max(3, Math.round(width / (height * 0.42)));
  const fin = new T.BoxGeometry(width / columns / 2.1, height * 0.7, depth * 0.92);
  for (let i = 0; i < columns; i++) {
    const blade = new T.Mesh(fin, body);
    blade.position.set(
      (i - (columns - 1) / 2) * (width / columns),
      height * 0.5,
      0,
    );
    group.add(blade);
  }
  return group;
}

// ── Board-level parts ─────────────────────────────────────────────────────

/** An electrolytic capacitor: aluminium can, sleeve, and the scored top. */
export function buildCapacitor(
  material: MaterialFn,
  radius: number,
  height: number,
  color = '#1d2226',
) {
  const group = new T.Group();
  group.add(
    new T.Mesh(
      new T.CylinderGeometry(radius, radius, height, 18),
      material(color, 0.45, 0.42),
    ),
  );
  const top = new T.Mesh(
    new T.CylinderGeometry(radius * 0.97, radius * 0.97, height * 0.04, 18),
    material('#8a9297', 0.9, 0.3),
  );
  top.position.y = height / 2;
  group.add(top);
  // The stamped relief score, which is how you tell a cap from a cylinder.
  const score = new T.BoxGeometry(radius * 1.7, height * 0.05, radius * 0.12);
  for (let i = 0; i < 3; i++) {
    const line = new T.Mesh(score, material('#3f474c', 0.7, 0.5));
    line.position.y = height / 2 + height * 0.012;
    line.rotation.y = (i / 3) * Math.PI;
    group.add(line);
  }
  return group;
}

/** A moulded power inductor: dark block with its two copper terminations. */
export function buildChoke(
  material: MaterialFn,
  size: number,
  height: number,
  color = '#26292c',
) {
  const group = new T.Group();
  group.add(
    new T.Mesh(
      new T.BoxGeometry(size, height, size),
      material(color, 0.26, 0.62),
    ),
  );
  const pad = new T.BoxGeometry(size * 0.26, height * 0.34, size * 1.02);
  for (const side of [-1, 1]) {
    const terminal = new T.Mesh(pad, material('#a8763f', 0.92, 0.3));
    terminal.position.set(side * size * 0.37, -height * 0.33, 0);
    group.add(terminal);
  }
  return group;
}

/** A small surface-mount IC with gull-wing leads down two or four sides. */
export function buildChip(
  material: MaterialFn,
  size: Vec3,
  pins = 6,
  fourSides = false,
  color = '#17191b',
) {
  const group = new T.Group();
  group.add(new T.Mesh(new T.BoxGeometry(...size), material(color, 0.1, 0.55)));
  const lead = new T.BoxGeometry(size[0] / pins / 2.4, size[1] * 0.22, size[2] * 0.2);
  const leadMaterial = material('#aab1b5', 0.92, 0.28);
  for (let edge = 0; edge < (fourSides ? 4 : 2); edge++)
    for (let i = 0; i < pins; i++) {
      const pin = new T.Mesh(lead, leadMaterial);
      const along = ((i + 0.5) / pins - 0.5) * size[edge < 2 ? 0 : 2] * 0.88;
      const out = (edge % 2 ? 1 : -1) * (edge < 2 ? size[2] : size[0]) * 0.56;
      if (edge < 2) pin.position.set(along, -size[1] * 0.34, out);
      else {
        pin.rotation.y = Math.PI / 2;
        pin.position.set(out, -size[1] * 0.34, along);
      }
      group.add(pin);
    }
  return group;
}

/** A shrouded pin header: plastic shell with a grid of gold posts inside. */
export function buildHeader(
  material: MaterialFn,
  columns: number,
  rows: number,
  pitch = 0.075,
  color = '#1b1d20',
  height = 0.13,
) {
  const group = new T.Group();
  const width = columns * pitch + 0.045,
    depth = rows * pitch + 0.045;
  const shellMaterial = material(color, 0.05, 0.66);
  // Four walls, so the shroud is open at the top like the real connector.
  for (const [w, d, x, z] of [
    [width, 0.022, 0, depth / 2],
    [width, 0.022, 0, -depth / 2],
    [0.022, depth, width / 2, 0],
    [0.022, depth, -width / 2, 0],
  ] as const) {
    const wall = new T.Mesh(new T.BoxGeometry(w, height, d), shellMaterial);
    wall.position.set(x, 0, z);
    group.add(wall);
  }
  group.add(
    new T.Mesh(
      new T.BoxGeometry(width, height * 0.2, depth),
      material('#101214', 0.05, 0.7),
    ),
  );
  const pin = new T.BoxGeometry(pitch * 0.26, height * 0.74, pitch * 0.26);
  const pinMaterial = material('#c8a95a', 0.94, 0.22);
  for (let c = 0; c < columns; c++)
    for (let r = 0; r < rows; r++) {
      const post = new T.Mesh(pin, pinMaterial);
      post.position.set(
        (c - (columns - 1) / 2) * pitch,
        height * 0.18,
        (r - (rows - 1) / 2) * pitch,
      );
      group.add(post);
    }
  return group;
}

/**
 * A card-edge slot: the keyed channel a card or memory module drops into, with
 * contact rows inside and a latch at the end.
 */
export function buildSlot(
  material: MaterialFn,
  length: number,
  color: string,
  options: {
    width?: number;
    height?: number;
    notch?: number;
    latch?: boolean;
    armour?: boolean;
  } = {},
) {
  const {
    width = 0.2,
    height = 0.18,
    notch = 0.62,
    latch = false,
    armour = false,
  } = options;
  const group = new T.Group();
  const body = material(color, 0.08, 0.58);
  for (const side of [-1, 1]) {
    const rail = new T.Mesh(
      new T.BoxGeometry(length, height, width * 0.32),
      body,
    );
    rail.position.set(0, 0, (side * width) / 3);
    group.add(rail);
  }
  for (const side of [-1, 1]) {
    const end = new T.Mesh(new T.BoxGeometry(width * 0.5, height, width), body);
    end.position.set((side * (length - width * 0.5)) / 2, 0, 0);
    group.add(end);
  }
  const key = new T.Mesh(
    new T.BoxGeometry(width * 0.38, height * 0.82, width),
    body,
  );
  key.position.set(length * (notch - 0.5), -height * 0.05, 0);
  group.add(key);
  const contact = new T.BoxGeometry(length * 0.94, height * 0.12, width * 0.055);
  const gold = material('#c2a457', 0.93, 0.26);
  for (const side of [-1, 1]) {
    const row = new T.Mesh(contact, gold);
    row.position.set(0, -height * 0.18, side * width * 0.11);
    group.add(row);
  }
  if (latch)
    for (const side of [-1, 1]) {
      const clip = new T.Mesh(
        new T.BoxGeometry(width * 0.55, height * 1.5, width * 0.72),
        material('#d8dce0', 0.2, 0.5),
      );
      clip.position.set((side * (length + width * 0.5)) / 2, height * 0.35, 0);
      group.add(clip);
    }
  if (armour) {
    // The stamped steel shroud around a reinforced primary slot.
    const shell = material('#b6bdc2', 0.93, 0.24);
    for (const side of [-1, 1]) {
      const wall = new T.Mesh(
        new T.BoxGeometry(length + width * 0.9, height * 1.12, width * 0.1),
        shell,
      );
      wall.position.set(0, height * 0.06, side * width * 0.62);
      group.add(wall);
    }
    for (const side of [-1, 1]) {
      const cap = new T.Mesh(
        new T.BoxGeometry(width * 0.1, height * 1.12, width * 1.3),
        shell,
      );
      cap.position.set((side * (length + width * 0.9)) / 2, height * 0.06, 0);
      group.add(cap);
    }
  }
  return group;
}

/** A rectangular port shell — USB, Ethernet, display and audio jacks. */
export function buildPort(
  material: MaterialFn,
  size: Vec3,
  shell: string,
  inner = '#0a0c0d',
) {
  const group = new T.Group();
  group.add(new T.Mesh(new T.BoxGeometry(...size), material(shell, 0.88, 0.27)));
  const mouth = new T.Mesh(
    new T.BoxGeometry(size[0] * 0.76, size[1] * 0.56, size[2] * 0.34),
    material(inner, 0.1, 0.82),
  );
  mouth.position.z = size[2] * 0.4;
  group.add(mouth);
  // The tongue inside a USB port, which is what makes it read as a USB port.
  const tongue = new T.Mesh(
    new T.BoxGeometry(size[0] * 0.6, size[1] * 0.16, size[2] * 0.3),
    material('#2a3f6b', 0.3, 0.6),
  );
  tongue.position.set(0, -size[1] * 0.1, size[2] * 0.4);
  group.add(tongue);
  return group;
}

/** A pan-head screw. Small, but it reads as assembly rather than one lump. */
export function buildScrew(material: MaterialFn, radius = 0.055) {
  const group = new T.Group();
  const head = new T.Mesh(
    new T.CylinderGeometry(radius, radius * 0.86, radius * 0.6, 16),
    material('#9fa7ab', 0.92, 0.24),
  );
  group.add(head);
  const slot = new T.Mesh(
    new T.BoxGeometry(radius * 1.25, radius * 0.14, radius * 0.26),
    material('#585f63', 0.82, 0.38),
  );
  slot.position.y = radius * 0.3;
  group.add(slot);
  return group;
}

/** A C14 mains inlet: the three-pin socket on the back of a power supply. */
export function buildMainsInlet(material: MaterialFn, scale: number) {
  const group = new T.Group();
  group.add(
    new T.Mesh(
      new T.BoxGeometry(scale * 1.2, scale * 0.9, scale * 0.3),
      material('#121416', 0.12, 0.68),
    ),
  );
  const recess = new T.Mesh(
    new T.BoxGeometry(scale * 0.92, scale * 0.62, scale * 0.2),
    material('#050607', 0.1, 0.9),
  );
  recess.position.z = scale * 0.12;
  group.add(recess);
  const pin = new T.BoxGeometry(scale * 0.09, scale * 0.24, scale * 0.16);
  const brass = material('#b09a5e', 0.92, 0.3);
  for (const [px, py] of [
    [-scale * 0.26, -scale * 0.12],
    [scale * 0.26, -scale * 0.12],
    [0, scale * 0.16],
  ] as const) {
    const post = new T.Mesh(pin, brass);
    post.position.set(px, py, scale * 0.14);
    group.add(post);
  }
  return group;
}

/** A modular connector panel: labelled sockets on the front of a supply. */
export function buildModularPanel(
  material: MaterialFn,
  width: number,
  height: number,
  depth: number,
) {
  const group = new T.Group();
  group.add(
    new T.Mesh(
      new T.BoxGeometry(width, height, depth),
      material('#2b3034', 0.6, 0.44),
    ),
  );
  const socketMaterial = material('#0d0f10', 0.08, 0.72);
  const layout: [number, number, number, number][] = [
    [-width * 0.3, height * 0.24, width * 0.3, height * 0.26],
    [width * 0.07, height * 0.24, width * 0.22, height * 0.26],
    [width * 0.32, height * 0.24, width * 0.22, height * 0.26],
    [-width * 0.33, -height * 0.22, width * 0.16, height * 0.2],
    [-width * 0.11, -height * 0.22, width * 0.16, height * 0.2],
    [width * 0.11, -height * 0.22, width * 0.16, height * 0.2],
    [width * 0.33, -height * 0.22, width * 0.16, height * 0.2],
  ];
  for (const [x, y, w, h] of layout) {
    const socket = new T.Mesh(new T.BoxGeometry(w, h, depth * 0.7), socketMaterial);
    socket.position.set(x, y, depth * 0.25);
    group.add(socket);
    const pins = new T.Mesh(
      new T.BoxGeometry(w * 0.8, h * 0.5, depth * 0.2),
      material('#b09a5e', 0.9, 0.3),
    );
    pins.position.set(x, y, depth * 0.1);
    group.add(pins);
  }
  return group;
}
