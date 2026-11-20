import type { ContentPack } from '../content.ts';
import { messages } from './messages.ts';
import { buildMessages } from './build-messages.ts';
import { arc } from './catalogue/arc.ts';
import { boards } from './catalogue/boards.ts';
import { compactCards } from './catalogue/compact-cards.ts';
import { cooler } from './catalogue/cooler.ts';
import { fan } from './catalogue/fan.ts';
import { gpu } from './catalogue/gpu.ts';
import { levels } from './catalogue/levels.ts';
import { liquid } from './catalogue/liquid.ts';
import { motherboard } from './catalogue/motherboard.ts';
import { notebooks } from './catalogue/notebooks.ts';
import { nvme } from './catalogue/nvme.ts';
import { pc } from './catalogue/pc.ts';
import { processors } from './catalogue/processors.ts';
import { psu } from './catalogue/psu.ts';
import { radeon } from './catalogue/radeon.ts';
import { ram } from './catalogue/ram.ts';
import { ssd } from './catalogue/ssd.ts';

/**
 * The French pack: the interface, then the catalogue sentence by sentence.
 *
 * The catalogue files follow `lib/concepts/`, one per subsystem, plus
 * `levels.ts` for the scale tree. A sentence shared by several subsystems is
 * translated once, in the first file that uses it.
 */
const fr: ContentPack = {
  messages,
  build: buildMessages,
  text: {
    ...levels,
    ...notebooks,
    ...pc,
    ...motherboard,
    ...boards,
    ...ram,
    ...psu,
    ...fan,
    ...cooler,
    ...liquid,
    ...processors,
    ...ssd,
    ...nvme,
    ...gpu,
    ...radeon,
    ...arc,
    ...compactCards,
  },
};

export default fr;
