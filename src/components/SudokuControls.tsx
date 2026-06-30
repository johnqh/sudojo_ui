import { displayDigit } from '@sudobility/sudojo_lib';
import type { DigitDisplay } from '@sudobility/sudojo_lib';
import {
  PencilIcon,
  BackspaceIcon,
  ArrowUturnLeftIcon,
  SparklesIcon,
  LightBulbIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export interface SudokuControlsLabels {
  pencil: string;
  erase: string;
  undo: string;
  autoPencil: string;
  hint: string;
  hintLoading: string;
  newGame: string;
}

export interface SudokuControlsProps {
  onNumberInput: (value: number) => void;
  onErase: () => void;
  onUndo: () => void;
  onTogglePencil: () => void;
  onAutoPencil?: () => void;
  isAutoPencilmarks?: boolean;
  onHint?: () => void;
  onNewGame?: () => void;
  isPencilMode: boolean;
  canUndo: boolean;
  isHintLoading?: boolean;
  disabled?: boolean;
  digitDisplay?: DigitDisplay;
  landscape?: boolean;
  labels: SudokuControlsLabels;
}

export default function SudokuControls({
  onNumberInput,
  onErase,
  onUndo,
  onTogglePencil,
  onAutoPencil,
  isAutoPencilmarks = false,
  onHint,
  onNewGame,
  isPencilMode,
  canUndo,
  isHintLoading = false,
  disabled = false,
  digitDisplay = 'numeric',
  landscape = false,
  labels,
}: SudokuControlsProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const iconSize = landscape ? 'h-7 w-7' : 'h-5 w-5';
  const labelSize = landscape ? 'text-sm' : 'text-[10px]';
  const digitTextSize = landscape ? 'text-3xl' : 'text-xl';

  const cellBase =
    'aspect-square disabled:opacity-50 disabled:cursor-not-allowed transition-colors select-none';
  const digitCellClass = `${cellBase} ${digitTextSize} font-semibold bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/20${isPencilMode ? ' italic' : ''}`;
  const actionCellClass = `${cellBase} bg-warning/10 text-warning hover:bg-warning/20 active:bg-warning/20 flex items-center justify-center`;
  const actionActiveClass = 'bg-warning text-warning-foreground';

  if (landscape) {
    return (
      <div className="h-full flex flex-col justify-between">
        <div className="grid grid-cols-3 gap-2">
          {numbers.map(num => (
            <button
              key={num}
              onClick={() => onNumberInput(num)}
              disabled={disabled}
              className={digitCellClass}
            >
              {displayDigit(num, digitDisplay)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onTogglePencil}
            disabled={disabled}
            className={`${actionCellClass}${isPencilMode ? ` ${actionActiveClass}` : ''}`}
          >
            <span className="flex flex-col items-center gap-1">
              <PencilIcon className={iconSize} />
              <span className={`${labelSize} leading-tight`}>{labels.pencil}</span>
            </span>
          </button>
          <button onClick={onErase} disabled={disabled} className={actionCellClass}>
            <span className="flex flex-col items-center gap-1">
              <BackspaceIcon className={iconSize} />
              <span className={`${labelSize} leading-tight`}>{labels.erase}</span>
            </span>
          </button>
          <button onClick={onUndo} disabled={disabled || !canUndo} className={actionCellClass}>
            <span className="flex flex-col items-center gap-1">
              <ArrowUturnLeftIcon className={iconSize} />
              <span className={`${labelSize} leading-tight`}>{labels.undo}</span>
            </span>
          </button>
          {onAutoPencil ? (
            <button
              onClick={onAutoPencil}
              disabled={disabled}
              className={`${actionCellClass}${isAutoPencilmarks ? ` ${actionActiveClass}` : ''}`}
            >
              <span className="flex flex-col items-center gap-1">
                <SparklesIcon className={iconSize} />
                <span className={`${labelSize} leading-tight`}>{labels.autoPencil}</span>
              </span>
            </button>
          ) : (
            <div />
          )}
          {onNewGame ? (
            <button onClick={onNewGame} disabled={disabled} className={actionCellClass}>
              <span className="flex flex-col items-center gap-1">
                <ArrowPathIcon className={iconSize} />
                <span className={`${labelSize} leading-tight`}>{labels.newGame}</span>
              </span>
            </button>
          ) : (
            <div />
          )}
          {onHint ? (
            <button
              onClick={onHint}
              disabled={disabled || isHintLoading}
              className={actionCellClass}
            >
              <span className="flex flex-col items-center gap-1">
                <LightBulbIcon className={iconSize} />
                <span className={`${labelSize} leading-tight`}>
                  {isHintLoading ? labels.hintLoading : labels.hint}
                </span>
              </span>
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-5 gap-2">
      {[1, 2, 3].map(num => (
        <button
          key={num}
          onClick={() => onNumberInput(num)}
          disabled={disabled}
          className={digitCellClass}
        >
          {displayDigit(num, digitDisplay)}
        </button>
      ))}
      <button
        onClick={onTogglePencil}
        disabled={disabled}
        className={`${actionCellClass}${isPencilMode ? ` ${actionActiveClass}` : ''}`}
      >
        <span className="flex flex-col items-center gap-0.5">
          <PencilIcon className={iconSize} />
          <span className={`${labelSize} leading-tight`}>{labels.pencil}</span>
        </span>
      </button>
      <button onClick={onErase} disabled={disabled} className={actionCellClass}>
        <span className="flex flex-col items-center gap-0.5">
          <BackspaceIcon className={iconSize} />
          <span className={`${labelSize} leading-tight`}>{labels.erase}</span>
        </span>
      </button>
      {[4, 5, 6].map(num => (
        <button
          key={num}
          onClick={() => onNumberInput(num)}
          disabled={disabled}
          className={digitCellClass}
        >
          {displayDigit(num, digitDisplay)}
        </button>
      ))}
      <button onClick={onUndo} disabled={disabled || !canUndo} className={actionCellClass}>
        <span className="flex flex-col items-center gap-0.5">
          <ArrowUturnLeftIcon className={iconSize} />
          <span className={`${labelSize} leading-tight`}>{labels.undo}</span>
        </span>
      </button>
      {onAutoPencil ? (
        <button
          onClick={onAutoPencil}
          disabled={disabled}
          className={`${actionCellClass}${isAutoPencilmarks ? ` ${actionActiveClass}` : ''}`}
        >
          <span className="flex flex-col items-center gap-0.5">
            <SparklesIcon className={iconSize} />
            <span className={`${labelSize} leading-tight`}>{labels.autoPencil}</span>
          </span>
        </button>
      ) : (
        <div />
      )}
      {[7, 8, 9].map(num => (
        <button
          key={num}
          onClick={() => onNumberInput(num)}
          disabled={disabled}
          className={digitCellClass}
        >
          {displayDigit(num, digitDisplay)}
        </button>
      ))}
      {onNewGame ? (
        <button onClick={onNewGame} disabled={disabled} className={actionCellClass}>
          <span className="flex flex-col items-center gap-0.5">
            <ArrowPathIcon className={iconSize} />
            <span className={`${labelSize} leading-tight`}>{labels.newGame}</span>
          </span>
        </button>
      ) : (
        <div />
      )}
      {onHint ? (
        <button onClick={onHint} disabled={disabled || isHintLoading} className={actionCellClass}>
          <span className="flex flex-col items-center gap-0.5">
            <LightBulbIcon className={iconSize} />
            <span className={`${labelSize} leading-tight`}>
              {isHintLoading ? labels.hintLoading : labels.hint}
            </span>
          </span>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
