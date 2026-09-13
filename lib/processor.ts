import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';

/**
 * Two processor packages, drawn as floorplans.
 *
 * These are diagrams, not mask layouts: block sizes follow published die areas
 * and core counts, and their arrangement follows public package photography
 * and vendor block diagrams. Read them for how each processor is organised,
 * not for where any particular transistor sits.
 *
 * The two are deliberately drawn at the same scale and in the same style, so
 * the shapes can be compared directly. That comparison is the point of having
 * both: identical repeated dies wired across a substrate, against specialised
 * tiles stacked onto silicon.
 */

const put = (parent: T.Group, obj: T.Object3D, pos: Vec3) => {
  obj.position.set(...pos);
  parent.add(obj);
  return obj;
};

/** The package substrate every floorplan sits on, as backdrop scenery. */
function substrate(
  root: T.Group,
  box: ModelTools['box'],
  size: [number, number],
  tint: string,
) {
  const frame = new T.Group();
  frame.userData.contextFrame = true;
  put(frame, box([size[0], 0.09, size[1]], tint, 0.5), [0, -0.08, 0]);
  for (const side of [-1, 1])
    put(frame, box([size[0] * 0.98, 0.05, 0.03], '#5c6b76', 0.7), [
      0,
      0.01,
      side * (size[1] / 2 - 0.12),
    ]);
  root.add(frame);
}

/**
 * AMD Ryzen 9 9950X.
 *
 * Two identical eight core dies sit side by side with the I/O die below them,
 * which is how the package actually reads: repeated units plus one different
 * one, joined across the substrate.
 */
export function buildRyzen(
  { add, instances, box, label }: ModelTools,
  root: T.Group,
) {
  substrate(root, box, [10.4, 7.4], '#241b16');

  const CCD_X = 2.6,
    CCD_Z = -1.5;
  const CCD_W = 3.9,
    CCD_D = 3.0;

  // Two core complex dies, each an outline holding its cores and its cache.
  for (const side of [-1, 1]) {
    const ccd = new T.Group();
    put(ccd, box([CCD_W, 0.16, CCD_D], '#2b3f52', 0.55), [0, 0, 0]);
    label(ccd, side < 0 ? 'CCD 0' : 'CCD 1', [0, 0.11, -CCD_D / 2 + 0.3], 1.5, '#b9d3e6');
    add('zenccd', ccd, [side * CCD_X, 0.1, CCD_Z], [side * 1.2, 1.0, 0]);
  }

  // Eight Zen 5 cores per die, in two rows of four, with the shared L3 pool
  // running between them: the arrangement AMD's own die shots show.
  const cores: Vec3[] = [];
  for (const side of [-1, 1])
    for (let i = 0; i < 8; i++)
      cores.push([
        side * CCD_X + ((i % 4) - 1.5) * 0.86,
        0.26,
        CCD_Z + (Math.floor(i / 4) === 0 ? -0.92 : 0.92),
      ]);
  instances('zencore', cores, [0.74, 0.2, 0.68]);
  for (const side of [-1, 1]) {
    const tag = new T.Group();
    label(tag, '8 ZEN 5 CORES', [0, 0, 0], 1.5, '#d6e7f2');
    add('zencore', tag, [side * CCD_X, 0.42, CCD_Z - 1.42], [0, 0, 0], 1.1);
  }

  // 32 MB of L3 down the middle of each die, between the two rows of cores.
  for (const side of [-1, 1]) {
    const l3 = new T.Group();
    put(l3, box([CCD_W - 0.5, 0.22, 0.66], '#3f9fb5', 0.6), [0, 0, 0]);
    label(l3, '32 MB L3', [0, 0.12, 0], 1.4, '#a9dcea');
    add('zenl3', l3, [side * CCD_X, 0.2, CCD_Z], [0, 1.6, 0]);
  }

  // The I/O die: bigger, on an older process, carrying everything that does
  // not need the expensive one.
  const iod = new T.Group();
  put(iod, box([6.4, 0.16, 2.3], '#4a3a52', 0.55), [0, 0, 0]);
  label(iod, 'I/O DIE  ·  TSMC 6 NM', [0, 0.11, -0.78], 2.6, '#d7bde8');
  label(iod, 'DDR5  ·  PCIe  ·  DISPLAY', [0, 0.11, 0.62], 2.8, '#b79fc9');
  add('zeniod', iod, [0, 0.1, 2.1], [0, 1.0, 1.4]);

  // Fabric links from each core die down to the I/O die.
  const fabric = new T.Group();
  for (const side of [-1, 1]) {
    const path = new T.CatmullRomCurve3([
      new T.Vector3(side * CCD_X, 0.04, CCD_Z + CCD_D / 2),
      new T.Vector3(side * CCD_X * 0.7, 0.04, 0.6),
      new T.Vector3(side * 0.9, 0.04, 1.6),
    ]);
    const link = new T.Mesh(
      new T.TubeGeometry(path, 22, 0.075, 10, false),
      new T.MeshStandardMaterial({
        color: '#d7a25e',
        emissive: '#6b4a1e',
        metalness: 0.7,
        roughness: 0.35,
      }),
    );
    fabric.add(link);
  }
  label(fabric, 'INFINITY FABRIC', [0, 0.2, 1.0], 2.3, '#e0bd86');
  add('zenfabric', fabric, [0, 0.06, 0], [0, 0.7, 0]);
}

