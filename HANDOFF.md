# PC Anatomy — handoff

Updated: 2026-09-12.

An interactive, open-source explorer of a desktop computer. The machine is the
root; you take it apart, pick a component, and descend into that component's own
disassembly. The graphics card and its Blackwell architecture — the project's
original subject, when it was called DieDive — are now one branch of it,
unchanged internally.

Repository: <https://github.com/Yoosseph/gpu_anatomy> (folder name predates the
rename). Branch `main`. Workspace: `C:\Users\Yoseph\Desktop\personal_projects\gpu_anatomy`.

## Run it

```bash
npm ci
npm run dev        # http://127.0.0.1:5173/

npm run check      # strict tsc
npm run lint       # oxlint
npm test           # node --experimental-strip-types --test
npm run build      # tsc --noEmit && vite build
npm run start      # production preview
```

Node >=22.13. `npm test` uses Node's native type stripping, not tsx — which is
why `lib/scene.ts` cannot be imported from a test: it imports `./models`
without a `.ts` extension. Anything a test needs to reach lives outside it
(`lib/picking.ts` was split out of the scene for exactly this reason).

React 19 + strict TypeScript + Vite 8 + Three.js used directly. No
react-three-fiber. Tailwind 4 with generated shadcn/Base UI primitives. The 3D
engine is dynamically imported so it lands in its own chunk. `app/layout.tsx`
and `next.config.ts` are unused starter remnants; the entry point is
`index.html` → `app/main.tsx`.

## The scale tree

Exploration is data, not code. `lib/levels.ts` is the whole structure; adding a
scale means adding an entry there, a concept file, a geometry builder, and one
line in the `builders` registry.

| Scale | Parent | Menu | Concepts | State |
| --- | --- | --- | ---: | --- |
| `pc` | — | root | 17 | built |
| `motherboard` | pc | Motherboard | 24 | built |
| `cpu` | motherboard | Motherboard | 4 | **placeholder** |
| `psu` | pc | Power supply | 17 | built |
| `fan` | pc | Cooling | 8 | built |
| `cooler` | pc | Cooling | 8 | built |
| `disk` | pc | Storage | 10 | built |
| `card` | pc | GPU | 40 | built |
| `die` | card | GPU | 9 | built |
| `gpc` | die | GPU | 3 | built |
| `tpc` | gpc | GPU | 2 | built |
| `sm` | tpc | GPU | 9 | built |

151 concepts total. The sidebar groups scales by `branchLabel`, not by branch
root — which is why `fan` and `cooler` share one "Cooling" menu instead of
nesting. A scale marked `detailed: false` is listed with a "placeholder" note;
`cpu` is the only one left.

Each level declares `phases` (the named stops along the 0–100 disassembly) and
`spread` (how far apart the inventory pushes its pieces — big assemblies need
more). `concept` names the component one scale up that opens it, and that
component must carry `open: '<level>'`. Tests enforce both directions.

## Where the implementation lives

| File | Responsibility |
| --- | --- |
| `lib/levels.ts` | The scale tree: parents, phases, spread, menu grouping. |
| `lib/concept.ts` | The `Concept` shape, categories, colors, accuracy strings. |
| `lib/concepts/*.ts` | The text: one file per branch. Ids are global — collisions are a real hazard. |
| `lib/sources.ts` | Every citable reference. |
| `lib/manifest.ts` | Composes the concept files; search, level paths, state transitions. |
| `lib/models.ts` | `builders` registry + the shared `material()` helper. |
| `lib/machine.ts` | The PC itself (1 unit ≈ 35 mm), ATX constants, RGB palette. |
| `lib/mainboard.ts`, `processor.ts`, `power-supply.ts`, `fan-unit.ts`, `cooler.ts`, `disk.ts` | One geometry builder per scale. |
| `lib/parts.ts` | Shared realistic parts: fans, fin stacks, screws, connectors, `glowMaterial`, `buildLightStrip`. |
| `lib/hardware.ts` | `ModelTools` — the `add` / `box` / `instances` / `label` interface every builder is handed. |
| `lib/scene.ts` | Renderer, lights, orbit, visibility, the dive ramp, camera fitting, disposal. |
| `lib/picking.ts` | `resolvePick` — the see-through picking policy. Separate from the scene so tests can import it. |
| `lib/layout.ts` | `inventoryLayout`, `spatialInventory`, `smoothstep`. |
| `app/page.tsx` | Sidebar, menus, search, detail panel, disassembly control. |
| `app/viewer.tsx` | React ↔ Three bridge; async init, hover, error state. |
| `app/globals.css`, `app/workbench.css` | The visual direction. |

## Conventions that matter

**Geometry is millimetres.** Every builder opens with a local `mm()` helper
converting to scene units, and states its scale in the file header. The PC is
1 unit ≈ 35 mm, the cooler 11 mm, the disk 8 mm. Keep it.

**`add(concept, object, pos, delta?, reveal?)`.** `delta` is the direction the
piece travels as you disassemble. `reveal` is the disassembly fraction below
which the piece is hidden — and it is only for parts that are genuinely
*inside* something. An assembled cooler must look like a cooler; putting a
`reveal` on the fin stack meant the assembled view was a bare coldplate. This
was a real bug, fixed on 2026-09-12. The rule: if you could see it before
picking up a screwdriver, `reveal` is 0.

**Every rendered object belongs to a named concept.** `tests/models.test.ts`
enforces it. An unnamed mesh is one the viewer can hover and get nothing from,
which is the complaint that produced the rule.

**Rotation traps.** `buildFinStack` rotates fins by `π/2` on Z, so the *first*
size component becomes the fin's height, not its length. Three heatsinks once
shipped metre-tall fins because of this. `buildBlockSink` needs `rotation.x =
+π/2` or its fins bury themselves in the board.

