import { memo, useRef, useEffect, useCallback, useMemo } from 'react';
import type { SudokuCell } from '@sudobility/sudojo_lib';
import type { SolverHintStep } from '@sudobility/sudojo_types';
import type { DigitDisplay } from '@sudobility/sudojo_lib';
import {
  presentBoard,
  themeColorToCSS,
  getColorPalette,
  computeSelectedDigitCells,
  convertSolverLink,
  convertSolverCellGroup,
  displayDigit,
  ThemeColor,
  SudokuColor,
  sudokuColorToTheme,
  type CellDisplayState,
  type DisplayLink,
  type DisplayCellGroup,
  type UIColorPalette,
} from '@sudobility/sudojo_lib';

interface SudokuCanvasProps {
  board: SudokuCell[];
  selectedIndex: number | null;
  onCellSelect: (index: number) => void;
  showErrors?: boolean;
  hint?: SolverHintStep | null;
  isDarkMode?: boolean;
  digitDisplay?: DigitDisplay;
  /** Callback to expose the canvas element for screenshot capture */
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
  /** Additional className for the container div */
  className?: string;
  /** Aria label for the board canvas */
  boardAriaLabel?: string;
}

/**
 * Convert SolverHintStep from solver client to display format
 * The solver client uses string actions, but the presenter expects numbers/arrays
 */
function convertHintStep(
  hint: SolverHintStep | null | undefined
): Parameters<typeof presentBoard>[0]['hintStep'] {
  if (!hint) return null;

  return {
    title: hint.title,
    text: hint.text,
    areas:
      hint.areas?.map(area => ({
        type: area.type,
        color: area.color as Parameters<typeof presentBoard>[0]['hintStep'] extends {
          areas?: infer A;
        }
          ? A extends Array<{ color: infer C }>
            ? C
            : never
          : never,
        index: area.index,
      })) ?? null,
    cells:
      hint.cells?.map(cell => ({
        index: cell.row * 9 + cell.column,
        color: cell.color as Parameters<typeof presentBoard>[0]['hintStep'] extends {
          cells?: infer C;
        }
          ? C extends Array<{ color: infer CO }>
            ? CO
            : never
          : never,
        fill: cell.fill,
        actions: cell.actions
          ? {
              // Matches Kotlin: select = if (select != 0) select else null
              select: cell.actions.select ? parseInt(cell.actions.select, 10) || null : null,
              unselect: cell.actions.unselect ? parseInt(cell.actions.unselect, 10) || null : null,
              add: cell.actions.add
                ? cell.actions.add
                    .split('')
                    .map(d => parseInt(d, 10))
                    .filter(n => !isNaN(n) && n !== 0)
                : null,
              remove: cell.actions.remove
                ? cell.actions.remove
                    .split('')
                    .map(d => parseInt(d, 10))
                    .filter(n => !isNaN(n) && n !== 0)
                : null,
              highlight: cell.actions.highlight
                ? cell.actions.highlight
                    .split('')
                    .map(d => parseInt(d, 10))
                    .filter(n => !isNaN(n) && n !== 0)
                : null,
            }
          : undefined,
      })) ?? null,
    digit: hint.digit ?? null,
    links: hint.links?.length ? hint.links.map(convertSolverLink) : null,
  };
}

/**
 * Convert solver links to display format
 */
function convertLinks(hint: SolverHintStep | null | undefined): DisplayLink[] | null {
  if (!hint?.links?.length) return null;
  return hint.links.map(convertSolverLink);
}

/**
 * Convert solver cell groups to display format
 */
function convertGroups(hint: SolverHintStep | null | undefined): DisplayCellGroup[] | null {
  if (!hint?.groups?.length) return null;
  return hint.groups.map(convertSolverCellGroup);
}

// =============================================================================
// Drawing Functions for Links and Cell Groups
// =============================================================================

/**
 * Draw chain links between cells
 * Strong links: solid lines, Weak links: dashed lines
 * Lines connect to digit positions (pencilmark position if candidate, cell center if main digit)
 */
