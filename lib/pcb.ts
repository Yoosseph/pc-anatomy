import * as T from 'three';

/**
 * Printed circuit board faces, drawn rather than downloaded.
 *
 * A board is not a green rectangle. It is a solder mask over a copper ground
 * pour, with routed bundles fanning out of the big connectors, via stitching
 * along the power rails, white silkscreen outlines around every part and a
 * reference designator beside it. Painting that instead of a flat fill is what
 * stops the boards reading as plastic, and it costs no geometry at all: the
 * whole thing is one canvas per variant, cached for the life of the page.
 *
 * None of it is a netlist. The routing illustrates how a board is organised,
 * the same way the rest of this model illustrates a component family rather
 * than a specific product.
 */

export type BoardVariant =
  | 'motherboard'
  | 'graphics'
  | 'psu'
  | 'memory'
  | 'storage'
  | 'small';

type Palette = {
  mask: string;
  maskDark: string;
  trace: string;
  traceBright: string;
  pour: string;
  silk: string;
  pad: string;
};

const GREEN: Palette = {
  mask: '#16301f',
  maskDark: '#0f2417',
  trace: '#27503a',
  traceBright: '#3d6f4f',
  pour: '#1b3a26',
  silk: '#b9c6bb',
  pad: '#c9a961',
};

const DARK: Palette = {
  mask: '#14231c',
  maskDark: '#0d1913',
  trace: '#23412f',
  traceBright: '#375d43',
  pour: '#182c21',
  silk: '#aab4ab',
  pad: '#c2a35d',
};

/** Deterministic noise, so a board looks the same on every reload. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const cache = new Map<string, T.CanvasTexture>();

export function pcbTexture(variant: BoardVariant = 'motherboard') {
  const hit = cache.get(variant);
  if (hit) return hit;

  const wide = variant === 'memory' || variant === 'storage';
  const W = wide ? 2048 : 1536,
    H = wide ? 512 : 1536;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const p = variant === 'psu' ? DARK : GREEN;
  const rand = rng(
    { motherboard: 9137, graphics: 4421, psu: 7703, memory: 2213, storage: 5519, small: 8831 }[
      variant
    ],
  );

  ctx.fillStyle = p.mask;
  ctx.fillRect(0, 0, W, H);

  // Copper pour under the mask: broad filled regions, slightly lighter, with
  // the cross-hatch relief a thermal relief pattern leaves behind.
  ctx.fillStyle = p.pour;
  for (let i = 0; i < 7; i++) {
    const x = rand() * W * 0.8,
      y = rand() * H * 0.8;
    ctx.fillRect(x, y, W * (0.12 + rand() * 0.3), H * (0.1 + rand() * 0.28));
  }
  ctx.strokeStyle = p.maskDark;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  for (let d = -H; d < W; d += 9) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + H, H);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Routed bundles. Each leaves a connector edge, turns on 45 degrees and runs
  // across the board, the way real fan-out is drawn.
  const bundles = wide ? 10 : 26;
  for (let b = 0; b < bundles; b++) {
    const lanes = 3 + Math.floor(rand() * 9);
    const fromTop = rand() > 0.5;
    const x0 = rand() * W * 0.75;
    const y0 = fromTop ? rand() * H * 0.35 : H - rand() * H * 0.35;
    const dir = fromTop ? 1 : -1;
    const run = W * (0.12 + rand() * 0.4);
    const bright = rand() > 0.7;
    ctx.strokeStyle = bright ? p.traceBright : p.trace;
    ctx.lineWidth = rand() > 0.85 ? 3.2 : 1.6;
    for (let l = 0; l < lanes; l++) {
      const off = l * (ctx.lineWidth + 3.4);
      const y = y0 + dir * off;
      const bend = 40 + rand() * 60;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + bend, y);
      ctx.lineTo(x0 + bend + 46, y + dir * 46);
      ctx.lineTo(x0 + bend + 46 + run, y + dir * 46);
      ctx.stroke();
    }
  }

  // Via stitching: rings of plated copper, in rows along the power rails and
  // scattered where the pour needs tying together.
  const via = (x: number, y: number, r: number) => {
    ctx.fillStyle = p.pad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.maskDark;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  };
  for (let i = 0; i < (wide ? 90 : 320); i++)
    via(rand() * W, rand() * H, 2.4 + rand() * 1.6);
  for (let row = 0; row < (wide ? 2 : 6); row++) {
    const y = rand() * H;
    for (let x = 30; x < W - 30; x += 26) via(x, y, 3);
  }

  // Silkscreen: part outlines and their reference designators.
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = p.silk;
  ctx.fillStyle = p.silk;
  const prefixes = ['R', 'C', 'U', 'L', 'Q', 'D', 'J'];
  const parts = wide ? 26 : 86;
  for (let i = 0; i < parts; i++) {
    const w = 18 + rand() * 70,
      h = 12 + rand() * 44;
    const x = rand() * (W - w - 40) + 20,
      y = rand() * (H - h - 50) + 30;
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(x, y, w, h);
    // Gold pads at each end of the footprint.
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = p.pad;
    ctx.fillRect(x - 5, y + h * 0.25, 6, h * 0.5);
    ctx.fillRect(x + w - 1, y + h * 0.25, 6, h * 0.5);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = p.silk;
    ctx.font = '15px monospace';
    ctx.fillText(
      prefixes[Math.floor(rand() * prefixes.length)] +
        (100 + Math.floor(rand() * 800)),
      x,
      y - 5,
    );
  }
  ctx.globalAlpha = 1;

  // Mounting holes, ringed in bare copper.
  if (!wide)
    for (let i = 0; i < 6; i++) {
      const x = 60 + rand() * (W - 120),
        y = 60 + rand() * (H - 120);
      ctx.fillStyle = p.pad;
      ctx.beginPath();
      ctx.arc(x, y, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b0f0c';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

  ctx.fillStyle = p.silk;
  ctx.globalAlpha = 0.75;
  ctx.font = '22px monospace';
  ctx.fillText('PC ANATOMY', 34, H - 26);
  ctx.font = '18px monospace';
  ctx.fillText('ILLUSTRATIVE ROUTING, NOT A NETLIST', 34, H - 52);
  ctx.globalAlpha = 1;

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  cache.set(variant, texture);
  return texture;
}

const roughCache = new Map<string, T.CanvasTexture>();

/**
 * A roughness map for the board faces. Solder mask is matte, the exposed
 * copper of a pad is not, and the difference is most of what makes a board
 * look like a board rather than a printed picture of one.
 */
export function pcbRoughness(variant: BoardVariant = 'motherboard') {
  const hit = roughCache.get(variant);
  if (hit) return hit;
  const N = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = N;
  const ctx = canvas.getContext('2d')!;
  const rand = rng(variant.length * 7919 + 13);
  const img = ctx.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    // Mostly matte, with fine grain so highlights break up across the surface.
    const v = 196 + rand() * 40;
    img.data.set([v, v, v, 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(6, 6);
  roughCache.set(variant, texture);
  return texture;
}
