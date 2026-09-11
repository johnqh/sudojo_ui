# CLAUDE.md

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it.

This file provides context for AI assistants working on this codebase.

## Project Overview

`@sudobility/sudojo_ui` is the shared **web (React DOM)** Sudoku game UI for Sudojo: a canvas board
renderer with hint overlays, number pads, hint panel, timer, confetti, and a responsive
portrait/landscape layout.

- **Presentational only** — no data fetching, no game state, no i18n. Consumers own state (via
  `@sudobility/sudojo_lib` hooks such as `useSudoku`/`useHint`) and pass **pre-localized strings**
  in through `labels` / `*Label` props.
- ESM-only, compiled with plain `tsc` (no bundler). Ships `dist/` only. License BUSL-1.1.
- No README, tests, lint config, or Storybook exist in this repo.
- Component props reference: [docs/COMPONENTS.md](docs/COMPONENTS.md).

## Commands

Deps are installed with Bun in CI (`bun.lock` present); the repo also keeps a `package-lock.json`,
and both are rewritten by the release script. Either `bun run <x>` or `npm run <x>` works.

| Command | What it does | Verified |
|---------|--------------|----------|
| `bun install` | Install deps | not run |
| `bun run typecheck` | `tsc --noEmit` with `tsconfig.json` (strict + `noUnusedLocals/Parameters`) | ✅ `npm run typecheck` passes (tsc 5.9.3) |
| `bun run build` | `tsc -p tsconfig.build.json` → `dist/` (unused checks off, comments kept for `.d.ts` JSDoc) | ✅ same tsc invocation passes (emitted to a scratch `--outDir`) |
| `bun run build:watch` / `bun run dev` | Build in watch mode (`dev` is an alias) | not run |
| `bun run clean` | `rm -rf dist` | not run |
| `prepublishOnly` | `clean && build` (runs automatically on `npm publish`) | not run |

There is **no** `test`, `lint`, or `format` script. `typecheck` is the only gate (it is stricter
than `build`, so a clean build does not imply a clean typecheck).

## Release / Publish (document only — do not run)

1. `.github/workflows/ci-cd.yml` calls `johnqh/workflows/.github/workflows/unified-cicd.yml@main`
   on push/PR to `main` **and** `develop`: install (bun) → `typecheck` → lint/test (skipped, no
   scripts) → `build`. On a push to **either** branch it then runs `npm publish` if the
   `package.json` `version` is not already on npm.
2. Family release: `../sudojo_app/scripts/push_all.sh` (sources `../workflows/scripts/push_projects.sh`)
   upgrades `@sudobility/*` deps, bumps the version, commits
   (`chore: upgrade @sudobility deps and bump version to X`), pushes, and waits for npm before the
   next project. Order: `sudojo_types → sudojo_ocr → sudojo_api → sudojo_client → sudojo_lib →
   **sudojo_ui** → sudojo_app → sudojo_app_rn → sudojo_extension → sudojo_bot`.
3. Manual: `npm publish` (runs `prepublishOnly`).

## Exports (`src/index.ts`)

| Export | File | Purpose | Used by |
|--------|------|---------|---------|
| `SudokuCanvas` (memo) | `SudokuCanvas.tsx` | `<canvas>` 9×9 board: digits, pencilmarks, selection, hint areas/cells/links/groups | app, extension |
| `SudokuControls` + `SudokuControlsProps`, `SudokuControlsLabels` | `SudokuControls.tsx` | Play number pad + pencil/erase/undo/auto-pencil/new-game/hint (portrait 5-col, landscape 3-col) | app |
| `EntryControls` + `EntryControlsProps`, `EntryControlsLabels` | `EntryControls.tsx` | Puzzle-entry pad: 1–9, clue count, erase/clear/validate (17-clue minimum) | app, extension |
| `HintPanel` + `HintPanelProps` | `HintPanel.tsx` | Hint title/heading/text/action summary + Prev/Next/Apply/✕ | app, extension |
| `GameTimer` + `GameTimerProps` | `GameTimer.tsx` | Reads seconds from a ref, re-renders itself once per second | app |
| `CompletionCelebration` + `CompletionCelebrationProps` | `CompletionCelebration.tsx` | Fixed full-screen confetti (3 s), then `onComplete` | app, extension |
| `SudokuLayout` | `SudokuLayout.tsx` | Size container (`container-type: size`) + ResizeObserver → layout context | app |
| `SudokuLayoutContext`, `useSudokuLayout`, `SudokuLayoutContextValue` | `SudokuLayoutContext.ts` | `{ isLandscape, availableWidth, availableHeight }` | app (`useSudokuLayout`) |
| `SudokuGame` (memo) + `SudokuGameProps` | `SudokuGame.tsx` | Orchestrator: wraps itself in `SudokuLayout`, composes all of the above | no sibling currently |