function drawLinks(
  ctx: CanvasRenderingContext2D,
  links: DisplayLink[],
  displayStates: CellDisplayState[],
  cellSize: number,
  palette: UIColorPalette
): void {
  links.forEach(link => {
    const fromRow = Math.floor(link.fromIndex / 9);
    const fromCol = link.fromIndex % 9;
    const toRow = Math.floor(link.toIndex / 9);
    const toCol = link.toIndex % 9;

    const digit = link.digit;
    const pmRow = Math.floor((digit - 1) / 3);
    const pmCol = (digit - 1) % 3;

    const fromState = displayStates[link.fromIndex];
    const toState = displayStates[link.toIndex];

    // Start point: digit position or pencilmark position
    let startX: number, startY: number;
    if (fromState?.digit !== null) {
      // Cell has a main digit - connect to center
      startX = fromCol * cellSize + cellSize / 2;
      startY = fromRow * cellSize + cellSize / 2;
    } else {
      // Cell has pencilmarks - connect to specific pencilmark position
      startX = fromCol * cellSize + (pmCol + 0.5) * (cellSize / 3);
      startY = fromRow * cellSize + (pmRow + 0.5) * (cellSize / 3);
    }

    // End point: same logic
    let endX: number, endY: number;
    if (toState?.digit !== null) {
      endX = toCol * cellSize + cellSize / 2;
      endY = toRow * cellSize + cellSize / 2;
    } else {
      endX = toCol * cellSize + (pmCol + 0.5) * (cellSize / 3);
      endY = toRow * cellSize + (pmRow + 0.5) * (cellSize / 3);
    }

    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    if (link.type === 'conflict') {
      ctx.strokeStyle = palette.systemRed;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
    } else {
      ctx.strokeStyle = palette.systemPurple;
      ctx.lineWidth = 2;
      ctx.setLineDash(link.type === 'weak' ? [5, 5] : []);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

/**
 * Draw the outline border around a group of cells
 * Only draws edges where there's no adjacent cell in the group
 */
function drawGroupOutline(
  ctx: CanvasRenderingContext2D,
  cellIndices: number[],
  cellSize: number
): void {
  const cellSet = new Set(cellIndices);

  cellIndices.forEach(idx => {
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    const x = col * cellSize;
    const y = row * cellSize;

    // Top edge: draw if no cell above in group
    if (row === 0 || !cellSet.has((row - 1) * 9 + col)) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + cellSize, y);
      ctx.stroke();
    }
    // Bottom edge: draw if no cell below in group
    if (row === 8 || !cellSet.has((row + 1) * 9 + col)) {
      ctx.beginPath();
      ctx.moveTo(x, y + cellSize);
      ctx.lineTo(x + cellSize, y + cellSize);
      ctx.stroke();
    }
    // Left edge: draw if no cell to the left in group
    if (col === 0 || !cellSet.has(row * 9 + (col - 1))) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + cellSize);
      ctx.stroke();
    }
    // Right edge: draw if no cell to the right in group
    if (col === 8 || !cellSet.has(row * 9 + (col + 1))) {
      ctx.beginPath();
      ctx.moveTo(x + cellSize, y);
      ctx.lineTo(x + cellSize, y + cellSize);
      ctx.stroke();
    }
  });
}

/**
 * Draw cell group fills and outlines (drawn behind cell content)
 */
function drawCellGroupFills(
  ctx: CanvasRenderingContext2D,
  groups: DisplayCellGroup[],
  cellSize: number,
  palette: UIColorPalette,
  getColor: (themeColor: ThemeColor | null, fallback: string) => string
): void {
  groups.forEach(group => {
    const color = getColor(group.color, palette.systemPurple);

    // Semi-transparent fill (20% opacity)
    ctx.fillStyle = color + '33';
    group.cellIndices.forEach(idx => {
      const row = Math.floor(idx / 9);
      const col = idx % 9;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    });

    // Border outline
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    drawGroupOutline(ctx, group.cellIndices, cellSize);
  });
}

/**
 * Draw cell group labels (drawn on top of cell content)
 * Offsets labels vertically when multiple groups share the same anchor cell
 */
function drawCellGroupLabels(
  ctx: CanvasRenderingContext2D,
  groups: DisplayCellGroup[],
  cellSize: number,
  palette: UIColorPalette,
  getColor: (themeColor: ThemeColor | null, fallback: string) => string
): void {
  const fontSize = cellSize * 0.15;
  const padX = 3;
  const padY = 2;
  const labelHeight = fontSize + padY * 2;
  const maxLabelWidth = cellSize * 0.6;

  // Track how many labels have been placed at each anchor cell
  const anchorCounts: Record<number, number> = {};

  groups.forEach(group => {
    if (!group.name) return;

    const color = getColor(group.color, palette.systemPurple);
    const minIdx = Math.min(...group.cellIndices);
    const row = Math.floor(minIdx / 9);
    const col = minIdx % 9;

    // Offset for stacking multiple labels at the same anchor
    const stackIndex = anchorCounts[minIdx] ?? 0;
    anchorCounts[minIdx] = stackIndex + 1;

    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    const textWidth = Math.min(ctx.measureText(group.name).width, maxLabelWidth);

    const rectX = col * cellSize + 2;
    const rectY = row * cellSize + 2 + stackIndex * (labelHeight + 1);
    const rectW = textWidth + padX * 2;
    const rectH = labelHeight;
    const radius = 3;

    // Rounded rect background
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = palette.systemBackground;
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectW, rectH, radius);
    ctx.fill();
    ctx.restore();

    // Label text (clipped to max width)
    ctx.save();
    ctx.beginPath();
    ctx.rect(rectX, rectY, rectW, rectH);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(group.name, rectX + padX, rectY + padY);
    ctx.restore();
  });
}

