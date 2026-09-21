# PC Anatomy — architecture

Read this before changing anything. It is written for whoever picks the project
up next, person or language model, and it assumes you have not seen the code
before. [README.md](README.md) explains what PC Anatomy is and what it looks
like; this file explains how it is built and what will bite you.

Most of what follows is a decision that already went one way once. Where a rule
sounds arbitrary, it is usually the scar of a bug.

## What it is, technically

A static single-page app. Every polygon is generated in TypeScript at runtime
with three.js — no imported meshes, no image textures, no runtime asset files of
any kind. The 343 catalogue entries are authored in source, and each one
is joined to its geometry by a single string id.

React 19, strict TypeScript, Vite 8, Tailwind 4, and three.js used directly:
no react-three-fiber. UI primitives under `components/ui/` are generated
shadcn/Base UI files and are excluded from linting. The entry point is
`index.html` → `app/main.tsx` → `app/page.tsx`. The 3D engine is imported
dynamically inside `app/viewer.tsx`, so three.js lands in its own chunk and the
interface paints before it arrives.

## Run it

Node 22.13 or newer.

```bash
npm install
npm run dev       # vite dev server, http://127.0.0.1:5173/

npm run check     # tsc --noEmit, strict
npm run lint      # oxlint
npm run format    # oxfmt
npm test          # node --experimental-strip-types --test tests/*.test.ts
npm run build     # tsc --noEmit && vite build
npm start         # preview the production build
```

Two things about the toolchain are worth knowing before you debug them:

**Native binaries are per-platform.** oxlint, oxfmt, rolldown (inside Vite) and
lightningcss ship compiled binaries. A `node_modules` installed on one operating
system cannot run them on another — for example from a Linux shell against a
Windows checkout. `tsc` and the test suite are pure JavaScript and run anywhere,
so those two are always available; the rest need a matching install.

**`npm test` uses Node's native type stripping, not a bundler.** There is no
path-alias resolution and no extensionless import resolution. Every module a
test reaches must import with explicit `.ts` extensions all the way down.
`lib/scene.ts` imports `./models` without one, so it cannot be imported from a
test at all — which is why `lib/picking.ts` exists as a module of its own rather
than living inside the scene. If you want new logic under test, keep it out of
`scene.ts`.

## How it fits together

Four layers, joined by the concept id.

```text
lib/levels.ts        the scale tree: what scales exist, what opens into what
      │
lib/concepts/*.ts    the written catalogue, composed by lib/manifest.ts
      │              343 entries, each with a globally unique id
      │
lib/models.ts        one geometry builder per scale, handed `ModelTools`.
      │              Builders attach geometry to concept ids via add()
      │
lib/scene.ts         renderer, lights, camera, picking, the explode
                     interpolation and the dive ramp
      │
app/                 React: what the viewer is currently looking at
```

The concept id is the join. The same string appears in the catalogue entry, in
the builder's `add()` call, in the search index, in the selection state and in
the detail panel. Nothing else ties them together, which is why ids are global
and why a collision between two catalogue files is a real hazard rather than a
theoretical one.

Exploration is data, not code. Adding a scale means adding an entry to
`lib/levels.ts`, a concept file, a geometry builder, and one line in the
`builders` registry. There is no route table and no URL routing — navigation is
state.

## The scale tree

32 scales, 343 concepts. `physical` scales are lit like hardware and keep real
size relationships in the inventory; `logical` scales are block diagrams and are
lit flat.

