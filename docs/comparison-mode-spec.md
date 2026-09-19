# GPU comparison mode

Status: Draft for maintainer review  
Issue: [#8 Interactive comparison mode](https://github.com/Yoosseph/pc-anatomy/issues/8)  
Proposed owner: `@rheos`

## Summary

Add a comparison workbench for the three existing physical GPU models. A user
chooses two different cards, sees them at true relative scale in a split view,
orbits both with one camera, and drives both through the same disassembly
timeline. A comparison panel presents the cards' key published specifications.

The first release is intentionally GPU-only. It establishes a reusable
comparison architecture without making every scale and component family part of
the initial change.

## Why this belongs in PC Anatomy

The project already has three complete graphics-card models drawn at the same
millimetre scale. They can currently be explored only one at a time. Comparison
mode makes the existing work more useful by exposing differences in physical
size, cooler construction, interfaces, power, memory, and architecture without
requiring the reader to remember one card while navigating another.

## Goals

- Compare any two different cards from `card`, `rx9070`, and `arcb580`.
- Preserve the cards' real relative size. A smaller card must look smaller.
- Keep camera orientation, zoom, and disassembly progress synchronized.
- Use one WebGL renderer and one canvas.
- Reuse the current model builders, catalogue data, lighting, motion language,
  reduced-motion behaviour, and visual design.
- Remain usable on desktop, tablet, and phone.
- Keep ordinary exploration behaviour unchanged when comparison mode is off.

## Non-goals for version 1

- Comparing arbitrary components or logical chip diagrams.
- Comparing more than two cards.
- Comparing a card with itself.
- Independent cameras or independent disassembly timelines.
- Diving from a compared card into its GPU architecture.
- Per-part hiding, isolation, airflow, or detailed part inspection inside the
  comparison workbench.
- Adding new card models or new technical claims.
- URL persistence, sharing, ecommerce, pricing, or PC compatibility checks.
- Introducing React Three Fiber, imported models, or runtime asset downloads.

## User experience

### Entry and exit

- Add a labelled `Compare GPUs` action to the application chrome.
- Entering comparison mode opens with RTX 5090 on the left and RX 9070 XT on
  the right.
- A clear `Back to explorer` action restores the normal workbench. Leaving and
  returning may reset comparison state in version 1.

### Card selection

- Each pane has a native or Base UI select control listing the three cards.
- The card selected in the opposite pane is disabled.
- A central `Swap sides` action exchanges the two selections without changing
  camera position or explosion progress.
- Each pane is visibly labelled with product name and vendor/architecture.

### 3D interaction

- On screens at least 700 CSS pixels wide, the stage is divided into equal left
  and right viewports with a visible divider.
- Dragging, zooming, or panning in either viewport changes one shared camera, so
  both cards remain at the same angle and zoom.
- A single Auto button and slider drives both cards from assembled through
  dissection to inventory.
- Camera fitting uses the larger of the two posed bounds. Both panes therefore
  use the same camera distance and preserve relative physical scale.
- Hover labels identify pieces under the pointer within the correct pane.
- Reduced-motion users receive immediate slider changes and no automatic
  interpolation, matching the existing explorer.

### Specifications

- A `Specs` action opens a two-column comparison sheet.
- Rows in version 1: architecture, GPU, memory, board power, interface, physical
  dimensions, and exterior/reference design.
- Values come from the existing concept catalogue. Presentation aliases may
  normalize labels such as `Graphics power` and `Total board power`, but the
  values themselves must not be duplicated or rewritten.
- A differing value is emphasized visually without declaring a winner.
- Source and accuracy language remains available through the existing card
  catalogue rather than being copied into comparison-only content.

### Small screens

- Below 700 CSS pixels, render one card at a time and provide an accessible
  `Left` / `Right` segmented control. This is the version 1 mobile fallback.
- Camera orientation, zoom, and explosion progress remain shared when switching
  cards.
- The specifications sheet becomes a bottom sheet and remains independently
  scrollable.
- Do not create two WebGL contexts or render two full card models simultaneously
  on a phone merely to preserve the desktop layout.

## Rendering architecture

### Decision

Use one `WebGLRenderer`, one canvas, one `Scene`, and one shared
`PerspectiveCamera`/`OrbitControls` pair.

Both card models are attached to the scene at the same origin. On wide screens,
the renderer uses `setViewport` and `setScissor` to draw the left and right
halves. Only the model belonging to the active pane is visible during that
pane's render pass. On small screens, only the selected pane is rendered.

This design provides:

- one WebGL context and one environment map;
- a naturally synchronized camera;
- strict separation between panes even at full inventory spread;
- a common camera distance, preserving true relative scale;
- pane-aware raycasting without duplicating the application renderer.

Two independent canvases/renderers are explicitly rejected because they would
duplicate GPU contexts, environment setup, resize handling, animation loops,
and mobile fill-rate cost.

### Shared model-stage logic

The existing scene owns model posing, inventory placement, camera fitting,
animation collection, disposal, and pointer picking inside one large closure.
Comparison mode must not copy those algorithms into a second permanent
implementation.

Extract the smallest stable, testable primitives needed by both renderers, for
example:

- explosion/inventory pose calculation;
- model bounds at a given explosion value;
- animation collection and batch refresh;
- model resource disposal;
- pointer-to-pane normalized coordinates.

The ordinary `createViewer` public interface should remain unchanged unless a
small additive change is required. The comparison renderer should have its own
focused interface rather than extending `ExplorerState` with nullable fields
that ordinary exploration does not use.

### Proposed state

```ts
export type GpuComparisonLevel = 'card' | 'rx9070' | 'arcb580';

export type ComparisonSide = 'left' | 'right';

export type ComparisonState = {
  left: GpuComparisonLevel;
  right: GpuComparisonLevel;
  activeSide: ComparisonSide;
  explode: number;
  playing: boolean;
  specsOpen: boolean;
};
```

State transitions such as selection, swapping, and mobile-side switching should
be pure functions where practical and covered by unit tests. Invalid identical
card pairs must be rejected or automatically resolved at the state boundary,
not patched in the UI after render.

### Pane-aware picking

- Determine the pane from the pointer's CSS-pixel X coordinate.
- Convert the pointer into normalized device coordinates relative to that
  pane, not the full canvas.
- Raycast only against that pane's model root.
- Keep the existing mouse/touch aim tolerances and transparent-surface policy.
- Clear hover state when a selector changes, the layout switches between split
  and mobile modes, or the pointer crosses the divider.

### Resource lifetime

- Build each selected card once and rebuild only the side whose selection
  changes.
- Dispose a replaced model's geometries, materials, and generated textures.
- Dispose the second model and comparison-only controls when leaving comparison
  mode.
- Do not dispose shared environment resources until the comparison renderer is
  destroyed.

## Data mapping

Add a small comparison projection that maps a card level to its root concept
and the existing catalogue values used by the specs sheet. It may normalize
field names but should reference existing values.

The projection should fail tests if:

- a configured card level or root concept is missing;
- either selected level is not a physical GPU root;
- a required comparison row resolves to an empty value;
- a fourth GPU is later added without an explicit decision about comparison
  support.

## Accessibility

- `Compare GPUs`, `Back to explorer`, `Swap sides`, selectors, pane switcher,
  `Specs`, Auto, and the slider must all be keyboard reachable.
- Each viewport has an accessible name containing the selected card name.
- The visual divider is ignored by assistive technology.
- Selector changes and swaps announce the resulting pair through a polite live
  region.
- The shared slider's accessible value describes both cards.
- Respect `prefers-reduced-motion` exactly as the ordinary explorer does.
- Focus returns to `Compare GPUs` when the comparison workbench closes.

## Performance requirements

- One renderer, one canvas, one animation loop, and one WebGL context.
- Retain the current pixel-ratio caps: 2 on desktop and 1.5 on compact/coarse
  devices.
- Render two passes only in split mode. Render one pass in mobile switch mode.
- Preserve demand-driven rendering: do not run continuously when the camera,
  models, and authored animations are settled.
- Record comparison draw calls, triangles, current pair, and explosion amount
  on the host dataset for manual QA, following the existing viewer diagnostics.
- No new runtime network requests or asset files.

## Proposed file changes

Names may change during implementation, but responsibilities should remain
separated.

- `app/page.tsx`: lift application mode and switch between explorer and
  comparison workbenches.
- `app/explorer-workbench.tsx`: optional extraction of the current explorer
  composition so hooks are not called conditionally.
- `app/comparison-workbench.tsx`: comparison composition and responsive mode.
- `app/comparison-controls.tsx`: card selectors, labels, swap, specs, and exit.
- `app/comparison-viewer.tsx`: React bridge for the comparison engine.
- `app/comparison-specs.tsx`: two-column specification sheet.
- `app/workbench.css`: split stage, divider, selector chrome, sheet, and mobile
  switch layout.
- `lib/comparison-state.ts`: typed GPU list, pure transitions, and catalogue
  projection.
- `lib/comparison-scene.ts`: one-renderer scissored comparison engine.
- `lib/model-stage.ts`: only the shared scene/model primitives that can be
  extracted without weakening the existing viewer.
- `lib/scene.ts`: consume extracted primitives while preserving behaviour.
- `tests/comparison.test.ts`: state, projection, pane math, and bounds tests.
- `ARCHITECTURE.md`: document comparison mode, renderer ownership, and new
  module responsibilities.

## Acceptance criteria

1. A user can enter and exit GPU comparison mode without reloading.
2. The initial pair is RTX 5090 versus RX 9070 XT.
3. Any two different existing GPUs can be selected.
4. Selecting the same card on both sides is impossible.
5. Both cards respond to one shared camera and one shared disassembly value.
6. Physical size differences remain visually truthful at every disassembly
   position.
7. Wide screens show two isolated panes rendered by one canvas and renderer.
8. Screens below 700 CSS pixels show one switchable pane and retain state when
   switching sides.
9. The specs sheet shows all required rows using existing catalogue values.
10. Hover picking resolves against the correct pane.
11. Reduced-motion behaviour, context-loss handling, and cleanup work in both
    modes.
12. Normal exploration, diving, selection, airflow, hiding, and disassembly are
    unchanged outside comparison mode.
13. `npm run check`, `npm run lint`, `npm test`, and `npm run build` pass.
14. `ARCHITECTURE.md` describes the final implementation and any settled
    decisions that differ from this draft.

## Test plan

### Automated

- Comparison state initializes with a valid distinct pair.
- Selecting, swapping, and mobile-side switching preserve unrelated state.
- All three pair combinations resolve complete comparison rows.
- Card dimensions remain sourced from the existing catalogue.
- Pane coordinate conversion maps left/right edges and divider boundaries
  correctly.
- Common camera-fit bounds contain both posed models at 0, 50, and 100 percent.
- Existing model and GPU tests continue to pass after shared logic extraction.
- Type checking, lint, full tests, and production build pass in CI.

### Manual

- Desktop Chrome, Firefox, Safari, and Edge at common laptop dimensions.
- Tablet portrait and landscape.
- Phone portrait and short landscape, including coarse-pointer behaviour.
- Mouse orbit, wheel zoom, right-drag pan, touch rotate, and pinch zoom.
- Divider-boundary hovering and selection changes while a card is exploded.
- Repeatedly enter/exit comparison mode and change both cards while monitoring
  console errors and WebGL resource behaviour.
- Reduced motion and forced WebGL context loss.
- Compare dataset draw calls and triangle counts across all three pairs.

## Delivery sequence

1. Confirm this scope and UX with the maintainer.
2. Add pure comparison state/data projection and tests.
3. Extract the minimum shared model-stage primitives with all existing tests
   green.
4. Build the scissored comparison renderer and shared controls.
5. Add specification sheet and responsive/mobile behaviour.
6. Run cross-browser and performance QA, then update architecture docs.
7. Capture a short comparison demo for the pull request.

## Risks and mitigations

- **Regression in the existing viewer.** Keep extraction small, retain the
  current `createViewer` API, and run existing tests after each extraction.
- **False visual size comparison.** Use one camera projection and a common fit
  distance, never independently auto-fit each pane.
- **Full-inventory clipping.** Compute common bounds from both posed models at
  the current explosion value.
- **Pointer errors around the divider.** Keep pane coordinate conversion pure
  and unit tested.
- **Mobile GPU load.** Render only the active side below the breakpoint.
- **Resource leaks when changing cards.** Centralize model disposal and include
  repeated selector changes in manual QA.
- **Scope expansion into arbitrary comparison.** Keep the public type limited
  to the three physical GPU root levels in version 1.

## Maintainer decisions requested

1. Confirm GPU-only comparison for version 1.
2. Confirm one shared camera and shared disassembly timeline.
3. Confirm the mobile switcher instead of simultaneously rendering two panes.
4. Confirm that part inspection and dives remain in the normal explorer for
   version 1.
5. Confirm placement of the `Compare GPUs` entry action in the application
   chrome.

