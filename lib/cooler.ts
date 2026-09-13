import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { buildFan, buildFinStack, buildScrew, glowMaterial } from './parts.ts';

/**
 * Inside the processor cooler.
 *
 * Y is up through the tower, X across the fin stack, Z the direction air
 * travels: fan on the +Z face, exhaust out of −Z. The coldplate sits at the
 * bottom with the pipes rising out of it into the stack, which is the actual
 * path the heat takes.
 */

/** Millimetres to scene units. 1 unit ≈ 11 mm, so the tower fills the stage. */
const mm = (v: number) => v / 11;

const FIN_W = mm(125);
const FIN_D = mm(108);

export function buildCooler(tools: ModelTools, _root: T.Group) {
  const { add, box, material, label } = tools;
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };
  const PIPE_X = [-1.5, -0.5, 0.5, 1.5];

  // ── Coldplate ───────────────────────────────────────────────────────────
  const base = new T.Group();
  place(base, box([mm(56), mm(8), mm(56)], '#c9d0d4', 0.95, 0.004), [0, 0, 0]);
  // The pipes are flattened where they cross the plate, because direct-touch bases
  // show the copper, so the underside is striped rather than plain.
  for (const sx of PIPE_X)
    place(base, box([mm(9), mm(3), mm(56)], '#c07b3e', 0.95, 0.002), [
      sx * mm(10),
      -mm(3),
      0,
    ]);
  place(base, box([mm(64), mm(5), mm(12)], '#9aa2a7', 0.9), [0, mm(7), 0]);
  label(base, 'COLDPLATE', [0, mm(5), mm(20)], mm(40), '#7d858a');
  add('coolerbase', base, [0, mm(6), 0], [0, -1.9, 0]);

  const paste = new T.Group();
  const film = new T.Mesh(
    new T.CylinderGeometry(mm(20), mm(20), mm(1.2), 26),
    material('#b9bcae', 0.12, 0.78),
  );
  place(paste, film, [0, 0, 0]);
  label(paste, 'COMPOUND', [0, mm(1.2), 0], mm(34), '#6f7166');
  add('coolerpaste', paste, [0, mm(0.6), 0], [0, -2.6, 0], 0.1);

  // ── Heat pipes ──────────────────────────────────────────────────────────
  const pipes = new T.Group();
  for (const sx of PIPE_X) {
    // Up out of the plate, then a bend and a straight run through the stack.
    const path = new T.CatmullRomCurve3([
      new T.Vector3(sx * mm(10), mm(2), 0),
      new T.Vector3(sx * mm(12), mm(26), mm(2)),
      new T.Vector3(sx * mm(15), mm(56), 0),
      new T.Vector3(sx * mm(15), mm(150), 0),
    ]);
    place(
      pipes,
      new T.Mesh(
        new T.TubeGeometry(path, 26, mm(3.1), 14, false),
        material('#c07b3e', 0.95, 0.22),
      ),
      [0, 0, 0],
    );
    // Sealed cap at the top, which is how a real pipe ends.
    const cap = new T.Mesh(
      new T.SphereGeometry(mm(3.1), 14, 8),
      material('#b0702f', 0.94, 0.26),
    );
    place(pipes, cap, [sx * mm(15), mm(150), 0]);
  }
  label(pipes, 'HEAT PIPES', [0, mm(160), 0], mm(52), '#b08a5c');
  add('coolerpipes', pipes, [0, 0, 0], [0, 2.2, 0]);

  // ── Fin stack ───────────────────────────────────────────────────────────
  const fins = new T.Group();
  const stack = buildFinStack(material, 48, [FIN_W, mm(0.4), FIN_D], mm(2.2), '#c6cdd1');
  place(fins, stack, [0, mm(110), 0]);
  // Collars where each pipe passes through, which is what holds the fins.
  for (const sx of PIPE_X) {
    const collar = new T.Mesh(
      new T.CylinderGeometry(mm(4.4), mm(4.4), mm(104), 12, 1, true),
      material('#aeb6bb', 0.9, 0.3),
    );
    place(fins, collar, [sx * mm(15), mm(110), 0]);
  }
  label(fins, '48 FINS', [0, mm(58), FIN_D / 2 - mm(8)], mm(44), '#8b939a');
  add('coolerfins', fins, [0, 0, 0], [0, 3.0, 0]);

  const cap = new T.Group();
  place(cap, box([FIN_W + mm(4), mm(4), FIN_D + mm(4)], '#3a4147', 0.8), [0, 0, 0]);
  const lit = new T.Mesh(
    new T.PlaneGeometry(FIN_W - mm(14), FIN_D - mm(14)),
    glowMaterial('#7a3cff', 1.3, 0.9),
  );
  lit.rotation.x = -Math.PI / 2;
  place(cap, lit, [0, mm(2.4), 0]);
  const capGlow = new T.PointLight('#7a3cff', 5, 7, 2);
  capGlow.position.set(0, mm(16), 0);
  cap.add(capGlow);
  add('coolercap', cap, [0, mm(166), 0], [0, 3.8, 0]);

  // ── Fan and clips ───────────────────────────────────────────────────────
  const fan = buildFan(material, {
    size: mm(120),
    phase: 1.1,
    pads: true,
    cable: true,
    frameColor: '#262b30',
    rgb: '#7a3cff',
  });
  fan.rotation.x = Math.PI / 2; // blows along −Z, through the fins
  const fanGlow = new T.PointLight('#7a3cff', 6, 7, 2);
  fanGlow.position.set(0, 0, mm(14));
  fan.add(fanGlow);
  add('coolerfan', fan, [0, mm(110), FIN_D / 2 + mm(16)], [0, 0.4, 2.8]);

  const clips = new T.Group();
  for (const sx of [-1, 1]) {
    const path = new T.CatmullRomCurve3([
      new T.Vector3(sx * mm(62), mm(46), -mm(6)),
      new T.Vector3(sx * mm(66), mm(70), mm(52)),
      new T.Vector3(sx * mm(62), mm(150), mm(56)),
      new T.Vector3(sx * mm(58), mm(168), mm(4)),
    ]);
    place(
      clips,
      new T.Mesh(
        new T.TubeGeometry(path, 22, mm(1.6), 7, false),
        material('#c3cbd0', 0.94, 0.22),
      ),
      [0, 0, 0],
    );
  }
  add('coolerclip', clips, [0, 0, 0], [2.2, 0.6, 1.4]);

  // ── Mounting hardware ───────────────────────────────────────────────────
  const mount = new T.Group();
  place(mount, box([mm(86), mm(3), mm(86)], '#2b3035', 0.5), [0, -mm(24), 0]);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const post = new T.Mesh(
        new T.CylinderGeometry(mm(3), mm(3), mm(26), 12),
        material('#9aa2a7', 0.92, 0.26),
      );
      place(mount, post, [sx * mm(38), -mm(10), sz * mm(38)]);
      place(mount, buildScrew(material, mm(4)), [sx * mm(38), mm(6), sz * mm(38)]);
    }
  // The crossbar that pulls the plate down, with its two sprung screws.
  place(mount, box([mm(96), mm(4), mm(12)], '#8d959a', 0.9), [0, mm(12), 0]);
  for (const sx of [-1, 1]) {
    const spring = new T.Mesh(
      new T.CylinderGeometry(mm(3.4), mm(3.4), mm(12), 12, 1, true),
      material('#b6bec3', 0.9, 0.3),
    );
    place(mount, spring, [sx * mm(40), mm(18), 0]);
  }
  label(mount, 'BACKPLATE · SPRING-LOADED', [0, -mm(26), mm(48)], mm(80), '#7d858a');
  add('coolermount', mount, [0, mm(6), 0], [0, -3.0, 0]);
}
