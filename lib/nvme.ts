import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { buildScrew } from './parts.ts';

/** Representative single-sided 2280 module; package placement is illustrative. */
export function buildNvme(tools: ModelTools, _root: T.Group) {
  const { add, box, pcb, label, material } = tools;
  // Match the SATA drive and other storage hardware so their physical size is
  // truthful when the models share a comparison camera.
  const mm = (value: number) => value / 8;
  const place = (group: T.Group, object: T.Object3D, at: Vec3) => {
    object.position.set(...at);
    group.add(object);
  };

  // Thin 80 × 22 mm silhouette, with an actual mounting notch and M-key gap.
  const board = new T.Group();
  const outline = new T.Shape();
  outline.moveTo(-mm(40), -mm(11));
  outline.lineTo(mm(37), -mm(11));
  outline.lineTo(mm(37), mm(11));
  outline.lineTo(-mm(40), mm(11));
  outline.lineTo(-mm(40), mm(2));
  outline.absarc(-mm(40), 0, mm(2), Math.PI / 2, -Math.PI / 2, true);
  outline.closePath();
  const boardGeometry = new T.ExtrudeGeometry(outline, {
    depth: mm(0.8),
    bevelEnabled: false,
    curveSegments: 20,
  });
  boardGeometry.rotateX(-Math.PI / 2);
  boardGeometry.translate(0, -mm(0.4), 0);
  const texturedBoard = pcb([mm(80), mm(0.8), mm(22)], 'storage');
  texturedBoard.geometry.dispose();
  texturedBoard.geometry = boardGeometry;
  board.add(texturedBoard);
  label(board, 'M.2 2280 · NVMe', [0, mm(0.55), mm(9)], mm(20), '#b7d3c4');
  for (let i = 0; i < 15; i++) {
    place(board, box([mm(1.1), mm(0.55), mm(0.65)], '#a39775', 0.65), [
      -mm(31) + mm(i * 4),
      mm(0.6),
      -mm(9),
    ]);
  }
  add('nvmeboard', board, [0, 0, 0], [0, -1.2, 0]);

  const chip = (
    id: string,
    text: string,
    x: number,
    length: number,
    width: number,
    delta: Vec3,
  ) => {
    const group = new T.Group();
    group.add(box([mm(length), mm(1.4), mm(width)], '#171b20', 0.1, 0.015));
    // BGA joints stay underneath the package, rather than protruding side leads.
    const joints = new T.InstancedMesh(
      new T.SphereGeometry(mm(0.18), 6, 4),
      material('#9ca7b2', 0.8),
      48,
    );
    const matrix = new T.Matrix4();
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 8; col++) {
        matrix.makeTranslation(
          mm(((col - 3.5) * length) / 10),
          -mm(0.8),
          mm(((row - 2.5) * width) / 8),
        );
        joints.setMatrixAt(row * 8 + col, matrix);
      }
    group.add(joints);
    label(group, text, [0, mm(1), 0], mm(length * 0.8), '#c4cccf');
    add(id, group, [mm(x), mm(1.2), 0], delta);
  };
  chip('nvmecontroller', 'CTRL', 26, 12, 12, [1.2, 1.7, 0]);
  chip('nvmedram', 'DRAM', 11, 10, 10, [0.4, 2.2, 0]);
  chip('nvmenand', '3D NAND', -7, 14, 16, [-0.4, 1.8, 0]);
  chip('nvmenand', '3D NAND', -25, 14, 16, [-1.2, 2.3, 0]);

  const contacts = new T.Group();
  // The short finger and long finger are separated by the physical key slot.
  for (const [center, width] of [
    [-3.2, 15.6],
    [9.2, 3.6],
  ]) {
    place(contacts, box([mm(3), mm(0.8), mm(width)], '#284a3b', 0.25), [
      0,
      0,
      mm(center),
    ]);
  }
  for (let i = 0; i < 30; i++) {
    const z = -10.4 + i * 0.72;
    if (z > 4.6 && z < 7.4) continue;
    for (const side of [-1, 1]) {
      place(
        contacts,
        box([mm(2.6), mm(0.08), mm(0.42)], '#d5b96b', 0.9, 0.002),
        [0, side * mm(0.45), mm(z)],
      );
    }
  }
  add('nvmecontacts', contacts, [mm(38.5), 0, 0], [2, 0.2, 0]);

  const fixing = new T.Group();
  fixing.add(buildScrew(material, mm(1.8)));
  add('nvmefastener', fixing, [-mm(40), mm(0.6), 0], [-1.5, 2.8, 0]);
}
