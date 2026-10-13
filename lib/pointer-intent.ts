import type { Selection } from './explorer-state.ts';

/**
 * What a click or tap on a part asks for.
 *
 * A mouse has two buttons, so the left one opens and the right one inspects.
 * A finger has one, and a long press does not reliably reach `contextmenu`
 * (iOS Safari does not fire it on a canvas), which left the detail card out of
 * reach on a phone: every tap on something that opens went straight inside
 * it. So a tap inspects first, showing the card, and the card's "Take apart"
 * button opens it. Where the card leaves the part in reach (a tablet's side
 * panel rather than a phone's sheet), tapping the selected part again opens
 * it too. Pens follow touch: they have no dependable second button either.
 */
export function tapIntent(
  pointerType: string,
  picked: { concept: string; instance: number } | null,
  selection: Selection | null,
): 'open' | 'inspect' {
  if (pointerType === 'mouse') return 'open';
  return picked &&
    selection?.concept === picked.concept &&
    (selection.instance ?? 0) === picked.instance
    ? 'open'
    : 'inspect';
}
