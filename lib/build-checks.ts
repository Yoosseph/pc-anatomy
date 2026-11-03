import {
  board,
  caseRoom,
  coolerOptions,
  graphicsOptions,
  memoryFits,
  memoryOptions,
  plural,
  powerOptions,
  processorOptions,
  socketFits,
  storageOptions,
  type BuildSlot,
  type CoolerOption,
  type DesktopBuild,
  type GraphicsOption,
  type MemoryOption,
  type PowerOption,
  type ProcessorOption,
  type StorageOption,
} from './desktop-build.ts';
import type { SourceId } from './sources.ts';

/**
 * Whether the parts of a build work together, one check at a time.
 *
 * Each check compares published figures, or measurements of the modelled
 * case, and says which kind of claim it makes: a part that cannot physically
 * fit is a failure, a supply under the maker's recommendation is a warning,
 * not a prediction that the machine will fail. Every result names the sources
 * it rests on.
 *
 * No three.js here, like `desktop-build.ts`: the workspace asks these
 * questions on every render, before the engine has loaded.
 */

/**
 * The longest card the case takes with this cooler, millimetres. A front
 * radiator stands inside the intake fans, so it takes its own thickness out
 * of the card's room.
 */
export const cardClearance = (cooler: CoolerOption) =>
  caseRoom.cardLength - (cooler.radiator?.thickness ?? 0);

export type CheckStatus = 'ok' | 'warn' | 'fail';
type CheckId =
  | 'socket'
  | 'cooler'
  | 'memory'
  | 'length'
  | 'supply'
  | 'connector'
  | 'storage'
  | 'budget';
export interface BuildCheck {
  id: CheckId;
  status: CheckStatus;
  title: string;
  detail: string;
  /** Each source once. */
  sources: SourceId[];
}

/** One check's result, filed under its id with the sources it rests on. */
const checkOf =
  (id: CheckId, sources: SourceId[]) =>
  (status: CheckStatus, title: string, detail: string): BuildCheck => ({
    id,
    status,
    title,
    detail,
    sources: [...new Set(sources)],
  });

function socketCheck(cpu: ProcessorOption) {
  const result = checkOf('socket', [...cpu.sources, ...board.sources]);
  return socketFits(cpu)
    ? result(
        'ok',
        'Processor fits the socket',
        `The ${cpu.name} is an ${cpu.socket} processor, and the board has an ${board.socket} socket.`,
      )
    : result(
        'fail',
        'Processor does not fit the socket',
        `The ${cpu.name} needs an ${cpu.socket} socket. This board has ${board.socket}, so the processor is not installed.`,
      );
}

/**
 * Exported so the tests can try a cooler bigger than any on offer. An air
 * tower has to stand under the side glass; a radiator needs a row of fan
 * positions as long as it is, which this case has at the front and not under
 * the roof.
 */
export function coolerCheck(cooler: CoolerOption) {
  const result = checkOf('cooler', cooler.sources);
  const { radiator, height } = cooler;
  if (radiator) {
    const fits = radiator.fans <= caseRoom.frontFans;
    const detail = `The ${radiator.length} mm radiator takes ${radiator.fans} 120 mm fans. The case has ${caseRoom.frontFans} behind the front panel, and ${caseRoom.roof} mm between the board and the roof, too little for a radiator and its fans.`;
    return fits
      ? result('ok', 'Radiator fits the front of the case', detail)
      : result('fail', 'Radiator is too long for the case', detail);
  }
  const detail = `The tower stands ${height} mm off the board, and the case has about ${caseRoom.coolerHeight} mm to the side glass.`;
  return (height ?? 0) <= caseRoom.coolerHeight
    ? result('ok', 'Cooler fits under the side panel', detail)
    : result('fail', 'Cooler is too tall for the case', detail);
}

