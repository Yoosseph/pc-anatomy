# Part comparison mode

Issue: [#8 Interactive comparison mode](https://github.com/Yoosseph/pc-anatomy/issues/8)

## Purpose

Let readers put any two explorable models side by side, from any system and
any scale, with a shared camera and disassembly timeline, and read each
model's catalogue specifications without ranking either product.

## Catalogue and discovery

Every level in `lib/levels.ts` is a comparison item; nothing opts in.
`lib/comparison-catalogue.ts` derives each item from its level and the concept
that opens it: name, summary, system, physical or logical kind, browser
category, specifications and physical scale. A new scale, branch or system
therefore appears in the picker with no comparison-view change.

Items are grouped into browser categories so the list stays navigable as the
catalogue grows: Complete systems, Boards, Processors, Graphics, Memory,
Storage, Cooling, Power & batteries, Displays and Chassis. System roots are
always Complete systems. Any other level takes the nearest
`LevelDef.comparisonCategory` on its path, so a GPU's die, GPC and SM stay in
Graphics and a memory module's package, bank and cell stay in Memory. A branch
with no explicit category falls back to its concept's catalogue category.
Notebook branches map their menu labels (System board, Battery, Display…) to a
category in `lib/notebook-levels.ts`. Categories with no items are hidden.

## Picker

Each side opens its own dialog. A reader narrows by category (a sidebar on
desktop, a scrolling strip on phones), by system, and by free text; the three
filters combine, and every search word must match the item's names, path,
category, search terms or specification text. Results are grouped by category
and show the path to the item, its summary and whether it is hardware or a
diagram. The model on the other side is disabled rather than hidden, so a pair
is always two distinct models. Choosing one side never changes the other.

Entering comparison starts from the scale the explorer was showing, paired with
a model of the same category and kind, preferring another system.

## Scale

Two framing modes:

- **Fit each** (default) frames each model to fill its own pane. Panes share
  orbit, pan and zoom in a normalized space, so rotating one rotates both,
  but sizes are not relative. Any pair works.
- **True size** places both models at one physical scale. It is available only
  when both levels declare `LevelDef.millimetersPerUnit`, the uniform
  millimetre-per-unit conversion their builder authors (the desktop tower at
  35, motherboard 22, modules 6, PSU 12, fans 9, cooler 11, liquid loop 14,
  drives 8, graphics cards 348/8.93, notebooks 20). Diagrams and models with
  exaggerated axes, such as the DRAM package drawn at 2.5× thickness, declare
  none. Choosing an uncalibrated model while in true size falls back to fit.

A new physical builder should declare its conversion only when every axis
uses it.

## Specifications

The sheet lists each model's own concept specifications. Values are never
borrowed from a child or parent part, because a fan's power or a die's core
count does not describe the assembly that contains it.

- Two items of the same category and kind share a table. Rows align by field
  label; a field only one side lists reads "Not listed", and differing values
  are highlighted without ranking.
- Unlike pairs (a CPU diagram against an SSD, a laptop against a cell) show
  two independent cards rather than a table of empty rows.

Each side also shows its modelling-accuracy note and cited sources.

## Behaviour

- The entry action sits in Explore by scale and returns focus there on exit.
- Explorer keyboard shortcuts are inactive while the workbench is open.
- Swapping sides reuses both built models and preserves the camera.
- At 700 CSS pixels and wider, one canvas renders two scissored panes, each
  lit for its own model. Narrower layouts render the selected A/B pane.
- One disassembly timeline drives both models, whatever their kinds.
- Reduced-motion users jump directly to requested disassembly states.

## Architecture

`comparison-catalogue.ts` builds and validates the catalogue, filters and
specification rows. `comparison-state.ts` owns pure state transitions and pane
coordinates. `comparison-framing.ts` converts each model's bounds to a pane
camera for both framing modes. `comparison-scene.ts` coordinates the two
models over the shared `stage-runtime.ts` and `model-stage.ts` primitives also
used by the normal explorer. One renderer, scene, orbit camera, controls pair
and animation loop are created per active workbench and synchronously disposed
on exit. The React side is `comparison-workbench.tsx` (composition),
`comparison-picker.tsx`, `comparison-specs.tsx` and `comparison-viewer.tsx`,
styled in `app/comparison.css`.

`tests/comparison.test.ts` covers discovery of every level, category
inheritance, combined filters, entry pairs, every cross pair, framing
eligibility, own-only specifications and label-aligned rows.
`tests/comparison-framing.test.ts` covers both framing modes, invalid units,
pane containment at phone and wide aspects, shared orbit mapping, picking
through pane cameras, and real cross-system pairs through disassembly.
`scripts/comparison-smoke.mjs` drives the built app in headless Edge through
the picker, specifications, swap, scale modes, disassembly, responsive
layouts, keyboard focus and both motion preferences. Set
`COMPARISON_BASE_URL`, `COMPARISON_SCREENSHOTS` and optionally
`BROWSER_EXECUTABLE`.
