import * as T from 'three';
import type { ModelTools } from './hardware.ts';

/**
 * Inside one DRAM package.
 *
 * Coordinates are millimetres in the package frame, 1 unit ≈ 2 mm: the x8
 * ball-grid package comes out at about six units across. The stack is drawn
 * opened for illustration with the die lifted off its substrate and the solder
 * balls beneath it. The package is sealed in reality; internal construction is
 * not claimed.
 */
export function buildDram(tools: ModelTools, _root: T.Group) {
  const { add, instances, box, label } = tools;
  const mm = (value: number) => value / 2;

  // BGA substrate the die sits on.
  const substrate = new T.Group();
  substrate.add(box([mm(12), mm(0.6), mm(10)], '#1c2f24', 0.12));
  label(substrate, 'BGA SUBSTRATE', [0, mm(0.45), mm(3.5)], mm(8), '#82998b');
  add('dramsubstrate', substrate, [0, 0, 0], [0, -1.1, 0]);

  // The 16 Gbit x8 die, lifted above the substrate for illustration.
  const die = new T.Group();
  die.add(box([mm(9), mm(0.5), mm(8)], '#171b20', 0.1, 0.015));
  label(die, '16 GBIT', [0, mm(0.45), 0], mm(7), '#c4cccf');
  add('dramdie', die, [0, mm(1.6), 0], [0, 1.7, 0.5]);

  // Solder ball grid beneath the substrate.
  const positions = [];
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 10; col++)
      positions.push([
        mm(-4.95 + col * 1.1),
        -mm(0.7),
        mm(-3.85 + row * 1.1),
      ] as [number, number, number]);
  instances(
    'dramball',
    positions,
    [mm(0.4), mm(0.4), mm(0.4)],
    0,
    '#9ca7b2',
    new T.SphereGeometry(mm(0.2), 6, 4),
  ).forEach((p, i) => p.delta.set((i % 2 ? 1 : -1) * 0.4, -1.4, 0));
}
