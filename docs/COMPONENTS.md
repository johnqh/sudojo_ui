# Component Reference

Props for every export in `src/index.ts`. **Bold** = required. All user-facing text comes in
pre-localized through props. Board indices are flat `row * 9 + column` (0–80).

## SudokuCanvas

`<canvas>` board renderer (memoized). Props type is not exported; use
`React.ComponentProps<typeof SudokuCanvas>`.

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| **board** | `SudokuCell[]` (sudojo_lib) | — | Must have 81 entries, otherwise nothing is drawn |
| **selectedIndex** | `number \| null` | — | Selected cell; also drives same-digit highlighting |
| **onCellSelect** | `(index) => void` | — | Called on click with the cell index |
| showErrors | `boolean` | `true` | Colors wrong inputs red |
| hint | `SolverHintStep \| null` (sudojo_types) | `null` | Current hint step overlay; dims normal highlights while set |
| isDarkMode | `boolean` | `false` | Selects the canvas palette (the canvas ignores CSS theme) |
| digitDisplay | `'numeric' \| 'kanji' \| 'emojis'` | `'numeric'` | |
| onCanvasRef | `(canvas \| null) => void` | — | Exposes the element (e.g. for screenshots); keep it stable |
| className | `string` | `w-full aspect-square max-w-[500px] mx-auto` | Replaces the default container classes |
| boardAriaLabel | `string` | — | `aria-label` on the canvas |

## SudokuControls

Play-mode pad. Portrait: 5-column grid (digits 1–3/4–6/7–9, each row followed by two actions).
Landscape: 3×3 digits above a 3×2 action grid.

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| **onNumberInput** | `(value) => void` | — | |
| **onErase**, **onUndo**, **onTogglePencil** | `() => void` | — | |
| **isPencilMode** | `boolean` | — | Highlights pencil button, italicizes digits |
| **canUndo** | `boolean` | — | Disables Undo when false |
| **labels** | `SudokuControlsLabels` | — | `pencil, erase, undo, autoPencil, hint, hintLoading, newGame` |
| onAutoPencil / onNewGame / onHint | `() => void` | — | Button is replaced by an empty cell when omitted |
| isAutoPencilmarks | `boolean` | `false` | Active style on the auto-pencil button |
| isHintLoading | `boolean` | `false` | Disables Hint, shows `labels.hintLoading` |
| disabled | `boolean` | `false` | Disables every button |
| digitDisplay | `DigitDisplay` | `'numeric'` | |
| landscape | `boolean` | `false` | |

## EntryControls

Puzzle-entry pad (enter a board, then validate).

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| **onNumberInput** | `(value) => void` | — | Digits are always numeric |
| **isValidating** | `boolean` | — | Disables Validate, shows `labels.validating` |
| **labels** | `EntryControlsLabels` | — | `clueCount(count) => string, minClues, pencilMode, eraseCell, clearBoard, validate, validating` |
| onErase / onClearBoard / onValidate / onTogglePencilMode | `() => void` | — | Button hidden when omitted |
| clueCount | `number` | `0` | `< 17` shows `labels.minClues` and disables Validate; `0` disables Clear |
| canEraseCell | `boolean` | `false` | Enables Erase |
| isPencilMode | `boolean` | `false` | |
| disabled | `boolean` | `false` | |

## HintPanel

| Prop | Type | Notes |
|------|------|-------|
| **title**, **text**, **actionSummary** | `string` | Technique name, step explanation, e.g. "Set R3C5 = 7" |
| heading | `string` | Optional line above `text` (hint-level heading) |
| **totalSteps** | `number` | Prev button and `stepLabel` only render when `> 1` |
| **hasNextStep**, **hasPreviousStep**, **canApply** | `boolean` | Shows Next while `hasNextStep`, otherwise Apply (disabled unless `canApply`) |
| **onNextStep**, **onPreviousStep**, **onApply**, **onDismiss** | `() => void` | |
| stepLabel | `string` | e.g. "Step 2 of 5" |
| **previousLabel**, **nextLabel**, **applyLabel**, **dismissAriaLabel** | `string` | |
| landscape | `boolean` | Default `false`; landscape drops the left accent border |

## GameTimer

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| **elapsedRef** | `RefObject<number>` | — | Seconds; read on a 1 s interval (the parent does not re-render) |
| isRunning | `boolean` | `true` | Stops the interval when false |

## CompletionCelebration

| Prop | Type | Notes |
|------|------|-------|
| **show** | `boolean` | `true` starts a 3 s, 50-particle `position: fixed` confetti overlay |
| onComplete | `() => void` | Fires once when the 3 s run ends (not if `show` turns false first or on unmount). An inline callback is fine |

## SudokuLayout / useSudokuLayout

`<SudokuLayout>{children}</SudokuLayout>` renders a `w-full flex-1 min-h-0 overflow-hidden` div with
`container-type: size` and provides `SudokuLayoutContext`:

```ts
interface SudokuLayoutContextValue {
  isLandscape: boolean;      // width >= 1.5 * height
  availableWidth: number;    // px, from ResizeObserver
  availableHeight: number;
}
```

Children can size with `cqw`/`cqh` units. `useSudokuLayout()` outside the provider returns
`{ isLandscape: false, availableWidth: 0, availableHeight: 0 }`.

## SudokuGame

Composes the components above inside its own `SudokuLayout`. Portrait: header, board, then
controls or hint panel. Landscape: board on the left, controls or hint panel on the right.

| Group | Props |
|-------|-------|
| Board state (**required**) | `cells`, `selectedIndex`, `isPencilMode`, `isCompleted`, `progress` (0–100, shown as `%`), `canUndo`, `autoPencilmarksEnabled` |
| Board actions (**required**) | `onCellSelect`, `onInput`, `onErase`, `onUndo`, `onTogglePencilMode`, `onAutoPencilmarks` |
| Hint state | `hint`, `hintTitle`, `hintText`, `hintHeading` (→ `HintPanel.heading`), `hintActionSummary`, `hintTotalSteps` (0), `hintStepLabel`, `hintHasNext`, `hintHasPrevious`, `hintCanApply`, `isHintLoading` (all `false` by default) |
| Hint actions | `onHint`, `onHintNext`, `onHintPrevious`, `onHintApply`, `onHintDismiss` |
| Slots | `hintAccessPanel` (rendered after the hint panel while a hint is active), `headerCenter`, `completionMessage` |
| Display | `showErrors` (true), `showTimer` (true), `isDarkMode` (false), `digitDisplay` ('numeric'), `boardAriaLabel` |
| Timer | `elapsedRef`, `isTimerRunning` (true; the timer also stops when `isCompleted`) |
| Other | `onNewGame` (hidden once completed), `onCanvasRef`, `showCelebration` (false), `onCelebrationComplete`, `showControls` (true) |
| Labels | `controlsLabels: SudokuControlsLabels`, `hintLabels: { previous, next, apply, dismissAriaLabel }` |

Rendering rules:
- A hint is active when `hint && hintTitle`. The hint panel then replaces the controls. It only renders
  if `hintLabels` and all four `onHint{Next,Previous,Apply,Dismiss}` are provided.
- Controls only render when `showControls && controlsLabels`.
- `hintHeading` is forwarded to both the portrait and landscape `HintPanel` as `heading`; when omitted
  the panel renders exactly as before.
