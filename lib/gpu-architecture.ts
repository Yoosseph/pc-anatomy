import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { byId } from './manifest.ts';

/**
 * The logical scales inside the graphics processor: die, GPC, TPC and SM.
 *
 * Moved out of the model builder unchanged when the project grew past a single
 * card. This is a block diagram of documented architecture, not a die
 * floorplan. Sizes and positions are illustrative throughout.
 */
export function buildGpuArchitecture(
  level: 'die' | 'gpc' | 'tpc' | 'sm',
  { add, instances, box, material, label }: ModelTools,
  root: T.Group,
) {
  const put = (parent: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    parent.add(obj);
    return obj;
  };
  if (level === 'die') {
    const services: [string, number, number, string][] = [
      ['nvenc', 3, -4.1, '#76654a'],
      ['nvdec', 2, -3.45, '#58787e'],
      ['displayengine', 1, 3.45, '#675572'],
      ['host', 1, 4.1, '#547074'],
      ['command', 1, -4.78, '#7b6e55'],
    ];
    for (const [id, count, z, color] of services) {
      for (let i = 0; i < count; i++) {
        const group = new T.Group();
        const width = 8.5 / count - 0.12;
        put(group, box([width, 0.16, 0.46], color, 0.4), [0, 0, 0]);
        label(
          group,
          byId[id].name.toUpperCase() + (count > 1 ? ' ' + (i + 1) : ''),
          [0, 0.09, 0],
          width * 0.82,
          '#d0d9dc',
        );
        add(
          id,
          group,
          [(i - (count - 1) / 2) * (width + 0.12), 0.12, z],
          [0, 0.6, Math.sign(z) * 0.65],
        );
      }
    }
    instances(
      'gpc',
      Array.from(
        { length: 11 },
        (_, i) =>
          [
            ((i % 6) - 2.5) * 1.45,
            0.2,
            (Math.floor(i / 6) - 0.5) * 2.3,
          ] as Vec3,
      ),
      [1.21, 0.3, 1.72],
    );
    const l2 = new T.Group();
    put(l2, box([8.5, 0.2, 0.45], '#294757', 0.65), [0, 0, 0]);
    label(l2, 'L2 CACHE · 96 MB', [0, 0.12, 0], 3.2, '#a5cce0');
    add('l2', l2, [0, 0.15, 0], [0, 1.5, 0]);
    instances(
      'controller',
      Array.from(
        { length: 16 },
        (_, i) => [((i % 8) - 3.5) * 1.08, 0.18, i < 8 ? -2.7 : 2.7] as Vec3,
      ),
      [0.85, 0.2, 0.43],
    );
  } else if (level === 'gpc') {
    instances(
      'tpc',
      Array.from(
        { length: 8 },
        (_, i) =>
          [((i % 4) - 1.5) * 1.9, 0.2, (Math.floor(i / 4) - 0.5) * 2.1] as Vec3,
      ),
      [1.65, 0.28, 1.5],
    );
    const raster = new T.Group();
    put(raster, box([7.4, 0.2, 0.55], '#594865', 0.65), [0, 0, 0]);
    label(raster, 'RASTER ENGINE', [0, 0.12, 0], 3);
    add('raster', raster, [0, 0.2, -2.35]);
    instances(
      'rop',
      [
        [-2, 0.2, 2.35],
        [2, 0.2, 2.35],
      ],
      [3.5, 0.22, 0.55],
      0,
      '#645678',
    );
  } else if (level === 'tpc') {
    instances(
      'sm',
      [
        [-2, 0.2, 0],
        [2, 0.2, 0],
      ],
      [3.4, 0.32, 3.5],
    );
    const poly = new T.Group();
    put(poly, box([7.3, 0.2, 0.6], '#594865', 0.65), [0, 0, 0]);
    label(poly, 'POLYMORPH ENGINE', [0, 0.12, 0], 3.9);
    add('polymorph', poly, [0, 0.18, -2.25]);
  } else {
    const cuda: Vec3[] = [],
      tensor: Vec3[] = [],
      sched: Vec3[] = [],
      regs: Vec3[] = [],
      tex: Vec3[] = [],
      ls: Vec3[] = [],
      sfu: Vec3[] = [];
    for (let q = 0; q < 4; q++) {
      const x = (q - 1.5) * 2.1;
      for (let i = 0; i < 32; i++)
        cuda.push([
          x + ((i % 4) - 1.5) * 0.43,
          0.2,
          -1.1 + Math.floor(i / 4) * 0.34,
        ]);
      tensor.push([x, 0.2, 2.05]);
      sched.push([x, 0.2, -2.65]);
      regs.push([x, 0.2, -2.05]);
      tex.push([x, 0.2, 2.75]);
      ls.push([x - 0.48, 0.2, 1.57]);
      sfu.push([x + 0.48, 0.2, 1.57]);
    }
    const partitions = new T.Group();
    partitions.userData.contextFrame = true;
    for (let q = 0; q < 4; q++) {
      const x = (q - 1.5) * 2.1;
      put(partitions, box([2, 0.09, 6.25], '#192733', 0.6), [x, -0.07, 0]);
      for (const side of [-1, 1])
        put(partitions, box([0.023, 0.045, 6.15], '#557287', 0.7), [
          x + side * 0.97,
          0.01,
          0,
        ]);
      label(partitions, 'PARTITION 0' + q, [x, 0.01, -3], 1.6, '#6d98b5');
    }
    root.add(partitions);
    instances('cuda', cuda, [0.35, 0.16, 0.24]);
    instances('tensor', tensor, [1.8, 0.26, 0.53], 0, '#9b743d');
    instances('scheduler', sched, [1.8, 0.2, 0.4], 0, '#966944');
    instances('register', regs, [1.8, 0.18, 0.43]);
    instances('texture', tex, [1.8, 0.19, 0.42]);
    instances('loadstore', ls, [0.8, 0.17, 0.25]);
    instances('sfu', sfu, [0.8, 0.17, 0.25]);
    const l1 = new T.Group();
    put(l1, box([8.1, 0.18, 0.55], '#264757', 0.65), [0, 0, 0]);
    label(l1, 'L1 / SHARED MEMORY · 128 KB', [0, 0.11, 0], 4.8, '#b0d1e1');
    add('l1', l1, [0, 0.15, 3.55]);
    const rt = new T.Group();
    put(rt, box([1.65, 0.26, 3.15], '#4e3e65', 0.65, 0.1), [0, 0, 0]);
    put(rt, box([1.45, 0.045, 2.92], '#252435', 0.55), [0, 0.15, 0]);
    label(rt, 'RT CORE', [0, 0.184, -1], 1.3, '#d0bfed');
    label(rt, '4TH GEN', [0, 0.184, 1.03], 1.13, '#9c8faf');
    for (let j = 0; j < 3; j++) {
      const triangle = new T.Mesh(
        new T.CylinderGeometry(0.33, 0.33, 0.055, 3),
        material('#9a82b3', 0.65, 0.35),
      );
      put(rt, triangle, [j === 1 ? 0.25 : -0.25, 0.2, -0.42 + j * 0.45]);
      triangle.rotation.y = j * 0.5;
    }
    add('rt', rt, [5.2, 0.12, 0], [0.8, 1.2, 0]);
  }
}
