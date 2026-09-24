import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import {
  buildCapacitor,
  buildChip,
  buildChoke,
  buildHeader,
  buildScrew,
  buildSlot,
  glowMaterial,
} from './parts.ts';

// Reference-led ATX layout, in millimetres: X across, Z down, Y above the PCB.
// Routing and the installed CPU / DIMMs remain an educational assembly.
const mm = (n: number) => n / 22;
const vector = (x: number, y: number, z: number): Vec3 => [mm(x), mm(y), mm(z)];

export function buildMotherboard(tools: ModelTools, root: T.Group) {
  const { pcb, material, label } = tools;
  const occupied: T.Box3[] = [];
  const put = (g: T.Group, o: T.Object3D, x = 0, y = 0, z = 0) => {
    o.position.set(...vector(x, y, z));
    g.add(o);
    return o;
  };
  const add = (
    id: string,
    o: T.Object3D,
    x: number,
    y: number,
    z: number,
    delta: Vec3 = [0, 1.4, 0],
  ) => {
    const p = tools.add(id, o, vector(x, y, z), delta, 0);
    if (id !== 'moboboard')
      occupied.push(new T.Box3().setFromObject(o).expandByScalar(mm(1.2)));
    return p;
  };
  // Rough black anodised aluminium: distinct from polished retention hardware.
  const dark = material('#08090b', 0.62, 0.9);
  const edge = material('#14181c', 0.65, 0.82);
  dark.envMapIntensity = 0.22;
  edge.envMapIntensity = 0.3;
  const metal = material('#939a9e', 0.82, 0.68);
  metal.envMapIntensity = 0.75;
  const block = (w: number, h: number, d: number, mat: T.Material = dark) =>
    new T.Mesh(new T.BoxGeometry(mm(w), mm(h), mm(d)), mat);
  const screw = (g: T.Group, x: number, y: number, z: number, r = 2.3) =>
    put(g, buildScrew(material, mm(r)), x, y, z);
  const plate = (
    points: [number, number][],
    h: number,
    mat: T.Material = dark,
  ) => {
    const shape = new T.Shape();
    points.forEach(([x, z], i) =>
      i ? shape.lineTo(mm(x), -mm(z)) : shape.moveTo(mm(x), -mm(z)),
    );
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, {
      depth: mm(h),
      bevelEnabled: true,
      bevelSize: mm(0.25),
      bevelThickness: mm(0.2),
      bevelSegments: 1,
      steps: 1,
    });
    geo.rotateX(-Math.PI / 2);
    return new T.Mesh(geo, mat);
  };
  // Screen-printed graphics live above the metal, without coplanar flicker.
  const branding = (
    g: T.Group,
    w: number,
    d: number,
    y: number,
    vertical = false,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536;
    canvas.height = 384;
    const c = canvas.getContext('2d')!;
    c.strokeStyle = '#34393d';
    c.lineWidth = 2;
    for (let x = 12; x < 1510; x += 38) {
      c.beginPath();
      c.moveTo(x, 20);
      c.lineTo(x, 365);
      c.stroke();
    }
    for (let z = 20; z < 380; z += 38) {
      c.beginPath();
      c.moveTo(12, z);
      c.lineTo(1510, z);
      c.stroke();
    }
    c.fillStyle = '#0b0d10';
    c.fillRect(790, 20, 736, 345);
    c.fillStyle = '#919797';
    c.textAlign = 'center';
    c.textAlign = 'left';
    if (vertical) {
      c.fillStyle = '#0b0d10';
      c.fillRect(150, 120, 1240, 145);
      c.fillStyle = '#919797';
      c.font = '900 130px sans-serif';
      c.fillText('TUF GAMING', 190, 242, 1170);
    } else {
      c.font = '900 290px sans-serif';
      c.fillText('TUF', 800, 312, 320);
      c.font = '900 116px sans-serif';
      c.fillText('GAMING', 1140, 177, 365);
      c.font = '700 33px sans-serif';
      c.fillText('GET TUF. GAME TOUGH.', 1140, 263, 365);
    }
    c.strokeStyle = '#a5a9a4';
    c.lineWidth = 5;
    c.strokeRect(14, 15, 1508, 350);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 8;
    const mesh = new T.Mesh(
      new T.PlaneGeometry(mm(w), mm(d)),
      new T.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    if (vertical) mesh.rotation.z = Math.PI / 2;
    put(g, mesh, 0, y, 0);
  };
  const board = new T.Group();
  put(board, pcb(vector(244, 1.6, 305), 'motherboard'));
  const mounts = [
    [-113, -145],
    [43, -145],
    [114, -145],
    [-113, 10],
    [114, 10],
    [-113, 141],
    [42, 141],
    [114, 141],
  ];
  for (const [x, z] of mounts) {
    const ring = new T.Mesh(
      new T.TorusGeometry(mm(3.5), mm(0.75), 6, 20),
      metal,
    );
    ring.rotation.x = Math.PI / 2;
    put(board, ring, x, 1, z);
    put(
      board,
      new T.Mesh(new T.CylinderGeometry(mm(2.4), mm(2.4), mm(0.2), 16), dark),
      x,
      1,
      z,
    );
    occupied.push(
      new T.Box3(
        new T.Vector3(mm(x - 5), 0, mm(z - 5)),
        new T.Vector3(mm(x + 5), 1, mm(z + 5)),
      ),
    );
  }
  for (let i = 0; i < 6; i++) {
    const mark = block(
      1.8,
      0.25,
      14,
      material(i < 3 ? '#b48c28' : '#bb5423', 0.2),
    );
    mark.rotation.y = -0.45;
    put(board, mark, 119, 1, 81 + i * 4);
  }

  // AM5 load frame, square package, cam lever and cooler mounting rails.
  const sx = 8,
    sz = -64;
  const socket = new T.Group();
  put(socket, block(58, 3, 72, material('#25272a', 0.14)));
  const pinGeo = new T.BoxGeometry(mm(0.5), mm(0.35), mm(0.5));
  const pinMat = material('#958667', 0.75, 0.65);
  for (let x = 0; x < 40; x++)
    for (let z = 0; z < 40; z++) {
      if (x > 14 && x < 25 && z > 14 && z < 25) continue;
      put(socket, new T.Mesh(pinGeo, pinMat), x - 19.5, 1.7, z - 19.5);
    }
  for (const side of [-1, 1]) {
    put(socket, block(4, 2.4, 66, metal), side * 26, 4.1, 0);
    put(socket, block(48, 2.4, 8, metal), 0, 4.1, side * 29);
    put(socket, block(62, 5, 8), 0, 1, side * 45);
    for (const x of [-24, 24]) screw(socket, x, 5.5, side * 29, 2.6);
    for (const x of [-27, 27]) screw(socket, x, 4.4, side * 45, 3.2);
  }
  const leverCurve = new T.CatmullRomCurve3(
    [
      [31, 4, -31],
      [34, 4, -24],
      [34, 4, 26],
      [30, 4, 32],
    ].map(([x, y, z]) => new T.Vector3(...vector(x, y, z))),
  );
  socket.add(
    new T.Mesh(new T.TubeGeometry(leverCurve, 28, mm(1), 8, false), metal),
  );
  label(socket, 'AM5', vector(0, 5.5, 29), mm(16), '#53595c');
  add('socket', socket, sx, 2.4, sz);
  const cpu = new T.Group();
  put(cpu, block(40, 1.5, 40, material('#244234', 0.2)));
  const ihs: [number, number][] = [
    [-18, -18],
    [-8, -18],
    [-8, -14],
    [8, -14],
    [8, -18],
    [18, -18],
    [18, -8],
    [14, -8],
    [14, 8],
    [18, 8],
    [18, 18],
    [8, 18],
    [8, 14],
    [-8, 14],
    [-8, 18],
    [-18, 18],
    [-18, 8],
    [-14, 8],
    [-14, -8],
    [-18, -8],
  ];
  put(cpu, plate(ihs, 2.2, metal), 0, 0.9, 0);
  label(cpu, 'AMD RYZEN', vector(0, 3.4, -3), mm(27), '#53585b');
  label(cpu, 'AM5', vector(0, 3.4, 6), mm(10), '#61676a');
  add('cpu', cpu, sx, 5.2, sz, [0, 2.6, 0]);

  for (const x of [63, 73, 83, 93]) {
    const slot = buildSlot(material, mm(133), '#1d2023', {
      width: mm(6.5),
      height: mm(6),
      notch: 0.56,
      latch: true,
      latchColor: '#34383b',
    });
    slot.rotation.y = Math.PI / 2;
    add('dimmslot', slot, x, 4, -58, [0, 1, 0]);
  }
  for (const x of [73, 93]) {
    const ram = new T.Group();
    put(ram, pcb(vector(1.3, 24, 131), 'memory'), 0, 2, 0);
    // The physical key occupies Z=-8 mm after the slot's quarter-turn.
    // Split the lower edge around it so the key never passes through the PCB.
    for (const [z, length] of [
      [-37.5, 56],
      [29.5, 72],
    ])
      put(ram, pcb(vector(1.3, 4, length), 'memory'), 0, -12, z);
    // Separate face plates leave the keyed PCB contacts clear of the slot walls.
    for (const side of [-1, 1]) {
      put(ram, block(0.8, 23, 129, edge), side * 1.1, 2.5, 0);
      for (const [z, length] of [
        [-37.5, 56],
        [29.5, 72],
      ])
        put(ram, block(0.15, 3, length, pinMat), side * 0.75, -12, z);
    }
    put(ram, block(3, 1.5, 129), 0, 15, 0);
    add('ram', ram, x, 18, -58, [0, 2.2, 0]);
  }

  const vrm = new T.Group();
  for (let i = 0; i < 8; i++) {
    const x = -42 + i * 11;
    put(vrm, buildChoke(material, mm(8), mm(5)), x, 3.6, -117);
    put(vrm, buildChip(material, vector(6, 1.8, 6), 4), x, 2, -129);
    put(vrm, buildCapacitor(material, mm(2.8), mm(6), '#202326'), x, 4, -106);
  }
  for (let i = 0; i < 10; i++) {
    put(vrm, buildChoke(material, mm(7), mm(5)), -54, 3.6, -100 + i * 8.5);
    put(
      vrm,
      buildCapacitor(material, mm(2.6), mm(6), '#202326'),
      -44,
      4,
      -100 + i * 8.5,
    );
  }
  // Reserve individual VRM devices, preserving the empty L-shaped centre.
  for (const child of vrm.children)
    occupied.push(new T.Box3().setFromObject(child).expandByScalar(mm(1)));
  tools.add('cpuvrm', vrm, [0, 0, 0], [0, 1.2, -0.6], 0);
  const topSink = new T.Group();
  put(topSink, block(96, 5, 28), 0, 2.5, 0);
  for (let i = 0; i < 5; i++) {
    put(
      topSink,
      plate(
        [
          [-9, -14],
          [9, -14],
          [9, 10],
          [6, 14],
          [-9, 14],
        ],
        9,
      ),
      -38 + i * 19,
      5,
      0,
    );
    put(topSink, block(16, 0.7, 24, edge), -38 + i * 19, 14.5, 0);
  }
  add('vrmheatsink', topSink, 6, 7.8, -131, [0.4, 2.4, -0.8]);
  const sideSink = new T.Group();
  put(sideSink, block(32, 5, 113), 0, 2.5, 0);
  for (let i = 0; i < 5; i++)
    put(sideSink, block(32, 10, 20), 0, 10, -45 + i * 23);
  add('vrmheatsink', sideSink, -67, 7.8, -69, [-0.7, 2.4, -0.2]);

  // Broad angular chipset armour is the dominant panel in the reference.
  const chipset = new T.Group();
  put(chipset, block(28, 2, 28, material('#202326', 0.12)), 54, 1, 0);
  put(
    chipset,
    plate(
      [
        [-90, -19],
        [91, -19],
        [95, -15],
        [95, 11],
        [85, 15],
        [-23, 15],
        [-34, 27],
        [-73, 27],
        [-90, 13],
      ],
      5,
    ),
    0,
    4,
    0,
  );
  const graphic = new T.Group();
  branding(graphic, 171, 25, 9.35);
  put(chipset, graphic, 1, 0, -2);
  screw(chipset, -80, 10, -13, 2);
  screw(chipset, 87, 10, 9, 2);
  add('chipset', chipset, 6, 1.2, 65, [0.6, 1.4, 0.6]);

  const controller = (
    id: string,
    text: string,
    x: number,
    z: number,
    size: number,
  ) => {
    const g = new T.Group();
    put(g, buildChip(material, vector(size, 2, size), 6, true));
    label(g, text, vector(0, 1.2, 0), mm(size * 0.8), '#7e8587');
    add(id, g, x, 2, z, [x < 0 ? -1 : 1, 1.2, 0.4]);
  };
  controller('uefi', 'UEFI', 102, 28, 7);
  controller('lan', 'LAN', -109, 30, 10);
  controller('superio', 'IO', 92, 135, 11);
  const audio = new T.Group();
  put(audio, buildChip(material, vector(12, 2, 12), 7, true), 0, 1, -10);
  for (let row = 0; row < 3; row++)
    for (const x of [-5, 3])
      put(
        audio,
        buildCapacitor(material, mm(2.8), mm(7), '#a78b4c'),
        x,
        4,
        10 + row * 8,
      );
  label(audio, 'AUDIO', vector(0, 2.3, -10), mm(10), '#939991');
  add('audiocodec', audio, -108, 1, 119, [-1, 1.2, 0.6]);
  const battery = new T.Group();
  put(
    battery,
    new T.Mesh(new T.CylinderGeometry(mm(11), mm(11), mm(3), 32), dark),
  );
  put(
    battery,
    new T.Mesh(new T.CylinderGeometry(mm(9.8), mm(9.8), mm(2.8), 32), metal),
    0,
    1,
    0,
  );
  put(battery, block(4, 0.8, 4, metal), -8.5, 2.7, 0);
  label(battery, '+  CR2032', vector(0, 2.55, 0), mm(17), '#53595d');
  add('cmos', battery, -89, 3, 113, [-1.2, 1, 0.6]);

  for (const [z, primary] of [
    [32, true],
    [134, false],
  ] as const) {
    const slot = buildSlot(material, mm(100), '#202326', {
      width: mm(7.5),
      height: mm(8),
      notch: 0.14,
      latch: true,
      armour: primary,
      latchColor: '#3a3e42',
      latchEnds: 'right',
    });
    add('pcie16', slot, -31, 5, z, [0, 1.1, 0]);
  }
  for (const z of [59, 84])
    add(
      'pcie1',
      buildSlot(material, mm(20), '#202326', {
        width: mm(6),
        height: mm(7),
        notch: 0.2,
      }),
      -108,
      4.5,
      z,
      [0, 1.1, 0],
    );

  for (const [z, x, w, d] of [
    [11, -10, 122, 20],
    [114, 19, 174, 22],
  ]) {
    const socketM2 = new T.Group();
    // Connector spans the 22 mm width along Z, perpendicular to the drive.
    put(socketM2, block(4, 3, 22), -41, 0, 0);
    put(socketM2, block(1, 0.6, 19, pinMat), -39, 1.5, 0);
    screw(socketM2, 39, 2, 0, 2);
    add('m2slot', socketM2, x, 2.8, z, [0, 0.9, 0]);
    const drive = new T.Group();
    put(drive, pcb(vector(80, 1, 22), 'storage'));
    for (const chipX of [-24, 0, 24])
      put(drive, block(15, 1.4, 15, material('#1d2023', 0.12)), chipX, 1.2, 0);
    add('nvme', drive, x, 4.5, z, [0, 1.8, 0]);
    const cover = new T.Group();
    // Underside 7.2 mm including bevel; flash tops 6.4 mm.
    put(
      cover,
      plate(
        [
          [-w / 2, -d / 2],
          [w / 2 - 4, -d / 2],
          [w / 2, -d / 2 + 4],
          [w / 2, d / 2],
          [-w / 2 + 4, d / 2],
          [-w / 2, d / 2 - 4],
        ],
        4,
      ),
    );
    screw(cover, -w / 2 + 6, 4.8, 0);
    screw(cover, w / 2 - 6, 4.8, 0);
    if (z === 11)
      label(cover, 'M.2 PCIe 5.0', vector(-12, 4.4, -1), mm(48), '#8b9192');
    for (let j = 0; j < 4; j++) {
      const slash = block(6, 0.2, 1, edge);
      slash.rotation.y = -0.6;
      put(cover, slash, w / 2 - 18 - j * 4, 4.3, 2);
    }
    add('m2heatsink', cover, x, 7.4, z, [0, 2.6, 0]);
  }

  // Female power sockets use recessed contacts rather than header posts.
  const power = (columns: number) => {
    const g = new T.Group();
    const pitch = 4.2;
    put(g, block(columns * pitch + 1, 8, 9.6));
    for (let x = 0; x < columns; x++)
      for (const z of [-2.1, 2.1]) {
        put(
          g,
          block(3.2, 0.2, 3.2, material('#060708', 0.1)),
          (x - (columns - 1) / 2) * pitch,
          4.15,
          z,
        );
        put(
          g,
          block(0.7, 0.22, 0.7, metal),
          (x - (columns - 1) / 2) * pitch,
          4.27,
          z,
        );
      }
    return g;
  };
  const atx = power(12);
  atx.rotation.y = Math.PI / 2;
  add('atx24', atx, 115, 5, -45, [1.4, 1, 0]);
  for (const x of [-73, -52]) add('eps8', power(4), x, 5, -145, [0, 1, -1.2]);
  for (let i = 0; i < 4; i++) {
    const sata = new T.Group();
    put(sata, block(13, 9, 7));
    put(sata, block(0.2, 4, 5, material('#080a0b', 0.1)), 6.6, 0, 0);
    put(sata, block(0.25, 0.6, 4, pinMat), 6.75, -1.2, 0);
    add('sataport', sata, 114, 5.5, 43 + i * 9, [1.4, 0.8, 0]);
  }
  for (const [x, count] of [
    [-71, 5],
    [-27, 5],
    [19, 4],
    [76, 4],
  ])
    add(
      'frontheader',
      buildHeader(material, count, 2, mm(2.54), '#202326', mm(6)),
      x,
      4,
      147,
      [0.3, 0.8, 1.3],
    );
  for (const [x, z] of [
    [68, -141],
    [87, -141],
    [114, -90],
    [113, 95],
    [-49, 147],
    [48, 149],
  ])
    add(
      'mobofanheader',
      buildHeader(material, 4, 1, mm(2.54), '#292c2e', mm(6)),
      x,
      4,
      z,
      [0, 0.9, 0],
    );

  // Rear ports face outward (-X), under a roof clear of their metal shells.
  const io = new T.Group();
  put(io, block(1, 2, 151), -17, 1, 0);
  put(
    io,
    plate(
      [
        [-17, -76],
        [7, -76],
        [15, -65],
        [15, 72],
        [-17, 72],
      ],
      3,
    ),
    0,
    33,
    0,
  );
  put(io, block(2, 27, 144), 14, 18, 0);
  const ioArt = new T.Group();
  branding(ioArt, 107, 26, 0, true);
  put(io, ioArt, -1, 36.4, 4);

  /**
   * The connectors, as a board of this class carries them: Wi-Fi antenna
   * sockets, the BIOS flashback and clear-CMOS buttons, display outputs, USB-A
   * and USB-C, 2.5 GbE over two USB ports, and the audio jacks with an
   * optical output. They used to be nine identical USB blocks, which read as
   * nothing in particular from behind the case.
   *
   * Every face is on one plane, `FACE` millimetres out from the stack's back
   * wall and a few past the board edge, as on a real board, so the case's
   * I/O shield can sit flush against all of them. Each connector is built
   * mouth toward -X around its own centre; `z` runs along the stack and `y`
   * up off the board.
   */
  const FACE = -20;
  // The stack sits centred in the ATX aperture rather than hard against one
  // end of it.
  const STACK_SHIFT = 12;
  const steelShell = material('#8d969b', 0.88, 0.27);
  const darkMouth = material('#07090a', 0.1, 0.85);
  const rearPorts: T.Object3D[] = [];
  const connector = (
    z: number,
    y: number,
    depth: number,
    build: (g: T.Group) => void,
  ) => {
    const g = new T.Group();
    build(g);
    rearPorts.push(g);
    put(io, g, FACE + depth / 2, y, z + STACK_SHIFT);
    return g;
  };
  /** A shell with a dark mouth and a tongue, facing -X. */
  const jack = (
    z: number,
    y: number,
    w: number,
    h: number,
    depth: number,
    tongue: string,
  ) =>
    connector(z, y, depth, (g) => {
      put(g, new T.Mesh(new T.BoxGeometry(...vector(depth, h, w)), steelShell));
      put(
        g,
        new T.Mesh(
          new T.BoxGeometry(...vector(depth * 0.4, h * 0.72, w * 0.84)),
          darkMouth,
        ),
        -depth * 0.31,
      );
      put(
        g,
        new T.Mesh(
          new T.BoxGeometry(...vector(depth * 0.36, h * 0.2, w * 0.62)),
          material(tongue, 0.3, 0.6),
        ),
        -depth * 0.33,
        -h * 0.1,
      );
    });
  const usbA = (z: number, y: number) => jack(z, y, 14.5, 7, 14, '#2a4fa0');
  const usbC = (z: number, y: number) => jack(z, y, 9, 3.6, 9, '#1a1d1f');
  // Wi-Fi: two threaded gold posts on a plastic base.
  connector(-68, 17, 9, (g) => {
    put(g, block(4, 26, 8, material('#16191b', 0.1, 0.6)), 2.5);
    for (const y of [-6.5, 6.5]) {
      const post = new T.Mesh(
        new T.CylinderGeometry(mm(3.1), mm(3.1), mm(9), 16),
        material('#c9a456', 0.9, 0.3),
      );
      post.rotation.z = Math.PI / 2;
      put(g, post, -1.5, y);
      const pin = new T.Mesh(
        new T.CylinderGeometry(mm(1.1), mm(1.1), mm(1), 10),
        darkMouth,
      );
      pin.rotation.z = Math.PI / 2;
      put(g, pin, -6.1, y);
    }
  });
  // BIOS flashback and clear CMOS: two small buttons in one housing.
  connector(-55, 12, 8, (g) => {
    put(g, block(8, 17, 9, material('#16191b', 0.1, 0.6)));
    for (const [y, colour] of [
      [4, '#d0d4d6'],
      [-4, '#b8342c'],
    ] as const)
      put(g, block(2, 5, 5, material(colour, 0.1, 0.5)), -4.8, y);
  });
  // Display outputs: DisplayPort over HDMI, each keyed differently.
  jack(-41, 8, 15, 6, 12, '#101213');
  jack(-41, 18, 16, 6.5, 12, '#101213');
  // Two columns of USB-A with a USB-C on top.
  usbA(-24, 6);
  usbA(-24, 15);
  usbC(-24, 23);
  usbA(-6, 6);
  usbA(-6, 15);
  usbC(-6, 23);
  // 2.5 GbE over two USB-A: the jack, and its two link lights.
  usbA(12, 6);
  usbA(12, 15);
  connector(12, 26, 21, (g) => {
    put(g, new T.Mesh(new T.BoxGeometry(...vector(21, 13, 16)), steelShell));
    put(g, block(8, 9, 12, darkMouth), -7);
    for (const [z, colour] of [
      [-5.5, '#3fd46a'],
      [5.5, '#f2a93b'],
    ] as const)
      put(g, block(0.6, 2, 3, glowMaterial(colour, 1.2)), -10.6, 5.2, z);
  });
  // Two more USB-A and a second USB-C.
  usbA(30, 6);
  usbA(30, 15);
  usbC(30, 23);
  // Audio: line out and mic in, colour-coded, over an optical output.
  connector(51, 15, 14, (g) => {
    put(g, block(14, 26, 13, material('#16191b', 0.1, 0.6)));
    for (const [y, colour] of [
      [7, '#6cc04a'],
      [-2, '#e07aa6'],
    ] as const) {
      const ring = new T.Mesh(
        new T.CylinderGeometry(mm(3.4), mm(3.4), mm(1), 20),
        material(colour, 0.1, 0.5),
      );
      ring.rotation.z = Math.PI / 2;
      put(g, ring, -7.2, y);
      const hole = new T.Mesh(
        new T.CylinderGeometry(mm(1.8), mm(1.8), mm(1.2), 16),
        darkMouth,
      );
      hole.rotation.z = Math.PI / 2;
      put(g, hole, -7.4, y);
    }
    put(g, block(1, 5, 7, material('#2a2d30', 0.1, 0.5)), -7.2, -9);
  });
  add('reario', io, -104, 1.2, -76, [-2.2, 1.2, 0]);
  // Where each connector shell is, in the board's own frame. The meshes are
  // merged once the build finishes, so this is the last moment they can be
  // told apart; the case cuts its I/O shield from these.
  io.updateWorldMatrix(true, true);
  root.userData.rearPorts = rearPorts.map((port) =>
    new T.Box3().setFromObject(port),
  );

  // Derive passive keep-outs from actual component bounds, including sockets,
  // connectors and screw holes. This stays correct when large parts move.
  const free = (x: number, z: number, pad = 1) => {
    if (Math.abs(x) > 119 - pad || Math.abs(z) > 150 - pad) return false;
    return !occupied.some(
      (b) =>
        x + pad > b.min.x * 22 &&
        x - pad < b.max.x * 22 &&
        z + pad > b.min.z * 22 &&
        z - pad < b.max.z * 22,
    );
  };
  for (const [x, z] of [
    [104, -118],
    [104, -108],
    [104, -98],
    [69, 95],
    [87, 95],
    [105, 124],
  ]) {
    if (!free(x, z, 3)) continue;
    const p = add(
      'moboboard',
      buildCapacitor(material, mm(2.8), mm(6), '#25272a'),
      x,
      4,
      z,
      [0.8, 1.4, 0.4],
    );
    occupied.push(new T.Box3().setFromObject(p.object).expandByScalar(mm(1)));
  }
  const passives = new T.Group();
  for (let row = 0; row < 76; row++)
    for (let col = 0; col < 59; col++) {
      const n = (row * 73 + col * 137) % 17;
      if (n > 10) continue;
      const x = -116 + col * 4,
        z = -148 + row * 4;
      if (!free(x, z, 1.6)) continue;
      put(
        passives,
        block(
          1.7,
          0.8,
          0.9,
          material(n % 3 ? '#777368' : '#25272a', 0.15, 0.8),
        ),
        x,
        1.35,
        z,
      );
      for (const side of [-1, 1])
        put(passives, block(0.4, 0.85, 1, metal), x + side, 1.35, z);
    }
  // Soldered passives stay attached to the PCB in the inventory as well.
  board.add(passives);
  add('moboboard', board, 0, 0, 0, [0, -1.6, 0]);
}
