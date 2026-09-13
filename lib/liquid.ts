import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { buildFan, buildFinStack, glowMaterial } from './parts.ts';

/**
 * Inside an all-in-one liquid cooler.
 *
 * X runs along the radiator, Y is up, Z is the direction air travels through
 * the core. The radiator sits at the top with its fans on the +Z face, the
 * pump and block sit below and forward where the processor would be, and the
 * two tubes run between them. That is the loop, drawn in the order the heat
 * travels: lid, coldplate, coolant, tube, radiator, air.
 *
 * Scale: 1 unit ~ 14 mm, chosen so a 360 mm radiator and the block fit the
 * stage together without the block becoming a speck.
 */

const mm = (v: number) => v / 14;

const RAD_L = mm(394); // overall length including the tanks
const RAD_W = mm(120); // across the core, one fan wide
const RAD_T = mm(27); // core thickness
const TANK = mm(17);

const COOLANT = '#3f7fa8';

export function buildLiquid(tools: ModelTools, _root: T.Group) {
  const { add, box, material, label } = tools;
  const place = (group: T.Group, obj: T.Object3D, pos: Vec3) => {
    obj.position.set(...pos);
    group.add(obj);
    return obj;
  };

  const RAD_Y = mm(150);
  const BLOCK_Y = mm(-120);
  const BLOCK_Z = mm(70);

  // Radiator: two end tanks with the finned core strung between them.
  const radiator = new T.Group();
  const coreLen = RAD_L - TANK * 2;
  for (const side of [-1, 1])
    place(radiator, box([TANK, RAD_W, RAD_T], '#2f3438', 0.82, 0.004), [
      side * (coreLen / 2 + TANK / 2),
      0,
      0,
    ]);
  // Flat coolant channels across the core, with folded fin between each pair.
  const CHANNELS = 11;
  for (let i = 0; i < CHANNELS; i++) {
    const y = (i / (CHANNELS - 1) - 0.5) * (RAD_W - mm(10));
    place(radiator, box([coreLen, mm(2.2), RAD_T * 0.86], '#9fa8ad', 0.9, 0.001), [
      0,
      y,
      0,
    ]);
  }
  // The folded fin matrix between the channels is what the air actually meets.
  const matrix = buildFinStack(
    material,
    58,
    [coreLen * 0.985, mm(0.35), RAD_T * 0.8],
    mm(RAD_W / 58 / (1 / 14)) * 0.001 + (RAD_W - mm(8)) / 58,
    '#8d969b',
  );
  place(radiator, matrix, [0, 0, 0]);
  place(radiator, box([coreLen, RAD_W + mm(3), mm(1.4)], '#23282c', 0.8), [
    0,
    0,
    -RAD_T / 2 - mm(0.7),
  ]);
  label(radiator, '360 MM CORE', [0, RAD_W / 2 + mm(14), 0], mm(150), '#87919a');
  add('aioradiator', radiator, [0, RAD_Y, 0], [0, 2.4, 0]);

  // Three fans clamped to the intake face.
  const fans = new T.Group();
  for (let i = 0; i < 3; i++) {
    const fan = buildFan(material, {
      size: mm(120),
      phase: 0.7 + i * 0.9,
      pads: true,
      cable: i === 2,
      frameColor: '#22262a',
      rgb: COOLANT,
    });
    fan.rotation.x = Math.PI / 2;
    place(fans, fan, [(i - 1) * (RAD_W + mm(2)), 0, 0]);
  }
  const wash = new T.PointLight(COOLANT, 5, 9, 2);
  wash.position.set(0, 0, mm(60));
  fans.add(wash);
  label(fans, 'THREE 120 MM FANS', [0, -RAD_W / 2 - mm(16), 0], mm(150), '#6f8794');
  add('aiofans', fans, [0, RAD_Y, RAD_T / 2 + mm(14)], [0, 0.6, 3.2]);

  // Pump and block, one housing on top of the coldplate.
  const pump = new T.Group();
  const housing = new T.Mesh(
    new T.CylinderGeometry(mm(38), mm(41), mm(44), 36),
    material('#2a2f34', 0.55, 0.42),
  );
  place(pump, housing, [0, mm(6), 0]);
  const crown = new T.Mesh(
    new T.CylinderGeometry(mm(33), mm(33), mm(2), 36),
    glowMaterial(COOLANT, 1.5, 0.92),
  );
  place(pump, crown, [0, mm(29), 0]);
  const crownLight = new T.PointLight(COOLANT, 4, 6, 2);
  crownLight.position.set(0, mm(40), 0);
  pump.add(crownLight);
  // Rotary outlets, angled the way they leave a real block.
  for (const side of [-1, 1]) {
    const outlet = new T.Mesh(
      new T.CylinderGeometry(mm(9), mm(9), mm(22), 18),
      material('#7e878d', 0.9, 0.3),
    );
    outlet.rotation.z = Math.PI / 2;
    place(pump, outlet, [side * mm(46), mm(14), 0]);
  }
  label(pump, 'PUMP + BLOCK', [0, mm(-30), mm(44)], mm(96), '#7d878e');
  add('aiopump', pump, [0, BLOCK_Y, BLOCK_Z], [0, -1.1, 1.6]);

  // The impeller lives inside the housing, so it is hidden until things open.
  const impeller = new T.Group();
  const hub = new T.Mesh(
    new T.CylinderGeometry(mm(9), mm(9), mm(12), 20),
    material('#3c4348', 0.7, 0.35),
  );
  place(impeller, hub, [0, 0, 0]);
  for (let i = 0; i < 9; i++) {
    const vane = box([mm(26), mm(9), mm(1.6)], '#aeb6bb', 0.85, 0.0006);
    vane.rotation.y = (i / 9) * Math.PI * 2;
    vane.position.set(
      Math.cos((i / 9) * Math.PI * 2) * mm(15),
      0,
      Math.sin((i / 9) * Math.PI * 2) * mm(15),
    );
    vane.rotation.y = -(i / 9) * Math.PI * 2 + 0.5;
    impeller.add(vane);
  }
  label(impeller, 'IMPELLER', [0, mm(14), 0], mm(76), '#8c959b');
  add('aioimpeller', impeller, [0, BLOCK_Y + mm(8), BLOCK_Z], [0, 1.5, 0], 0.16);

  // Coldplate, microfins facing up into the chamber.
  const plate = new T.Group();
  place(plate, box([mm(76), mm(5), mm(76)], '#c8cfd3', 0.95, 0.003), [0, 0, 0]);
  const micro = buildFinStack(
    material,
    46,
    [mm(64), mm(0.5), mm(9)],
    mm(1.45),
    '#c07b3e',
  );
  place(plate, micro, [0, mm(7), 0]);
  label(plate, 'MICROFIN COLDPLATE', [0, mm(-8), mm(48)], mm(96), '#9aa19f');
  add('aiocoldplate', plate, [0, BLOCK_Y - mm(26), BLOCK_Z], [0, -2.2, 0], 0.08);

  // Tubing: two sleeved runs from the block up to the radiator tanks.
  const tubes = new T.Group();
  for (const side of [-1, 1]) {
    const path = new T.CatmullRomCurve3([
      new T.Vector3(side * mm(56), BLOCK_Y + mm(14), BLOCK_Z),
      new T.Vector3(side * mm(150), BLOCK_Y + mm(60), BLOCK_Z * 0.7),
      new T.Vector3(side * mm(178), mm(40), mm(10)),
      new T.Vector3(side * (coreLen / 2 + TANK / 2), RAD_Y - mm(34), 0),
      new T.Vector3(side * (coreLen / 2 + TANK / 2), RAD_Y - mm(12), 0),
    ]);
    place(
      tubes,
      new T.Mesh(
        new T.TubeGeometry(path, 40, mm(9), 16, false),
        material('#1f2327', 0.2, 0.68),
      ),
      [0, 0, 0],
    );
  }
  label(tubes, 'SLEEVED TUBING', [0, mm(20), mm(66)], mm(120), '#7b838a');
  add('aiotubes', tubes, [0, 0, 0], [1.9, 0, 0.4]);

  // The coolant itself, drawn as the column standing inside the tubing.
  const coolant = new T.Group();
  for (const side of [-1, 1]) {
    const path = new T.CatmullRomCurve3([
      new T.Vector3(side * mm(56), BLOCK_Y + mm(14), BLOCK_Z),
      new T.Vector3(side * mm(150), BLOCK_Y + mm(60), BLOCK_Z * 0.7),
      new T.Vector3(side * mm(178), mm(40), mm(10)),
      new T.Vector3(side * (coreLen / 2 + TANK / 2), RAD_Y - mm(34), 0),
      new T.Vector3(side * (coreLen / 2 + TANK / 2), RAD_Y - mm(12), 0),
    ]);
    place(
      coolant,
      new T.Mesh(
        new T.TubeGeometry(path, 40, mm(6.2), 14, false),
        glowMaterial(COOLANT, 0.9, 0.75),
      ),
      [0, 0, 0],
    );
  }
  label(coolant, 'COOLANT', [0, mm(-46), mm(66)], mm(90), '#6d94a8');
  add('aiocoolant', coolant, [0, 0, 0], [2.6, 0, 0.6], 0.2);

  // Fittings at both ends of both tubes.
  const fittings = new T.Group();
  for (const side of [-1, 1]) {
    const low = new T.Mesh(
      new T.CylinderGeometry(mm(12), mm(12), mm(16), 20),
      material('#8b9399', 0.92, 0.28),
    );
    low.rotation.z = Math.PI / 2.4;
    place(fittings, low, [side * mm(60), BLOCK_Y + mm(18), BLOCK_Z]);
    const high = new T.Mesh(
      new T.CylinderGeometry(mm(12), mm(12), mm(16), 20),
      material('#8b9399', 0.92, 0.28),
    );
    place(fittings, high, [
      side * (coreLen / 2 + TANK / 2),
      RAD_Y - mm(20),
      0,
    ]);
  }
  label(fittings, 'ROTARY FITTINGS', [0, mm(64), mm(40)], mm(110), '#868f95');
  add('aiofittings', fittings, [0, 0, 0], [1.2, 0.9, 0], 0.12);
}
