import { resourceTexture, siliconColor } from './silicon-texture.ts';
import { buildAirflow } from './airflow.ts';
import { buildHardware, type ModelTools } from './hardware.ts';
import { buildGpuArchitecture } from './gpu-architecture.ts';
import { buildRadeonCard } from './radeon-card.ts';
import { buildRadeonArchitecture } from './radeon-architecture.ts';
import { buildArcCard } from './arc-card.ts';
import { buildArcArchitecture } from './arc-architecture.ts';
import { buildMachine } from './machine.ts';
import { buildMotherboard } from './mainboard.ts';
import { buildDimm } from './dimm.ts';
import { buildDram } from './dram.ts';
import { buildRamArchitecture } from './ram-architecture.ts';
import { buildPowerSupply } from './power-supply.ts';
import { buildFanUnit } from './fan-unit.ts';
import { buildCooler } from './cooler.ts';
import { buildLiquid } from './liquid.ts';
import { buildSsd } from './ssd.ts';
import { buildNvme } from './nvme.ts';
import { buildCoreUltra, buildRyzen } from './processor.ts';
import { buildCoreIo, buildRyzenIo } from './io-die.ts';
import { packageTexture, surfaceTexture } from './surfaces.ts';
import { pcbRoughness, pcbTexture, type BoardVariant } from './pcb.ts';
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
  /** Rotation to settle into once the parts are laid out. See `layFlat`. */
  lie?: T.Quaternion;
  /** The rotation this piece was built with, to turn away from. */
  restQuat?: T.Quaternion;
  /** `extent` and `center` as they are once `lie` has been applied. */
  lieExtent?: T.Vector3;
  lieCenter?: T.Vector3;
}

const UP = new T.Vector3(0, 1, 0);

/**
 * Turn a flat part face up for the inventory, the way it would end up on a
 * bench.
 *
 * A motherboard is mounted on its edge inside a tower, and nothing told the
 * inventory otherwise, so the fully separated machine presented the board as a
 * vertical sliver seen from above: the side with every component on it faced
 * sideways, away from the camera. The shelf packer had the same problem from
 * the other direction, reading the board's footprint as its 55 mm edge rather
 * than its 305 mm face.
 *
 * So the thinnest axis becomes up. Parts that are already flat keep the
 * rotation they have, and anything roughly as thick as it is wide is left
 * alone, since there is no meaningful face to present. Batched instances never
 * get here: they are drawn from one axis-aligned matrix each and carry no
 * rotation of their own.
 */
function layFlat(extent: T.Vector3) {
  const axes = [
    [extent.x, new T.Vector3(1, 0, 0)],
    [extent.y, UP.clone()],
    [extent.z, new T.Vector3(0, 0, 1)],
  ] as [number, T.Vector3][];
  axes.sort((a, b) => a[0] - b[0]);
  const [thin, axis] = axes[0],
    mid = axes[1][0];
  // Already lying flat, or too chunky to have a face worth showing.
  if (axis.y === 1 || thin >= mid * 0.8) return null;
  return new T.Quaternion().setFromUnitVectors(axis, UP);
}

