import * as T from 'three';
import type { Vec3 } from './layout.ts';
import { powerRoutes, type PowerRouteId } from './power-flow-policy.ts';

export type PowerPaths = Record<PowerRouteId, Vec3[]>;
export type PowerTick = (
  seconds: number,
  strength: number,
  routes: readonly PowerRouteId[],
) => void;

/** Authored cable paths, with a conceptual board connection drawn dashed. */
export function buildPowerFlow(paths: PowerPaths) {
  const root = new T.Group();
  root.name = 'Power flow';
  root.userData.contextFrame = true;
  root.visible = false;
  const arrowGeometry = new T.ConeGeometry(0.075, 0.23, 6);
  arrowGeometry.rotateX(Math.PI / 2);
  const markerGeometry = new T.SphereGeometry(0.085, 12, 8);
  const forward = new T.Vector3(0, 0, 1);
  const position = new T.Vector3(),
    tangent = new T.Vector3();
  const rotation = new T.Quaternion(),
    matrix = new T.Matrix4();
  const scale = new T.Vector3(1, 1, 1);
  const tracks = powerRoutes.map((route) => {
    const group = new T.Group();
    group.name = route.id;
    group.userData.powerRoute = route.id;
    group.userData.path = paths[route.id];
    root.add(group);
    const curve = new T.CatmullRomCurve3(
      paths[route.id].map((p) => new T.Vector3(...p)),
    );
    const points = curve.getSpacedPoints(160);
    const tangents = points.map((_, i) =>
      curve.getTangentAt(i / 160).normalize(),
    );
    const style = {
      color: route.color,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    };
    const lineMaterial =
      route.id === 'slot'
        ? new T.LineDashedMaterial({ ...style, dashSize: 0.12, gapSize: 0.1 })
        : new T.LineBasicMaterial(style);
    const line = new T.Line(
      new T.BufferGeometry().setFromPoints(points),
      lineMaterial,
    );
    line.computeLineDistances();
    group.add(line);
    const material = new T.MeshBasicMaterial(style);
    const count = Math.max(2, Math.ceil(curve.getLength() / 1.25));
    const arrows = new T.InstancedMesh(arrowGeometry, material, count);
    arrows.instanceMatrix.setUsage(T.DynamicDrawUsage);
    arrows.frustumCulled = false;
    group.add(arrows);
    for (const point of [points[0], points[160]]) {
      const marker = new T.Mesh(markerGeometry, material);
      marker.position.copy(point);
      group.add(marker);
    }
    // X-ray annotations remain legible behind the tray and PSU shroud. No
    // hardware materials are mutated; annotations never intercept inspection.
    group.traverse((object) => {
      object.userData.contextFrame = true;
      object.renderOrder = 20;
      object.raycast = () => {};
    });
    return {
      id: route.id,
      group,
      points,
      tangents,
      arrows,
      count,
      material,
      lineMaterial,
      length: curve.getLength(),
    };
  });
  const tick: PowerTick = (seconds, strength, routes) => {
    root.visible = strength > 0.002 && routes.length > 0;
    if (!root.visible) return;
    for (const track of tracks) {
      track.group.visible = routes.includes(track.id);
      if (!track.group.visible) continue;
      track.material.opacity = strength * 0.95;
      track.lineMaterial.opacity = strength * 0.55;
      for (let i = 0; i < track.count; i++) {
        // Equal visual speed along every cable; not electron speed or watts.
        const at =
          ((i / track.count + (seconds * 0.9) / track.length) % 1) * 160;
        const index = Math.min(159, Math.floor(at));
        position.lerpVectors(
          track.points[index],
          track.points[index + 1],
          at - index,
        );
        tangent
          .lerpVectors(
            track.tangents[index],
            track.tangents[index + 1],
            at - index,
          )
          .normalize();
        rotation.setFromUnitVectors(forward, tangent);
        matrix.compose(position, rotation, scale);
        track.arrows.setMatrixAt(i, matrix);
      }
      track.arrows.instanceMatrix.needsUpdate = true;
    }
  };
  root.userData.powerTick = tick;
  return root;
}
