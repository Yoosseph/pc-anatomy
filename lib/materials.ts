import * as T from 'three';
import { markShared } from './geometry-cache.ts';

/**
 * Surface finishes, authored from how the real parts are actually finished.
 *
 * A computer case is not one grey. A mid-tower is four or five distinct
 * finishes sitting next to each other, and it is the *difference* between them
 * that reads as a manufactured product rather than as a pile of boxes:
 *
 *   · fine-texture black powder coat on the folded steel shell
 *   · bead-blasted anodised aluminium on the extruded corner columns and trim
 *   · brushed aluminium on machined faces, heat spreaders and coldplates
 *   · bright nickel and bare copper inside a cooler
 *   · low-gloss moulded ABS on fan frames, connector bodies and bezels
 *   · low-iron tempered glass in the window
 *
 * Two things separate those finishes for the eye, and neither is colour.
 *
 * The first is *grain direction*. Powder coat is isotropic speckle; brushed
 * aluminium is a strongly directional streak; anodised aluminium is a very
 * fine blasted matte. Reusing one noise map for all three is exactly what made
 * every panel here read as the same injection-moulded plastic.
 *
 * The second is *how tight the highlight is*. Roughness under about 0.3 gives
 * the small, hard reflection of machined metal; 0.55-0.7 gives the broad soft
 * sheen of powder coat; above 0.8 gives the near-flat look of rubber. Held
 * constant across a face, any of them still reads as plastic, so every finish
 * below also varies its own roughness across the surface with a map.
 *
 * Nothing here is downloaded. Every map is drawn to a canvas at build time
 * from a seeded generator, so the same build always produces the same surface.
 */

/** A small seeded generator, so a finish looks the same on every load. */
function noise(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  repeat: [number, number] = [1, 1],
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = 8;
  return texture;
}

/**
 * Fine-texture powder coat: the finish on a case's steel.
 *
 * Sprayed powder fuses into a shallow orange-peel speckle, a millimetre or so
 * across. It is isotropic, so the highlight breaks up the same way whichever
 * way you turn the panel, which is the opposite of brushed metal and the main
 * reason the two never get mistaken for each other.
 */
function powderCoat() {
  return canvasTexture(
    512,
    (ctx, n) => {
      const random = noise(90211);
      const image = ctx.createImageData(n, n);
      // Two octaves: a broad low-frequency undulation for the orange peel and
      // a fine grain on top for the powder itself.
      const coarse = new Float32Array(64 * 64);
      for (let i = 0; i < coarse.length; i++) coarse[i] = random();
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const cx = Math.floor((x / n) * 64),
            cy = Math.floor((y / n) * 64);
          const value =
            150 + (coarse[cy * 64 + cx] - 0.5) * 46 + (random() - 0.5) * 26;
          image.data.set([value, value, value, 255], (y * n + x) * 4);
        }
      ctx.putImageData(image, 0, 0);
    },
    [4, 4],
  );
}

/**
 * Bead-blasted anodising: the matte of an aluminium extrusion or a trim strip.
 * Much finer than powder coat and with no undulation, so it stays quiet up
 * close while still refusing to hold a perfectly even highlight.
 */
function blasted() {
  return canvasTexture(
    512,
    (ctx, n) => {
      const random = noise(41887);
      const image = ctx.createImageData(n, n);
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const value = 150 + (random() - 0.5) * 17;
          image.data.set([value, value, value, 255], (y * n + x) * 4);
        }
      ctx.putImageData(image, 0, 0);
    },
    [7, 7],
  );
}

/**
 * Brushed aluminium: long, strongly directional scratches from the belt.
 *
 * The streaks are what matter. A brushed face stretches its reflection along
 * the grain, so the texture is almost constant down one axis and busy across
 * the other. Making the two axes equally noisy is what turns brushed metal
 * back into grey plastic.
 */