| Scale | Parent | Menu | Kind | Concepts |
| --- | --- | --- | --- | ---: |
| `pc` | — | root | physical | 16 |
| `motherboard` | `pc` | Motherboard | physical | 24 |
| `dimm`        | `motherboard` | Memory           | physical |        6 |
| `dram` | `dimm` | Memory | physical | 3 |
| `banks` | `dram` | Memory | logical | 2 |
| `bank` | `banks` | Memory | logical | 5 |
| `ryzen` | `motherboard` | Motherboard | logical | 6 |
| `ryzenio` | `ryzen` | Motherboard | logical | 5 |
| `corei9` | `motherboard` | Motherboard | logical | 9 |
| `coreio` | `corei9` | Motherboard | logical | 4 |
| `psu` | `pc` | Power supply | physical | 17 |
| `psubronze` | `pc` | Power supply | physical | 17 |
| `fan` | `pc` | Cooling | physical | 8 |
| `cooler` | `pc` | Cooling | physical | 8 |
| `liquid` | `pc` | Cooling | physical | 9 |
| `ssd` | `pc` | Storage | physical | 8 |
| `nvme` | `motherboard` | Storage | physical | 6 |
| `card` | `pc` | GPU · RTX 5090 | physical | 40 |
| `die` | `card` | GPU · RTX 5090 | logical | 9 |
| `gpc` | `die` | GPU · RTX 5090 | logical | 3 |
| `tpc` | `gpc` | GPU · RTX 5090 | logical | 2 |
| `sm` | `tpc` | GPU · RTX 5090 | logical | 9 |
| `rx9070` | `pc` | GPU · RX 9070 XT | physical | 40 |
| `navi48` | `rx9070` | GPU · RX 9070 XT | logical | 11 |
| `rxse` | `navi48` | GPU · RX 9070 XT | logical | 5 |
| `rxwgp` | `rxse` | GPU · RX 9070 XT | logical | 3 |
| `rxcu` | `rxwgp` | GPU · RX 9070 XT | logical | 12 |
| `arcb580` | `pc` | GPU · Arc B580 | physical | 36 |
| `bmg` | `arcb580` | GPU · Arc B580 | logical | 7 |
| `xeslice` | `bmg` | GPU · Arc B580 | logical | 3 |
| `xecore` | `xeslice` | GPU · Arc B580 | logical | 4 |
| `xve` | `xecore` | GPU · Arc B580 | logical | 6 |

Menus are grouped by `branchLabel`, not by branch root, which is why the case
fan, the tower cooler and the AIO share one Cooling heading instead of nesting.
The GPU menu has sub-menus: each card declares `submenu`, and every scale beneath
it is listed under that card. The Power supply menu lists its two models directly.

Five scales are marked `alternative: true`: the second processor, the liquid
cooler, the two graphics cards and the fixed-cable PSU the tower does not carry.
Only one cooler bolts to one socket, only one processor sits in it, one card is
installed and the tower carries one supply —
so these are real scales with real content that simply have nothing to click on
at the scale above. They are reached from their subsystem menu instead. The flag
is what keeps the "every scale is reachable" test honest without forcing the
machine to carry two coolers and three cards at once.

Each `LevelDef` also declares `phases` — the named stops along the 0–100
disassembly slider — and optionally `spread`, which multiplies how far pieces
travel as they come apart. A tower needs far bigger gaps than a card before its
subsystems stop touching.

## Where the code lives

