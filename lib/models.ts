import { resourceTexture, siliconColor } from './silicon-texture.ts';
import { buildHardware, type ModelTools } from './hardware.ts';
import { buildGpuArchitecture } from './gpu-architecture.ts';
import { buildMachine } from './machine.ts';
import { buildMotherboard } from './mainboard.ts';
import { buildPowerSupply } from './power-supply.ts';
import { buildFanUnit } from './fan-unit.ts';
import { buildCooler } from './cooler.ts';
import { buildDisk } from './disk.ts';
import { buildProcessor } from './processor.ts';
import { packageTexture, surfaceTexture } from './surfaces.ts';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { byId, colors } from './manifest.ts';
import type { LevelId } from './levels.ts';
import type { Vec3 } from './layout.ts';
export interface Piece {
  key: string;
  concept: string;
  instance: number;
  object: T.Object3D;
  base: T.Vector3;
  delta: T.Vector3;
  extent: T.Vector3;
  center: T.Vector3;
  size: number;
  reveal: number;
  batch?: T.InstancedMesh;
  index?: number;
  inventory: T.Vector3;
  inventoryScale?: number;
  visible: boolean;
}

/**
 * One builder per scale. Adding a branch to the machine means adding a line
 * here and an entry in `levels`; nothing else dispatches on the scale id.
 */
const builders: Record<LevelId, (tools: ModelTools, root: T.Group) => void> = {
  pc: buildMachine,
  motherboard: buildMotherboard,
  cpu: buildProcessor,
  psu: buildPowerSupply,
  fan: buildFanUnit,
  cooler: buildCooler,
  disk: buildDisk,
  card: (tools) => buildHardware(tools),
  die: (tools, root) => buildGpuArchitecture('die', tools, root),
  gpc: (tools, root) => buildGpuArchitecture('gpc', tools, root),
  tpc: (tools, root) => buildGpuArchitecture('tpc', tools, root),
  sm: (tools, root) => buildGpuArchitecture('sm', tools, root),
};

export function buildModel(level: LevelId) {
  const root = new T.Group(),
    pieces: Piece[] = [];
  const geometry = new Map<string, T.BufferGeometry>(),
    materials = new Map<string, T.MeshStandardMaterial>();
  const surfaces = new Map<string, T.Texture>();
  const material = (color: string, metal = 0.5, rough = 0.4) => {
    const key = [color, metal, rough].join();
    if (!materials.has(key)) {
      const kind = metal > 0.7 ? 'brushed' : 'molded';
      if (!surfaces.has(kind)) surfaces.set(kind, surfaceTexture(kind));
      materials.set(
        key,
        new T.MeshStandardMaterial({
          color,
          metalness: metal,
          // Polish the metals: a tighter highlight is what reads as machined
          // aluminium rather than as a grey box, and it costs no brightness.
          roughness: metal > 0.7 ? rough * 0.72 : rough,
          bumpMap: surfaces.get(kind),
          bumpScale: metal > 0.7 ? 0.0015 : 0.001,
          envMapIntensity: metal > 0.7 ? 1.85 : 1.1,
        }),
      );
    }
    return materials.get(key)!;
  };
  function box(size: Vec3, color: string, metal = 0.5, r = 0.008) {
    r = Math.min(r, Math.min(...size) * 0.2);
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
      center: bounds.getCenter(new T.Vector3()),
      size: Math.max(v.x, v.y, v.z, 0.1),
      reveal,
      inventory: new T.Vector3(),
      visible: true,
    };
    object.traverse((child) => {
      if (
        child instanceof T.Mesh &&
        !(child.material instanceof T.MeshBasicMaterial)
      ) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
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
    const physical = byId[concept].representationType === 'physical';
    const metallic = ['heatsink', 'fastener', 'bga', 'standoff'].includes(
      concept,
    );
    const baseMaterial = customGeometry
      ? new T.MeshStandardMaterial({
          vertexColors: true,
          metalness: metallic ? 0.82 : 0.22,
          roughness: metallic ? 0.32 : 0.57,
        })
      : material(
          color,
          physical ? (metallic ? 0.88 : 0.04) : 0.48,
          physical ? (metallic ? 0.31 : 0.65) : 0.48,
        );
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
        map: physical ? packageTexture(concept) : resourceTexture(concept),
        metalness: physical ? 0.03 : 0.42,
        roughness: physical ? 0.7 : 0.48,
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
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    const refs: Piece[] = [];
    const offset = pieces.filter((p) => p.concept === concept).length;
    for (let i = 0; i < positions.length; i++) {
      const object = new T.Object3D();
      object.position.set(...positions[i]);
      const p: Piece = {
        key: concept + '-' + (offset + i),
        concept,
        instance: offset + i,
        object,
        base: object.position.clone(),
        delta: new T.Vector3((i % 2 ? 1 : -1) * 0.5, 1 + (i % 3) * 0.4, 0),
        extent: new T.Vector3(...size),
        center: new T.Vector3(),
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
  builders[level]({ add, instances, box, material, label }, root);
  // Consolidate authored submeshes within each selectable assembly. Lead pins,
  // frame rails and socket contacts retain the assembly's picking identity.
  const retired = new Set<T.BufferGeometry>();
  root.updateMatrixWorld(true);
  for (const child of root.children) {
    if (!(child instanceof T.Group)) continue;
    const groups = new Map<T.Material, T.Mesh[]>();
    child.traverse((o) => {
      if (
        o instanceof T.Mesh &&
        !(o instanceof T.InstancedMesh) &&
        o.material instanceof T.MeshStandardMaterial
      ) {
        const group = groups.get(o.material) ?? [];
        group.push(o);
        groups.set(o.material, group);
      }
    });
    const inverse = child.matrixWorld.clone().invert();
    for (const [mat, meshes] of groups) {
      if (meshes.length < 2) continue;
      const parts = meshes.map((mesh) => {
        const g = mesh.geometry.index
          ? mesh.geometry.toNonIndexed()
          : mesh.geometry.clone();
        g.applyMatrix4(
          new T.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld),
        );
        return g;
      });
      const merged = mergeGeometries(parts);
      parts.forEach((g) => g.dispose());
      if (!merged) continue;
      for (const mesh of meshes) {
        retired.add(mesh.geometry);
        mesh.removeFromParent();
      }
      const mesh = new T.Mesh(merged, mat);
      mesh.castShadow = mesh.receiveShadow = true;
      child.add(mesh);
    }
  }
  root.traverse((o) => {
    if (o instanceof T.Mesh) retired.delete(o.geometry);
  });
  retired.forEach((g) => g.dispose());
  return { root, pieces };
}