**Shine is contrast, not brightness.** High `envMapIntensity` and low roughness
on metals, restrained key light. Raising overall exposure washes everything to
chalk — that was tried and reverted.

**Emissive materials do not light anything.** RGB needs `glowMaterial` for the
surface *and* a `PointLight` beside it.

## Sourcing rules

`concept()` defaults `sources` to `['specs']` — the NVIDIA RTX 5090 page — for
any physical concept that does not name its own. This silently produced 49
components citing NVIDIA for drive cages, CMOS batteries and audio codecs. That
was corrected on 2026-09-12: sources were reassigned where a real reference
applies, and set to `[]` where none honestly does. **19 concepts now cite
nothing, deliberately.** Sheet metal, fin stacks and grilles do not need a
vendor document, and inventing one is worse than admitting there is none.

`tests/manifest.test.ts` checks that every cited id resolves and that no
concept cites the same source twice. It does not require a citation to exist.

**Still unfixed:** the `card` / `die` GPU concepts predate this cleanup and many
still default to `['specs']`. Some of those are legitimate; some are not. Worth
an audit.

The full reference list is in `lib/sources.ts` and `SOURCES.md`. Primary for the
GPU branch is the NVIDIA Blackwell whitepaper v1.1, pages 8–12 and 46–48:

| Configuration | GPC | TPC | SM | L2 |
| --- | ---: | ---: | ---: | ---: |
| RTX 5090 shipping | 11 | 85 | 170 | 96 MB |
| Full GB202 | 12 | 96 | 192 | 128 MB |

The GPC drill-down is a representative *full* GPC, not a map of which TPCs are
enabled in the shipping card. Per SM: 128 CUDA, 4 Tensor, 1 RT, 4 texture units,
256 KB registers, 128 KB combined L1/shared.

Nothing here claims a specific product's bill of materials. Every physical
concept carries a `physicalAccuracy` string saying so, and they are not
decorative — read one before adding a component that implies more precision
than the model has.

## Interaction decisions worth not re-litigating

- **The dive is a zoom, not a scene change.** Clicking a component scales the
  rest of the stage away while the camera closes on it, then swaps in the
  deeper scale, which grows back in. The ramp is owned by `lib/scene.ts`, not by
  React timers — timers drifted against the render loop.
- **The detail panel is suppressed mid-dive.** `selected` is null while
  `state.diveInto` is set. Otherwise the outer component's panel flashes for a
  few hundred milliseconds before the deeper scale replaces it.
- **Menus do not nest.** Clicking GPU opens a menu of every GPU scale; you pick
  one. Chaining "click deeper, another row appears" was explicitly rejected.
- **Glass is see-through to the cursor.** `resolvePick` steps past transparent
  surfaces. Before it existed the side panel answered for the whole machine and
  nothing inside the case could be hovered.
- **Text is expensive.** Repeated feedback: less prose, fewer labels, no
  strapline, no footer. When in doubt, cut it.

## Verification

Passing as of 2026-09-12:

- `npm run check` — clean.
- `npm run lint` — clean.
- `npm test` — 18 tests. Manifest identities, parent reciprocity, cycles, source
  resolution, SKU counts, search behaviour, reachability of every scale,
  inventory non-overlap across aspect ratios, spatial inventory depth, picking
  through glass, and the every-object-is-named rule.
- `npm run build` — clean. ~461 KB app JS + ~682 KB lazy scene JS + ~196 KB CSS
  (~146 / ~181 / ~32 KB gzip).
- Headless Chromium (SwiftShader) through `cooler`, `disk` and `fan` at 0 / 50 /
  100 % disassembly: no console errors, correct part counts at each stop.

Testing notes for whoever automates the browser next:

- `page.click()` fails Playwright's stability check on this app even on
  provably still elements. Use `page.evaluate(el => el.click())`.
- `deviceScaleFactor: 1` is required or screenshots time out under SwiftShader.
- The `data-*` diagnostics on `.viewport` (`data-level`, `data-visible`,
  `data-explode`, `data-draw-calls`, `data-triangles`) lag several seconds
  behind a level change under software rendering. Wait, don't poll tightly.
- There is no URL routing. Drive navigation by clicking `button.branch-head`
  then the entry in `.branch-scales`.

**Not verified:** real touch and pinch input, the tablet and small-phone matrix
(390×844, 320×568, landscape), and a clean-run console audit across every
scale. Do not report those as passing.

## Open work

1. **`cpu` is a placeholder.** It is the one scale in the menu that does not
   deliver. Cores, cache, memory controller — the tree the project was
   restructured around originally named it.
2. **Audit the GPU branch's citations** (see Sourcing rules above).
3. **The disk's interior reads poorly at mid-disassembly.** The base walls
   occlude the mechanism from the default camera angle before the parts have
   travelled far enough. Either raise the internals faster or tilt the framing.
4. **Platters render matte.** `metalness: 1, roughness: 0.055,
   envMapIntensity: 2.4` is set but there is little in the environment to
   reflect. They should be mirrors.
5. **Inventory layout still flattens size relationships** for very mixed
   assemblies. `spatialInventory` preserves relative size better than the old
   grid, but a screw next to a side panel is still awkward.
6. **The scene chunk is 682 KB.** Three.js is most of it. Worth a look if
   mobile load time matters.
7. Dependency advisories from `npm ci` have never been triaged.

## Hosting

`.openai/hosting.json` holds a registered but **undeployed** Sites project
(`appgprj_6aa1e09f9f3c8191b741362d1ce34bc9`, static directory `dist`). Do not
create a duplicate. Any credential from that registration has expired and is not
in the repo. Otherwise: `npm run build`, serve `dist/`.
