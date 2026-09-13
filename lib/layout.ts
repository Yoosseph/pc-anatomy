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

/** Shelf packing retains size differences: a resistor never becomes a PCB-sized tile. */
export function hardwareInventory(
  items: { extent: Vec3; size: number }[],
  aspect: number,
) {
  const cells = items.map((item, index) => {
    const scale = Math.min(3.5, Math.max(0.58, 1 / Math.sqrt(item.size)));
    return {
      index,
      scale,
      width: Math.max(0.15, item.extent[0] * scale) + 0.15,
      depth: Math.max(0.15, item.extent[2] * scale) + 0.15,
    };
  });
  const area = cells.reduce((sum, cell) => sum + cell.width * cell.depth, 0);
  const width = Math.max(
    1,
    ...cells.map((c) => c.width),
    Math.sqrt(area * Math.max(0.45, aspect)) * 1.15,
  );
  const result: { position: Vec3; scale: number }[] = [];
  let x = 0,
    z = 0,
    rowDepth = 0;
  // Tallest footprints first avoids wasted shelves and stays deterministic.
  cells.sort((a, b) => b.depth - a.depth || a.index - b.index);
  for (const cell of cells) {
    if (x + cell.width > width && x > 0) {
      x = 0;
      z += rowDepth;
      rowDepth = 0;
    }
    result[cell.index] = {
      position: [x + cell.width / 2 - width / 2, 0, z + cell.depth / 2],
      scale: cell.scale,
    };
    x += cell.width;
    rowDepth = Math.max(rowDepth, cell.depth);
  }
  for (const cell of result) cell.position[2] -= (z + rowDepth) / 2;
  return result;
}

/**
 * The disassembled machine, laid out as a set of floating shelves rather than
 * one flat tray.
 *
 * Parts keep their real size relationships (bounded magnification stops a
 * resistor vanishing), get generous air around them, and are grouped by
 * footprint so each layer holds parts of a similar size, the way a teardown
 * actually ends up on a bench. Because it occupies real depth, the result is
 * something you orbit rather than something you read from directly above.
 */
export function spatialInventory(
  items: { extent: Vec3; size: number }[],
  aspect: number,
) {
  const GAP = 1.15; // air around the biggest parts, in scene units
  // Air in proportion to the part, not a constant.
  //
  // A flat gap is right for a case panel and absurd for a resistor: drawn at
  // 0.3 units, it was being given a moat three times its own width. Across a
  // shelf of 180 such parts that left the field 97% empty, so a part was a
  // two-pixel speck you had to hit exactly. Measured: one probe point in 48
  // landed on anything. The empty space cost twice over, because it also
  // inflated the bounding sphere the camera frames, pushing the whole
  // inventory further away and shrinking every part again.
  //
  // Scaling the gap with the part keeps the roomy, laid-out-on-a-bench look
  // where it reads as deliberate and closes it up where it only hid things.
  // The floor stops neighbours touching; the cap preserves today's spacing for
  // anything already large.
  const gapFor = (drawn: number) => Math.min(GAP, Math.max(0.12, drawn * 0.45));
  const cells = items.map((item, index) => {
    const scale = Math.min(3.5, Math.max(0.58, 1 / Math.sqrt(item.size)));
    const gap = gapFor(Math.max(item.extent[0], item.extent[2]) * scale);
    return {
      index,
      scale,
      width: Math.max(0.2, item.extent[0] * scale) + gap,
      depth: Math.max(0.2, item.extent[2] * scale) + gap,
      height: Math.max(0.2, item.extent[1] * scale),
    };
  });
  const result: { position: Vec3; scale: number }[] = [];
  if (!cells.length) return result;

  // Biggest footprints first, then split into layers of roughly equal area so
  // no single layer sprawls while another sits nearly empty.
  const order = [...cells].sort(
    (a, b) => b.width * b.depth - a.width * a.depth || a.index - b.index,
  );
  const layerCount = Math.max(
    1,
    Math.min(4, Math.round(Math.cbrt(cells.length / 2.2))),
  );
  const totalArea = order.reduce((sum, c) => sum + c.width * c.depth, 0);
  const layers: (typeof order)[] = [];
  let current: typeof order = [],
    running = 0;
  for (const cell of order) {
    current.push(cell);
    running += cell.width * cell.depth;
    if (running >= totalArea / layerCount && layers.length < layerCount - 1) {
      layers.push(current);
      current = [];
      running = 0;
    }
  }
  layers.push(current);

  // One width for every layer, not each layer's own. Otherwise the shelf of
  // screws comes out as a narrow thread while the shelf of panels sprawls, and
  // the result reads as a column, not a cabinet.
  //
  // That width comes from the LARGEST layer rather than the average of them.
  // Once small parts stop carrying a screw-sized moat, the crowded shelves
  // contribute far less area, and an average dragged down by them narrows the
  // whole cabinet, so the big-part shelves wrap onto extra rows and the
  // inventory grows deeper than it started. Sizing to the widest demand keeps
  // every shelf the shape it has today and lets the dense ones simply pack in.
  const perLayer = Math.max(
    ...layers.map((layer) =>
      layer.reduce((sum, cell) => sum + cell.width * cell.depth, 0),
    ),
  );
  const width = Math.max(
    1,
    ...cells.map((c) => c.width),
    Math.sqrt(perLayer * Math.max(0.5, aspect)) * 1.35,
  );
  const layerBoxes = layers.map((layer) => {
    const placed: { cell: (typeof layer)[number]; x: number; z: number }[] = [];
    let x = 0,
      z = 0,
      rowDepth = 0;
    // Tallest footprints first keeps shelves tight and the order deterministic.
    const sorted = [...layer].sort(
      (a, b) => b.depth - a.depth || a.index - b.index,
    );
    for (const cell of sorted) {
      if (x + cell.width > width && x > 0) {
        x = 0;
        z += rowDepth;
        rowDepth = 0;
      }
      placed.push({ cell, x: x + cell.width / 2 - width / 2, z: z + cell.depth / 2 });
      x += cell.width;
      rowDepth = Math.max(rowDepth, cell.depth);
    }
    return {
      placed,
      depth: z + rowDepth,
      tallest: Math.max(...layer.map((c) => c.height)),
    };
  });

  // Stack the layers with enough clearance that nothing on one overlaps the
  // next, plus a constant so even flat parts read as separate shelves.
  let y = 0;
  const heights: number[] = [];
  for (const box of layerBoxes) {
    heights.push(y);
    y += box.tallest * 1.2 + 2.4;
  }
  const middle = (heights.at(-1) ?? 0) / 2;

  layerBoxes.forEach((box, layer) => {
    for (const { cell, x, z } of box.placed)
      result[cell.index] = {
        position: [x, heights[layer] - middle, z - box.depth / 2],
        scale: cell.scale,
      };
  });
  return result;
}
