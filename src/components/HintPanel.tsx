import { Text, Button } from '@sudobility/components';

export interface HintPanelProps {
  /** Pre-localized hint title */
  title: string;
  /** Pre-localized hint explanation text */
  text: string;
  /** Pre-computed action summary (e.g., "Set R3C5 = 7") */
  actionSummary: string;
  totalSteps: number;
  hasNextStep: boolean;
  hasPreviousStep: boolean;
  canApply: boolean;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onApply: () => void;
  onDismiss: () => void;
  /** Label for step indicator, e.g. "Step 2 of 5" */
  stepLabel?: string;
  /** Label for Previous button */
  previousLabel: string;
  /** Label for Next button */
  nextLabel: string;
  /** Label for Apply button */
  applyLabel: string;
  /** Aria label for Dismiss button */
  dismissAriaLabel: string;
  landscape?: boolean;
}

export default function HintPanel({
  title,
  text,
  actionSummary,
  totalSteps,
  hasNextStep,
  hasPreviousStep,
  canApply,
  onNextStep,
  onPreviousStep,
  onApply,
  onDismiss,
  stepLabel,
  previousLabel,
  nextLabel,
  applyLabel,
  dismissAriaLabel,
  landscape = false,
}: HintPanelProps) {
  if (landscape) {
    return (
      <div className="h-full flex flex-col select-none p-1">
        <div className="flex justify-between items-start flex-shrink-0">
          <Text weight="semibold" className="text-primary">
            {title}
          </Text>
          <Button variant="ghost" size="sm" onClick={onDismiss} aria-label={dismissAriaLabel}>
            ✕
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 py-2">
          {totalSteps > 1 && stepLabel && (
            <Text size="xs" color="muted">
              {stepLabel}
            </Text>
          )}
          <Text size="sm" color="muted">
            {text}
          </Text>
          <Text size="xs" weight="medium" className="text-success">
            {actionSummary}
          </Text>
        </div>
        <div className="flex gap-2 pt-2 justify-end flex-shrink-0">
          {totalSteps > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousStep}
              disabled={!hasPreviousStep}
            >
              {previousLabel}
            </Button>
          )}
          {hasNextStep ? (
            <Button variant="outline" size="sm" onClick={onNextStep}>
              {nextLabel}
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={onApply} disabled={!canApply}>
              {applyLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col select-none border-l-4 border-l-primary pl-3 py-1">
      <div className="flex justify-between items-start flex-shrink-0">
        <Text size="sm" weight="semibold" className="text-primary">
          {title}
        </Text>
        <Button variant="ghost" size="sm" onClick={onDismiss} aria-label={dismissAriaLabel}>
          ✕
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 py-1">
        {totalSteps > 1 && stepLabel && (
          <Text size="xs" color="muted">
            {stepLabel}
          </Text>
        )}
        <Text size="sm" color="muted">
          {text}
        </Text>
        <Text size="xs" weight="medium" className="text-success">
          {actionSummary}
        </Text>
      </div>
      <div className="flex gap-2 pt-1 justify-end flex-shrink-0">
        {totalSteps > 1 && (
          <Button variant="outline" size="sm" onClick={onPreviousStep} disabled={!hasPreviousStep}>
            {previousLabel}
          </Button>
        )}
        {hasNextStep ? (
          <Button variant="outline" size="sm" onClick={onNextStep}>
            {nextLabel}
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={onApply} disabled={!canApply}>
            {applyLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