function brushed() {
  return canvasTexture(
    512,
    (ctx, n) => {
      const random = noise(7723);
      const image = ctx.createImageData(n, n);
      const line = new Float32Array(n);
      for (let y = 0; y < n; y++) line[y] = random();
      for (let y = 0; y < n; y++) {
        const base = 148 + (line[y] - 0.5) * 44;
        for (let x = 0; x < n; x++) {
          // A little travel along the grain keeps the streak from reading as a
          // ruled line, without giving it any real structure across.
          const value = base + (random() - 0.5) * 7;
          image.data.set([value, value, value, 255], (y * n + x) * 4);
        }
      }
      ctx.putImageData(image, 0, 0);
    },
    [1, 5],
  );
}

/** Low-gloss moulded ABS: tool marks and a faint moulding grain. */
function molded() {
  return canvasTexture(
    512,
    (ctx, n) => {
      const random = noise(55009);
      const image = ctx.createImageData(n, n);
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          // A shallow cell pattern, which is what a grained mould leaves.
          const cell =
            Math.sin(x * 0.42) * Math.sin(y * 0.42) * 9 + (random() - 0.5) * 20;
          const value = 146 + cell;
          image.data.set([value, value, value, 255], (y * n + x) * 4);
        }
      ctx.putImageData(image, 0, 0);
    },
    [6, 6],
  );
}

export type Finish =
  | 'steel' //  powder-coated steel: the shell, the tray, the brackets
  | 'steelLight' //  the same coat in the lighter grey used inside some cases
  | 'anodized' //  dark anodised aluminium: columns, trim, GPU shroud
  | 'anodizedLight' // natural-silver anodised aluminium
  | 'brushed' //  brushed aluminium: heat spreaders, machined faces
  | 'nickel' //  bright nickel plate: coldplates, fasteners
  | 'copper' //  bare copper: heat pipes
  | 'plastic' //  matte ABS: fan frames, bezels
  | 'plasticGloss' // gloss ABS: connector bodies, buttons
  | 'rubber'; //  fan pads, feet, grommets

type Recipe = {
  color: string;
  metalness: number;
  roughness: number;
  /** Which grain this finish has, and how deep it sits. */
  grain: 'powder' | 'blasted' | 'brushed' | 'molded' | 'none';
  bump: number;
  /** How far the grain is allowed to swing the roughness either way. */
  vary: number;
  env: number;
};

const RECIPES: Record<Finish, Recipe> = {
  // Case steel is very dark, not mid-grey. A real black case only looks grey
  // where the light actually hits it, and that contrast between a lit edge and
  // a near-black face is most of what makes it read as a solid object.
  // Powder coat is paint, not bare metal. Giving it a metal's reflectance was
  // the reason a black case came out mid-grey: a metallic surface takes its
  // colour from what it reflects, so a studio environment turned every dark
  // panel pale. As a dielectric it keeps its own albedo and only the highlight
  // comes from the room, which is what a coated panel actually does.
  steel: {
    color: '#23272b',
    metalness: 0.14,
    roughness: 0.58,
    grain: 'powder',
    bump: 0.004,
    vary: 0.2,
    env: 0.9,
  },
  steelLight: {
    color: '#525a61',
    metalness: 0.16,
    roughness: 0.54,
    grain: 'powder',
    bump: 0.0035,
    vary: 0.18,
    env: 0.85,
  },
  // Anodising is an oxide layer over aluminium:half metal, half paint. Dark anodising in
  // particular absorbs far more than bare metal does.
  anodized: {
    color: '#282e33',
    metalness: 0.74,
    roughness: 0.38,
    grain: 'blasted',
    bump: 0.0018,
    vary: 0.12,
    env: 1.2,
  },
  anodizedLight: {
    color: '#8d969c',
    metalness: 0.88,
    roughness: 0.33,
    grain: 'blasted',
    bump: 0.0018,
    vary: 0.12,
    env: 1.35,
  },
  brushed: {
    color: '#9aa2a8',
    metalness: 0.94,
    roughness: 0.26,
    grain: 'brushed',
    bump: 0.0026,
    vary: 0.16,
    env: 1.55,
  },
  nickel: {
    color: '#ccd2d6',
    metalness: 0.98,
    roughness: 0.15,
    grain: 'blasted',
    bump: 0.0008,
    vary: 0.07,
    env: 2.0,
  },
  copper: {
    color: '#b3693a',
    metalness: 0.96,
    roughness: 0.23,
    grain: 'brushed',
    bump: 0.0016,
    vary: 0.1,
    env: 1.9,
  },
  plastic: {
    color: '#16191c',
    metalness: 0.0,
    roughness: 0.7,
    grain: 'molded',
    bump: 0.0022,
    vary: 0.16,
    env: 0.85,
  },
  plasticGloss: {
    color: '#0d0f11',
    metalness: 0.0,
    roughness: 0.31,
    grain: 'molded',
    bump: 0.001,
    vary: 0.1,
    env: 1.15,
  },
  rubber: {
    color: '#0e1012',
    metalness: 0.0,
    roughness: 0.92,
    grain: 'molded',
    bump: 0.003,
    vary: 0.06,
    env: 0.5,
  },
};

