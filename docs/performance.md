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

## Remaining costs

Procedural model construction is synchronous and still substantial (roughly
0.2–1.8 seconds for these four models in the CPU-only samples). Detailed nested
assemblies, geometry merging, generated textures, shader compilation, shadows
and continuous visible animations remain potential sources of load. This pass
does not remove model detail or lower quality to hide those costs. A subsequent
startup or GPU-focused change should profile those separately on real hardware;
the CPU raycast improvements should not be presented as solving GPU-bound lag.
