import { resourceTexture, siliconColor } from './silicon-texture';
import { buildHardware } from './hardware';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { byId, colors, type Level } from './manifest';
import type { Vec3 } from './layout';
export interface Piece {
  key: string;
  concept: string;
  instance: number;
  object: T.Object3D;
  base: T.Vector3;
  delta: T.Vector3;
  extent: T.Vector3;
  size: number;
  reveal: number;
  batch?: T.InstancedMesh;
  index?: number;
  inventory: T.Vector3;
  visible: boolean;
}
export function buildModel(level: Level) {
  const root = new T.Group(),
    pieces: Piece[] = [];
  const geometry = new Map<string, T.BufferGeometry>(),
    materials = new Map<string, T.MeshStandardMaterial>();
  const material = (color: string, metal = 0.5, rough = 0.4) => {
    const key = [color, metal, rough].join();
    if (!materials.has(key))
      materials.set(
        key,
        new T.MeshStandardMaterial({
          color,
          metalness: metal,
          roughness: rough,
        }),
      );
    return materials.get(key)!;
  };
  function box(size: Vec3, color: string, metal = 0.5, r = 0.035) {
    const key = size.join() + r;
    let g = geometry.get(key);
    if (!g) {
      g = new RoundedBoxGeometry(...size, 2, r);
      geometry.set(key, g);
    }
    return new T.Mesh(g, material(color, metal));
  }
  const put = (parent: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    parent.add(obj);
    return obj;
  };
  function add(
    concept: string,
    object: T.Object3D,
    pos: Vec3,
    delta: Vec3 = [0, 1, 0],
    reveal = 0,
  ) {
    const instance = pieces.filter((p) => p.concept === concept).length,
      key = concept + '-' + instance;
    const bounds = new T.Box3().setFromObject(object);
    const v = bounds.getSize(new T.Vector3());
    const p: Piece = {
      key,
      concept,
      instance,
      object,
      base: new T.Vector3(...pos),
      delta: new T.Vector3(...delta),
      extent: v.clone(),
      size: Math.max(v.x, v.y, v.z, 0.1),
      reveal,
      inventory: new T.Vector3(),
      visible: true,
    };
    object.position.copy(p.base);
    object.userData.piece = p;
    root.add(object);
    pieces.push(p);
    return p;
  }
  function instances(
    concept: string,
    positions: Vec3[],
    size: Vec3,
    reveal = 0,
    color = siliconColor[concept] ?? colors[byId[concept].category],
    customGeometry?: T.BufferGeometry,
  ) {
    const baseMaterial = customGeometry
      ? new T.MeshStandardMaterial({
          vertexColors: true,
          metalness: 0.65,
          roughness: 0.35,
        })
      : material(color, 0.62, 0.36);
    let blockMaterials: T.Material | T.Material[] = baseMaterial;
    if (
      [
        'gpc',
        'tpc',
        'sm',
        'cuda',
        'tensor',
        'scheduler',
        'register',
        'texture',
        'loadstore',
        'sfu',
        'controller',
        'gddr7',
        'vrm',
        'powerstage',
      ].includes(concept)
    ) {
      const top = new T.MeshStandardMaterial({
        map: resourceTexture(concept),
        metalness: 0.42,
        roughness: 0.48,
      });
      blockMaterials = [
        baseMaterial,
        baseMaterial,
        top,
        baseMaterial,
        baseMaterial,
        baseMaterial,
      ];
    }
    const mesh = new T.InstancedMesh(
      customGeometry ??
        new RoundedBoxGeometry(...size, 2, Math.min(...size) * 0.1),
      blockMaterials,
      positions.length,
    );
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.frustumCulled = false;
    root.add(mesh);
    const refs: Piece[] = [];
    for (let i = 0; i < positions.length; i++) {
      const object = new T.Object3D();
      object.position.set(...positions[i]);
      const p: Piece = {
        key: concept + '-' + i,
        concept,
        instance: i,
        object,
        base: object.position.clone(),
        delta: new T.Vector3((i % 2 ? 1 : -1) * 0.5, 1 + (i % 3) * 0.4, 0),
        extent: new T.Vector3(...size),
        size: Math.max(...size),
        reveal,
        batch: mesh,
        index: i,
        inventory: new T.Vector3(),
        visible: true,
      };
      pieces.push(p);
      refs.push(p);
      mesh.setColorAt(i, new T.Color(color));
    }
    mesh.userData.pieces = refs;
    return refs;
  }
  function label(
    parent: T.Group,
    text: string,
    pos: Vec3,
    width: number,
    color = '#c7d0cb',
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.font = '500 42px monospace';
    ctx.fillText(text, 256, 63, 480);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const m = new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const plane = new T.Mesh(new T.PlaneGeometry(width, (width * 96) / 512), m);
    plane.rotation.x = -Math.PI / 2;
    put(parent, plane, pos);
  }
  if (level === 'card') {
    buildHardware({ add, instances, box, material, label });
  } else if (level === 'die') {
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
  return { root, pieces };
}
