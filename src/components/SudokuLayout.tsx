import { useRef, useEffect, useState, type ReactNode } from 'react';
import { SudokuLayoutContext, type SudokuLayoutContextValue } from './SudokuLayoutContext';

interface SudokuLayoutProps {
  children: ReactNode;
}

export default function SudokuLayout({ children }: SudokuLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layoutCtx, setLayoutCtx] = useState<SudokuLayoutContextValue>({
    isLandscape: false,
    availableWidth: 0,
    availableHeight: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setLayoutCtx({
        isLandscape: width >= 1.5 * height,
        availableWidth: width,
        availableHeight: height,
      });
    };

    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <SudokuLayoutContext.Provider value={layoutCtx}>
      <div ref={containerRef} className="w-full flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </SudokuLayoutContext.Provider>
  );
}