function memoryCheck(ram: MemoryOption) {
  if (memoryFits(ram))
    return checkOf('memory', [...ram.sources, ...board.sources])(
      'ok',
      'Memory fits the slots',
      `${ram.generation} modules in ${board.memory} slots.`,
    );
  // The failure rests on the key positions, which the module's own sources
  // do not describe.
  return checkOf('memory', [
    'jedecmo329',
    'ddr5architecture',
    ...board.sources,
  ])(
    'fail',
    'Memory does not fit the slots',
    `The key notch of a ${ram.generation} module is in a different place from a ${board.memory} slot's, so it cannot be pushed in. The modules are not installed.`,
  );
}

/** Exported so the tests can try a card longer than any on offer. */
export function lengthCheck(
  gpu: Pick<GraphicsOption, 'length' | 'sources'>,
  cooler: CoolerOption,
) {
  const room = cardClearance(cooler);
  // The cooler only comes into it when its radiator takes some of the room.
  const result = checkOf('length', [
    ...gpu.sources,
    ...(cooler.radiator ? cooler.sources : []),
  ]);
  const radiator = cooler.radiator
    ? ` With the radiator inside the front fans, that is ${caseRoom.cardLength} mm less its ${cooler.radiator.thickness} mm.`
    : '';
  return gpu.length <= room
    ? result(
        'ok',
        'Card fits the case',
        `${gpu.length} mm long, and the case takes cards up to about ${room} mm.${radiator}`,
      )
    : result(
        'fail',
        'Card is too long for the case',
        `${gpu.length} mm long, but the case only takes about ${room} mm.${radiator}`,
      );
}

function supplyCheck(gpu: GraphicsOption, psu: PowerOption) {
  const result = checkOf('supply', [...gpu.sources, ...psu.sources]);
  const detail = `${gpu.psuSource} gives ${gpu.psu} W as the ${gpu.psuKind} supply for the ${gpu.name}. The ${psu.name} is rated ${psu.watts} W.`;
  if (psu.watts >= gpu.psu)
    return result('ok', 'Supply meets the card maker’s figure', detail);
  return gpu.psuKind === 'minimum'
    ? result('fail', 'Supply is below the card’s minimum', detail)
    : result('warn', 'Supply is below the card maker’s recommendation', detail);
}

function connectorCheck(gpu: GraphicsOption, psu: PowerOption) {
  const result = checkOf('connector', [...gpu.sources, ...psu.sources]);
  const leads = plural(psu.eightPin, '8-pin PCIe lead');
  if (gpu.connector === '8-pin')
    return psu.eightPin >= 1
      ? result(
          'ok',
          'Power cable matches the card',
          `The card takes one 8-pin PCIe lead, and the ${psu.name} has ${leads}.`,
        )
      : result(
          'fail',
          'No lead for the card',
          `The card takes an 8-pin PCIe lead, and the ${psu.name} has none.`,
        );
  if (psu.sixteenPin)
    return result(
      'ok',
      'Power cable matches the card',
      `The card takes a 16-pin 12V-2x6 lead, which the ${psu.name} has.`,
    );
  if (!gpu.adapter)
    return result(
      'warn',
      'No 16-pin lead for the card',
      `The ${psu.name} has only 8-pin PCIe leads, and the card has a 16-pin 12V-2x6 socket. It needs a 12V-2x6 cable or an adapter.`,
    );
  return psu.eightPin >= gpu.adapter.leads
    ? result(
        'warn',
        'Card needs its adapter',
        `The ${psu.name} has no 16-pin 12V-2x6 lead. The card comes with a ${gpu.adapter.name} adapter, and the supply has ${leads} to fill it.`,
      )
    : result(
        'fail',
        'Not enough leads for the card’s adapter',
        `The ${psu.name} has no 16-pin 12V-2x6 lead, and the card’s ${gpu.adapter.name} adapter needs ${gpu.adapter.leads} leads where the supply has ${psu.eightPin}.`,
      );
}

/**
 * The M.2 drive takes its power through the slot it sits in; a SATA drive
 * needs a data cable to the board and a power lead from the supply.
 */