| Path | Responsibility |
| --- | --- |
| `lib/levels.ts` | The scale tree: parents, kind, phases, spread, menu grouping. Also `levelPath`, `branchRoot`, `submenuRoot`, `branches`, `menuRoot`. |
| `lib/concept.ts` | The `Concept` shape, the eight categories and their colours, the three accuracy strings, and the `concept()` factory. |
| `lib/concepts/*.ts` | The written catalogue, one file per subsystem. Ids are global. |
| `lib/sources.ts` | Every citable reference, keyed by id. 63 of them. |
| `lib/manifest.ts` | Composes the catalogue, wires parents to children, and answers questions about it: `byId`, `searchConcepts`, `openLevel`, `levelConcept`. Nothing about the current view. |
| `lib/explorer-state.ts` | `ExplorerState` — what the viewer is looking at — plus `initialState` and `selectSearch`. |
| `lib/models.ts` | The `builders` registry, the `Piece` type, the shared `material()` cache, and `buildModel(level)`. |
| `lib/hardware.ts` | `ModelTools`, the interface every builder is handed, and the RTX 5090 card assembly. |
| `lib/machine.ts` | The tower itself: ATX constants, chassis, cable routing, RGB palette. |
| `lib/mainboard.ts`, `power-supply.ts`, `fan-unit.ts`, `cooler.ts`, `liquid.ts`, `ssd.ts`, `nvme.ts`, `processor.ts`, `io-die.ts` | Builders for physical or logical scales. `power-supply.ts` builds both TUF exteriors from one illustrative conversion chain. |
| `lib/dimm.ts`, `lib/dram.ts`, `lib/ram-architecture.ts` | Builders for the memory dive: the DDR5 module and one DRAM package as physical scales, the bank array and one bank as logical diagrams. |
| `lib/graphics-card.ts`, `card-kit.ts`, `radeon-card.ts`, `arc-card.ts` | The three graphics cards. `card-kit.ts` holds the millimetre-scale parts all three share. |
| `lib/gpu-architecture.ts`, `radeon-architecture.ts`, `arc-architecture.ts` | The chip block diagrams. |
| `lib/diagram-kit.ts` | The shared visual language of those diagrams — `put`, `backdrop`, `block` — with a palette per chip. Navi 48 and BMG-G21 draw from it; the GB202 scales predate it and build their own scenery. |
| `lib/airflow.ts` | Where the air goes: the chevron, the sampling and marching of a path, `cardAirflow` for the three cards, `airflowStrength`, the curve that takes it off screen as the machine opens, and `airflowShown`, which decides whether a scale draws it at all. |
| `lib/parts.ts` | Shared realistic parts: fans, grilles, fin stacks, capacitors, chokes, slots, ports, screws, `glowMaterial`, `buildLightStrip`. |
| `lib/materials.ts` | The ten surface finishes and `temperedGlass`. |
| `lib/surfaces.ts`, `pcb.ts`, `silicon-texture.ts` | Generated material maps. No downloaded textures. |
| `lib/board-details.ts` | Representative support circuitry and mechanical subassemblies. |
| `lib/scene.ts` | Renderer, lights, orbit, visibility, camera fitting, the dive ramp, disposal. Returns `{ update, dispose }`. |
| `lib/picking.ts` | `resolvePick` / `resolvePickNear` — the see-through picking policy. Deliberately outside the scene so tests can import it. |
| `lib/layout.ts` | `inventoryLayout`, `hardwareInventory`, `spatialInventory`, `smoothstep`, `Vec3`. |
| `app/page.tsx` | Composition only. Which panels exist and in what order. |
| `app/use-explorer.ts` | All explorer state and every named move: navigate, dive, arrive, choose, isolate, hide, and the rest. |
| `app/topbar.tsx`, `scale-nav.tsx`, `systems-list.tsx`, `stage-heading.tsx`, `stage-tools.tsx`, `disassembly.tsx`, `search-dialog.tsx`, `detail-panel.tsx`, `about-dialog.tsx` | One panel each. |
| `app/viewer.tsx` | The React ↔ three.js bridge: lazy scene load, hover label, error state. |
| `app/links.ts` | Destinations used by more than one panel. |
| `app/globals.css`, `app/workbench.css` | The visual direction, desktop through phone. |
| `tests/*.test.ts` | 63 tests: catalogue integrity, layout, picking, geometry presence, airflow, the RAM dive. |
| `scripts/generate-icons.mjs` | Rasterises `public/favicon.svg` into PNG and ICO variants. Uses Playwright and Edge. |
| `scripts/generate-reference-index.mjs` | Regenerates `docs/component-references.md` from the catalogue. Run it after changing citations. |

## The interfaces you will touch

**`ModelTools`** (`lib/hardware.ts`) is what every builder receives:

| Member | What it does |
| --- | --- |
| `add(concept, object, pos, delta?, reveal?)` | Registers an object as one selectable piece of a named concept. |
| `instances(concept, positions, size, reveal?, color?, geometry?)` | The same, for many identical pieces drawn as one instanced mesh. |
| `box(size, color, metal?, r?)` | A rounded box in the shared material cache. |
| `pcb(size, variant?)` | A circuit board: routed faces, bare laminate on the cut edges. |
| `material(color, metal?, rough?)` | The cached standard material. |
| `label(parent, text, pos, width, color?)` | 3-D text, sized to a width rather than a font size. |
| `assembly(level)` | Reuses a detailed scale as one installed, selectable assembly — how the motherboard and the card appear inside the tower. |
| `airflow(streams)` | Chevrons marching along the paths this build moves air along. Scenery, not parts: see the convention below. |

