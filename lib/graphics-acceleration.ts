/**
 * Browser hardware-acceleration detection.
 *
 * Browsers never expose the "use hardware acceleration" setting itself, but
 * turning it off makes WebGL fall back to a software rasteriser, which is
 * visible from script. The check is deliberately strict: acceleration counts
 * as on only when every signal agrees. Any doubt reports it as off, because a
 * needless reminder costs a click while a missed one leaves the viewer slow.
 */

/** Renderer names reported by software WebGL implementations. */
const softwareRenderers = [
  'swiftshader', // Chromium's CPU fallback when acceleration is disabled
  'llvmpipe', // Mesa CPU rasteriser on Linux
  'softpipe',
  'lavapipe',
  'software', // "Software Adapter", "Google SwiftShader (Software)", ...
  'microsoft basic render driver', // Windows without a real GPU driver
  'basic render',
  'gdi generic', // Windows OpenGL 1.1 fallback
  'apple software renderer',
  'warp', // Direct3D WARP CPU rasteriser
];

export type AccelerationSignals = {
  /** A WebGL context could be created at all. */
  webgl: boolean;
  /** A context requested with `failIfMajorPerformanceCaveat: true` succeeded. */
  performant: boolean;
  /** Unmasked (or masked) renderer string, when the browser shares one. */
  renderer?: string;
};

/** True when the renderer string names a CPU rasteriser. */
export function isSoftwareRenderer(renderer: string) {
  const name = renderer.toLowerCase();
  return softwareRenderers.some((needle) =>
    needle === 'warp' ? /\bwarp\b/.test(name) : name.includes(needle),
  );
}

/** Acceleration is on only when WebGL works, is performant and is not software. */
export function isAccelerated(signals: AccelerationSignals) {
  if (!signals.webgl || !signals.performant) return false;
  return !(signals.renderer && isSoftwareRenderer(signals.renderer));
}

type Context = WebGLRenderingContext | WebGL2RenderingContext;

function probe(options: WebGLContextAttributes) {
  const canvas = document.createElement('canvas');
  const gl = (canvas.getContext('webgl2', options) ??
    canvas.getContext('webgl', options)) as Context | null;
  return gl;
}

function release(gl: Context | null) {
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
}

function rendererName(gl: Context) {
  try {
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const name = debug
      ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    return typeof name === 'string' ? name : undefined;
  } catch {
    return undefined;
  }
}

/** Read the live signals from the browser. Never throws. */
export function readAccelerationSignals(): AccelerationSignals {
  try {
    const strict = probe({ failIfMajorPerformanceCaveat: true });
    if (strict) {
      const renderer = rendererName(strict);
      release(strict);
      return { webgl: true, performant: true, renderer };
    }
    const fallback = probe({});
    const renderer = fallback ? rendererName(fallback) : undefined;
    release(fallback);
    return { webgl: fallback !== null, performant: false, renderer };
  } catch {
    return { webgl: false, performant: false };
  }
}

/** Whether the browser appears to render WebGL on the GPU. */
export function hasHardwareAcceleration() {
  return isAccelerated(readAccelerationSignals());
}
