/**
 * Game Timer Component - Self-updating display of elapsed time
 *
 * Reads from an elapsedRef and updates its own display on a 1-second interval.
 * This keeps the re-render local to this component instead of propagating
 * up to the parent SudokuGame tree.
 */

import { useEffect, useState } from 'react';
import { formatTime } from '@sudobility/sudojo_lib';

export interface GameTimerProps {
  /** Ref holding current elapsed seconds */
  elapsedRef: React.RefObject<number>;
  /** Whether the timer is running */
  isRunning?: boolean;
}

export default function GameTimer({ elapsedRef, isRunning = true }: GameTimerProps) {
  const [displayTime, setDisplayTime] = useState('0:00');

  useEffect(() => {
    // Sync display on mount and when running state changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayTime(formatTime(elapsedRef.current ?? 0));

    if (!isRunning) return;

    const interval = setInterval(() => {
      setDisplayTime(formatTime(elapsedRef.current ?? 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, elapsedRef]);

  return (
    <div className="px-3 py-1.5 rounded-md bg-muted">
      <span className="text-sm font-semibold tabular-nums">{displayTime}</span>
    </div>
  );
}
