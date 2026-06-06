import { Button } from '@sudobility/components';

export interface EntryControlsLabels {
  clueCount: (count: number) => string;
  minClues: string;
  pencilMode: string;
  eraseCell: string;
  clearBoard: string;
  validate: string;
  validating: string;
}

export interface EntryControlsProps {
  onNumberInput: (value: number) => void;
  onErase?: () => void;
  onClearBoard?: () => void;
  onValidate?: () => void;
  isValidating: boolean;
  disabled?: boolean;
  clueCount?: number;
  canEraseCell?: boolean;
  isPencilMode?: boolean;
  onTogglePencilMode?: () => void;
  labels: EntryControlsLabels;
}

export default function EntryControls({
  onNumberInput,
  onErase,
  onClearBoard,
  onValidate,
  isValidating,
  disabled = false,
  clueCount = 0,
  canEraseCell = false,
  isPencilMode = false,
  onTogglePencilMode,
  labels,
}: EntryControlsProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-9 gap-1 sm:gap-2">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => onNumberInput(num)}
            disabled={disabled}
            className="aspect-square min-h-[44px] text-lg sm:text-xl font-semibold rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] active:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {num}
          </button>
        ))}
      </div>

      <div className="text-center text-sm text-[var(--color-text-secondary)]">
        {labels.clueCount(clueCount)} {clueCount < 17 && labels.minClues}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {onTogglePencilMode && (
          <Button
            variant={isPencilMode ? 'primary' : 'outline'}
            size="sm"
            onClick={onTogglePencilMode}
            disabled={disabled}
            className="flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            {labels.pencilMode}
          </Button>
        )}

        {onErase && (
          <Button variant="outline" size="sm" onClick={onErase} disabled={disabled || !canEraseCell}>
            {labels.eraseCell}
          </Button>
        )}

        {onClearBoard && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearBoard}
            disabled={disabled || clueCount === 0}
          >
            {labels.clearBoard}
          </Button>
        )}

        {onValidate && (
          <Button
            variant="primary"
            size="sm"
            onClick={onValidate}
            disabled={disabled || isValidating || clueCount < 17}
          >
            {isValidating ? labels.validating : labels.validate}
          </Button>
        )}
      </div>
    </div>
  );
}
