import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';

/** Representative support circuitry and mechanical subassemblies. */
export function buildBoardDetails({
  add,
  instances,
  box,
  material,
  label,
}: ModelTools) {
  const put = (g: T.Group, mesh: T.Object3D, p: Vec3) => {
    mesh.position.set(...p);
    g.add(mesh);
    return mesh;
  };
  const leadMaterial = material('#a0a6a4', 0.86, 0.32);
  function ic(
    id: string,
    text: string,
    pos: Vec3,
    size: Vec3,
    pins = 4,
    fourSides = false,
  ) {
    const group = new T.Group();
    put(group, box(size, '#222426', 0.03, 0.003), [0, 0, 0]);
    const pin = new T.BoxGeometry(0.035, 0.022, 0.074);
    for (let edge = 0; edge < (fourSides ? 4 : 2); edge++) {
      for (let n = 0; n < pins; n++) {
        const isZ = edge < 2;
        const offset =
          ((n + 0.5) / pins - 0.5) * (isZ ? size[0] : size[2]) * 0.87;
        const lead = new T.Mesh(pin, leadMaterial);
        if (!isZ) lead.rotation.y = Math.PI / 2;
        put(
          group,
          lead,
          isZ
            ? [
                offset,
                -size[1] * 0.3,
                (edge === 0 ? -1 : 1) * (size[2] / 2 + 0.018),
              ]
            : [
                (edge === 2 ? -1 : 1) * (size[0] / 2 + 0.018),
                -size[1] * 0.3,
                offset,
              ],
        );
      }
    }
    label(group, text, [0, size[1] / 2 + 0.002, 0], size[0] * 0.82, '#92978f');
    put(
      group,
      new T.Mesh(
        new T.CylinderGeometry(0.012, 0.012, 0.002, 12),
        material('#8d908b', 0.05),
      ),
      [-size[0] * 0.34, size[1] / 2 + 0.002, -size[2] * 0.3],
    );
    add(id, group, pos, [pos[0] < 0 ? -0.7 : 0.8, 0.65, pos[2] * 0.4]);
  }
  ic('pwm', 'PWM', [1.64, 0.13, -0.28], [0.28, 0.09, 0.3], 7, true);
  ic('pwm', 'MEM PWM', [-1.9, 0.13, 0.57], [0.28, 0.09, 0.3], 7, true);
  ic('bios', 'SPI FLASH', [-2.83, 0.14, 0.39], [0.35, 0.12, 0.24]);
  ic('monitor', 'PWR MON', [3.48, 0.13, -0.64], [0.26, 0.09, 0.24], 5, true);
  ic('temperature', 'TEMP', [-1.86, 0.11, -0.77], [0.19, 0.07, 0.16]);
  ic('temperature', 'TEMP', [1.52, 0.11, 0.85], [0.19, 0.07, 0.16]);
  ic('auxreg', 'AUX', [-2.84, 0.14, -0.45], [0.32, 0.1, 0.25], 5);
  for (let i = 0; i < 4; i++)
    ic('esd', 'ESD', [-3.8, 0.105, -1.18 + i * 0.78], [0.14, 0.055, 0.14], 3);
  for (let i = 0; i < 3; i++) {
    const shunt = new T.Group();
    put(shunt, box([0.3, 0.055, 0.15], '#343839', 0.15), [0, 0, 0]);
    for (const x of [-0.115, 0.115])
      put(shunt, box([0.08, 0.058, 0.155], '#a4aaa7', 0.92), [x, 0, 0]);
    label(shunt, 'R005', [0, 0.031, 0], 0.17, '#c0c2b8');
    add('shunt', shunt, [2.72 + i * 0.43, 0.11, -1.49], [1.3, 0.6, -0.6]);
  }
  const crystal = new T.Group();
  put(crystal, box([0.29, 0.025, 0.17], '#34312d', 0.05), [0, -0.04, 0]);
  put(crystal, box([0.26, 0.065, 0.14], '#adaeaa', 0.9, 0.02), [0, 0, 0]);
  label(crystal, 'XTAL', [0, 0.035, 0], 0.2, '#4e5350');
  add('crystal', crystal, [-2.33, 0.135, -0.22], [-0.8, 0.75, 0]);
  for (let i = 0; i < 2; i++) {
    const fuse = new T.Group();
    put(fuse, box([0.3, 0.08, 0.13], '#b9b5a4', 0.02), [0, 0, 0]);
    for (const x of [-0.125, 0.125])
      put(fuse, box([0.055, 0.081, 0.132], '#a8aeaa', 0.88), [x, 0, 0]);
    label(fuse, 'F', [0, 0.042, 0], 0.06, '#444b41');
    add('fuse', fuse, [0.45 + i * 0.46, 0.12, -1.49], [0.8, 0.4, -0.6]);
  }
  const tim = box([1.015, 0.008, 1.045], '#a3a4a0', 0.93, 0.001);
  add('tim', tim, [-0.24, 0.307, 0], [0, 2.1, 0]);
  const retention = new T.Group();
  for (const angle of [-Math.PI / 4, Math.PI / 4]) {
    const arm = put(
      retention,
      box([2.54, 0.04, 0.18], '#797e7e', 0.9),
      [0, 0, 0],
    );
    arm.rotation.y = angle;
  }
  put(retention, box([0.54, 0.048, 0.54], '#797e7e', 0.88), [0, 0, 0]);
  add('retention', retention, [-0.24, -0.14, 0], [0, -1.35, 0]);
  for (const x of [-1.16, 0.68])
    for (const z of [-0.92, 0.92]) {
      const standoff = new T.Group();
      put(
        standoff,
        new T.Mesh(
          new T.CylinderGeometry(0.066, 0.066, 0.2, 6),
          material('#9f9681', 0.9, 0.32),
        ),
        [0, 0, 0],
      );
      put(
        standoff,
        new T.Mesh(
          new T.CylinderGeometry(0.024, 0.024, 0.003, 16),
          material('#272a29', 0.2),
        ),
        [0, 0.102, 0],
      );
      add('standoff', standoff, [x, 0.05, z], [0, 0.55, z * 0.6]);
    }
  instances(
    'testpoint',
    Array.from(
      { length: 20 },
      (_, i) => [-3.66 + i * 0.13, 0.052, 1.5] as Vec3,
    ),
    [0.048, 0.004, 0.048],
    0,
    '#bfa66f',
    undefined,
  ).forEach((p) => p.delta.set(-1.3, 0.15, 0.5));
  for (const side of [-1, 1]) {
    const x = side * 3.65;
    const header = new T.Group();
    put(header, box([0.37, 0.04, 0.22], '#c9c8b8', 0.02), [0, 0, 0]);
    for (const z of [-0.1, 0.1])
      put(header, box([0.37, 0.19, 0.025], '#c9c8b8', 0.02), [0, 0.1, z]);
    for (const xx of [-0.175, 0.175])
      put(header, box([0.025, 0.19, 0.2], '#c9c8b8', 0.02), [xx, 0.1, 0]);
    for (let i = 0; i < 4; i++)
      put(header, box([0.024, 0.14, 0.024], '#afaaa0', 0.85), [
        -0.115 + i * 0.078,
        0.09,
        0,
      ]);
    add('fanheader', header, [x, 0.09, 1.34], [side * 0.8, 0.6, 0.8]);
    const cable = new T.Group();
    for (let i = 0; i < 4; i++) {
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(x + i * 0.025, 0.2, 1.34),
        new T.Vector3(side * 3.8, 0.38 + i * 0.024, 1.38),
        new T.Vector3(side * 3.4, 0.8 + i * 0.024, 0.7),
        new T.Vector3(side * 2.32, 1.22, i * 0.025),
      ]);
      cable.add(
        new T.Mesh(
          new T.TubeGeometry(curve, 24, 0.014, 6, false),
          material(i === 0 ? '#393b3c' : '#222627', 0.02, 0.8),
        ),
      );
    }
    add('fancable', cable, [0, 0, 0], [side * 0.4, 3.4, 0.3]);
    const motor = new T.Group();
    put(
      motor,
      new T.Mesh(
        new T.CylinderGeometry(0.3, 0.3, 0.04, 32),
        material('#244533', 0.12),
      ),
      [0, 0, 0],
    );
    for (let i = 0; i < 9; i++) {
      const angle = (i * Math.PI * 2) / 9;
      const winding = put(
        motor,
        new T.Mesh(
          new T.TorusGeometry(0.058, 0.024, 6, 14),
          material('#a76c40', 0.9, 0.36),
        ),
        [Math.cos(angle) * 0.18, 0.07, Math.sin(angle) * 0.18],
      );
      winding.rotation.x = Math.PI / 2;
    }
    put(
      motor,
      new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.2, 24), leadMaterial),
      [0, 0.1, 0],
    );
    add('fanmotor', motor, [side * 2.32, 1.33, 0], [side * 0.37, 4.45, 0]);
  }
}
