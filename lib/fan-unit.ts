import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { buildFan, buildScrew, glowMaterial } from './parts.ts';

/**
 * Inside a 120 mm case fan.
 *
 * A fan is a brushless motor turned inside out: the magnet rides with the
 * impeller around a stator that never moves. The stack along +Y is the order
 * you meet the parts taking one apart — frame, impeller and its magnet, then
 * the stator, bearing and driver board underneath.
 */

/** Millimetres to scene units. 1 unit ≈ 9 mm, so a 120 mm fan fills the stage. */
const mm = (v: number) => v / 9;

const SIZE = mm(120);
const DEPTH = mm(25);

export function buildFanUnit(tools: ModelTools, _root: T.Group) {
  const { add, box, material, label } = tools;
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };

  // ── Frame ───────────────────────────────────────────────────────────────
  // The shared fan builder makes the whole unit; here the frame is taken on
  // its own, so the parts inside it can each be lifted out separately.
  const whole = buildFan(material, {
    size: SIZE,
    blades: 9,
    frameColor: '#2a3036',
    bladeColor: '#39424a',
  });
  const frame = new T.Group();
  // Keep only the frame shell and the motor struts from the shared build.
  // filter() first: re-parenting mutates whole.children as we go.
  const shellParts = whole.children.filter(
    (child) =>
      child instanceof T.Mesh &&
      !(child instanceof T.InstancedMesh) &&
      (child.geometry.type === 'ExtrudeGeometry' ||
        child.geometry.type === 'BoxGeometry'),
  );
  for (const part of shellParts) frame.add(part);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      place(frame, buildScrew(material, mm(3.4)), [
        (sx * SIZE * 0.835) / 2,
        DEPTH / 2,
        (sz * SIZE * 0.835) / 2,
      ]);
  // The lit diffuser ring is moulded into the frame, so it comes apart with it
  // and the dissected fan matches the ones installed in the machine.
  const diffuser = new T.Mesh(
    new T.TorusGeometry(SIZE * 0.408, SIZE * 0.03, 8, 40),
    glowMaterial('#2f6bff', 2.4),
  );
  diffuser.rotation.x = Math.PI / 2;
  place(frame, diffuser, [0, DEPTH * 0.44, 0]);
  const ringGlow = new T.PointLight('#2f6bff', 6, 9, 2);
  ringGlow.position.set(0, DEPTH * 0.9, 0);
  frame.add(ringGlow);
  label(frame, '120 × 120 × 25 MM', [0, DEPTH / 2 + mm(1), SIZE * 0.42], SIZE * 0.5, '#8b939a');
  add('fanframe', frame, [0, 0, 0], [0, -1.6, 0]);

  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const pad = box([SIZE * 0.15, DEPTH * 1.04, SIZE * 0.15], '#15181a', 0.02, 0.01);
      add(
        'fanpads',
        pad,
        [(sx * SIZE * 0.85) / 2, 0, (sz * SIZE * 0.85) / 2],
        [sx * 1.5, 0.5, sz * 1.5],
      );
    }

  // ── Impeller ────────────────────────────────────────────────────────────
  const impeller = new T.Group();
  const hubRadius = SIZE * 0.163;
  // Hub shell: open underneath, which is what lets it sit over the stator.
  const shell = new T.Mesh(
    new T.CylinderGeometry(hubRadius, hubRadius * 0.97, DEPTH * 0.8, 30, 1, true),
    material('#2f363d', 0.42, 0.42),
  );
  place(impeller, shell, [0, 0, 0]);
  const crown = new T.Mesh(
    new T.CylinderGeometry(hubRadius, hubRadius * 0.9, DEPTH * 0.08, 30),
    material('#39424a', 0.5, 0.36),
  );
  place(impeller, crown, [0, DEPTH * 0.4, 0]);
  label(impeller, 'IMPELLER', [0, DEPTH * 0.45, 0], hubRadius * 1.5, '#aab2b9');
  // Blades, taken from the shared builder so they match the fans elsewhere.
  for (const child of whole.children)
    if (child instanceof T.InstancedMesh) impeller.add(child.clone());
  add('fanimpeller', impeller, [0, mm(2), 0], [0, 3.2, 0]);

  const magnet = new T.Group();
  const ring = new T.Mesh(
    new T.CylinderGeometry(hubRadius * 0.93, hubRadius * 0.93, DEPTH * 0.5, 28, 1, true),
    material('#3c3a42', 0.55, 0.5),
  );
  place(magnet, ring, [0, 0, 0]);
  // Alternating poles, drawn as bands so the arrangement is visible.
  for (let i = 0; i < 8; i++) {
    const pole = new T.Mesh(
      new T.BoxGeometry(hubRadius * 0.5, DEPTH * 0.44, mm(1.2)),
      material(i % 2 ? '#7a5f8e' : '#5e7a8e', 0.5, 0.45),
    );
    pole.position.set(0, 0, 0);
    pole.rotation.y = (i / 8) * Math.PI * 2;
    pole.translateZ(hubRadius * 0.88);
    magnet.add(pole);
  }
  add('fanmagnet', magnet, [0, mm(2), 0], [0, 2.0, 0], 0.16);

  // ── Motor ───────────────────────────────────────────────────────────────
  const stator = new T.Group();
  // Laminated core: a stack of thin plates, which is why it is striped.
  for (let i = 0; i < 9; i++)
    place(stator, box([mm(1.1), mm(0.9), mm(1.1)], '#9aa2a8', 0.9), [0, 0, 0]);
  for (let arm = 0; arm < 4; arm++) {
    const pole = new T.Group();
    for (let i = 0; i < 9; i++) {
      const plate = new T.Mesh(
        new T.BoxGeometry(mm(19), mm(0.8), mm(10)),
        material('#8e979e', 0.92, 0.3),
      );
      plate.position.set(mm(10), mm(-4.4 + i * 1.1), 0);
      pole.add(plate);
    }
    // Copper wound around the arm, a dozen visible turns.
    for (let k = 0; k < 12; k++) {
      const turn = new T.Mesh(
        new T.TorusGeometry(mm(6.6), mm(1.05), 5, 12),
        material('#b8834e', 0.92, 0.3),
      );
      turn.rotation.y = Math.PI / 2;
      turn.position.set(mm(4 + k * 0.95), 0, 0);
      pole.add(turn);
    }
    pole.rotation.y = (arm / 4) * Math.PI * 2;
    stator.add(pole);
  }
  const post = new T.Mesh(
    new T.CylinderGeometry(mm(4.2), mm(4.6), DEPTH * 0.74, 20),
    material('#4b5359', 0.7, 0.4),
  );
  place(stator, post, [0, -mm(1), 0]);
  label(stator, 'STATOR', [0, mm(8), 0], mm(28), '#c0a071');
  add('fanstator', stator, [0, 0, 0], [0, 1.7, 0], 0.22);

  const bearing = new T.Group();
  const shaft = new T.Mesh(
    new T.CylinderGeometry(mm(1.6), mm(1.6), DEPTH * 0.92, 16),
    material('#c3cbd0', 0.95, 0.18),
  );
  place(bearing, shaft, [0, mm(2), 0]);
  const sleeve = new T.Mesh(
    new T.CylinderGeometry(mm(3), mm(3), DEPTH * 0.5, 18, 1, true),
    material('#8a9298', 0.88, 0.3),
  );
  place(bearing, sleeve, [0, 0, 0]);
  const clip = new T.Mesh(
    new T.TorusGeometry(mm(2.4), mm(0.5), 5, 16, Math.PI * 1.5),
    material('#b6bec3', 0.92, 0.26),
  );
  clip.rotation.x = Math.PI / 2;
  place(bearing, clip, [0, -DEPTH * 0.3, 0]);
  add('fanbearing', bearing, [0, 0, 0], [0, 0.6, 0], 0.5);

  const driver = new T.Group();
  const ringBoard = new T.Mesh(
    new T.RingGeometry(mm(5), mm(15), 26),
    material('#2c3a24', 0.08, 0.7),
  );
  ringBoard.rotation.x = -Math.PI / 2;
  place(driver, ringBoard, [0, 0, 0]);
  place(driver, box([mm(6), mm(1.6), mm(5)], '#17191b', 0.12), [mm(9), mm(1), 0]);
  place(driver, box([mm(3.4), mm(1.4), mm(3)], '#17191b', 0.12), [0, mm(1), mm(10)]);
  for (let i = 0; i < 4; i++)
    place(driver, box([mm(1.6), mm(1), mm(1.6)], '#c2a457', 0.9), [
      mm(-5 + i * 3.4),
      mm(1),
      -mm(11),
    ]);
  label(driver, 'DRIVER', [0, mm(2), -mm(6)], mm(22), '#8fae9c');
  add('fanboard', driver, [0, -DEPTH * 0.34, 0], [0, -1.2, 0], 0.46);

  const lead = new T.Group();
  const path = new T.CatmullRomCurve3([
    new T.Vector3(mm(14), 0, mm(6)),
    new T.Vector3(SIZE * 0.4, -mm(2), SIZE * 0.36),
    new T.Vector3(SIZE * 0.56, -mm(5), SIZE * 0.52),
    new T.Vector3(SIZE * 0.74, -mm(6), SIZE * 0.48),
  ]);
  place(
    lead,
    new T.Mesh(
      new T.TubeGeometry(path, 18, mm(1.9), 7, false),
      material('#14181a', 0.1, 0.82),
    ),
    [0, 0, 0],
  );
  place(lead, box([mm(9), mm(5), mm(4)], '#1d2124', 0.1), [SIZE * 0.76, -mm(6), SIZE * 0.47]);
  for (let i = 0; i < 4; i++)
    place(lead, box([mm(1.1), mm(3), mm(1.1)], '#c2a457', 0.92), [
      SIZE * 0.76,
      -mm(6),
      SIZE * 0.47 - mm(1.5) + i * mm(1),
    ]);
  label(lead, '4-PIN PWM', [SIZE * 0.66, mm(2), SIZE * 0.6], mm(30), '#8b939a');
  add('fanlead', lead, [0, -DEPTH * 0.3, 0], [1.6, -0.8, 1.2]);
}
