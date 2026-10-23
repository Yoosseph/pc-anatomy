import * as T from 'three';

/** OrbitControls works in one normalized space, independent of model units. */
export const COMPARISON_ORBIT_DISTANCE = 10;
const viewCenter = new T.Vector3();

export type ComparisonFrame = {
  center: T.Vector3;
  radius: number;
  distance: number;
};

/**
 * Convert each model's enclosing sphere to a viewing distance. A shared
 * physical distance is meaningful only when both authored unit sizes exist.
 * Logical diagrams and uncalibrated models always fit independently.
 */
export function comparisonFitDistances(
  radii: readonly [number, number],
  millimetersPerUnit: readonly [number | null, number | null],
  framing: 'fit' | 'scale',
  aspect: number,
  fov: number,
): [number, number] {
  const vertical = T.MathUtils.degToRad(fov);
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect);
  const denominator = Math.sin(Math.min(vertical, horizontal) / 2);
  const padding = 1.08;
  const distances = radii.map(
    (radius) => (Math.max(radius, 0.001) * padding) / denominator,
  ) as [number, number];
  const [leftUnit, rightUnit] = millimetersPerUnit;
  if (
    framing === 'scale' &&
    leftUnit !== null &&
    rightUnit !== null &&
    Number.isFinite(leftUnit) &&
    Number.isFinite(rightUnit) &&
    leftUnit > 0 &&
    rightUnit > 0
  ) {
    const distance = Math.max(
      distances[0] * leftUnit,
      distances[1] * rightUnit,
    );
    return [distance / leftUnit, distance / rightUnit];
  }
  return distances;
}

/**
 * Copy the shared orbit, pan and zoom into a model's own scene coordinates.
 * Rendering and picking must use this exact same camera transform.
 */
export function updateComparisonCamera(
  shared: T.PerspectiveCamera,
  frame: ComparisonFrame,
  camera: T.PerspectiveCamera,
) {
  const scale = frame.distance / COMPARISON_ORBIT_DISTANCE;
  camera.copy(shared);
  camera.position.multiplyScalar(scale).add(frame.center);
  camera.updateMatrixWorld(true);
  // Tight per-pane depth ranges keep small packages precise even when their
  // physical size places the camera much farther away than independent fit.
  const depth = -viewCenter
    .copy(frame.center)
    .applyMatrix4(camera.matrixWorldInverse).z;
  camera.near = Math.max(0.00001, depth - frame.radius * 2);
  camera.far = Math.max(camera.near + 1, depth + frame.radius * 2);
  camera.updateProjectionMatrix();
}