/**
 * Intel Core Ultra 9 285K.
 *
 * Four tiles on a base tile. The compute tile is drawn with its clusters of
 * four small cores sitting between the large ones, which is the layout change
 * this generation is known for.
 */
export function buildCoreUltra(
  { add, instances, box, label }: ModelTools,
  root: T.Group,
) {
  substrate(root, box, [10.4, 7.4], '#16202a');

  // The base tile underneath everything. Drawn as a slab the others sit on,
  // because that is exactly what it is.
  const base = new T.Group();
  put(base, box([8.9, 0.14, 5.5], '#1e3040', 0.5), [0, 0, 0]);
  label(base, 'FOVEROS BASE TILE', [0, 0.1, 2.35], 3.0, '#9fc2d8');
  add('arrowbase', base, [0, -0.02, 0], [0, -1.3, 0]);

  // Compute tile: the whole upper area.
  const compute = new T.Group();
  put(compute, box([6.9, 0.16, 3.0], '#2b4257', 0.55), [0, 0, 0]);
  label(compute, 'COMPUTE TILE  ·  TSMC N3B', [0, 0.11, -1.26], 3.0, '#bcd8ea');
  add('arrowcompute', compute, [-0.5, 0.16, -1.05], [0, 1.2, -0.4]);

  // Eight large cores in two rows, with a cluster of four small cores dropped
  // between them: two P, a cluster, two P, a cluster, and so on.
  const pcores: Vec3[] = [];
  const ecores: Vec3[] = [];
  for (let row = 0; row < 2; row++) {
    const z = -1.05 + (row === 0 ? -0.62 : 0.62);
    let x = -3.3;
    for (let group = 0; group < 2; group++) {
      for (let i = 0; i < 2; i++) {
        pcores.push([x + 0.42, 0.3, z]);
        x += 0.98;
      }
      // A cluster of four small cores in roughly the area of one large one.
      for (let i = 0; i < 4; i++) {
        ecores.push([x + 0.22 + (i % 2) * 0.44, 0.3, z + (i < 2 ? -0.2 : 0.2)]);
      }
      x += 1.12;
    }
  }
  instances('arrowpcore', pcores, [0.82, 0.22, 0.92], 0, '#9fc9e8');
  instances('arrowecore', ecores, [0.38, 0.2, 0.34], 0, '#6fbfa4');
  const ptag = new T.Group();
  label(ptag, '8 LION COVE P-CORES', [0, 0, 0], 2.6, '#d8ecf7');
  add('arrowpcore', ptag, [-0.5, 0.46, -2.0], [0, 0, 0], 1.1);
  const etag = new T.Group();
  label(etag, '16 SKYMONT E-CORES  ·  4 CLUSTERS', [0, 0, 0], 3.2, '#9fd6c2');
  add('arrowecore', etag, [-0.5, 0.46, -0.1], [0, 0, 0], 1.1);

  // One shared pool on the ring, drawn along the bottom of the compute tile.
  const cache = new T.Group();
  put(cache, box([6.3, 0.18, 0.5], '#2f6e6a', 0.6), [0, 0, 0]);
  label(cache, '36 MB SHARED', [0, 0.12, 0], 2.2, '#a6e4dc');
  add('arrowl3', cache, [-0.5, 0.2, 0.24], [0, 1.5, 0]);

  // The three smaller tiles along the bottom, at their published relative
  // sizes: the SoC tile is nearly four times the graphics tile.
  const soc = new T.Group();
  put(soc, box([3.6, 0.16, 1.6], '#4a3a52', 0.55), [0, 0, 0]);
  label(soc, 'SoC TILE  ·  N6', [0, 0.11, -0.5], 2.0, '#d7bde8');
  label(soc, 'DDR5  ·  FABRIC', [0, 0.11, 0.42], 2.0, '#b79fc9');
  add('arrowsoc', soc, [-1.6, 0.16, 1.55], [0, 1.0, 1.3]);

  const gpu = new T.Group();
  put(gpu, box([1.3, 0.16, 1.2], '#3f5a34', 0.55), [0, 0, 0]);
  label(gpu, 'GRAPHICS', [0, 0.11, 0], 1.2, '#c2e3ab');
  add('arrowgpu', gpu, [0.9, 0.16, 1.55], [0.6, 1.0, 1.3]);

  const io = new T.Group();
  put(io, box([1.5, 0.16, 1.2], '#54452c', 0.55), [0, 0, 0]);
  label(io, 'I/O EXT', [0, 0.11, 0], 1.2, '#e3d0a1');
  add('arrowio', io, [2.7, 0.16, 1.55], [1.1, 1.0, 1.3]);
}
