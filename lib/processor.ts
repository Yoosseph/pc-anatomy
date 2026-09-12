import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';

/**
 * Inside the processor — a placeholder scale.
 *
 * Deliberately schematic: a ring of cores around a shared cache with the memory
 * interface along one edge. Core count, cache size and arrangement are generic
 * illustrations of how a desktop processor is organised, not a floorplan and
 * not a specific product. The graphics branch shows the level of detail this
 * one is heading for.
 */
export function buildProcessor(
  { add, instances, box, label }: ModelTools,
  root: T.Group,
) {
  const put = (parent: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    parent.add(obj);
    return obj;
  };

  // The die outline, as a frame the blocks sit inside.
  const frame = new T.Group();
  frame.userData.contextFrame = true;
  put(frame, box([9.2, 0.09, 6.6], '#15212a', 0.6), [0, -0.07, 0]);
  for (const side of [-1, 1])
    put(frame, box([9.0, 0.05, 0.03], '#4d6b80', 0.7), [0, 0.01, side * 3.2]);
  root.add(frame);

  // Eight cores in two rows, each with its own private cache slab.
  const cores: Vec3[] = [];
  for (let i = 0; i < 8; i++)
    cores.push([((i % 4) - 1.5) * 2.0, 0.2, Math.floor(i / 4) * 3.3 - 1.65]);
  instances('cpucore', cores, [1.72, 0.34, 1.5]);
  for (const core of cores) {
    const tag = new T.Group();
    label(tag, 'CORE', [0, 0, 0], 0.9, '#cfe0ee');
    put(tag, tag.children[0] as T.Object3D, [0, 0, 0]);
    add('cpucore', tag, [core[0], 0.38, core[2]], [0, 0, 0], 1.1);
  }

  // Shared cache down the middle: one long block between the two core rows.
  const cache = new T.Group();
  put(cache, box([8.4, 0.2, 0.85], '#264757', 0.65), [0, 0, 0]);
  label(cache, 'SHARED CACHE', [0, 0.12, 0], 3.4, '#a5cce0');
  add('cpucache', cache, [0, 0.15, 0], [0, 1.5, 0]);

  // Memory interface along the front edge, one block per channel.
  instances(
    'imc',
    [
      [-2.3, 0.2, 2.9],
      [2.3, 0.2, 2.9],
    ],
    [3.9, 0.22, 0.6],
  );
  const note = new T.Group();
  label(note, 'DDR5 MEMORY INTERFACE', [0, 0, 0], 3.6, '#8fb7c9');
  add('imc', note, [0, 0.34, 2.9], [0, 0, 0], 1.1);

  const caveat = new T.Group();
  label(caveat, 'PLACEHOLDER · NOT A DIE FLOORPLAN', [0, 0, 0], 4.4, '#7d7364');
  add('cpudie', caveat, [0, 0.06, -3.0], [0, 0, 0], 1.1);
}