function storageCheck(drives: StorageOption, psu: PowerOption) {
  const m2 =
    'The M.2 drive sits in the board’s M.2 slot and takes its power through it.';
  if (!drives.sata)
    return checkOf('storage', [...drives.sources, ...board.sources])(
      'ok',
      'Drive fits the board',
      `${m2} The build needs no drive cables.`,
    );
  const result = checkOf('storage', [
    ...drives.sources,
    ...board.sources,
    ...psu.sources,
  ]);
  return psu.sata >= 1
    ? result(
        'ok',
        'Both drives are connected',
        `${m2} The SATA SSD takes a data cable to one of the board’s SATA ports and a power lead from the ${psu.name}, which has ${plural(psu.sata, 'SATA power connector')}.`,
      )
    : result(
        'fail',
        'No power lead for the SATA drive',
        `${m2} The SATA SSD needs a SATA power lead, and the ${psu.name} has none.`,
      );
}

function budgetCheck(
  cpu: ProcessorOption,
  gpu: GraphicsOption,
  psu: PowerOption,
) {
  const result = checkOf('budget', [
    ...cpu.sources,
    ...gpu.sources,
    ...psu.sources,
  ]);
  const draw = cpu.watts + gpu.watts;
  // The figure is for the parts chosen, so it still answers whether this
  // supply would carry them when the processor cannot go into this board.
  const unseated = socketFits(cpu)
    ? ''
    : ` The ${cpu.name} is counted as chosen, though it does not fit this board.`;
  const detail = `${cpu.watts} W (${cpu.wattsLabel}) plus ${gpu.watts} W for the card is ${draw} W, against ${psu.watts} W. Memory, drives, fans and short peaks add more on top.${unseated}`;
  return draw <= psu.watts
    ? result('ok', 'Processor and card are within the supply’s rating', detail)
    : result(
        'fail',
        'Processor and card add up to more than the supply',
        detail,
      );
}

/** Rated draw: the processor's and the card's published power figures. */
export function ratedDraw(build: DesktopBuild) {
  return (
    processorOptions[build.processor].watts +
    graphicsOptions[build.graphics].watts
  );
}

/** Every check, in the order a builder would meet them. */
export function checkBuild(build: DesktopBuild): BuildCheck[] {
  const cpu = processorOptions[build.processor],
    cooler = coolerOptions[build.cooler],
    ram = memoryOptions[build.memory],
    gpu = graphicsOptions[build.graphics],
    drives = storageOptions[build.storage],
    psu = powerOptions[build.power];
  return [
    socketCheck(cpu),
    coolerCheck(cooler),
    memoryCheck(ram),
    lengthCheck(gpu, cooler),
    supplyCheck(gpu, psu),
    connectorCheck(gpu, psu),
    storageCheck(drives, psu),
    budgetCheck(cpu, gpu, psu),
  ];
}

/** The checks each slot's part takes part in. */
const slotChecks: Record<BuildSlot, CheckId[]> = {
  processor: ['socket', 'budget'],
  cooler: ['cooler', 'length'],
  memory: ['memory'],
  graphics: ['length', 'supply', 'connector', 'budget'],
  storage: ['storage'],
  power: ['supply', 'connector', 'storage', 'budget'],
};

/**
 * Whether putting this part in the slot, with the rest of the build as it is,
 * fails a check the part is involved in. A problem elsewhere in the build
 * does not mark every option in every slot.
 */
export function conflicts<S extends BuildSlot>(
  build: DesktopBuild,
  slot: S,
  part: DesktopBuild[S],
) {
  return checkBuild({ ...build, [slot]: part }).some(
    (c) => c.status === 'fail' && slotChecks[slot].includes(c.id),
  );
}

/** The worst result across every check. */
export function buildStatus(checks: BuildCheck[]): CheckStatus {
  return checks.some((c) => c.status === 'fail')
    ? 'fail'
    : checks.some((c) => c.status === 'warn')
      ? 'warn'
      : 'ok';
}

/** The worst result among the checks one slot's part takes part in. */
export const slotStatus = (checks: BuildCheck[], slot: BuildSlot) =>
  buildStatus(checks.filter((c) => slotChecks[slot].includes(c.id)));
