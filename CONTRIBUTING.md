# Contributing to PC Anatomy

Thanks for taking an interest in PC Anatomy. Issues, corrections and focused
pull requests are all welcome, whether you are fixing a typo in a component
description or modelling a new scale.

## Finding something to work on

The [roadmap and Kanban board](https://github.com/users/Yoosseph/projects/1)
lists what is open. If you want to help but have nothing particular in mind,
the Backlog column holds suggestions and feedback waiting to be picked up.

For anything larger than a small fix, open an issue first and describe what you
plan to change. It saves you from building something that conflicts with work
already in progress or with a decision recorded in the architecture notes.

## Before you write code

Read [ARCHITECTURE.md](ARCHITECTURE.md) start to finish. It covers the scale
tree, where every module lives, the interfaces a geometry builder is handed, the
conventions that keep the models consistent, and the traps that are not obvious
from the source. The sections on
[adding a component](ARCHITECTURE.md#adding-a-component) and
[adding a scale](ARCHITECTURE.md#adding-a-scale) walk through each integration
point.

## Setting up

PC Anatomy requires Node.js 22.13 or newer.

```bash
git clone https://github.com/Yoosseph/pc-anatomy.git
cd pc-anatomy
npm install
npm run dev
```

## Ground rules

- **Geometry is code.** Every polygon is generated in TypeScript with three.js.
  Do not add imported models, image textures or other runtime asset files.
- **Cite technical claims.** Every claim points at an entry in `lib/sources.ts`,
  documented in [SOURCES.md](SOURCES.md). Name sources explicitly; if no honest
  reference exists, use `sources: []` rather than inheriting a default. See the
  [sourcing rules](ARCHITECTURE.md#sourcing-rules).
- **Keep physical and logical apart.** Physical models follow published
  dimensions; processor and GPU floorplans are explanatory diagrams of logical
  architecture, not mask layouts. Do not add detail that implies more precision
  than the source supports.
- **No reveal thresholds.** A component that exists in the assembled product
  exists at slider position zero and moves continuously as it comes apart.
- **Keep the docs true.** A change that moves a module, alters the scale tree or
  settles a design decision updates ARCHITECTURE.md in the same pull request.

## Checks

Run the full set locally before opening a pull request:

```bash
npm run check   # type check
npm run lint    # oxlint
npm test        # Node's built-in test runner
npm run build   # production build
```

Format with `npm run format`. GitHub Actions runs the same checks on every push
and pull request with Node.js 22.

## Pull requests

- Keep each pull request to one change. Refactors, features and fixes are
  easier to review separately.
- Write a short description of what changed and why. For visual changes,
  include a before and after screenshot.
- Update the tests when you add or rename components or scales; the manifest
  tests reject anonymous geometry, duplicate ids and broken parent links.
- If you used AI tools, that is fine, but you are responsible for checking that
  the code runs and that every claim is correct and cited.

## Reporting problems

Open an [issue](https://github.com/Yoosseph/pc-anatomy/issues) with what you
saw, what you expected, and your browser and operating system. For factual
errors in a component description, link the source that shows the correct
value.

## License

By contributing, you agree that your contributions are released under the
project's [MIT License](LICENSE).
