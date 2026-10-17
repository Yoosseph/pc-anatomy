import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import type { Vec3 } from './layout.ts';
import { notebookLevels, type NotebookLevel } from './notebook-levels.ts';
import { notebookConcepts } from './concepts/notebooks.ts';
import { colors } from './concept.ts';

/** Notebook physical models share 20 mm per unit, including comparison views.
 * Interior dimensions are illustrative. Outer footprints follow the selected models.
 * Logical views are functional diagrams; they never pose as removable silicon parts.
 */
export function buildNotebook(level: NotebookLevel, tools: ModelTools) {
  const { add, box, pcb, label, material } = tools;
  const mm = (n: number) => n / 20;
  const v = (x: number, y: number, z: number): Vec3 => [mm(x), mm(y), mm(z)];
  const mac = !level.startsWith('legion');
  const shell = mac ? '#8b9096' : '#38404a';
  const parts = notebookConcepts.filter(
    (c) => c.level === level && c.open !== level,
  );
  const put = (g: T.Group, o: T.Object3D, pos: Vec3) => {
    o.position.set(...pos);
    g.add(o);
  };
  const slab = (size: Vec3, color = shell, metal = 0.55) =>
    box(size.map(mm) as Vec3, color, metal, mm(0.7));
  const piece = (
    suffix: string,
    object: T.Object3D,
    position: Vec3,
    delta: Vec3,
  ) => add(`${level}-${suffix}`, object, position, delta);
  const namedSlab = (
    suffix: string,
    size: Vec3,
    pos: Vec3,
    delta: Vec3,
    color = shell,
  ) => piece(suffix, slab(size, color), v(...pos), v(...delta));
  const assembly = (target: NotebookLevel, size: Vec3) => {
    const inner = tools.assembly(target);
    const bounds = new T.Box3().setFromObject(inner);
    const extent = bounds.getSize(new T.Vector3());
    const centre = bounds.getCenter(new T.Vector3());
    const scaled = new T.Group();
    inner.position.sub(centre);
    scaled.add(inner);
    scaled.scale.set(
      mm(size[0]) / extent.x,
      mm(size[1]) / extent.y,
      mm(size[2]) / extent.z,
    );
    const wrapper = new T.Group();
    wrapper.add(scaled);
    return wrapper;
  };
  const chip = (name: string, size: Vec3) => {
    const g = new T.Group();
    g.add(slab(size, '#252a30', 0.2));
    label(g, name, v(0, size[1] / 2 + 0.1, 0), mm(size[0] * 0.8));
    return g;
  };
  const fan = () => {
    const g = new T.Group();
    const ring = new T.Mesh(
      new T.TorusGeometry(mm(23), mm(2), 8, 48),
      material('#333a43', 0.5),
    );
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    g.add(
      new T.Mesh(
        new T.CylinderGeometry(mm(7), mm(7), mm(5), 24),
        material('#1c2229', 0.3),
      ),
    );
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const blade = slab([1, 4, 15], '#6a727b', 0.65);
      blade.rotation.y = -a + 0.45;
      put(g, blade, v(Math.sin(a) * 15, 0, Math.cos(a) * 15));
    }
    return g;
  };

  if (notebookLevels[level].kind === 'logical') {
    // Repetition expresses published core counts only; other blocks are functional groups.
    const counts: Record<string, number> = {
      legioncore: 8,
      maccore: 8,
      'maccpu-efficiency': 2,
      macgpucore: 16,
    };
    parts.forEach((c, i) => {
      const count = counts[c.id] ?? 1;
      const g = new T.Group();
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      for (let n = 0; n < count; n++) {
        const o = slab(
          [62 / cols - 3, 5, 39 / rows - 3],
          colors[c.category],
          0.25,
        );
        put(
          g,
          o,
          v(
            (((n % cols) - (cols - 1) / 2) * 62) / cols,
            0,
            ((Math.floor(n / cols) - (rows - 1) / 2) * 39) / rows,
          ),
        );
      }
      label(g, c.shortName, v(0, 3.1, 27), mm(65), '#edf2f4');
      const x = ((i % 2) - 0.5) * 95;
      const z =
        (Math.floor(i / 2) - (Math.ceil(parts.length / 2) - 1) / 2) * 85;
      add(
        c.id,
        g,
        v(x, 0, z),
        v(Math.sign(x) * 20, 20 + i * 5, Math.sign(z) * 15),
      );
    });
    return;
  }

  if (level === 'legion' || level === 'macbook') {
    const w = mac ? 312.6 : 362.56,
      d = mac ? 221.2 : 260.61;
    const deckHeight = mac ? 10 : 20;
    const cover = new T.Group();
    cover.add(slab([w, 1.5, d]));
    for (const x of [-w * 0.35, w * 0.35]) {
      put(cover, slab([40, 1.2, 6], '#15191d', 0), v(x, -1.2, d * 0.37));
      for (let i = 0; i < 15; i++)
        put(
          cover,
          slab([1.5, 0.2, 35], '#15191d', 0),
          v(x - 21 + i * 3, -0.9, -d * 0.25),
        );
    }
    piece('cover', cover, v(0, -deckHeight / 2, 0), v(0, -100, 0));
    const deck = new T.Group();
    // Perimeter rails leave actual interior space for the board and battery.
    put(deck, slab([w, 2, d]), v(0, 0, 0));
    for (const x of [-1, 1])
      put(
        deck,
        slab([2, deckHeight - 2, d]),
        v(x * (w / 2 - 1), -deckHeight / 2, 0),
      );
    for (const z of [-1, 1])
      put(
        deck,
        slab([w - 4, deckHeight - 2, 2]),
        v(0, -deckHeight / 2, z * (d / 2 - 1)),
      );
    const columns = mac ? 14 : 18;
    const keyPitch = (w - 35) / columns;
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < columns; col++) {
        const key = slab([keyPitch - 2, 1.8, 13], '#14181d', 0.1);
        put(
          deck,
          key,
          v((col - (columns - 1) / 2) * keyPitch, 1.6, -d * 0.26 + row * 16),
        );
        // Fine key legends catch light without external texture assets.
        const legend = slab([4, 0.12, 0.7], mac ? '#b4bec6' : '#87c5da', 0.1);
        put(
          deck,
          legend,
          v((col - (columns - 1) / 2) * keyPitch, 2.6, -d * 0.26 + row * 16),
        );
      }
    piece('deck', deck, v(0, deckHeight / 2, 0), v(0, 130, 55));
    namedSlab(
      'trackpad',
      [mac ? 128 : 105, 1.5, 65],
      [mac ? 0 : -28, deckHeight / 2 + 1.6, d * 0.3],
      [0, 195, 70],
      mac ? '#999da1' : '#4b535e',
    );
    const hinges = new T.Group();
    for (const x of [-w * 0.32, w * 0.32])
      put(hinges, slab([32, 7, 10], '#555e68'), v(x, 0, 0));
    piece('hinges', hinges, v(0, deckHeight / 2, -d / 2 + 8), v(0, 80, -80));
    const tiltedScreen = assembly(mac ? 'macdisplay' : 'legiondisplay', [
      w - 3,
      4,
      d - 20,
    ]);
    tiltedScreen.rotation.x = Math.PI * 0.4;
    const screen = new T.Group();
    screen.add(tiltedScreen);
    add(
      mac ? 'macdisplay' : 'legiondisplay',
      screen,
      v(0, deckHeight / 2 + (d - 20) * 0.475, -d / 2 - (d - 20) * 0.155),
      v(0, 110, -100),
    );
    add(
      mac ? 'macboard' : 'legionboard',
      assembly(mac ? 'macboard' : 'legionboard', [
        w * 0.55,
        mac ? 4 : 7,
        d * 0.45,
      ]),
      v(0, -1, -d * 0.12),
      v(0, 55, -30),
    );
    add(
      mac ? 'maccooling' : 'legioncooling',
      assembly(mac ? 'maccooling' : 'legioncooling', [
        w - 20,
        mac ? 4 : 7,
        d * 0.34,
      ]),
      v(0, mac ? 2.5 : 5, -d * 0.28),
      v(0, 95, -30),
    );
    add(
      mac ? 'macbattery' : 'legionbattery',
      assembly(mac ? 'macbattery' : 'legionbattery', [
        w * 0.68,
        mac ? 5 : 9,
        d * 0.32,
      ]),
      v(0, -1, d * 0.27),
      v(0, 35, 90),
    );
    const speakers = new T.Group();
    for (const x of [-1, 1])
      put(
        speakers,
        slab([25, 5, d * 0.4], '#1a2026', 0),
        v(x * w * 0.43, 0, 0),
      );
    piece('speakers', speakers, v(0, 0, d * 0.15), v(50, 55, 25));
    const screws = new T.Group();
    for (const x of [-1, 1])
      for (const z of [-1, 0, 1]) {
        const screw = new T.Mesh(
          new T.CylinderGeometry(mm(2), mm(1.1), mm(4), 12),
          material('#a0a5ab', 0.8),
        );
        put(screws, screw, v(x * (w / 2 - 8), 0, z * (d / 2 - 8)));
      }
    piece('fasteners', screws, v(0, -deckHeight / 2, 0), v(0, -145, 0));
    return;
  }

  if (level === 'legionboard' || level === 'macboard') {
    piece('pcb', pcb(v(210, 1.2, 110)), v(0, 0, 0), v(0, -30, 0));
    const cpu = mac ? 'm1pro' : 'legioncpu';
    add(
      cpu,
      chip(mac ? 'M1 PRO' : 'RYZEN 7', [mac ? 65 : 35, 2, 35]),
      v(-30, 2, -15),
      v(-20, 50, -10),
    );
    if (!mac) {
      add(
        'legiongpu',
        chip('RTX 3060', [35, 2, 35]),
        v(25, 2, -15),
        v(20, 65, -10),
      );
      for (let i = 0; i < 2; i++)
        add(
          'legionmemory',
          assembly('legionmemory', [68, 3, 30]),
          v(-30, 3, 19 + i * 32),
          v(-50, 70 + i * 20, 40),
        );
      const vram = new T.Group();
      for (const x of [-1, 1])
        for (let z = 0; z < 3; z++)
          put(vram, slab([9, 1.4, 8], '#171e25'), v(x * 26, 0, (z - 1) * 13));
      piece('vram', vram, v(25, 2, -15), v(60, 40, -10));
    } else {
      // Unified-memory packages share the M1 Pro assembly's selection identity.
      // They are not presented as SO-DIMMs or as an independent upgrade.
    }
    add(
      mac ? 'macstorage' : 'legionstorage',
      assembly(mac ? 'macstorage' : 'legionstorage', [mac ? 35 : 80, 3, 22]),
      v(57, 2, 36),
      v(50, 50, 40),
    );
    const power = new T.Group();
    for (let i = 0; i < 8; i++)
      put(power, slab([6, 3, 6], '#778089'), v(-35 + i * 10, 0, 0));
    piece('power', power, v(0, 2, -43), v(0, 25, -35));
    const ports = new T.Group();
    for (const x of [-1, 1])
      for (let i = 0; i < 3; i++) {
        put(ports, slab([11, 6, 14], '#969da4'), v(x * 101, 0, -35 + i * 27));
        put(
          ports,
          slab([0.3, 3, 10], '#11171b', 0),
          v(x * 106.6, 0, -35 + i * 27),
        );
      }
    piece('ports', ports, v(0, 3, 0), v(40, 35, 0));
    piece(
      'wireless',
      chip('Wi-Fi', [20, 2, 16]),
      v(-84, 2, 27),
      v(-50, 45, 30),
    );
    return;
  }
  if (level === 'legioncooling' || level === 'maccooling') {
    const fans = new T.Group();
    for (const x of [-90, 90]) put(fans, fan(), v(x, 0, 0));
    piece('fans', fans, v(0, 0, 0), v(0, 45, 0));
    const pipes = new T.Group();
    for (let i = 0; i < (mac ? 2 : 3); i++) {
      const path = new T.CatmullRomCurve3([
        new T.Vector3(...v(-100, 0, -22 + i * 6)),
        new T.Vector3(...v(-35, 0, 10 + i * 6)),
        new T.Vector3(...v(35, 0, 10 + i * 6)),
        new T.Vector3(...v(100, 0, -22 + i * 6)),
      ]);
      pipes.add(
        new T.Mesh(
          new T.TubeGeometry(path, 32, mm(2), 8, false),
          material(mac ? '#626a73' : '#9c704b', 0.75),
        ),
      );
    }
    piece('pipes', pipes, v(0, 4, 0), v(0, 70, 0));
    const fins = new T.Group();
    for (const x of [-90, 90])
      for (let i = 0; i < 28; i++)
        put(fins, slab([0.5, 9, 15], '#838d96'), v(x - 25 + i * 1.85, 0, -31));
    piece('fins', fins, v(0, 0, 0), v(0, 15, -45));
    const plates = new T.Group();
    for (const x of mac ? [0] : [-25, 25])
      put(plates, slab([35, 2, 30], '#a78561'), v(x, 0, 10));
    piece('plates', plates, v(0, 1, 0), v(0, -25, 20));
    tools.airflow(
      [-90, 90].map((x) => ({
        path: [v(x, -14, 8), v(x, 0, 4), v(x, 0, -35), v(x, 0, -49)],
        kind: 'through' as const,
        size: mm(4),
        count: 7,
      })),
    );
    return;
  }
  if (level === 'legionbattery' || level === 'macbattery') {
    const cells = new T.Group();
    for (let i = 0; i < (mac ? 6 : 4); i++) {
      const width = mac ? 31 : 46;
      put(
        cells,
        chip('Li-ion', [width, 7, 65]),
        v((i - (mac ? 2.5 : 1.5)) * (width + 2), 0, 0),
      );
    }
    piece('cells', cells, v(0, 0, 0), v(0, 30, 0));
    piece('controller', pcb(v(150, 1, 9)), v(0, 0, -39), v(0, 10, -30));
    const cable = new T.Group();
    for (let i = 0; i < 5; i++)
      put(
        cable,
        slab([1.5, 1.2, 23], i % 2 ? '#aa5149' : '#252a30', 0),
        v(i * 2, 0, 0),
      );
    put(cable, slab([14, 4, 7], '#c4c1ae', 0), v(4, 0, -13));
    piece('connector', cable, v(0, 0, -55), v(0, 25, -45));
    return;
  }
  if (level === 'legiondisplay' || level === 'macdisplay') {
    const w = mac ? 309 : 359,
      d = mac ? 201 : 240;
    namedSlab('cover', [w, 1.5, d], [0, -1, 0], [0, -50, 0]);
    namedSlab(
      'backlight',
      [w - 12, 0.8, d - 16],
      [0, 0.3, 0],
      [0, 20, 0],
      '#d9e7ea',
    );
    const panel = new T.Group();
    panel.add(slab([w - 8, 0.7, d - 8], '#0d151f', 0.15));
    // Procedural desktop-like image: all screen artwork is geometry.
    put(
      panel,
      slab([w - 16, 0.1, d - 20], mac ? '#203b5d' : '#162c48', 0.1),
      v(0, 0.5, 0),
    );
    for (let i = 0; i < 6; i++)
      put(
        panel,
        slab([w * 0.62 - i * 15, 0.11, 7], mac ? '#467c9c' : '#3971a7', 0.1),
        v(0, 0.6 + i * 0.01, -30 + i * 12),
      );
    label(
      panel,
      mac ? 'MacBook Pro' : 'LEGION',
      v(0, 0.9, d * 0.3),
      mm(w * 0.3),
      '#cbdce7',
    );
    piece('panel', panel, v(0, 1, 0), v(0, 55, 0));
    const camera = new T.Group();
    camera.add(slab([mac ? 28 : 12, 0.8, 7], '#0c1118', 0.1));
    const lens = new T.Mesh(
      new T.CylinderGeometry(mm(1.1), mm(1.1), mm(0.4), 16),
      material('#355168', 0.3),
    );
    put(camera, lens, v(0, 0.5, 0));
    piece('camera', camera, v(0, 2.2, -d / 2 + 8), v(0, 80, -20));
    namedSlab(
      'cable',
      [16, 0.4, 24],
      [w * 0.24, -1, d / 2 - 18],
      [0, 5, 45],
      '#b6884d',
    );
    return;
  }
  if (level === 'legionmemory') {
    piece('board', pcb(v(68, 1, 30)), v(0, 0, 0), v(0, -20, 0));
    const dram = new T.Group();
    for (let i = 0; i < 4; i++)
      put(dram, chip('DDR4', [12, 1.4, 16]), v(-24 + i * 16, 0, 0));
    add('legiondram', dram, v(0, 1.5, -1), v(0, 35, 0));
    const contacts = new T.Group();
    for (let i = 0; i < 60; i++)
      if (i !== 34 && i !== 35)
        put(
          contacts,
          slab([0.6, 0.1, 4], '#bca060', 0.8),
          v(-31 + i * 1.05, 0, 0),
        );
    piece('contacts', contacts, v(0, 0.6, 13), v(0, 5, 20));
    piece('spd', chip('SPD', [5, 1, 5]), v(25, 1.2, -11), v(20, 25, -15));
    return;
  }
  // Two storage constructions: removable M.2 drive versus soldered flash region.
  piece(
    'substrate',
    pcb(v(mac ? 50 : 80, 0.9, mac ? 35 : 22), 'storage'),
    v(0, 0, 0),
    v(0, -20, 0),
  );
  const flash = new T.Group();
  for (const x of [-12, 12])
    put(flash, chip('NAND', [17, 1.4, 16]), v(x, 0, 0));
  piece('nand', flash, v(mac ? 0 : -10, 1.5, 0), v(0, 30, 0));
  if (mac)
    namedSlab('link', [30, 0.4, 4], [0, 0.8, 15], [0, 10, 20], '#b49665');
  else {
    piece(
      'controller',
      chip('NVMe', [12, 1.4, 12]),
      v(27, 1.5, 0),
      v(25, 40, 0),
    );
    namedSlab('contacts', [3, 0.2, 19], [39, 0.6, 0], [25, 10, 0], '#bea15d');
  }
}
