export type Vec3 = [number, number, number];
export function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
export function inventoryLayout(count: number, aspect: number) {
  const columns = Math.max(
    1,
    Math.ceil(Math.sqrt(count * Math.max(0.45, aspect))),
  );
  const rows = Math.ceil(count / columns);
  const gap = 1.45;
  return Array.from(
    { length: count },
    (_, i) =>
      [
        ((i % columns) - (columns - 1) / 2) * gap,
        0,
        (Math.floor(i / columns) - (rows - 1) / 2) * gap,
      ] as Vec3,
  );
}
export function finiteBounds(points: Vec3[]) {
  return points.every((p) => p.every(Number.isFinite));
}
