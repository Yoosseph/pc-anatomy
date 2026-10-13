/**
 * Names on the laid-out parts.
 *
 * At 100% every part of a scale is spread out on the tray, sized and spaced
 * so each can be seen, and none of them said what it was until you hovered
 * it. On a phone you could not hover at all. So once the hardware is laid
 * out, each part carries its name, and tapping the name describes the part.
 *
 * The scene measures where each part sits on screen; this decides which of
 * those names fit. Bigger parts are named first, since they are what the eye
 * lands on, and a name that would overlap one already placed, or run off the
 * stage, is left for the hover label instead of piling up. One name per part:
 * eight identical memory chips get one label, on the first of them, not eight.
 */

export type LabelCandidate = {
  concept: string;
  instance: number;
  name: string;
  /** Centre of the part on screen, in CSS pixels from the stage's top left. */
  x: number;
  y: number;
  /** How large the part looks on screen, used only to rank candidates. */
  size: number;
};

export type PartLabel = LabelCandidate & {
  /** Where the label's box sits, top left, in the same pixels. */
  left: number;
  top: number;
};

const CHAR_WIDTH = 6.6,
  PADDING_X = 18,
  HEIGHT = 22,
  GAP = 4,
  EDGE = 6;

export function labelWidth(name: string) {
  return Math.ceil(name.length * CHAR_WIDTH + PADDING_X);
}

export function placeLabels(
  candidates: readonly LabelCandidate[],
  width: number,
  height: number,
  limit = 40,
): PartLabel[] {
  const seen = new Set<string>();
  const placed: PartLabel[] = [];
  const boxes: [number, number, number, number][] = [];
  const ranked = [...candidates].sort(
    (a, b) => b.size - a.size || a.instance - b.instance,
  );
  for (const c of ranked) {
    if (placed.length >= limit) break;
    if (seen.has(c.concept)) continue;
    const w = labelWidth(c.name);
    const left = Math.round(c.x - w / 2),
      top = Math.round(c.y - HEIGHT / 2);
    if (
      left < EDGE ||
      top < EDGE ||
      left + w > width - EDGE ||
      top + HEIGHT > height - EDGE
    )
      continue;
    const box: [number, number, number, number] = [
      left - GAP,
      top - GAP,
      left + w + GAP,
      top + HEIGHT + GAP,
    ];
    if (
      boxes.some(
        (b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1],
      )
    )
      continue;
    seen.add(c.concept);
    boxes.push(box);
    placed.push({ ...c, left, top });
  }
  return placed;
}

/** A cheap fingerprint, so the interface only re-renders when labels move. */
export function labelSignature(labels: readonly PartLabel[]) {
  return labels
    .map((l) => `${l.concept}:${l.instance}:${l.left}:${l.top}`)
    .join('|');
}
