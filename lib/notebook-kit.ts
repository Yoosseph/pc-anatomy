import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { buildScrew } from './parts.ts';

/** A common physical coordinate system, never fitted independently per axis. */
export const notebookMM = (value: number) => value / 20;
export const notebookV = (x: number, y: number, z: number): Vec3 => [
  x / 20,
  y / 20,
  z / 20,
];
export const notebookSpecs = {
  legion: {
    width: 362.56,
    depth: 260.61,
    base: 20,
    lid: 5.5,
    screenWidth: 344.2,
    screenHeight: 193.6,
    lidDepth: 235,
    boardZ: -46,
    coolerZ: -65,
    batteryZ: 78,
    fanX: 128,
    shell: '#313943',
    edge: '#535d6a',
  },
  macbook: {
    width: 312.6,
    depth: 221.2,
    base: 11.3,
    lid: 4.2,
    screenWidth: 302.0,
    screenHeight: 196.4,
    lidDepth: 210,
    boardZ: -40,
    coolerZ: -65,
    batteryZ: 67,
    fanX: 105,
    shell: '#8b929a',
    edge: '#b6bec6',
  },
} as const;
export type NotebookSystem = keyof typeof notebookSpecs;

export type Opening = {
  x: number;
  z: number;
  w: number;
  d: number;
  r?: number;
};

function roundedPath(
  path: T.Shape | T.Path,
  x: number,
  z: number,
  w: number,
  d: number,
  radius: number,
) {
  const r = Math.min(radius, w / 2, d / 2),
    l = x - w / 2,
    h = x + w / 2,
    b = z - d / 2,
    t = z + d / 2;
  path.moveTo(l + r, b);
  path.lineTo(h - r, b);
  path.quadraticCurveTo(h, b, h, b + r);
  path.lineTo(h, t - r);
  path.quadraticCurveTo(h, t, h - r, t);
  path.lineTo(l + r, t);
  path.quadraticCurveTo(l, t, l, t - r);
  path.lineTo(l, b + r);
  path.quadraticCurveTo(l, b, l + r, b);
}

export function notebookKit(tools: ModelTools) {
  const { box, material, label } = tools;
  const mm = notebookMM,
    v = notebookV;
  const put = <O extends T.Object3D>(
    parent: T.Group,
    object: O,
    at: Vec3,
    rotate?: Vec3,
  ): O => {
    object.position.set(...v(...at));
    if (rotate) object.rotation.set(...rotate);
    parent.add(object);
    return object;
  };
  const slab = (size: Vec3, color = '#343c45', metal = 0.35, radius = 0.5) =>
    box(v(...size), color, metal, mm(radius));
  const plateGeometry = (
    w: number,
    d: number,
    thickness: number,
    radius: number,
    holes: Opening[] = [],
  ) => {
    const shape = new T.Shape();
    roundedPath(shape, 0, 0, mm(w), mm(d), mm(radius));
    for (const opening of holes) {
      const path = new T.Path();
      roundedPath(
        path,
        mm(opening.x),
        -mm(opening.z),
        mm(opening.w),
        mm(opening.d),
        mm(opening.r ?? 0.4),
      );
      shape.holes.push(path);
    }
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: mm(thickness),
      bevelEnabled: false,
      curveSegments: 6,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -mm(thickness / 2), 0);
    return geometry;
  };
  const plate = (
    w: number,
    d: number,
    thickness: number,
    radius: number,
    color: string,
    holes: Opening[] = [],
  ) =>
    new T.Mesh(
      plateGeometry(w, d, thickness, radius, holes),
      material(color, 0.7, 0.34),
    );
  const board = (points: [number, number][], holes: Opening[] = []) => {
    const shape = new T.Shape(
      points.map(([x, z]) => new T.Vector2(mm(x), -mm(z))),
    );
    for (const opening of holes) {
      const path = new T.Path();
      roundedPath(
        path,
        mm(opening.x),
        -mm(opening.z),
        mm(opening.w),
        mm(opening.d),
        mm(opening.r ?? 0.5),
      );
      shape.holes.push(path);
    }
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: mm(1.2),
      bevelEnabled: false,
      curveSegments: 8,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -mm(0.6), 0);
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!,
      positions = geometry.getAttribute('position'),
      uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++)
      uv.setXY(
        i,
        (positions.getX(i) - bounds.min.x) / (bounds.max.x - bounds.min.x),
        (positions.getZ(i) - bounds.min.z) / (bounds.max.z - bounds.min.z),
      );
    uv.needsUpdate = true;
    const mesh = tools.pcb(v(10, 1.2, 10));
    mesh.geometry.dispose();
    mesh.geometry = geometry;
    // ExtrudeGeometry: cap material 0, edge material 1.
    const mats = mesh.material as T.Material[];
    mesh.material = [mats[2], mats[0]];
    return mesh;
  };
  const screw = (radius = 1.6) => buildScrew(material, mm(radius));
  const cylinder = (
    radius: number,
    height: number,
    color: string,
    segments = 24,
  ) =>
    new T.Mesh(
      new T.CylinderGeometry(mm(radius), mm(radius), mm(height), segments),
      material(color, 0.75, 0.3),
    );
  const tube = (points: Vec3[], radius: number, color: string, flat = 1) => {
    const curve = new T.CatmullRomCurve3(
      points.map((at) => new T.Vector3(...v(...at))),
    );
    const mesh = new T.Mesh(
      new T.TubeGeometry(curve, 32, mm(radius), 8, false),
      material(color, 0.78, 0.36),
    );
    if (flat !== 1) mesh.scale.y = flat;
    return mesh;
  };
  const chip = (name: string, size: Vec3, color = '#171c23') => {
    const group = new T.Group();
    group.add(slab(size, color, 0.15, 0.18));
    if (name)
      label(
        group,
        name,
        v(0, size[1] / 2 + 0.05, 0),
        mm(size[0] * 0.76),
        '#aebbc4',
      );
    return group;
  };
  const ribbon = (width: number, length: number, color = '#b38a4e') => {
    const group = new T.Group();
    group.add(slab([width, 0.18, length], color, 0.2));
    const count = Math.max(3, Math.floor(width / 0.7));
    for (let i = 0; i < count; i++)
      put(group, slab([0.16, 0.05, length - 2], '#d5b676', 0.55), [
        ((i - (count - 1) / 2) * width) / count,
        0.13,
        0,
      ]);
    for (const end of [-1, 1])
      put(group, slab([width, 0.35, 3], '#242f40', 0.1), [
        0,
        0.2,
        end * (length / 2 - 1.5),
      ]);
    return group;
  };
  return {
    mm,
    v,
    put,
    slab,
    plate,
    board,
    cylinder,
    screw,
    tube,
    chip,
    ribbon,
  };
}

export type NotebookKit = ReturnType<typeof notebookKit>;
