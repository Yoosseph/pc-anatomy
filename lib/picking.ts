import * as T from 'three';
import type { Piece } from './models.ts';

/**
 * Turn a list of raycast hits into the part the viewer means.
 *
 * A window you can see through is a window you can point through: without this
 * the glass side panel is the first hit everywhere it covers, so it answers for
 * the whole machine and nothing inside it can be named. Transparent surfaces,
 * the glass and the floating text labels, are remembered but stepped past, so
 * a solid part behind them wins. The glass is still pickable where there is
 * nothing behind it.
 */
export function resolvePick(hits: T.Intersection[]): Piece | null {
  return resolveDepth(hits)?.piece ?? null;
}

/** A resolved part and how far down the ray it was found. */
type Depth = { piece: Piece; distance: number };

/** `resolvePick`, keeping the depth so competing rays can be compared. */
function resolveDepth(hits: T.Intersection[]): Depth | null {
  let through: Depth | null = null;
  for (const h of hits) {
    let obj: T.Object3D | null = h.object;
    let p: Piece | undefined;
    if (h.object instanceof T.InstancedMesh && h.object.userData.pieces)
      p = h.object.userData.pieces[h.instanceId!];
    else
      while (obj && !p) {
        p = obj.userData.piece;
        obj = obj.parent;
      }
    if (!p?.visible || p.object.scale.x <= 0.02) continue;
    const m = (h.object as T.Mesh).material;
    const seeThrough = (Array.isArray(m) ? m : [m]).some(
      (one) =>
        one &&
        'transparent' in one &&
        one.transparent &&
        ((one as T.Material & { opacity: number }).opacity ?? 1) < 0.75,
    );
    if (seeThrough) through ??= { piece: p, distance: h.distance };
    else return { piece: p, distance: h.distance };
  }
  return through;
}

/** Eight directions round a circle, in units of the tolerance radius. */
const RING = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return [Math.cos(angle), Math.sin(angle)] as const;
});

/**
 * Pointing, with a margin for error.
 *
 * A single ray demands pixel-exact aim. Most of this machine is not pixel-sized
 * but a resistor in the inventory is two or three pixels across, and a finger
 * reports a contact point nowhere near that precise, so the smallest parts were
 * effectively unselectable however carefully you tried.
 *
 * The centre ray is cast first and, when it finds something, answers alone: a
 * hit costs exactly what it always did. Only a miss pays for the ring, and a
 * miss is the case that was returning nothing anyway. Among the ring's hits the
 * nearest to the camera wins, so widening the target never reaches past
 * something in front of it.
 *
 * `cast` takes an offset in screen pixels and returns raw intersections, which
 * keeps this function free of the camera, the renderer and any WebGL context,
 * the same reason `resolvePick` lives here rather than in `scene.ts`.
 */
export function resolvePickNear(
  cast: (dx: number, dy: number) => T.Intersection[],
  radius = 0,
): Piece | null {
  const direct = resolveDepth(cast(0, 0));
  if (direct || radius <= 0) return direct?.piece ?? null;
  let best: Depth | null = null;
  for (const [dx, dy] of RING) {
    const near = resolveDepth(cast(dx * radius, dy * radius));
    if (near && (!best || near.distance < best.distance)) best = near;
  }
  return best?.piece ?? null;
}