`delta` is the direction a piece travels as the machine comes apart. `reveal` is
the disassembly fraction below which a piece is hidden, and it defaults to 0.

**`Piece`** (`lib/models.ts`) is what a builder produces: the object, its base
and exploded positions, its inventory slot, its concept and instance number, and
its visibility. The scene animates pieces; it never re-reads the catalogue.

**`ExplorerState`** (`lib/explorer-state.ts`) is the whole of what the viewer is
looking at: level, explode 0–100, visible categories, hidden ids, selection,
isolated, camera view, the airflow mode, and three revision counters. `cameraRevision` and
`focusRevision` exist so that asking for the same camera twice still moves it;
`diveRevision` starts a dive. The scene watches the revisions, not the values.

## Conventions that matter

**Geometry is millimetres.** Every builder opens with a local `mm()` converting
to scene units and states its scale in the file header: the tower is 1 unit ≈
35 mm, the motherboard 22, the AIO 14, the power supply 12, the tower cooler 11,
the case fan 9, the SSD 8. The three graphics cards share `MM` from
`card-kit.ts`, which is sized so all three come out at their true relative
lengths. Keep this. A builder without an `mm()` is a builder whose numbers mean
nothing.

**Every rendered object belongs to a named concept.** `tests/models.test.ts`
enforces it. An anonymous mesh is one a viewer can hover and get nothing from.
The only exception is scenery explicitly marked `userData.contextFrame`.

**`reveal` is for things genuinely inside something.** If you could see it
before picking up a screwdriver, `reveal` is 0. Putting a reveal on a cooler's
fin stack once meant the assembled cooler rendered as a bare coldplate.

**Ids are global across every catalogue file.** The Radeon branch prefixes
everything `rx` and the Arc branch `arc` precisely because the original GPU
catalogue claimed bare names like `fan` and `pcb`. A duplicate id fails the
tests, but only after you have written the geometry.

**Airflow is authored, not derived, and it is never a part.** A builder states
the path its build actually moves air along and hands it to `tools.airflow`;
nothing reads a fan's transform and blows air along its axis. It cannot:
`buildFan` contradicts itself about which face is the intake — the lit ring and
the finger guard are on +Y, documented as the intake face, while the builder's
own header says it blows along +Y — and the callers are split on which of those
they believed. Air that followed the geometry would leave the tower through the
front panel. The chevrons carry `contextFrame`, refuse raycasts outright, and
fade out over the first tenth of the disassembly, because a path through a
machine is a claim about a machine that is closed.

**Shine is contrast, not brightness.** High `envMapIntensity` and low roughness
on metals, restrained key light. Raising overall exposure washes everything to
chalk; that was tried and reverted.

**Emissive materials do not light anything.** RGB needs `glowMaterial` for the
surface *and* a `PointLight` beside it.

**Nothing is downloaded at runtime.** Material maps are generated in
`surfaces.ts`, `pcb.ts` and `silicon-texture.ts`. If you find yourself reaching
for a texture file, you are solving it the wrong way.

**When a model is rebuilt, the scene clears its cached `layoutSignature`.**
Otherwise returning to a scale leaves every piece with an inventory position of
zero, heaped at the origin.

## The interface layer

`app/page.tsx` is composition and nothing else: it renders the panels in order
and wires them to `useExplorer`. It holds only the state no panel owns — whether
the search palette and about dialog are open, and the part count the viewer
reports.

`app/use-explorer.ts` owns everything else about the current view and exposes it
as named moves rather than state patches. A panel calls `navigate`, `dive`,
`toggleCategory`, `isolate` or `hide`; it never assembles an `ExplorerState`
itself. State that only one panel cares about lives in that panel — which system
is unfolded is inside `systems-list.tsx`, whether the window is fullscreen is
inside `stage-tools.tsx`.

