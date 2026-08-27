'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ColorPalette } from '@/lib/types';
import {
  Paintbrush,
  Eraser,
  PaintBucket,
  Minus,
  Plus,
  RotateCcw,
  Undo,
  Redo,
  Grid,
  Pipette,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  FlipHorizontal,
} from 'lucide-react';

interface KinarCanvasEditorProps {
  grid: number[][];
  palette: ColorPalette;
  activeStitchId: number;
  onGridChange: (newGrid: number[][]) => void;
  onSelectStitch: (id: number) => void;
  motifWidth?: number;
}

type ToolType = 'brush' | 'eraser' | 'fill' | 'line' | 'rect' | 'picker';

export const KinarCanvasEditor: React.FC<KinarCanvasEditorProps> = ({
  grid,
  palette,
  activeStitchId,
  onGridChange,
  onSelectStitch,
  motifWidth = 15,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [cellSize, setCellSize] = useState<number>(18);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [showMotifDividers, setShowMotifDividers] = useState<boolean>(true);
  const [hoverCoord, setHoverCoord] = useState<{ row: number; col: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<number[][][]>([]);
  const [redoStack, setRedoStack] = useState<number[][][]>([]);

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Push state to undo stack before making modifications
  const pushToHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-30), grid.map((r) => [...r])]);
    setRedoStack([]);
  }, [grid]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, grid.map((r) => [...r])]);
    setHistory((prev) => prev.slice(0, -1));
    onGridChange(previous);
  }, [history, grid, onGridChange]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, grid.map((r) => [...r])]);
    setRedoStack((prev) => prev.slice(0, -1));
    onGridChange(next);
  }, [redoStack, grid, onGridChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        e.preventDefault();
      } else if (e.key === 'b' || e.key === 'p') {
        setActiveTool('brush');
      } else if (e.key === 'e') {
        setActiveTool('eraser');
      } else if (e.key === 'g' || e.key === 'f') {
        setActiveTool('fill');
      } else if (e.key === 'i') {
        setActiveTool('picker');
      } else if (e.key >= '0' && e.key <= '9') {
        const num = Number(e.key);
        if (palette[num] !== undefined) {
          onSelectStitch(num);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, palette, onSelectStitch]);

  // Canvas redraw rendering effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = cols * cellSize;
    const height = rows * cellSize;

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Draw Cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const stitchId = grid[r]?.[c] ?? 0;
        const colorItem = palette[stitchId];
        const hex = colorItem?.hex || '#FFFFFF';

        ctx.fillStyle = hex;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

        // Special rendering for Jali / Open Stitch
        if (stitchId === 3 || colorItem?.name?.toLowerCase().includes('jali')) {
          ctx.strokeStyle = '#0284C7';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(c * cellSize, r * cellSize);
          ctx.lineTo((c + 1) * cellSize, (r + 1) * cellSize);
          ctx.moveTo((c + 1) * cellSize, r * cellSize);
          ctx.lineTo(c * cellSize, (r + 1) * cellSize);
          ctx.stroke();
        }
      }
    }

    // Draw Grid Lines
    if (showGridLines && cellSize >= 8) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;

      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellSize);
        ctx.lineTo(width, r * cellSize);
        ctx.stroke();
      }

      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, height);
        ctx.stroke();
      }
    }

    // Draw Motif Repeat Dividers (prominent vertical gold line every motifWidth columns)
    if (showMotifDividers && motifWidth > 0) {
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);

      for (let c = motifWidth; c < cols; c += motifWidth) {
        ctx.beginPath();
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Hover Highlight
    if (hoverCoord && hoverCoord.row >= 0 && hoverCoord.row < rows && hoverCoord.col >= 0 && hoverCoord.col < cols) {
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoverCoord.col * cellSize + 1,
        hoverCoord.row * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    }
  }, [grid, palette, cellSize, showGridLines, showMotifDividers, hoverCoord, rows, cols, motifWidth]);

  // Flood fill algorithm
  const floodFill = (startRow: number, startCol: number, targetStitch: number, fillStitch: number) => {
    if (targetStitch === fillStitch) return;
    const newGrid = grid.map((r) => [...r]);
    const queue: [number, number][] = [[startRow, startCol]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [r, c] = queue.pop()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      if (newGrid[r][c] !== targetStitch) continue;

      newGrid[r][c] = fillStitch;

      queue.push([r + 1, c]);
      queue.push([r - 1, c]);
      queue.push([r, c + 1]);
      queue.push([r, c - 1]);
    }

    pushToHistory();
    onGridChange(newGrid);
  };

  // Convert client pointer event to cell coords
  const getCellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): { row: number; col: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { row, col };
    }
    return null;
  };

  const applyToolAtCell = (row: number, col: number, isInitial = false) => {
    const currentVal = grid[row]?.[col];
    const targetValue = activeTool === 'eraser' ? 0 : activeStitchId;

    if (activeTool === 'picker') {
      if (currentVal !== undefined) {
        onSelectStitch(currentVal);
        setActiveTool('brush');
      }
      return;
    }

    if (activeTool === 'fill') {
      if (isInitial && currentVal !== undefined) {
        floodFill(row, col, currentVal, targetValue);
      }
      return;
    }

    if (activeTool === 'brush' || activeTool === 'eraser') {
      if (currentVal !== targetValue) {
        if (isInitial) pushToHistory();
        const newGrid = grid.map((r) => [...r]);
        newGrid[row][col] = targetValue;
        onGridChange(newGrid);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e);
    if (!cell) return;

    setIsDrawing(true);
    setDragStart(cell);
    applyToolAtCell(cell.row, cell.col, true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e);
    setHoverCoord(cell);

    if (isDrawing && cell) {
      if (activeTool === 'brush' || activeTool === 'eraser') {
        applyToolAtCell(cell.row, cell.col, false);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const cell = getCellFromEvent(e);

    if (cell && dragStart) {
      const targetValue = activeTool === 'eraser' ? 0 : activeStitchId;

      if (activeTool === 'line') {
        pushToHistory();
        const newGrid = grid.map((r) => [...r]);
        // Bresenham's line algorithm
        let x0 = dragStart.col;
        let y0 = dragStart.row;
        const x1 = cell.col;
        const y1 = cell.row;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
          if (y0 >= 0 && y0 < rows && x0 >= 0 && x0 < cols) {
            newGrid[y0][x0] = targetValue;
          }
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err;
          if (e2 > -dy) {
            err -= dy;
            x0 += sx;
          }
          if (e2 < dx) {
            err += dx;
            y0 += sy;
          }
        }
        onGridChange(newGrid);
      } else if (activeTool === 'rect') {
        pushToHistory();
        const newGrid = grid.map((r) => [...r]);
        const minR = Math.min(dragStart.row, cell.row);
        const maxR = Math.max(dragStart.row, cell.row);
        const minC = Math.min(dragStart.col, cell.col);
        const maxC = Math.max(dragStart.col, cell.col);

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            newGrid[r][c] = targetValue;
          }
        }
        onGridChange(newGrid);
      }
    }

    setIsDrawing(false);
    setDragStart(null);
  };

  // Shift / Transformations
  const shiftGrid = (dir: 'up' | 'down' | 'left' | 'right') => {
    pushToHistory();
    const newGrid: number[][] = [];

    if (dir === 'up') {
      for (let r = 1; r < rows; r++) newGrid.push([...grid[r]]);
      newGrid.push([...grid[0]]);
    } else if (dir === 'down') {
      newGrid.push([...grid[rows - 1]]);
      for (let r = 0; r < rows - 1; r++) newGrid.push([...grid[r]]);
    } else if (dir === 'left') {
      for (let r = 0; r < rows; r++) {
        const row = [...grid[r]];
        const first = row.shift()!;
        row.push(first);
        newGrid.push(row);
      }
    } else if (dir === 'right') {
      for (let r = 0; r < rows; r++) {
        const row = [...grid[r]];
        const last = row.pop()!;
        row.unshift(last);
        newGrid.push(row);
      }
    }
    onGridChange(newGrid);
  };

  const flipHorizontal = () => {
    pushToHistory();
    const newGrid = grid.map((row) => [...row].reverse());
    onGridChange(newGrid);
  };

  const clearGrid = () => {
    if (!window.confirm('Clear entire grid to White Base (0)?')) return;
    pushToHistory();
    const newGrid = Array(rows).fill(0).map(() => Array(cols).fill(0));
    onGridChange(newGrid);
  };

  return (
    <div className="bg-white rounded-xl border border-bohra-border p-4 shadow-sm flex flex-col gap-3">
      {/* Editor Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-bohra-border">
        {/* Left: Tools */}
        <div className="flex items-center gap-1 bg-bohra-paper p-1 rounded-lg border border-bohra-border">
          <button
            onClick={() => setActiveTool('brush')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
              activeTool === 'brush' ? 'bg-gold-500 text-white shadow-sm' : 'text-bohra-text hover:bg-white'
            }`}
            title="Brush (B) - Paint individual stitches"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Brush</span>
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
              activeTool === 'eraser' ? 'bg-gold-500 text-white shadow-sm' : 'text-bohra-text hover:bg-white'
            }`}
            title="Eraser (E) - Set to Base White stitch"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          <button
            onClick={() => setActiveTool('fill')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
              activeTool === 'fill' ? 'bg-gold-500 text-white shadow-sm' : 'text-bohra-text hover:bg-white'
            }`}
            title="Bucket Fill (F) - Flood fill contiguous color area"
          >
            <PaintBucket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fill</span>
          </button>

          <button
            onClick={() => setActiveTool('line')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
              activeTool === 'line' ? 'bg-gold-500 text-white shadow-sm' : 'text-bohra-text hover:bg-white'
            }`}
            title="Line - Click and drag to draw straight stitch line"
          >
            <Minus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Line</span>
          </button>

          <button
            onClick={() => setActiveTool('rect')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
              activeTool === 'rect' ? 'bg-gold-500 text-white shadow-sm' : 'text-bohra-text hover:bg-white'
            }`}
            title="Rectangle - Click and drag to fill block"
          >
            <div className="w-3.5 h-3.5 border border-current rounded-[1px]" />
            <span className="hidden sm:inline">Rect</span>
          </button>

          <button
            onClick={() => setActiveTool('picker')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
              activeTool === 'picker' ? 'bg-gold-500 text-white shadow-sm' : 'text-bohra-text hover:bg-white'
            }`}
            title="Eye-dropper (I) - Pick stitch color from grid"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Shift & Transformations */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-bohra-paper rounded-lg border border-bohra-border p-0.5 text-bohra-muted">
            <button
              onClick={() => shiftGrid('left')}
              className="p-1 hover:text-bohra-text hover:bg-white rounded"
              title="Shift Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => shiftGrid('right')}
              className="p-1 hover:text-bohra-text hover:bg-white rounded"
              title="Shift Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => shiftGrid('up')}
              className="p-1 hover:text-bohra-text hover:bg-white rounded"
              title="Shift Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => shiftGrid('down')}
              className="p-1 hover:text-bohra-text hover:bg-white rounded"
              title="Shift Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={flipHorizontal}
              className="p-1 hover:text-bohra-text hover:bg-white rounded"
              title="Flip Horizontal (Mirror Motif)"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: History & Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-bohra-paper rounded-lg border border-bohra-border p-0.5">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 text-bohra-text hover:bg-white disabled:opacity-30 rounded transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 text-bohra-text hover:bg-white disabled:opacity-30 rounded transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid Toggle & Dividers */}
          <button
            onClick={() => setShowGridLines(!showGridLines)}
            className={`p-1.5 rounded border transition-colors ${
              showGridLines ? 'bg-gold-50 border-gold-400 text-gold-700' : 'bg-white border-bohra-border text-bohra-muted'
            }`}
            title="Toggle Grid Lines"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-bohra-paper rounded-lg border border-bohra-border p-0.5 text-xs">
            <button
              onClick={() => setCellSize((s) => Math.max(6, s - 2))}
              className="p-1 hover:bg-white rounded text-bohra-text"
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-bohra-text font-semibold">
              {cellSize}px
            </span>
            <button
              onClick={() => setCellSize((s) => Math.min(36, s + 2))}
              className="p-1 hover:bg-white rounded text-bohra-text"
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={clearGrid}
            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
            title="Clear Grid"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full overflow-auto max-h-[580px] bg-bohra-paper/60 rounded-xl border border-bohra-border p-4 flex items-center justify-center relative cursor-crosshair select-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDrawing(false);
            setHoverCoord(null);
          }}
          className="shadow-md rounded border border-bohra-border transition-all"
        />
      </div>

      {/* Footer Info Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-bohra-muted pt-1">
        <div className="flex items-center gap-3">
          {hoverCoord ? (
            <span className="font-mono text-bohra-text bg-bohra-paper px-2 py-0.5 rounded border border-bohra-border flex items-center gap-2">
              <span>Row {hoverCoord.row + 1} / {rows}</span>
              <span>Col {hoverCoord.col + 1} / {cols}</span>
              <span className="text-gold-700 font-bold">
                [{palette[grid[hoverCoord.row]?.[hoverCoord.col]]?.name || 'Base'}]
              </span>
            </span>
          ) : (
            <span>Hover over stitch cells to inspect coordinates</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span>Tip: Gold dashed lines indicate motif repeat boundaries ({motifWidth} cols).</span>
        </div>
      </div>
    </div>
  );
};
