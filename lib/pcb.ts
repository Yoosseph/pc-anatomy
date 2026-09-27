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

/**
 * Black solder mask, which is what a current desktop motherboard and a
 * graphics card are actually finished in. Green is a low-cost mask and reads
 * as a development board; every enthusiast board in the last decade is black,
 * and the difference is not a styling preference but the single loudest cue
 * for whether a board looks like a product or a prototype. The traces barely
 * show through a black mask, so the contrast has to come from the silkscreen,
 * the gold pads and the copper pour instead.
 */
const BLACK: Palette = {
  mask: '#15171a',
  maskDark: '#0c0e10',
  trace: '#1e2226',
  traceBright: '#2b3138',
  pour: '#191d21',
  silk: '#c3c9cf',
  pad: '#cbab63',
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

/** Millimetre-registered artwork for the reference ATX board. */
function motherboardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1952;
  canvas.height = 2440;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#121416';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.scale(8, 8);
  c.translate(122, 152.5);
  const rand = rng(9137);
  c.lineWidth = 0.14;
  for (let i = 0; i < 180; i++) {
    const x = -115 + rand() * 225,
      z = -145 + rand() * 285;
    const run = 8 + rand() * 28;
    c.strokeStyle = i % 4 ? '#25292c' : '#303438';
    c.beginPath();
    c.moveTo(x, z);
    c.lineTo(x + run, z);
    c.lineTo(x + run + 5, z + 5);
    c.lineTo(x + run + 5, z + 18);
    c.stroke();
  }
  // Fine surface-mount footprints and solder pads, with small reference IDs.
  // They intentionally avoid the old oversized gold dots and phantom sockets.
  for (let i = 0; i < 2200; i++) {
    const x = -118 + rand() * 236,
      z = -149 + rand() * 298;
    c.fillStyle = '#747775';
    c.fillRect(x - 0.8, z, 0.4, 0.65);
    c.fillRect(x + 0.5, z, 0.4, 0.65);
    c.fillStyle = i % 3 ? '#323538' : '#5c594e';
    c.fillRect(x - 0.35, z, 0.8, 0.65);
    if (i % 4 === 0) {
      c.fillStyle = '#8b8e89';
      c.font = '1.05px monospace';
      c.fillText('R' + (100 + i), x - 1, z - 0.5);
      c.strokeStyle = '#656966';
      c.strokeRect(x - 1, z - 0.2, 2.1, 1.1);
    }
  }
  // Length-matched DDR fan-out between the socket and the memory bank.
  c.strokeStyle = '#363b3d';
  c.lineWidth = 0.18;
  for (let i = 0; i < 28; i++) {
    const z = -98 + i * 2.2;
    c.beginPath();
    c.moveTo(41, z);
    c.lineTo(48, z);
    c.lineTo(52, z - 4);
    c.lineTo(59, z - 4);
    c.stroke();
  }
  c.strokeStyle = '#8b8f88';
  c.lineWidth = 0.2;
  c.strokeRect(-24, -102, 66, 76);
  for (const x of [63, 73, 83, 93]) c.strokeRect(x - 4, -127, 8, 138);
  c.strokeRect(-85, 26, 110, 12);
  c.strokeRect(-85, 128, 110, 12);
  // Isolated audio ground region down the left edge.
  c.strokeStyle = '#9a8041';
  c.lineWidth = 0.55;
  c.beginPath();
  c.moveTo(-117, 20);
  c.lineTo(-117, 98);
  c.lineTo(-98, 104);
  c.lineTo(-98, 149);
  c.stroke();
  c.fillStyle = '#999d96';
  c.font = '1.8px monospace';
  for (const [text, x, z] of [
    ['DDR5', 61, -132],
    ['A1   A2   B1   B2', 58, 17],
    ['PCIEX16_1', -82, 24],
    ['PCIEX16_2', -82, 143],
    ['M.2_1', -68, -2],
    ['M.2_3', -63, 100],
    ['CPU_FAN', 61, -147],
    ['ATX_PWR', 104, -77],
    ['AAFP', -81, 142],
    ['USB_1', -35, 142],
    ['USB_2', 10, 142],
    ['PANEL', 65, 142],
  ] as const)
    c.fillText(text, x, z);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function pcbTexture(variant: BoardVariant = 'motherboard') {
  const hit = cache.get(variant);
  if (hit) return hit;
  if (variant === 'motherboard') {
    const texture = motherboardTexture();
    cache.set(variant, texture);
    return texture;
  }

  return genericPcbTexture(variant);
}

function genericPcbTexture(variant: BoardVariant) {
  const wide = variant === 'memory' || variant === 'storage';
  const W = wide || variant === 'graphics' ? 2048 : 1536,
    H = wide ? 512 : variant === 'graphics' ? 1024 : 1536;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const p =
    variant === 'psu'
      ? DARK
      : variant === 'graphics'
        ? { ...BLACK, pad: '#909183', silk: '#92978e', traceBright: '#292d30' }
        : variant === 'motherboard' || variant === 'memory'
          ? BLACK
          : GREEN;
  const rand = rng(
    {
      motherboard: 9137,
      graphics: 4421,
      psu: 7703,
      memory: 2213,
      storage: 5519,
      small: 8831,
    }[variant],
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

  // The motherboard uses anchored routing zones instead of relying only on
  // decorative random traces. Coordinates mirror the physical model and the
  // X670E reference: socket high-centre, DIMMs to its right, primary PCIe and
  // M.2 below, chipset lower-right, and rear I/O down the left edge. This is a
  // functional illustration, not a claim about an actual product netlist.
  if (variant === 'motherboard') {
    const route = (
      from: [number, number],
      through: [number, number],
      to: [number, number],
      lanes: number,
      gap = 5,
    ) => {
      ctx.strokeStyle = p.traceBright;
      ctx.lineWidth = 2;
      for (let lane = 0; lane < lanes; lane++) {
        const offset = (lane - (lanes - 1) / 2) * gap;
        ctx.beginPath();
        ctx.moveTo(from[0], from[1] + offset);
        ctx.lineTo(through[0], through[1] + offset);
        ctx.lineTo(to[0], to[1] + offset);
        ctx.stroke();
      }
    };
    // Length-matched memory fan-out, CPU PCIe lanes and chipset uplink.
    route([760, 455], [920, 455], [1110, 285], 12, 4);
    route([720, 560], [720, 720], [420, 835], 10, 4.5);
    route([760, 575], [900, 720], [1080, 990], 8, 5);
    route([560, 540], [400, 650], [155, 740], 6, 5);
    route([1080, 1020], [1180, 1100], [1385, 1130], 6, 4);

    ctx.strokeStyle = p.silk;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.58;
    ctx.setLineDash([18, 9]);
    ctx.strokeRect(555, 310, 330, 330); // AM5 socket keep-out
    for (let i = 0; i < 4; i++) ctx.strokeRect(1050 + i * 58, 190, 34, 610);
    ctx.strokeRect(230, 800, 760, 52); // primary PCIe x16
    ctx.strokeRect(430, 700, 500, 90); // primary M.2
    ctx.strokeRect(980, 900, 330, 360); // chipset / lower armour
    ctx.strokeRect(18, 70, 235, 700); // integrated rear-I/O armour
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.74;
    ctx.fillStyle = p.silk;
    ctx.font = '24px monospace';
    ctx.fillText('AM5', 570, 300);
    ctx.fillText('DDR5 A1 A2 B1 B2', 1045, 165);
    ctx.fillText('PCIEX16_1', 235, 790);
    ctx.fillText('M.2 PCIe 5.0', 440, 690);
    ctx.globalAlpha = 1;
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
  const parts = wide ? 26 : variant === 'graphics' ? 480 : 86;
  for (let i = 0; i < parts; i++) {
    const w = variant === 'graphics' ? 5 + rand() * 15 : 18 + rand() * 70,
      h = variant === 'graphics' ? 4 + rand() * 10 : 12 + rand() * 44;
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

  // Mounting holes, ringed in bare copper. The motherboard uses the same
  // three-by-three physical registration as its modeled standoffs.
  if (variant === 'motherboard') {
    for (const x of [72, W / 2, W - 72])
      for (const y of [72, H / 2, H - 72]) via(x, y, 17);
  } else if (!wide)
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
