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
  canvas.width = 2048;
  canvas.height = 1280;
  const c = canvas.getContext('2d')!,
    gradient = c.createLinearGradient(0, 0, 2048, 1280);
  if (gradient) {
    gradient.addColorStop(0, mac ? '#0f203c' : '#081724');
    gradient.addColorStop(0.48, mac ? '#234a6b' : '#123350');
    gradient.addColorStop(1, mac ? '#4b738d' : '#194669');
  }
  c.fillStyle = gradient ?? '#1d3c56';
  c.fillRect(0, 0, 2048, 1280);

  for (let layer = 0; layer < 7; layer++) {
    c.beginPath();
    c.moveTo(0, 1280);
    for (let x = 0; x <= 2048; x += 16)
      c.lineTo(
        x,
        490 +
          layer * 82 +
          Math.sin(x / 460 + layer * 0.52) * 185 +
          Math.cos(x / 1650 + layer) * 110,
      );
    c.lineTo(2048, 1280);
    c.closePath();
    c.fillStyle = mac
      ? [
          '#5b93ae',
          '#4d7e9f',
          '#3e698d',
          '#32587c',
          '#274868',
          '#1e3c59',
          '#152f47',
        ][layer]
      : [
          '#3f87a8',
          '#346f91',
          '#2b5d7d',
          '#234d6b',
          '#1c3f59',
          '#163249',
          '#102638',
        ][layer];
    c.fill();
  }

  if (mac) {
    // Translucent macOS menu bar flanking the camera notch at top.
    c.fillStyle = '#0c1624b8';
    c.fillRect(0, 0, 2048, 44);
    c.fillStyle = '#edf3f8';
    c.font = '600 19px "Segoe UI", Arial, sans-serif';
    c.textAlign = 'left';
    c.fillText('   PC Anatomy   File   Edit   View   Window   Help', 36, 28);
    c.textAlign = 'right';
    c.font = '500 18px "Segoe UI", Arial, sans-serif';
    c.fillText('100%  ▭   Wi-Fi   ⌕   14:41', 2012, 28);
  }

  c.textAlign = 'left';
  c.fillStyle = '#eef5f8';
  c.font = '600 38px "Segoe UI", Arial, sans-serif';
  c.fillText('PC ANATOMY', 84, mac ? 124 : 96);
  c.font = '400 24px "Segoe UI", Arial, sans-serif';
  c.fillStyle = '#a8c6d6';
  c.fillText(
    mac
      ? 'Apple M1 Pro · 14.2" Liquid Retina XDR'
      : 'Lenovo Legion 5 · Ryzen 7 5800H · RTX 3060',
    84,
    mac ? 166 : 138,
  );

  if (mac) {
    // Frosted macOS Dock at bottom center with squircle app icons and active dots.
    c.fillStyle = '#0e1d2dcc';
    c.fillRect(464, 1178, 1120, 78);
    c.strokeStyle = '#79a8c255';
    c.lineWidth = 2;
    c.strokeRect(464, 1178, 1120, 78);
    const appColors = [
      '#4da6ff',
      '#65d46e',
      '#f5a623',
      '#79bfcc',
      '#a389d4',
      '#e86c52',
      '#58b9d1',
      '#8fa7ca',
      '#c7b283',
      '#6897bb',
    ];
    for (let i = 0; i < 10; i++) {
      const ix = 506 + i * 104;
      c.fillStyle = appColors[i];
      c.fillRect(ix, 1193, 46, 46);
      c.strokeStyle = '#ffffff44';
      c.lineWidth = 1.5;
      c.strokeRect(ix, 1193, 46, 46);
      if (i < 3 || i === 5) {
        c.fillStyle = '#d8eef5';
        c.beginPath();
        c.arc(ix + 23, 1248, 3, 0, Math.PI * 2);
        c.fill();
      }
    }
  } else {
    // Full-width Windows 11 translucent taskbar with centered app bar and right system tray.
    c.fillStyle = '#09131ee0';
    c.fillRect(0, 1212, 2048, 68);
    c.strokeStyle = '#4e7c9644';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 1212);
    c.lineTo(2048, 1212);
    c.stroke();
    const winColors = [
      '#38b2f6',
      '#6cc4d8',
      '#8499b8',
      '#52c788',
      '#e29849',
      '#9b82cf',
      '#63b0be',
    ];
    for (let i = 0; i < 7; i++) {
      const ix = 768 + i * 76;
      c.fillStyle = winColors[i];
      c.fillRect(ix, 1228, 36, 36);
    }
    c.fillStyle = '#bfd4e0';
    c.font = '500 18px "Segoe UI", Arial, sans-serif';
    c.textAlign = 'right';
    c.fillText('ENG   Wi-Fi   🔊   14:41', 2012, 1252);
  }

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
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
  if (!mac) {
    // Signature Lenovo Legion top camera reverse-notch lip on the lid exterior.
    put(cover, slab([92, 1.3, 3.2], spec.shell, 0.35, 1.2), [
      0,
      -0.65,
      -d / 2 - 1.1,
    ]);
  }
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
    plate(w - 1.7, d - 1.7, 0.7, mac ? 7 : 4, '#11161f', [
      { x: 0, z: screenZ, w: screenW, d: screenD, r: mac ? 4 : 1 },
    ]),
    [0, 0.2, 0],
  );
  if (!mac) {
    // Legion top bezel reverse-notch camera tab.
    put(panel, slab([90, 0.7, 3.0], '#11161f', 0.15, 1.0), [
      0,
      0.2,
      -d / 2 - 0.8,
    ]);
  }
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
    slab([mac ? 29.5 : 26, 0.6, mac ? 6.6 : 4.8], '#090f16', 0.1, 0.8),
    [0, 0, 0],
  );
  put(
    camera,
    new T.Mesh(
      new T.CylinderGeometry(mm(1.35), mm(1.35), mm(0.35), 24),
      tools.material('#2f5a78', 0.7, 0.2),
    ),
    [0, 0.45, 0],
  );
  // Camera indicator LED & dual array microphones.
  put(
    camera,
    new T.Mesh(
      new T.CylinderGeometry(mm(0.45), mm(0.45), mm(0.38), 14),
      new T.MeshBasicMaterial({ color: '#45d46b' }),
    ),
    [4.6, 0.45, 0],
  );
  for (const x of [-9, 9])
    put(
      camera,
      new T.Mesh(
        new T.CylinderGeometry(mm(0.55), mm(0.55), mm(0.25), 12),
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