const GRAIN: Record<Recipe['grain'], (() => T.Texture) | null> = {
  powder: powderCoat,
  blasted,
  brushed,
  molded,
  none: null,
};

/** Grain maps are deterministic, so every build shares one of each. */
const grains = new Map<string, T.Texture>();
const grainFor = (kind: Recipe['grain']) => {
  const make = GRAIN[kind];
  if (!make) return undefined;
  if (!grains.has(kind)) grains.set(kind, markShared(make()));
  return grains.get(kind);
};

/**
 * A finish library for one model build.
 *
 * Grain maps are shared between every finish and every build, and materials
 * are cached per finish-and-colour, so a whole case costs four canvases once.
 * The materials are owned by the meshes that use them, which is what lets the
 * scene dispose a model by walking it; the shared maps outlive it.
 */
export function finishes() {
  const cache = new Map<string, T.MeshStandardMaterial>();
  /**
   * `finish('steel')` gives the stock recipe. The second argument recolours it
   * and the third nudges its roughness, so one finish covers a family of parts
   * without losing the grain that identifies it.
   */
  return function finish(
    kind: Finish,
    color?: string,
    roughness?: number,
  ): T.MeshStandardMaterial {
    const key = kind + '|' + (color ?? '') + '|' + (roughness ?? '');
    const hit = cache.get(key);
    if (hit) return hit;
    const recipe = RECIPES[kind];
    const map = grainFor(recipe.grain);
    const material = new T.MeshStandardMaterial({
      color: color ?? recipe.color,
      metalness: recipe.metalness,
      roughness: roughness ?? recipe.roughness,
      bumpMap: map,
      bumpScale: recipe.bump,
      // The grain doubles as the roughness map. One roughness value over a
      // whole face is the single strongest plastic cue there is: the highlight
      // keeps its shape wherever the panel turns. Letting the grain swing it a
      // little is what makes a coated panel look coated.
      roughnessMap: map,
      envMapIntensity: recipe.env,
    });
    // Three multiplies roughness by the map, so the map's mid-grey has to land
    // back on the recipe's value rather than halving it.
    material.roughness = Math.min(
      1,
      (roughness ?? recipe.roughness) * (map ? 1 / 0.58 : 1),
    );
    material.userData.vary = recipe.vary;
    cache.set(key, material);
    return material;
  };
}

export type Finisher = ReturnType<typeof finishes>;

/** Low-iron tempered glass, as used for a case window. */
export function temperedGlass(tint = '#d6e6e8') {
  return new T.MeshPhysicalMaterial({
    color: tint,
    metalness: 0,
    roughness: 0.03,
    transmission: 0.96,
    thickness: 0.07,
    transparent: true,
    // Kept well under the threshold the picker uses to step past a surface, so
    // the window never answers for the part behind it.
    opacity: 0.16,
    depthWrite: false,
    ior: 1.52,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    side: T.DoubleSide,
  });
}
