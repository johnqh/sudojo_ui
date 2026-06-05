import { createContext, useContext } from 'react';

export interface SudokuLayoutContextValue {
  isLandscape: boolean;
  availableWidth: number;
  availableHeight: number;
}

export const SudokuLayoutContext = createContext<SudokuLayoutContextValue>({
  isLandscape: false,
  availableWidth: 0,
  availableHeight: 0,
});

export function useSudokuLayout() {
  return useContext(SudokuLayoutContext);
}
