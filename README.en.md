# monopane

[中文](./README.md) | **English**

> Turn any code repository into a single "project documentation canvas" — database schema, project architecture, code flow, and runtime logic, all on one diagram.

[![CI](https://github.com/boommanpro/monopane/actions/workflows/ci.yml/badge.svg)](https://github.com/boommanpro/monopane/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/boommanpro/monopane/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/boommanpro/monopane/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](./package.json)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange.svg)](./pnpm-workspace.yaml)

monopane is a free-layout canvas app built on [FlowGram](https://flowgram.ai/). It breaks "understanding an unfamiliar repository" into four fixed areas, describes them with a stable JSON contract, and renders them as a canvas you can drag, zoom, and export. Together with the bundled parsing skill, an AI agent can read a codebase and produce that canvas directly.

## Live demo

| Entry  | URL                                           | Notes                                                                |
| ------ | --------------------------------------------- | -------------------------------------------------------------------- |
| Editor | https://boommanpro.github.io/monopane/        | Full editing: drag, connect, property forms, import/export, simulate |
| Viewer | https://boommanpro.github.io/monopane/viewer/ | Read-only, ideal to share as a project doc page                      |

Both open with a built-in sample (a fictional e-commerce repo). Use **Import canvas JSON** in the top-right toolbar to load your own.

## The four areas

The canvas is one free-form surface divided into four fixed areas, each hosted by a group container:

| Area                 | Question it answers                                       | Node types                                                | Edge kind     |
| -------------------- | --------------------------------------------------------- | --------------------------------------------------------- | ------------- |
| Database & relations | Which tables exist? Fields, keys, relations?              | `db-table`                                                | `db-relation` |
| Project architecture | What layers, and which module depends on which?           | `arch-component`                                          | `dependency`  |
| Code flow            | How does one core request/task travel?                    | `flow-start` / `flow-step` / `flow-end` / `flow-decision` | `flow`        |
| Runtime logic        | How does the process boot? What is the request lifecycle? | `flow-start` / `flow-step` / `flow-end`                   | `flow`        |

Area origins, the grid (460 column width / 380 row height), and per-area node caps are all pinned by the data contract, so every generated canvas can be validated by machine instead of "roughly eyeballed". Full rules: [docs/canvas-schema.md](./docs/canvas-schema.md) (Chinese).

## Features

### Canvas editing

- FlowGram free-layout: free dragging, multi-select, group containers, snapping guides, minimap navigation
- 8 node types, each with a property form in the side panel; edits apply instantly
- Full keyboard shortcuts: copy / paste / cut / delete / select all / group / collapse / zoom
- Content is persisted to `localStorage` as you edit; restore the built-in sample or clear the canvas at any time

### Export

| Format          | Use case                                                                         |
| --------------- | -------------------------------------------------------------------------------- |
| JSON            | Full canvas file with `schemaVersion`; re-importable, and commit-friendly        |
| PNG             | Drop into reports, wikis, issues                                                 |
| Standalone HTML | **Single file** with JS / CSS / fonts all inlined — double-click to view offline |

The standalone HTML output references no external `script` or `link`, so it can be attached and shared as-is.

### Flow simulation

The play button in the toolbar walks the `flow` edges and highlights the execution path step by step. `flow-decision` nodes pick the `yes` / `no` outgoing edge according to their branch rules. Speeds: 0.5x / 1x / 2x. Useful to check whether the flow you drew actually holds together.

### The parsing skill

[.trae/skills/project-canvas-gen](./.trae/skills/project-canvas-gen/SKILL.md) turns "read a repo → emit canvas JSON" into a repeatable procedure: scan DDL/ORM for tables, derive architecture from directory layers, trace one core path for the flow, then self-check with a script. Sample outputs live in [examples/](./examples):

- [monopane-canvas.json](./examples/monopane-canvas.json) — this repository itself
- [spring-boot-realworld-canvas.json](./examples/spring-boot-realworld-canvas.json) — a real Java + SQLite backend

## Getting started

### Requirements

- Node.js >= 20 (CI uses 22)
- pnpm (version pinned by `packageManager` in the root `package.json`; `corepack enable` recommended)

### Install and run

```bash
git clone https://github.com/boommanpro/monopane.git
cd monopane
pnpm install
pnpm dev
```

`pnpm dev` first builds `@monopane/canvas` (the app depends on its types and runtime), then starts the editor dev server.

### Common commands

| Command                             | Purpose                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`                          | Build the canvas package and start the editor (`MODE=app` dev server)         |
| `pnpm build`                        | Build everything: viewer first, then editor, producing `dist` + `dist-viewer` |
| `pnpm typecheck`                    | `tsc --noEmit` across the workspace                                           |
| `pnpm lint` / `pnpm lint:fix`       | ESLint check / autofix                                                        |
| `pnpm format` / `pnpm format:check` | Prettier write / check                                                        |
| `pnpm test` / `pnpm test:watch`     | Vitest once / in watch mode                                                   |
| `pnpm changeset`                    | Record a version change                                                       |
| `pnpm clean`                        | Remove all build artifacts                                                    |

> Standalone HTML export relies on `packages/app/public/viewer-template.html`, which is a build artifact and not committed. After a fresh clone, run `pnpm --filter @monopane/app build:viewer` once to generate it.

## Project structure

```text
monopane/
├── packages/
│   ├── canvas/                       @monopane/canvas — framework-agnostic domain layer
│   │   └── src/
│   │       ├── types.ts              node types, field flags, edge semantics
│   │       ├── document.ts           canvas document JSON shape
│   │       ├── constants.ts          area origins, grid, capacity caps
│   │       ├── validate.ts           structural validation, wrapping, serialization
│   │       ├── simulation.ts         branch selection for flow simulation
│   │       ├── default-canvas.ts     the built-in sample canvas
│   │       └── __tests__/            invariant assertions and examples/ regression
│   └── app/                          @monopane/app — React + FlowGram application
│       ├── src/
│       │   ├── app.tsx               editor entry
│       │   ├── app-viewer.tsx        viewer entry
│       │   ├── editor.tsx            editor component
│       │   ├── viewer.tsx            viewer component
│       │   ├── nodes/                registration and rendering of the 8 node types
│       │   ├── components/           node panel, sidebar, toolbars, note, group
│       │   ├── toolbar/              top toolbar and viewer tool strip
│       │   ├── export/               JSON / PNG / standalone HTML export
│       │   ├── simulation/           simulation state machine and hooks
│       │   ├── data/storage.ts       localStorage load and autosave
│       │   ├── plugins/              context menu, panel manager
│       │   └── shortcuts/            keyboard shortcuts
│       ├── scripts/                  standalone HTML template generation
│       └── rsbuild.config.ts         dual-entry build config
├── docs/
│   ├── canvas-schema.md              the data contract (single source of truth)
│   └── design/                       archived design docs
├── examples/                         real canvas samples produced by the skill
└── .trae/skills/project-canvas-gen/  the parsing skill and its self-check script
```

**Boundary rule**: anything reusable across surfaces (types, area constants, validation, simulation branches, the built-in sample) belongs in `packages/canvas`, which imports neither React nor `@flowgram.ai`. That keeps it usable from the browser, the skill, CI, and unit tests alike. Only rendering and interaction live in `packages/app`.

## Data contract

[docs/canvas-schema.md](./docs/canvas-schema.md) is the single authoritative contract: the skill emits against it, the app loads and renders by it, and the unit tests assert on it. Changing it requires updating:

1. types and logic under `packages/canvas/src/`;
2. layout assertions in `packages/canvas/src/__tests__/invariants.ts`;
3. deep checks in `.trae/skills/project-canvas-gen/scripts/validate-canvas.mjs`;
4. a changeset.

## Deploying to GitHub Pages

[deploy-pages.yml](./.github/workflows/deploy-pages.yml) builds and publishes dual-entry site on every push to `main`:

```text
https://<owner>.github.io/<repo>/          ← packages/app/dist        (editor)
https://<owner>.github.io/<repo>/viewer/   ← packages/app/dist-viewer (viewer)
```

The deployment prefix is injected via `ASSET_PREFIX=/<repo>/` (derived from the repository name in the workflow, so forks need no change). Before the first deployment, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

Reproduce the same output locally:

```bash
ASSET_PREFIX=/monopane/ pnpm --filter @monopane/app build:all
mkdir -p _site/viewer
cp -R packages/app/dist/. _site/
cp -R packages/app/dist-viewer/. _site/viewer/
touch _site/.nojekyll
```

## Tech stack

| Layer         | Choice                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Canvas engine | [`@flowgram.ai/free-layout-editor`](https://www.npmjs.com/package/@flowgram.ai/free-layout-editor) 1.0.15 plus official plugins |
| Frontend      | React 18, TypeScript 5, styled-components 5, Less                                                                               |
| UI components | [Semi Design](https://semi.design/) (`@douyinfe/semi-ui`)                                                                       |
| Build         | Rsbuild (Rspack), dual entry: `MODE=app` / `MODE=viewer`                                                                        |
| Domain layer  | Plain TypeScript, zero framework dependencies                                                                                   |
| Quality gates | Vitest, ESLint 9 (flat config), Prettier                                                                                        |
| Repo tooling  | pnpm workspaces + changesets                                                                                                    |
| CI / CD       | GitHub Actions (`ci.yml` + `deploy-pages.yml`)                                                                                  |

## Roadmap

- [ ] In-canvas search and node locating
- [ ] Auto-layout for the database area based on relations
- [ ] Load remote canvas JSON by URL in the viewer
- [ ] SVG export
- [ ] Broader language coverage in the skill (Node/TS, Python, Java, Go are deep-parsed today)

## Known limitations

- **Gesture interactions cannot be automated**: dragging nodes and dragging connections depend on `@use-gesture/react`, which is unreliable in headless browsers — verify manually;
- **The built-in sample does not fit on one screen**: the four areas are far apart and the minimum zoom is limited; use the minimap or zoom out to navigate;
- Canvas data lives in browser `localStorage` and does not sync across devices. Export JSON or standalone HTML for anything that matters.

## Contributing

Issues and PRs are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) (Chinese) and the [Code of Conduct](./CODE_OF_CONDUCT.md) first. Report security issues privately through a [Security Advisory](https://github.com/boommanpro/monopane/security/advisories/new).

## License

[MIT](./LICENSE). Parts of the scaffolding are derived from [FlowGram.AI](https://github.com/bytedance/flowgram.ai) (MIT); those files keep their original copyright notices.
