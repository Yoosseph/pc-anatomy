import * as T from 'three';
import { byId } from './manifest.ts';
import { isPhysical, levels, type LevelId } from './levels.ts';
import { inventoryLayout, smoothstep, spatialInventory } from './layout.ts';
import type { Piece } from './models.ts';

export type BuiltModel = { root: T.Group; pieces: Piece[] };

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
) {
  const position = new T.Vector3(),
    inventory = new T.Vector3(),
    extent = new T.Vector3(),
    centre = new T.Vector3(),
    point = new T.Vector3(),
    half = new T.Vector3(),
    grid = laidOutAmount(value);
  target.makeEmpty();
  for (const piece of model.pieces.filter((candidate) => candidate.visible)) {
    const destination = pieceDestination(
      piece,
      level,
      value,
      position,
      inventory,
    );
    const posture = piecePosture(piece, grid, extent, centre);
    half.copy(posture.extent).multiplyScalar(destination.scale * 0.52);
    target.expandByPoint(
      point
        .copy(destination.position)
        .addScaledVector(posture.centre, destination.scale)
        .add(half),
    );
    target.expandByPoint(
      point
        .copy(destination.position)
        .addScaledVector(posture.centre, destination.scale)
        .sub(half),
    );
  }
  if (target.isEmpty())
    target.set(new T.Vector3(-4, -1, -2), new T.Vector3(4, 1, 2));
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