Three interaction decisions are settled, and re-opening them has been tried:

- **The dive is a zoom, not a scene change.** Clicking an explorable component
  scales the rest of the stage away while the camera closes on it, then swaps in
  the deeper scale, which grows back out of the same spot. The ramp is owned by
  `lib/scene.ts`, not by React timers — timers drifted against the render loop.
  `diveInto` is the whole record of a dive in flight, so cancelling one is just
  clearing it.
- **The detail panel is suppressed mid-dive.** `selected` is null while
  `diveInto` is set, or the outer component's panel flashes for a few hundred
  milliseconds before the deeper scale replaces it.
- **Glass is see-through to the cursor.** `resolvePick` steps past transparent
  surfaces. Before it existed, the side panel answered for the whole machine and
  nothing inside the case could be hovered.
- **Airflow is a preference, and its default belongs to the scale.**
  `state.airflow` is `auto`, `on` or `off`, and `airflowShown` resolves it.
  `auto` draws air wherever there are fans except on the assembled machine:
  that is the scale a viewer arrives at, the case is closed, nothing has moved
  yet, and four streams crossing an untouched tower is a lot to meet first.
  It is also the one scale where a viewer might never think to look for the
  control, which is why that control is a labelled switch beside the camera
  row rather than a glyph inside it. Saying either way holds on every scale
  until Reset, so returning to the tower having asked for air does not switch
  it off again. The switch is absent where there are no fans, and airflow
  follows the Cooling category — hide the fans and the arrows go with them.

## Adding a component

A component joins the written catalogue to selectable geometry through its id.

1. Add the concept to the right file in `lib/concepts/`. Follow a neighbour: it
   needs a unique `id`, scale, parent, category, representation type,
   description, purpose, quantity, specifications and source ids.
2. In that scale's builder, create the geometry and pass the same id to `add` or
   `instances`. The helper supplies selection identity, explode placement,
   inventory layout and counting.
3. Add any new reference to `lib/sources.ts` and document it in `SOURCES.md`,
   then regenerate the index:
   `node --experimental-strip-types scripts/generate-reference-index.mjs`.
4. If the concept lives in a new catalogue file, export its array and compose it
   into `lib/manifest.ts`.
5. Run the checks. The tests reject anonymous geometry, duplicate ids, broken
   parent links, and scales with nothing to render.

Do not introduce a reveal threshold for assembled geometry. A component that
exists in the assembled product exists at slider position zero and moves
continuously as the product comes apart.

## Adding a scale

Five integration points, and the tests check both directions of the link:

1. Add the id and its `LevelDef` to `lib/levels.ts` — parent, kind, concept,
   phases, navigation text, and `spread` if its assemblies are large.
2. Write the geometry builder and register it in the `builders` map in
   `lib/models.ts`.
3. Add its written catalogue under `lib/concepts/`.
4. Put `open: '<new-level-id>'` on the concept one scale up that leads into it.
   A complete alternative the machine does not carry sets `alternative: true`
   instead and is reached from its subsystem menu; `submenu` gives it a dropdown
   of its own inside that menu.
5. Export and compose the new concepts in `lib/manifest.ts`.

The scale tree drives navigation, breadcrumbs, lighting and the disassembly
timeline. Do not add a second hand-written route table.

## Sourcing rules

Every technical claim points at an entry in `lib/sources.ts`. Standards bodies
and vendor documentation first. All 343 concepts currently cite at least one
source, and `docs/component-references.md` is the generated index of which.

`concept()` fills in a default when an entry names no sources — `specs` for a
physical concept, `whitepaper` for a logical one. **This is a trap.** It once left
components across the machine silently citing NVIDIA for drive cages and CMOS
batteries.
Name your sources explicitly, and if no honest reference exists, say so with
`sources: []` rather than inheriting one. Sheet metal and fin stacks do not need
a vendor document, and inventing one is worse than admitting there is none.

`tests/manifest.test.ts` checks that every cited id resolves and that no concept
cites the same source twice. It does not check that a citation is appropriate.

