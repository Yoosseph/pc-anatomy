import * as T from 'three';
import type { Piece } from './models.ts';

/**
 * Turn a list of raycast hits into the part the viewer means.
 *
 * A window you can see through is a window you can point through: without this
 * the glass side panel is the first hit everywhere it covers, so it answers for
 * the whole machine and nothing inside it can be named. Transparent surfaces —
 * the glass, and the floating text labels — are remembered but stepped past, so
 * a solid part behind them wins. The glass is still pickable where there is
 * nothing behind it.
 */
export function resolvePick(hits: T.Intersection[]): Piece | null {
  let through: Piece | null = null;
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
    if (seeThrough) through ??= p;
    else return p;
  }
  return through;
}
