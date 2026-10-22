# Rendering performance

This pass starts from `ace99de` on main, including the merged notebook systems.
It preserves geometry, material quality, device pixel ratio, picking tolerance,
and disassembly behavior. It does not promise a particular frame rate.

## Costs addressed

- Both viewers reapplied every piece pose and invalidated instance matrices,
  colors and bounds on every frame, including camera-only and fan animation.
  `ModelPoseCache` now skips unchanged poses. Layout and visibility changes
  explicitly invalidate it, and dive transitions always apply their ramp.
- Camera fitting walked model pieces every interpolated camera frame. Explorer
  targets depend on state/layout, and comparison targets additionally depend on
  the current disassembly pose; those are now their invalidation boundaries.
- Pointer events raycast immediately and the render loop could raycast again in
  the same frame. Moves now queue the latest pointer position for the next frame.
  Clicks and inspection still resolve synchronously. Unchanged tooltip data no
  longer replaces React state on every animated frame.
- Merged hardware geometry often had no local bounding box, so a loose sphere
  hit could trigger a long triangle scan. Model construction now computes missing
  local boxes for Three.js's existing precise raycaster to reject misses early.
- Wake-ups budgeted 35 frames, and state changes budgeted 90, even after a scene
  stopped moving. The scheduler now budgets two extra frames, while animation
  and OrbitControls changes continue waking it. Hidden/collapsed rotors and the
  inactive mobile comparison pane no longer request continuous frames.

- Even with local boxes, a ray entering a merged chassis or board mesh still
  scanned every triangle in it (the Legion carries about 840k), and a hover miss
  casts nine rays. Heavy geometries now get a `three-mesh-bvh` bounds tree, built
  one geometry per idle callback after the model is drawn. Until its tree exists
  a mesh uses the ordinary scan. Hover also stopped re-picking on frames where
  only fans or airflow moved; it follows pointer, pose and camera changes.

## Measurements

Local Windows/Node CPU microbenchmark, median of seven batches of 81 downward
rays over a fixed 9 × 9 grid, assembled geometry. Before was measured on main
before editing the renderer; after used the same script and machine.

| Model | Before raycast (ms) | After raycast (ms) | Reduction |
| --- | ---: | ---: | ---: |
| Desktop PC | 8.8538 | 2.7302 | 69% |
| RTX 5090 | 0.5223 | 0.1708 | 67% |
| Legion | 8.5013 | 6.1958 | 27% |
| MacBook | 4.4790 | 4.1793 | 7% |

Bounds trees, same script and machine, per ray (the table above is also per ray):

| Model | Local boxes (ms) | Bounds trees (ms) | Reduction | Tree build (ms) |
| --- | ---: | ---: | ---: | ---: |
| Desktop PC | 2.7302 | 0.1667 | 94% | 141 |
| RTX 5090 | 0.1708 | 0.0396 | 77% | 11 |
| Legion | 6.1958 | 0.2185 | 96% | 165 |
| MacBook | 4.1793 | 0.1513 | 96% | 103 |

Over 400 angled rays per model, assembled and laid out, the trees returned the
same part, hit count and nearest distance as the scan, and the test suite checks
every intersection. Tree build is idle-time work, not part of model construction;
the largest single geometry took about 70 ms. The library adds about 16 KB gzipped
to the lazily loaded engine chunk and nothing to the entry chunk.

Unchanged pose updates measured below 0.0001 ms for the desktop/GPU and around
0.0001 ms for notebooks, versus 0.0015–0.0492 ms before. More importantly, their
instance buffer versions no longer change on those frames. The scheduler test
observes three draws for an isolated stationary wake-up instead of 36 or 91.

These numbers isolate CPU operations with a stubbed canvas API. They exclude
WebGL upload, shaders, GPU rendering, real texture drawing, and React. They are
not FPS measurements or guarantees across machines. Single model-build timings
were noisy and did not establish a startup improvement; computing boxes also
adds construction work. Moving-pose costs are essentially unchanged.

## Reproducing checks

```sh
npm run check
npm run lint
npm test
npm run build
npm run size
node --experimental-strip-types scripts/benchmark-rendering.mjs
npm start
```

With the preview running, set `NOTEBOOK_BASE_URL` to its URL, then run:

```sh
node scripts/performance-smoke.mjs
node scripts/notebook-smoke.mjs
```

The browser scripts default to Windows Edge with software rendering. Override
`BROWSER_EXECUTABLE` for another installed Chromium browser. The performance
smoke verifies a static diagram sleeps, pointer input wakes it, and it sleeps
again. The notebook smoke covers tray dives, reset, comparison, swapping sides,
desktop navigation, mobile-width navigation and deep links; it rewrites its
reference screenshots. Real touch/pinch and a real-device GPU matrix are not
covered. The CPU benchmark's optional `--baseline` disables pose caching and
all local boxes as a synthetic comparison; it is not an exact historical build.

## System switching and first load

Browser profiles of a swap from the system picker split the time between
building the model on the main thread and compiling its shaders on first draw.
Four changes address it, none of them reducing detail:

- Previously visited systems are parked instead of disposed and come back
  without rebuilding or recompiling.
- Rounded boxes, perforations, notebook plates and surface textures are shared
  across builds. A hidden `clone()` in the merge step generated a throwaway
  default `RoundedBoxGeometry` for every rounded part, which was the largest
  single cost of a notebook build.
- A new model's shaders compile in parallel through `compileAsync` before it is
  shown. Before, three.js compiled and waited for each of the desktop's
  programs in turn during the first frame.
- That precompile also covers the glass transmission pass's variants. Without
  them, 30 of the desktop's programs were still compiled one by one in the
  first frame.

`scripts/swap-timing.mjs` clicks the picker and times click to first drawn
frame, by default on the machine's GPU. Production builds, headless Edge, RTX
3070 Laptop GPU, three runs each:

| | Before | After |
| --- | ---: | ---: |
| Page load to desktop drawn | 3.5–8.5 s | 4.2–4.3 s |
| Desktop → Legion, first visit | 1.85–1.90 s | 0.90–0.95 s |
| Legion → MacBook, first visit | 0.81–0.89 s | 0.26–0.29 s |
| Any return to a visited system | 0.78–1.86 s | 9–23 ms |

The one fast "before" load probably hit a driver shader cache. Node build times
(warm) went from about 1.5 s to 0.3 s for the desktop, 0.96 s to 0.35 s for the
Legion and 0.51 s to 0.14 s for the MacBook.

## Remaining costs

A first visit still builds the model synchronously, roughly 0.2–0.6 s in the
browser, and six shadow-depth programs still compile in the first frame. The
comparison viewer parks models but does not precompile shaders, because it
toggles pane visibility itself. Parked models keep their GPU buffers (about
40–80 MB per full system); the shelf limit bounds that. Detailed nested
assemblies, shadows, the transmission pass and continuous animations remain
GPU costs; this pass does not lower quality to hide them, and the CPU
improvements should not be presented as solving GPU-bound lag.
