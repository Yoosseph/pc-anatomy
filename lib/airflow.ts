import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { smoothstep, type Vec3 } from './layout.ts';

/**
 * Where the air goes.
 *
 * Every fan in this project is drawn in detail and none of them said anything
 * about the one thing a fan is for. A viewer could count the blades on the
 * front intakes and still not know that those three and the one at the back
 * are a single path through the machine, or that the tower cooler stands in
 * that path on purpose, or why the shroud under the graphics card is cut.
 *
 * So: chevrons, marching along authored paths. Three decisions behind that.
 *
 * **The paths are authored, not derived.** It would be tidier to read each
 * fan's transform and blow air along its axis, and it would have been wrong:
 * `buildFan` disagrees with itself about which face is the intake (the lit
 * ring and the finger guard sit on +Y, documented as the intake face, while
 * the builder's own header claims it blows along +Y), and several callers
 * mount their fans from the header rather than from the ring. Air that
 * follows the geometry would therefore leave the case through the front
 * panel. Each builder states the path its build actually moves air along,
 * which is a claim about the hardware rather than about a transform.
 *
 * **It is scenery, not a part.** Airflow carries `contextFrame`, so it is
 * never selected, never named, never laid out in the inventory and never
 * pointed at: the chevrons opt out of raycasting entirely, or the front of
 * the machine would answer the cursor with an arrow instead of a fan.
 *
 * **It belongs to the assembled machine.** Air moves through a machine that
 * is closed. The moment the slider leaves zero the claim stops being true, so
 * the chevrons are gone within the first tenth of the disassembly rather than
 * hanging over a tray of separated parts. `airflowStrength` is that curve.
 *
 * Colour carries the one fact a direction cannot: air leaves hotter than it
 * arrives. Cool blue entering, warm amber leaving, and the ramp between them
 * spread along whatever the stream crosses.
 */

/** Air on its way in, on its way out, or crossing something hot. */
export type FlowKind = 'intake' | 'through' | 'exhaust';

export interface FlowStream {
  /** Control points of the path, in the builder's own frame and units. */
  path: Vec3[];
  kind: FlowKind;
  /** Chevron length. Defaults to a fifteenth of the path. */
  size?: number;
  /** How many chevrons are on the path at once. Defaults to one per gap. */
  count?: number;
  /** Paths travelled per second. */
  speed?: number;
}

/** Cool air, and the same air once something has heated it. */
const COOL = new T.Color('#5ab4ff');
const WARM = new T.Color('#ff8a45');

/** Where along the cool-to-warm ramp a stream starts and finishes. */
const HEAT: Record<FlowKind, readonly [number, number]> = {
  intake: [0, 0.14],
  through: [0.08, 0.95],
  exhaust: [0.72, 1],
};

/** Points sampled along each path, evenly by arc length. */
const SAMPLES = 96;
const FORWARD = new T.Vector3(0, 0, 1);

/**
 * How strongly airflow shows at a given disassembly fraction.
 *
 * Deliberately abrupt. A slow fade reads as an effect being dismissed; this
 * reads as a claim that stops holding the moment the case is open, which is
 * what it is. Fully out by a tenth, which is before the first part has visibly
 * moved.
 */
export function airflowStrength(explodeFraction: number) {
  return 1 - smoothstep(0.005, 0.085, explodeFraction);
}

export {
  airflowLevels,
  airflowShown,
  hasAirflow,
  type AirflowMode,
} from './airflow-policy.ts';

/**
 * One chevron, pointing along +Z, a unit long and centred on its own length.
 *
 * Four bars, not two: a chevron is a flat V, and this machine is something you
 * orbit, so half the time you would be looking along that V's plane and it
 * would read as a dash with no direction in it. A second V crossed at a right
 * angle costs twenty-four more triangles and means there is always one facing
 * you. Built once per model and scaled per instance.
 */
