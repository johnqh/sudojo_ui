import { memo, type ReactNode } from 'react';
import type { SudokuCell, DigitDisplay } from '@sudobility/sudojo_lib';
import type { SolverHintStep } from '@sudobility/sudojo_types';
import { Card, CardContent, Text } from '@sudobility/components';
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
  isPencilMode: boolean;
  isCompleted: boolean;
  progress: number;
  canUndo: boolean;
  autoPencilmarksEnabled: boolean;

  // Board actions
  onCellSelect: (index: number) => void;
  onInput: (value: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onTogglePencilMode: () => void;
  onAutoPencilmarks: () => void;

  // Hint state
  hint?: SolverHintStep | null;
  hintTitle?: string;
  hintText?: string;
  hintActionSummary?: string;
  hintStepIndex?: number;
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
  headerCenter?: ReactNode;

  // Celebration
  showCelebration?: boolean;
  onCelebrationComplete?: () => void;

  // Completion message
  completionMessage?: ReactNode;

  // Controls visibility — extension hides number pad during play
  showControls?: boolean;

  // Localized labels
  controlsLabels?: SudokuControlsLabels;
  hintLabels?: {
    previous?: string;
    next?: string;
    apply?: string;
    dismissAriaLabel?: string;
  };
}

function SudokuGameInner({
  cells,
  selectedIndex,
  isPencilMode,
  isCompleted,
  progress,
  canUndo,
  autoPencilmarksEnabled,
  onCellSelect,
  onInput,
  onErase,
  onUndo,
  onTogglePencilMode,
  onAutoPencilmarks,
  hint,
  hintTitle,
  hintText,
  hintActionSummary,
  hintStepIndex = 0,
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
  showErrors = true,
  showTimer = true,
  isDarkMode = false,
  digitDisplay = 'numeric',
  elapsedRef,
  isTimerRunning = true,
  onNewGame,
  onCanvasRef,
  headerCenter,
  showCelebration = false,
  onCelebrationComplete,
  completionMessage,
  showControls = true,
  controlsLabels,
  hintLabels,
}: SudokuGameProps) {
  const { isLandscape } = useSudokuLayout();

  const hasHint = !!hint && !!hintTitle;

  const header = (
    <div className="flex items-center justify-between w-full">
      {showTimer && elapsedRef && (
        <GameTimer elapsedRef={elapsedRef} isRunning={isTimerRunning && !isCompleted} />
      )}
      {headerCenter}
      <div className="px-3 py-1.5 rounded-md bg-primary-50 dark:bg-primary-900/30">
        <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
          {progress}%
        </span>
      </div>
    </div>
  );

  const boardElement = (
    <SudokuCanvas
      board={cells}
      selectedIndex={selectedIndex}
      onCellSelect={onCellSelect}
      showErrors={showErrors}
      hint={hint}
      isDarkMode={isDarkMode}
      digitDisplay={digitDisplay}
      onCanvasRef={onCanvasRef}
      className="w-full aspect-square"
    />
  );

  const hintPanel = hasHint && onHintNext && onHintPrevious && onHintApply && onHintDismiss && (
    <HintPanel
      title={hintTitle!}
      text={hintText ?? ''}
      actionSummary={hintActionSummary ?? ''}
      stepIndex={hintStepIndex}
      totalSteps={hintTotalSteps}
      hasNextStep={hintHasNext}
      hasPreviousStep={hintHasPrevious}
      canApply={hintCanApply}
      onNextStep={onHintNext}
      onPreviousStep={onHintPrevious}
      onApply={onHintApply}
      onDismiss={onHintDismiss}
      stepLabel={hintStepLabel}
      previousLabel={hintLabels?.previous}
      nextLabel={hintLabels?.next}
      applyLabel={hintLabels?.apply}
      dismissAriaLabel={hintLabels?.dismissAriaLabel}
    />
  );

  const hintPanelLandscape =
    hasHint && onHintNext && onHintPrevious && onHintApply && onHintDismiss && (
      <HintPanel
        title={hintTitle!}
        text={hintText ?? ''}
        actionSummary={hintActionSummary ?? ''}
        stepIndex={hintStepIndex}
        totalSteps={hintTotalSteps}
        hasNextStep={hintHasNext}
        hasPreviousStep={hintHasPrevious}
        canApply={hintCanApply}
        onNextStep={onHintNext}
        onPreviousStep={onHintPrevious}
        onApply={onHintApply}
        onDismiss={onHintDismiss}
        stepLabel={hintStepLabel}
        previousLabel={hintLabels?.previous}
        nextLabel={hintLabels?.next}
        applyLabel={hintLabels?.apply}
        dismissAriaLabel={hintLabels?.dismissAriaLabel}
        landscape
      />
    );

  const controlsProps = {
    onNumberInput: onInput,
    onErase,
    onUndo,
    onTogglePencil: onTogglePencilMode,
    onAutoPencil: onAutoPencilmarks,
    isAutoPencilmarks: autoPencilmarksEnabled,
    onHint,
    onNewGame: onNewGame && !isCompleted ? onNewGame : undefined,
    isPencilMode,
    canUndo,
    isHintLoading,
    disabled: isCompleted,
    digitDisplay,
    labels: controlsLabels,
  };

  if (isLandscape) {
    return (
      <div className="h-full w-full overflow-hidden" style={{ containerType: 'size' }}>
        <CompletionCelebration show={showCelebration} onComplete={onCelebrationComplete} />
        <div className="h-full flex flex-col gap-2">
          <div className="flex-shrink-0" style={{ width: 'min(calc(100cqh - 3rem), 60cqw)' }}>
            {header}
            {completionMessage}
          </div>
          <div className="flex-1 min-h-0 flex gap-4">
            <div className="h-full aspect-square flex-shrink-0">{boardElement}</div>
            <div
              className="h-full overflow-hidden flex-1 min-w-0"
              style={{ maxWidth: 'calc(60cqh - 1.8rem - 3.2px)' }}
            >
              {hasHint ? (
                <>
                  {hintPanelLandscape}
                  {hintAccessPanel}
                </>
              ) : showControls ? (
                <SudokuControls {...controlsProps} landscape />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const portraitWidth = 'min(100cqw, calc(62cqh - 36px))';

  return (
    <div className="h-full w-full overflow-hidden" style={{ containerType: 'size' }}>
      <div className="h-full flex flex-col items-center gap-2">
        <CompletionCelebration show={showCelebration} onComplete={onCelebrationComplete} />
        <div className="flex-shrink-0" style={{ width: portraitWidth }}>
          {header}
          {completionMessage}
        </div>
        <div className="flex-shrink-0 aspect-square" style={{ width: portraitWidth }}>
          {boardElement}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden" style={{ width: portraitWidth }}>
          {hasHint ? (
            <>
              {hintPanel}
              {hintAccessPanel}
            </>
          ) : showControls ? (
            <SudokuControls {...controlsProps} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SudokuGame(props: SudokuGameProps) {
  return (
    <SudokuLayout>
      <SudokuGameInner {...props} />
    </SudokuLayout>
  );
}

export default memo(SudokuGame);
