import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { buildCapacitor, buildChip, buildScrew } from './parts.ts';

/**
 * Inside a 3.5-inch hard disk.
 *
 * The drive lies flat: X across its width, Z along its length, Y up through
 * the platter stack. The spindle sits toward one end and the actuator pivot in
 * the far corner, which is the arrangement that lets one short arm reach every
 * track on every surface.
 */

/** Millimetres to scene units. 1 unit ≈ 8 mm, so the drive fills the stage. */
const mm = (v: number) => v / 8;

const W = mm(101.6); // across
const L = mm(147); // along
const H = mm(26.1); // tall

const SPINDLE: Vec3 = [0, 0, -mm(14)];
const PIVOT: Vec3 = [mm(34), 0, mm(46)];

export function buildDisk(tools: ModelTools, _root: T.Group) {
  const { add, instances, box, pcb, material, label } = tools;
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };

  // ── Base casting ────────────────────────────────────────────────────────
  const base = new T.Group();
  place(base, box([W, mm(4), L], '#6e767c', 0.86, 0.01), [0, -H / 2 + mm(2), 0]);
  for (const sx of [-1, 1])
    place(base, box([mm(4), H - mm(6), L], '#767e84', 0.86), [
      (sx * (W - mm(4))) / 2,
      0,
      0,
    ]);
  for (const sz of [-1, 1])
    place(base, box([W, H - mm(6), mm(4)], '#767e84', 0.86), [
      0,
      0,
      (sz * (L - mm(4))) / 2,
    ]);
  // Side mounting holes, which is how a drive bolts into a cage.
  for (const sx of [-1, 1])
    for (const sz of [-1, 0, 1])
      place(base, buildScrew(material, mm(2.6)), [
        (sx * (W + mm(1))) / 2,
        -mm(2),
        sz * mm(42),
      ]);
  label(base, '3.5-INCH DRIVE', [0, -H / 2 + mm(4.2), mm(58)], mm(58), '#525a60');
  add('diskbase', base, [0, 0, 0], [0, -1.4, 0]);

  // ── Cover ───────────────────────────────────────────────────────────────
  const cover = new T.Group();
  place(cover, box([W, mm(2.6), L], '#9aa2a8', 0.92, 0.006), [0, 0, 0]);
  place(cover, box([W - mm(10), mm(1), L - mm(10)], '#8b939a', 0.9), [0, mm(1.6), 0]);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      place(cover, buildScrew(material, mm(2.6)), [
        (sx * (W - mm(12))) / 2,
        mm(2),
        (sz * (L - mm(12))) / 2,
      ]);
  place(cover, buildScrew(material, mm(2.6)), [0, mm(2), 0]);
  // The filtered breather, the one hole a sealed-looking drive really has.
  const breather = new T.Mesh(
    new T.CylinderGeometry(mm(2.2), mm(2.2), mm(3), 14),
    material('#1d2124', 0.4, 0.6),
  );
  place(cover, breather, [mm(36), mm(1.4), -mm(58)]);
  label(cover, 'DO NOT COVER THIS HOLE', [mm(18), mm(2.2), -mm(58)], mm(48), '#5d656b');
  add('diskcover', cover, [0, H / 2 - mm(1.3), 0], [0, 2.6, 0]);

  // ── Platters and spindle ────────────────────────────────────────────────
  const platters = new T.Group();
  for (let i = 0; i < 3; i++) {
    const disc = new T.Mesh(
      new T.CylinderGeometry(mm(47.5), mm(47.5), mm(1.27), 54),
      new T.MeshStandardMaterial({
        color: '#c9ced3',
        metalness: 1,
        roughness: 0.055,
        envMapIntensity: 2.4,
      }),
    );
    place(platters, disc, [0, mm(-7 + i * 7), 0]);
    // Spacer ring between platters.
    if (i < 2) {
      const spacer = new T.Mesh(
        new T.CylinderGeometry(mm(12), mm(12), mm(5.7), 22, 1, true),
        material('#8d959b', 0.9, 0.3),
      );
      place(platters, spacer, [0, mm(-3.5 + i * 7), 0]);
    }
  }
  platters.position.set(...SPINDLE);
  add('diskplatter', platters, [0, 0, 0], [0, 2.0, 0], 0.2);

  const spindle = new T.Group();
  const hub = new T.Mesh(
    new T.CylinderGeometry(mm(11), mm(13), mm(20), 26),
    material('#a8b0b6', 0.92, 0.24),
  );
  place(spindle, hub, [0, -mm(2), 0]);
  const clamp = new T.Mesh(
    new T.CylinderGeometry(mm(14), mm(14), mm(2.4), 26),
    material('#c3cbd0', 0.94, 0.2),
  );
  place(spindle, clamp, [0, mm(9), 0]);
  for (let i = 0; i < 6; i++) {
    const s = buildScrew(material, mm(1.6));
    const a = (i / 6) * Math.PI * 2;
    place(spindle, s, [Math.cos(a) * mm(9), mm(10.4), Math.sin(a) * mm(9)]);
  }
  spindle.position.set(...SPINDLE);
  add('diskspindle', spindle, [0, 0, 0], [0, 1.2, 0], 0.24);

  // ── Actuator ────────────────────────────────────────────────────────────
  const actuator = new T.Group();
  const pivot = new T.Mesh(
    new T.CylinderGeometry(mm(6), mm(6), mm(22), 20),
    material('#8d959b', 0.9, 0.28),
  );
  place(actuator, pivot, [0, 0, 0]);
  // Six arms, one per platter surface, swung toward the spindle.
  for (let i = 0; i < 6; i++) {
    const y = mm(-10.5 + i * 3.6);
    const arm = new T.Mesh(
      new T.BoxGeometry(mm(46), mm(1.1), mm(7)),
      material('#b0b8bd', 0.9, 0.3),
    );
    arm.position.set(-mm(26), y, -mm(18));
    arm.rotation.y = 0.62;
    actuator.add(arm);
    // Suspension and the slider that carries the head.
    const suspension = new T.Mesh(
      new T.BoxGeometry(mm(16), mm(0.4), mm(3.4)),
      material('#d0d7db', 0.94, 0.2),
    );
    suspension.position.set(-mm(48), y, -mm(33));
    suspension.rotation.y = 0.62;
    actuator.add(suspension);
    const slider = new T.Mesh(
      new T.BoxGeometry(mm(2.4), mm(0.9), mm(2)),
      material('#2b3136', 0.5, 0.4),
    );
    slider.position.set(-mm(54), y, -mm(37));
    actuator.add(slider);
  }
  // The flexible printed circuit that follows the arm.
  const flex = new T.CatmullRomCurve3([
    new T.Vector3(mm(6), 0, mm(6)),
    new T.Vector3(mm(20), 0, mm(16)),
    new T.Vector3(mm(34), 0, mm(8)),
  ]);
  place(
    actuator,
    new T.Mesh(
      new T.TubeGeometry(flex, 14, mm(1.6), 6, false),
      material('#8a6a32', 0.4, 0.5),
    ),
    [0, 0, 0],
  );
  actuator.position.set(...PIVOT);
  label(actuator, 'ACTUATOR', [-mm(30), mm(14), -mm(20)], mm(44), '#8b939a');
  add('diskactuator', actuator, [0, 0, 0], [-0.6, 1.6, -0.4], 0.3);

  // ── Voice coil ──────────────────────────────────────────────────────────
  const voice = new T.Group();
  for (const sy of [-1, 1]) {
    const magnet = new T.Mesh(
      new T.CylinderGeometry(mm(26), mm(26), mm(3.4), 26, 1, false, 0, Math.PI * 0.85),
      material('#3a3d46', 0.65, 0.38),
    );
    magnet.rotation.y = 2.0;
    place(voice, magnet, [0, sy * mm(8), 0]);
    const yoke = new T.Mesh(
      new T.CylinderGeometry(mm(28), mm(28), mm(2), 26, 1, false, 0, Math.PI * 0.85),
      material('#7b838a', 0.9, 0.3),
    );
    yoke.rotation.y = 2.0;
    place(voice, yoke, [0, sy * mm(11), 0]);
  }
  // The coil itself, a flat wound loop on the tail of the arm stack.
  const coil = new T.Mesh(
    new T.TorusGeometry(mm(13), mm(3.2), 8, 24, Math.PI * 1.2),
    material('#b8834e', 0.92, 0.3),
  );
  coil.rotation.x = Math.PI / 2;
  coil.rotation.z = 2.2;
  place(voice, coil, [0, 0, 0]);
  voice.position.set(PIVOT[0] + mm(12), 0, PIVOT[2] + mm(6));
  add('diskvoicecoil', voice, [0, 0, 0], [1.0, 1.0, 0.8], 0.34);

  // ── Ramp and filter ─────────────────────────────────────────────────────
  const ramp = new T.Group();
  place(ramp, box([mm(10), mm(21), mm(26)], '#22262a', 0.2, 0.004), [0, 0, 0]);
  for (let i = 0; i < 6; i++)
    place(ramp, box([mm(13), mm(0.8), mm(5)], '#333a3f', 0.3), [
      -mm(3),
      mm(-9 + i * 3.6),
      -mm(9),
    ]);
  add('diskramp', ramp, [-mm(41), 0, mm(20)], [-1.4, 0.8, 0.5], 0.4);

  const filter = new T.Group();
  place(filter, box([mm(16), mm(14), mm(5)], '#4c5348', 0.1, 0.004), [0, 0, 0]);
  place(filter, box([mm(17), mm(15), mm(1.2)], '#2b3028', 0.1), [0, 0, mm(3)]);
  add('diskfilter', filter, [-mm(34), 0, -mm(56)], [-1.2, 0.6, -1.0], 0.44);

  // ── Controller board ────────────────────────────────────────────────────
  const boardY = -H / 2 - mm(2.6);
  const board = new T.Group();
  place(board, pcb([W - mm(12), mm(1.6), L - mm(24)], 'storage'), [0, 0, 0]);
  place(board, buildChip(material, [mm(18), mm(2.4), mm(18)], 9, true, '#17191b'), [
    -mm(14),
    -mm(2),
    mm(10),
  ]);
  place(board, buildChip(material, [mm(12), mm(2), mm(10)], 6, true, '#17191b'), [
    mm(18),
    -mm(1.8),
    mm(4),
  ]);
  place(board, buildChip(material, [mm(11), mm(2), mm(9)], 5, true, '#17191b'), [
    mm(16),
    -mm(1.8),
    -mm(24),
  ]);
  for (let i = 0; i < 3; i++) {
    const cap = buildCapacitor(material, mm(3), mm(7), '#23282c');
    cap.rotation.x = Math.PI;
    place(board, cap, [-mm(28 - i * 9), -mm(4), -mm(34)]);
  }
  // The contact pads the motor and the head flex land on.
  for (let i = 0; i < 2; i++)
    place(board, box([mm(14), mm(0.6), mm(5)], '#c2a457', 0.92), [
      mm(-6 + i * 24),
      mm(1),
      mm(30),
    ]);
  label(board, 'CONTROLLER', [0, -mm(2), -mm(44)], mm(52), '#7d8f85');
  add('diskboard', board, [0, boardY, 0], [0, -2.4, 0]);

  const ports = new T.Group();
  place(ports, box([mm(14), mm(7), mm(4)], '#1a1d20', 0.12), [mm(18), 0, 0]);
  place(ports, box([mm(10), mm(3), mm(1.6)], '#0c0e0f', 0.3), [mm(18), 0, mm(2.4)]);
  place(ports, box([mm(24), mm(7), mm(4)], '#1a1d20', 0.12), [-mm(6), 0, 0]);
  place(ports, box([mm(20), mm(3), mm(1.6)], '#0c0e0f', 0.3), [-mm(6), 0, mm(2.4)]);
  for (let i = 0; i < 7; i++)
    place(ports, box([mm(1), mm(2), mm(1.4)], '#c2a457', 0.92), [
      mm(13 + i * 1.6),
      -mm(1),
      mm(2.2),
    ]);
  label(ports, 'SATA', [mm(6), mm(4.4), 0], mm(30), '#8b939a');
  add('diskport', ports, [0, boardY + mm(4), L / 2 - mm(6)], [0, -1.0, 2.6]);

  // Small parts filling the board between the named devices.
  const smalls: Vec3[] = [];
  for (let i = 0; i < 40; i++) {
    const a = i * 2.399;
    const x = Math.cos(a) * (mm(8) + (i % 7) * mm(5));
    const z = Math.sin(a * 1.31) * (mm(10) + (i % 6) * mm(6));
    if (Math.abs(x) > W / 2 - mm(14) || Math.abs(z) > L / 2 - mm(20)) continue;
    smalls.push([x, boardY - mm(1.4), z]);
  }
  instances('diskboard', smalls, [mm(3), mm(1.4), mm(1.8)], 0.12, '#6f7a69');
}
