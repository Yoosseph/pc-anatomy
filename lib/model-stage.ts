import * as T from 'three';
import { byId } from './manifest.ts';
import { isPhysical, levels, type LevelId } from './levels.ts';
import { inventoryLayout, smoothstep, spatialInventory } from './layout.ts';
import type { Piece } from './models.ts';

export type BuiltModel = { root: T.Group; pieces: Piece[] };

export class ModelStageScratch {
  position = new T.Vector3();
  inventoryTarget = new T.Vector3();
  matrix = new T.Matrix4();
  quaternion = new T.Quaternion();
  scale = new T.Vector3();
  extent = new T.Vector3();
  centre = new T.Vector3();
  point = new T.Vector3();
  half = new T.Vector3();
}

export const laidOutAmount = (value: number) => smoothstep(0.7, 1, value);

export function piecePosture(
  piece: Piece,
  grid: number,
  extent: T.Vector3,
  centre: T.Vector3,
) {
  if (!piece.lie || !piece.lieExtent || !piece.lieCenter)
    return { extent: piece.extent, centre: piece.center };
  return {
    extent: extent.copy(piece.extent).lerp(piece.lieExtent, grid),
    centre: centre.copy(piece.center).lerp(piece.lieCenter, grid),
  };
}

export function pieceDestination(
  piece: Piece,
  level: LevelId,
  value: number,
  position: T.Vector3,
  inventoryTarget: T.Vector3,
) {
  const stage =
    byId[piece.concept].category === 'Cooling'
      ? smoothstep(0, 0.48, value)
      : smoothstep(0.22, 0.68, value);
  position
    .copy(piece.base)
    .addScaledVector(
      piece.delta,
      (isPhysical(level) ? stage : smoothstep(0, 0.75, value)) *
        (levels[level].spread ?? 1),
    );
  const grid = laidOutAmount(value);
  inventoryTarget
    .copy(piece.inventory)
    .addScaledVector(
      piece.lieCenter ?? piece.center,
      -(piece.inventoryScale ?? 1),
    );
  position.lerp(inventoryTarget, grid);
  return {
    position,
    scale: T.MathUtils.lerp(1, piece.inventoryScale ?? 1, grid),
  };
}

/** Apply the shared explode, reveal, inventory, and lay-flat pose to one piece. */
export function applyPiecePose(
  piece: Piece,
  level: LevelId,
  value: number,
  scratch: ModelStageScratch,
  scaleMultiplier = 1,
) {
  const destination = pieceDestination(
    piece,
    level,
    value,
    scratch.position,
    scratch.inventoryTarget,
  );
  const reveal = piece.reveal
    ? smoothstep(piece.reveal, piece.reveal + 0.07, value)
    : 1;
  const pieceScale = piece.visible
    ? destination.scale * reveal * scaleMultiplier
    : 0;
  piece.object.position.copy(destination.position);
  piece.object.scale.setScalar(pieceScale);
  if (piece.lie && piece.restQuat)
    piece.object.quaternion
      .copy(piece.restQuat)
      .slerp(piece.lie, laidOutAmount(value));
  if (piece.batch) {
    scratch.matrix.compose(
      piece.object.position,
      scratch.quaternion.identity(),
      scratch.scale.setScalar(pieceScale),
    );
    piece.batch.setMatrixAt(piece.index!, scratch.matrix);
  } else piece.object.visible = piece.visible;
  return pieceScale;
}

/** Pack the visible model pieces once for the current pane aspect. */
export function prepareModelInventory(
  model: BuiltModel,
  level: LevelId,
  aspect: number,
  pieces = model.pieces.filter((piece) => piece.visible),
) {
  const positions = inventoryLayout(pieces.length, Math.max(0.6, aspect));
  const hardware = isPhysical(level)
    ? spatialInventory(
        pieces.map((piece) => ({
          extent: (piece.lieExtent ?? piece.extent).toArray() as [
            number,
            number,
            number,
          ],
          size: piece.size,
        })),
        aspect,
      )
    : null;
  pieces.forEach((piece, index) => {
    piece.inventory.set(...(hardware?.[index].position ?? positions[index]));
    piece.inventoryScale = hardware?.[index].scale ?? 1.12 / piece.size;
  });
}

/** Bounds for the model at one shared disassembly position. */
export function posedModelBounds(
  model: BuiltModel,
  level: LevelId,
  value: number,
  target = new T.Box3(),
  scratch = new ModelStageScratch(),
  pieces: readonly Piece[] = model.pieces,
) {
  const grid = laidOutAmount(value);
  target.makeEmpty();
  for (const piece of pieces) {
    if (!piece.visible) continue;
    const destination = pieceDestination(
      piece,
      level,
      value,
      scratch.position,
      scratch.inventoryTarget,
    );
    const posture = piecePosture(piece, grid, scratch.extent, scratch.centre);
    scratch.half.copy(posture.extent).multiplyScalar(destination.scale * 0.52);
    target.expandByPoint(
      scratch.point
        .copy(destination.position)
        .addScaledVector(posture.centre, destination.scale)
        .add(scratch.half),
    );
    target.expandByPoint(
      scratch.point
        .copy(destination.position)
        .addScaledVector(posture.centre, destination.scale)
        .sub(scratch.half),
    );
  }
  if (target.isEmpty()) {
    target.min.set(-4, -1, -2);
    target.max.set(4, 1, 2);
  }
  return target;
}

export function commonModelBounds(
  left: T.Box3,
  right: T.Box3,
  target = new T.Box3(),
) {
  return target.copy(left).union(right);
}

export function disposeModelResources(model: BuiltModel) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>();
  model.root.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    geometries.add(object.geometry);
    (Array.isArray(object.material)
      ? object.material
      : [object.material]
    ).forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    if (
      material instanceof T.MeshBasicMaterial ||
      material instanceof T.MeshStandardMaterial
    )
      for (const value of Object.values(material))
        if (value instanceof T.Texture) value.dispose();
    material.dispose();
  });
}
