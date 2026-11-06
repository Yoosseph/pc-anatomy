import { cardClearance, ratedDraw } from './build-checks.ts';
import {
  boardOptions,
  coolerOptions,
  graphicsOptions,
  memoryOptions,
  powerOptions,
  processorOptions,
  storageOptions,
  type BuildSlot,
  type DesktopBuild,
} from './desktop-build.ts';

/**
 * What the parts picker shows on each option, beyond its name: the few facts
 * the checks compare, coloured by whether they agree with the rest of the
 * build, and for the card and the supply a meter against what they have to
 * fit. A socket that matches the board is green before anyone opens the
 * report; a DDR4 kit against DDR5 slots is red.
 *
 * Pure, like the checks: the picker asks on every render.
 */

/** `match` agrees with the rest of the build, `clash` does not. */
export type Tone = 'match' | 'clash';
export interface Fact {
  text: string;
  tone?: Tone;
}
export interface Meter {
  /** How much of the room the part takes, 0 to 1 and beyond. */
  share: number;
  label: string;
  tone: 'ok' | 'warn' | 'fail';
}

const agree = (same: boolean): Tone => (same ? 'match' : 'clash');

/** The chips and the meter for one option, with the rest of the build as is. */
export function partFacts<S extends BuildSlot>(
  build: DesktopBuild,
  slot: S,
  id: DesktopBuild[S],
): { facts: Fact[]; meter?: Meter } {
  const with_ = { ...build, [slot]: id } as DesktopBuild;
  const board = boardOptions[with_.board];
  switch (slot) {
    case 'processor': {
      const cpu = processorOptions[with_.processor];
      return {
        facts: [
          { text: cpu.socket, tone: agree(cpu.socket === board.socket) },
          { text: `${cpu.watts} W` },
        ],
      };
    }
    case 'cooler': {
      const cooler = coolerOptions[with_.cooler];
      return {
        facts: cooler.radiator
          ? [
              { text: `${cooler.radiator.length} mm radiator` },
              { text: `Card room ${cardClearance(cooler)} mm` },
            ]
          : [{ text: `${cooler.height} mm tall` }],
      };
    }
    case 'board': {
      const cpu = processorOptions[with_.processor],
        ram = memoryOptions[with_.memory];
      return {
        facts: [
          { text: board.socket, tone: agree(board.socket === cpu.socket) },
          { text: board.formFactor },
          { text: board.memory, tone: agree(board.memory === ram.generation) },
        ],
      };
    }
    case 'memory': {
      const ram = memoryOptions[with_.memory];
      return {
        facts: [
          {
            text: ram.generation,
            tone: agree(ram.generation === board.memory),
          },
          { text: `${ram.modules * 16} GB` },
          { text: `${ram.speed} MT/s` },
        ],
      };
    }
    case 'storage': {
      const drives = storageOptions[with_.storage];
      return {
        facts: drives.sata
          ? [{ text: 'M.2 NVMe' }, { text: '2.5-inch SATA' }]
          : [{ text: 'M.2 NVMe' }],
      };
    }
    case 'graphics': {
      const gpu = graphicsOptions[with_.graphics],
        psu = powerOptions[with_.power];
      const room = cardClearance(coolerOptions[with_.cooler]);
      const lead =
        gpu.connector === '8-pin' ? psu.eightPin >= 1 : psu.sixteenPin;
      return {
        facts: [
          { text: gpu.connector, tone: agree(lead) },
          { text: `${gpu.watts} W` },
        ],
        meter: {
          share: gpu.length / room,
          label: `${Math.round(gpu.length)} of ${room} mm`,
          tone: gpu.length <= room ? 'ok' : 'fail',
        },
      };
    }
    case 'power': {
      const psu = powerOptions[with_.power],
        gpu = graphicsOptions[with_.graphics];
      const draw = ratedDraw(with_);
      const lead =
        gpu.connector === '8-pin' ? psu.eightPin >= 1 : psu.sixteenPin;
      return {
        facts: [
          { text: psu.modular ? 'Modular' : 'Fixed cables' },
          {
            text: psu.sixteenPin ? '12V-2x6 lead' : `${psu.eightPin} × 8-pin`,
            tone: agree(lead),
          },
        ],
        meter: {
          share: draw / psu.watts,
          label: `${draw} of ${psu.watts} W rated`,
          tone:
            draw > psu.watts ||
            (psu.watts < gpu.psu && gpu.psuKind === 'minimum')
              ? 'fail'
              : psu.watts < gpu.psu
                ? 'warn'
                : 'ok',
        },
      };
    }
  }
  return { facts: [] };
}
