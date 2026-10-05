import { memo, type ReactNode } from 'react';
import type { SudokuCell, DigitDisplay } from '@sudobility/sudojo_lib';
import type { SolverHintStep } from '@sudobility/sudojo_types';
import SudokuCanvas from './SudokuCanvas';
import SudokuControls from './SudokuControls';
import type { SudokuControlsLabels } from './SudokuControls';
import HintPanel from './HintPanel';
import CompletionCelebration from './CompletionCelebration';
import GameTimer from './GameTimer';
import SudokuLayout from './SudokuLayout';
import { useSudokuLayout } from './SudokuLayoutContext';

export interface SudokuGameProps {
  // Board state
  cells: SudokuCell[];
  selectedIndex: number | null;
  isPencilMode?: boolean;
  isCompleted: boolean;
  /** Percent shown in the default header's progress badge. */
  progress?: number;
  canUndo?: boolean;
  autoPencilmarksEnabled?: boolean;

  // Board actions. Optional only for `readOnly` boards; a playable board
  // (`readOnly` false, controls shown) needs all of them.
  onCellSelect?: (index: number) => void;
  onInput?: (value: number) => void;
  onErase?: () => void;
  onUndo?: () => void;
  onTogglePencilMode?: () => void;
  onAutoPencilmarks?: () => void;

  /**
   * Read-only board: cell taps are ignored and the play controls are never
   * rendered (the hint panel still is). Default false.
   */
  readOnly?: boolean;

  // Hint state
  hint?: SolverHintStep | null;
  hintTitle?: string;
  hintText?: string;
  /** Optional pre-localized hint heading, forwarded to HintPanel's `heading` */
  hintHeading?: string;
  hintActionSummary?: string;
  hintTotalSteps?: number;
  hintStepLabel?: string;
  hintHasNext?: boolean;
  hintHasPrevious?: boolean;
  hintCanApply?: boolean;
  isHintLoading?: boolean;

  // Hint actions
  onHint?: () => void;
  onHintNext?: () => void;
  onHintPrevious?: () => void;
  onHintApply?: () => void;
  onHintDismiss?: () => void;

  // Hint access error — consumer renders their own access panel via this slot
  hintAccessPanel?: ReactNode;

  /**
   * Render the hint panel yourself (e.g. an app wrapper around HintPanel).
   * Called with `landscape` true for the landscape side column. When set, a
   * hint shows whenever `hint` is non-null, and `hintTitle`, `hintLabels` and
   * the `onHint{Next,Previous,Apply,Dismiss}` props are not needed.
   */
  renderHintPanel?: (landscape: boolean) => ReactNode;

  // Display settings
  showErrors?: boolean;
  showTimer?: boolean;
  isDarkMode?: boolean;
  digitDisplay?: DigitDisplay;

  // Timer
  elapsedRef?: React.RefObject<number>;
  isTimerRunning?: boolean;

  // Optional features
  onNewGame?: () => void;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
  /** Content between the timer and the progress badge in the default header. */
  headerCenter?: ReactNode;
  /**
   * Replaces the whole default header row (timer, `headerCenter`, progress).
   * Pass `null` for no header at all. Omitted (undefined): default header.
   */
  header?: ReactNode;
  /** Show the progress badge in the default header. Default true. */
  showProgress?: boolean;
  /** Content rendered right under the board (e.g. a level / source line). */
  belowBoard?: ReactNode;

  // Celebration
  showCelebration?: boolean;
  onCelebrationComplete?: () => void;

  // Completion message
  completionMessage?: ReactNode;

  // Controls visibility — extension hides number pad during play
  showControls?: boolean;
  /**
   * Once `isCompleted`, drop the controls / hint column entirely so the
   * completion message stands alone. Default false (controls stay, disabled).
   */
  hideControlsWhenCompleted?: boolean;

  /**
   * `'fixed'` (default): wraps itself in SudokuLayout, a `container-type: size`
   * box that needs a parent with a definite height; switches to landscape when
   * width >= 1.5 × height. `'auto'`: no size container and no measuring; always
   * the portrait stack at full width with natural height, for scrolling panels
   * (e.g. the extension side panel).
   */
  layout?: 'fixed' | 'auto';
  /**
   * Board sizing within the `'fixed'` layout. `'width'` (default): fixed
   * cq-based widths for the board and the landscape side column. `'fill'`:
   * sudojo_app's sizing: in landscape the board fills the row height and the
   * side column takes the remaining width (capped at
   * `calc(60cqh - 1.8rem - 3.2px)`). Ignored when `layout` is `'auto'`.
   */
  boardSizing?: 'width' | 'fill';