function chevronGeometry() {
  const WIDTH = 0.66,
    LENGTH = 1,
    BAR = 0.12;
  const reach = Math.hypot(WIDTH / 2, LENGTH);
  const arms: T.BufferGeometry[] = [];
  for (const roll of [0, Math.PI / 2])
    for (const side of [-1, 1]) {
      const arm = new T.BoxGeometry(BAR, BAR, reach);
      // Swing each bar back from a tip at the origin, so a pair spans WIDTH.
      arm.translate(0, 0, -reach / 2);
      arm.rotateY(side * Math.atan2(WIDTH / 2, LENGTH));
      arm.rotateZ(roll);
      arms.push(arm);
    }
  const chevron = mergeGeometries(arms)!;
  arms.forEach((arm) => arm.dispose());
  chevron.translate(0, 0, LENGTH / 2);
  return chevron;
}

/** A path, sampled, with the instances travelling along it. */
interface Track {
  mesh: T.InstancedMesh;
  points: T.Vector3[];
  tangents: T.Vector3[];
  count: number;
  size: number;
  speed: number;
  heat: readonly [number, number];
}

/**
 * The marching chevrons for a set of streams, as one group of scenery.
 *
 * The returned group carries `airflowTick(seconds, strength)`. The scene calls
 * it every frame with the clock and how strongly airflow should show; nothing
 * about curves, colour or phase reaches `scene.ts`, which is also what keeps
 * this testable — `scene.ts` cannot be imported without a WebGL context.
 */
export function buildAirflow(streams: FlowStream[]) {
  const group = new T.Group();
  group.userData.contextFrame = true;
  group.visible = false;
  if (!streams.length) return group;

  const geometry = chevronGeometry();
  const material = new T.MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    // Additive, so the chevrons read as light passing over the hardware rather
    // than as painted plastic lying on it, and so scaling an instance's colour
    // toward black is all a per-chevron fade needs.
    blending: T.AdditiveBlending,
    toneMapped: false,
  });

  const tracks: Track[] = [];
  for (const stream of streams) {
    const curve = new T.CatmullRomCurve3(
      stream.path.map((p) => new T.Vector3(...p)),
    );
    const length = curve.getLength();
    const size = stream.size ?? length / 15;
    const count = stream.count ?? Math.max(3, Math.round(length / (size * 2)));
    // Sample once. Evaluating a spline per chevron per frame is the kind of
    // cost that only shows up on the machine that can least afford it.
    const points = curve.getSpacedPoints(SAMPLES);
    const tangents = points.map((_, i) =>
      curve.getTangentAt(i / SAMPLES).normalize(),
    );
    const mesh = new T.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.frustumCulled = false;
    // Annotation is never pointed at. Without this the arrows would answer the
    // cursor in front of the hardware they are describing.
    mesh.raycast = () => {};
    mesh.setColorAt(0, COOL);
    group.add(mesh);
    tracks.push({
      mesh,
      points,
      tangents,
      count,
      size,
      speed: stream.speed ?? 0.12,
      heat: HEAT[stream.kind],
    });
  }

  const position = new T.Vector3(),
    tangent = new T.Vector3(),
    scale = new T.Vector3(),
    quaternion = new T.Quaternion(),
    matrix = new T.Matrix4(),
    color = new T.Color();

  group.userData.airflowTick = (seconds: number, strength: number) => {
    group.visible = strength > 0.002;
    if (!group.visible) return;
    for (const track of tracks) {
      for (let i = 0; i < track.count; i++) {
        // Evenly spaced along the path, all drifting together.
        const u = (i / track.count + seconds * track.speed) % 1;
        const at = u * SAMPLES;
        const index = Math.min(SAMPLES - 1, Math.floor(at)),
          fraction = at - index;
        position.lerpVectors(
          track.points[index],
          track.points[index + 1],
          fraction,
        );
        tangent
          .lerpVectors(
            track.tangents[index],
            track.tangents[index + 1],
            fraction,
          )
          .normalize();
        quaternion.setFromUnitVectors(FORWARD, tangent);
        matrix.compose(position, quaternion, scale.setScalar(track.size));
        track.mesh.setMatrixAt(i, matrix);
        // Fading in at the start and out at the end is what stops a stream
        // looking like a solid rail with a beginning and an end.
        const edge = smoothstep(0, 0.13, u) * (1 - smoothstep(0.84, 1, u));
        color
          .copy(COOL)
          .lerp(WARM, track.heat[0] + (track.heat[1] - track.heat[0]) * u)
          // Held well below full: where the two Vs cross, additive light sums,
          // and at full strength every chevron clipped to a white dash with a
          // coloured fringe, which threw away the one thing colour is carrying.
          .multiplyScalar(edge * strength * 0.58);
        track.mesh.setColorAt(i, color);
      }
      track.mesh.instanceMatrix.needsUpdate = true;
      if (track.mesh.instanceColor) track.mesh.instanceColor.needsUpdate = true;
    }
  };
  return group;
}