No hooks other than `useSudokuLayout`. `SudokuCanvasProps` and `SudokuLayoutProps` are **not exported**
— use `React.ComponentProps<typeof SudokuCanvas>`.

## Directory Map

```
sudojo_ui/
├── src/
│   ├── index.ts                  # Public barrel — every export must be listed here
│   └── components/               # One component per file, default export
├── dist/                         # Build output (gitignored, published via "files")
├── tsconfig.json                 # Strict; used by typecheck
├── tsconfig.build.json           # Extends; relaxes unused checks, keeps comments
├── .github/workflows/ci-cd.yml   # Delegates to johnqh/workflows unified CI/CD
├── bun.lock, package-lock.json   # Both kept in sync by push_projects.sh
└── docs/COMPONENTS.md            # Props reference
```

## Dependencies

All runtime deps are **peers** (duplicated in devDependencies for local builds):

| Package | Kind | Used for |
|---------|------|----------|
| `@sudobility/sudojo_lib` `^0.0.192` | sibling | `presentBoard`, `getColorPalette`, `themeColorToCSS`, `sudokuColorToTheme`, `convertSolverLink`, `convertSolverCellGroup`, `computeSelectedDigitCells`, `displayDigit`, `formatTime`; types `SudokuCell`, `DigitDisplay` |
| `@sudobility/sudojo_types` `^1.2.67` | sibling | `SolverHintStep` (type-only import) |
| `@sudobility/components` `^5.3.17` | family | `Button`, `Text` (HintPanel, EntryControls) |
| `@sudobility/design` `^1.1.52` | family | Not imported; its Tailwind preset supplies the semantic color tokens |
| `@heroicons/react` `>=2`, `react`/`react-dom` `>=18` | external | Icons (SudokuControls), React |

`^0.0.x` pins to that **exact** patch, so every `sudojo_lib` release needs a matching peer bump here
(the release script does this). Consumers: `sudojo_app` and `sudojo_extension` (both `^0.0.46`).
`sudojo_app_rn` does **not** use this package.

## Platform & Styling

- **Web only.** Uses `<canvas>`, `ResizeObserver`, `window.devicePixelRatio`, CSS container queries
  (`cqw`/`cqh`), and Tailwind `className`s. Not React Native compatible.
- **No CSS is shipped.** Components use Tailwind classes that the consumer must generate. Both
  consumers' `tailwind.config.js` scan `'../sudojo_ui/src/**/*.{ts,tsx}'` (the sibling **checkout**, not
  `node_modules`) — new classes only appear in a consumer build if this repo is checked out next to it.
- DOM chrome uses `@sudobility/design` semantic tokens (`bg-primary/10`, `text-warning`,
  `bg-warning`, `text-warning-foreground`, `text-success`, `bg-muted`, `border-l-primary`), which flip
  light/dark via the consumer's CSS variables.
- The **canvas does not see CSS/Tailwind theme**: it uses `sudojo_lib`'s hard-coded Apple-style
  palette (`getColorPalette(isDarkMode)`); dark mode must be passed as the `isDarkMode` prop.
- Confetti colors in `CompletionCelebration` are intentional literal hex values.
- Digits can render as `numeric | kanji | emojis` via `digitDisplay` (`SudokuCanvas`, `SudokuControls`;
  `EntryControls` is always numeric).

## Hint Rendering Contract

