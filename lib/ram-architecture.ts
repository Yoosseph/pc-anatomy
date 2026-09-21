import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { diagramKit, put, type DiagramPalette } from './diagram-kit.ts';

/**
 * The logical scales inside a DDR5 die: the bank array and one bank.
 *
 * A block diagram of the documented DDR5 organisation, drawn in the shared
 * diagram language so it reads beside the chip floorplans. Counts are the
 * 16 Gb x8 organisation (32 banks in 8 bank groups of 4); sizes and positions
 * are illustrative throughout. The cell grid is a magnified sample: a real
 * bank holds tens of thousands of rows.
 */

type Level = 'banks' | 'bank';

/** Cool blue-greys with the Memory category accent, for the RAM diagrams. */
const palette: DiagramPalette = {
  panel: '#15242a',
  rail: '#4a6b76',
  caption: '#8fb8c4',
  text: '#d8e9ee',
};

export function buildRamArchitecture(
  level: Level,
  tools: ModelTools,
  root: T.Group,
) {
  const { instances, box, label } = tools;
  const { backdrop, block } = diagramKit(tools, palette);

  if (level === 'banks') {
    backdrop(root, [11.6, 7.6], 'DDR5 DIE · 16 GBIT X8');

    // One group origin shared by the scenery frames and the bank instances.
    const groupOrigin = (g: number): [number, number] => [
      ((g % 4) - 1.5) * 2.7,
      g < 4 ? -1.9 : 1.1,
    ];

    // Eight bank-group frames as scenery: the selectable banks sit inside
    // them, so the grouping reads without adding anonymous pieces.
    const frames = new T.Group();
    for (let g = 0; g < 8; g++) {
      const [gx, gz] = groupOrigin(g);
      put(frames, box([2.55, 0.08, 2.9], '#1d333b', 0.5), [gx, 0.06, gz]);
      for (const side of [-1, 1])
        put(frames, box([2.55, 0.1, 0.06], '#4a6b76', 0.7), [
          gx,
          0.08,
          gz + side * 1.42,
        ]);
    }
    label(frames, '8 BANK GROUPS × 4 BANKS', [0, 0.1, -3.45], 3.4, '#8fb8c4');
    frames.userData.contextFrame = true;
    root.add(frames);

    // Thirty-two banks, four per group, on a 16 Gb or larger x8 die.
    const positions: Vec3[] = [];
    for (let g = 0; g < 8; g++) {
      const [gx, gz] = groupOrigin(g);
      for (let j = 0; j < 4; j++)
        positions.push([
          gx + ((j % 2) - 0.5) * 1.15,
          0.2,
          gz + (Math.floor(j / 2) - 0.5) * 1.44,
        ]);
    }
    instances('drambank', positions, [1.0, 0.28, 1.3], 0, '#64adbf').forEach(
      (p, i) => p.delta.set(((i % 4) - 1.5) * 0.5, 1.2, i < 16 ? -0.6 : 0.6),
    );

    block(
      'dramio',
      [10.8, 0.2, 0.6],
      [0, 0.15, 3.2],
      '#3d5560',
      'I/O · CONTROL · REFRESH',
      [0, 1.5, 0.4],
    );
  } else {
    backdrop(root, [13, 10], 'BANK · ROWS × COLUMNS');

    // Magnified sample of the cell array: 16 rows × 8 columns.
    const cells: Vec3[] = [];
    for (let r = 0; r < 16; r++)
      for (let c = 0; c < 8; c++)
        cells.push([(c - 3.5) * 0.95, 0.14, (r - 7.5) * 0.44]);
    instances('dramcell', cells, [0.75, 0.18, 0.3], 0, '#64adbf').forEach(
      (p, i) => p.delta.set(((i % 8) - 3.5) * 0.2, 0.9 + (i % 3) * 0.3, 0),
    );

    // Row decoder block with wordline stubs bridging to the array edge.
    block(
      'dramrowdec',
      [1.3, 0.24, 7.2],
      [-5.3, 0.15, 0],
      '#4a5a68',
      'ROW DECODER',
      [-0.8, 1.2, 0],
    );
    instances(
      'dramrow',
      Array.from(
        { length: 16 },
        (_, r) => [-4.17, 0.12, (r - 7.5) * 0.44] as Vec3,
      ),
      [0.9, 0.1, 0.1],
      0,
      '#7fc4d4',
    ).forEach((p) => p.delta.set(-0.8, 0.8, 0));

    // Sense-amp strip with bitline stubs bridging to the array edge.
    block(
      'dramsenseamp',
      [7.6, 0.22, 1.0],
      [0, 0.14, 5.0],
      '#3d6e6a',
      'SENSE AMPS · ROW BUFFER',
      [0, 1.5, 0.6],
    );
    instances(
      'dramcolumn',
      Array.from(
        { length: 8 },
        (_, c) => [(c - 3.5) * 0.95, 0.12, 3.97] as Vec3,
      ),
      [0.12, 0.1, 1.0],
      0,
      '#4f93a5',
    ).forEach((p) => p.delta.set(0, 0.8, 0.8));
  }
}
