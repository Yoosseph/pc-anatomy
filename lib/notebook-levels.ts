import type { LevelDef } from './levels.ts';

export type NotebookLevel =
  | 'legion'
  | 'legionboard'
  | 'legioncpu'
  | 'legioncore'
  | 'legiongpu'
  | 'legionsm'
  | 'legionmemory'
  | 'legionpackage'
  | 'legionbank'
  | 'legiondram'
  | 'legioncell'
  | 'legionstorage'
  | 'legioncooling'
  | 'legionbattery'
  | 'legiondisplay'
  | 'macbook'
  | 'macboard'
  | 'm1pro'
  | 'maccpu'
  | 'maccore'
  | 'macgpu'
  | 'macgpucore'
  | 'macmemory'
  | 'macbank'
  | 'macdram'
  | 'maccell'
  | 'macstorage'
  | 'maccooling'
  | 'macbattery'
  | 'macdisplay';

const phases = [
  ['Assembled', 0],
  ['Dissection', 50],
  ['Inventory', 100],
] as const;
const scale = (
  id: NotebookLevel,
  parent: NotebookLevel | null,
  name: string,
  summary: string,
  kind: 'physical' | 'logical' = 'physical',
  branchLabel?: string,
): LevelDef => ({
  id,
  parent,
  name,
  title: name + '.',
  summary,
  caption:
    kind === 'logical' ? 'LOGICAL DIAGRAM' : 'ILLUSTRATIVE NOTEBOOK HARDWARE',
  kind,
  concept: id,
  camera:
    kind === 'logical'
      ? { padding: 0.98, direction: [0.16, 1.9, 0.6] }
      : {
          padding: 0.98,
          ...(id === 'legionpackage' ? { minimumDistance: 0.8 } : {}),
        },
  phases,
  detailed: true,
  branchLabel,
  ...(parent === null ? { comparisonGroup: 'notebook' } : {}),
});

export const notebookLevels: Record<NotebookLevel, LevelDef> = {
  legion: scale(
    'legion',
    null,
    'Lenovo Legion 5',
    '15ACH6H · Ryzen 7 5800H · RTX 3060 Laptop GPU',
  ),
  legionboard: scale(
    'legionboard',
    'legion',
    'Legion system board',
    'Soldered processors, replaceable memory and M.2 storage',
    'physical',
    'System board',
  ),
  legioncpu: scale(
    'legioncpu',
    'legionboard',
    'Ryzen 7 5800H',
    'Eight Zen 3 cores and integrated Radeon graphics',
    'logical',
    'Processor',
  ),
  legioncore: scale(
    'legioncore',
    'legioncpu',
    'Zen 3 core',
    'Instruction flow through one representative CPU core',
    'logical',
  ),
  legiongpu: scale(
    'legiongpu',
    'legionboard',
    'RTX 3060 Laptop GPU',
    'Ampere graphics with dedicated GDDR6',
    'logical',
    'Graphics',
  ),
  legionsm: scale(
    'legionsm',
    'legiongpu',
    'Ampere SM',
    'Scheduling, arithmetic, texture and ray tracing',
    'logical',
  ),
  legionmemory: scale(
    'legionmemory',
    'legionboard',
    'DDR4 SO-DIMM',
    'Replaceable DDR4-3200 notebook memory',
    'physical',
    'Memory',
  ),
  legionpackage: scale(
    'legionpackage',
    'legionmemory',
    'DDR4 FBGA package',
    'Mold, die, substrate and solder-ball connections',
  ),
  legiondram: scale(
    'legiondram',
    'legionpackage',
    'DDR4 DRAM die',
    'Banks, row selection and data access',
    'logical',
  ),
  legionbank: scale(
    'legionbank',
    'legiondram',
    'DDR4 memory bank',
    'Cell mats, row decoders, sensing and data access',
    'logical',
  ),
  legioncell: scale(
    'legioncell',
    'legionbank',
    'DDR4 memory cell',
    'One transistor, one capacitor and refresh',
    'logical',
  ),
  legionstorage: scale(
    'legionstorage',
    'legionboard',
    'Legion M.2 SSD',
    'Removable PCIe NVMe storage',
    'physical',
    'Storage',
  ),
  legioncooling: scale(
    'legioncooling',
    'legion',
    'Legion cooling',
    'Two blowers and a shared thermal assembly',
    'physical',
    'Cooling',
  ),
  legionbattery: scale(
    'legionbattery',
    'legion',
    'Legion battery',
    '80 Wh configuration · cells and protection',
    'physical',
    'Battery',
  ),
  legiondisplay: scale(
    'legiondisplay',
    'legion',
    'Legion display',
    '15.6-inch FHD IPS · 165 Hz configuration',
    'physical',
    'Display',
  ),
  macbook: scale(
    'macbook',
    null,
    'MacBook Pro 14-inch',
    '2021 · M1 Pro · 10-core CPU / 16-core GPU',
  ),
  macboard: scale(
    'macboard',
    'macbook',
    'MacBook logic board',
    'Apple Silicon, onboard flash and I/O',
    'physical',
    'Logic board',
  ),
  m1pro: scale(
    'm1pro',
    'macboard',
    'Apple M1 Pro',
    'CPU, GPU, Neural Engine and unified memory',
    'logical',
    'Apple Silicon',
  ),
  maccpu: scale(
    'maccpu',
    'm1pro',
    'M1 Pro CPU',
    'Eight performance cores and two efficiency cores',
    'logical',
  ),
  maccore: scale(
    'maccore',
    'maccpu',
    'CPU core principles',
    'Conceptual instruction flow, not an Apple floorplan',
    'logical',
  ),
  macgpu: scale(
    'macgpu',
    'm1pro',
    'M1 Pro GPU',
    'Sixteen GPU cores sharing unified memory',
    'logical',
    'Graphics',
  ),
  macgpucore: scale(
    'macgpucore',
    'macgpu',
    'GPU core principles',
    'Conceptual parallel execution, not an Apple floorplan',
    'logical',
  ),
  macmemory: scale(
    'macmemory',
    'm1pro',
    'Unified memory',
    'A shared pool for CPU, GPU and accelerators',
    'logical',
    'Memory',
  ),
  macdram: scale(
    'macdram',
    'macmemory',
    'DRAM organization',
    'Conceptual banks and row access; no asserted die topology',
    'logical',
  ),
  macbank: scale(
    'macbank',
    'macdram',
    'DRAM bank principles',
    'Cell mats and access circuits; topology illustrative',
    'logical',
  ),
  maccell: scale(
    'maccell',
    'macbank',
    'DRAM memory cell',
    'A conceptual charge-storage cell',
    'logical',
  ),
  macstorage: scale(
    'macstorage',
    'macboard',
    'MacBook flash storage',
    'Onboard NAND, managed by Apple Silicon',
    'physical',
    'Storage',
  ),
  maccooling: scale(
    'maccooling',
    'macbook',
    'MacBook cooling',
    'Two fans and a heat-pipe assembly',
    'physical',
    'Cooling',
  ),
  macbattery: scale(
    'macbattery',
    'macbook',
    'MacBook battery',
    '70 Wh lithium-polymer battery assembly',
    'physical',
    'Battery',
  ),
  macdisplay: scale(
    'macdisplay',
    'macbook',
    'Liquid Retina XDR display',
    '14.2-inch mini-LED backlit LCD',
    'physical',
    'Display',
  ),
};