/** A box's extent under a rotation: rotate, then drop the signs. */
function turnExtent(extent: T.Vector3, q: T.Quaternion) {
  const v = extent.clone().applyQuaternion(q);
  return v.set(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
}

/**
 * One builder per scale. Adding a branch to the machine means adding a line
 * here and an entry in `levels`; nothing else dispatches on the scale id.
 */
const builders: Record<LevelId, (tools: ModelTools, root: T.Group) => void> = {
  pc: buildMachine,
  motherboard: buildMotherboard,
  dimm: buildDimm,
  dram: buildDram,
  banks: (tools, root) => buildRamArchitecture('banks', tools, root),
  bank: (tools, root) => buildRamArchitecture('bank', tools, root),
  ryzen: buildRyzen,
  ryzenio: buildRyzenIo,
  corei9: buildCoreUltra,
  coreio: buildCoreIo,
  psu: buildPowerSupply,
  psubronze: (tools, root) => buildPowerSupply(tools, root, 'fixed'),
  fan: buildFanUnit,
  cooler: buildCooler,
  liquid: buildLiquid,
  ssd: buildSsd,
  nvme: buildNvme,
  card: (tools) => buildHardware(tools),
  die: (tools, root) => buildGpuArchitecture('die', tools, root),
  gpc: (tools, root) => buildGpuArchitecture('gpc', tools, root),
  tpc: (tools, root) => buildGpuArchitecture('tpc', tools, root),
  sm: (tools, root) => buildGpuArchitecture('sm', tools, root),
  rx9070: (tools) => buildRadeonCard(tools),
  navi48: (tools, root) => buildRadeonArchitecture('navi48', tools, root),
  rxse: (tools, root) => buildRadeonArchitecture('rxse', tools, root),
  rxwgp: (tools, root) => buildRadeonArchitecture('rxwgp', tools, root),
  rxcu: (tools, root) => buildRadeonArchitecture('rxcu', tools, root),
  arcb580: (tools) => buildArcCard(tools),
  bmg: (tools, root) => buildArcArchitecture('bmg', tools, root),
  xeslice: (tools, root) => buildArcArchitecture('xeslice', tools, root),
  xecore: (tools, root) => buildArcArchitecture('xecore', tools, root),
  xve: (tools, root) => buildArcArchitecture('xve', tools, root),
};

export function buildModel(level: LevelId): { root: T.Group; pieces: Piece[] } {
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
          bumpScale: metal > 0.7 ? 0.0026 : 0.0016,
          // One roughness value across a whole face is exactly what reads as
          // plastic: the highlight stays the same shape wherever you turn it.
          // Reusing the surface noise as a roughness map costs nothing and
          // breaks the highlight up the way a moulded or machined face does.
          roughnessMap: surfaces.get(kind),
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
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        child.castShadow = !mats.some((m) => m.transparent && m.opacity < 0.75);
        child.receiveShadow = true;
      }
    });
    object.position.copy(p.base);
    object.userData.piece = p;
    const lie = layFlat(v);
    if (lie) {
      p.lie = lie;
      p.restQuat = object.quaternion.clone();
      p.lieExtent = turnExtent(v, lie);
      p.lieCenter = p.center.clone().applyQuaternion(lie);
    }
    root.add(object);
    pieces.push(p);
    return p;
  }
  /**
   * A printed circuit board. The two large faces get the routed artwork and
   * the cut edges get bare laminate, which is how a board actually looks and
   * why a plain green box never does.
   */
  function pcb(size: Vec3, variant: BoardVariant = 'motherboard') {
    const face = new T.MeshStandardMaterial({
      map: pcbTexture(variant),
      roughnessMap: pcbRoughness(variant),
      roughness: 0.82,
      metalness: 0.12,
      envMapIntensity: 1.0,
    });
    const edge = material('#2c3a2c', 0.05, 0.86);
    // Whichever axis is thinnest is the board's thickness, so the faces are
    // the two sides perpendicular to it. BoxGeometry takes its materials in
    // +X, -X, +Y, -Y, +Z, -Z order.
    const thin = size.indexOf(Math.min(...size));
    const faces = [edge, edge, edge, edge, edge, edge];
    faces[thin * 2] = face;
    faces[thin * 2 + 1] = face;
    return new T.Mesh(new T.BoxGeometry(...size), faces);
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
        // RX 9070 XT
        'rxse',
        'rxwgp',
        'rxcu',
        'rxinfinity',
        'rxmemctl',
        'rxmatrix',
        'rxgddr6',
        'rxvrm',
        'rxpowerstage',
        // Arc B580
        'xeslice',
        'xecore',
        'xve',
        'arcalu',
        'arcthread',
        'arcsampler',
        'arcgddr6',
        'arcvrm',
        'arcpowerstage',
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
  /**
   * Airflow for this scale. It hangs off the model root rather than off any
   * one part, because the path it describes belongs to the whole build and
   * not to the fan at one end of it.
   */
  const airflow: ModelTools['airflow'] = (streams) => {
    const group = buildAirflow(streams);
    root.add(group);
    return group;
  };
  const assembly: ModelTools['assembly'] = (level) => {
    const model = buildModel(level);
    // Freeze all instances at their assembled positions before handing the
    // model to the parent scale. Only the parent owns picking and animation.
    for (const piece of model.pieces) {
      if (piece.batch) {
        piece.batch.setMatrixAt(
          piece.index!,
          new T.Matrix4().makeTranslation(...piece.base.toArray()),
        );
        piece.batch.setColorAt(piece.index!, new T.Color('#ffffff'));
        piece.batch.instanceMatrix.needsUpdate = true;
      }
    }
    model.root.traverse((object) => {
      delete object.userData.piece;
      delete object.userData.pieces;
    });
    return model.root;
  };
  builders[level](
    { add, instances, box, pcb, material, label, assembly, airflow },
    root,
  );
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
      mesh.castShadow = !(mat.transparent && mat.opacity < 0.75);
      mesh.receiveShadow = true;
      child.add(mesh);
    }
  }
  root.traverse((o) => {
    if (o instanceof T.Mesh) retired.delete(o.geometry);
  });
  retired.forEach((g) => g.dispose());
  return { root, pieces };
}

/**
 * Tell three.js that a batch's instances have moved.
 *
 * Most parts here are drawn as instances of a shared `InstancedMesh`, 408 of
 * the graphics card's 459, and the scene rewrites their matrices on every
 * frame of an explode. Flagging `instanceMatrix` keeps the picture right, but
 * `InstancedMesh.raycast()` first tests the ray against `boundingSphere`,
 * which three.js computes ONCE, lazily, on the first raycast and then keeps.
 *
 * Left cached, that sphere freezes the pickable region at whatever the layout
 * happened to be the first time anyone hovered. Every instance that later
 * moves outside it stops answering the cursor, silently, and with no visual
 * sign, so an instanced part sits next to an identical non-instanced one and
 * only the neighbour can be named. Measured on the card: after the inventory
 * moved things, 0 of 30 sampled instances were reachable; clearing the sphere
 * made it 29 of 30.
 *
 * Nulling both bounds hands the recompute back to three.js, which does it on
 * the next raycast and not once per ray. Nothing else reads them: `fit()`
 * derives its bounds from the pieces and `boxFor()` builds a batched piece's
 * box from its own extent.
 */
export function refreshBatches(batches: Iterable<T.InstancedMesh>) {
  for (const b of batches) {
    b.instanceMatrix.needsUpdate = true;
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
    b.boundingSphere = null;
    b.boundingBox = null;
  }
}
