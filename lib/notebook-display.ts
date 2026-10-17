import * as T from 'three';
import type { ModelTools } from './hardware.ts';
import {
  notebookKit,
  notebookSpecs,
  type NotebookSystem,
} from './notebook-kit.ts';

/** Procedural artwork; no downloaded wallpapers or runtime image assets. */
function screenTexture(mac: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 1024;
  const c = canvas.getContext('2d')!,
    gradient = c.createLinearGradient(0, 0, 1536, 1024);
  if (gradient) {
    gradient.addColorStop(0, mac ? '#182a49' : '#0d2230');
    gradient.addColorStop(0.5, mac ? '#315979' : '#193e5f');
    gradient.addColorStop(1, mac ? '#597b91' : '#162f4c');
  }
  c.fillStyle = gradient ?? '#24455d';
  c.fillRect(0, 0, 1536, 1024);
  for (let layer = 0; layer < 7; layer++) {
    c.beginPath();
    c.moveTo(0, 1024);
    for (let x = 0; x <= 1536; x += 12)
      c.lineTo(
        x,
        430 +
          layer * 65 +
          Math.sin(x / 370 + layer * 0.48) * 155 +
          Math.cos(x / 1400 + layer) * 90,
      );
    c.lineTo(1536, 1024);
    c.closePath();
    c.fillStyle = mac
      ? [
          '#5287a1',
          '#4a7898',
          '#3c6487',
          '#315577',
          '#284765',
          '#213f5d',
          '#18354d',
        ][layer]
      : [
          '#477b9c',
          '#3a6688',
          '#315778',
          '#2a4c6c',
          '#24425e',
          '#1c354f',
          '#162c43',
        ][layer];
    c.fill();
  }
  c.fillStyle = '#e4edf0';
  c.font = '500 29px Arial';
  c.textAlign = 'left';
  c.fillText('PC ANATOMY', 65, 75);
  c.font = '20px Arial';
  c.fillStyle = '#aac3d0';
  c.fillText(
    mac
      ? 'Apple Silicon · shared by design'
      : 'Lenovo Legion · a machine in layers',
    65,
    115,
  );
  c.fillStyle = '#10213299';
  c.fillRect(390, 948, 756, 57);
  for (let i = 0; i < 8; i++) {
    c.fillStyle = ['#79b6c9', '#8fa7ca', '#7d9faa', '#b4a581'][i % 4];
    c.fillRect(435 + i * 87, 963, 28, 28);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function buildNotebookDisplay(
  system: NotebookSystem,
  tools: ModelTools,
) {
  const spec = notebookSpecs[system],
    mac = system === 'macbook',
    level = mac ? 'macdisplay' : 'legiondisplay';
  const { put, slab, plate, board, ribbon, screw, v, mm } = notebookKit(tools);
  const w = spec.width - 2.6,
    d = spec.lidDepth,
    screenW = spec.screenWidth,
    screenD = spec.screenHeight,
    screenZ = mac ? -2.3 : -4;
  const cover = new T.Group();
  cover.add(plate(w, d, 1.3, mac ? 8 : 5, spec.shell));
  for (const x of [-1, 1])
    put(cover, slab([1.2, spec.lid - 1.3, d - 8], spec.shell, 0.6), [
      x * (w / 2 - 0.6),
      spec.lid / 2 - 0.8,
      0,
    ]);
  for (const z of [-1, 1])
    put(cover, slab([w - 8, spec.lid - 1.3, 1.2], spec.shell, 0.6), [
      0,
      spec.lid / 2 - 0.8,
      z * (d / 2 - 0.6),
    ]);
  const mark = new T.Group();
  tools.label(
    mark,
    mac ? 'MacBook Pro' : 'L E G I O N',
    v(0, 0, 0),
    mm(mac ? 63 : 80),
    mac ? '#4c5661' : '#7d8c9b',
  );
  mark.rotation.z = Math.PI;
  put(cover, mark, [0, -0.72, 0]);
  tools.add(`${level}-cover`, cover, v(0, 0, 0), v(0, -35, 0));
  const illumination = new T.Group();
  illumination.add(plate(screenW, screenD, 0.8, mac ? 4 : 1, '#d7e3e8'));
  // Zone pattern is illustrative; it does not claim a physical zone count.
  const nx = mac ? 32 : 18,
    nz = mac ? 20 : 1;
  for (let r = 0; r < nz; r++)
    for (let c = 0; c < nx; c++)
      put(
        illumination,
        slab(
          [
            mac ? (screenW / nx) * 0.72 : 3,
            0.15,
            mac ? (screenD / nz) * 0.72 : 2,
          ],
          '#ecf1da',
          0.1,
        ),
        [
          ((c - (nx - 1) / 2) * screenW) / nx,
          0.5,
          mac ? ((r - (nz - 1) / 2) * screenD) / nz : screenD / 2 - 2,
        ],
      );
  tools.add(
    `${level}-backlight`,
    illumination,
    v(0, 1.3, screenZ),
    v(0, 22, 0),
  );
  const diffuser = new T.Group();
  diffuser.add(plate(screenW, screenD, 0.25, mac ? 4 : 1, '#d8e2e4'));
  for (let i = 0; i < 40; i++)
    put(diffuser, slab([screenW - 3, 0.035, 0.11], '#c1d0d9', 0.1), [
      0,
      0.17,
      -screenD / 2 + 3 + (i * (screenD - 6)) / 39,
    ]);
  tools.add(`${level}-diffuser`, diffuser, v(0, 1.95, screenZ), v(0, 38, 0));
  const panel = new T.Group();
  put(
    panel,
    plate(w - 1.7, d - 1.7, 0.7, mac ? 7 : 4, '#121923', [
      { x: 0, z: screenZ, w: screenW, d: screenD, r: mac ? 4 : 1 },
    ]),
    [0, 0.2, 0],
  );
  const screen: T.Mesh<T.BufferGeometry, T.Material> = plate(
    screenW,
    screenD,
    0.15,
    mac ? 4 : 1,
    '#13232e',
    [],
  );
  if (mac) {
    // A notch belongs to the outer contour. A crossing hole creates invalid
    // cap triangles and shimmering pixels across the otherwise flat LCD.
    const left = -screenW / 2,
      right = screenW / 2,
      top = -screenD / 2,
      bottom = screenD / 2;
    const outline: [number, number][] = [
      [left + 4, top],
      [-15.8, top],
      [-15.8, top + 5.5],
      [-14.7, top + 6.6],
      [14.7, top + 6.6],
      [15.8, top + 5.5],
      [15.8, top],
      [right - 4, top],
      [right, top + 4],
      [right, bottom - 4],
      [right - 4, bottom],
      [left + 4, bottom],
      [left, bottom - 4],
      [left, top + 4],
    ];
    const shape = new T.Shape(
      outline.map(([x, z]) => new T.Vector2(mm(x), -mm(z))),
    );
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: mm(0.15),
      bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -mm(0.075), 0);
    screen.geometry.dispose();
    screen.geometry = geometry;
  }
  screen.material = new T.MeshBasicMaterial({ map: screenTexture(mac) });
  const positions = screen.geometry.getAttribute('position'),
    uv = screen.geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++)
    uv.setXY(
      i,
      positions.getX(i) / mm(screenW) + 0.5,
      0.5 - positions.getZ(i) / mm(screenD),
    );
  uv.needsUpdate = true;
  put(panel, screen, [0, 0.65, screenZ]);
  if (!mac)
    tools.label(panel, 'LEGION', v(0, 0.7, d / 2 - 10), mm(29), '#9aa5b1');
  tools.add(`${level}-panel`, panel, v(0, 2.55, 0), v(0, 57, 0));
  const camera = new T.Group();
  put(
    camera,
    slab([mac ? 29.5 : 22, 0.6, mac ? 6.6 : 4.5], '#090f16', 0),
    [0, 0, 0],
  );
  put(
    camera,
    new T.Mesh(
      new T.CylinderGeometry(mm(1.2), mm(1.2), mm(0.3), 20),
      tools.material('#2c5069', 0.6),
    ),
    [0, 0.45, 0],
  );
  for (const x of [-8, 8])
    put(
      camera,
      new T.Mesh(
        new T.CylinderGeometry(mm(0.55), mm(0.55), mm(0.2), 12),
        tools.material('#182b3a', 0.3),
      ),
      [x, 0.4, 0],
    );
  tools.add(
    `${level}-camera`,
    camera,
    v(0, 3.5, mac ? screenZ - screenD / 2 + 3.2 : -d / 2 + 8),
    v(0, 90, -20),
  );
  const controller = new T.Group();
  controller.add(
    board([
      [-73, -5],
      [73, -5],
      [73, 5],
      [-73, 5],
    ]),
  );
  for (const x of [-51, 0, 51])
    put(controller, slab([13, 0.8, 5], '#151f2a', 0.1), [x, 1, 0]);
  tools.add(
    `${level}-controller`,
    controller,
    v(0, 1.2, d / 2 - 8),
    v(0, 18, 25),
  );
  const cable = new T.Group();
  for (const x of mac ? [-40, 40] : [55])
    put(cable, ribbon(mac ? 15 : 22, 27), [x, 0, 0]);
  tools.add(`${level}-cable`, cable, v(0, 0.4, d / 2 - 2), v(0, 10, 50));
  const mounts = new T.Group();
  for (const x of [-w * 0.35, w * 0.35])
    for (const z of [-d / 2 + 7, d / 2 - 7]) put(mounts, screw(1.1), [x, 0, z]);
  tools.add(`${level}-mounts`, mounts, v(0, 3.1, 0), v(0, 100, 0));
}