/** A graphics card's cooler, in the units its builder works in. */
export interface CardAirflow {
  /** Fan centres along the card. */
  fans: readonly number[];
  radius: number;
  /** Across the slot, edge to edge. */
  width: number;
  /** The fan face, the fin bank's top and bottom, and the backplate. */
  fan: number;
  finsTop: number;
  finsBottom: number;
  backplate: number;
  /**
   * Where the board ends. A fan past it has nothing underneath but fins, so
   * its air goes straight out of the other side of the card; a fan over the
   * board has to turn and leave along the card's free long edge. That
   * difference is the whole point of a flow-through cooler, and all three
   * cards here have one.
   */
  pcbEnd: number;
  /** Multiplies every coordinate, for builders that author in millimetres. */
  scale?: number;
}

/**
 * The streams for a card whose fans blow down into its fin banks.
 *
 * Shared because all three cards are the same machine: fans on the top face,
 * fins beneath them, a board under part of it and open air under the rest.
 * Installed in the tower this whole picture turns over with the card, and the
 * air then rises out of it, which is exactly what a card hanging
 * cooler-downward does.
 */
export function cardAirflow(card: CardAirflow): FlowStream[] {
  const s = card.scale ?? 1;
  const at = (x: number, y: number, z: number): Vec3 => [x * s, y * s, z * s];
  const { radius: r, width: w } = card;
  const middle = (card.finsTop + card.finsBottom) / 2;
  // Sized off the fan rather than off the path. Left to the default, a card's
  // short paths come out as a dozen specks, and in the tower — where the card
  // is one part among forty — a dozen specks is confetti.
  const size = r * 0.44;
  const streams: FlowStream[] = [];
  for (const x of card.fans) {
    if (x > card.pcbEnd) {
      // Straight through: in at the top, out past the bottom edge.
      streams.push({
        kind: 'through',
        size: size * s,
        path: [
          at(x, card.fan + r * 1.05, 0),
          at(x, card.finsTop, 0),
          at(x, card.finsBottom, 0),
          at(x, card.backplate - r * 1.3, 0),
        ],
      });
      continue;
    }
    // Over the board: down into the fins, then out of the free long edge.
    //
    // Only that one. The card's other long edge is the edge with the contacts
    // on it, so in a machine it is plugged into the slot and pressed against
    // the motherboard — a stream leaving that way passes straight through the
    // board, which is what the first version of this drew.
    streams.push({
      kind: 'through',
      size: size * s,
      path: [
        at(x, card.fan + r * 1.05, -r * 0.3),
        at(x, card.finsTop, -r * 0.42),
        at(x, middle, -w * 0.34),
        // Out past the card's own edge, not to it. A stream that stops inside
        // the fin bank is a stream nobody can see: the fins are in the way.
        at(x, card.finsBottom + (middle - card.finsBottom) * 0.4, -w * 0.74),
      ],
    });
  }
  return streams;
}
