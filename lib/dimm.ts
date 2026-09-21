import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { surfaceTexture } from './surfaces.ts';

/**
 * Inside a DDR5 memory module.
 *
 * Coordinates are millimetres in the module frame, 1 unit ≈ 6 mm: the 133.35
 * mm UDIMM comes out at about twenty-two units long. The board lies flat with
 * its 288-pin edge along -Z; the eight x8 packages sit single-sided on the top
 * face with power management and the SPD hub between them and the contacts. A
 * Beast-class low-profile spreader clamps both faces over the packages and
 * lifts clear with the explode, leaving the gold fingers and the key exposed.
 * Package count, rank count and layout describe the modelled educational
 * example only: a single-sided, single-rank module with eight x8 packages.
 */
export function buildDimm(tools: ModelTools, _root: T.Group) {
  const { add, box, pcb, label, material } = tools;
  const mm = (value: number) => value / 6;
  const place = (group: T.Group, object: T.Object3D, at: Vec3) => {
    object.position.set(...at);
    group.add(object);
  };

  // Module board: 133.35 mm long in a JEDEC height class, green memory mask.
  // The DDR5 key is a real cutout through the bottom edge at x in [-7, 1] mm:
  // the upper board stops 3.5 mm short and two lower flanks run up to the key,
  // the way a slot key passes through the module edge rather than its copper.
  const board = new T.Group();
  board.add(pcb([mm(133.35), mm(1.27), mm(27.75)], 'memory'));
  board.children[0].position.set(0, 0, mm(1.75));
  for (const [center, width] of [
    [-36.8375, 59.675],
    [33.8375, 65.675],
  ]) {
    const flank = pcb([mm(width), mm(1.27), mm(3.5)], 'memory');
    flank.position.set(mm(center), 0, mm(-13.875));
    board.add(flank);
  }
  label(board, 'DDR5 UDIMM · 8 × X8', [0, mm(0.8), mm(10)], mm(40), '#82998b');
  add('dimmboard', board, [0, 0, 0], [0, -1.2, 0]);

  // Eight x8 DRAM packages in one row: one rank with four packages on each
  // of the two subchannels. BGA joints stay underneath each package, drawn
  // from one shared joint template rather than rebuilt per chip.
  const jointGeo = new T.SphereGeometry(mm(0.18), 6, 4);
  const jointMat = material('#9ca7b2', 0.8);
  const joints = () => {
    const mesh = new T.InstancedMesh(jointGeo, jointMat, 48);
    const matrix = new T.Matrix4();
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 8; col++) {
        matrix.makeTranslation(
          mm(((col - 3.5) * 11) / 10),
          -mm(0.7),
          mm(((row - 2.5) * 10) / 8),
        );
        mesh.setMatrixAt(row * 8 + col, matrix);
      }
    return mesh;
  };
  const chipX = (i: number) => -57.75 + i * 16.5;
  for (let i = 0; i < 8; i++) {
    const chip = new T.Group();
    chip.add(box([mm(11), mm(1.2), mm(10)], '#171b20', 0.1, 0.015));
    chip.add(joints());
    label(chip, 'DDR5 X8', [0, mm(0.9), 0], mm(8), '#c4cccf');
    add(
      'dramchip',
      chip,
      [mm(chipX(i)), mm(1.4), mm(6)],
      [(i < 4 ? -1 : 1) * 0.5, 1.7, 0.4],
    );
  }

  // On-module power management and SPD hub between the packages and the edge.
  const pmic = new T.Group();
  pmic.add(box([mm(7), mm(1), mm(7)], '#1b1e21', 0.1, 0.01));
  label(pmic, 'PMIC', [0, mm(0.8), 0], mm(6), '#8c9499');
  add('dimmpmic', pmic, [mm(-8), mm(1.2), mm(-4)], [-0.5, 1.6, -0.4]);

  const spd = new T.Group();
  spd.add(box([mm(5), mm(1), mm(5)], '#1b1e21', 0.1, 0.01));
  label(spd, 'SPD', [0, mm(0.8), 0], mm(4.5), '#8c9499');
  add('dimmspd', spd, [mm(8), mm(1.2), mm(-4)], [0.5, 1.6, -0.4]);

  // Low-profile heat spreader in the Beast class: two thin mirror plates, one
  // per face, interlocked along the top edge with two locking clips and
  // angled asymmetric facets on the faces. The bottom edge runs straight and
  // stops clear of the contact field, so the gold fingers and the key stay
  // exposed. Branding is text-only with no logo geometry, and differs per
  // face: lettering on the outer face, a spec sticker on the inner one. The
  // whole assembly lifts clear with the explode, packages visible beneath it.
  const spreader = new T.Group();
  const brush = surfaceTexture('brushed');
  const spreaderFinish = new T.MeshStandardMaterial({
    color: '#202326',
    metalness: 0.85,
    roughness: 0.42,
    bumpMap: brush,
    bumpScale: 0.002,
    roughnessMap: brush,
  });
  spreaderFinish.envMapIntensity = 0.85;
  // Face outline with angled top corners, extruded thin and laid flat: one
  // shared geometry serves both mirror plates.
  const outline = new T.Shape();
  outline.moveTo(-65, -12.5);
  outline.lineTo(65, -12.5);
  outline.lineTo(65, 8);
  outline.lineTo(60, 12.5);
  outline.lineTo(-58, 12.5);
  outline.lineTo(-65, 5);
  outline.closePath();
  const plateGeo = new T.ExtrudeGeometry(outline, {
    depth: 0.4,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.3,
    bevelSegments: 1,
  });
  plateGeo.rotateX(Math.PI / 2);
  plateGeo.translate(0, 0.2, 2.5);
  // A grain-varied twin finish for the inner plate, so the two faces do not
  // read as one stamped sheet.
  const brushInner = brush.clone();
  brushInner.center.set(0.5, 0.5);
  brushInner.rotation = Math.PI / 2;
  const spreaderFinishInner = spreaderFinish.clone();
  spreaderFinishInner.bumpMap = brushInner;
  spreaderFinishInner.roughnessMap = brushInner;
  for (const [y, finish] of [
    [2.55, spreaderFinish],
    [-1.15, spreaderFinishInner],
  ] as const) {
    const plate = new T.Mesh(plateGeo, finish);
    plate.scale.setScalar(mm(1));
    plate.position.set(0, mm(y), 0);
    spreader.add(plate);
  }
  // Angled facet strips flanking the branding on each face, half-embedded,
  // with slight opposing tilts so the faces read faceted, not plain.
  for (const side of [-1, 1])
    for (const [x, tilt] of [
      [-38, 0.12],
      [38, -0.12],
    ]) {
      const rib = box([mm(2.2), mm(0.3), mm(18)], '#202326', 0.85);
      rib.rotation.y = tilt;
      rib.position.set(mm(x), mm(side < 0 ? -1.7 : 3.1), mm(2.5));
      spreader.add(rib);
    }
  // Top-edge interlock rib with two locking clips holding the halves.
  place(spreader, box([mm(116), mm(0.35), mm(0.4)], '#0e1013', 0.6), [
    mm(0),
    mm(3.0),
    mm(14.4),
  ]);
  for (const x of [-40, 40])
    place(spreader, box([mm(5), mm(4.4), mm(3)], '#2e3338', 0.6), [
      mm(x),
      mm(0.7),
      mm(14),
    ]);
  // Slim thermal pads seated between the chip tops (2.0 mm) and the plate
  // underside: bottom faces touch the packages, tops meet the plate.
  for (const x of [-31, 25])
    place(spreader, box([mm(56), mm(0.25), mm(11)], '#2a2d30', 0.1), [
      mm(x),
      mm(2.125),
      mm(6),
    ]);
  // Face A: lettering. Face B: spec sticker with three small text lines.
  label(
    spreader,
    'KINGSTON FURY',
    [mm(-1), mm(3.15), mm(5)],
    mm(56),
    '#c9ced1',
  );
  label(spreader, 'DDR5', [mm(-1), mm(3.15), mm(-2)], mm(20), '#9aa1a6');
  place(spreader, box([mm(40), mm(0.12), mm(13)], '#d7dade', 0.05), [
    mm(-1),
    mm(-1.75),
    mm(2.5),
  ]);
  const sticker = (text: string, z: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#3a3f44';
    ctx.textAlign = 'center';
    ctx.font = '500 30px monospace';
    ctx.fillText(text, 256, 34, 480);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const plane = new T.Mesh(
      new T.PlaneGeometry(mm(34), (mm(34) * 48) / 512),
      new T.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      }),
    );
    plane.rotation.x = Math.PI / 2;
    plane.position.set(mm(-1), mm(-1.83), mm(z));
    spreader.add(plane);
  };
  sticker('DDR5 6000MT/s', 5.5);
  sticker('1.35V  CL36  16GB 1Rx8', 2.5);
  sticker('ASSEMBLED IN TAIWAN', -0.5);
  add('dimmspreader', spreader, [0, 0, 0], [0, 2.6, 0]);

  // 288-pin edge contacts: 144 fingers per face at 0.8 mm pitch, split into
  // two fields around the key cutout, each on its own backing strip. Nothing
  // spans the key zone: no board, no strip, no finger. The fingers sit ON the
  // board faces — inner face just outside the 1.27 mm slab — so the gold
  // reads from above instead of hiding inside the board.
  const contacts = new T.Group();
  for (const [center, width] of [
    [-35.9, 57.8],
    [29.9, 57.8],
  ]) {
    place(contacts, box([mm(width), mm(0.8), mm(3)], '#284a3b', 0.25), [
      mm(center),
      0,
      mm(-14.5),
    ]);
  }
  for (let field = 0; field < 2; field++) {
    const start = field === 0 ? -64.55 : 1.75;
    for (let i = 0; i < 72; i++) {
      const x = start + i * 0.8;
      for (const side of [-1, 1]) {
        place(
          contacts,
          box([mm(0.5), mm(0.08), mm(2.2)], '#d5b96b', 0.9, 0.002),
          [mm(x), side * mm(0.68), mm(-14.5)],
        );
      }
    }
  }
  add('dimmcontacts', contacts, [0, 0, 0], [0, -0.4, -1.8]);
}
