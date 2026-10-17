import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { NotebookLevel } from './notebook-levels.ts';
import { diagramKit } from './diagram-kit.ts';
import type { Vec3 } from './layout.ts';

/** Authored functional layouts: distinct hierarchy, circuit, and data-flow views.
 * Sizes are diagram units. Positions never claim physical silicon placement.
 */
export function buildNotebookArchitecture(
  level: NotebookLevel,
  tools: ModelTools,
  root: T.Group,
) {
  const apple = !level.startsWith('legion');
  const palette = {
    panel: apple ? '#19242e' : '#192529',
    rail: apple ? '#536d84' : '#52776d',
    caption: '#9bb2c2',
    text: '#e2ecf1',
  };
  const { backdrop } = diagramKit(tools, palette);
  const blue = apple ? '#496e91' : '#477787',
    teal = '#438a86',
    gold = '#a1834f',
    violet = '#776392',
    cache = '#3e6676';
  const scenery = new T.Group();
  scenery.userData.contextFrame = true;
  root.add(scenery);
  const link = (from: Vec3, to: Vec3, color = '#829eac') => {
    const a = new T.Vector3(...from),
      b = new T.Vector3(...to),
      length = a.distanceTo(b);
    const mesh = tools.box([0.035, 0.025, length], color, 0.4, 0);
    mesh.position.copy(a).lerp(b, 0.5);
    mesh.quaternion.setFromUnitVectors(
      new T.Vector3(0, 0, 1),
      b.sub(a).normalize(),
    );
    scenery.add(mesh);
  };
  const tile = (
    id: string,
    text: string,
    x: number,
    z: number,
    w: number,
    d: number,
    color = blue,
    delta: Vec3 = [0, 1.4, 0],
  ) => {
    const group = new T.Group();
    group.add(tools.box([w, 0.22, d], color, 0.45));
    const lanes = id === 'legionsm-arithmetic';
    if (lanes) {
      // Four such partition blocks contain the SM's 128 FP32-capable lanes.
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 8; col++) {
          const lane = tools.box(
            [((w - 0.35) / 8) * 0.8, 0.07, ((d * 0.55) / 4) * 0.76],
            '#75a5b9',
            0.35,
          );
          lane.position.set(
            ((col - 3.5) * (w - 0.35)) / 8,
            0.17,
            -d * 0.12 + ((row - 1.5) * d * 0.55) / 4,
          );
          group.add(lane);
        }
    }
    tools.label(
      group,
      text,
      [0, lanes ? 0.22 : 0.12, lanes ? d * 0.34 : 0],
      Math.min(w * 0.86, d * (lanes ? 1.45 : 4.2)),
      '#e2ecf1',
    );
    return tools.add(id, group, [x, 0.18, z], delta);
  };
  const repeated = (
    id: string,
    count: number,
    cols: number,
    start: Vec3,
    step: [number, number],
    size: [number, number],
    text: string,
    color = blue,
  ) => {
    for (let i = 0; i < count; i++)
      tile(
        id,
        `${text} ${i + 1}`,
        start[0] + (i % cols) * step[0],
        start[2] + Math.floor(i / cols) * step[1],
        ...size,
        color,
        [
          ((i % cols) - (cols - 1) / 2) * 0.25,
          1.5,
          Math.sign(start[2] + Math.floor(i / cols) * step[1]) * 0.5,
        ],
      );
  };
  if (level === 'legioncpu') {
    backdrop(root, [15, 11], 'RYZEN 7 5800H · 8C / 16T · LOGICAL ORGANIZATION');
    repeated(
      'legioncore',
      8,
      4,
      [-4.8, 0, -2.6],
      [3.2, 2.35],
      [2.75, 1.9],
      'ZEN 3',
      blue,
    );
    tile('legioncpu-cache', '16 MB SHARED L3', 0, 1.75, 12.4, 1.2, cache);
    tile('legioncpu-igpu', 'INTEGRATED RADEON', -3.2, 3.7, 5.9, 1.6, violet);
    tile('legioncpu-io', 'DDR4 / PCIe / I/O', 3.2, 3.7, 5.9, 1.6, teal);
    for (const x of [-4.8, -1.6, 1.6, 4.8])
      link([x, 0.08, 0.7], [x, 0.08, 1.1]);
    return;
  }
  if (level === 'legiongpu') {
    backdrop(root, [15, 12], 'RTX 3060 LAPTOP · 30 SMs · 3,840 FP32 LANES');
    tile('legiongpu-frontend', 'GRAPHICS FRONT END', 0, -4.75, 11.8, 1.0, gold);
    repeated(
      'legionsm',
      30,
      6,
      [-5.5, 0, -3.3],
      [2.2, 1.35],
      [1.9, 1.1],
      'SM',
      blue,
    );
    tile('legiongpu-cache', 'SHARED GPU CACHE', 0, 4.0, 11.9, 0.8, cache);
    tile(
      'legiongpu-memory',
      '192-BIT GDDR6 INTERFACE · 6 GB',
      0,
      5.0,
      11.9,
      0.7,
      teal,
    );
    return;
  }
  if (level === 'm1pro') {
    backdrop(root, [16, 12], 'APPLE M1 PRO · SYSTEM ORGANIZATION');
    tile('maccpu', '10-CORE CPU', -3.65, -2.4, 6.0, 3.5, blue);
    tile('macgpu', '16-CORE GPU', 3.6, -2.4, 6.0, 3.5, violet);
    tile('m1pro-neural', '16-CORE NEURAL ENGINE', -4.55, 1.0, 4.2, 2.1, teal);
    tile('m1pro-media', 'VIDEO / ProRes', 0, 1.0, 4.2, 2.1, gold);
    tile('m1pro-io', 'DISPLAY / I/O / STORAGE', 4.55, 1.0, 4.2, 2.1, cache);
    tile(
      'macmemory',
      '16 GB UNIFIED MEMORY · 200 GB/s',
      0,
      4.0,
      13.3,
      1.6,
      teal,
    );
    // The spine communicates sharing. Memory is on the package, not inside
    // the CPU or GPU core blocks, and no die-floorplan is suggested.
    link([-6.7, 0.05, 2.6], [6.7, 0.05, 2.6], teal);
    for (const x of [-4.5, 0, 4.5]) link([x, 0.05, 2.1], [x, 0.05, 3.15], teal);
    return;
  }
  if (level === 'maccpu') {
    backdrop(root, [14, 10], 'M1 PRO CPU · 8 PERFORMANCE + 2 EFFICIENCY');
    repeated(
      'maccore',
      8,
      4,
      [-4.65, 0, -2.7],
      [3.1, 2.1],
      [2.7, 1.7],
      'P-CORE',
      blue,
    );
    repeated(
      'maccpu-efficiency',
      2,
      2,
      [-4.65, 0, 1.6],
      [3.1, 2.1],
      [2.7, 1.65],
      'E-CORE',
      teal,
    );
    tile('maccpu-memory', 'UNIFIED MEMORY ACCESS', 3.0, 1.6, 5.7, 1.65, cache);
    link([-6.0, 0.06, 3.1], [6.0, 0.06, 3.1]);
    return;
  }
  if (level === 'macgpu') {
    backdrop(root, [13.6, 11], 'M1 PRO GPU · 16 CORES · LOGICAL GROUPING');
    repeated(
      'macgpucore',
      16,
      4,
      [-4.5, 0, -3.5],
      [3.0, 1.8],
      [2.6, 1.4],
      'GPU',
      violet,
    );
    tile('macgpu-memory', 'SHARED UNIFIED MEMORY', 0, 4.0, 11.7, 1.2, teal);
    for (const x of [-4.5, -1.5, 1.5, 4.5])
      link([x, 0.06, 2.7], [x, 0.06, 3.3]);
    return;
  }
  if (level === 'legioncore' || level === 'maccore') {
    backdrop(
      root,
      [15, 10],
      level === 'legioncore'
        ? 'CPU INSTRUCTION FLOW · ZEN 3 CONTEXT'
        : 'CPU INSTRUCTION FLOW · APPLE SILICON CONTEXT',
    );
    tile(`${level}-fetch`, 'FETCH', -5, -2, 3.0, 2.2, blue);
    tile(`${level}-decode`, 'DECODE', -1.2, -2, 3.0, 2.2, gold);
    tile(`${level}-execute`, 'EXECUTION', 3.8, -2, 5.0, 2.2, teal);
    tile(`${level}-registers`, 'WORKING REGISTERS', -3, 2, 6.7, 2.0, violet);
    tile(`${level}-loadstore`, 'LOAD / STORE', 4.1, 2, 4.6, 2.0, cache);
    link([-3.5, 0.07, -2], [-2.7, 0.07, -2]);
    link([0.3, 0.07, -2], [1.3, 0.07, -2]);
    link([4.1, 0.07, -0.85], [4.1, 0.07, 0.95]);
    link([0.4, 0.07, 2], [1.7, 0.07, 2]);
    tools.label(
      scenery,
      'CONCEPTUAL DATA FLOW · NO PIPELINE WIDTH OR PHYSICAL PLACEMENT CLAIMED',
      [0, 0.02, 4.2],
      10.5,
      '#9aafba',
    );
    return;
  }
  if (level === 'legionsm' || level === 'macgpucore') {
    backdrop(
      root,
      [15, 11],
      level === 'legionsm'
        ? 'AMPERE SM · FOUR PROCESSING PARTITIONS'
        : 'GPU CORE · PARALLEL EXECUTION PRINCIPLES',
    );
    if (level === 'legionsm') {
      repeated(
        'legionsm-schedule',
        4,
        4,
        [-4.95, 0, -3.5],
        [3.3, 1],
        [2.9, 0.9],
        'SCHED',
        gold,
      );
      repeated(
        'legionsm-registers',
        4,
        4,
        [-4.95, 0, -1.95],
        [3.3, 1],
        [2.9, 1.5],
        'REG FILE',
        violet,
      );
      repeated(
        'legionsm-arithmetic',
        4,
        4,
        [-4.95, 0, 0.0],
        [3.3, 1],
        [2.9, 1.7],
        '32 FP32',
        blue,
      );
      tile('legionsm-tensor', '4 TENSOR CORES', -4.9, 2.1, 3, 1.25, gold);
      tile('legionsm-rt', '1 RT CORE', -1.6, 2.1, 3, 1.25, violet);
      tile('legionsm-texture', '4 TEXTURE UNITS', 3.25, 2.1, 6.2, 1.25, teal);
      tile(
        'legionsm-memory',
        'LOAD / STORE · SHARED MEMORY / L1',
        0,
        4.1,
        12.8,
        1.1,
        cache,
      );
    } else {
      tile(
        'macgpucore-schedule',
        'THREADGROUP SCHEDULING',
        0,
        -3.5,
        12.5,
        1.1,
        gold,
      );
      tile(
        'macgpucore-registers',
        'THREAD WORKING VALUES',
        -3.4,
        -1.5,
        5.8,
        1.5,
        violet,
      );
      tile(
        'macgpucore-arithmetic',
        'PARALLEL ARITHMETIC',
        3.4,
        -1.5,
        5.8,
        1.5,
        blue,
      );
      tile(
        'macgpucore-texture',
        'TEXTURE / SAMPLING',
        -3.4,
        1.0,
        5.8,
        1.7,
        teal,
      );
      tile(
        'macgpucore-memory',
        'THREADGROUP / DEVICE MEMORY',
        3.4,
        1,
        5.8,
        1.7,
        cache,
      );
      link([-6, 0.07, 2.6], [6, 0.07, 2.6]);
      tools.label(
        scenery,
        'METAL PROGRAMMING MODEL · SCHEMATIC RESOURCES, NOT AN APPLE CORE FLOORPLAN',
        [0, 0.02, 4.1],
        11,
        '#9aafba',
      );
    }
    return;
  }
  if (level === 'macmemory') {
    backdrop(root, [15, 11], 'UNIFIED MEMORY · ONE SHARED ADDRESSABLE POOL');
    tile('macmemory-cpu', 'CPU', -4.7, -3, 3.4, 2.0, blue);
    tile('macmemory-gpu', 'GPU', 4.7, -3, 3.4, 2.0, violet);
    tile('macmemory-fabric', 'MEMORY INTERCONNECT', 0, 0, 12.8, 1.3, cache);
    tile('macdram', '16 GB DRAM · SHARED DATA', 0, 3.2, 12.8, 2.4, teal);
    for (const x of [-4.7, 4.7]) link([x, 0.06, -1.9], [x, 0.06, -0.7]);
    for (const x of [-4.7, 0, 4.7]) link([x, 0.06, 0.7], [x, 0.06, 1.9]);
    return;
  }
  if (level === 'legiondram' || level === 'macdram') {
    backdrop(
      root,
      [15, 11],
      level === 'legiondram'
        ? 'DDR4 x8 · 8 Gbit DIE · 16 BANKS'
        : 'DRAM ORGANIZATION · BANK COUNT ILLUSTRATIVE',
    );
    repeated(
      level === 'legiondram' ? 'legionbank' : 'macbank',
      level === 'legiondram' ? 16 : 8,
      4,
      [-4.8, 0, -3.2],
      [3.2, 1.65],
      [2.75, 1.25],
      'BANK',
      teal,
    );
    tile(`${level}-row`, 'ROW / WORDLINE SELECTION', -3.2, 4.1, 5.8, 1.1, blue);
    tile(`${level}-column`, 'COLUMN SELECT', 3.2, 4.1, 5.8, 1.1, violet);
    tile(
      `${level}-sense`,
      'SENSE AMPLIFIERS / ROW BUFFER',
      0,
      level === 'legiondram' ? 3.1 : 0.9,
      12.3,
      0.6,
      cache,
    );
    return;
  }
  if (level === 'legionbank' || level === 'macbank') {
    backdrop(
      root,
      [15, 11],
      level === 'legionbank'
        ? 'DDR4 BANK · LOCAL ARRAYS AND ACCESS CIRCUITS'
        : 'DRAM BANK · ILLUSTRATIVE MAT ORGANIZATION',
    );
    repeated(
      level === 'legionbank' ? 'legioncell' : 'maccell',
      6,
      3,
      [-4.2, 0, -2.7],
      [4.2, 2.7],
      [3.0, 1.8],
      'CELL MAT',
      teal,
    );
    tile(level + '-row', 'ROW DECODE', -5.7, 3, 2.6, 1.5, blue);
    tile(level + '-sense', 'SENSE AMPLIFIERS', -0.8, 3, 6.5, 1.5, cache);
    tile(level + '-column', 'COLUMN / DATA', 4.7, 3, 3.7, 1.5, violet);
    return;
  }
  if (level === 'legioncell' || level === 'maccell') {
    // A small array shows the actual 1T1C relationship: wordlines control gates,
    // vertical bitlines reach the channel and a storage capacitor sits beside it.
    backdrop(
      root,
      [15, 11],
      'DRAM CELL · ACCESS TRANSISTOR + STORAGE CAPACITOR',
    );
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 4; c++) {
        const x = -4.8 + c * 3.2,
          z = -3 + r * 2.45;
        const transistor = new T.Group();
        transistor.add(tools.box([0.65, 0.1, 0.42], '#465f72', 0.25));
        const gate = tools.box([0.12, 0.25, 0.58], gold, 0.6);
        gate.position.y = 0.17;
        transistor.add(gate);
        for (const dx of [-0.25, 0.25]) {
          const contact = tools.box([0.18, 0.12, 0.32], teal, 0.4);
          contact.position.set(dx, 0.07, 0);
          transistor.add(contact);
        }
        tools.add(`${level}-transistor`, transistor, [x, 0.25, z], [0, 1.5, 0]);
        const capacitor = new T.Group();
        // Cylinder shells and a central electrode communicate the two conductors
        // and dielectric without asserting a particular manufacturer's cell shape.
        capacitor.add(
          new T.Mesh(
            new T.CylinderGeometry(0.27, 0.27, 0.48, 24, 1, true),
            tools.material('#859daf', 0.65),
          ),
        );
        const electrode = new T.Mesh(
          new T.CylinderGeometry(0.14, 0.14, 0.44, 18),
          tools.material('#c5aa70', 0.7),
        );
        capacitor.add(electrode);
        tools.add(
          `${level}-capacitor`,
          capacitor,
          [x + 0.9, 0.42, z + 0.65],
          [0, 2.0, 0],
        );
        link([x + 0.34, 0.12, z], [x + 0.9, 0.12, z + 0.65], teal);
      }
    // Wires are selectable groups. Their perpendicular layers are separated.
    const wordlines = new T.Group(),
      bitlines = new T.Group();
    for (let r = 0; r < 3; r++) {
      const wire = tools.box([12.8, 0.06, 0.09], gold, 0.5);
      wire.position.set(0, 0, -3 + r * 2.45);
      wordlines.add(wire);
    }
    for (let c = 0; c < 4; c++) {
      const wire = tools.box([0.09, 0.06, 7.2], blue, 0.5);
      wire.position.set(-5.15 + c * 3.2, 0, 0);
      bitlines.add(wire);
    }
    tools.add(`${level}-wordline`, wordlines, [0, 0.51, 0], [0, 2.5, 0]);
    tools.add(`${level}-bitline`, bitlines, [0, 0.13, 0], [0, 0.9, 0]);
    tile(
      `${level}-refresh`,
      'SENSE / RESTORE / REFRESH',
      0,
      4.25,
      12.4,
      0.85,
      cache,
    );
    return;
  }
  throw new Error(`No notebook architecture builder for ${level}`);
}