  // Localized labels — required when showControls is true
  controlsLabels?: SudokuControlsLabels;
  hintLabels?: {
    previous: string;
    next: string;
    apply: string;
    dismissAriaLabel: string;
  };

  // Aria label for the board canvas
  boardAriaLabel?: string;
}

const noop = () => {};

function SudokuGameInner({
  cells,
  selectedIndex,
  isPencilMode = false,
  isCompleted,
  progress = 0,
  canUndo = false,
  autoPencilmarksEnabled = false,
  onCellSelect,
  onInput,
  onErase,
  onUndo,
  onTogglePencilMode,
  onAutoPencilmarks,
  readOnly = false,
  hint,
  hintTitle,
  hintText,
  hintHeading,
  hintActionSummary,
  hintTotalSteps = 0,
  hintStepLabel,
  hintHasNext = false,
  hintHasPrevious = false,
  hintCanApply = false,
  isHintLoading = false,
  onHint,
  onHintNext,
  onHintPrevious,
  onHintApply,
  onHintDismiss,
  hintAccessPanel,
  renderHintPanel,
  showErrors = true,
  showTimer = true,
  isDarkMode = false,
  digitDisplay = 'numeric',
  elapsedRef,
  isTimerRunning = true,
  onNewGame,
  onCanvasRef,
  headerCenter,
  header: headerOverride,
  showProgress = true,
  belowBoard,
  showCelebration = false,
  onCelebrationComplete,
  completionMessage,
  showControls = true,
  hideControlsWhenCompleted = false,
  layout = 'fixed',
  boardSizing = 'width',
  controlsLabels,
  hintLabels,
  boardAriaLabel,
}: SudokuGameProps) {
  const { isLandscape: measuredLandscape } = useSudokuLayout();
  const isAuto = layout === 'auto';
  const isLandscape = !isAuto && measuredLandscape;
  const fill = !isAuto && boardSizing === 'fill';

  const canRenderBuiltInHintPanel =
    !!hintTitle && !!onHintNext && !!onHintPrevious && !!onHintApply && !!onHintDismiss && !!hintLabels;
  const hasHint = !!hint && (renderHintPanel ? true : !!hintTitle);

  const defaultHeader = (
    <div className="flex items-center justify-between w-full">
      {showTimer && elapsedRef && (
        <GameTimer elapsedRef={elapsedRef} isRunning={isTimerRunning && !isCompleted} />
      )}
      {headerCenter}
      {showProgress && (
        <div className="px-3 py-1.5 rounded-md bg-primary-50 dark:bg-primary-900/30">
          <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
            {progress}%
          </span>
        </div>
      )}
    </div>
  );
  const header = headerOverride !== undefined ? headerOverride : defaultHeader;

  const boardElement = (
    <SudokuCanvas
      board={cells}
      selectedIndex={selectedIndex}
      onCellSelect={readOnly || !onCellSelect ? noop : onCellSelect}
      showErrors={showErrors}
      hint={hint}
      isDarkMode={isDarkMode}
      digitDisplay={digitDisplay}
      onCanvasRef={onCanvasRef}
      className={
        fill
          ? 'w-full h-full min-w-0 min-h-0 max-w-full max-h-full aspect-square overflow-hidden'
          : 'w-full aspect-square'
      }
      boardAriaLabel={boardAriaLabel}
    />
  );

  const renderPanel = (landscape: boolean) => {
    if (!hasHint) return null;
    if (renderHintPanel) return renderHintPanel(landscape);
    if (!canRenderBuiltInHintPanel) return null;
    return (
      <HintPanel
        title={hintTitle!}
        text={hintText ?? ''}
        heading={hintHeading}
        actionSummary={hintActionSummary ?? ''}
        totalSteps={hintTotalSteps}
        hasNextStep={hintHasNext}
        hasPreviousStep={hintHasPrevious}
        canApply={hintCanApply}
        onNextStep={onHintNext!}
        onPreviousStep={onHintPrevious!}
        onApply={onHintApply!}
        onDismiss={onHintDismiss!}
        stepLabel={hintStepLabel}
        previousLabel={hintLabels!.previous}
        nextLabel={hintLabels!.next}
        applyLabel={hintLabels!.apply}
        dismissAriaLabel={hintLabels!.dismissAriaLabel}
        landscape={landscape}
      />
    );
  };

  const canShowControls = showControls && !readOnly && !!controlsLabels;
  const controlsProps = {
    onNumberInput: onInput ?? noop,
    onErase: onErase ?? noop,
    onUndo: onUndo ?? noop,
    onTogglePencil: onTogglePencilMode ?? noop,
    onAutoPencil: onAutoPencilmarks,
    isAutoPencilmarks: autoPencilmarksEnabled,
    onHint,
    onNewGame: onNewGame && !isCompleted ? onNewGame : undefined,
    isPencilMode,
    canUndo,
    isHintLoading,
    disabled: isCompleted,
    digitDisplay,
    labels: controlsLabels!,
  };

  const renderSideContent = (landscape: boolean) =>
    hasHint ? (
      <>
        {renderPanel(landscape)}
        {hintAccessPanel}
      </>
    ) : canShowControls ? (
      <SudokuControls {...controlsProps} landscape={landscape} />
    ) : null;

  const showSideColumn = !(hideControlsWhenCompleted && isCompleted);
  const celebration = (
    <CompletionCelebration show={showCelebration} onComplete={onCelebrationComplete} />
  );

  if (isAuto) {
    // Normal-flow stack for scrolling parents: no container queries.
    return (
      <>
        {celebration}
        <div className="w-full flex flex-col gap-2">
          {(header || completionMessage) && (
            <div className="w-full">
              {header}
              {completionMessage}
            </div>
          )}
          <div className="w-full aspect-square">{boardElement}</div>
          {belowBoard}
          {showSideColumn && <div className="w-full">{renderSideContent(false)}</div>}
        </div>
      </>
    );
  }

  if (isLandscape) {
    return (
      <>
        {celebration}
        <div className={fill ? 'h-full flex flex-col gap-2' : 'h-full flex flex-col items-start gap-2'}>
          <div className="flex-shrink-0" style={{ width: 'min(calc(100cqh - 3rem), 60cqw)' }}>
            {header}
            {completionMessage}
          </div>
          <div className="flex-1 min-h-0 flex gap-4">
            {fill ? (
              <div className="h-full min-h-0 min-w-0 max-h-full max-w-full aspect-square flex-shrink-0 overflow-hidden flex flex-col">
                {boardElement}
                {belowBoard}
              </div>
            ) : (
              <div
                className="flex-shrink-0"
                style={{
                  width: 'min(calc(100cqh - 3.5rem), 55cqw)',
                  ...(belowBoard ? {} : { aspectRatio: '1' }),
                }}
              >
                {belowBoard ? (
                  <>
                    <div style={{ aspectRatio: '1' }}>{boardElement}</div>
                    {belowBoard}
                  </>
                ) : (
                  boardElement
                )}
              </div>
            )}
            {showSideColumn &&
              (fill ? (
                <div
                  className="h-full overflow-hidden flex-1 min-w-0"
                  style={{ maxWidth: 'calc(60cqh - 1.8rem - 3.2px)' }}
                >
                  {renderSideContent(true)}
                </div>
              ) : (
                <div
                  className="h-full overflow-hidden"
                  style={{ width: 'min(calc(60cqh - 3.5rem), 33cqw)' }}
                >
                  {renderSideContent(true)}
                </div>
              ))}
          </div>
        </div>
      </>
    );
  }

  const portraitWidth = 'min(100cqw, calc(62cqh - 36px))';

  return (
    <>
      {celebration}
      <div className="h-full flex flex-col items-center gap-2">
        <div className="flex-shrink-0" style={{ width: portraitWidth }}>
          {header}
          {completionMessage}
        </div>
        <div
          className={
            fill
              ? 'flex-shrink-0 min-h-0 min-w-0 max-h-full max-w-full aspect-square overflow-hidden'
              : 'flex-shrink-0 aspect-square'
          }
          style={{ width: portraitWidth }}
        >
          {boardElement}
        </div>
        {belowBoard && (
          <div className="flex-shrink-0" style={{ width: portraitWidth }}>
            {belowBoard}
          </div>
        )}
        {showSideColumn && (
          <div className="flex-1 min-h-0 overflow-hidden" style={{ width: portraitWidth }}>
            {renderSideContent(false)}
          </div>
        )}
      </div>
    </>
  );
}

function SudokuGame(props: SudokuGameProps) {
  if (props.layout === 'auto') {
    return <SudokuGameInner {...props} />;
  }
  return (
    <SudokuLayout>
      <SudokuGameInner {...props} />
    </SudokuLayout>
  );
}

export default memo(SudokuGame);
