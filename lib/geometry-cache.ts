import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Geometry that depends only on its measurements, shared by every build.
 *
 * Rounded boxes and perforated panels were most of a model's construction
 * time, and the same few sizes are generated again for every sub-assembly
 * and every visit to a scale: the four tiles of the mesh front are one
 * perforation, and the desktop builds its card and board as nested models.
 * Nothing mutates a geometry after construction (the merge step transforms
 * copies), so one instance can serve all of them.
 */
const shared = new Map<string, T.BufferGeometry>();

/**
 * Resources that outlive any one model. Disposing a model leaves them alone:
 * the model on screen is usually drawing them too, and freeing them would only
 * make it upload them again on its next frame.
 */
const lasting = new WeakSet<object>();

export function markShared<R extends object>(resource: R) {
  lasting.add(resource);
  return resource;
}

export const isShared = (resource: object) => lasting.has(resource);

export function sharedGeometry(key: string, make: () => T.BufferGeometry) {
  let geometry = shared.get(key);
  if (!geometry) {
    geometry = markShared(make());
    shared.set(key, geometry);
  }
  return geometry;
}

export const roundedBox = (
  width: number,
  height: number,
  depth: number,
  segments: number,
  radius: number,
) =>
  sharedGeometry(
    `rounded:${width},${height},${depth},${segments},${radius}`,
    () => new RoundedBoxGeometry(width, height, depth, segments, radius),
  );
