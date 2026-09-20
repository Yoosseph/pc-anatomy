# Same-category comparison mode

Status: Implemented in pull request #17; awaiting maintainer review

Issue: [#8 Interactive comparison mode](https://github.com/Yoosseph/pc-anatomy/issues/8)

Owner: `@rheos`

## Summary

Add one reusable comparison workbench for existing models that are meaningfully
comparable within the same category. A reader selects a category, chooses two
different models, sees them in synchronized panes, drives both through one
disassembly timeline, and opens a category-specific specification table.

Version 1 supports the catalogue pairs the maintainer identified:

- Graphics cards: RTX 5090, RX 9070 XT, and Arc B580.
- Power supplies: TUF Gaming 850W Gold and 750W Bronze.
- Processors: Ryzen 9 9950X and Core Ultra 9 285K.

The motherboard category has only one model and therefore cannot form a pair.
Cross-category comparison remains a separate product decision.

## Goals

- Compare any two different configured models within one supported category.
- Use one workbench and renderer for every category, not category-specific
  copies.
- Preserve true relative scale where the source models share physical units.
- Preserve the deliberately shared diagram scale of the two processor models.
- Keep camera orientation, zoom, and disassembly progress synchronized.
- Reuse current model builders, catalogue data, disassembly controls, stage
  runtime, motion, picking, reduced-motion behavior, and visual design.
- Keep ordinary exploration unchanged when comparison mode is off.

## Non-goals

- Comparing models from different categories.
- Comparing categories whose existing builders use unrelated presentation
  scales, such as a case fan against a liquid cooler.
- Comparing more than two models or a model with itself.
- Independent cameras or disassembly timelines.
- Diving, hiding, isolation, airflow, or part inspection in comparison mode.
- Adding models, technical claims, pricing, or compatibility checking.
- Introducing React Three Fiber, imported models, or runtime asset downloads.

## User experience

### Entry and exit

- A labelled `Compare components` action sits with `Explore by scale`, where
  readers choose models. Its supporting copy names the supported categories.
- Entering opens Graphics cards with RTX 5090 on the left and RX 9070 XT on the
  right.
- `Back to explorer` restores normal exploration and focus returns to the entry
  action.

### Category and model selection

- A three-option category control switches among Graphics cards, Power
  supplies, and Processors.
- Switching categories selects that category's first valid pair, resets the
  shared disassembly value, and closes the specification sheet.
- Each pane has a native select listing only models in the active category.
- The model selected in the opposite pane is disabled.
- `Swap sides` exchanges the two models without rebuilding them or changing
  camera position.

### 3D interaction

- At 700 CSS pixels and wider, two isolated scissored panes share one camera
  and one `OrbitControls` pair.
- Below 700 pixels, one A/B pane is rendered at a time while camera and
  disassembly state are retained.
- A single Auto button and slider drives both models.
- Camera fitting uses the union of both posed bounds, so neither pane is
  normalized independently.
- Logical processor diagrams move to a top view as they reach inventory,
  matching normal exploration.
- Hover labels resolve only against the model in the pointer's pane.

### Specifications

Values are projected from existing catalogue concepts; comparison state does
not duplicate product facts.

- GPU: architecture, GPU, memory, board power, interface, dimensions, exterior.
- PSU: format, output, efficiency, cabling, dimensions.
- CPU: cores/threads, clocks, cache, process, socket, power.

Differing values are emphasized without ranking either model. Sources and
accuracy language remain available in the explorer.

## Architecture

### Category registry

`lib/comparison-state.ts` owns a typed registry. Each group declares its label,
eligible levels, root catalogue concepts, and specification rows. State
transitions validate category membership and prevent identical pairs. Adding a
future category should be a registry change plus tests, not a new workbench.

### Shared stage runtime

`lib/stage-runtime.ts` owns renderer, environment, lighting, camera,
`OrbitControls`, demand-driven frame scheduling, animated-object helpers,
camera fitting, context-loss reporting, and base disposal. Both the ordinary
explorer and comparison renderer compose this runtime.

`lib/model-stage.ts` owns scratch-backed model posing, inventory placement,
posed bounds, and model-resource disposal. Both renderers call these
primitives. React uses one `useDisassemblyPlayback` hook for automatic 0–100
playback in both modes.

### Comparison renderer

The comparison engine owns one `WebGLRenderer`, one canvas, one scene, and one
camera/control pair. Both roots sit at the same origin. Wide screens alternate
root visibility during left and right scissored render passes; compact screens
render only the active root.

Models are built through the existing `buildModel(level)` registry. A changed
side is disposed and rebuilt; swapping reuses both existing roots. Stage and
model resources are released synchronously when comparison mode exits.

### Scale policy

- The three graphics cards use the same millimetre conversion in
  `card-kit.ts`.
- Both power supplies use the same builder and millimetre conversion.
- Both processor floorplans are explicitly authored at the same diagram scale.

These guarantees make within-group visual comparisons meaningful. They do not
extend to arbitrary cross-category pairs because many other builders are
independently scaled to fill the ordinary explorer stage.

## Accessibility

- Entry, exit, categories, selectors, swap, A/B switch, specs, Auto, slider,
  phase stops, and reset are keyboard reachable.
- Each viewport's accessible name includes its selected model.
- Pair changes are announced through a polite live region.
- The shared slider describes both models and the active category.
- Reduced-motion users jump to the requested state without auto-animation.
- Focus returns to `Compare components` on exit.

## Performance and resource requirements

- One renderer, canvas, scene, animation loop, and WebGL context.
- Pixel-ratio caps remain 2 on desktop and 1.5 on compact/coarse devices.
- Two render passes only in split mode; one pass in compact mode.
- Demand-driven rendering stops after camera and authored animations settle.
- Dataset diagnostics record group, pair, mode, draw calls, triangles, visible
  parts, and disassembly amount.
- Replaced models and all stage resources are disposed without retained viewer
  trees or active WebGL contexts.

## Acceptance criteria

1. Comparison opens and closes without reloading.
2. GPU, PSU, and CPU groups each present every configured valid pair.
3. Models cannot be selected outside the active group or duplicated across
   both sides.
4. Category changes reset to a valid distinct pair.
5. Both panes share camera and disassembly state.
6. Physical or deliberately shared diagram scale remains truthful.
7. Desktop uses isolated scissored panes in one canvas.
8. Compact layouts use an accessible A/B switch and retain state.
9. Category-specific specs resolve entirely from the catalogue.
10. Pane-local hover picking, touch controls, reduced motion, context loss, and
    cleanup work in both modes.
11. Ordinary exploration behavior remains unchanged.
12. Type checking, linting, tests, and production build pass.

## Verification plan

Automated coverage validates group membership, distinct-pair transitions,
catalogue-backed rows for every configured model, pane coordinate conversion,
and common bounds for every group at assembled, dissection, and inventory
positions.

Manual QA covers desktop split view, compact A/B switching, category changes,
model selectors, swap, shared disassembly, category-specific specs, divider
picking, touch controls, reduced motion, repeated model replacement, and
repeated entry/exit resource cleanup.
