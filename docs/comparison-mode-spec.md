# Same-category comparison mode

Issue: [#8 Interactive comparison mode](https://github.com/Yoosseph/pc-anatomy/issues/8)

## Purpose

Let readers choose two genuinely comparable component models, view them with a
shared camera and disassembly timeline, and compare catalogue-backed
specifications without ranking either product.

## Eligibility and discovery

A level opts in with `comparisonGroup` in `lib/levels.ts`. A configured group
appears automatically once at least two levels opt in; adding another model to
an existing group requires no comparison-view change. A new group needs only a
specification-row schema because meaningful fields differ by component type.

Models in a group must use the same physical-unit or diagram scale. Broad
catalogue labels alone do not imply comparability: a case fan and liquid cooler,
for example, are both Cooling concepts but are not like-for-like products.

Current groups:

- Graphics cards: RTX 5090, RX 9070 XT, and Arc B580.
- Power supplies: TUF Gaming 850W Gold and 750W Bronze.
- Processors: Ryzen 9 9950X and Core Ultra 9 285K.
- Storage: 2.5-inch SATA SSD and M.2 NVMe SSD.

The SATA and NVMe builders use the same millimetre conversion, so their visible
size difference remains truthful. Motherboard comparison will appear when a
second comparable motherboard model opts in and a schema exists.

## Behaviour

- The entry action sits in Explore by scale and returns focus there on exit.
- Category changes choose the first valid pair, reset disassembly, and close
  the specification sheet.
- A model cannot be selected twice or outside its active group.
- Swapping sides reuses both built models and preserves the camera.
- At 700 CSS pixels and wider, one canvas renders two scissored panes. Narrower
  layouts render the selected A/B pane.
- Physical models retain relative scale; processor diagrams retain their shared
  authored diagram scale.
- Reduced-motion users jump directly to requested disassembly states.

## Specifications

Rows project existing catalogue values rather than duplicating product facts in
comparison state:

- GPU: architecture, GPU, memory, board power, interface, dimensions, exterior.
- PSU: format, output, efficiency, cabling, dimensions.
- CPU: architecture, cores/threads, clocks, cache, process, socket, power.
- Storage: architecture, protocol, interface, format, dimensions.

## Architecture

`comparison-state.ts` discovers eligible levels and owns group schemas and pure
state transitions. `comparison-scene.ts` coordinates the two models over the
shared `stage-runtime.ts` and `model-stage.ts` primitives also used by the normal
explorer. One renderer, scene, camera, controls pair, and animation loop are
created per active workbench and synchronously disposed on exit.

Automated tests cover discovery, valid transitions, complete catalogue-backed
rows, pane coordinates, common bounds, and truthful GPU and Storage scale.
Browser QA covers responsive rendering, switching, swapping, shared
disassembly, reduced motion, focus restoration, and repeated entry/exit.