Input is one `SolverHintStep` from `sudojo_types` (spec: `../sudojo_solver/docs/HINT.md`).
`convertHintStep()` in `SudokuCanvas.tsx` maps it to `sudojo_lib`'s `HintStep`: `row*9+column` indices,
`select`/`unselect` `"0"` → `null`, `add`/`remove`/`highlight` digit strings → `number[]`.

Draw order: background → cell fills (20% alpha while a hint is shown) → cell borders (30% alpha) →
house outlines (conflict hints only) → group fill (20% via `globalAlpha`) + 3px outline → digits/pencilmarks → group labels →
links (purple; weak = dashed 5/5) → 1px grid (box lines also 1px, darker color).

A step is a **conflict hint** if any link has `type: 'conflict'`: its `areas` are outlined (2px) and
conflict links are **not drawn** (orange source digits carry the meaning). This is intentional:
`draw()` filters them out, so `drawLinks` has no conflict style.

## Gotchas

- Every component needs a parent with a definite size. `SudokuLayout` is `flex-1 min-h-0` with
  `container-type: size`; `SudokuGame` widths use `cqw/cqh`, so a height-less parent collapses it.
  Landscape = `width >= 1.5 × height`.
- `useSudokuLayout()` outside `SudokuLayout` silently returns `{ isLandscape: false, 0, 0 }`.
- `SudokuCanvas` sizes itself to `min(containerWidth, containerHeight)`; passing `className` **replaces**
  the default `w-full aspect-square max-w-[500px] mx-auto`. Input is click-only (no keyboard handling).
- `SudokuCanvas` `onCanvasRef` is an effect dependency — pass a stable callback or it fires
  `null`→canvas on every render.
- `SudokuGame` renders `HintPanel` only when `hint`, `hintTitle`, `hintLabels` **and** all four
  `onHint{Next,Previous,Apply,Dismiss}` are set; `SudokuControls` only when `showControls` and
  `controlsLabels` are set. Missing props render nothing, with no error.
- `SudokuControls` renders an empty grid cell when `onAutoPencil` / `onNewGame` / `onHint` is omitted.
- `EntryControls` hard-codes the 17-clue minimum (label and Validate disabled below 17).
- `HintPanel.heading` (optional) and its `SudokuGame` pass-through `hintHeading` are newer than the
  published 0.0.46. `sudojo_app`'s `HintPanel` wrapper passes `heading`, so publish this package
  before that app change can build against npm.
- `sudojo_lib` palette colors are mostly 8-digit hex (`#AF52DEFF`; light `systemBackground` is
  `#FFFFFF`). Never build a translucent canvas color by appending an alpha suffix: canvas silently
  ignores an invalid color and keeps the previous `fillStyle`. Use `ctx.globalAlpha` inside
  `save()`/`restore()`.
- `CompletionCelebration` keeps `onComplete` in a ref, so an inline callback is fine. Its effect is
  keyed on `show` only: one 3 s run per `false → true`. `onComplete` fires once at the end; `show`
  turning false early (or unmount) cancels the run without calling it.

## Known Issues (unfixed)

- `SudokuGame.tsx:151-152` uses `primary-50/700/900/300` shades, and `EntryControls.tsx:50,57` uses
  `var(--color-bg-*)` / `var(--color-text-*)`. The `@sudobility/design` preset defines no numeric
  `primary` scale, and neither consumer appears to define those CSS variables.
- `ci-cd.yml` passes `npm-access: "restricted"` while `package.json` has `publishConfig.access: public`.

## Fixed, not yet published

Consumers on npm 0.0.46 still have these bugs until a new version is published:

- `SudokuCanvas` group fill was `color + '33'`, which is invalid for 8-digit palette hex. Canvas kept the
  previous `fillStyle`, so group cells were painted opaque `systemBackground`, hiding their hint fills.
- `CompletionCelebration` never fired `onComplete` and never stopped its 16 ms interval: the effect
  depended on its own `isAnimating`, so its cleanup cleared the 3 s timeout right after scheduling it.
- `drawLinks` had an unreachable red dashed conflict-link style; it was removed (rendering is unchanged).
