# DieDive — handoff for the next AI / engineer

Updated: 2026-09-10.

## Read this first: the current result is not accepted

The user stopped implementation to request this handoff. Their latest feedback is the controlling product direction:

> “You copied the UI From Human atlas this does not look like a good UI I want improvements and uniqueness, the GPU graphics quality is not good I want huge improvements, the components of the gpu arent many and these green things needs to be more defined.”

They want another AI, such as Claude, to continue the work. They also explicitly requested `git add`, commits, and pushes at suitable checkpoints.

**Do not present the current application as a finished or polished V1.** It is a functioning foundation with a rejected visual direction. The next work needs substantial interface redesign, much better GPU geometry/materials, more meaningful mechanical detail, and clearly differentiated architectural structures. Small color or spacing changes will not satisfy this feedback.

No Human Atlas code or meshes were copied, but the current screen composition follows the supplied reference far too closely: title at upper left, systems panel on the left, camera strip on the right, and a floating explode slider at the bottom. The user's objection concerns the resulting experience, not just code provenance.

## Product to build

**DieDive** — “Explore a modern GPU from the cooler down to its compute cores.”

An interactive, open-source, scientific GPU explorer. The 3D specimen should be the primary interface. One GPU is in scope: NVIDIA GeForce RTX 5090 / GB202 Blackwell.

The intended journey:

1. Open on a recognizable, compelling assembled graphics card.
2. Orbit, pan, zoom, hover, and select real component structures.
3. Progressively disassemble the cooler, board, package, memory, and power delivery.
4. Descend through GB202 → GPC → TPC → SM → execution and memory resources.
5. Inspect concise explanations, relationships, quantities, and sources.
6. Search globally and restore the complete card without getting lost.

The signature explosion must move from assembled hardware to orderly, inspectable component groups. At 100%, the visible pieces form a clean inventory rather than a random cloud. The interaction may retain that principle without retaining Human Atlas's UI layout.

Original constraints still relevant:

- Static web app; no backend, database, login, API key, or paid service required for exploration.
- Dark, restrained, premium scientific presentation. Avoid gaming RGB, excessive glow, dashboard-card clutter, or an educational slide-deck appearance.
- Original procedural/authored geometry is acceptable. A perfect downloaded model is not required.
- Repeated resources should use instancing/batching and remain selectable.
- Desktop first, but genuinely usable on phones and tablets.
- Document sources and uncertainty. Do not copy copyrighted architecture diagrams into the app.

## Repository and run commands

- Repository: <https://github.com/Yoosseph/gpu_anatomy>
- Branch used so far: `main`.
- Workspace on the original machine: `C:\Users\Yoseph\Desktop\personal_projects\gpu_anatomy`.
- Existing checkpoints:
  - `80d74ea`: initial interactive physical model and source provenance.
  - `d81f483`: architecture hierarchy, search, selection, inventory, and tests.
  - A subsequent handoff commit contains this document and baseline screenshots. Use `git log` for its hash.

```bash
npm ci
npm run dev
# http://127.0.0.1:5173/

npm test
npm run check
npm run lint
npm run build

npm run start -- --port 4173
# Production preview: http://127.0.0.1:4173/
```

Node >=22.13 is declared; development used Node 24.14.1 on Windows. `npm test` uses Node's native TypeScript stripping, not tsx. A tsx runner attempt failed under the Windows sandbox; the native Node runner passed.

The app is React 19 + strict TypeScript + Vite + direct Three.js, with Tailwind and generated shadcn/Base UI primitives. React Three Fiber is not used. The 3D engine is dynamically imported to split its bundle.

The initial Sites starter included Vinext, Cloudflare, and a large primitive catalog. The active app was changed to plain static Vite because it requires no server. `app/layout.tsx`, `next.config.ts`, and some dependencies are unused starter remnants, not the entry point. The package lock is committed. Do not mistake the presence of Vinext for the active architecture.

## Where the implementation lives

| File | Responsibility |
| --- | --- |
| `index.html` | Static document, metadata, entry script. |
| `app/main.tsx` | React root; imports global CSS. |
| `app/page.tsx` | Main interface and explorer state; search, layers, breadcrumbs, inspection, camera controls, scale switch, source dialog. |
| `app/viewer.tsx` | React bridge to the Three.js engine; async initialization, hover UI, loading/error state, disposal. |
| `app/globals.css` | Entire visual direction and responsive rules. Needs a deliberate redesign; currently contains many successive overrides. |
| `lib/manifest.ts` | Concept manifest, sources, categories, level paths, search, state types, search-selection transition. |
| `lib/models.ts` | Procedural hardware and logical geometry; meshes, instances, labels, per-piece metadata. Main target for graphics improvements. |
| `lib/scene.ts` | Renderer, lighting, orbit controls, picking, visibility, animation, camera fitting, isolation, cleanup. |
| `lib/layout.ts` | Deterministic normalized grid and explosion interpolation. |
| `tests/manifest.test.ts` | Six data/state/layout tests. |
| `SOURCES.md` | Research provenance and representation limitations. |
| `components/ui/` | Generated UI primitives. |

