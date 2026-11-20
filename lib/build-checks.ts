import {
  boardOptions,
  caseRoom,
  coolerOptions,
  graphicsOptions,
  memoryFits,
  memoryOptions,
  powerOptions,
  processorOptions,
  socketFits,
  storageOptions,
  type BoardOption,
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
import { buildText } from './i18n/build-messages.ts';

const text = buildText.checks;

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
  | 'board'
  | 'memory'
  | 'speed'
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

function socketCheck(cpu: ProcessorOption, board: BoardOption) {
  const result = checkOf('socket', [...cpu.sources, ...board.sources]);
  return socketFits(cpu, board)
    ? result('ok', text.socketFits, text.socketFitsDetail(cpu, board))
    : result('fail', text.socketMisfit, text.socketMisfitDetail(cpu, board));
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
    const detail = text.radiatorDetail(radiator, caseRoom);
    return fits
      ? result('ok', text.radiatorFits, detail)
      : result('fail', text.radiatorTooLong, detail);
  }
  const detail = text.towerDetail(height ?? 0, caseRoom.coolerHeight);
  return (height ?? 0) <= caseRoom.coolerHeight
    ? result('ok', text.towerFits, detail)
    : result('fail', text.towerTooTall, detail);
}

/**
 * Exported so the tests can try an outline the case has no standoffs for.
 * The tray takes an ATX board and the micro-ATX one, which uses a subset of
 * the same mounting holes.
 */
export function boardCheck(
  board: Pick<BoardOption, 'name' | 'formFactor' | 'size' | 'sources'>,
) {
  const result = checkOf('board', board.sources);
  const detail = text.boardDetail(board, caseRoom.boards);
  return (caseRoom.boards as readonly string[]).includes(board.formFactor)
    ? result('ok', text.boardFits, detail)
    : result('fail', text.boardMisfit, detail);
}

function memoryCheck(ram: MemoryOption, board: BoardOption) {
  if (memoryFits(ram, board))
    return checkOf('memory', [...ram.sources, ...board.sources])(
      'ok',
      text.memoryFits,
      text.memoryFitsDetail(ram, board),
    );
  // The failure rests on the key positions, which the module's own sources
  // do not describe.
  return checkOf('memory', [
    'jedecmo329',
    'ddr5architecture',
    ...board.sources,
  ])('fail', text.memoryMisfit, text.memoryMisfitDetail(ram, board));
}

/**
 * How fast the memory can run, against the processor maker's rating for that
 * many modules. A kit's XMP or EXPO speed is an overclock on top of the
 * rating, so two modules above it are normal; four, where the maker rates the
 * memory controller far lower, are worth knowing about before buying. Only
 * asked once the modules fit the board.
 */
function speedCheck(cpu: ProcessorOption, ram: MemoryOption) {
  const result = checkOf('speed', [...cpu.sources, ...ram.sources]);
  const maker = cpu.brand === 'amd' ? 'AMD' : 'Intel';
  const rated = cpu.memorySpeed[ram.modules];
  const profile = text.speedProfile(ram.speed);
  if (rated === undefined)
    return result(
      'ok',
      text.speedRated,
      `${text.speedUnrated(maker, cpu, ram.modules)} ${profile}`,
    );
  const detail = `${text.speedRating(maker, cpu)} ${profile}`;
  return ram.modules === 4 && rated < cpu.memorySpeed[2]
    ? result(
        'warn',
        text.speedSlower,
        `${detail} ${text.speedSlowerDetail(rated)}`,
      )
    : result('ok', text.speedWithin, detail);
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
    ? ` ${text.lengthRadiator(caseRoom.cardLength, cooler.radiator.thickness)}`
    : '';
  return gpu.length <= room
    ? result(
        'ok',
        text.lengthFits,
        `${text.lengthFitsDetail(gpu.length, room)}${radiator}`,
      )
    : result(
        'fail',
        text.lengthTooLong,
        `${text.lengthTooLongDetail(gpu.length, room)}${radiator}`,
      );
}

function supplyCheck(gpu: GraphicsOption, psu: PowerOption) {
  const result = checkOf('supply', [...gpu.sources, ...psu.sources]);
  const detail = text.supplyDetail(gpu, psu);
  if (psu.watts >= gpu.psu) return result('ok', text.supplyMeets, detail);
  return gpu.psuKind === 'minimum'
    ? result('fail', text.supplyBelowMinimum, detail)
    : result('warn', text.supplyBelowRecommendation, detail);
}

function connectorCheck(gpu: GraphicsOption, psu: PowerOption) {
  const result = checkOf('connector', [...gpu.sources, ...psu.sources]);
  if (gpu.connector === '8-pin')
    return psu.eightPin >= 1
      ? result('ok', text.cableMatches, text.eightPinDetail(psu))
      : result('fail', text.noLead, text.noEightPinDetail(psu));
  if (psu.sixteenPin)
    return result('ok', text.cableMatches, text.sixteenPinDetail(psu));
  if (!gpu.adapter)
    return result('warn', text.noSixteenPin, text.noSixteenPinDetail(psu));
  return psu.eightPin >= gpu.adapter.leads
    ? result('warn', text.needsAdapter, text.adapterDetail(psu, gpu.adapter))
    : result(
        'fail',
        text.adapterShort,
        text.adapterShortDetail(psu, gpu.adapter),
      );
}