/**
 * Draw border outlines around hint areas (rows/columns/blocks) for conflict hints
 */
function drawHouseBorders(
  ctx: CanvasRenderingContext2D,
  hint: SolverHintStep,
  cellSize: number,
  palette: UIColorPalette
): void {
  if (!hint.areas) return;

  hint.areas.forEach(area => {
    const color = themeColorToCSS(palette, sudokuColorToTheme(area.color as SudokuColor));
    if (!color) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    let x: number, y: number, w: number, h: number;
    if (area.type === 'row') {
      x = 0;
      y = area.index * cellSize;
      w = 9 * cellSize;
      h = cellSize;
    } else if (area.type === 'column') {
      x = area.index * cellSize;
      y = 0;
      w = cellSize;
      h = 9 * cellSize;
    } else {
      // block
      const blockRow = Math.floor(area.index / 3);
      const blockCol = area.index % 3;
      x = blockCol * 3 * cellSize;
      y = blockRow * 3 * cellSize;
      w = 3 * cellSize;
      h = 3 * cellSize;
    }

    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  });
}

function SudokuCanvas({
  board,
  selectedIndex,
  onCellSelect,
  showErrors = true,
  hint = null,
  isDarkMode = false,
  digitDisplay = 'numeric',
  onCanvasRef,
  className,
  boardAriaLabel,
}: SudokuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Report canvas element to parent for screenshot capture
  useEffect(() => {
    onCanvasRef?.(canvasRef.current);
    return () => onCanvasRef?.(null);
  }, [onCanvasRef]);

  // Get color palette
  const palette = useMemo(() => getColorPalette(isDarkMode), [isDarkMode]);

  // Convert hint to display format
  const displayHint = useMemo(() => convertHintStep(hint), [hint]);

  // Convert links and groups from hint
  const displayLinks = useMemo(() => convertLinks(hint), [hint]);
  const displayGroups = useMemo(() => convertGroups(hint), [hint]);

  // Detect conflict hint for visual treatment
  const isConflictHint = useMemo(
    () => displayLinks?.some(link => link.type === 'conflict') ?? false,
    [displayLinks]
  );

  // Compute selectedDigitCells - cells that have the same digit as selected cell
  // Only computed when selected cell has a given or correct input
  const selectedDigitCells = useMemo(() => {
    if (board.length !== 81) return null;
    return computeSelectedDigitCells(board, selectedIndex);
  }, [board, selectedIndex]);

  // Generate display states using the presenter
  const displayStates = useMemo(() => {
    if (board.length !== 81) return [];
    return presentBoard({
      cells: board,
      selectedIndex,
      showErrors,
      hintStep: displayHint,
      selectedDigitCells,
    });
  }, [board, selectedIndex, showErrors, displayHint, selectedDigitCells]);

  // Get CSS color from ThemeColor
  const getColor = useCallback(
    (themeColor: ThemeColor | null, fallback: string): string => {
      const color = themeColorToCSS(palette, themeColor);
      return color ?? fallback;
    },
    [palette]
  );

  // Draw the Sudoku board
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayStates.length !== 81) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use logical size (CSS pixels), not physical pixels
    // ctx.scale(dpr, dpr) is applied in ResizeObserver, so we draw in logical coordinates
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.width / dpr;
    const cellSize = size / 9;
    const boxSize = size / 3;

    // Grid colors
    const gridLightColor = palette.secondaryLabel;
    const gridDarkColor = palette.label;

    // Clear canvas
    ctx.fillStyle = palette.systemBackground;
    ctx.fillRect(0, 0, size, size);

    // Draw cell backgrounds and borders
    displayStates.forEach((state: CellDisplayState) => {
      const row = Math.floor(state.index / 9);
      const col = state.index % 9;
      const x = col * cellSize;
      const y = row * cellSize;

      // Cell background (semi-transparent when hints are active)
      const bgColor = getColor(state.backgroundColor, palette.systemBackground);
      if (bgColor !== palette.systemBackground) {
        ctx.save();
        if (hint) ctx.globalAlpha = 0.2;
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.restore();
      }

      // Cell border (if present, dialed down during hints)
      if (state.borderColor) {
        const borderColor = getColor(state.borderColor, '');
        if (borderColor) {
          ctx.save();
          if (hint) ctx.globalAlpha = 0.3;
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 1.5, y + 1.5, cellSize - 3, cellSize - 3);
          ctx.restore();
        }
      }
    });

    // Draw house borders for conflict hints
    if (isConflictHint && hint) {
      drawHouseBorders(ctx, hint, cellSize, palette);
    }

    // Draw cell group fills and outlines (behind cell content)
    if (displayGroups?.length) {
      drawCellGroupFills(ctx, displayGroups, cellSize, palette, getColor);
    }

    // Draw cell content (digits and pencilmarks, on top of group fills)
    displayStates.forEach((state: CellDisplayState) => {
      const row = Math.floor(state.index / 9);
      const col = state.index % 9;
      const x = col * cellSize;
      const y = row * cellSize;

      if (state.digit !== null) {
        // Draw digit
        const textColor = getColor(state.textColor, palette.label);
        ctx.fillStyle = textColor;
        ctx.font = state.isGiven
          ? `bold ${cellSize * 0.6}px system-ui, sans-serif`
          : `${cellSize * 0.6}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayDigit(state.digit, digitDisplay), x + cellSize / 2, y + cellSize / 2);
      } else if (state.pencilmarks.length > 0) {
        // Draw pencilmarks (small numbers in 3x3 grid)
        ctx.font = `${cellSize * 0.25}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        state.pencilmarks.forEach(pm => {
          const pmColor = getColor(pm.color, palette.secondaryLabel);
          ctx.fillStyle = pmColor;

          const markRow = Math.floor((pm.digit - 1) / 3);
          const markCol = (pm.digit - 1) % 3;
          const markX = x + (markCol + 0.5) * (cellSize / 3);
          const markY = y + (markRow + 0.5) * (cellSize / 3);
          ctx.fillText(displayDigit(pm.digit, digitDisplay), markX, markY);
        });
      }
    });

    // Conflict source cells are shown via colored digits — no circles needed

    // Draw cell group labels (on top of cell content so they're readable)
    if (displayGroups?.length) {
      drawCellGroupLabels(ctx, displayGroups, cellSize, palette, getColor);
    }

    // Draw links (on top of cells, behind grid lines) — skip conflict links
    if (displayLinks?.length) {
      const linksToRender = isConflictHint
        ? displayLinks.filter(link => link.type !== 'conflict')
        : displayLinks;
      if (linksToRender.length > 0) {
        drawLinks(ctx, linksToRender, displayStates, cellSize, palette);
      }
    }

    // Draw grid lines
    ctx.strokeStyle = gridLightColor;
    ctx.lineWidth = 1;

    // Thin lines for cells
    for (let i = 1; i < 9; i++) {
      if (i % 3 !== 0) {
        // Vertical
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, size);
        ctx.stroke();
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(size, i * cellSize);
        ctx.stroke();
      }
    }

    // Box dividers and outer border — all 1px
    ctx.strokeStyle = gridDarkColor;
    ctx.lineWidth = 1;

    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * boxSize, 0);
      ctx.lineTo(i * boxSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * boxSize);
      ctx.lineTo(size, i * boxSize);
      ctx.stroke();
    }

    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
  }, [
    displayStates,
    displayLinks,
    displayGroups,
    palette,
    getColor,
    digitDisplay,
    hint,
    isConflictHint,
  ]);

  // Keep a ref to the latest draw function so the ResizeObserver
  // can call it without being recreated every time draw changes.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  // Handle canvas resize — set up once, never recreated.
  // This avoids clearing the canvas (setting canvas.width clears it)
  // on every hint state change.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const size = Math.min(entry.contentRect.width, entry.contentRect.height);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
        drawRef.current();
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Redraw when dependencies change (hint highlights, cell state, etc.)
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle click/touch
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const cellSize = rect.width / 9;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < 9 && col >= 0 && col < 9) {
        const index = row * 9 + col;
        onCellSelect(index);
      }
    },
    [onCellSelect]
  );

  return (
    <div ref={containerRef} className={className ?? 'w-full aspect-square max-w-[500px] mx-auto'}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="touch-none cursor-pointer"
        aria-label={boardAriaLabel}
      />
    </div>
  );
}

export default memo(SudokuCanvas);