Some authored files are still densely formatted. A cleanup/refactor is warranted before substantial extension. Avoid treating the current component boundaries or CSS as final design decisions.

## What currently works

- Original procedural graphics card with two fans, frame, two fin arrays, vapor chamber representation, backplate, PCB, GPU package, memory, power components, PCIe edge, power connector, and display I/O.
- Orbit/pan/zoom through `OrbitControls`; tap versus drag picking uses a 5-pixel movement threshold.
- A 0–100 explode slider with staged physical separation, later logical resources, and a normalized inventory.
- Five view contexts: card, die, GPC, TPC, and SM.
- Search across concept names and aliases; selecting a result changes context, restores its layer, and opens details.
- Hover names, selection box/instance tint, details with sources, focus, isolate, hide, and parent links.
- Category and concept visibility controls, show/hide all, breadcrumbs, back action, and reset.
- Hardware/silicon switch and explicit logical-versus-physical notices.
- Keyboard slider operation and `/` to open search.
- Instanced repeated logical blocks, memory packages, power-stage blocks, and heatsink fins.
- Time-based camera/explosion damping and reduced-motion handling.
- WebGL initialization/context-loss messaging.

These are implementation facts, not an assertion that every interaction or layout is finished.

## What the counts actually mean

Do not use the displayed counts to imply high modeling fidelity:

- The default card has **52 selectable modeled hardware structures**.
- The card's fully expanded inventory has **233 structures**: those 52 hardware entries plus 11 logical GPC blocks and 170 logical SM blocks.
- The SM context has **154 entries**, including 128 CUDA blocks and grouped architectural resources.
- A fin array is a selectable assembly, not a separate selectable entity for each fin.
- Much of the apparent complexity comes from repeated boxes. It does not fulfill the user's request for a richly detailed GPU specimen.
- Sixteen memory packages and the modeled power/passive component counts are authored approximations. The app does not establish an exact Founders Edition PCB bill of materials or placement.

The “green things” are generic compute/GPC/SM/CUDA blocks. Labels and a few texture marks have been added, but the shapes remain crude rectangular abstractions. The user explicitly wants much greater definition and visual distinction.

## Major work needed next

### 1. Redesign the interface around DieDive

Develop a visibly original exploration system. Reconsider navigation, specimen framing, hierarchy, inspection, layers, and disassembly controls together. Do not preserve the current layout just because it functions. Maintain the useful interactions while changing the experience meaningfully. Keep the specimen dominant and readable during inspection.

### 2. Rebuild the physical GPU presentation

Current shortcomings include flat petal-like fan blades, simple rails and slabs, approximate exposed PCB, simplistic contacts/ports, repetitive fins, limited assembly detail, and fairly flat lighting. The result looks like a low-detail procedural construction rather than a convincing specimen.

Possible areas to develop: proper blade curvature and thickness, fan housings/hubs, believable shroud construction, mechanically plausible fin stacks and heat transport, connectors and their actual openings, mounting structures, fasteners, package/substrate detail, memory package markings, differentiated power stages/inductors/capacitors, and researched board structure. These are suggestions, not asserted facts about the Founders Edition.

Use source evidence to choose what to represent. Add meaningful components and inspectable assemblies, not arbitrary decorative objects to inflate a counter. Preserve clear approximate-geometry notices wherever detail is not sourced.

### 3. Make architecture understandable through form

GPC, TPC, SM, CUDA, Tensor, RT, scheduling, register, cache, and memory-interface structures need a clear visual hierarchy and distinct identities. Current pale-green blocks, broad bars, repeated stamp textures, and gold Tensor rectangles are insufficient.

Represent nesting, grouping, connections, boundaries, and scale transitions explicitly. Avoid implying that a logical block diagram is an exact physical die floorplan. More detailed schematic geometry is welcome; invented undocumented transistor-level layouts are not.

### 4. Improve explosion and camera behavior

The inventory currently scales every piece to a common maximum extent and packs it into equal cells. This is deterministic and nonoverlapping at the layout level but loses physical size relationships and produces rows of nearly identical tiles. Explore category-aware packing, retained assembly relationships, readable labels, and a more compelling transition.

Camera fitting is heuristic. Test it with all levels, isolation, arbitrary visibility, selection panels, extreme aspect ratios, and intermediate explosion values. Inventory mode currently forces a near-top camera above 85%, while the perspective/front/back controls remain enabled; fix that misleading affordance or make those controls work.

### 5. Complete engineering and product QA

Finish desktop and mobile testing, actual picking/drill-down, search after hiding layers, empty states, keyboard accessibility, touch input, and reset behavior. Add meaningful interaction regressions. Check concept-only search results such as the root card/die, which do not have matching rendered piece IDs in their contexts, so selection highlighting is not guaranteed.