Nothing here claims a specific product's bill of materials. Every physical
concept carries a `physicalAccuracy` string saying so, and they are not
decorative — read one before adding a component that implies more precision than
the model has. 238 concepts are physical, 105 are logical diagrams.

## Tests

63 tests, all through Node's built-in runner.

`.github/workflows/ci.yml` runs `npm ci`, type checking, linting, tests, and a
production build on every push and pull request with Node.js 22.

- `tests/manifest.test.ts` (16) — unique ids, reciprocal parents, no cycles,
  source resolution, SKU counts against full-chip capacity, search behaviour,
  reachability of every scale, the three-stage dissection language, inventory
  packing without overlap at several aspect ratios, machine depth.
- `tests/models.test.ts` (18) — geometry presence and identity for every scale,
  ATX outline compliance, clearances between sockets, slots and armour, fits
  (M.2 packages under their covers, DDR5 notches), picking through glass,
  instanced pieces staying pickable after the layout moves them, and the rule
  that no rendered object is anonymous.
- `tests/gpus.test.ts` (10) — the three-card menu structure, published hierarchy
  counts multiplying out to published totals, diagram blocks not overlapping,
  each card's published construction and envelope, board passives not
  intersecting, and search reaching the new chips at their own scale.
- `tests/airflow.test.ts` (8) — that the scales drawing airflow are exactly the
  ones `airflowLevels` names (the stage tools offer the control from that
  list), that the installed card brings its own streams into the tower, that
  the chevrons are scenery no ray can reach, that the explorer opens on a quiet
  machine while every other scale starts drawing, that the fade is monotonic
  and over by a tenth, that the chevrons march and stop on command, that no
  stream strays far from the hardware it describes, and that the tower's air
  enters at the front and leaves at the back.
- `tests/ram.test.ts` (11) — the Memory menu order and the open chain down to
  the cell array, bank counts multiplying out to the 16 Gb x8 organisation,
  diagram blocks not overlapping, the module outline with its keyed contact
  edge, the empty key cutout, the 288-pin finger count and face clearance,
  bank-group membership, the spreader cladding with a clear contact field,
  pad seating between chips and plate, the package stack order, named geometry
  on every new scale, and search reaching the module and the cells at their
  own scales.

The suite builds every scale, so a geometry regression usually surfaces as a
failing assertion rather than a silent visual change.

## What is verified, and what is not

Keep this section honest; it is the part a newcomer will trust.

- `npm run check` and `npm test` run on any platform and are the baseline.
- `npm run lint`, `npm run format` and `npm run build` need a `node_modules`
  installed for the machine you are running them on. A cross-platform checkout
  cannot run them, and "lint passes" must not be reported from a machine that
  could not execute oxlint.
- **Real touch and pinch input is not verified**, nor is the full tablet and
  small-phone matrix, nor a clean console audit across every scale. Do not
  report those as passing.

If you automate a browser against this app:

- `page.click()` fails Playwright's stability check here even on provably still
  elements. Use `page.evaluate(el => el.click())`.
- `deviceScaleFactor: 1` is required, or screenshots time out under SwiftShader.
- `.viewport` carries `data-level`, `data-visible`, `data-component-types`,
  `data-explode`, `data-draw-calls` and `data-triangles` for assertions. Under
  software rendering they lag several seconds behind a level change — wait for
  them, do not poll tightly.
- There is no URL routing. Drive navigation by clicking `button.branch-head`,
  then the entry in `.branch-scales`.

For UI work that is meant to change nothing visible, the strongest check is to
render the old and new trees and diff the markup: transpile with TypeScript's
`transpileModule`, stub `lib/scene.ts` with a fake `createViewer` that reports a
part count, mount both into jsdom, drive the same script of clicks through
`act`, and compare `document.body.innerHTML` at each step.

## Keeping this file honest

This document is only useful while it is true. When you change the scale tree,
move a module, or settle a decision the hard way, update the section that covers
it in the same change. If you are a model working on this repository, treat that
as part of the task rather than a follow-up.