/**
 * The M.2 drive takes its power through the slot it sits in; a SATA drive
 * needs a data cable to the board and a power lead from the supply.
 */
function storageCheck(
  drives: StorageOption,
  psu: PowerOption,
  board: BoardOption,
) {
  const m2 = text.m2;
  if (!drives.sata)
    return checkOf('storage', [...drives.sources, ...board.sources])(
      'ok',
      text.driveFits,
      `${m2} ${text.noCables}`,
    );
  const result = checkOf('storage', [
    ...drives.sources,
    ...board.sources,
    ...psu.sources,
  ]);
  return psu.sata >= 1
    ? result('ok', text.drivesConnected, `${m2} ${text.sataDetail(psu)}`)
    : result('fail', text.noSataLead, `${m2} ${text.noSataLeadDetail(psu)}`);
}

function budgetCheck(
  cpu: ProcessorOption,
  gpu: GraphicsOption,
  psu: PowerOption,
  board: BoardOption,
) {
  const result = checkOf('budget', [
    ...cpu.sources,
    ...gpu.sources,
    ...psu.sources,
  ]);
  const draw = cpu.watts + gpu.watts;
  // The figure is for the parts chosen, so it still answers whether this
  // supply would carry them when the processor cannot go into this board.
  const unseated = socketFits(cpu, board) ? '' : ` ${text.unseated(cpu)}`;
  const detail = `${text.budgetDetail(cpu, gpu, psu)}${unseated}`;
  return draw <= psu.watts
    ? result('ok', text.budgetWithin, detail)
    : result('fail', text.budgetOver, detail);
}

/** Rated draw: the processor's and the card's published power figures. */
export function ratedDraw(build: DesktopBuild) {
  return (
    processorOptions[build.processor].watts +
    graphicsOptions[build.graphics].watts
  );
}

/**
 * Every check, in the order a builder would meet them. The memory speed is
 * only asked of modules that fit the board.
 */
export function checkBuild(build: DesktopBuild): BuildCheck[] {
  const cpu = processorOptions[build.processor],
    cooler = coolerOptions[build.cooler],
    board = boardOptions[build.board],
    ram = memoryOptions[build.memory],
    gpu = graphicsOptions[build.graphics],
    drives = storageOptions[build.storage],
    psu = powerOptions[build.power];
  return [
    socketCheck(cpu, board),
    coolerCheck(cooler),
    boardCheck(board),
    memoryCheck(ram, board),
    ...(memoryFits(ram, board) ? [speedCheck(cpu, ram)] : []),
    lengthCheck(gpu, cooler),
    supplyCheck(gpu, psu),
    connectorCheck(gpu, psu),
    storageCheck(drives, psu, board),
    budgetCheck(cpu, gpu, psu, board),
  ];
}

/** The checks each slot's part takes part in. */
const slotChecks: Record<BuildSlot, CheckId[]> = {
  processor: ['socket', 'speed', 'budget'],
  cooler: ['cooler', 'length'],
  board: ['socket', 'board', 'memory', 'storage'],
  memory: ['memory', 'speed'],
  storage: ['storage'],
  graphics: ['length', 'supply', 'connector', 'budget'],
  power: ['supply', 'connector', 'storage', 'budget'],
};

/** The worst result among some checks. */
export function buildStatus(checks: BuildCheck[]): CheckStatus {
  return checks.some((c) => c.status === 'fail')
    ? 'fail'
    : checks.some((c) => c.status === 'warn')
      ? 'warn'
      : 'ok';
}

/**
 * What putting this part in the slot, with the rest of the build as it is,
 * does to the checks the part is involved in: the worst of them, and the
 * first one that is not clean, so the picker can say why. A problem elsewhere
 * in the build does not mark every option in every slot.
 */
export function optionFit<S extends BuildSlot>(
  build: DesktopBuild,
  slot: S,
  part: DesktopBuild[S],
) {
  const own = checkBuild({ ...build, [slot]: part }).filter((c) =>
    slotChecks[slot].includes(c.id),
  );
  const status = buildStatus(own);
  return {
    status,
    reason: own.find((c) => c.status === status && status !== 'ok')?.title,
  };
}

/** Whether a part fails a check it is involved in, with the rest as built. */
export const conflicts = <S extends BuildSlot>(
  build: DesktopBuild,
  slot: S,
  part: DesktopBuild[S],
) => optionFit(build, slot, part).status === 'fail';

/** The worst result among the checks one slot's part takes part in. */
export const slotStatus = (checks: BuildCheck[], slot: BuildSlot) =>
  buildStatus(checks.filter((c) => slotChecks[slot].includes(c.id)));

/** The slots whose parts a check compares, in slot order. */
export const checkSlots = (id: CheckId) =>
  (Object.keys(slotChecks) as BuildSlot[]).filter((slot) =>
    slotChecks[slot].includes(id),
  );