Finish README, architecture documentation, contribution guidance, LICENSE, and a compelling demo after the product merits them. None of those should claim completion prematurely.

## Factual basis and accuracy rules

Primary reference:

<https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf>

NVIDIA whitepaper v1.1, printed pages 8–12 and 46–48:

| Configuration | GPC | TPC | SM | L2 |
| --- | ---: | ---: | ---: | ---: |
| RTX 5090 enabled configuration | 11 | 85 | 170 | 96 MB |
| Full GB202 design | 12 | 96 | 192 | 128 MB |

One full GPC contains eight TPCs. A TPC contains two SMs. The current GPC drill-down is explicitly a **representative full GPC**, not a map of which TPCs are enabled within each of the shipping card's eleven GPCs.

Per SM: 128 CUDA resources, four fifth-generation Tensor cores, one fourth-generation RT core, four texture units, 256 KB registers, and 128 KB combined L1/shared memory. RTX 5090 totals include 21,760 CUDA cores, 680 Tensor cores, and 170 RT cores.

Other references:

- <https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/>
- <https://www.nvidia.com/en-us/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/>
- Interaction inspiration only: <https://github.com/ashemag/human-atlas>

Preserve provenance and independently verify new technical details. The current physical board is not a faithful Founders Edition layout. No credible teardown-derived exact layout has yet been implemented. Avoid mixing RTX GB202 details with datacenter Blackwell architectures.

## Verification completed and its limits

Last code checkpoint passed:

- `npm test`: six tests covering manifest identities/parent reciprocity/cycles, SKU counts, requested search aliases, search restoring hidden categories, grid nonoverlap across aspect ratios, and bounded monotonic stage interpolation.
- `npm run check`: strict TypeScript.
- `npm run lint`: authored code. Generated `components/ui/**` and `hooks/use-mobile.ts` are excluded because the starter itself triggered lint errors; this is not a whole-dependency audit.
- `npm run build`: successful static production build.

Browser checks used the Codex in-app browser against development and production previews. Observed: assembled render, keyboard explosion to 100%, a settled 233-entry inventory, Tensor search opening the SM/detail view, and triggering isolation. The isolation action changed UI state, but its final rendered result was not fully verified before the user's handoff request.

A 1440×900 desktop override and the browser's smaller default surface were inspected. **The requested tablet, 390×844, 320×568, and landscape-phone test matrix is not complete. Real touch/pinch testing is not complete. The entire click-through package→GPC→TPC→SM sequence is not verified.** Do not describe those as passing.

Development hot reload briefly produced stale module/hook errors during large edits; a fresh production preview loaded successfully. No comprehensive clean-run browser error audit has been finished.

Observed production scene counters: approximately 175 draw calls and 42,888 triangles for the card/inventory. This is not a measured frame-rate benchmark. Repeated PCIe contact geometry still costs avoidable draw calls. The renderer exposes `data-level`, `data-visible`, `data-explode`, `data-draw-calls`, and `data-triangles` on `.viewport` for diagnostics.

Last build sizes were about 410 KB application JavaScript + 611 KB lazy scene JavaScript + 192 KB CSS before compression; roughly 132 KB + 156 KB + 31 KB gzip. The large starter dependency set has not been rationalized. Installation reported 11 dependency advisories; no security audit/remediation was completed. Do not apply blind breaking upgrades without reviewing the actual dependency paths.

## Baseline screenshots

These document the current, rejected baseline; they are not target-quality examples:

- `docs/screenshots/desktop-assembled.png`
- `docs/screenshots/desktop-inventory.png`

The original four user-supplied screenshots show Human Atlas. Use them only to understand the desired assembled/exploded/inventory behavior. The latest feedback explicitly rejects copying their UI composition.

## Hosting and operational notes

`.openai/hosting.json` contains an already registered Sites project:

```json
{"project_id":"appgprj_6aa1e09f9f3c8191b741362d1ce34bc9","static":{"directory":"dist"}}
```

It is **not deployed**. No version was saved or published. Do not create a duplicate Sites project. Any short-lived credential from registration has expired and is not stored in the repository. GitHub pushes to the existing `origin` succeeded.

Static hosting is otherwise straightforward: `npm run build`, serve `dist/`. Keep future publishing distinct from claiming the visual work is accepted. The user's latest request was handoff and Git push, not publication.

At handoff, the app had been viewed at port 4173. Start or restart the commands above as needed; do not assume an earlier AI's terminal sessions survive. On the original Windows machine, npm network/cache operations and Git index writes required sandbox elevation. This is an environment permission issue, not an application requirement.

## Suggested starting point

Read this file and the latest user feedback, inspect the current app and screenshots, then establish a clearly different design and a concrete plan for a much better 3D specimen. Keep the working data/search/state foundation where useful, but do not let the existing UI or primitive geometry constrain the redesign. Demonstrate meaningful visual progress early, verify it in a real browser, and commit/push coherent checkpoints as requested.
