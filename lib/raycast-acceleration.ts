import * as T from 'three';
import { MeshBVH } from 'three-mesh-bvh';

/**
 * Below this a plain triangle scan is as quick as walking a tree. Most meshes
 * in a model are small; the cost is in a few merged chassis and board meshes
 * of tens of thousands of triangles, which a hit on their box used to scan
 * from end to end.
 */
const MIN_TRIANGLES = 1000;

const sphere = new T.Sphere(),
  inverse = new T.Matrix4(),
  localRay = new T.Ray();

/**
 * `Mesh.raycast`, answered from a bounds tree once one exists.
 *
 * The tree's own entry point skips the sphere and box rejections three.js
 * performs first, which made a miss slower than the scan it replaced, so they
 * are kept in front of it. The hits are the same intersections the scan
 * returns; only the triangles that cannot be hit are no longer visited.
 */
function boundedRaycast(
  this: T.Mesh,
  raycaster: T.Raycaster,
  intersects: T.Intersection[],
) {
  const { geometry } = this;
  const tree = geometry.boundsTree;
  if (!tree || this.material === undefined)
    return T.Mesh.prototype.raycast.call(this, raycaster, intersects);
  if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  sphere.copy(geometry.boundingSphere!).applyMatrix4(this.matrixWorld);
  if (!raycaster.ray.intersectsSphere(sphere)) return;
  localRay
    .copy(raycaster.ray)
    .applyMatrix4(inverse.copy(this.matrixWorld).invert());
  if (geometry.boundingBox && !localRay.intersectsBox(geometry.boundingBox))
    return;
  tree.raycastObject3D(this, raycaster, intersects);
}

/** Heavy geometries in a model, the heaviest first, each with its meshes. */
function heavyGeometries(root: T.Object3D) {
  const found = new Map<T.BufferGeometry, T.Mesh[]>();
  root.traverse((object) => {
    // Instances are small parts; InstancedMesh.raycast also bypasses this.
    if (!(object instanceof T.Mesh) || object instanceof T.InstancedMesh)
      return;
    const { geometry } = object;
    const triangles =
      (geometry.index?.count ?? geometry.attributes.position?.count ?? 0) / 3;
    if (triangles < MIN_TRIANGLES) return;
    const meshes = found.get(geometry);
    if (meshes) meshes.push(object);
    else found.set(geometry, [object]);
  });
  const weight = (g: T.BufferGeometry) =>
    g.index?.count ?? g.attributes.position.count;
  return [...found].sort(([a], [b]) => weight(b) - weight(a));
}

function accelerate(geometry: T.BufferGeometry, meshes: T.Mesh[]) {
  // Indirect keeps the geometry's own index buffer untouched for the GPU.
  geometry.boundsTree ??= new MeshBVH(geometry, { indirect: true });
  for (const mesh of meshes) mesh.raycast = boundedRaycast;
}

/** Build every tree now. For tests and benchmarks. */
export function accelerateRaycasts(root: T.Object3D) {
  for (const [geometry, meshes] of heavyGeometries(root))
    accelerate(geometry, meshes);
}

type Idle = (callback: () => void) => () => void;
const idle: Idle =
  typeof requestIdleCallback === 'function'
    ? (callback) => {
        const id = requestIdleCallback(callback, { timeout: 1000 });
        return () => cancelIdleCallback(id);
      }
    : (callback) => {
        const id = setTimeout(callback, 50);
        return () => clearTimeout(id);
      };

/**
 * Build the trees one geometry at a time in idle time after the model is on
 * screen, so they add nothing to the first frame. Until a geometry has its
 * tree it is picked by the plain scan, exactly as before. Returns a cancel for
 * a model that is disposed before the work is done.
 */
export function scheduleRaycastAcceleration(root: T.Object3D) {
  const queue = heavyGeometries(root);
  let cancel = () => {};
  const next = () => {
    const item = queue.shift();
    if (!item) return;
    accelerate(...item);
    cancel = idle(next);
  };
  cancel = idle(next);
  return () => {
    queue.length = 0;
    cancel();
  };
}
