'use client';

import React, { useState } from 'react';
import { scalePatternWidth, tileMotifMatrix } from '@/lib/scaling';
import { Ruler, Sparkles, Check, X, AlertCircle } from 'lucide-react';

interface SizeScalingModalProps {
  currentHeadSize: number;
  currentGauge: number;
  motifWidth: number;
  motifGrid: number[][];
  onApplyScaling: (result: {
    headSize: number;
    gauge: number;
    repeats: number;
    totalColumns: number;
    newGrid?: number[][];
  }) => void;
  onClose: () => void;
}

export const SizeScalingModal: React.FC<SizeScalingModalProps> = ({
  currentHeadSize,
  currentGauge,
  motifWidth,
  motifGrid,
  onApplyScaling,
  onClose,
}) => {
  const [headSize, setHeadSize] = useState<number>(currentHeadSize || 21.0);
  const [gauge, setGauge] = useState<number>(currentGauge || 10.0);
  const [customMotifWidth, setCustomMotifWidth] = useState<number>(motifWidth || 15);
  const [autoTileGrid, setAutoTileGrid] = useState<boolean>(true);

  const scaleResult = scalePatternWidth(headSize, gauge, customMotifWidth);

  const standardSizes = [
    { label: 'Child (Small)', size: 19.0 },
    { label: 'Child (Medium)', size: 20.0 },
    { label: 'Standard Adult', size: 21.0 },
    { label: 'Large Adult', size: 22.0 },
    { label: 'Extra Large', size: 23.0 },
  ];

  const handleApply = () => {
    let newGrid: number[][] | undefined = undefined;
    if (autoTileGrid && motifGrid.length > 0) {
      // Extract first base motif if grid is already tiled
      const singleMotif = motifGrid.map((row) =>
        row.slice(0, Math.min(customMotifWidth, row.length))
      );
      newGrid = tileMotifMatrix(singleMotif, scaleResult.repeats);
    }

    onApplyScaling({
      headSize,
      gauge,
      repeats: scaleResult.repeats,
      totalColumns: scaleResult.totalColumns,
      newGrid,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-bohra-border p-6 shadow-2xl max-w-lg w-full flex flex-col gap-5 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-bohra-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gold-50 border border-gold-200 rounded-xl">
              <Ruler className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-bohra-text">
                Bohra Topi Size Scaling Engine
              </h3>
              <p className="text-xs text-bohra-muted">
                Calculate exact motif repeats and stitch counts for precise head circumferences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-bohra-muted hover:text-bohra-text hover:bg-bohra-paper rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Size Buttons */}
        <div>
          <span className="text-xs font-semibold text-bohra-muted uppercase tracking-wider block mb-1.5">
            Quick Size Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {standardSizes.map((s) => (
              <button
                key={s.label}
                onClick={() => setHeadSize(s.size)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  headSize === s.size
                    ? 'bg-gold-500 text-white font-bold border-gold-600 shadow-sm'
                    : 'bg-bohra-paper text-bohra-text border-bohra-border hover:bg-gold-50'
                }`}
              >
                {s.label} ({s.size}&quot;)
              </button>
            ))}
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-bohra-text block mb-1">
              Target Head Size (in)
            </label>
            <input
              type="number"
              step="0.25"
              min="15"
              max="26"
              value={headSize}
              onChange={(e) => setHeadSize(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono font-bold px-3 py-2 border border-bohra-border rounded-lg bg-bohra-paper/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-bohra-text block mb-1">
              Gauge (sts / inch)
            </label>
            <input
              type="number"
              step="0.5"
              min="4"
              max="20"
              value={gauge}
              onChange={(e) => setGauge(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono font-bold px-3 py-2 border border-bohra-border rounded-lg bg-bohra-paper/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-bohra-text block mb-1">
              Base Motif Width (sts)
            </label>
            <input
              type="number"
              min="2"
              max="60"
              value={customMotifWidth}
              onChange={(e) => setCustomMotifWidth(parseInt(e.target.value) || 0)}
              className="w-full text-xs font-mono font-bold px-3 py-2 border border-bohra-border rounded-lg bg-bohra-paper/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
        </div>

        {/* Calculated Results */}
        <div className="bg-gold-50/70 border border-gold-200 rounded-xl p-4 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between font-bold text-bohra-text text-sm">
            <span>Calculated Output:</span>
            <span className="text-gold-700 font-mono text-base">
              {scaleResult.repeats} Repeats ({scaleResult.totalColumns} Total sts)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-white p-2 rounded border border-gold-200/60">
              <span className="text-bohra-muted block">Actual Fit Circumference:</span>
              <span className="font-bold text-bohra-text text-xs">
                {scaleResult.actualFitInches}&quot;
              </span>
            </div>
            <div className="bg-white p-2 rounded border border-gold-200/60">
              <span className="text-bohra-muted block">Size Variance:</span>
              <span
                className={`font-bold text-xs ${
                  Math.abs(scaleResult.varianceInches) <= 0.25
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                {scaleResult.varianceInches > 0 ? `+${scaleResult.varianceInches}` : scaleResult.varianceInches}&quot;
                {Math.abs(scaleResult.varianceInches) <= 0.25 ? ' (Excellent fit)' : ' (Slight variance)'}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-bohra-muted mt-1 font-mono">
            Formula: Target sts = {headSize}&quot; × {gauge} = {headSize * gauge} sts → Repeats = round({headSize * gauge} / {customMotifWidth}) = {scaleResult.repeats}
          </div>
        </div>

        {/* Auto-tile checkbox */}
        <label className="flex items-center gap-2 text-xs text-bohra-text cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoTileGrid}
            onChange={(e) => setAutoTileGrid(e.target.checked)}
            className="rounded border-bohra-border text-gold-600 focus:ring-gold-500"
          />
          <span>Automatically re-tile Kinar grid to {scaleResult.repeats} repeats ({scaleResult.totalColumns} columns)</span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-bohra-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-bohra-muted hover:text-bohra-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gold-600 hover:bg-gold-700 active:bg-gold-800 rounded-lg shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Scaled Size</span>
          </button>
        </div>
      </div>
    </div>
  );
};
